/**
 * Date helpers. All keys are LOCAL dates formatted YYYY-MM-DD (never UTC /
 * toISOString, which would shift entries near midnight). Weeks start Monday.
 */

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MORNING_START_HOUR = 5;
const AFTERNOON_START_HOUR = 12;
const EVENING_START_HOUR = 17;
const NIGHT_START_HOUR = 21;

/** Time-of-day greeting for a given hour (0-23). */
export function greetingFor(hour) {
  if (hour >= MORNING_START_HOUR && hour < AFTERNOON_START_HOUR) return 'Good Morning';
  if (hour >= AFTERNOON_START_HOUR && hour < EVENING_START_HOUR) return 'Good Afternoon';
  if (hour >= EVENING_START_HOUR && hour < NIGHT_START_HOUR) return 'Good Evening';
  return 'Good Night';
}

/** Local-date storage key, e.g. "2026-07-05". */
export function dateKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Monday-based weekday index: Mon=0 … Sun=6. */
export function weekdayIndex(date = new Date()) {
  return (date.getDay() + 6) % 7;
}

export function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Date of the given weekday (Mon=0…Sun=6) within the current week. */
export function dateOfWeekday(dayIndex, reference = new Date()) {
  return addDays(reference, dayIndex - weekdayIndex(reference));
}

/** Short human label, e.g. "Jul 5". */
export function shortLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
