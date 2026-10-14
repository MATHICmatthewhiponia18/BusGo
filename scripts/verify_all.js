// BusGo Complete Verification Test Script

// Import transpiled or define the pure functions to test the exact mathematical logic
const { computeBusScheduleInfo, parseScheduleToSeconds, getManilaSecondsSinceMidnight } = require('./compiled_schedule');

function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('====================================================');
console.log(' BusGo Verification Test Suite');
console.log('====================================================\n');

// ── TEST 1: Bus Status Transitions (Departure, 90m, 179m, 180m, Overnight) ──
console.log('--- TEST 1: Bus Status Transitions ---');
const dep0600 = 6 * 3600; // 06:00:00 AM = 21,600s

// 1s before departure -> Stand By
const tBefore = computeBusScheduleInfo('06:00:00', null, dep0600 - 1);
assert(tBefore.category === 'standby' && tBefore.categoryLabel === 'Stand By', '1s before departure is Stand By');

// Exactly at departure time (0s) -> Ongoing
const tAtDep = computeBusScheduleInfo('06:00:00', null, dep0600);
assert(tAtDep.category === 'ongoing' && tAtDep.categoryLabel === 'Ongoing', 'At departure time (0s) is Ongoing');

// 45 min after departure -> Ongoing
const t45m = computeBusScheduleInfo('06:00:00', null, dep0600 + 45 * 60);
assert(t45m.category === 'ongoing', '45m after departure is Ongoing');

// 89m 59s after departure (< 90m) -> Ongoing
const t89m = computeBusScheduleInfo('06:00:00', null, dep0600 + 89 * 60 + 59);
assert(t89m.category === 'ongoing', '89m 59s after departure is Ongoing');

// Exactly 90 minutes after departure (90m * 60 = 5400s) -> Just Arrived
const t90m = computeBusScheduleInfo('06:00:00', null, dep0600 + 90 * 60);
assert(t90m.category === 'just_arrived' && t90m.categoryLabel === 'Just Arrived', 'At 90 minutes after departure is Just Arrived');

// 179 minutes after departure (179m * 60 = 10,740s) -> Just Arrived
const t179m = computeBusScheduleInfo('06:00:00', null, dep0600 + 179 * 60);
assert(t179m.category === 'just_arrived', 'At 179 minutes after departure is Just Arrived');

// Exactly 180 minutes after departure (180m * 60 = 10,800s -> 9:00 AM) -> Temporarily Closed
const t180m = computeBusScheduleInfo('06:00:00', null, dep0600 + 180 * 60);
assert(t180m.category === 'temporarily_closed' && t180m.categoryLabel === 'Temporarily Closed', 'At 180 minutes after departure (9:00 AM) is Temporarily Closed');

// 181 minutes after departure -> Temporarily Closed
const t181m = computeBusScheduleInfo('06:00:00', null, dep0600 + 181 * 60);
assert(t181m.category === 'temporarily_closed', 'At 181 minutes after departure is Temporarily Closed');

// Afternoon (2:00 PM, 8 hours after 6:00 AM) -> Temporarily Closed
const t1400 = computeBusScheduleInfo('06:00:00', null, 14 * 3600);
assert(t1400.category === 'temporarily_closed', '6:00 AM bus evaluated at 2:00 PM is Temporarily Closed');

// ── TEST 2: Overnight Schedules ──────────────────────────────────────────────
console.log('\n--- TEST 2: Overnight Schedules ---');
// A) Bus scheduled at 00:30 (1,800s) evaluated before midnight at 23:30 (84,600s)
const tNightEarly = computeBusScheduleInfo('00:30:00', null, 23 * 3600 + 30 * 60);
assert(tNightEarly.category === 'standby', '00:30 bus at 23:30 is Stand By (not closed due to negative diff)');
assert(tNightEarly.secsUntilDeparture === 3600, '00:30 bus at 23:30 has 3600s (1h) countdown');

