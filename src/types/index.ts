export interface Business {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  category?: string;
  address?: string;
  description?: string;
  is_approved: boolean;
  booking_enabled: boolean;
  auto_confirm: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Staff {
  id: string;
  business_id: string;
  name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  service_id?: string;
  staff_id?: string;
  customer_name: string;
  customer_phone: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  booking_reference: string;
  price: number;
  notes?: string;
  created_at: string;
  // Joined fields
  service?: Service;
  staff?: Staff;
}

export interface BookingStats {
  totalAppointments: number;
  confirmedAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalRevenue: number;
}
