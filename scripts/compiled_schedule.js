// Transpiled version of lib/busSchedule.ts for node test execution
const THRESHOLD = {
  ONGOING_END_SECS: 90 * 60,
  JUST_ARRIVED_END_SECS: 180 * 60,
  OVERNIGHT_WINDOW_SECS: 6 * 3600,
};

const getManilaSecondsSinceMidnight = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(date);

  let h = 0, m = 0, s = 0;
  for (const p of parts) {
    if (p.type === 'hour') h = parseInt(p.value, 10);
    if (p.type === 'minute') m = parseInt(p.value, 10);
    if (p.type === 'second') s = parseInt(p.value, 10);
  }
  if (h === 24) h = 0;
  return h * 3600 + m * 60 + s;
};

const parseScheduleToSeconds = (scheduleTime) => {
  if (!scheduleTime) return null;
  const trimmed = scheduleTime.trim();

  if (trimmed.includes('T') || (trimmed.includes('-') && trimmed.includes(':'))) {
    try {
      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        return getManilaSecondsSinceMidnight(parsedDate);
      }
    } catch {
      // Fallback
    }
  }

  const match = trimmed.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = match[3] ? parseInt(match[3], 10) : 0;
  if (h > 23 || m > 59 || s > 59) return null;
  return h * 3600 + m * 60 + s;
};

const formatCountdown = (totalSecs) => {
  const abs = Math.max(0, Math.round(totalSecs));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const computeBusScheduleInfo = (scheduleTime, _route, nowSecs, departureDate) => {
  const currentSecs = nowSecs ?? getManilaSecondsSinceMidnight();
  const depSecs = parseScheduleToSeconds(scheduleTime);

  if (depSecs === null) {
    return {
      category: 'standby',
      categoryLabel: 'Stand By',
      elapsedSecs: -Infinity,
      secsUntilDeparture: Infinity,
      countdownLabel: 'N/A',
      showCountdown: false,
    };
  }

  const SECONDS_IN_DAY = 86400;
  const diffToday = currentSecs - depSecs;
  const diffYesterday = diffToday + SECONDS_IN_DAY;
  const diffTomorrow = diffToday - SECONDS_IN_DAY;

  let elapsedSecs;

  // 1. Overnight active departure from yesterday (late night bus in early morning hours)
  if (depSecs >= 18 * 3600 && currentSecs < 6 * 3600) {
    elapsedSecs = diffYesterday;
  }
  // 2. Departure today is active [0, 180 min)
  else if (diffToday >= 0 && diffToday < THRESHOLD.JUST_ARRIVED_END_SECS) {
    elapsedSecs = diffToday;
  }
  // 3. Overnight upcoming schedule
  else if (depSecs < 6 * 3600 && (currentSecs >= 18 * 3600 || -diffTomorrow <= THRESHOLD.OVERNIGHT_WINDOW_SECS)) {
    elapsedSecs = diffTomorrow;
  }
  // 4. Before today's scheduled departure time
  else if (diffToday < 0) {
    elapsedSecs = diffToday;
  }
  // 5. Otherwise: today's departure passed and reached or exceeded 180 min
  else {
    elapsedSecs = diffToday;
  }

  const secsUntilDeparture = -elapsedSecs;
  let category;
  let categoryLabel;
  let countdownLabel;
  let showCountdown = true;

  if (elapsedSecs < 0) {
    category = 'standby';
    categoryLabel = 'Stand By';
    countdownLabel = `Dep. in ${formatCountdown(secsUntilDeparture)}`;
  } else if (elapsedSecs < THRESHOLD.ONGOING_END_SECS) {
    category = 'ongoing';
    categoryLabel = 'Ongoing';
    const remaining = THRESHOLD.ONGOING_END_SECS - elapsedSecs;
    countdownLabel = `En route ${formatCountdown(remaining)} left`;
  } else if (elapsedSecs < THRESHOLD.JUST_ARRIVED_END_SECS) {
    category = 'just_arrived';
    categoryLabel = 'Just Arrived';
    countdownLabel = 'Arrived';
    showCountdown = false;
  } else {
    category = 'temporarily_closed';
    categoryLabel = 'Temporarily Closed';
    countdownLabel = 'Closed';
    showCountdown = false;
  }

  return {
    category,
    categoryLabel,
    elapsedSecs,
    secsUntilDeparture,
    countdownLabel,
    showCountdown,
  };
};

module.exports = {
  computeBusScheduleInfo,
  parseScheduleToSeconds,
  getManilaSecondsSinceMidnight,
  formatCountdown,
};
