import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Building2,
  QrCode,
  Calendar,
  DollarSign,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Loader2,
  Sparkles,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Business, Appointment } from '../types';
import { formatBookingUrl } from '../utils/slug';
import { getSupabase } from '../lib/supabase';

interface Props {
  businesses: Business[];
  appointments: Appointment[];
  onSelectBusiness: (businessId: string) => void;
  onBusinessUpdated: (updated: Business) => void;
  onCreateBusiness?: () => void;
  onRefresh?: () => void;
}

export const SuperAdminPanel: React.FC<Props> = ({
  businesses,
  appointments,
  onSelectBusiness,
  onBusinessUpdated,
  onCreateBusiness,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const totalBusinesses = businesses.length;
  const approvedBusinesses = businesses.filter((b) => b.is_approved).length;
  const pendingBusinesses = businesses.filter((b) => !b.is_approved).length;
  const totalAppointments = appointments.length;
  const totalRevenue = appointments
    .filter((a) => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => sum + Number(a.price || 0), 0);

  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase()) ||
      (b.phone && b.phone.includes(search));

    if (filter === 'approved') return matchesSearch && b.is_approved;
    if (filter === 'pending') return matchesSearch && !b.is_approved;
    return matchesSearch;
  });

  const handleToggleApproval = async (business: Business) => {
    const nextApproved = !business.is_approved;
    const supabase = getSupabase();

    if (!supabase) {
      onBusinessUpdated({
        ...business,
        is_approved: nextApproved,
        updated_at: new Date().toISOString(),
      });
      return;
    }

    setUpdatingId(business.id);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({
          is_approved: nextApproved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (error) throw error;
      onBusinessUpdated(data as Business);
    } catch (err) {
      console.error('Failed to update business approval status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Super-Admin Oversight (bizbook@gmail.com)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Realtime Active (Live sync)</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
              Platform Administration & Business Directory
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Global multi-tenant control over all registered business booking links, slug availability, approval policies, and QR assets.
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="self-start md:self-center px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-750 text-slate-200 text-xs font-semibold flex items-center gap-2 transition active:scale-95 shrink-0"
              title="Refresh all platform businesses and appointments"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sync All Data</span>
            </button>
          )}
        </div>

        {/* Global Platform KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mt-8 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Total Businesses</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalBusinesses}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Platform-wide</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Approved (Live)</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{approvedBusinesses}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Active booking links</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Pending Approval</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{pendingBusinesses}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Awaiting verification</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Total Bookings</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{totalAppointments}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">All businesses</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-850 rounded-2xl p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Gross Volume</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Platform total</div>
          </div>
        </div>
      </div>

      {/* Directory & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Registered Businesses Directory</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {filteredBusinesses.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Approve businesses to grant active public booking URLs and inspect their QR code settings
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, slug, phone..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition w-full sm:w-60"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === 'approved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending
              </button>
            </div>

            {onCreateBusiness && (
              <button
                onClick={onCreateBusiness}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Business</span>
              </button>
            )}
          </div>
        </div>

        {/* Businesses Table / List */}
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-4">
            <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-sm font-semibold text-white">No businesses registered yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {businesses.length === 0
                  ? 'No business records exist in the Supabase database. Click below to register the first business.'
                  : `No businesses matching the "${filter}" filter or search.`}
              </p>
            </div>
            {onCreateBusiness && businesses.length === 0 && (
              <button
                onClick={onCreateBusiness}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Register First Business</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBusinesses.map((biz) => {
              const bookingUrl = formatBookingUrl(
                typeof window !== 'undefined' ? window.location.origin : '',
                biz.slug
              );

              return (
                <div
                  key={biz.id}
                  className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-slate-900 text-indigo-400 rounded-xl shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm text-white">{biz.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                          /book/{biz.slug}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            biz.is_approved
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {biz.is_approved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span>Category: {biz.category || 'General'}</span>
                        {biz.phone && <span>• Tel: {biz.phone}</span>}
                        {biz.address && <span>• Location: {biz.address}</span>}
                        <span>• Registered: {new Date(biz.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Toggle Approval Button */}
                    <button
                      onClick={() => handleToggleApproval(biz)}
                      disabled={updatingId === biz.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                        biz.is_approved
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
                      }`}
                    >
                      {updatingId === biz.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : biz.is_approved ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Suspend Approval</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Business</span>
                        </>
                      )}
                    </button>

                    {/* Manage Booking & QR */}
                    <button
                      onClick={() => onSelectBusiness(biz.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Manage Booking & QR</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
