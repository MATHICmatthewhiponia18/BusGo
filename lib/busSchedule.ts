/**
 * busSchedule.ts
 * Dynamic bus status computation based on Philippine Standard Time (Asia/Manila).
 *
 * ══════════════════════════════════════════════════════════
 * EXACT STATUS RULES (elapsed = currentTime − schedule_time):
 * ──────────────────────────────────────────────────────────
 *   Stand By          : elapsed < 0
 *                       (current time is before scheduled departure)
 *   Ongoing           : 0 <= elapsed < 90 min (5,400s)
 *                       (from departure until less than 90 minutes afterward)
 *   Just Arrived      : 90 min <= elapsed < 180 min (5,400s to < 10,800s)
 *                       (from 90 minutes until less than 180 minutes afterward)
 *   Temporarily Closed: elapsed >= 180 min (10,800s+)
 *                       (at or beyond 180 minutes after departure)
 *
 * Example: A bus scheduled at 6:00 AM becomes Temporarily Closed at 9:00 AM or later.
 * Overnight handling:
 *   - Buses scheduled shortly after midnight (e.g. 00:30) evaluated before midnight
 *     (e.g. 23:30) roll to tomorrow's departure and become Stand By (Dep. in 1h).
 *   - Buses scheduled late night (e.g. 23:45) evaluated shortly after midnight
 *     (e.g. 00:15) roll to yesterday's departure and remain Ongoing (30m elapsed).
 * ══════════════════════════════════════════════════════════
 */

import type { BusCategory } from '../types/bus';

// ─── Thresholds (seconds) ────────────────────────────────────────────────────
export const THRESHOLD = {
  /** 0–90 min after departure: Ongoing */
  ONGOING_END_SECS: 90 * 60, // 5,400 seconds
  /** 90–180 min after departure: Just Arrived */
  JUST_ARRIVED_END_SECS: 180 * 60, // 10,800 seconds
  /** Overnight lookahead window for early morning departures (6 hours) */
  OVERNIGHT_WINDOW_SECS: 6 * 3600,
} as const;

// ─── BusScheduleInfo ─────────────────────────────────────────────────────────
export interface BusScheduleInfo {
  /** Dynamically computed category */
  category: BusCategory;
  /** Human-readable label */
  categoryLabel: string;
  /** Seconds elapsed since scheduled departure (negative = not yet departed) */
  elapsedSecs: number;
  /** Seconds until departure (negative = already departed) */
  secsUntilDeparture: number;
  /** Formatted countdown/status string shown in the table */
  countdownLabel: string;
  /** Whether a live countdown makes sense for this status */
  showCountdown: boolean;
}

// ─── Manila time helper ───────────────────────────────────────────────────────
/**
 * Returns current Manila time as total seconds from midnight of today Manila.
 * Uses Intl.DateTimeFormat with Asia/Manila timezone to work consistently
 * across all client devices and environments.
 */
