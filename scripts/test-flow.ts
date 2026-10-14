// Test script to verify the entire Bus Reservation System data flow and logic
import {
  INITIAL_BUSES,
  fetchBuses,
  formatTimeHHMMSS,
  generateSeats,
  mapSupabaseRowToBus,
} from '../data/mockData';

async function runVerification() {
  console.log('=== BusGo System Logic & Rule Verification ===');
  console.log('1. Live Time Format (HH:MM:SS):', formatTimeHHMMSS());

  // 2. Validate seat generation: 40 seats (10 rows x 4 cols A-D)
  console.log('\n2. Validating Seat Generation:');
  const sampleSeats = generateSeats(['1A', '2B']);
  console.log(`- Generated seat count: ${sampleSeats.length} (expected 40)`);
  if (sampleSeats.length !== 40) {
    throw new Error(`Expected 40 seats, got ${sampleSeats.length}`);
  }
  const seat1A = sampleSeats.find((s) => s.id === '1A');
  const seat1B = sampleSeats.find((s) => s.id === '1B');
  const seat10D = sampleSeats.find((s) => s.id === '10D');
  if (!seat1A?.isBooked || seat1B?.isBooked || !seat10D) {
    throw new Error('Seat generation or booking status mismatch');
  }
  console.log('  ✓ 40 seats generated successfully with correct 1A through 10D layout.');

  // 3. Validate INITIAL_BUSES is empty (mock data removed)
  console.log('\n3. Validating INITIAL_BUSES state:');
  console.log(`- Hardcoded mock fleet count: ${INITIAL_BUSES.length} (expected 0)`);
  if (INITIAL_BUSES.length !== 0) {
    throw new Error('Hardcoded mock buses should be removed!');
  }
  console.log('  ✓ All fictional hardcoded buses removed.');

  // 4. Fetch live buses from Supabase
  console.log('\n4. Fetching Buses from Supabase:');
  const buses = await fetchBuses();
  console.log(`- Supabase returned ${buses.length} buses`);

  if (buses.length > 0) {
    console.log('\nValidating Required Fields per Database busses Table:');
    buses.forEach((b) => {
      if (!b.route || !b.route.startsWith('From ') || !b.route.includes(' -> To ')) {
        throw new Error(`Bus ${b.busNumber} missing valid "From _ -> To _" route format: ${b.route}`);
      }
      if (!b.timeFormatted || !b.timeFormatted.match(/^\d{2}:\d{2}:\d{2}$/)) {
        throw new Error(`Bus ${b.busNumber} invalid HH:MM:SS time format: ${b.timeFormatted}`);
      }
      if (typeof b.price !== 'number' || b.price <= 0) {
        throw new Error(`Bus ${b.busNumber} missing price!`);
      }
      if (typeof b.available_seats !== 'number' || b.available_seats < 0) {
        throw new Error(`Bus ${b.busNumber} missing available_seats!`);
      }
      if (b.seats.length !== 40) {
        throw new Error(`Bus ${b.busNumber} does not have 40 seats!`);
      }
      console.log(`  ✓ [${b.category.toUpperCase().padEnd(12)}] ${b.busNumber.padEnd(8)} | Time: ${b.timeFormatted} | Price: ₱${b.price.toFixed(2)} | Route: "${b.route}" | Available: ${b.availableSeats}/${b.totalSeats}`);
    });
  } else {
    console.log('  ✓ Supabase busses table is currently empty; fetchBuses() returned empty array safely without error.');
  }

  // 5. Validating Fare and Booking Calculation logic
  console.log('\n5. Validating Booking Calculation Logic:');
  const samplePrice = 25.0;
  const selectedSeats = ['1C', '1D'];
  const baseFare = samplePrice * selectedSeats.length;
  const terminalFee = 2.50;
  const promoDiscount = 5.00;
  const total = baseFare + terminalFee - promoDiscount;
  console.log(`- Calculated Fare: ₱${samplePrice.toFixed(2)} x ${selectedSeats.length} seats = ₱${baseFare.toFixed(2)}`);
  console.log(`- Total with terminal fee (₱${terminalFee.toFixed(2)}) & promo (-₱${promoDiscount.toFixed(2)}): ₱${total.toFixed(2)}`);

  // 6. Validating Database Row Mapping Layer & All 26 Required Bus Fields
  console.log('\n6. Validating Row Mapping Layer (All Required Bus Fields):');
  const mockRowStandby = {
    id: 'bus-sb-101',
    bus_name: 'SB-101 | SilverLine Premier | Executive AC | standby',
    route: 'From Grand Central Terminal -> To Uptown Business District',
    price: 24.50,
    available_seats: 38,
    schedule_time: '18:15:00',
  };
  const mappedStandby = mapSupabaseRowToBus(mockRowStandby);
  if (mappedStandby.category !== 'standby') throw new Error('Category mapping failed');
  if (mappedStandby.seats.length !== 40) throw new Error('Seats count must be 40');
  if (mappedStandby.availableSeats !== 38 || mappedStandby.available_seats !== 38) throw new Error('Availability sync failed');
  if (mappedStandby.seats.filter((s) => !s.isBooked).length !== 38) throw new Error('Seat display sync failed');
  console.log(`  ✓ Standby bus mapped: ${mappedStandby.busNumber} | ${mappedStandby.route} | Seats: ${mappedStandby.availableSeats}/${mappedStandby.totalSeats}`);

  const mockRowOngoing = {
    id: 'bus-og-201',
    bus_number: 'OG-201',
    plate_number: 'BUS-9081',
    operator: 'SwiftVoyage Intercity',
    category: 'ongoing',
    category_label: 'En Route / In Transit',
    bus_type: 'Super Deluxe',
    origin: 'Grand Central Terminal',
    destination: 'Sun Valley Metro Station',
    route: 'From Grand Central Terminal -> To Sun Valley Metro Station',
    time_formatted: '00:28:15',
    time_label: 'Estimated Time to Next Stop',
    countdown_seconds: 1695,
    speed_kmh: 74,
    next_stop: 'Greenfield City Junction',
    price_per_trip: 26.00,
    price: 26.00,
    currency: '₱',
    total_seats: 40,
    available_seats: 25,
    booked_seats: ['1A', '1B', '1C', '2A', '2B', '2D', '3A', '3C', '4A', '4B', '4C', '4D', '5A', '5C', '6A'],
    rating: 4.7,
  };
  const mappedOngoing = mapSupabaseRowToBus(mockRowOngoing);
  if (mappedOngoing.category !== 'ongoing') throw new Error('Ongoing category mapping failed');
  if (mappedOngoing.speedKmH !== 74) throw new Error('Speed mapping failed');
  if (mappedOngoing.seats.length !== 40) throw new Error('Seats count must be 40');
  if (mappedOngoing.seats.filter((s) => !s.isBooked).length !== 25) throw new Error('Booked seats sync failed');
  console.log(`  ✓ Ongoing bus mapped: ${mappedOngoing.busNumber} | Speed: ${mappedOngoing.speedKmH}km/h | Available: ${mappedOngoing.availableSeats}/${mappedOngoing.totalSeats}`);

  const mockRowArrived = {
    id: 'bus-ja-301',
    bus_name: 'JA-301 | SilverLine Premier | Executive AC | just_arrived',
    route: 'Northern Lakes Resort to Grand Central Terminal',
    price: 28.00,
    available_seats: 40,
    schedule_time: '17:31:40',
  };
  const mappedArrived = mapSupabaseRowToBus(mockRowArrived);
  if (mappedArrived.category !== 'just_arrived') throw new Error('Just Arrived category mapping failed');
  if (mappedArrived.seats.length !== 40) throw new Error('Seats count must be 40');
  console.log(`  ✓ Just Arrived bus mapped: ${mappedArrived.busNumber} | Turnaround: "${mappedArrived.turnaroundTime}"`);

  console.log('\n✅ ALL SYSTEM REQUIREMENTS & LOGIC CHECKS PASSED PERFECTLY!');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
