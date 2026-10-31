import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Share2,
  Download,
  Printer,
  ExternalLink,
  Edit2,
  CalendarCheck,
  Clock,
  DollarSign,
  Users,
  Eye,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from 'lucide-react';
import { Business, BookingStats, Service, Staff } from '../types';
import { formatBookingUrl, formatWhatsAppShareUrl, formatSocialShareUrl, isValidSlug } from '../utils/slug';
import { generateQrCodeDataUrl, downloadQrCodePng, downloadQrCodePdf, printQrCodeSheet } from '../utils/qr';
import { getSupabase } from '../lib/supabase';
import { BookingPreviewModal } from './BookingPreviewModal';

interface Props {
  business: Business;
  stats: BookingStats;
  services: Service[];
  staff: Staff[];
  onBusinessUpdated: (updated: Business) => void;
}

export const OnlineBookingSection: React.FC<Props> = ({
  business,
  stats,
  services,
  staff,
  onBusinessUpdated,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState(business.slug);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'available' | 'taken' | 'invalid' | 'current' | null>(null);
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [updatingSetting, setUpdatingSetting] = useState<string | null>(null);

  // Compute public booking URL
  const bookingUrl = formatBookingUrl(
    typeof window !== 'undefined' ? window.location.origin : '',
    business.slug
  );

  // Generate QR code whenever bookingUrl changes
  useEffect(() => {
    let active = true;
    if (bookingUrl) {
      generateQrCodeDataUrl(bookingUrl)
        .then((url) => {
          if (active) setQrDataUrl(url);
        })
        .catch((err) => console.error('Error generating QR code:', err));
    }
    return () => {
      active = false;
    };
  }, [bookingUrl]);

  // Handle Copy Link
  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Check Slug Availability for editing
  const handleSlugInputChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setNewSlug(clean);
    setSlugError(null);

    if (clean === business.slug) {
      setSlugStatus('current');
      return;
    }

    if (!isValidSlug(clean)) {
      setSlugStatus('invalid');
      return;
    }

    setSlugChecking(true);
    const supabase = getSupabase();
    if (!supabase) {
      setSlugChecking(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', clean)
        .neq('id', business.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSlugStatus('taken');
      } else {
        setSlugStatus('available');
      }
    } catch {
      setSlugStatus('available');
    } finally {
      setSlugChecking(false);
    }
  };

  // Save new slug
  const handleSaveSlug = async () => {
    if (newSlug === business.slug) {
      setIsEditingSlug(false);
      return;
    }

    if (!isValidSlug(newSlug)) {
      setSlugError('Invalid slug format. Use 3-50 lowercase letters, numbers, and hyphens.');
      return;
    }

    if (slugStatus === 'taken') {
      setSlugError('This slug is already taken by another business.');
      return;
    }

    setSavingSlug(true);
    const supabase = getSupabase();
    if (!supabase) {
      const updated = { ...business, slug: newSlug, updated_at: new Date().toISOString() };
      onBusinessUpdated(updated);
      setIsEditingSlug(false);
      setSlugStatus(null);
      setSavingSlug(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('businesses')
        .update({
          slug: newSlug,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This booking slug is already registered. Please choose another.');
        }
        throw error;
      }

      onBusinessUpdated(data as Business);
      setIsEditingSlug(false);
      setSlugStatus(null);
    } catch (err: any) {
      setSlugError(err?.message || 'Failed to update booking slug.');
    } finally {
      setSavingSlug(false);
    }
  };

  // Toggle booking enabled setting
  const handleToggleBooking = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      const nextValue = !business.booking_enabled;
      onBusinessUpdated({ ...business, booking_enabled: nextValue, updated_at: new Date().toISOString() });
      return;
    }

    setUpdatingSetting('booking');
    try {
      const nextValue = !business.booking_enabled;
      const { data, error } = await supabase
        .from('businesses')
        .update({
          booking_enabled: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (error) throw error;
      onBusinessUpdated(data as Business);
    } catch (err) {
      console.error('Failed to toggle booking availability:', err);
    } finally {
      setUpdatingSetting(null);
    }
  };

  // Toggle auto-confirm setting
  const handleToggleAutoConfirm = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      const nextValue = !business.auto_confirm;
      onBusinessUpdated({ ...business, auto_confirm: nextValue, updated_at: new Date().toISOString() });
      return;
    }

    setUpdatingSetting('autoConfirm');
    try {
      const nextValue = !business.auto_confirm;
      const { data, error } = await supabase
        .from('businesses')
        .update({
          auto_confirm: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)
        .select()
        .single();

      if (error) throw error;
      onBusinessUpdated(data as Business);
    } catch (err) {
      console.error('Failed to toggle auto confirm:', err);
    } finally {
      setUpdatingSetting(null);
    }
  };

  // Web Share API fallback
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book Online with ${business.name}`,
          text: `Reserve your appointment easily online:`,
          url: bookingUrl,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6">
      {/* Mandatory Section Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
              <QrCode className="w-3.5 h-3.5" />
              <span>Phase 1 Implementation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
              Online Booking & QR Code
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Your official booking URL, real QR code generator, counter print display, and instant booking availability controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-2 transition border border-slate-700 active:scale-95 shadow-sm"
              aria-label="Preview public booking page"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Booking Page Preview</span>
            </button>
          </div>
        </div>

        {/* Real Database Booking Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Total Appointments</span>
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.totalAppointments}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.totalAppointments === 0 ? 'No appointments yet' : 'Real database records'}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Confirmed Bookings</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {stats.confirmedAppointments}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.confirmedAppointments === 0 ? '0 confirmed' : 'Ready for service'}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Pending Requests</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 tracking-tight">
              {stats.pendingAppointments}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.pendingAppointments === 0 ? '0 pending approvals' : 'Awaiting confirmation'}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
              <span>Online Revenue</span>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.totalRevenue === 0 ? '0.00' : 'From confirmed appointments'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Booking Link Management + QR Code Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Booking URL, Slug Editor & Online Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Unique Booking URL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Unique Public Booking URL</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    LIVE
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customers visit this public address to select services and reserve times.
                </p>
              </div>

              {!isEditingSlug && (
                <button
                  onClick={() => {
                    setIsEditingSlug(true);
                    setNewSlug(business.slug);
                    setSlugStatus('current');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-medium flex items-center gap-1.5 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Change Slug</span>
                </button>
              )}
            </div>

            {/* URL Display / Slug Editor */}
            {!isEditingSlug ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500 font-medium">Public Address</div>
                    <div className="font-mono text-sm text-indigo-300 truncate select-all font-semibold">
                      {bookingUrl}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Inline Slug Editor */
              <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Edit Business Slug</span>
                  <span className="text-[11px] text-slate-500">Enforced unique in PostgreSQL</span>
                </div>

                {slugError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{slugError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">.../book/</span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newSlug}
                      onChange={(e) => handleSlugInputChange(e.target.value)}
                      placeholder="baba-alabi-salon"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500 transition"
                    />
                    <div className="absolute right-2.5 top-2">
                      {slugChecking && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                      {slugStatus === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {slugStatus === 'taken' && <AlertCircle className="w-4 h-4 text-red-400" />}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    {slugStatus === 'available' && <span className="text-emerald-400">✓ Slug is available</span>}
                    {slugStatus === 'taken' && <span className="text-red-400">✗ Slug already taken</span>}
                    {slugStatus === 'invalid' && <span className="text-amber-400">Min 3 lowercase letters, numbers, hyphens</span>}
                    {slugStatus === 'current' && <span className="text-slate-400">Current business slug</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingSlug(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingSlug || slugStatus === 'taken' || slugStatus === 'invalid'}
                      onClick={handleSaveSlug}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition flex items-center gap-1.5 shadow-sm"
                    >
                      {savingSlug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Save & Update QR</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sharing Channels */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Share Booking Link Directly
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={formatWhatsAppShareUrl(business.name, bookingUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                {/* Twitter / X */}
                <a
                  href={formatSocialShareUrl('twitter', business.name, bookingUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <Twitter className="w-4 h-4 text-sky-400" />
                  <span>Twitter / X</span>
                </a>

                {/* Facebook */}
                <a
                  href={formatSocialShareUrl('facebook', business.name, bookingUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <Facebook className="w-4 h-4 text-blue-500" />
                  <span>Facebook</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={formatSocialShareUrl('linkedin', business.name, bookingUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <Linkedin className="w-4 h-4 text-blue-400" />
                  <span>LinkedIn</span>
                </a>

                {/* Email */}
                <a
                  href={formatSocialShareUrl('email', business.name, bookingUrl)}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>Email Client</span>
                </a>

                {/* Web Share API */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>More Options</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card: Online Booking Availability & Approval Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Online Booking Availability & Policies</span>
            </h3>

            <div className="space-y-3">
              {/* Enable / Disable Online Booking */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Online Booking Availability</div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {business.booking_enabled
                      ? 'Customers can view services and submit booking appointments.'
                      : 'Online bookings are temporarily paused. Customers see a paused status notice.'}
                  </p>
                </div>

                <button
                  onClick={handleToggleBooking}
                  disabled={updatingSetting === 'booking'}
                  className={`p-2 rounded-xl transition ${
                    business.booking_enabled
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : 'text-slate-600 hover:text-slate-500'
                  }`}
                  aria-label="Toggle booking availability"
                >
                  {updatingSetting === 'booking' ? (
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                  ) : business.booking_enabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>

              {/* Auto Confirm vs Manual Approval */}
              <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Appointment Confirmation Mode</div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {business.auto_confirm
                      ? 'Automatic: Appointments are confirmed immediately upon validation.'
                      : 'Manual: New bookings stay pending until you review and confirm them.'}
                  </p>
                </div>

                <button
                  onClick={handleToggleAutoConfirm}
                  disabled={updatingSetting === 'autoConfirm'}
                  className={`p-2 rounded-xl transition ${
                    business.auto_confirm
                      ? 'text-indigo-400 hover:text-indigo-300'
                      : 'text-slate-600 hover:text-slate-500'
                  }`}
                  aria-label="Toggle appointment confirmation mode"
                >
                  {updatingSetting === 'autoConfirm' ? (
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                  ) : business.auto_confirm ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real QR Code Generation & Studio (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>Real QR Code Studio</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dynamically encodes your live booking URL
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                HIGH RES
              </span>
            </div>

            {/* QR Code Graphic Frame */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Booking QR Code for ${business.name}`}
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg">
                    <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                  </div>
                )}
              </div>

              <div className="mt-4 font-bold text-white text-sm">{business.name}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">/book/{business.slug}</div>
              <div className="text-[11px] text-slate-500 mt-2">
                Scan with any smartphone camera to open booking page
              </div>
            </div>

            {/* QR Download & Export Actions */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                {/* Download PNG */}
                <button
                  type="button"
                  onClick={() => downloadQrCodePng(qrDataUrl, business.slug)}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition border border-slate-700 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download PNG</span>
                </button>

                {/* Download PDF */}
                <button
                  type="button"
                  onClick={() => downloadQrCodePdf(business, bookingUrl, qrDataUrl)}
                  className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/20 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Sign</span>
                </button>
              </div>

              {/* Print Counter Display Sheet */}
              <button
                type="button"
                onClick={() => printQrCodeSheet(business, bookingUrl, qrDataUrl)}
                className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition border border-slate-800"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Print Counter Display (Table / Window Stand)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Preview Modal */}
      <BookingPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        business={business}
        services={services}
        staff={staff}
        bookingUrl={bookingUrl}
      />
    </div>
  );
};