export const getManilaSecondsSinceMidnight = (date: Date = new Date()): number => {
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

// ─── Schedule time parser ─────────────────────────────────────────────────────
/**
 * Parses "HH:MM:SS" or "HH:MM" into total seconds from midnight.
 * Returns null for invalid/missing input.
 */
export const parseScheduleToSeconds = (scheduleTime: string | null | undefined): number | null => {
  if (!scheduleTime) return null;
  const trimmed = scheduleTime.trim();

  // If contains a date component or ISO timestamp
  if (trimmed.includes('T') || (trimmed.includes('-') && trimmed.includes(':'))) {
    try {
      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        return getManilaSecondsSinceMidnight(parsedDate);
      }
    } catch {
      // Fallback to regex
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

// ─── Main computation ─────────────────────────────────────────────────────────
/**
 * Computes the dynamic schedule status for one bus row.
 * Pass nowSecs for testability; omit to use live Manila time.
 * Optional departureDate can be passed if full date is known.
 */
export const computeBusScheduleInfo = (
  scheduleTime: string | null | undefined,
  _route?: string | null | undefined, // kept for API compatibility
  nowSecs?: number,
  departureDate?: string | null
): BusScheduleInfo => {
  const currentSecs = nowSecs ?? getManilaSecondsSinceMidnight();
  const depSecs = parseScheduleToSeconds(scheduleTime);

  // Guard: invalid / missing schedule_time → treat as Stand by with no countdown
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

  // If a full departure date is specified (e.g. YYYY-MM-DD)
  if (departureDate && departureDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    try {
      const now = new Date();
      // Format current Manila date string YYYY-MM-DD
      const manilaParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);
      let mYear = '', mMonth = '', mDay = '';
      for (const p of manilaParts) {
        if (p.type === 'year') mYear = p.value;
        if (p.type === 'month') mMonth = p.value;
        if (p.type === 'day') mDay = p.value;
      }
      const todayManilaStr = `${mYear}-${mMonth}-${mDay}`;

      if (departureDate !== todayManilaStr) {
        // Different day calculation
        const todayDate = new Date(`${todayManilaStr}T00:00:00+08:00`);
        const targetDate = new Date(`${departureDate}T00:00:00+08:00`);
        const dayDiffSecs = Math.round((targetDate.getTime() - todayDate.getTime()) / 1000);
        const scheduledTotalSecs = depSecs + dayDiffSecs;
        const elapsedSecs = currentSecs - scheduledTotalSecs;
        return classifySchedule(elapsedSecs);
      }
    } catch {
      // Fall through to regular calculation
    }
  }

  // ── Calculate relative diffs across daily cycle (seconds) ────────────────
  const SECONDS_IN_DAY = 86400;
  const diffToday = currentSecs - depSecs;
  const diffYesterday = diffToday + SECONDS_IN_DAY; // currentSecs - (depSecs - 86400)
  const diffTomorrow = diffToday - SECONDS_IN_DAY;  // currentSecs - (depSecs + 86400)

  let elapsedSecs: number;

  // 1. Overnight active departure from yesterday (late night bus in early morning hours):
  // If bus was scheduled late night (depSecs >= 18:00) and current time is early morning (< 06:00):
  // Evaluate against yesterday's departure:
  // - 0 to < 90m: Ongoing
  // - 90 to < 180m: Just Arrived
  // - >= 180m: Temporarily Closed (completed its overnight run)
  if (depSecs >= 18 * 3600 && currentSecs < 6 * 3600) {
    elapsedSecs = diffYesterday;
  }
  // 2. Departure today is active [0, 180 min)
  // Departed today, currently Ongoing (0-90m) or Just Arrived (90-180m)
  else if (diffToday >= 0 && diffToday < THRESHOLD.JUST_ARRIVED_END_SECS) {
    elapsedSecs = diffToday;
  }
  // 3. Overnight upcoming schedule:
  // If bus is scheduled shortly after midnight (depSecs < 06:00 AM) and current time is
  // late night before midnight (>= 18:00 PM or departing within 6 hours):
  // Treat as upcoming tomorrow morning departure -> Stand By (e.g. 00:30 bus at 23:30)
  else if (depSecs < 6 * 3600 && (currentSecs >= 18 * 3600 || -diffTomorrow <= THRESHOLD.OVERNIGHT_WINDOW_SECS)) {
    elapsedSecs = diffTomorrow; // negative elapsed = future departure -> Stand By
  }
  // 4. Before today's scheduled departure time (depSecs > currentSecs)
  // Departure has not happened yet today -> Stand By
  else if (diffToday < 0) {
    elapsedSecs = diffToday;
  }
  // 5. Otherwise: today's departure already passed and reached or exceeded 180 min
  // Example: 6:00 AM bus at 9:00 AM or 14:00 PM -> Temporarily Closed
  else {
    elapsedSecs = diffToday;
  }

  return classifySchedule(elapsedSecs);
};

/**
 * Classifies the bus category and labels based on elapsedSecs.
 */
function classifySchedule(elapsedSecs: number): BusScheduleInfo {
  const secsUntilDeparture = -elapsedSecs;

  let category: BusCategory;
  let categoryLabel: string;
  let countdownLabel: string;
  let showCountdown = true;

  if (elapsedSecs < 0) {
    // Before departure time: Stand By
    category = 'standby';
    categoryLabel = 'Stand By';
    countdownLabel = `Dep. in ${formatCountdown(secsUntilDeparture)}`;
  } else if (elapsedSecs < THRESHOLD.ONGOING_END_SECS) {
    // From departure until less than 90 minutes afterward: Ongoing
    category = 'ongoing';
    categoryLabel = 'Ongoing';
    const remaining = THRESHOLD.ONGOING_END_SECS - elapsedSecs;
    countdownLabel = `En route ${formatCountdown(remaining)} left`;
  } else if (elapsedSecs < THRESHOLD.JUST_ARRIVED_END_SECS) {
    // From 90 minutes until less than 180 minutes afterward: Just Arrived
    category = 'just_arrived';
    categoryLabel = 'Just Arrived';
    countdownLabel = 'Arrived';
    showCountdown = false;
  } else {
    // At or beyond 180 minutes after departure: Temporarily Closed
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
}

// ─── Countdown formatter ──────────────────────────────────────────────────────
/** Formats positive seconds into "Xh Ym" or "Xm Ys" or "Xs". */
export const formatCountdown = (totalSecs: number): string => {
  const abs = Math.max(0, Math.round(totalSecs));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// ─── Status ordering for sort ─────────────────────────────────────────────────
export const STATUS_ORDER: Record<BusCategory, number> = {
  standby: 0,
  ongoing: 1,
  just_arrived: 2,
  temporarily_closed: 3,
};

// ─── Sort comparator ──────────────────────────────────────────────────────────
/** Sorts bus rows: standby (closest first) → ongoing → just_arrived → temp_closed */
export const compareBusRows = (
  a: { schedule_time?: string | null; route?: string | null },
  b: { schedule_time?: string | null; route?: string | null },
  nowSecs: number
): number => {
  const aInfo = computeBusScheduleInfo(a.schedule_time, a.route, nowSecs);
  const bInfo = computeBusScheduleInfo(b.schedule_time, b.route, nowSecs);
  const statusDiff = STATUS_ORDER[aInfo.category] - STATUS_ORDER[bInfo.category];
  if (statusDiff !== 0) return statusDiff;
  // Among same status: sort by secsUntilDeparture ascending (soonest first)
  return aInfo.secsUntilDeparture - bInfo.secsUntilDeparture;
};

// ─── Legacy export (kept for any existing callers) ────────────────────────────
/** @deprecated Use formatCountdown instead */
export const formatSecondsToCountdown = formatCountdown;
