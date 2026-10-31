-- SUPABASE POSTGRESQL SCHEMA FOR BUSINESS BOOKING & QR CODE MANAGEMENT
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  category TEXT DEFAULT 'Salon & Spa',
  address TEXT,
  description TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  booking_enabled BOOLEAN DEFAULT TRUE,
  auto_confirm BOOLEAN DEFAULT FALSE,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for rapid slug lookups in public booking
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_user ON businesses(user_id);

-- 2. Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  price NUMERIC(10,2) DEFAULT 0.00,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);

-- 3. Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Stylist',
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_business ON staff(business_id);

-- 4. Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  booking_reference TEXT NOT NULL,
  price NUMERIC(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_appointments_business ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_reference ON appointments(booking_reference);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies

-- Businesses:
-- Owners can read/update/delete their own businesses
CREATE POLICY "Owners can manage their businesses"
  ON businesses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone (including public customers) can view approved businesses by slug
CREATE POLICY "Public can view approved businesses by slug"
  ON businesses FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

-- Services:
-- Owners can manage services for their businesses
CREATE POLICY "Owners can manage services"
  ON services FOR ALL
  TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Public can view active services
CREATE POLICY "Public can view active services"
  ON services FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Staff:
-- Owners can manage staff for their businesses
CREATE POLICY "Owners can manage staff"
  ON staff FOR ALL
  TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Public can view active staff
CREATE POLICY "Public can view active staff"
  ON staff FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Appointments:
-- Owners can read and update all appointments for their businesses
CREATE POLICY "Owners can view and update appointments"
  ON appointments FOR ALL
  TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Public can insert appointments (Phase 2 customer booking flow)
CREATE POLICY "Public can book appointments"
  ON appointments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 7. Super-Admin Policies (bizbook@gmail.com)
CREATE POLICY "Super-Admin full access to all businesses"
  ON businesses FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bizbook@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'bizbook@gmail.com');

CREATE POLICY "Super-Admin full access to all appointments"
  ON appointments FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bizbook@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'bizbook@gmail.com');

CREATE POLICY "Super-Admin full access to all services"
  ON services FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bizbook@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'bizbook@gmail.com');

CREATE POLICY "Super-Admin full access to all staff"
  ON staff FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'bizbook@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'bizbook@gmail.com');

-- 8. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE businesses;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
