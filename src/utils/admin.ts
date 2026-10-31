export const SUPER_ADMIN_EMAIL = 'bizbook@gmail.com';
export const SUPER_ADMIN_DEFAULT_PASS = 'GoodGod1$';

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export interface PlatformOverviewStats {
  totalBusinesses: number;
  approvedBusinesses: number;
  pendingBusinesses: number;
  totalAppointments: number;
  totalRevenue: number;
}
