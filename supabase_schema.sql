-- ====================================================================
-- BusGo Bus Reservation System - Supabase SQL Schema
-- Run this in your Supabase Project -> SQL Editor to initialize tables
-- ====================================================================

-- 1. Create Buses Table
CREATE TABLE IF NOT EXISTS public.buses (
  id TEXT PRIMARY KEY,
  bus_number TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  operator TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('standby', 'ongoing', 'just_arrived')),
  category_label TEXT NOT NULL,
  bus_type TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  location TEXT NOT NULL,
  platform_gate TEXT,
  time_formatted TEXT NOT NULL,
  time_label TEXT NOT NULL,
  countdown_seconds INTEGER DEFAULT 0,
  price_per_trip NUMERIC(10, 2) NOT NULL,
  currency TEXT DEFAULT '$',
  total_seats INTEGER DEFAULT 32,
  available_seats INTEGER DEFAULT 32,
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  speed_kmh INTEGER,
  next_stop TEXT,
  turnaround_time TEXT,
  rating NUMERIC(3, 1) DEFAULT 4.8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & allow public reads
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to buses" ON public.buses FOR SELECT USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.buses FOR ALL USING (true);

-- 2. Create Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  booking_ref TEXT NOT NULL UNIQUE,
  bus_id TEXT REFERENCES public.buses(id) ON DELETE SET NULL,
  bus_number TEXT NOT NULL,
  operator TEXT NOT NULL,
  bus_type TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_location TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  price_per_trip NUMERIC(10, 2) NOT NULL,
  selected_seats TEXT[] NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT,
  passenger_email TEXT,
  payment_method TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  service_fee NUMERIC(10, 2) DEFAULT 2.50,
  discount NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'CONFIRMED',
  booked_at TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert to bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to bookings" ON public.bookings FOR UPDATE USING (true);

-- 3. Seed Initial Fleet Data
INSERT INTO public.buses (
  id, bus_number, plate_number, operator, category, category_label, bus_type,
  origin, destination, location, platform_gate, time_formatted, time_label,
  countdown_seconds, price_per_trip, currency, total_seats, available_seats,
  amenities, speed_kmh, next_stop, turnaround_time, rating
) VALUES
-- Standby Buses
('bus-sb-101', 'SB-101', 'BUS-8921', 'SilverLine Premier', 'standby', 'Standby / Boarding', 'Executive AC',
 'Grand Central Terminal', 'Uptown Business District', 'Bay 4A - North Terminal, Gate 2', 'Gate 2 (Platform 4)',
 '18:15:00', 'Scheduled Departure', 1500, 24.50, '$', 32, 18,
 ARRAY['High-speed WiFi', 'AC Climate Control', 'Type-C Charging', 'Reclining Leather Seats'], NULL, NULL, NULL, 4.8),

('bus-sb-102', 'SB-102', 'BUS-3140', 'MetroStar Express', 'standby', 'Standby / Ready', 'Express Transit',
 'Grand Central Terminal', 'Seaside Coastal Bay', 'Bay 7B - South Terminal, Gate 5', 'Gate 5 (Platform 7)',
 '18:45:00', 'Scheduled Departure', 3300, 18.00, '$', 32, 22,
 ARRAY['AC Climate Control', 'Overhead Reading Light', 'USB Charging Ports', 'Onboard CCTV'], NULL, NULL, NULL, 4.6),

('bus-sb-103', 'SB-103', 'BUS-7709', 'NightOwl Sleeper Liner', 'standby', 'Standby / Boarding Soon', 'Luxury Sleeper',
 'Grand Central Terminal', 'Mountain Peak Highlands', 'Bay 2 - VIP Departure Lounge, Gate 1', 'Gate 1 (Platform 2)',
 '19:30:00', 'Scheduled Departure', 6000, 38.50, '$', 32, 12,
 ARRAY['Full Flat Beds', 'Free Blanket & Pillow', 'WiFi 5G', 'Private Privacy Curtains'], NULL, NULL, NULL, 4.9),

