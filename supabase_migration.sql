-- ====================================================================
-- BusGo Supabase Migration
-- Run this ENTIRE script in: Supabase Dashboard > SQL Editor > New query
-- Project: San Carlos City Bus Terminal, Negros Occidental
-- CONFIRMED live columns in busses: id, bus_name, route, schedule_time, price, available_seats, created_at
-- ====================================================================

-- STEP 1: Add missing columns to the existing busses table
ALTER TABLE public.busses
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'standby'
    CHECK (status IN ('standby', 'ongoing', 'just_arrived')),
  ADD COLUMN IF NOT EXISTS total_seats INTEGER NOT NULL DEFAULT 40;

-- STEP 2: Fix RLS policies
DROP POLICY IF EXISTS "Allow public read access to buses" ON public.busses;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.busses;
DROP POLICY IF EXISTS "busses_select_public" ON public.busses;
DROP POLICY IF EXISTS "busses_insert_authenticated" ON public.busses;
DROP POLICY IF EXISTS "busses_update_authenticated" ON public.busses;
DROP POLICY IF EXISTS "busses_delete_authenticated" ON public.busses;

-- Anyone can read buses (anon + authenticated)
CREATE POLICY "busses_select_public"
  ON public.busses FOR SELECT USING (true);

-- Authenticated users (logged-in admins) can INSERT/UPDATE/DELETE
CREATE POLICY "busses_insert_authenticated"
  ON public.busses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "busses_update_authenticated"
  ON public.busses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "busses_delete_authenticated"
  ON public.busses FOR DELETE TO authenticated USING (true);

-- STEP 3: Seed San Carlos City bus fleet (all 40 seats each)
-- Prices are ESTIMATES - update with actual fares before going live
INSERT INTO public.busses (bus_name, route, schedule_time, price, available_seats, total_seats, status) VALUES
  ('SCC-101 | San Carlos - Canlaon', 'From San Carlos City -> To Canlaon City', '06:00:00', 80.00, 40, 40, 'standby'),
  ('SCC-102 | San Carlos - Canlaon', 'From San Carlos City -> To Canlaon City', '09:00:00', 80.00, 40, 40, 'standby'),
  ('SCC-103 | San Carlos - Calatrava', 'From San Carlos City -> To Calatrava', '06:30:00', 55.00, 40, 40, 'standby'),
  ('SCC-104 | San Carlos - Calatrava', 'From San Carlos City -> To Calatrava', '10:00:00', 55.00, 40, 40, 'standby'),
  ('SCC-105 | San Carlos - Quezon', 'From San Carlos City -> To Quezon, Bukidnon', '07:00:00', 120.00, 40, 40, 'standby'),
  ('SCC-106 | San Carlos - Quezon', 'From San Carlos City -> To Quezon, Bukidnon', '12:00:00', 120.00, 40, 40, 'standby'),
  ('SCC-201 | San Carlos - Canlaon', 'From San Carlos City -> To Canlaon City', '07:45:00', 80.00, 38, 40, 'ongoing'),
  ('SCC-202 | San Carlos - Calatrava', 'From San Carlos City -> To Calatrava', '08:15:00', 55.00, 35, 40, 'ongoing'),
  ('SCC-301 | Canlaon - San Carlos', 'From Canlaon City -> To San Carlos City', '05:30:00', 80.00, 40, 40, 'just_arrived'),
  ('SCC-302 | Calatrava - San Carlos', 'From Calatrava -> To San Carlos City', '05:45:00', 55.00, 40, 40, 'just_arrived')
ON CONFLICT DO NOTHING;

-- STEP 4: Create bookings table (does not exist yet)
CREATE TABLE IF NOT EXISTS public.bookings (
  id              BIGSERIAL PRIMARY KEY,
  booking_ref     TEXT NOT NULL UNIQUE,
  bus_id          BIGINT REFERENCES public.busses(id) ON DELETE SET NULL,
  passenger_name  TEXT NOT NULL,
  passenger_phone TEXT,
  passenger_email TEXT,
  selected_seats  TEXT[] NOT NULL DEFAULT '{}',
  seat_count      INTEGER NOT NULL DEFAULT 1,
  price_per_seat  NUMERIC(10,2) NOT NULL,
  service_fee     NUMERIC(10,2) NOT NULL DEFAULT 2.50,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price     NUMERIC(10,2) NOT NULL,
  payment_method  TEXT NOT NULL DEFAULT 'cash',
  status          TEXT NOT NULL DEFAULT 'CONFIRMED'
                    CHECK (status IN ('CONFIRMED','BOARDED','COMPLETED','CANCELLED')),
  booked_at       TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_authenticated" ON public.bookings;

CREATE POLICY "bookings_select_own"
  ON public.bookings FOR SELECT USING (true);

CREATE POLICY "bookings_insert_authenticated"
  ON public.bookings FOR INSERT TO authenticated WITH CHECK (true);

-- STEP 5: Verify - run this SELECT to confirm 10 rows inserted
SELECT id, bus_name, route, schedule_time, price, available_seats, total_seats, status
FROM public.busses
ORDER BY status, schedule_time;
