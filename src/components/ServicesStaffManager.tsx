import React, { useState } from 'react';
import { Scissors, Users, Plus, Trash2, DollarSign, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Business, Service, Staff } from '../types';
import { getSupabase } from '../lib/supabase';

interface Props {
  business: Business;
  services: Service[];
  staff: Staff[];
  onDataChanged: () => void;
}

export const ServicesStaffManager: React.FC<Props> = ({
  business,
  services,
  staff,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'services' | 'staff'>('services');

  // Service form
  const [serviceName, setServiceName] = useState('');
  const [duration, setDuration] = useState('45');
  const [price, setPrice] = useState('25.00');
  const [serviceDesc, setServiceDesc] = useState('');

  // Staff form
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Senior Stylist');
  const [staffPhone, setStaffPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('services').insert({
        business_id: business.id,
        name: serviceName.trim(),
        duration_minutes: parseInt(duration, 10) || 30,
        price: parseFloat(price) || 0,
        description: serviceDesc.trim() || null,
        is_active: true,
      });

      if (insertError) throw insertError;

      setServiceName('');
      setServiceDesc('');
      onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to add service.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('staff').insert({
        business_id: business.id,
        name: staffName.trim(),
        role: staffRole.trim(),
        phone: staffPhone.trim() || null,
        is_active: true,
      });

      if (insertError) throw insertError;

      setStaffName('');
      setStaffPhone('');
      onDataChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to add staff member.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await supabase.from('services').delete().eq('id', id);
      onDataChanged();
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      await supabase.from('staff').delete().eq('id', id);
      onDataChanged();
    } catch (err) {
      console.error('Error deleting staff:', err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Services & Staff Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configured services and staff are automatically displayed on your booking page
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Services ({services.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'staff'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff ({staff.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-5">
          {/* Add Service Inline Form */}
          <form
            onSubmit={handleAddService}
            className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Service Name *</label>
              <input
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Deluxe Haircut & Wash"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Duration (min)</label>
              <input
                type="number"
                min="5"
                step="5"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Price ($)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shrink-0 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Services List */}
          {services.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
              No services added yet. Add your first service above to appear on your booking link.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{svc.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{svc.duration_minutes} mins</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">${Number(svc.price).toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteService(svc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                    title="Delete service"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-5">
          {/* Add Staff Form */}
          <form
            onSubmit={handleAddStaff}
            className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Staff Name *</label>
              <input
                type="text"
                required
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Marcus Miller"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Role / Speciality</label>
              <input
                type="text"
                required
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
                placeholder="e.g. Master Stylist"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shrink-0 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Staff List */}
          {staff.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl text-xs text-slate-500">
              No staff members registered yet. Add staff above to assign to appointments.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staff.map((st) => (
                <div
                  key={st.id}
                  className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{st.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{st.role}</div>
                  </div>

                  <button
                    onClick={() => handleDeleteStaff(st.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                    title="Delete staff"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
