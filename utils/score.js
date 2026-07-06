/**
 * Productivity scoring. A day's score (0-100) is computed on the fly from the
 * stored data — never cached — so edits to tasks/habits can't leave stale
 * counters behind.
 *
 * Interpretation of the spec's "Course Completion" and "Cybersecurity Labs"
 * sources: completed tasks in category "Cybersecurity" count as labs and
 * "University" as courses (weighted accordingly); tasks in the remaining
 * categories count as plain tasks.
 */

export const WEIGHTS = {
  task: 10,
  focusSession: 20,
  habit: 8,
  course: 15,
  lab: 25,
  learningPerMinute: 1,
};

export const MAX_DAY_SCORE = 100;

const LAB_CATEGORY = 'Cybersecurity';
const COURSE_CATEGORY = 'University';

// Score thresholds for heatmap brightness levels 1-4 (0 = no activity).
const LEVEL_2_MIN = 25;
const LEVEL_3_MIN = 50;
const LEVEL_4_MIN = 75;

/**
 * Collect everything that happened on a given date.
 * @param {string} key - dateKey (YYYY-MM-DD)
 * @param {{tasks: Array, habits: Array, stats: Object, timeTrack: Object}} data
 */
export function dayBreakdown(key, data) {
  let tasksDone = 0;
  let labs = 0;
  let courses = 0;
  for (const task of data.tasks) {
    if (!task.completions?.[key]) continue;
    if (task.category === LAB_CATEGORY) labs += 1;
    else if (task.category === COURSE_CATEGORY) courses += 1;
    else tasksDone += 1;
  }
  let habitsDone = 0;
  for (const habit of data.habits) {
    if (habit.completions?.[key]) habitsDone += 1;
  }
  const stats = data.stats[key] ?? {};
  const time = data.timeTrack[key] ?? {};
  return {
    tasksDone,
    labs,
    courses,
    habitsDone,
    focusSessions: stats.focusSessions ?? 0,
    focusMinutes: stats.focusMinutes ?? 0,
    learningMinutes: time.learningMinutes ?? 0,
  };
}

/** Weighted daily score, capped at MAX_DAY_SCORE. */
export function dayScore(breakdown) {
  const raw =
    breakdown.tasksDone * WEIGHTS.task +
    breakdown.focusSessions * WEIGHTS.focusSession +
    breakdown.habitsDone * WEIGHTS.habit +
    breakdown.courses * WEIGHTS.course +
    breakdown.labs * WEIGHTS.lab +
    breakdown.learningMinutes * WEIGHTS.learningPerMinute;
  return Math.min(MAX_DAY_SCORE, Math.round(raw));
}

/** Heatmap brightness level 0-4 for a score. */
export function heatLevel(score) {
  if (score >= LEVEL_4_MIN) return 4;
  if (score >= LEVEL_3_MIN) return 3;
  if (score >= LEVEL_2_MIN) return 2;
  if (score >= 1) return 1;
  return 0;
}
