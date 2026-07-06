/**
 * Focus Tasks widget — a weekly planner, not a flat todo list.
 *
 * - Day tabs (Mon…Sun); the list shows only tasks due on the selected day.
 * - A recurring task is stored ONCE with a `days` array; completion is
 *   tracked per calendar date in `completions[dateKey]`, so a task done on
 *   Monday is automatically incomplete again on Tuesday.
 * - Selecting a day tab maps to that weekday's date in the CURRENT week —
 *   toggling completion writes to that date's history entry.
 */

import { el, iconBtn, uid } from '../utils/dom.js';
import { DAY_NAMES, dateKey, weekdayIndex, dateOfWeekday, shortLabel } from '../utils/dates.js';
import * as bus from '../utils/bus.js';

const CATEGORIES = ['Cybersecurity', 'University', 'Health', 'Personal', 'Work'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const DEFAULT_PRIORITY = 'Medium';

export function mount(body, { store }) {
  let selectedDay = weekdayIndex();
  let editingId = null;
  let formVisible = false;

  const root = el('div', { class: 'tasks-widget' });
  body.append(root);
  render();

  // --- Data helpers ---
  function tasks() {
    return store.get('tasks');
  }

  function tasksForDay(day) {
    return tasks().filter((t) => (t.recurring ? t.days.includes(day) : t.dueDay === day));
  }

  /** Storage date key for the selected weekday within the current week. */
  function selectedDateKey() {
    return dateKey(dateOfWeekday(selectedDay));
  }

  function isDone(task) {
    return !!task.completions[selectedDateKey()];
  }

  function saveAndRender() {
    store.touch('tasks');
    bus.emit(bus.EVENTS.DATA_CHANGED);
    render();
  }

  // --- Mutations ---
  function toggleDone(task) {
    const key = selectedDateKey();
    if (task.completions[key]) delete task.completions[key];
    else task.completions[key] = true;
    saveAndRender();
  }

  function removeTask(task) {
    store.set('tasks', tasks().filter((t) => t.id !== task.id));
    bus.emit(bus.EVENTS.DATA_CHANGED);
    render();
  }

  function duplicateTask(task) {
    tasks().push({
      ...task,
      id: uid(),
      title: `${task.title} (copy)`,
      days: [...(task.days ?? [])],
      completions: {},
    });
    saveAndRender();
  }

  function toggleRecurring(task) {
    if (task.recurring) {
      task.recurring = false;
      task.dueDay = task.days[0] ?? selectedDay;
      task.days = [];
    } else {
      task.recurring = true;
      task.days = [task.dueDay ?? selectedDay];
    }
    saveAndRender();
  }

  // --- Rendering ---
  function render() {
    root.replaceChildren(renderToolbar(), ...(formVisible ? [renderForm()] : []), renderList());
  }

  function renderToolbar() {
    const remaining = tasksForDay(selectedDay).filter((t) => !isDone(t)).length;
    const tabs = el('div', { class: 'day-tabs', role: 'tablist', 'aria-label': 'Day of week' },
      ...DAY_NAMES.map((name, index) => el('button', {
        class: `day-tab${index === selectedDay ? ' active' : ''}`,
        type: 'button', role: 'tab', text: name,
        'aria-selected': String(index === selectedDay),
        onclick() { selectedDay = index; render(); },
      })));
    return el('div', { class: 'tasks-toolbar' },
      tabs,
      el('div', { class: 'tasks-toolbar-row' },
        el('span', { class: 'tasks-date', text: `${DAY_NAMES[selectedDay]} · ${shortLabel(dateOfWeekday(selectedDay))}` }),
        el('span', { class: 'count', text: `${remaining} left` }),
        el('button', {
          class: 'pill-btn', type: 'button',
          text: formVisible ? 'Close' : '+ New task',
          'aria-expanded': String(formVisible),
          onclick() { formVisible = !formVisible; if (!formVisible) editingId = null; render(); },
        })));
  }

  function renderForm() {
    const editing = editingId ? tasks().find((t) => t.id === editingId) : null;
    let recurring = editing?.recurring ?? false;
    const chosenDays = new Set(editing?.days?.length ? editing.days : [selectedDay]);

    const titleInput = el('input', {
      class: 'field', type: 'text', placeholder: 'Task title',
      value: editing?.title ?? '', 'aria-label': 'Task title',
    });
    const categorySelect = selectField('Category', CATEGORIES, editing?.category ?? CATEGORIES[0]);
    const prioritySelect = selectField('Priority', PRIORITIES, editing?.priority ?? DEFAULT_PRIORITY);
    const daySelect = selectField('Due day', DAY_NAMES, DAY_NAMES[editing?.dueDay ?? selectedDay]);

    const chips = DAY_NAMES.map((name, index) => {
      const chip = el('button', {
        type: 'button',
        class: `chip${chosenDays.has(index) ? ' active' : ''}`,
        text: name,
        'aria-pressed': String(chosenDays.has(index)),
        onclick() {
          chosenDays.has(index) ? chosenDays.delete(index) : chosenDays.add(index);
          chip.classList.toggle('active', chosenDays.has(index));
          chip.setAttribute('aria-pressed', String(chosenDays.has(index)));
        },
      });
      return chip;
    });
    const chipsRow = el('div', {
      class: `chips-row${recurring ? '' : ' hidden'}`,
      role: 'group', 'aria-label': 'Repeat on days',
    }, ...chips);

    const recurringToggle = el('input', { type: 'checkbox', ...(recurring ? { checked: '' } : {}) });
    recurringToggle.addEventListener('change', () => {
      recurring = recurringToggle.checked;
      chipsRow.classList.toggle('hidden', !recurring);
    });

    return el('form', {
      class: 'task-form',
      onsubmit(event) {
        event.preventDefault();
        const title = titleInput.value.trim();
        if (!title) return;
        const days = [...chosenDays].sort((a, b) => a - b);
        if (recurring && days.length === 0) return;
        const fields = {
          title,
          category: categorySelect.value,
          priority: prioritySelect.value,
          recurring,
          days: recurring ? days : [],
          dueDay: DAY_NAMES.indexOf(daySelect.value),
        };
        if (editing) Object.assign(editing, fields);
        else tasks().push({ id: uid(), completions: {}, ...fields });
        editingId = null;
        formVisible = false;
        saveAndRender();
      },
    },
      titleInput,
      el('div', { class: 'form-row' },
        labeled('Category', categorySelect),
        labeled('Priority', prioritySelect),
        labeled('Due day', daySelect)),
      el('label', { class: 'check-label' }, recurringToggle, ' Recurring'),
      chipsRow,
      el('div', { class: 'form-actions' },
        el('button', { class: 'pill-btn primary', type: 'submit', text: editing ? 'Save' : 'Add task' }),
        el('button', {
          class: 'pill-btn', type: 'button', text: 'Cancel',
          onclick() { editingId = null; formVisible = false; render(); },
        })));
  }

  function selectField(label, options, selected) {
    return el('select', { class: 'field', 'aria-label': label },
      ...options.map((option) => el('option', {
        value: option, text: option, ...(option === selected ? { selected: '' } : {}),
      })));
  }

  function labeled(caption, field) {
    return el('label', { class: 'field-label' },
      el('span', { class: 'field-caption', text: caption }),
      field);
  }

  function renderList() {
    const dayTasks = tasksForDay(selectedDay);
    const open = dayTasks.filter((t) => !isDone(t));
    const done = dayTasks.filter((t) => isDone(t));
    const list = el('ul', { class: 'todo-list' });
    if (dayTasks.length === 0) {
      list.append(el('li', { class: 'empty-state', text: 'No tasks for this day — add one above.' }));
    }
    for (const task of open) list.append(taskRow(task, false));
    if (done.length > 0) {
      list.append(el('li', { class: 'list-divider', text: 'Completed' }));
      for (const task of done) list.append(taskRow(task, true));
    }
    return list;
  }

  function taskRow(task, done) {
    const scheduleText = task.recurring
      ? `Repeats ${task.days.map((d) => DAY_NAMES[d]).join(', ')}`
      : DAY_NAMES[task.dueDay];
    return el('li', { class: done ? 'done' : '' },
      el('button', {
        class: 'check', type: 'button',
        'aria-label': done ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`,
        onclick: () => toggleDone(task),
      }, done ? '✓' : ''),
      el('div', { class: 'task-label' },
        el('span', { class: 'label', text: task.title }),
        el('span', { class: 'task-meta' },
          el('span', { class: 'badge', text: task.category }),
          el('span', { class: `badge prio-${task.priority.toLowerCase()}`, text: task.priority }),
          el('span', { class: 'badge', text: scheduleText }))),
      el('div', { class: 'row-actions' },
        iconBtn('✎', `Edit ${task.title}`, () => { editingId = task.id; formVisible = true; render(); }),
        iconBtn('⧉', `Duplicate ${task.title}`, () => duplicateTask(task)),
        iconBtn('↻', task.recurring ? `Stop ${task.title} recurring` : `Make ${task.title} recurring`, () => toggleRecurring(task)),
        iconBtn('✕', `Delete ${task.title}`, () => removeTask(task))));
  }
}