('bus-sb-104', 'SB-104', 'BUS-4512', 'AeroLink Shuttle', 'standby', 'Standby / Final Call', 'City Rapid',
 'Grand Central Terminal', 'International Airport Terminal 3', 'Bay 1A - Express Shuttle Lane', 'Express Bay 1A',
 '17:55:00', 'Scheduled Departure', 300, 15.00, '$', 32, 6,
 ARRAY['Direct Airport Route', 'Heavy Luggage Racks', 'AC', 'Flight Info Displays'], NULL, NULL, NULL, 4.7),

-- Ongoing Buses
('bus-og-201', 'OG-201', 'BUS-9081', 'SwiftVoyage Intercity', 'ongoing', 'En Route / In Transit', 'Super Deluxe',
 'Grand Central Terminal', 'Sun Valley Metro Station', 'Highway 101, Mile 42 Northbound (Passing Greenfield Interchange)', NULL,
 '00:28:15', 'Estimated Time to Next Stop', 1695, 26.00, '$', 32, 9,
 ARRAY['Live GPS Tracking', 'WiFi', 'Snack Bar', 'AC Climate Control'], 74, 'Greenfield City Junction (Stop 3 of 6)', NULL, 4.7),

('bus-og-202', 'OG-202', 'BUS-6218', 'CoastWay Direct', 'ongoing', 'En Route / Cruising', 'Executive AC',
 'East Bay Port', 'Grand Central Terminal', 'Coastal Skyway Tollway, Section 8B (Speeding toward Metro Bridge)', NULL,
 '00:46:50', 'Estimated Arrival at Terminal', 2810, 22.00, '$', 32, 14,
 ARRAY['Panoramic View Windows', 'WiFi', 'AC', 'Emergency First Aid Kit'], 82, 'Metro Outer Bridge Station', NULL, 4.5),

('bus-og-203', 'OG-203', 'BUS-1144', 'MetroLink Rapid', 'ongoing', 'En Route / Active', 'Express Transit',
 'North Tech Industrial Park', 'Central Financial Plaza', 'Avenue of the Americas, 5th Crossroad (Passing City Mall)', NULL,
 '00:14:20', 'Time Remaining to Destination', 860, 14.50, '$', 32, 16,
 ARRAY['Fast Transit Lanes', 'Tap-and-Go Card Reader', 'AC'], 48, 'Financial Plaza East Gate', NULL, 4.6),

-- Just Arrived Buses
('bus-ja-301', 'JA-301', 'BUS-5532', 'SilverLine Premier', 'just_arrived', 'Just Arrived / Docked', 'Executive AC',
 'Northern Lakes Resort', 'Grand Central Terminal', 'Arrival Dock 3 - Main Concourse Gate', 'Arrival Dock 3',
 '17:31:40', 'Touchdown Arrival Time', NULL, 28.00, '$', 32, 30,
 ARRAY['WiFi', 'AC Climate Control', 'Reclining Seats'], NULL, NULL, 'Turnaround prep: next departure at 18:35:00', 4.8),

('bus-ja-302', 'JA-302', 'BUS-8302', 'CrossCountry Sleeper', 'just_arrived', 'Just Arrived / Disembarking', 'Luxury Sleeper',
 'Southern Valley Terminal', 'Grand Central Terminal', 'Arrival Platform 6B - South Concourse', 'Arrival Platform 6B',
 '17:26:15', 'Touchdown Arrival Time', NULL, 35.00, '$', 32, 28,
 ARRAY['Flat Bed Cabins', 'Power Outlets', 'Beverage Bar'], NULL, NULL, 'Turnaround prep: next departure at 19:00:00', 4.9),

('bus-ja-303', 'JA-303', 'BUS-2287', 'MetroStar Express', 'just_arrived', 'Just Arrived / Baggage Unload', 'City Rapid',
 'East Suburb Interchange', 'Grand Central Terminal', 'Arrival Bay 1C - Metro Drop-off Point', 'Arrival Bay 1C',
 '17:34:02', 'Touchdown Arrival Time', NULL, 16.50, '$', 32, 26,
 ARRAY['Quick Transit', 'AC', 'Spacious Legroom'], NULL, NULL, 'Turnaround prep: next departure at 18:10:00', 4.4)
ON CONFLICT (id) DO NOTHING;
