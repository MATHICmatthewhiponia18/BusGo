const { computeBusScheduleInfo, parseScheduleToSeconds } = require('../lib/busSchedule');

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAIL:', message);
    process.exit(1);
  }
  console.log('✅ PASS:', message);
}

console.log('--- Testing busSchedule Status Calculations ---');

// 1. Bus scheduled at 06:00 AM (21,600s)
const dep0600 = 6 * 3600; // 21600

// 1 second before departure -> Stand By
const rBefore = computeBusScheduleInfo('06:00:00', null, dep0600 - 1);
assert(rBefore.category === 'standby', '1s before departure is Stand By');

// At departure time (0s) -> Ongoing
const rDep = computeBusScheduleInfo('06:00:00', null, dep0600);
assert(rDep.category === 'ongoing', 'At departure time is Ongoing');

// 45 min after departure -> Ongoing
const r45m = computeBusScheduleInfo('06:00:00', null, dep0600 + 45 * 60);
assert(r45m.category === 'ongoing', '45 min after departure is Ongoing');

// 89 min 59s after departure (< 90m) -> Ongoing
const r89m = computeBusScheduleInfo('06:00:00', null, dep0600 + 89 * 60 + 59);
assert(r89m.category === 'ongoing', '89m59s after departure is Ongoing');

// Exactly 90 minutes (5400s) after departure -> Just Arrived
const r90m = computeBusScheduleInfo('06:00:00', null, dep0600 + 90 * 60);
assert(r90m.category === 'just_arrived', 'At 90 minutes after departure is Just Arrived');

// 179 minutes (10,740s) after departure -> Just Arrived
const r179m = computeBusScheduleInfo('06:00:00', null, dep0600 + 179 * 60);
assert(r179m.category === 'just_arrived', 'At 179 minutes after departure is Just Arrived');

// Exactly 180 minutes (10,800s) after departure (9:00 AM) -> Temporarily Closed
const r180m = computeBusScheduleInfo('06:00:00', null, dep0600 + 180 * 60);
assert(r180m.category === 'temporarily_closed', 'At 180 minutes after departure (9:00 AM) is Temporarily Closed');

// At 2:00 PM (14:00, 8 hours after 6:00 AM) -> Temporarily Closed
const r1400 = computeBusScheduleInfo('06:00:00', null, 14 * 3600);
assert(r1400.category === 'temporarily_closed', '6:00 AM bus at 2:00 PM is Temporarily Closed');

// 2. Overnight tests
// A) Bus scheduled shortly after midnight at 00:30 (1800s), evaluated at 23:30 (84600s)
const rOvernightEarly = computeBusScheduleInfo('00:30:00', null, 23 * 3600 + 30 * 60);
assert(rOvernightEarly.category === 'standby', '00:30 bus at 23:30 is Stand By');
assert(rOvernightEarly.secsUntilDeparture === 3600, '00:30 bus at 23:30 has 3600s (1h) until departure');

// B) Bus scheduled late night at 23:45 (85500s), evaluated at 00:15 (900s)
const rOvernightLate = computeBusScheduleInfo('23:45:00', null, 15 * 60);
assert(rOvernightLate.category === 'ongoing', '23:45 bus at 00:15 is Ongoing');
assert(rOvernightLate.elapsedSecs === 1800, '23:45 bus at 00:15 has 1800s (30m) elapsed');

// C) Bus at 23:45 evaluated at 01:20 (80m elapsed) -> Ongoing
const rOvernightOngoing = computeBusScheduleInfo('23:45:00', null, 1 * 3600 + 20 * 60);
assert(rOvernightOngoing.category === 'ongoing', '23:45 bus at 01:20 is Ongoing (80m elapsed)');

// D) Bus at 23:45 evaluated at 01:30 (1h45m = 105m elapsed) -> Just Arrived
const rOvernightJustArrived = computeBusScheduleInfo('23:45:00', null, 1 * 3600 + 30 * 60);
assert(rOvernightJustArrived.category === 'just_arrived', '23:45 bus at 01:30 is Just Arrived (105m elapsed)');

// E) Bus at 23:45 evaluated at 03:00 (3h15m = 195m elapsed) -> Temporarily Closed
const rOvernightClosed = computeBusScheduleInfo('23:45:00', null, 3 * 3600);
assert(rOvernightClosed.category === 'temporarily_closed', '23:45 bus at 03:00 is Temporarily Closed (195m elapsed)');

console.log('🎉 ALL BUS SCHEDULE TESTS PASSED!');
