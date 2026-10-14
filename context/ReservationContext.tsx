import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bus, BusCategory, Seat, User, UserRole, Booking, ScreenState } from '../types/bus';
import {
  INITIAL_BUSES,
  fetchBuses,
  fetchBusesDetailed,
  formatTimeHHMMSS,
  generateSeats,
  mapSupabaseRowToBus,
  DEFAULT_FLEET_SEED_ROWS,
  getDefaultFleetPreviewBuses,
  SQL_SEED_SCRIPT,
} from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface ReservationContextType {
  user: User | null;
  screen: ScreenState;
  buses: Bus[];
  systemTime: string;
  searchQuery: string;
  selectedCategory: 'all' | BusCategory;
  selectedBus: Bus | null;
  selectedSeats: string[];
  currentBooking: Booking | null;
  bookings: Booking[];
  isBookingsLoading: boolean;
  bookingsError: string | null;
  fetchUserBookings: (email: string) => Promise<void>;
  isMyBookingsOpen: boolean;
  isSupabaseConnected: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  isAdmin: boolean;
  isTableEmpty: boolean;
  isLoadingBuses: boolean;
  supabaseError: { message: string; code?: string; details?: string; hint?: string } | null;
  sqlSeedScript: string;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: 'all' | BusCategory) => void;
  setIsMyBookingsOpen: (open: boolean) => void;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  selectBusForBooking: (bus: Bus) => void;
  toggleSeat: (seatId: string) => void;
  confirmBooking: (
    passengerName: string,
    passengerPhone: string,
    paymentMethod: 'wallet' | 'card' | 'cash',
    promoDiscount?: number
  ) => Promise<boolean>;
  backToMainMenu: () => void;
  backToSecondDisplay: () => void;
  goToScreen: (screen: ScreenState) => void;
  refreshBuses: () => Promise<void>;
  loadPreviewFleet: () => void;
  addBus: (busData: {
    busNumber: string;
    operator: string;
    busType: Bus['busType'];
    category: BusCategory;
    origin: string;
    destination: string;
    scheduleTime: string;
    price: number;
    availableSeats?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  updateBus: (id: string, updates: Partial<Bus>) => Promise<{ success: boolean; error?: string }>;
  deleteBus: (id: string) => Promise<{ success: boolean; error?: string }>;
  seedFleetToSupabase: () => Promise<{ success: boolean; count: number; error?: string }>;
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<ScreenState>('auth');
  const [buses, setBuses] = useState<Bus[]>(INITIAL_BUSES);
  const [systemTime, setSystemTime] = useState<string>(formatTimeHHMMSS());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | BusCategory>('all');
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState<boolean>(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState<boolean>(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(isSupabaseConfigured);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isTableEmpty, setIsTableEmpty] = useState<boolean>(false);
  const [isLoadingBuses, setIsLoadingBuses] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<{
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null>(null);

  // Pre-registered administrator (Luck Voltia) and registered users registry
  const [registeredUsers, setRegisteredUsers] = useState<
    Map<string, { name: string; email: string; phone: string; pass: string; role: UserRole }>
  >(
    new Map([
      [
        'luckvoltia@busgo.com',
        {
          name: 'Luck Voltia',
          email: 'luckvoltia@busgo.com',
          phone: '+63 917 890 4421',
          pass: 'admin123',
          role: 'admin',
        },
      ],
    ])
  );

  const isAdmin = user?.role === 'admin';

  // 1. Check Supabase Auth Session on Mount & Listen for changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Supabase Auth error:', error);
          return;
        }

        if (data.session) {
          console.log('User is logged in:', data.session.user);
        } else {
          console.log('Supabase connected, but no user is logged in.');
        }
      } catch (error) {
        console.error('Connection error:', error);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          const u = session.user;
          const meta = u.user_metadata || {};
          const namePart = meta.name || u.email?.split('@')[0] || 'Passenger';
          const userRole: UserRole =
            meta.role === 'admin' || u.email?.toLowerCase() === 'luckvoltia@busgo.com'
              ? 'admin'
              : 'passenger';

          setUser({
            id: u.id,
            name: namePart,
            email: u.email || '',
            phone: meta.phone || '+63 9XX XXX XXXX',
            role: userRole,
          });
          fetchUserBookings(u.email || '');
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // 2. Fetch buses from Supabase table or subscribe to live changes
  const fetchBusesFromSupabase = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingBuses(true);
    try {
      const result = await fetchBusesDetailed();
      setBuses(result.buses);
      setIsTableEmpty(result.isTableEmpty);
      setSupabaseError(result.error);
      if (result.buses.length > 0) {
        setIsSupabaseConnected(true);
      }
    } catch (err: any) {
      console.warn('Error fetching buses from Supabase:', err);
      setSupabaseError({ message: err?.message || String(err) });
    } finally {
      setIsLoadingBuses(false);
    }
  };

  useEffect(() => {
    fetchBusesFromSupabase();

    if (!isSupabaseConfigured) return;

    // Subscribe to real-time postgres changes
    const channel = supabase
      .channel('public:busses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'busses' },
        () => {
          fetchBusesFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch bookings for logged-in passenger
  const fetchUserBookings = async (email: string) => {
    if (!isSupabaseConfigured || !email) return;
    setIsBookingsLoading(true);
    setBookingsError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('passenger_email', cleanEmail)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Bookings fetch note:', error.message);
        setBookingsError(error.message);
        setIsBookingsLoading(false);
        return;
      }

      if (data) {
        const mappedBookings: Booking[] = data.map((row: any) => ({
          id: String(row.id),
          bookingRef: row.booking_ref || `BG-${row.id}`,
          ticketNumber: row.booking_ref || `BG-${row.id}`,
          busId: String(row.bus_id || ''),
          busNumber: row.bus_name || row.bus_number || `Bus #${row.bus_id}`,
          busName: row.bus_name || row.bus_number || `Bus #${row.bus_id}`,
          operator: row.operator || 'Ceres Liner',
          busType: row.bus_type || 'Executive AC',
          route: row.route || `From ${row.origin || 'San Carlos'} -> To ${row.destination || 'Terminal'}`,
          origin: row.origin || 'San Carlos City',
          destination: row.destination || 'Terminal',
          departureLocation: row.departure_location,
          departureDate: row.departure_date || (row.created_at ? new Date(row.created_at).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' }) : 'Today'),
          departureTime: row.departure_time || '00:00:00',
          price: Number(row.price || row.price_per_seat || row.price_per_trip || 0),
          pricePerTrip: Number(row.price_per_trip || row.price_per_seat || row.price || 0),
          fare: Number(row.total_price || row.price || 0),
          selectedSeats: row.selected_seats || [],
          passengerName: row.passenger_name || 'Passenger',
          passengerPhone: row.passenger_phone || '',
          passengerEmail: row.passenger_email || cleanEmail,
          paymentMethod: row.payment_method || 'cash',
          subtotal: Number(row.subtotal || row.total_price || 0),
          serviceFee: Number(row.service_fee || 2.5),
          discount: Number(row.discount || 0),
          totalPrice: Number(row.total_price || 0),
          bookedAt: row.booked_at || '',
          status: row.status || 'CONFIRMED',
        }));

        setBookings(mappedBookings);
      }
    } catch (err: any) {
      console.warn('Failed to load user bookings from Supabase:', err);
      setBookingsError(err?.message || 'Failed to fetch tickets from Supabase.');
    } finally {
      setIsBookingsLoading(false);
    }
  };

  // Live ticking clock in HH:MM:SS
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(formatTimeHHMMSS());

      // Dynamically tick countdowns
      setBuses((prevBuses) =>
        prevBuses.map((bus) => {
          if (bus.countdownSeconds && bus.countdownSeconds > 0) {
            const nextSec = bus.countdownSeconds - 1;
            const hrs = String(Math.floor(nextSec / 3600)).padStart(2, '0');
            const mins = String(Math.floor((nextSec % 3600) / 60)).padStart(2, '0');
            const secs = String(nextSec % 60).padStart(2, '0');
            return {
              ...bus,
              countdownSeconds: nextSec,
              timeFormatted: `${hrs}:${mins}:${secs}`,
            };
          }
          return bus;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail) {
      setAuthError('Email is required');
      return false;
    }
    if (!cleanPass) {
      setAuthError('Password is required');
      return false;
    }

    if (!isSupabaseConfigured) {
      setAuthError('Supabase authentication is not configured.');
      return false;
    }

    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      setIsAuthLoading(false);

      if (error) {
        let userMsg = error.message;
        if (error.message.includes('Invalid login credentials')) {
          userMsg = 'Invalid login credentials. Please check your email and password.';
        } else if (error.message.includes('Email not confirmed')) {
          userMsg = 'Please confirm your email address before signing in.';
        } else if (
          error.message.toLowerCase().includes('fetch') ||
          error.message.toLowerCase().includes('network')
        ) {
          userMsg = 'Network connection failed. Please check your internet connection.';
        }
        setAuthError(userMsg);
        return false;
      }

      if (data && data.user) {
        const meta = data.user.user_metadata || {};
        const namePart = meta.name || cleanEmail.split('@')[0] || 'Passenger';
        const userRole: UserRole =
          meta.role === 'admin' || cleanEmail === 'luckvoltia@busgo.com'
            ? 'admin'
            : 'passenger';

        const loggedInUser: User = {
          id: data.user.id,
          name: namePart,
          email: data.user.email || cleanEmail,
          phone: meta.phone || '+63 9XX XXX XXXX',
          role: userRole,
        };

        setUser(loggedInUser);
        setScreen(userRole === 'admin' ? 'admin_dashboard' : 'second_display');
        fetchUserBookings(data.user.email || cleanEmail);
        return true;
      }
    } catch (err: any) {
      setIsAuthLoading(false);
      setAuthError('Unable to connect to authentication server. Please check your network.');
      return false;
    }

    setAuthError('Invalid credentials. Please try again.');
    return false;
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    pass: string
  ): Promise<boolean> => {
    setAuthError(null);
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPass = pass.trim();

    if (!cleanName) {
      setAuthError('Full name is required');
      return false;
    }
    if (!cleanEmail) {
      setAuthError('Email is required');
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setAuthError('Enter a valid email address');
      return false;
    }
    if (!cleanPhone) {
      setAuthError('Phone number is required');
      return false;
    }
    if (cleanPass.length < 8) {
      setAuthError('Password must be at least 8 characters');
      return false;
    }

    if (!isSupabaseConfigured) {
      setAuthError('Supabase is not configured.');
      return false;
    }

    const userRole: UserRole = cleanEmail === 'luckvoltia@busgo.com' ? 'admin' : 'passenger';

    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            name: cleanName,
            phone: cleanPhone,
            role: userRole,
          },
        },
      });

      setIsAuthLoading(false);

      if (error) {
        let userMsg = error.message;
        if (
          error.message.includes('User already registered') ||
          error.message.includes('already registered')
        ) {
          userMsg = 'An account with this email already exists. Please sign in instead.';
        } else if (
          error.message.includes('weak') ||
          error.message.includes('Password should be at least')
        ) {
          userMsg = 'Password must be at least 8 characters.';
        } else if (
          error.message.toLowerCase().includes('fetch') ||
          error.message.toLowerCase().includes('network')
        ) {
          userMsg = 'Network connection failed. Unable to reach authentication server.';
        } else if (error.message.includes('Unable to validate email address')) {
          userMsg = 'Enter a valid email address.';
        }
        setAuthError(userMsg);
        return false;
      }

      if (data && data.user) {
        // Handle case where user is already registered (identities array is empty)
        if (data.user.identities && data.user.identities.length === 0) {
          setAuthError('An account with this email already exists. Please sign in instead.');
          return false;
        }

        // Registration succeeded - return true so AuthView can switch to Sign In tab
        // without redirecting to authenticated screen.
        return true;
      }
    } catch (err: any) {
      setIsAuthLoading(false);
      setAuthError('Unable to connect to authentication server. Please check your network.');
      return false;
    }

    setAuthError('Registration could not be completed.');
    return false;
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    setUser(null);
    setScreen('auth');
    setSelectedBus(null);
    setSelectedSeats([]);
  };

  const selectBusForBooking = (bus: Bus) => {
    setSelectedBus(bus);
    const firstAvailable = bus.seats.find((s) => !s.isBooked);
    setSelectedSeats(firstAvailable ? [firstAvailable.id] : []);
    setScreen('confirm_booking');
  };

  const toggleSeat = (seatId: string) => {
    if (!selectedBus) return;
    const seat = selectedBus.seats.find((s) => s.id === seatId);
    if (!seat || seat.isBooked) return;

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        if (prev.length >= 6) return prev;
        return [...prev, seatId];
      }
    });
  };

  const confirmBooking = async (
    passengerName: string,
    passengerPhone: string,
    paymentMethod: 'wallet' | 'card' | 'cash',
    promoDiscount: number = 0
  ): Promise<boolean> => {
    if (!selectedBus || selectedSeats.length === 0) return false;

    const baseFare = selectedBus.price * selectedSeats.length;
    const terminalFee = 2.5;
    const totalAmount = Math.max(0, baseFare + terminalFee - promoDiscount);
    const bookingRef = `BG-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookedTime = formatTimeHHMMSS();

    const departureDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      bookingRef,
      ticketNumber: bookingRef,
      busId: selectedBus.id,
      busNumber: selectedBus.busNumber,
      busName: selectedBus.busNumber,
      operator: selectedBus.operator,
      busType: selectedBus.busType,
      route: selectedBus.route || `From ${selectedBus.origin} -> To ${selectedBus.destination}`,
      origin: selectedBus.origin,
      destination: selectedBus.destination,
      departureDate,
      departureTime: selectedBus.timeFormatted,
      price: selectedBus.price,
      pricePerTrip: selectedBus.pricePerTrip,
      fare: totalAmount,
      selectedSeats: [...selectedSeats],
      passengerName: passengerName || user?.name || 'Valued Passenger',
      passengerPhone: passengerPhone || user?.phone || 'N/A',
      passengerEmail: user?.email || '',
      paymentMethod,
      subtotal: baseFare,
      serviceFee: terminalFee,
      discount: promoDiscount,
      totalPrice: totalAmount,
      bookedAt: bookedTime,
      status: 'CONFIRMED',
    };

    // Update available_seats in Supabase busses table and insert into bookings table
    if (isSupabaseConfigured) {
      try {
        const newAvailable = Math.max(0, selectedBus.availableSeats - selectedSeats.length);
        const parsedBusId = Number(selectedBus.id);
        if (!isNaN(parsedBusId)) {
          await supabase
            .from('busses')
            .update({ available_seats: newAvailable })
            .eq('id', parsedBusId);

          console.log('✅ Updated available seats in Supabase');
        }

        // Insert booking record into Supabase bookings table
        const { error: insertBookingErr } = await supabase.from('bookings').insert([
          {
            booking_ref: bookingRef,
            bus_id: !isNaN(parsedBusId) ? parsedBusId : null,
            bus_name: selectedBus.busNumber,
            operator: selectedBus.operator,
            bus_type: selectedBus.busType,
            route: newBooking.route,
            origin: selectedBus.origin,
            destination: selectedBus.destination,
            departure_time: selectedBus.timeFormatted,
            departure_date: departureDate,
            passenger_name: newBooking.passengerName,
            passenger_phone: newBooking.passengerPhone,
            passenger_email: user?.email || '',
            selected_seats: selectedSeats,
            seat_count: selectedSeats.length,
            price_per_seat: selectedBus.price,
            total_price: totalAmount,
            payment_method: paymentMethod,
            status: 'CONFIRMED',
            booked_at: bookedTime,
          },
        ]);
        if (insertBookingErr) {
          console.log('Supabase booking insert note:', insertBookingErr.message);
        } else {
          console.log('✅ Supabase booking recorded successfully');
        }
      } catch (dbErr) {
        console.warn('Supabase booking / seat update warning:', dbErr);
      }
    }

    // Update local bus state
    setBuses((prevBuses) =>
      prevBuses.map((b) => {
        if (b.id === selectedBus.id) {
          const updatedSeats = b.seats.map((s) =>
            selectedSeats.includes(s.id) ? { ...s, isBooked: true } : s
          );
          const newAvailable = updatedSeats.filter((s) => !s.isBooked).length;
          return {
            ...b,
            seats: updatedSeats,
            availableSeats: newAvailable,
            available_seats: newAvailable,
          };
        }
        return b;
      })
    );

    setCurrentBooking(newBooking);
    setBookings((prev) => [newBooking, ...prev]);
    setScreen('done');
    return true;
  };

  const backToMainMenu = () => {
    setSelectedBus(null);
    setSelectedSeats([]);
    setScreen('second_display');
  };

  const backToSecondDisplay = backToMainMenu;

  const goToScreen = (newScreen: ScreenState) => {
    if (newScreen === 'admin_dashboard' && user?.role !== 'admin') {
      console.warn('Access denied: Administrator role required to open Admin Dashboard.');
      return;
    }
    setScreen(newScreen);
  };

  const refreshBuses = async () => {
    await fetchBusesFromSupabase();
  };

  const loadPreviewFleet = () => {
    const previewBuses = getDefaultFleetPreviewBuses();
    setBuses(previewBuses);
    setIsTableEmpty(false);
  };

  // Administrator CRUD Operations
  const addBus = async (busData: {
    busNumber: string;
    operator: string;
    busType: Bus['busType'];
    category: BusCategory;
    origin: string;
    destination: string;
    scheduleTime: string;
    price: number;
    availableSeats?: number;
  }): Promise<{ success: boolean; error?: string }> => {
    if (user?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator role required.' };
    }

    const busName = `${busData.busNumber.trim()} | ${busData.operator.trim()} | ${busData.busType} | ${busData.category}`;
    const route = `From ${busData.origin.trim()} -> To ${busData.destination.trim()}`;
    const priceNum = Number(busData.price);
    const availableSeatsNum = Number(busData.availableSeats ?? 40);

    const rowToInsert = {
      bus_name: busName,
      route,
      schedule_time: busData.scheduleTime.trim(),
      price: priceNum,
      available_seats: availableSeatsNum,
    };

    let newId: string | number = `admin-${Date.now()}`;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('busses').insert([rowToInsert]).select();
        if (error) {
          console.warn('⚠️ Supabase busses insert warning:', error);
          // Return notice if RLS policy blocked insert
          if (error.code === '42501') {
            console.error('RLS policy error on INSERT:', error.message);
          }
        } else if (data && data.length > 0) {
          newId = data[0].id;
        }
      } catch (err: any) {
        console.warn('Supabase insert exception:', err);
      }
    }

    // Always create local bus with 40 generated seats
    const newBus = mapSupabaseRowToBus({
      id: newId,
      ...rowToInsert,
    });

    setBuses((prev) => [newBus, ...prev]);
    setIsTableEmpty(false);
    return { success: true };
  };

  const updateBus = async (
    id: string,
    updates: Partial<Bus>
  ): Promise<{ success: boolean; error?: string }> => {
    if (user?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator role required.' };
    }

    const numericId = Number(id);
    if (isSupabaseConfigured && !isNaN(numericId)) {
      try {
        const supabaseUpdates: Record<string, any> = {};
        if (updates.price != null) supabaseUpdates.price = Number(updates.price);
        if (updates.availableSeats != null) supabaseUpdates.available_seats = Number(updates.availableSeats);
        if (updates.timeFormatted) supabaseUpdates.schedule_time = updates.timeFormatted;
        if (updates.schedule_time) supabaseUpdates.schedule_time = updates.schedule_time;

        if (Object.keys(supabaseUpdates).length > 0) {
          const { error } = await supabase.from('busses').update(supabaseUpdates).eq('id', numericId);
          if (error) {
            console.warn('Supabase update warning:', error);
          }
        }
      } catch (err) {
        console.warn('Supabase update exception:', err);
      }
    }

    // Update active bus state
    setBuses((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const updatedAvailable = updates.availableSeats ?? b.availableSeats;
          return {
            ...b,
            ...updates,
            availableSeats: updatedAvailable,
            available_seats: updatedAvailable,
          };
        }
        return b;
      })
    );

    return { success: true };
  };

  const deleteBus = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (user?.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator role required.' };
    }

    const numericId = Number(id);
    if (isSupabaseConfigured && !isNaN(numericId)) {
      try {
        const { error } = await supabase.from('busses').delete().eq('id', numericId);
        if (error) {
          console.warn('Supabase delete warning:', error);
        }
      } catch (err) {
        console.warn('Supabase delete exception:', err);
      }
    }

    setBuses((prev) => prev.filter((b) => b.id !== id));
    return { success: true };
  };

  const seedFleetToSupabase = async (): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> => {
    if (user?.role !== 'admin') {
      return { success: false, count: 0, error: 'Unauthorized: Administrator role required.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('busses')
          .select('*', { count: 'exact' });

        if (error) {
          console.error('❌ Supabase batch insert error:', error);
          // Load preview fleet into state so the user is not blocked
          loadPreviewFleet();
          return {
            success: false,
            count: DEFAULT_FLEET_SEED_ROWS.length,
            error: `Supabase RLS Policy (${error.code || '42501'}): ${error.message}. Fleet loaded in session memory. To persist permanently in Supabase, run the provided SQL setup script in your Supabase SQL Editor.`,
          };


        } else {
          console.log('✅ Successfully seeded Supabase "busses" table!');
          await fetchBusesFromSupabase();
          return { success: true, count: data?.length || DEFAULT_FLEET_SEED_ROWS.length };
        }
      } catch (err: any) {
        loadPreviewFleet();
        return {
          success: false,
          count: DEFAULT_FLEET_SEED_ROWS.length,
          error: err?.message || String(err),
        };
      }
    }

    loadPreviewFleet();
    return { success: true, count: DEFAULT_FLEET_SEED_ROWS.length };
  };

  return (
    <ReservationContext.Provider
      value={{
        user,
        screen,
        buses,
        systemTime,
        searchQuery,
        selectedCategory,
        selectedBus,
        selectedSeats,
        currentBooking,
        bookings,
        isBookingsLoading,
        bookingsError,
        fetchUserBookings,
        isMyBookingsOpen,
        isSupabaseConnected,
        isAuthLoading,
        authError,
        isAdmin,
        isTableEmpty,
        isLoadingBuses,
        supabaseError,
        sqlSeedScript: SQL_SEED_SCRIPT,
        setSearchQuery,
        setSelectedCategory,
        setIsMyBookingsOpen,
        login,
        register,
        logout,
        selectBusForBooking,
        toggleSeat,
        confirmBooking,
        backToMainMenu,
        backToSecondDisplay,
        goToScreen,
        refreshBuses,
        loadPreviewFleet,
        addBus,
        updateBus,
        deleteBus,
        seedFleetToSupabase,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = (): ReservationContextType => {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error('useReservation must be used within a ReservationProvider');
  }
  return context;
};