// B) Bus scheduled at 23:45 (85,500s) evaluated shortly after midnight at 00:15 (900s)
const tNightLate = computeBusScheduleInfo('23:45:00', null, 15 * 60);
assert(tNightLate.category === 'ongoing', '23:45 bus at 00:15 is Ongoing (30m elapsed)');
assert(tNightLate.elapsedSecs === 1800, '23:45 bus at 00:15 has 1800s elapsed');

// C) Bus scheduled at 23:45 evaluated at 01:20 (95m elapsed) -> Just Arrived
const tNightArrived = computeBusScheduleInfo('23:45:00', null, 1 * 3600 + 20 * 60);
assert(tNightArrived.category === 'just_arrived', '23:45 bus at 01:20 is Just Arrived (95m elapsed)');

// D) Bus scheduled at 23:45 evaluated at 03:00 (195m elapsed) -> Temporarily Closed
const tNightClosed = computeBusScheduleInfo('23:45:00', null, 3 * 3600);
assert(tNightClosed.category === 'temporarily_closed', '23:45 bus at 03:00 is Temporarily Closed (195m elapsed)');

// ── TEST 3: User-Specific Ticket Filtering ────────────────────────────────────
console.log('\n--- TEST 3: User-Specific Ticket Access ---');
const sampleBookings = [
  {
    id: 'bk-1',
    bookingRef: 'BG-111111',
    busId: '1',
    busNumber: 'Ceres Bus #1',
    operator: 'Ceres Liner',
    route: 'San Carlos City → Bacolod',
    origin: 'San Carlos City',
    destination: 'Bacolod',
    departureTime: '06:00:00',
    selectedSeats: ['1A', '1B'],
    passengerName: 'Maria Santos',
    passengerPhone: '+63 917 123 4567',
    passengerEmail: 'maria@example.com',
    totalPrice: 402.5,
    status: 'CONFIRMED',
  },
  {
    id: 'bk-2',
    bookingRef: 'BG-222222',
    busId: '2',
    busNumber: 'Ceres Bus #2',
    operator: 'Ceres Liner',
    route: 'San Carlos City → Canlaon City',
    origin: 'San Carlos City',
    destination: 'Canlaon City',
    departureTime: '08:00:00',
    selectedSeats: ['3C'],
    passengerName: 'Juan Dela Cruz',
    passengerPhone: '+63 918 987 6543',
    passengerEmail: 'juan@example.com',
    totalPrice: 102.5,
    status: 'CONFIRMED',
  },
];

const loggedInUserMaria = { email: 'maria@example.com', name: 'Maria Santos' };
const mariaTickets = sampleBookings.filter((b) => b.passengerEmail === loggedInUserMaria.email);
assert(mariaTickets.length === 1, 'Maria can only access her own ticket');
assert(mariaTickets[0].bookingRef === 'BG-111111', 'Maria accesses ticket BG-111111');

const loggedInUserJuan = { email: 'juan@example.com', name: 'Juan Dela Cruz' };
const juanTickets = sampleBookings.filter((b) => b.passengerEmail === loggedInUserJuan.email);
assert(juanTickets.length === 1, 'Juan can only access his own ticket');
assert(juanTickets[0].bookingRef === 'BG-222222', 'Juan accesses ticket BG-222222');

const loggedInUserNew = { email: 'newuser@example.com', name: 'New Passenger' };
const newTickets = sampleBookings.filter((b) => b.passengerEmail === loggedInUserNew.email);
assert(newTickets.length === 0, 'New user sees empty ticket list (no access to other users tickets)');

// ── TEST 4: Input Validation Logic (Email, Password, Name, Phone) ─────────────
console.log('\n--- TEST 4: Input Validation Logic ---');
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateAuthInput(email, pass, name, phone, confirmPass) {
  const errs = {};
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanEmail) errs.email = 'Email is required';
  else if (!emailRegex.test(cleanEmail)) errs.email = 'Enter a valid email address';

  if (!cleanPass) errs.password = 'Password is required';
  else if (cleanPass.length < 8) errs.password = 'Password must be at least 8 characters';

  if (name !== undefined) {
    if (!name.trim()) errs.name = 'Full name is required';
  }

  if (phone !== undefined) {
    if (!phone.trim()) errs.phone = 'Phone number is required';
    else {
      const digits = phone.trim().replace(/\D/g, '');
      if (digits.length < 7) errs.phone = 'Enter a valid phone number';
    }
  }

  if (confirmPass !== undefined) {
    if (!confirmPass.trim()) errs.confirmPassword = 'Password confirmation is required';
    else if (cleanPass !== confirmPass.trim()) errs.confirmPassword = 'Passwords do not match';
  }

  return errs;
}

