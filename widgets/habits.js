/**
 * Habit Tracker widget. Habits repeat daily; today's completion resets each
 * calendar day while history stays in completions[dateKey]. Shows current
 * streak plus 7-day and 30-day completion percentages per habit.
 */

import { el, iconBtn, uid } from '../utils/dom.js';
import { dateKey, addDays } from '../utils/dates.js';
import * as bus from '../utils/bus.js';

const WEEK_DAYS = 7;
const MONTH_DAYS = 30;
const PERCENT = 100;

export function mount(body, { store }) {
  let renamingId = null;

  const root = el('div', { class: 'habits-widget' });
  body.append(root);
  render();

  function habits() {
    return store.get('habits');
  }

  function save() {
    store.touch('habits');
    bus.emit(bus.EVENTS.DATA_CHANGED);
    render();
  }

  /** Consecutive completed days ending today (or yesterday, if today is still open). */
  function streakOf(habit) {
    let count = 0;
    let cursor = new Date();
    if (!habit.completions[dateKey(cursor)]) cursor = addDays(cursor, -1);
    while (habit.completions[dateKey(cursor)]) {
      count += 1;
      cursor = addDays(cursor, -1);
    }
    return count;
  }

  /** Completion % over the trailing `days` days (including today). */
  function completionPct(habit, days) {
    let done = 0;
    for (let i = 0; i < days; i += 1) {
      if (habit.completions[dateKey(addDays(new Date(), -i))]) done += 1;
    }
    return Math.round((done / days) * PERCENT);
  }

  function render() {
    const input = el('input', {
      type: 'text', placeholder: 'Add a daily habit', 'aria-label': 'New habit name',
    });
    const form = el('form', {
      class: 'inline-form',
      onsubmit(event) {
        event.preventDefault();
        const name = input.value.trim();
        if (!name) return;
        habits().push({ id: uid(), name, completions: {} });
        save();
      },
    }, input, el('button', { type: 'submit', text: 'Add' }));

    const list = el('ul', { class: 'todo-list' });
    if (habits().length === 0) {
      list.append(el('li', { class: 'empty-state', text: 'No habits yet — add one above.' }));
    }
    for (const habit of habits()) list.append(habitRow(habit));

    root.replaceChildren(form, list);
  }

  function habitRow(habit) {
    const todayKey = dateKey();
    const done = !!habit.completions[todayKey];
    const meta = `${streakOf(habit)}d streak · wk ${completionPct(habit, WEEK_DAYS)}% · mo ${completionPct(habit, MONTH_DAYS)}%`;

    const nameNode = renamingId === habit.id
      ? renameInput(habit)
      : el('span', { class: 'label', text: habit.name });

    return el('li', { class: done ? 'done' : '' },
      el('button', {
        class: 'check', type: 'button',
        'aria-label': done ? `Mark ${habit.name} incomplete for today` : `Mark ${habit.name} complete for today`,
        onclick() {
          if (done) delete habit.completions[todayKey];
          else habit.completions[todayKey] = true;
          save();
        },
      }, done ? '✓' : ''),
      el('div', { class: 'task-label' },
        nameNode,
        el('span', { class: 'task-meta', text: meta })),
      el('div', { class: 'row-actions' },
        iconBtn('✎', `Rename ${habit.name}`, () => { renamingId = habit.id; render(); }),
        iconBtn('✕', `Delete ${habit.name}`, () => {
          store.set('habits', habits().filter((h) => h.id !== habit.id));
          bus.emit(bus.EVENTS.DATA_CHANGED);
          render();
        })));
  }

  function renameInput(habit) {
    const input = el('input', {
      class: 'field', type: 'text', value: habit.name, 'aria-label': 'Habit name',
    });
    const commit = () => {
      const name = input.value.trim();
      if (name) habit.name = name;
      renamingId = null;
      save();
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') commit();
      if (event.key === 'Escape') { renamingId = null; render(); }
    });
    input.addEventListener('blur', commit);
    queueMicrotask(() => input.focus());
    return input;
  }
}
