/**
 * Single storage layer for the whole extension. Everything persists through
 * `browser.storage.local` (via webextension-polyfill) — localStorage is never
 * used. Writes are debounced per top-level key to keep typing/dragging cheap.
 *
 * Data model (top-level storage keys):
 *   settings  { googleName, sound, timerMinutes, tracking, learningDomains }
 *   widgets   { [widgetId]: { added, visible, x, y, w, h } }
 *   tasks     [{ id, title, category, priority, recurring, days[], dueDay,
 *                completions: { [dateKey]: true } }]
 *   notes     [{ id, title, content, open, x, y, w, h }]
 *   habits    [{ id, name, completions: { [dateKey]: true } }]
 *   stats     { [dateKey]: { focusSessions, focusMinutes } }        (written by newtab)
 *   timeTrack { [dateKey]: { totalMinutes, learningMinutes } }      (written by background.js ONLY)
 */

import { debounce } from '../utils/dom.js';

const WRITE_DEBOUNCE_MS = 300;

const DEFAULT_LEARNING_DOMAINS = [
  'tryhackme.com',
  'hackthebox.com',
  'coursera.org',
  'udemy.com',
  'edx.org',
  'freecodecamp.org',
  'khanacademy.org',
  'learn.microsoft.com',
  'developer.mozilla.org',
];

export const DEFAULTS = {
  settings: {
    name: null,
    sound: true,
    timerMinutes: 25,
    tracking: false,
    learningDomains: DEFAULT_LEARNING_DOMAINS,
    onboardingCompleted: false,
    onboardingVersion: 1,
    theme: 'minimal',
    showAddWidget: true,
    showThemeBtn: true,
    showGameBtn: true,
    searchMode: 'private',
    searchModel: 'chatgpt',
    birthday: { month: null, day: null, year: null, demoMode: false, lastShownYear: null }
  },
  brightness: {
    enabled: true,
    mode: 'simple',
    simpleLevel: 85,
    dayLevel: 100,
    nightLevel: 70,
    dayStart: '07:00',
    nightStart: '19:00',
    locked: false,
    applyTo: 'all',
    method: 'adaptive',
    advanced: {
      detectDark: true,
      applyFullscreen: false,
      preventBackdrop: true,
      smoothTransition: true,
      respectExclusions: true
    }
  },
  widgets: {},
  shortcutFolders: [],
  shortcuts: [],
  tasks: [],
  notes: [],
  habits: [],
  stats: {},
  timeTrack: {},
};

function extensionBackend() {
  return globalThis.browser?.storage?.local ?? null;
}

/**
 * In-memory stand-in used ONLY when the page runs outside an extension
 * (e.g. served over plain HTTP for dev preview, where the polyfill refuses
 * to load). Real builds always hit browser.storage.local.
 */
function memoryBackend() {
  const memory = {};
  return {
    async get() { return structuredClone(memory); },
    async set(items) { Object.assign(memory, structuredClone(items)); },
  };
}

export class Store {
  constructor() {
    const ext = extensionBackend();
    this.isPersistent = ext !== null;
    this.backend = ext ?? memoryBackend();
    this.data = structuredClone(DEFAULTS);
    this._writers = new Map();
  }

  /** Load all keys once at startup; merges defaults for newly added fields. */
  async load() {
    const stored = await this.backend.get(null);
    for (const key of Object.keys(DEFAULTS)) {
      if (stored[key] !== undefined) this.data[key] = stored[key];
    }
    this.data.settings = { ...DEFAULTS.settings, ...this.data.settings };
    // timeTrack is written by the background script while a tab sits open;
    // mirror those external writes into the in-memory cache. Only timeTrack
    // is synced this way — echoing our own debounced writes back into other
    // keys would invalidate object references widgets hold.
    if (this.isPersistent) {
      globalThis.browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.timeTrack) {
          this.data.timeTrack = changes.timeTrack.newValue ?? {};
        }
      });
    }
  }

  /** @returns the live (mutable) value for a top-level key. */
  get(key) {
    return this.data[key];
  }

  /** Replace a key's value and schedule a persist. */
  set(key, value) {
    this.data[key] = value;
    this.touch(key);
  }

  /** Schedule a debounced persist after mutating `get(key)`'s value in place. */
  touch(key) {
    if (!this._writers.has(key)) {
      this._writers.set(key, debounce(() => {
        this.backend.set({ [key]: this.data[key] });
      }, WRITE_DEBOUNCE_MS));
    }
    this._writers.get(key)();
  }
}
