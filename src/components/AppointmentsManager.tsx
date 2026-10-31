import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Loader2,
  DollarSign,
  Filter,
} from 'lucide-react';
import { Appointment, Business, Service, Staff } from '../types';
import { getSupabase } from '../lib/supabase';

interface Props {
  business: Business;
  appointments: Appointment[];
  services: Service[];
  staff: Staff[];
  onAppointmentsChange: () => void;
}

export const AppointmentsManager: React.FC<Props> = ({
  business,
  appointments,
  services,
  staff,
  onAppointmentsChange,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // New appointment form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  const handleUpdateStatus = async (
    id: string,
    newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setLoadingAction(id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('business_id', business.id);

      if (error) throw error;
      onAppointmentsChange();
    } catch (err: any) {
      console.error('Failed to update appointment status:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Customer name and phone are required.');
      return;
    }

    const serviceObj = services.find((s) => s.id === selectedServiceId);
    const price = serviceObj ? Number(serviceObj.price) : 0;
    const refCode = `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const supabase = getSupabase();
    if (!supabase) {
      const newApt: Appointment = {
        id: `apt-${Date.now()}`,
        business_id: business.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        service_id: selectedServiceId || undefined,
        staff_id: selectedStaffId || undefined,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: business.auto_confirm ? 'confirmed' : 'pending',
        booking_reference: refCode,
        price,
        notes: notes.trim() || undefined,
        created_at: new Date().toISOString(),
      };
      appointments.unshift(newApt);
      setCustomerName('');
      setCustomerPhone('');
      setSelectedServiceId('');
      setSelectedStaffId('');
      setNotes('');
      setIsAdding(false);
      onAppointmentsChange();
      return;
    }

    setLoadingAction('create');
    try {
      const { error } = await supabase.from('appointments').insert({
        business_id: business.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        service_id: selectedServiceId || null,
        staff_id: selectedStaffId || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: business.auto_confirm ? 'confirmed' : 'pending',
        booking_reference: refCode,
        price,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setSelectedServiceId('');
      setSelectedStaffId('');
      setNotes('');
      setIsAdding(false);
      onAppointmentsChange();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save appointment to Supabase.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Appointments & Bookings</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {appointments.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Realtime appointments stored in Supabase with customer details and status
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="all">All Statuses ({appointments.length})</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Appointment</span>
          </button>
        </div>
      </div>

      {/* Add Appointment Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateAppointment}
          className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-5 space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Add New Appointment (Saved directly to Supabase)
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Customer Telephone *</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1 (555) 345-6789"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Service</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">-- No specific service --</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} (${Number(svc.price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Staff</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">-- Any available staff --</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Appointment Date</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Appointment Time</label>
              <input
                type="text"
                required
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requests or client preferences"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={loadingAction === 'create'}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
            >
              {loadingAction === 'create' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Save to Supabase</span>
            </button>
          </div>
        </form>
      )}

      {/* Appointment Records List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No appointments found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {appointments.length === 0
              ? 'No appointments yet. Share your booking link or QR code to start receiving bookings from customers.'
              : `No appointments matching the "${filter}" filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => {
            const service = services.find((s) => s.id === apt.service_id);
            const staffMember = staff.find((s) => s.id === apt.staff_id);

            return (
              <div
                key={apt.id}
                className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-slate-900 rounded-xl text-indigo-400 shrink-0 mt-0.5">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{apt.customer_name}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-900 text-slate-400 rounded-md">
                        {apt.booking_reference}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {apt.customer_phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {apt.appointment_date} at {apt.appointment_time}
                      </span>
                      {service && (
                        <span className="text-indigo-400 font-medium">
                          {service.name} (${Number(apt.price).toFixed(2)})
                        </span>
                      )}
                      {staffMember && (
                        <span className="text-slate-500">
                          Specialist: {staffMember.name}
                        </span>
                      )}
                    </div>

                    {apt.notes && (
                      <p className="text-xs text-slate-500 mt-1.5 italic">
                        "{apt.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-2.5 shrink-0 sm:self-center">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                      apt.status === 'confirmed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : apt.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : apt.status === 'completed'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {apt.status}
                  </span>

                  {/* Actions */}
                  {apt.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                      disabled={loadingAction === apt.id}
                      className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                      title="Confirm Appointment"
                      aria-label="Confirm appointment"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'completed')}
                      disabled={loadingAction === apt.id}
                      className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                      title="Mark as Completed"
                      aria-label="Complete appointment"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                      disabled={loadingAction === apt.id}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Cancel Appointment"
                      aria-label="Cancel appointment"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
