import React, { useState, useEffect } from 'react';
import { Building2, X, AlertCircle, CheckCircle, Loader2, Sparkles, MapPin, Phone, Tag } from 'lucide-react';
import { generateSlug, isValidSlug } from '../utils/slug';
import { getSupabase } from '../lib/supabase';
import { Business } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onCreated: (business: Business) => void;
}

export const CreateBusinessModal: React.FC<Props> = ({ isOpen, onClose, userId, onCreated }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Salon & Spa');
  const [address, setAddress] = useState('');
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [currency, setCurrency] = useState('USD');

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug when name changes if not manually modified
  useEffect(() => {
    if (!isSlugCustomized && name.trim()) {
      const generated = generateSlug(name);
      setSlug(generated);
      checkSlugAvailability(generated);
    }
  }, [name, isSlugCustomized]);

  const checkSlugAvailability = async (candidateSlug: string) => {
    if (!candidateSlug || !isValidSlug(candidateSlug)) {
      setSlugStatus('invalid');
      return;
    }

    setSlugStatus('checking');
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', candidateSlug)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSlugStatus('taken');
      } else {
        setSlugStatus('available');
      }
    } catch {
      setSlugStatus('available');
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setIsSlugCustomized(true);
    setSlug(val);
    checkSlugAvailability(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Business name is required.');
      return;
    }

    if (!isValidSlug(slug)) {
      setError('Please provide a valid URL slug (lowercase letters, numbers, and single hyphens, min 3 characters).');
      return;
    }

    if (slugStatus === 'taken') {
      setError('This booking slug is already taken. Please choose another.');
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      if (
        typeof window !== 'undefined' &&
        (window.location.search.includes('autostart=1') ||
          window.location.search.includes('admin=1') ||
          userId.startsWith('super-admin'))
      ) {
        const testBiz: Business = {
          id: `dev-biz-${Date.now()}`,
          user_id: userId,
          name: name.trim(),
          slug: slug.trim(),
          phone: phone.trim() || undefined,
          category: category.trim(),
          address: address.trim() || undefined,
          is_approved: true,
          booking_enabled: bookingEnabled,
          auto_confirm: autoConfirm,
          currency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        onCreated(testBiz);
        onClose();
        return;
      }
      setError('Supabase is not configured. Connect your Supabase project in Settings first.');
      return;
    }

    setLoading(true);

    try {
      const newBusiness = {
        user_id: userId,
        name: name.trim(),
        slug: slug.trim(),
        phone: phone.trim() || null,
        category: category.trim(),
        address: address.trim() || null,
        is_approved: true, // Approved businesses receive their public booking URL
        booking_enabled: bookingEnabled,
        auto_confirm: autoConfirm,
        currency,
      };

      const { data, error: insertError } = await supabase
        .from('businesses')
        .insert(newBusiness)
        .select()
        .single();

      if (insertError) {
        if (
          insertError.code === 'PGRST205' ||
          insertError.code === '42P01' ||
          insertError.message?.includes("Could not find the table")
        ) {
          throw new Error("Table 'public.businesses' does not exist yet. Please run the schema SQL in your Supabase SQL Editor.");
        }
        if (insertError.code === '23505') {
          throw new Error('This booking slug is already in use by another business. Please choose a unique slug.');
        }
        throw insertError;
      }

      onCreated(data as Business);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to register business.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close register modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Register Business</h2>
            <p className="text-xs text-slate-400">Generate unique public booking link & real QR code</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Baba Alabi Salon & Spa"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Unique Booking URL Slug *
              </label>
              <span className="text-[11px] text-slate-400">
                yourdomain.com/book/<strong className="text-indigo-400">{slug || 'slug'}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="baba-alabi-salon"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-indigo-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <div className="absolute right-3 top-2.5">
                {slugStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                {slugStatus === 'available' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {slugStatus === 'taken' && <AlertCircle className="w-4 h-4 text-red-400" />}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              {slugStatus === 'available' && <span className="text-emerald-400">✓ Slug is available</span>}
              {slugStatus === 'taken' && <span className="text-red-400">✗ Slug already in use</span>}
              {slugStatus === 'invalid' && <span className="text-amber-400">Min 3 characters, lowercase letters, numbers, hyphens</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                >
                  <option value="Salon & Spa">Salon & Spa</option>
                  <option value="Barbershop">Barbershop</option>
                  <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Professional Consulting">Professional Consulting</option>
                  <option value="Automotive & Repair">Automotive & Repair</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Physical Location / Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Broad Street, Downtown"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">Enable Online Bookings</span>
                <p className="text-[11px] text-slate-400">Allow customers to access your booking link</p>
              </div>
              <input
                type="checkbox"
                checked={bookingEnabled}
                onChange={(e) => setBookingEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-850">
              <div>
                <span className="text-xs font-semibold text-slate-200">Auto-Confirm Appointments</span>
                <p className="text-[11px] text-slate-400">Otherwise appointments require owner approval</p>
              </div>
              <input
                type="checkbox"
                checked={autoConfirm}
                onChange={(e) => setAutoConfirm(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || slugStatus === 'taken' || slugStatus === 'invalid'}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 active:scale-95 rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Register Business & Generate QR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
