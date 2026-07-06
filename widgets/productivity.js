/**
 * Productivity widget: grayscale contribution-style heatmap (12 weeks),
 * daily score 0-100, current streak, weekly/monthly point summaries, and the
 * opt-in browser time tracking control. Re-renders whenever other widgets
 * emit DATA_CHANGED. Scores are always computed live from stored data — see
 * utils/score.js for weights and the labs/courses interpretation.
 */

import { el } from '../utils/dom.js';
import { dateKey, addDays, dateOfWeekday } from '../utils/dates.js';
import { dayBreakdown, dayScore, heatLevel } from '../utils/score.js';
import * as bus from '../utils/bus.js';

const WEEKS_SHOWN = 12;
const DAYS_PER_WEEK = 7;
const HEAT_LEVELS = 5;

export function mount(body, { store }) {
  const root = el('div', { class: 'prod-widget' });
  body.append(root);
  const unsubscribe = bus.on(bus.EVENTS.DATA_CHANGED, render);
  render();
  return unsubscribe;

  function data() {
    return {
      tasks: store.get('tasks'),
      habits: store.get('habits'),
      stats: store.get('stats'),
      timeTrack: store.get('timeTrack'),
    };
  }

  function scoreOf(key) {
    return dayScore(dayBreakdown(key, data()));
  }

  function render() {
    const todayKey = dateKey();
    root.replaceChildren(
      renderStats(todayKey),
      renderHeatmap(),
      renderLegend(),
      renderTracking(todayKey),
    );
  }

  function renderStats(todayKey) {
    // Current streak: walk back from today (or yesterday if today is empty).
    let streak = 0;
    let cursor = new Date();
    if (scoreOf(dateKey(cursor)) === 0) cursor = addDays(cursor, -1);
    while (scoreOf(dateKey(cursor)) > 0) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }

    const monday = dateOfWeekday(0);
    let weekPoints = 0;
    for (let i = 0; i < DAYS_PER_WEEK; i += 1) {
      const date = addDays(monday, i);
      if (date > new Date()) break;
      weekPoints += scoreOf(dateKey(date));
    }
    let monthPoints = 0;
    const today = new Date();
    for (let day = 1; day <= today.getDate(); day += 1) {
      monthPoints += scoreOf(dateKey(new Date(today.getFullYear(), today.getMonth(), day)));
    }

    return el('div', { class: 'prod-stats' },
      stat('Today', `${scoreOf(todayKey)} pts`),
      stat('Streak', `${streak}d`),
      stat('Week', `${weekPoints} pts`),
      stat('Month', `${monthPoints} pts`));
  }

  function stat(label, value) {
    return el('div', { class: 'stat' },
      el('span', { class: 'stat-value', text: value }),
      el('span', { class: 'stat-label', text: label }));
  }

  function renderHeatmap() {
    const grid = el('div', {
      class: 'heatmap', role: 'img',
      'aria-label': `Productivity heatmap, last ${WEEKS_SHOWN} weeks`,
    });
    const monday = dateOfWeekday(0);
    const now = new Date();
    for (let week = WEEKS_SHOWN - 1; week >= 0; week -= 1) {
      for (let day = 0; day < DAYS_PER_WEEK; day += 1) {
        const date = addDays(monday, -week * DAYS_PER_WEEK + day);
        if (date > now) {
          grid.append(el('div', { class: 'heat-cell heat-0 heat-future' }));
          continue;
        }
        const key = dateKey(date);
        const breakdown = dayBreakdown(key, data());
        const score = dayScore(breakdown);
        grid.append(el('div', {
          class: `heat-cell heat-${heatLevel(score)}`,
          title: cellTitle(key, score, breakdown),
        }));
      }
    }
    return grid;
  }

  function cellTitle(key, score, b) {
    return `${key} — ${score} pts\n` +
      `Tasks ${b.tasksDone} · Habits ${b.habitsDone} · Focus ${b.focusSessions} (${b.focusMinutes}m)\n` +
      `Labs ${b.labs} · Courses ${b.courses} · Study ${b.learningMinutes}m`;
  }

  function renderLegend() {
    const cells = [];
    for (let level = 0; level < HEAT_LEVELS; level += 1) {
      cells.push(el('div', { class: `heat-cell heat-${level}` }));
    }
    return el('div', { class: 'heat-legend', 'aria-hidden': 'true' },
      el('span', { text: 'Less' }), ...cells, el('span', { text: 'More' }));
  }

  function renderTracking(todayKey) {
    const settings = store.get('settings');
    if (!settings.tracking) {
      return el('div', { class: 'prod-tracking' },
        el('button', {
          class: 'pill-btn', type: 'button',
          text: 'Enable browser time tracking',
          onclick: enableTracking,
        }),
        el('p', {
          class: 'prod-note',
          text: 'Optional. Asks for the tabs permission and counts active-tab minutes; learning sites feed your score.',
        }));
    }
    const today = store.get('timeTrack')[todayKey] ?? { totalMinutes: 0, learningMinutes: 0 };
    return el('div', { class: 'prod-tracking' },
      el('p', {
        class: 'prod-note',
        text: `Browser today: ${today.totalMinutes} min · study ${today.learningMinutes} min`,
      }),
      el('button', {
        class: 'pill-btn', type: 'button', text: 'Disable tracking',
        onclick() {
          settings.tracking = false;
          store.touch('settings');
          render();
        },
      }));
  }

  async function enableTracking() {
    const api = globalThis.browser;
    if (!api?.permissions) return; // dev preview outside the extension
    let granted = false;
    try {
      granted = await api.permissions.request({ permissions: ['tabs'] });
    } catch {
      granted = false;
    }
    if (!granted) return;
    store.get('settings').tracking = true;
    store.touch('settings');
    render();
  }
}
