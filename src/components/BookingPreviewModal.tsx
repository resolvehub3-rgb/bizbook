import React from 'react';
import { X, Calendar, Clock, User, Phone, CheckCircle, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { Business, Service, Staff } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  services: Service[];
  staff: Staff[];
  bookingUrl: string;
}

export const BookingPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  business,
  services,
  staff,
  bookingUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          aria-label="Close preview modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Phase Architecture Banner */}
        <div className="mb-6 p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-200 leading-relaxed">
            <strong className="text-white block mb-0.5">Public Booking Engine Architecture (Phase 2 Preview)</strong>
            This is the architectural preview for route <code className="bg-slate-950 px-1.5 py-0.5 rounded text-indigo-300">/book/{business.slug}</code>. Customers do not log in. Appointments are validated server-side to prevent double bookings.
          </div>
        </div>

        {/* Business Header */}
        <div className="text-center pb-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 border bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
            {business.category || 'Service Business'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{business.name}</h2>
          {business.address && <p className="text-sm text-slate-400 mt-1">{business.address}</p>}
          {business.phone && <p className="text-xs text-slate-500 mt-0.5">Tel: {business.phone}</p>}

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Public URL:</span>
            <code className="text-indigo-400 font-mono text-xs">{bookingUrl}</code>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2">
            {business.booking_enabled ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Online Bookings Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" /> Online Bookings Currently Paused by Business
              </span>
            )}
            <span className="text-slate-700">•</span>
            <span className="text-xs text-slate-400">
              {business.auto_confirm ? 'Instant Auto-Confirmation' : 'Manual Business Approval'}
            </span>
          </div>
        </div>

        {/* Public Booking Customer Form Preview (Phase 2 Form Spec) */}
        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Customer Booking Form Preview
            </h3>
            <span className="text-xs text-slate-500">No account required</span>
          </div>

          {/* Form fields mockup */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    disabled
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer Telephone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    disabled
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Select Service */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Service</label>
              {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {services.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-200">{svc.name}</div>
                        <div className="text-slate-500">{svc.duration_minutes} mins</div>
                      </div>
                      <div className="font-semibold text-emerald-400">
                        ${Number(svc.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-500" />
                  <span>No services configured yet for this business in Supabase.</span>
                </div>
              )}
            </div>

            {/* Preferred Staff */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Staff Member</label>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>Any available specialist</span>
                <span className="text-xs text-slate-500">
                  {staff.length} staff member{staff.length === 1 ? '' : 's'} registered
                </span>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Appointment Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    disabled
                    value={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Appointment Time</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    disabled
                    placeholder="10:00 AM"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                disabled
                className="w-full py-2.5 bg-indigo-600/50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <span>Confirm & Reserve Appointment (Phase 2 Submission)</span>
              </button>
              <p className="text-[11px] text-center text-slate-500 mt-2">
                Phase 1 provides booking slug, QR code generation, sharing, and settings. Real customer submission unlocks in Phase 2.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
