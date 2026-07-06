/**
 * Widget registry: metadata only, so listing widgets (home screen, library
 * modal) never loads widget code. Implementations are fetched on demand via
 * loadWidget() — each widget module exports mount(body, { store }) and may
 * return a cleanup function.
 */

export const WIDGET_DEFS = {
  timer: {
    title: 'Focus Timer',
    blurb: 'Pomodoro-style focus sessions with progress ring',
    width: 380,
  },
  tasks: {
    title: 'Focus Tasks',
    blurb: 'Weekly planner with categories, priorities and recurring tasks',
    width: 460,
  },
  notes: {
    title: 'Sticky Notes',
    blurb: 'Unlimited floating notes that remember where you left them',
    width: 320,
  },
  habits: {
    title: 'Habit Tracker',
    blurb: 'Daily habits with streaks and weekly / monthly progress',
    width: 420,
  },
  productivity: {
    title: 'Productivity',
    blurb: 'Grayscale activity heatmap and daily score',
    width: 480,
  },
  shortcuts: {
    title: 'Shortcuts',
    blurb: 'Desktop-style app launcher with folders and drag-and-drop',
    width: 460,
  },
  brightness: {
    title: 'Brightness Control',
    blurb: 'Schedule and manage website brightness levels',
    width: 460,
  }
};

export function loadWidget(id) {
  return import(`./${id}.js`);
}