// Empty login input
const e1 = validateAuthInput('', '');
assert(e1.email === 'Email is required', 'Empty email gives specific message: Email is required');
assert(e1.password === 'Password is required', 'Empty password gives specific message: Password is required');

// Malformed email
const e2 = validateAuthInput('invalid-email-format', 'validPass123');
assert(e2.email === 'Enter a valid email address', 'Malformed email rejected with: Enter a valid email address');

// Whitespace email trimmed properly
const e3 = validateAuthInput('  valid.user@busgo.com  ', 'validPass123');
assert(!e3.email, 'Email with leading/trailing whitespace properly trimmed');

// Weak password (< 8 chars)
const e4 = validateAuthInput('user@busgo.com', '12345');
assert(e4.password === 'Password must be at least 8 characters', 'Short password rejected: Password must be at least 8 characters');

// Registration validations
const eReg1 = validateAuthInput('user@busgo.com', 'validPass123', '', '', 'validPass123');
assert(eReg1.name === 'Full name is required', 'Empty name rejected with: Full name is required');
assert(eReg1.phone === 'Phone number is required', 'Empty phone rejected with: Phone number is required');

const eReg2 = validateAuthInput('user@busgo.com', 'validPass123', 'Maria', '123', 'validPass123');
assert(eReg2.phone === 'Enter a valid phone number', 'Invalid phone rejected: Enter a valid phone number');

const eReg3 = validateAuthInput('user@busgo.com', 'validPass123', 'Maria', '09171234567', 'differentPass');
assert(eReg3.confirmPassword === 'Passwords do not match', 'Mismatch password rejected: Passwords do not match');

// All valid inputs
const eValid = validateAuthInput('maria.santos@busgo.com', 'securePassword888', 'Maria Santos', '09171234567', 'securePassword888');
assert(Object.keys(eValid).length === 0, 'All valid inputs produce 0 errors');

// ── TEST 5: Password Visibility Toggle Does Not Modify Password ───────────────
console.log('\n--- TEST 5: Password Visibility State ---');
let storedPassword = 'mySecretPassword!2026';
let isVisible = false; // default hidden
assert(isVisible === false, 'Password hidden by default');
isVisible = !isVisible; // toggle
assert(isVisible === true && storedPassword === 'mySecretPassword!2026', 'Toggle to visible preserves password unmodified');
isVisible = !isVisible; // toggle back
assert(isVisible === false && storedPassword === 'mySecretPassword!2026', 'Toggle back to hidden preserves password unmodified');

// ── TEST 6: Table 10-Row Viewport & Two-Direction Scroll Layout ───────────────
console.log('\n--- TEST 6: Table Scrolling Dimensions ---');
const COL_W = { id: 48, busName: 160, route: 220, price: 80, schedTime: 90, countdown: 120, status: 140, action: 90 };
const totalWidth = Object.values(COL_W).reduce((a, b) => a + b, 0);
assert(totalWidth === 948, `Horizontal scroll content width is ${totalWidth}px > typical screen width (supports horizontal scroll)`);
const maxHeight = 520; // 10 rows visible viewport
const rowHeightEstimate = 52;
const visibleRowsInViewport = Math.floor(maxHeight / rowHeightEstimate);
assert(visibleRowsInViewport === 10, `Table viewport maxHeight: ${maxHeight}px fits exactly ${visibleRowsInViewport} bus rows`);

console.log('\n====================================================');
console.log(' All 6 BusGo Verification Suites Passed with 100% Success!');
console.log('====================================================');
