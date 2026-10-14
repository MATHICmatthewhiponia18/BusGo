import type { Bus, BusCategory, Seat } from '../types/bus';
import { supabase } from '../lib/supabase';

// Generate EXACTLY 40 seats (10 rows x 4 seats: A, B, C, D)
export const generateSeats = (
  bookedSeatNumbers: string[] = []
): Seat[] => {
  const TOTAL_SEATS = 40;
  const SEATS_PER_ROW = 4;
  const ROWS = TOTAL_SEATS / SEATS_PER_ROW;
  const cols = ['A', 'B', 'C', 'D'];

  const seats: Seat[] = [];

  for (let r = 1; r <= ROWS; r++) {
    for (const c of cols) {
      const seatId = `${r}${c}`;

      seats.push({
        id: seatId,
        row: r,
        col: c,
        isBooked: bookedSeatNumbers.includes(seatId),
        type: c === 'A' || c === 'D' ? 'window' : 'aisle',
      });
    }
  }

  // Safety check: every bus must have exactly 40 generated seats.
  if (seats.length !== TOTAL_SEATS) {
    throw new Error(
      `Seat generation error: expected ${TOTAL_SEATS} seats, got ${seats.length}`
    );
  }

  return seats;
};

// Formats a Date object to HH:MM:SS
export const formatTimeHHMMSS = (date: Date = new Date()): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

// Add seconds to current time and format as HH:MM:SS
export const getTimeOffsetHHMMSS = (
  offsetMinutes: number,
  offsetSeconds: number = 0
): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + offsetMinutes);
  d.setSeconds(d.getSeconds() + offsetSeconds);
  return formatTimeHHMMSS(d);
};

// Standard 40 seat IDs from 1A to 10D
const ALL_40_SEAT_IDS: string[] = Array.from({ length: 10 }, (_, r) =>
  ['A', 'B', 'C', 'D'].map((c) => `${r + 1}${c}`)
).flat();

/**
 * Expected schema interfaces for Supabase records without using `any`
 */
