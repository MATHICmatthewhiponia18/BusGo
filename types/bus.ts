export type BusCategory = 'standby' | 'ongoing' | 'just_arrived' | 'temporarily_closed';

export interface Seat {
  id: string;
  row: number;
  col: string; // 'A' | 'B' | 'C' | 'D'
  isBooked: boolean;
  type: 'window' | 'aisle';
}

export interface Bus {
  id: string;
  busNumber: string;
  plateNumber: string;
  operator: string;
  category: BusCategory;
  categoryLabel: string;
  busType: 'Executive AC' | 'Luxury Sleeper' | 'Express Transit' | 'Super Deluxe' | 'City Rapid';
  route: string; // 'From _ -> To _' format matching Supabase busses table
  origin: string;
  destination: string;
  location?: string; // Removed departure location to match database's busses table
  timeFormatted: string; // 'HH:MM:SS'
  timeLabel: string; // e.g. 'Departure Time', 'ETA / Next Stop', 'Arrived At'
  countdownSeconds?: number; // for dynamic countdown
  price: number; // Matches Supabase busses.price column
  pricePerTrip: number; // e.g. 24.50
  currency: string; // e.g. '$' or '₱'
  available_seats: number; // Matches Supabase busses.available_seats column
  availableSeats: number;
  total_seats: number;
  totalSeats: number;
  seats: Seat[];
  amenities: string[]; // e.g. ['WiFi', 'AC', 'USB Charging', 'Reclining Seats']
  speedKmH?: number; // for ongoing buses
  nextStop?: string; // for ongoing buses
  turnaroundTime?: string; // for just arrived buses
  platformGate?: string;
  rating: number;
  schedule_time?: string;
}

export type UserRole = 'admin' | 'passenger';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface Booking {
  id: string;
  bookingRef: string;
  busId: string;
  busNumber: string;
  operator: string;
  busType: string;
  route: string; // 'From _ -> To _'
  origin: string;
  destination: string;
  departureLocation?: string; // Removed departure location
  departureTime: string; // HH:MM:SS
  price: number;
  pricePerTrip: number;
  selectedSeats: string[]; // e.g. ['3A', '3B']
  passengerName: string;
  passengerPhone: string;
  paymentMethod: 'wallet' | 'card' | 'cash';
  subtotal: number;
  serviceFee: number;
  discount: number;
  totalPrice: number;
  bookedAt: string; // HH:MM:SS
  status: 'CONFIRMED' | 'BOARDED' | 'COMPLETED' | 'CANCELLED' | string;
  departureDate?: string;
  ticketNumber?: string;
  busName?: string;
  fare?: number;
  passengerEmail?: string;
}

export type ScreenState =
  | 'auth'
  | 'second_display'
  | 'main_menu'
  | 'confirm_booking'
  | 'done'
  | 'admin_dashboard'
  | 'my_tickets';

