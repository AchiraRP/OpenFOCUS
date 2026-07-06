/**
 * Tour step definitions. Import path updated from ./helpers.js
 * to ./tourHelpers.js following the rename.
 */

import { waitForElement, smoothScrollTo } from './tourHelpers.js';

export const steps = [
  {
    id: "welcome",
    isWelcome: true,
    title: "Welcome to OpenFocus",
    description: "An open-source productivity workspace for your browser. Let's take a quick tour.",
    targetSelector: null,
  },
  {
    id: "name-input",
    isNameInput: true,
    title: "Welcome",
    description: "What should we call you?",
    targetSelector: null,
  },
  {
    id: "birthday-input",
    isBirthdayInput: true,
    title: "Your Birthday",
    description: "When's your birthday? (Optional)",
    targetSelector: null,
  },
  {
    id: "greeting",
    title: "Greeting",
    description: "This greeting changes automatically based on the time of day. You can customize your name later inside Settings.",
    targetSelector: ".greeting-heading-row",
  },
  {
    id: "search",
    title: "Search",
    description: "Search Google or Open URLs directly from your dashboard. Use keyboard focus to start typing immediately.",
    targetSelector: ".search-box",
  },
  {
    id: "add-widget-btn",
    title: "Add Widget",
    description: "Widgets keep the dashboard clean. Nothing appears until you add it.",
    targetSelector: "#addWidgetBtn",
  },
  {
    id: "widget-library",
    title: "Widget Library",
    description: "Widgets can be added, hidden, removed, or restored from here.",
    targetSelector: ".modal-window",
    beforeEnter: async () => {
      document.getElementById('addWidgetBtn').click();
      await waitForElement('.modal-window');
    }
  },
  {
    id: "focus-timer",
    title: "Focus Timer",
    description: "Pomodoro timer for focus sessions. Features session statistics, notifications, and productivity integration.",
    targetSelector: "[data-widget='timer']",
    beforeEnter: async (manager) => {
      // Close modal
      const closeBtn = document.querySelector('.modal-action[title="Close"]');
      if (closeBtn) closeBtn.click();
      
      // Ensure timer is added
      manager.widgetManager.setAdded('timer', true);
      await waitForElement("[data-widget='timer']");
    }
  },
  {
    id: "timer-controls",
    title: "Timer Controls",
    description: "Start, pause, reset, or choose presets. You can also set a custom duration.",
    targetSelector: "[data-widget='timer'] .widget-body",
  },
  {
    id: "focus-tasks",
    title: "Focus Tasks",
    description: "Weekly planner, daily tasks, recurring tasks, categories, priorities, and completion history.",
    targetSelector: "[data-widget='tasks']",
    beforeEnter: async (manager) => {
      manager.widgetManager.setAdded('tasks', true);
      await waitForElement("[data-widget='tasks']");
    }
  },
  {
    id: "recurring-tasks",
    title: "Recurring Tasks",
    description: "Weekday selection. Completion resets every day, but history is preserved.",
    targetSelector: "[data-widget='tasks'] .widget-body form",
  },
  {
    id: "sticky-notes",
    title: "Sticky Notes",
    description: "Unlimited, floating, resizable notes with autosave and independent windows.",
    targetSelector: "[data-widget='notes']",
    beforeEnter: async (manager) => {
      manager.widgetManager.setAdded('notes', true);
      await waitForElement("[data-widget='notes']");
    }
  },
  {
    id: "habit-tracker",
    title: "Habit Tracker",
    description: "Track daily habits, streaks, weekly and monthly completion percentages with full history.",
    targetSelector: "[data-widget='habits']",
    beforeEnter: async (manager) => {
      manager.widgetManager.setAdded('habits', true);
      await waitForElement("[data-widget='habits']");
    }
  },
  {
    id: "productivity",
    title: "Productivity Widget",
    description: "View heatmap, statistics, daily/weekly/monthly summaries, and your current streak.",
    targetSelector: "[data-widget='productivity']",
    beforeEnter: async (manager) => {
      manager.widgetManager.setAdded('productivity', true);
      await waitForElement("[data-widget='productivity']");
      const target = document.querySelector("[data-widget='productivity']");
      smoothScrollTo(target);
    }
  },
  {
    id: "heatmap",
    title: "Heatmap",
    description: "Brightness means productivity. No colors. Hover for details. Automatically updates based on focus sessions.",
    targetSelector: "[data-widget='productivity'] .heatmap",
  },
  {
    id: "drag-widgets",
    title: "Drag Widgets",
    description: "Move anywhere by dragging the header. Layout is automatically saved.",
    targetSelector: "[data-widget='productivity'] .widget-header",
  },
  {
    id: "resize-widgets",
    title: "Resize Widgets",
    description: "Resize freely using the bottom-right grip. Dimensions are restored on next launch.",
    targetSelector: "[data-widget='productivity'] .resize-grip",
  },
  {
    id: "hide-widget",
    title: "Hide Widget",
    description: "Widgets disappear but can be restored quickly. Nothing is deleted.",
    targetSelector: "[data-widget='productivity'] .widget-action[title='Hide']",
  },
  {
    id: "remove-widget",
    title: "Remove Widget",
    description: "Widget is removed from dashboard but can be added again later from the library.",
    targetSelector: "[data-widget='productivity'] .widget-action[title='Remove']",
  },
  {
    id: "completion",
    title: "Congratulations!",
    description: "You've completed the OpenFocus tour. You can restart this tour anytime from Settings.",
    targetSelector: null,
    isWelcome: true,
  }
];