export interface SupabaseBusRow {
  id: string | number;
  bus_name?: string | null;
  bus_number?: string | null;
  busNumber?: string | null;
  plate_number?: string | null;
  plateNumber?: string | null;
  operator?: string | null;
  category?: string | null;
  category_label?: string | null;
  categoryLabel?: string | null;
  status?: string | null;
  bus_type?: string | null;
  busType?: string | null;
  route?: string | null;
  origin?: string | null;
  destination?: string | null;
  location?: string | null;
  platform_gate?: string | null;
  platformGate?: string | null;
  time_formatted?: string | null;
  timeFormatted?: string | null;
  schedule_time?: string | null;
  time_label?: string | null;
  timeLabel?: string | null;
  countdown_seconds?: number | string | null;
  countdownSeconds?: number | string | null;
  speed_kmh?: number | string | null;
  speedKmH?: number | string | null;
  next_stop?: string | null;
  nextStop?: string | null;
  turnaround_time?: string | null;
  turnaroundTime?: string | null;
  price?: number | string | null;
  price_per_trip?: number | string | null;
  pricePerTrip?: number | string | null;
  currency?: string | null;
  total_seats?: number | string | null;
  totalSeats?: number | string | null;
  available_seats?: number | string | null;
  availableSeats?: number | string | null;
  amenities?: string[] | string | null;
  rating?: number | string | null;
  booked_seats?: string[] | string | null;
  bookedSeats?: string[] | string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SupabaseBookingRow {
  id?: string | number | null;
  bus_id?: string | number | null;
  busId?: string | number | null;
  bus_number?: string | null;
  busNumber?: string | null;
  selected_seats?: string[] | string | null;
  selectedSeats?: string[] | string | null;
  status?: string | null;
}

/**
 * Maps Supabase raw status/category to BusGo's BusCategory and human-readable label
 */
export const mapBusCategory = (
  rawCategory?: string | null
): { category: BusCategory; defaultLabel: string } => {
  const val = (rawCategory || '').trim().toLowerCase();
  if (
    val.includes('ongoing') ||
    val.includes('transit') ||
    val.includes('en route') ||
    val.includes('enroute') ||
    val.includes('active') ||
    val.includes('cruising')
  ) {
    return { category: 'ongoing', defaultLabel: 'En Route / In Transit' };
  }
  if (
    val.includes('just_arrived') ||
    val.includes('arrived') ||
    val.includes('docked') ||
    val.includes('disembark')
  ) {
    return { category: 'just_arrived', defaultLabel: 'Just Arrived / Docked' };
  }
  return { category: 'standby', defaultLabel: 'Standby / Boarding' };
};

/**
 * Maps raw bus type string to valid Bus['busType'] union
 */
export const mapBusType = (rawType?: string | null): Bus['busType'] => {
  const val = (rawType || '').trim().toLowerCase();
  if (val.includes('sleeper')) return 'Luxury Sleeper';
  if (val.includes('express')) return 'Express Transit';
  if (val.includes('super') || val.includes('deluxe')) return 'Super Deluxe';
  if (val.includes('city') || val.includes('rapid')) return 'City Rapid';
  return 'Executive AC';
};

/**
 * Normalizes route into 'From _ -> To _' format matching BusGo expectations
 */
export const normalizeRoute = (
  rawRoute?: string | null,
  rawOrigin?: string | null,
  rawDestination?: string | null
): { route: string; origin: string; destination: string } => {
  let origin = (rawOrigin || '').trim();
  let destination = (rawDestination || '').trim();
  const routeStr = (rawRoute || '').trim();

  if (routeStr) {
    if (routeStr.includes('->')) {
      const parts = routeStr.split('->');
      const o = parts[0].trim().replace(/^From\s*/i, '').trim();
      const d = parts[1].trim().replace(/^To\s*/i, '').trim();
      if (!origin && o) origin = o;
      if (!destination && d) destination = d;
    } else if (/\s+to\s+/i.test(routeStr)) {
      const parts = routeStr.split(/\s+to\s+/i);
      const o = parts[0].trim().replace(/^From\s*/i, '').trim();
      const d = parts[1].trim().replace(/^To\s*/i, '').trim();
      if (!origin && o) origin = o;
      if (!destination && d) destination = d;
    }
  }

  if (!origin) origin = routeStr || 'Grand Central Terminal';
  if (!destination) destination = 'Metro Central';

  const route = `From ${origin} -> To ${destination}`;
  return { route, origin, destination };
};

/**
 * Formats time string to strict 'HH:MM:SS'
 */
export const formatTimeString = (rawTime?: string | null): string => {
  if (!rawTime) return '00:00:00';
  const trimmed = rawTime.trim();

  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{1}:\d{2}:\d{2}$/.test(trimmed)) {
    return `0${trimmed}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [h, m] = trimmed.split(':');
    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return formatTimeHHMMSS(parsed);
  }
  return '00:00:00';
};

/**
 * Safely parses amenities list
 */
export const parseAmenities = (rawAmenities?: string[] | string | null): string[] => {
  if (!rawAmenities) return ['AC Climate Control', 'WiFi', 'USB Charging'];
  if (Array.isArray(rawAmenities)) {
    const list = rawAmenities.map(String).map((s) => s.trim()).filter(Boolean);
    return list.length > 0 ? list : ['AC Climate Control', 'WiFi', 'USB Charging'];
  }
  if (typeof rawAmenities === 'string') {
    const trimmed = rawAmenities.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const list = trimmed
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^"/, '').replace(/"$/, ''))
        .filter(Boolean);
      return list.length > 0 ? list : ['AC Climate Control', 'WiFi', 'USB Charging'];
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(String).map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        // ignore JSON parse error
      }
    }
    const list = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
    return list.length > 0 ? list : ['AC Climate Control', 'WiFi', 'USB Charging'];
  }
  return ['AC Climate Control', 'WiFi', 'USB Charging'];
};

/**
 * Clean mapping layer transforming a Supabase row and associated bookings to a Bus model
 */
export const mapSupabaseRowToBus = (
  row: SupabaseBusRow,
  bookings: SupabaseBookingRow[] = []
): Bus => {
  const nameParts = (row.bus_name || '').split('|').map((s) => s.trim());

  const id = String(row.id);
  const busNumber =
    row.bus_number?.trim() ||
    row.busNumber?.trim() ||
    (nameParts.length > 0 && nameParts[0] ? nameParts[0] : `BUS-${id}`);

  const plateNumber =
    row.plate_number?.trim() ||
    row.plateNumber?.trim() ||
    `BUS-${id}`;

  const operator =
    row.operator?.trim() ||
    (nameParts.length > 1 && nameParts[1] ? nameParts[1] : 'BusGo Transit');

  const { category, defaultLabel } = mapBusCategory(
    row.status || row.category || (nameParts.length > 3 ? nameParts[3] : undefined)
  );

  const categoryLabel =
    row.category_label?.trim() ||
    row.categoryLabel?.trim() ||
    defaultLabel;

  const busType = mapBusType(
    row.bus_type || row.busType || (nameParts.length > 2 ? nameParts[2] : undefined)
  );

  const { route, origin, destination } = normalizeRoute(
    row.route,
    row.origin,
    row.destination
  );

  const platformGate =
    row.platform_gate?.trim() ||
    row.platformGate?.trim() ||
    (category === 'standby'
      ? 'Gate 1 (Platform 1)'
      : category === 'just_arrived'
        ? 'Arrival Dock 1'
        : undefined);

  const timeFormatted = formatTimeString(
    row.time_formatted || row.timeFormatted || row.schedule_time
  );

  const schedule_time =
    row.schedule_time?.trim() ||
    row.time_formatted?.trim() ||
    row.timeFormatted?.trim() ||
    timeFormatted;

  const timeLabel =
    row.time_label?.trim() ||
    row.timeLabel?.trim() ||
    (category === 'standby'
      ? 'Scheduled Departure'
      : category === 'ongoing'
        ? 'Estimated Time to Next Stop'
        : 'Touchdown Arrival Time');

  const countdownSeconds =
    row.countdown_seconds != null && !isNaN(Number(row.countdown_seconds))
      ? Number(row.countdown_seconds)
      : row.countdownSeconds != null && !isNaN(Number(row.countdownSeconds))
        ? Number(row.countdownSeconds)
        : category === 'standby'
          ? 1800
          : category === 'ongoing'
            ? 1200
            : undefined;

  const speedKmH =
    row.speed_kmh != null && !isNaN(Number(row.speed_kmh))
      ? Number(row.speed_kmh)
      : row.speedKmH != null && !isNaN(Number(row.speedKmH))
        ? Number(row.speedKmH)
        : category === 'ongoing'
          ? 65
          : undefined;

  const nextStop =
    row.next_stop?.trim() ||
    row.nextStop?.trim() ||
    (category === 'ongoing' ? `${destination} Junction` : undefined);

  const turnaroundTime =
    row.turnaround_time?.trim() ||
    row.turnaroundTime?.trim() ||
    (category === 'just_arrived' ? 'Turnaround prep: next departure in 30 mins' : undefined);

  const priceNum =
    row.price != null && !isNaN(Number(row.price))
      ? Number(row.price)
      : row.price_per_trip != null && !isNaN(Number(row.price_per_trip))
        ? Number(row.price_per_trip)
        : row.pricePerTrip != null && !isNaN(Number(row.pricePerTrip))
          ? Number(row.pricePerTrip)
          : 20.0;

  const pricePerTripNum =
    row.price_per_trip != null && !isNaN(Number(row.price_per_trip))
      ? Number(row.price_per_trip)
      : row.pricePerTrip != null && !isNaN(Number(row.pricePerTrip))
        ? Number(row.pricePerTrip)
        : priceNum;

  const currency = row.currency?.trim() || '₱';

  const total_seats = 40;
  const totalSeats = 40;

  const amenities = parseAmenities(row.amenities);

  const rating =
    row.rating != null && !isNaN(Number(row.rating))
      ? Number(row.rating)
      : 4.8;

  // Retrieve booked-seat information from Supabase records
  const bookedSeatsSet = new Set<string>();

  // 1. From row.booked_seats / row.bookedSeats if present on the bus row
  const rawRowBooked = row.booked_seats || row.bookedSeats;
  if (Array.isArray(rawRowBooked)) {
    rawRowBooked.forEach((s) => bookedSeatsSet.add(String(s).trim()));
  } else if (typeof rawRowBooked === 'string') {
    const trimmed = rawRowBooked.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      trimmed
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^"/, '').replace(/"$/, ''))
        .filter(Boolean)
        .forEach((s) => bookedSeatsSet.add(s));
    } else {
      trimmed
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => bookedSeatsSet.add(s));
    }
  }

  // 2. From bookings table records matching this bus
  const matchedBookings = bookings.filter((b) => {
    const bBusId = String(b.bus_id ?? b.busId ?? '');
    const bBusNum = String(b.bus_number ?? b.busNumber ?? '');
    return (bBusId && bBusId === id) || (bBusNum && bBusNum.toLowerCase() === busNumber.toLowerCase());
  });

  for (const b of matchedBookings) {
    if (b.status && b.status.toUpperCase() === 'CANCELLED') continue;
    const selSeats = b.selected_seats || b.selectedSeats;
    if (Array.isArray(selSeats)) {
      selSeats.forEach((s) => bookedSeatsSet.add(String(s).trim()));
    } else if (typeof selSeats === 'string') {
      selSeats
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => bookedSeatsSet.add(s));
    }
  }

  let seats: Seat[];
  let availableSeats: number;

  if (bookedSeatsSet.size > 0) {
    // Database contains explicit booked-seat numbers
    const bookedArray = Array.from(bookedSeatsSet);
    seats = generateSeats(bookedArray);
    availableSeats = seats.filter((s) => !s.isBooked).length;
  } else if (row.available_seats != null || row.availableSeats != null) {
    // Database has a reliable availability value: use as source of truth and keep seat display synchronized
    const rawAvail = Number(row.available_seats ?? row.availableSeats);
    const dbAvailable = isNaN(rawAvail) ? 40 : Math.max(0, Math.min(40, rawAvail));
    const bookedCount = 40 - dbAvailable;
    const derivedBookedSeats = ALL_40_SEAT_IDS.slice(0, bookedCount);
    seats = generateSeats(derivedBookedSeats);
    availableSeats = dbAvailable;
  } else {
    // Default fallback: all seats unbooked
    seats = generateSeats([]);
    availableSeats = 40;
  }

  const available_seats = availableSeats;
  const location = row.location?.trim() || undefined;

  return {
    id,
    busNumber,
    plateNumber,
    operator,
    category,
    categoryLabel,
    busType,
    route,
    origin,
    destination,
    location,
    platformGate,
    timeFormatted,
    schedule_time,
    timeLabel,
    countdownSeconds,
    speedKmH,
    nextStop,
    turnaroundTime,
    price: priceNum,
    pricePerTrip: pricePerTripNum,
    currency,
    total_seats,
    totalSeats,
    available_seats,
    availableSeats,
    seats,
    amenities,
    rating,
  };
};

export const DEFAULT_FLEET_SEED_ROWS: Array<{
  bus_name: string;
  route: string;
  schedule_time: string;
  price: number;
  available_seats: number;
  total_seats: number;
  status: string;
}> = [
    { bus_name: 'SCC-101 | San Carlos - Canlaon', route: 'From San Carlos City -> To Canlaon City', schedule_time: '06:00:00', price: 80.00, available_seats: 40, total_seats: 40, status: 'standby' },
    { bus_name: 'SCC-102 | San Carlos - Canlaon', route: 'From San Carlos City -> To Canlaon City', schedule_time: '09:00:00', price: 80.00, available_seats: 40, total_seats: 40, status: 'standby' },
    { bus_name: 'SCC-103 | San Carlos - Calatrava', route: 'From San Carlos City -> To Calatrava', schedule_time: '06:30:00', price: 55.00, available_seats: 40, total_seats: 40, status: 'standby' },
    { bus_name: 'SCC-104 | San Carlos - Calatrava', route: 'From San Carlos City -> To Calatrava', schedule_time: '10:00:00', price: 55.00, available_seats: 40, total_seats: 40, status: 'standby' },
    { bus_name: 'SCC-105 | San Carlos - Quezon', route: 'From San Carlos City -> To Quezon, Bukidnon', schedule_time: '07:00:00', price: 120.00, available_seats: 40, total_seats: 40, status: 'standby' },
    { bus_name: 'SCC-106 | San Carlos - Quezon', route: 'From San Carlos City -> To Quezon, Bukidnon', schedule_time: '12:00:00', price: 120.00, available_seats: 40, total_seats: 40, status: 'standby' },
    { bus_name: 'SCC-201 | San Carlos - Canlaon', route: 'From San Carlos City -> To Canlaon City', schedule_time: '07:45:00', price: 80.00, available_seats: 38, total_seats: 40, status: 'ongoing' },
    { bus_name: 'SCC-202 | San Carlos - Calatrava', route: 'From San Carlos City -> To Calatrava', schedule_time: '08:15:00', price: 55.00, available_seats: 35, total_seats: 40, status: 'ongoing' },
    { bus_name: 'SCC-301 | Canlaon - San Carlos', route: 'From Canlaon City -> To San Carlos City', schedule_time: '05:30:00', price: 80.00, available_seats: 40, total_seats: 40, status: 'just_arrived' },
    { bus_name: 'SCC-302 | Calatrava - San Carlos', route: 'From Calatrava -> To San Carlos City', schedule_time: '05:45:00', price: 55.00, available_seats: 40, total_seats: 40, status: 'just_arrived' },
  ];

/**
 * SQL script to seed the busses table with San Carlos City fleet.
 * Run this in Supabase Dashboard > SQL Editor after running supabase_migration.sql
 */
export const SQL_SEED_SCRIPT = `-- BusGo Fleet Seeder for San Carlos City Bus Terminal
-- Run AFTER supabase_migration.sql (which adds the status and total_seats columns)
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
`;

/**
 * Generates an in-memory preview of the 10 standard BusGo buses,
 * strictly generating exactly 40 seats per bus using generateSeats().
 */
export const getDefaultFleetPreviewBuses = (): Bus[] => {
  return DEFAULT_FLEET_SEED_ROWS.map((row, idx) => {
    return mapSupabaseRowToBus({
      id: idx + 1,
      bus_name: row.bus_name,
      route: row.route,
      schedule_time: row.schedule_time,
      price: row.price,
      available_seats: row.available_seats,
    });
  });
};

export interface FetchBusesResult {
  buses: Bus[];
  isTableEmpty: boolean;
  error: {
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null;
}

/**
 * Loads real bus records from Supabase 'busses' table and associates any bookings.
 * Features thorough console debugging displaying data, error details, and empty table warnings.
 */
export const fetchBusesDetailed = async (): Promise<FetchBusesResult> => {
  try {
    console.log('🔄 [Supabase] Executing query: supabase.from("busses").select("*") ...');

    const { data, error, status, statusText } = await supabase
      .from('busses')
      .select('*');

    console.log(`📦 [Supabase] Response Status: ${status} ${statusText || ''}`);

    if (error) {
      console.error('❌ [Supabase] Query error on "busses" table:');
      console.error('   • Message:', error.message);
      console.error('   • Code   :', error.code);
      console.error('   • Details:', error.details);
      console.error('   • Hint   :', error.hint);
      return {
        buses: [],
        isTableEmpty: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      };
    }



    console.log(`✅ [Supabase] Successfully fetched ${data.length} row(s) from "busses" table:`, data);

    // Attempt to query bookings table to attach any live booked seats
    let bookingsData: SupabaseBookingRow[] = [];
    try {
      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select('bus_id, bus_number, selected_seats, status');
      if (!bError && Array.isArray(bData)) {
        bookingsData = bData as SupabaseBookingRow[];
      }
    } catch (bookingErr) {
      console.warn('Note: bookings table lookup skipped:', bookingErr);
    }

    const mappedBuses = (data as SupabaseBusRow[]).map((row) =>
      mapSupabaseRowToBus(row, bookingsData)
    );

    return {
      buses: mappedBuses,
      isTableEmpty: false,
      error: null,
    };
  } catch (err: any) {
    console.error('❌ [Supabase] Unexpected exception in fetchBusesDetailed:', err);
    return {
      buses: [],
      isTableEmpty: false,
      error: {
        message: err?.message || String(err),
      },
    };
  }
};

/**
 * Loads real bus records from Supabase 'busses' table.
 * Preserves Promise<Bus[]> signature for existing callers.
 */
export const fetchBuses = async (): Promise<Bus[]> => {
  const result = await fetchBusesDetailed();
  return result.buses;
};

/**
 * Fictional mock bus fleet removed.
 * Kept as an empty array for backward compatibility with existing imports.
 */
export const INITIAL_BUSES: Bus[] = [];