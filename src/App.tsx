import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  QrCode,
  Calendar,
  LogOut,
  LogIn,
  Plus,
  Database,
  ExternalLink,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  Layers,
  Scissors,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Business, Appointment, Service, Staff, BookingStats } from './types';
import { getSupabase, getStoredSupabaseConfig, clearSupabaseConfig } from './lib/supabase';
import { OnlineBookingSection } from './components/OnlineBookingSection';
import { AppointmentsManager } from './components/AppointmentsManager';
import { ServicesStaffManager } from './components/ServicesStaffManager';
import { CreateBusinessModal } from './components/CreateBusinessModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AuthModal } from './components/AuthModal';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { MissingTableNotice } from './components/MissingTableNotice';
import { isSuperAdmin, SUPER_ADMIN_EMAIL } from './utils/admin';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const [supabaseConfigured, setSupabaseConfigured] = useState(
    getStoredSupabaseConfig().isConfigured
  );
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateBusinessOpen, setIsCreateBusinessOpen] = useState(false);
  const [isTableMissing, setIsTableMissing] = useState(false);

  // Check development testing mode (?autostart=1 or ?admin=1)
  const isAutostart = typeof window !== 'undefined' && (
    window.location.search.includes('autostart=1') ||
    window.location.search.includes('test_mode=1') ||
    window.location.search.includes('admin=1')
  );

  const isAdminQuery = typeof window !== 'undefined' && window.location.search.includes('admin=1');

  // Auth state
  const [user, setUser] = useState<any>(
    isAutostart
      ? {
          id: isAdminQuery ? 'super-admin-01' : 'dev-user-001',
          email: isAdminQuery ? SUPER_ADMIN_EMAIL : 'owner@baba-alabi-salon.com',
        }
      : null
  );
  const [authLoading, setAuthLoading] = useState(!isAutostart);

  // Data states
  const [businesses, setBusinesses] = useState<Business[]>(
    isAutostart
      ? [
          {
            id: 'test-biz-01',
            user_id: 'dev-user-001',
            name: 'Baba Alabi Salon',
            slug: 'baba-alabi-salon',
            phone: '+1 (555) 234-5678',
            email: 'contact@baba-alabi.com',
            category: 'Salon & Spa',
            address: '14 Market Street, Downtown',
            is_approved: true,
            booking_enabled: true,
            auto_confirm: false,
            currency: 'USD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'test-biz-02',
            user_id: 'dev-user-002',
            name: 'Luxe Grooming & Barber',
            slug: 'luxe-grooming-barber',
            phone: '+1 (555) 987-6543',
            email: 'hello@luxegrooming.com',
            category: 'Barbershop',
            address: '88 Broad Avenue, Suite 10',
            is_approved: false, // Pending approval for admin demo
            booking_enabled: true,
            auto_confirm: false,
            currency: 'USD',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ]
      : []
  );
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    isAutostart ? 'test-biz-01' : null
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allPlatformAppointments, setAllPlatformAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>(
    isAutostart
      ? [
          {
            id: 'svc-1',
            business_id: 'test-biz-01',
            name: 'Signature Haircut & Styling',
            duration_minutes: 45,
            price: 35.0,
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'svc-2',
            business_id: 'test-biz-01',
            name: 'Beard Grooming & Hot Towel',
            duration_minutes: 30,
            price: 25.0,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ]
      : []
  );
  const [staff, setStaff] = useState<Staff[]>(
    isAutostart
      ? [
          {
            id: 'st-1',
            business_id: 'test-biz-01',
            name: 'Baba Alabi',
            role: 'Master Barber & Founder',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ]
      : []
  );
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'superadmin' | 'booking' | 'appointments' | 'services'>(
    isAdminQuery ? 'superadmin' : 'booking'
  );

  const userIsSuperAdmin = isSuperAdmin(user?.email);

  // Check public booking route (/book/:slug)
  const [publicSlug, setPublicSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/book\/([^/]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  // Verify Supabase Auth Session
  useEffect(() => {
    if (isAutostart) return;
    const supabase = getSupabase();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  // Load user's businesses (or all businesses if Super-Admin) from Supabase
  const loadBusinesses = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      if (!isAutostart) {
        setBusinesses([]);
      }
      return;
    }

    setLoadingData(true);
    try {
      const isSuper = isSuperAdmin(user.email);
      let query = supabase.from('businesses').select('*').order('created_at', { ascending: false });

      if (!isSuper) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        if (
          error.code === 'PGRST205' ||
          error.code === '42P01' ||
          error.message?.includes("Could not find the table 'public.businesses'") ||
          error.message?.includes('schema cache')
        ) {
          setIsTableMissing(true);
          return;
        }
        throw error;
      }

      setIsTableMissing(false);
      const loaded = (data as Business[]) || [];
      setBusinesses(loaded);

      // Select first if current is null or invalid
      if (loaded.length > 0) {
        if (!selectedBusinessId || !loaded.some((b) => b.id === selectedBusinessId)) {
          setSelectedBusinessId(loaded[0].id);
        }
      } else {
        setSelectedBusinessId(null);
      }
    } catch (err: any) {
      if (
        err?.code === 'PGRST205' ||
        err?.code === '42P01' ||
        err?.message?.includes('schema cache') ||
        err?.message?.includes("Could not find the table")
      ) {
        setIsTableMissing(true);
      } else {
        console.error('Error fetching businesses from Supabase:', err);
      }
    } finally {
      setLoadingData(false);
    }
  }, [user, selectedBusinessId, isAutostart]);

  // Load All Platform Appointments (for Super-Admin platform metrics & real-time oversight)
  const loadAllPlatformAppointments = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          setIsTableMissing(true);
          return;
        }
        throw error;
      }

      if (data) {
        setAllPlatformAppointments(data as Appointment[]);
      }
    } catch (err: any) {
      if (err?.code === 'PGRST205' || err?.message?.includes('schema cache')) {
        setIsTableMissing(true);
      } else {
        console.error('Error loading platform appointments for admin:', err);
      }
    }
  }, [user]);

  // When super-admin logs in, ensure superadmin tab is active & platform appointments load
  useEffect(() => {
    if (userIsSuperAdmin) {
      setActiveTab('superadmin');
      loadAllPlatformAppointments();
    }
  }, [userIsSuperAdmin, loadAllPlatformAppointments]);

  useEffect(() => {
    if (user) {
      loadBusinesses();
    } else {
      setBusinesses([]);
      setSelectedBusinessId(null);
      setAllPlatformAppointments([]);
    }
  }, [user, loadBusinesses]);

  const selectedBusiness = businesses.find((b) => b.id === selectedBusinessId) || null;

  // Load Appointments, Services, and Staff for selected business
  const loadBusinessDetails = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !selectedBusinessId) return;

    try {
      const [aptRes, svcRes, stRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('business_id', selectedBusinessId)
          .order('appointment_date', { ascending: false }),
        supabase
          .from('services')
          .select('*')
          .eq('business_id', selectedBusinessId)
          .order('name'),
        supabase
          .from('staff')
          .select('*')
          .eq('business_id', selectedBusinessId)
          .order('name'),
      ]);

      if (
        aptRes.error?.code === 'PGRST205' ||
        svcRes.error?.code === 'PGRST205' ||
        stRes.error?.code === 'PGRST205'
      ) {
        setIsTableMissing(true);
        return;
      }

      if (aptRes.data) setAppointments(aptRes.data as Appointment[]);
      if (svcRes.data) setServices(svcRes.data as Service[]);
      if (stRes.data) setStaff(stRes.data as Staff[]);
    } catch (err: any) {
      if (err?.code === 'PGRST205' || err?.message?.includes('schema cache')) {
        setIsTableMissing(true);
      } else {
        console.error('Error loading business details:', err);
      }
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    if (selectedBusinessId) {
      loadBusinessDetails();
    } else {
      setAppointments([]);
      setServices([]);
      setStaff([]);
    }
  }, [selectedBusinessId, loadBusinessDetails]);

  // Supabase Realtime Subscription for businesses & appointments
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;

    if (userIsSuperAdmin) {
      // Global Realtime subscription for super-admin across ALL platform businesses & appointments
      const channel = supabase
        .channel('super-admin-global-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'businesses',
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newBiz = payload.new as Business;
              setBusinesses((prev) => {
                if (prev.some((b) => b.id === newBiz.id)) return prev;
                return [newBiz, ...prev];
              });
              setSelectedBusinessId((prev) => prev || newBiz.id);
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Business;
              setBusinesses((prev) =>
                prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
              );
            } else if (payload.eventType === 'DELETE') {
              setBusinesses((prev) => prev.filter((b) => b.id !== (payload.old as any).id));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
          },
          () => {
            loadAllPlatformAppointments();
            if (selectedBusinessId) {
              loadBusinessDetails();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // Scoped Realtime subscription for business owner
      if (!selectedBusinessId) return;

      const channel = supabase
        .channel(`business-${selectedBusinessId}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'businesses',
            filter: `id=eq.${selectedBusinessId}`,
          },
          (payload) => {
            if (payload.eventType === 'UPDATE') {
              setBusinesses((prev) =>
                prev.map((b) => (b.id === payload.new.id ? { ...b, ...payload.new } : b))
              );
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `business_id=eq.${selectedBusinessId}`,
          },
          () => {
            loadBusinessDetails();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, userIsSuperAdmin, selectedBusinessId, loadAllPlatformAppointments, loadBusinessDetails]);

  // Calculate real database booking statistics
  const stats: BookingStats = {
    totalAppointments: appointments.length,
    confirmedAppointments: appointments.filter((a) => a.status === 'confirmed').length,
    pendingAppointments: appointments.filter((a) => a.status === 'pending').length,
    completedAppointments: appointments.filter((a) => a.status === 'completed').length,
    cancelledAppointments: appointments.filter((a) => a.status === 'cancelled').length,
    totalRevenue: appointments
      .filter((a) => a.status === 'confirmed' || a.status === 'completed')
      .reduce((sum, a) => sum + Number(a.price || 0), 0),
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setBusinesses([]);
    setSelectedBusinessId(null);
    setAllPlatformAppointments([]);
    setActiveTab('booking');
  };

  const handleBusinessUpdated = (updated: Business) => {
    setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleBusinessCreated = (newBiz: Business) => {
    setBusinesses((prev) => [newBiz, ...prev]);
    setSelectedBusinessId(newBiz.id);
  };

  // If public route `/book/:slug` was directly opened in browser
  if (publicSlug) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <QrCode className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              Phase 1 Public Route Architecture
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-1">Booking for /{publicSlug}</h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This URL is linked directly to the registered PostgreSQL business with booking slug{' '}
              <code className="text-indigo-300 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded">
                {publicSlug}
              </code>
              . Public customer appointment submission is scheduled for Phase 2.
            </p>
          </div>

          <button
            onClick={() => {
              window.history.pushState({}, '', '/');
              setPublicSlug(null);
            }}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">BizBook</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                  Supabase Realtime
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Online Booking URL & Real QR Code Management
              </p>
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3">
            {/* Supabase Connection Status Pill */}
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition ${
                supabaseConfigured
                  ? 'bg-slate-900 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {supabaseConfigured ? 'Supabase Connected' : 'Connect Supabase'}
              </span>
            </button>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2.5">
                {userIsSuperAdmin && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    <span>Super-Admin</span>
                  </span>
                )}
                <span className="text-xs text-slate-300 font-mono hidden md:inline truncate max-w-[170px]">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Owner Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Supabase Not Configured Banner */}
        {!supabaseConfigured && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Connect Your Supabase Project</h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  This application requires real Supabase PostgreSQL data and Row Level Security. Click below to enter your Supabase URL & Key and copy the SQL schema.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition active:scale-95 shrink-0"
            >
              Configure Supabase Now
            </button>
          </div>
        )}

        {/* Not Authenticated State */}
        {!user ? (
          <div className="text-center py-16 px-4 bg-slate-900/50 border border-slate-800 rounded-3xl max-w-2xl mx-auto space-y-6">
            <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Business Booking & QR Code Manager
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Multi-tenant online scheduling link generator and counter QR code signage for salons, spas, and service businesses.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-indigo-600/30 active:scale-95 transition inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In or Create Account with Supabase</span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Only authenticated business owners have permission to manage booking links and QR codes.
            </p>
          </div>
        ) : isTableMissing ? (
          <MissingTableNotice
            onRetry={() => {
              loadBusinesses();
              if (userIsSuperAdmin) loadAllPlatformAppointments();
            }}
            retrying={loadingData}
          />
        ) : userIsSuperAdmin ? (
          /* ==========================================================
             SUPER-ADMIN CONTROL CENTER VIEW (ALWAYS RENDERS FOR ADMIN)
             ========================================================== */
          <div className="space-y-6">
            {/* Top Toolbar: Multi-tenant Selector & Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              {/* Business Selector or Platform Summary */}
              <div className="flex items-center gap-3">
                {businesses.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedBusinessId || ''}
                      onChange={(e) => setSelectedBusinessId(e.target.value)}
                      className="bg-slate-900 border border-slate-750 text-white text-xs font-bold py-2.5 pl-3.5 pr-8 rounded-xl focus:outline-none focus:border-indigo-500 transition cursor-pointer appearance-none shadow-sm"
                    >
                      {businesses.map((biz) => (
                        <option key={biz.id} value={biz.id}>
                          {biz.name} ({biz.slug}) {biz.is_approved ? '✓ Approved' : '⏳ Pending'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                ) : (
                  <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>0 Businesses on Platform</span>
                  </div>
                )}

                <button
                  onClick={() => setIsCreateBusinessOpen(true)}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 transition text-xs font-semibold flex items-center gap-1.5"
                  title="Register new business"
                  aria-label="Register new business"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Register Business</span>
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
                <button
                  onClick={() => setActiveTab('superadmin')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === 'superadmin'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Super-Admin Command Center</span>
                </button>

                <button
                  onClick={() => setActiveTab('booking')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
                    activeTab === 'booking'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Online Booking & QR</span>
                </button>

                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
                    activeTab === 'appointments'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Appointments ({appointments.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('services')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
                    activeTab === 'services'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Services & Staff</span>
                </button>
              </div>
            </div>

            {/* Tab 0: SUPER-ADMIN DIRECTORY & PLATFORM OVERVIEW */}
            {activeTab === 'superadmin' && (
              <SuperAdminPanel
                businesses={businesses}
                appointments={allPlatformAppointments}
                onSelectBusiness={(id) => {
                  setSelectedBusinessId(id);
                  setActiveTab('booking');
                }}
                onBusinessUpdated={handleBusinessUpdated}
                onCreateBusiness={() => setIsCreateBusinessOpen(true)}
                onRefresh={() => {
                  loadBusinesses();
                  loadAllPlatformAppointments();
                }}
              />
            )}

            {/* Tab 1: MANDATORY ONLINE BOOKING & QR CODE */}
            {activeTab === 'booking' && (
              selectedBusiness ? (
                <OnlineBookingSection
                  business={selectedBusiness}
                  stats={stats}
                  services={services}
                  staff={staff}
                  onBusinessUpdated={handleBusinessUpdated}
                />
              ) : (
                <div className="text-center py-16 px-4 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
                  <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">No Business Selected</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Please register or select a business in the Super-Admin Command Center to view its booking URL and QR code signage.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('superadmin')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-md transition"
                    >
                      Go to Super-Admin Directory
                    </button>
                    <button
                      onClick={() => setIsCreateBusinessOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition"
                    >
                      Register Business
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Tab 2: APPOINTMENTS & REAL STATS */}
            {activeTab === 'appointments' && (
              selectedBusiness ? (
                <AppointmentsManager
                  business={selectedBusiness}
                  appointments={appointments}
                  services={services}
                  staff={staff}
                  onAppointmentsChange={loadBusinessDetails}
                />
              ) : (
                <div className="text-center py-16 px-4 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">No Business Selected</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Select a business to view and manage its appointments.
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Tab 3: SERVICES & STAFF DIRECTORY */}
            {activeTab === 'services' && (
              selectedBusiness ? (
                <ServicesStaffManager
                  business={selectedBusiness}
                  services={services}
                  staff={staff}
                  onDataChanged={loadBusinessDetails}
                />
              ) : (
                <div className="text-center py-16 px-4 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
                  <Scissors className="w-12 h-12 text-slate-600 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-white">No Business Selected</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Select a business to configure its services and staff roster.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        ) : businesses.length === 0 ? (
          /* Empty Database State: 🕳️ EMPTY DATABASE = EMPTY UI (Regular Owner) */
          <div className="text-center py-20 px-4 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl max-w-xl mx-auto space-y-5">
            <div className="p-4 bg-slate-950 text-slate-500 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center border border-slate-800">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">No businesses registered yet</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Register your business to automatically generate your unique public booking slug and high-resolution QR code.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsCreateBusinessOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Register Business</span>
              </button>
            </div>
          </div>
        ) : selectedBusiness ? (
          /* Authenticated Dashboard with Registered Business (Regular Owner) */
          <div className="space-y-6">
            {/* Business Selector Toolbar & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              {/* Business Dropdown Switcher */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedBusinessId || ''}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    className="bg-slate-900 border border-slate-750 text-white text-xs font-bold py-2.5 pl-3.5 pr-8 rounded-xl focus:outline-none focus:border-indigo-500 transition cursor-pointer appearance-none shadow-sm"
                  >
                    {businesses.map((biz) => (
                      <option key={biz.id} value={biz.id}>
                        {biz.name} ({biz.slug})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>

                <button
                  onClick={() => setIsCreateBusinessOpen(true)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 transition"
                  title="Add another business"
                  aria-label="Add another business"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
                <button
                  onClick={() => setActiveTab('booking')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
                    activeTab === 'booking'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Online Booking & QR</span>
                </button>

                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
                    activeTab === 'appointments'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Appointments ({appointments.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('services')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shrink-0 ${
                    activeTab === 'services'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>Services & Staff</span>
                </button>
              </div>
            </div>

            {/* Tab 1: MANDATORY ONLINE BOOKING & QR CODE */}
            {activeTab === 'booking' && (
              <OnlineBookingSection
                business={selectedBusiness}
                stats={stats}
                services={services}
                staff={staff}
                onBusinessUpdated={handleBusinessUpdated}
              />
            )}

            {/* Tab 2: APPOINTMENTS & REAL STATS */}
            {activeTab === 'appointments' && (
              <AppointmentsManager
                business={selectedBusiness}
                appointments={appointments}
                services={services}
                staff={staff}
                onAppointmentsChange={loadBusinessDetails}
              />
            )}

            {/* Tab 3: SERVICES & STAFF DIRECTORY */}
            {activeTab === 'services' && (
              <ServicesStaffManager
                business={selectedBusiness}
                services={services}
                staff={staff}
                onDataChanged={loadBusinessDetails}
              />
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-850/80 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            BizBook Booking & QR Engine • Phase 1 Multi-Tenant Booking Links
          </div>
          <div className="flex items-center gap-4">
            <span>PostgreSQL & RLS Enforced</span>
            <span>•</span>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="hover:text-indigo-400 transition"
            >
              Database Schema & Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConnected={() => {
          setSupabaseConfigured(true);
          loadBusinesses();
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(authenticatedUser) => {
          if (authenticatedUser) {
            setUser(authenticatedUser);
          }
          loadBusinesses();
        }}
      />

      {user && (
        <CreateBusinessModal
          isOpen={isCreateBusinessOpen}
          onClose={() => setIsCreateBusinessOpen(false)}
          userId={user.id}
          onCreated={handleBusinessCreated}
        />
      )}
    </div>
  );
}
