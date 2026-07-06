# OpenFocus
> An open-source productivity workspace for your browser.

Manifest V3 browser extension (Brave/Chromium + Firefox) that replaces the new
tab page with a minimal dark grayscale dashboard: time-based greeting, search,
and five optional draggable widgets — Focus Timer, Focus Tasks (weekly
planner), Sticky Notes, Habit Tracker, and a Productivity heatmap.

**This README is the source of truth.** Agents: read this file first each
session instead of re-scanning the codebase; only open individual files when
editing them or when this doc says file-level detail is needed. Update this
README on every file create/delete/rename/meaningful change.

## Hard design rules (do not violate)

- The UI design is the source of truth: do NOT redesign, change spacing,
  typography, or the grayscale theme. Only add functionality.
- Grayscale only. Never green/blue/orange/red, no gradients, no glassmorphism,
  no neon, no colorful icons. Progress/heat uses only brightness:
  `#2C2C2A → #555555 → #888888 → #C8C8C8 → #FFFFFF` (CSS vars `--heat-0..4`).
- Palette (CSS vars in `styles/base.css`): bg `#0D0D0C`, surface `#181816`,
  raised `#212120`, border `#2C2C2A`, text `#EDEDE8`, dim `#9A9A94`,
  faint `#5C5C58`.
- Home screen contains ONLY: greeting, capitalized user name heading, search bar, Add Widget
  button. Widgets are hidden until added via the library modal.
- Persistence is `browser.storage.local` for everything. NEVER localStorage.
- No inline styles/scripts, ES modules, small single-responsibility files.
  (One sanctioned exception: JS sets `style.left/top/width/height/zIndex` for
  drag/resize geometry — dynamic layout state, not theming.)

## Architecture overview

```
newtab.html ── loads vendor/browser-polyfill.min.js (classic) then src/newtab/index.js (module)
src/newtab/index.js ── entry: Store.load() → greeting + search + widget manager + modal wiring
storage/store.js ── all persistence (debounced writes per key)
src/ui/ ── widget frame, drag/resize, manager
src/modals/ ── library modal, settings modal, theme/game modals
src/theme/ ── theme manager
src/onboarding/ ── interactive tour system
widgets/ ── one module per widget, lazy-loaded on first mount via dynamic import
utils/ ── dom/date/score/bus helpers (no DOM state, no storage access)
background.js ── standalone script: opt-in browser time tracking (1-min alarm)
```

Data flow: widgets mutate `store.get(key)` values in place, then call
`store.touch(key)` (debounced persist) and `bus.emit(EVENTS.DATA_CHANGED)`;
the Productivity widget subscribes and re-renders. Scores are always computed
live from stored data (utils/score.js), never cached — no drift.

Storage keys (full shapes documented in `storage/store.js` header):
`settings`, `widgets` (per-widget added/visible/x/y/w/h), `tasks`, `notes`,
`habits`, `stats` (per-date focus sessions/minutes), `timeTrack` (per-date
browser/learning minutes — written ONLY by background.js; newtab treats it as
read-only and mirrors external writes via storage.onChanged).

Scoring (utils/score.js): task +10, focus session +20, habit +8, course +15,
lab +25, learning +1/min, capped at 100/day. **Interpretation:** completed
tasks in category "Cybersecurity" count as labs, "University" as courses,
the rest as plain tasks. Heat levels: 0 pts→0, 1-24→1, 25-49→2, 50-74→3, ≥75→4.

## File map

### Root
- **`manifest.json`** — MV3. `chrome_url_overrides.newtab`; permissions
  `storage, notifications, alarms`; `optional_permissions: ["tabs"]` (requested
  only when the user enables time tracking); dual `background` keys
  (`service_worker` for Chromium, `scripts` for Firefox — Chrome ≥121 and
  Firefox ≥121 each ignore the other's key, hence `strict_min_version: 121.0`);
  `browser_specific_settings.gecko.id`; icons. Complete.
- **`newtab.html`** — markup only: greeting line + "OpenFocus" heading share one
  flex row (`.greeting-heading-row`, baseline-aligned — per user request, put
  on the same line without touching either element's font size/color), search
  box (verbatim from original design incl. 🔍 pill copy, Gmail button, and Google Lens button), Add Widget button,
  empty `#canvas` (widget layer), `#modalRoot`, and `#welcomeRoot`. Complete.
- **`background.js`** — opt-in time tracking. Plain script (NOT a module) so
  the same file runs as Chrome service worker and Firefox event page; its two
  tiny helpers (`localDateKey`, hostname check) are duplicated from utils by
  design — documented in its header. Every 1-min alarm: if `settings.tracking`
  and a window is focused, +1 `totalMinutes` to today's `timeTrack`,
  +1 `learningMinutes` if active tab host matches `settings.learningDomains`.
  Uses `globalThis.browser ?? globalThis.chrome` (no polyfill needed — MV3
  chrome.* is promise-based). Complete; idle-detection not implemented (see
  roadmap).

### `storage/`
- **`store.js`** — `Store` class + `DEFAULTS`: `load()`, `get(key)`,
  `set(key, value)`, `touch(key)` (schedule debounced 300ms persist after
  in-place mutation). Falls back to an in-memory backend ONLY when running
  outside an extension (dev preview over HTTP, where the polyfill refuses to
  load); real builds always use browser.storage.local. Complete.
- **`backup.js`** — Isolated backup & restore module. All logic lives here;
  `settingsModal.js` delegates to it. Exports:
  - `exportBackup(store)` — snapshots every key in `DEFAULTS`, serialises to
    pretty JSON (2-space, UTF-8), and triggers a browser download named
    `OpenFocus-Backup-YYYY-MM-DD.json`. No server. No network.
  - `validateBackup(parsed)` → `{ valid, error }` — checks type, required
    fields (`version`, `exportedAt`), and version ceiling.
  - `migrateBackup(parsed)` — `switch(version)` skeleton; `case 1` is a
    pass-through. Add future migration logic here.
  - `importBackup({ onPreview, onError })` — opens a hidden `<input type=file>`
    (`.json` only), reads with `FileReader`, validates, migrates, then calls
    `onPreview(data)` or `onError(msg)`. Never writes storage directly.
  - `restoreBackup(store, data)` — writes all backup keys into `store`, flushes
    the debounced writers synchronously (direct `backend.set`), then reloads.
  - `resetWorkspace(store)` — resets every key to its `DEFAULTS` value,
    flushes, then reloads.
  - `buildSummary(data)` → `Array<{label, value}>` — human-readable counts for
    the import preview card (widgets, tasks, notes, habits, shortcuts, stats).

  **Backup format (v1):**
  ```json
  {
    "version": 1,
    "exportedAt": "<ISO-8601>",
    "settings":        { "..." },
    "widgets":         { "..." },
    "tasks":           [ "..." ],
    "notes":           [ "..." ],
    "habits":          [ "..." ],
    "stats":           { "..." },
    "timeTrack":       { "..." },
    "shortcuts":       [ "..." ],
    "shortcutFolders": [ "..." ]
  }
  ```
  All keys are derived from `DEFAULTS` at export time. New keys added to
  `DEFAULTS` are automatically included. Unknown keys in an imported file are
  silently ignored. Missing optional keys fall back to `DEFAULTS` values.

  **Versioning & migration:** Increment `CURRENT_VERSION` and add a `case`
  block in `migrateBackup()` whenever the schema changes. Old backups with
  lower version numbers are migrated up automatically before restore.

  **Error handling:** `validateBackup` returns a friendly string for every
  failure mode (corrupt JSON, missing fields, unsupported version). The UI
  shows the message inline and never crashes or modifies storage on error.


### `src/` (Core Application)
- **`src/newtab/index.js`** — entry point; init order: store → check first-run (welcome screen) → greeting → search →
  widget manager (`applyAll()` restores added/visible widgets) → Theme / Game /
  **Settings** / Add Widget buttons wired. Complete.
- **`src/newtab/greeting.js`** — `initGreeting(store)`. Morning 5-12h / Afternoon 12-17h /
  Evening 17-21h / Night otherwise; re-checks every minute. Reads `settings.name` and appends it to the greeting.
- **`src/newtab/search.js`** — `initSearch()`. Original behavior verbatim: URL-looking
  input navigates, else Google search. Complete.
- **`src/config/googleConfig.js`** — Google OAuth 2.0 Client ID for "Sign in with Google".
- **`src/birthday/birthdayOverlay.js`** — Premium full-screen Birthday Celebration overlay. Activated on the user's birthday or via Developer Demo Mode in Settings. Plays a sequenced animation including a greeting, an odometer-style age counter, a minimalist SVG cake with an interactive candle (click/space to blow out), premium grayscale/gold confetti, and a personalized message with a gift quote.

- **`src/ui/`** (Widget primitives)
  - **`draggable.js`** — `makeDraggable` (drag from header), `makeResizable`, `bringToFront`.
  - **`widgetFrame.js`** — `createWidgetFrame`: panel frame + draggable header.
  - **`widgetManager.js`** — reconciles persisted `widgets` state with the DOM. Lazy-loads widget modules.

- **`src/modals/`** (Modals)
  - **`widgetLibrary.js`** — lists all widgets with contextual Add / Show / Hide / Remove actions.
  - **`settingsModal.js`** — Sidebar-nav modal (Data Management: Export, Import, Reset).
  - **`themeModal.js`** — Theme selection overlay.
  - **`gameModal.js`** — Game background selection overlay.

- **`src/theme/`**
  - **`themeManager.js`** — `ThemeManager` class; loads and applies animated background themes from `themes/`.

- **`src/onboarding/`** (Interactive Tour System)
  - **`TourManager.js`** — The core engine.
  - **`Spotlight.js`** — Manages the full-screen overlay and animated dark spotlight.
  - **`TourCard.js`** — Floating UI card displaying the explanation and navigation.
  - **`tourSteps.js`** — Configuration array defining all steps.
  - **`tourHelpers.js`** — Utilities for smooth scrolling and sleeping.

### `widgets/` (each exports `mount(body, {store})`, may return cleanup fn)
- **`index.js`** — `WIDGET_DEFS` (metadata only: title, blurb, default width —
  keeps listing cheap) + `loadWidget(id)` dynamic import. Add new widgets here.
- **`timer.js`** — Focus Timer. Presets 15/25/45/60 + custom (1-240 min,
  persisted in `settings.timerMinutes`); start/pause/reset; original SVG
  progress ring (r=22, circumference 138.2); on completion: records
  session+minutes into `stats[today]`, browser notification, optional beep
  (WebAudio oscillator — no sound asset; toggle persisted in
  `settings.sound`); shows today's session count/minutes. Cleanup clears the
  interval. Complete.
- **`tasks.js`** — Focus Tasks weekly planner (NOT a flat todo list). Day tabs
  Mon-Sun (Mon-based weeks); list shows only the selected day; selected tab
  maps to that weekday's date in the CURRENT week. Task fields: title,
  category (Cybersecurity/University/Health/Personal/Work), priority
  (Low/Medium/High), due day, recurring + weekday multi-select. Recurring
  tasks stored ONCE (`days[]`) with completion tracked per calendar date in
  `completions{dateKey:true}` — done Monday is automatically incomplete
  Tuesday, history preserved. Row actions (hover/focus): edit, duplicate,
  convert-to/stop-recurring, delete. Completed section + "N left" count per
  day. Complete.
- **`notes.js`** — Sticky Notes: manager panel (new/open/close/duplicate/
  delete, live titles) + unlimited independently floating notes on the canvas
  (own drag/resize/overlap; position/size/title/content/open persisted;
  content autosaves debounced 400ms; floating layer rebuilt only on
  open/close/create/delete so typing never loses focus). Cleanup removes the
  floating layer. Complete.
- **`habits.js`** — daily habits: add/inline-rename/delete/complete-today;
  per-date history; current streak (tolerates today being still-open), 7-day
  and 30-day completion %. Complete.
- **`productivity.js`** — 12-week × 7-day grayscale heatmap (`--heat-*` vars,
  future cells dimmed), native-tooltip per cell (date, score, tasks, habits,
  focus, labs, courses, study minutes), Today/Streak/Week/Month stat cards,
  legend, and the time-tracking opt-in (requests optional `tabs` permission on
  click, sets `settings.tracking`; shows today's browser/study minutes and a
  disable button when on). Subscribes to DATA_CHANGED; cleanup unsubscribes.
  Complete.

### `utils/` (pure helpers; no storage, no global DOM state)
- **`dom.js`** — `el()` / `svgEl()` element builders (textContent only — no
  innerHTML with user data, so no XSS surface), `iconBtn()`, `debounce()`,
  `uid()`, `clamp()`.
- **`dates.js`** — LOCAL date keys `YYYY-MM-DD` (deliberately not
  toISOString/UTC), Mon-based `weekdayIndex`/`dateOfWeekday`, `addDays`,
  `greetingFor(hour)`, `DAY_NAMES`, `shortLabel`.
- **`score.js`** — `WEIGHTS`, `dayBreakdown(key, data)`, `dayScore()`,
  `heatLevel()`. See Scoring above.
- **`bus.js`** — tiny pub/sub; `on()` returns unsubscribe; `EVENTS.DATA_CHANGED`.

### `styles/`
- **`base.css`** — theme tokens (`:root` palette + `--heat-0..4`), reset, home
  layout, greeting, heading, search box (all original values verbatim), Add
  Widget button, global `:focus-visible`, `.hidden`.
- **`widgets.css`** — canvas layer (pointer-events pass-through on empty
  space), widget frame/header/actions/grip, shared controls (`.pill-btn`,
  `.chip`, `.field`, `.icon-action`, `.count`, inline form), list rows
  (original todo-list styles extended with badges/meta/row-actions), per-widget
  styles (day tabs, task form, timer — original values, heatmap, stat cards,
  floating notes).
- **`modal.css`** — library modal overlay/dialog/rows.

### `assets/` & `vendor/`
- **`assets/icon-48.png`, `icon-128.png`** — generated grayscale icons.
- **`vendor/browser-polyfill.min.js`** — vendored webextension-polyfill v0.12.0.

### `.claude/launch.json`
Dev preview config: `npx serve -l 8532 .` for browser-preview smoke tests
(extension APIs unavailable there; storage falls back to memory).

## Completed work
- v1: static preview converted to a working MV3 extension (search/timer/todo).
- v2 (current): full widget system per spec — home screen reduced to
  greeting/logo/search/Add Widget; widget library modal; drag/resize/hide/
  remove/re-add with persisted geometry & visibility; storage layer with
  debounced writes; weekly-planner tasks with recurring-per-date completion;
  floating sticky notes; habit streaks; productivity heatmap + live scoring;
  timer presets/notification/sound/session stats; opt-in background time
  tracking; accessibility pass (ARIA labels/roles, keyboard focus states,
  semantic elements, buttons everywhere clickable things exist).
- Smoke-tested in browser preview (memory-storage mode): home screen contents,
  greeting period, library add/hide/show/remove/re-add, recurring task
  completed Mon → incomplete Tue → Mon history kept, habit streak/percentages,
  floating note create/type, heatmap cell levels + tooltip breakdown + stat
  math (verified 8/25/33 pts cases), drag +Δ persistence, timer countdown/
  pause/preset switch.

## Pending work / known gaps
- **Not yet loaded in a real browser.** Load unpacked in Brave
  (`brave://extensions`) and Firefox (`about:debugging` → Load Temporary
  Add-on) to verify: storage persistence across tabs, notifications, optional
  `tabs` permission prompt, background alarm ticking, dual background keys.
- Settings UI (rename greeting user, edit learning domains, notification
  toggle) — data model ready (`settings`), no surface yet.
- Time tracking counts focused-window minutes only; no idle detection
  (`idle` API) — minutes accrue if the window is focused but user is away.
- "Browser Study Time" ↔ Focus-time correlation (spec mentions "Focus time"
  as a measurable) — currently focus minutes come from completed timer
  sessions only.
- Multiple simultaneously open new-tab pages can race on the same storage key
  (last debounced write wins). Acceptable for personal use; revisit if it
  bites.
- Heatmap cells use native `title` tooltips; a styled tooltip + keyboard
  access to individual cells would be nicer (cells are `aria`-summarized at
  the grid level today).

## Development roadmap
1. Real-browser verification pass (Brave + Firefox) — first thing next session.
2. Settings widget/panel: greeting name, learning domains, sound/notification
   defaults, week-start preference.
3. Idle-aware time tracking (`idle` permission optional).
4. Import/export of all storage (JSON backup).
5. Store-listing polish if ever published: better icons, screenshots, AMO
   signing.

## Future ideas
- Per-widget settings (e.g. heatmap week count, timer auto-start breaks).
- Task search/filter across days; drag tasks between days.
- Note markdown rendering toggle.
- Weekly review summary card (auto-generated Monday morning).

## Agent notes
- Test flow: `preview_start` (static-preview) → interact via preview_eval;
  extension APIs are absent there (polyfill throws by design; Store falls back
  to memory). Real persistence/notifications need a browser load.
- When adding a widget: entry in `widgets/index.js` WIDGET_DEFS + module in
  `widgets/<id>.js` exporting `mount(body, {store})` (return cleanup fn if you
  hold timers/subscriptions/floating DOM). Nothing else to touch.
- Never write `timeTrack` from newtab code; it belongs to background.js.
- Keep `background.js` a plain script; don't convert it to a module or import
  utils into it.
- Date keys are LOCAL — don't introduce toISOString anywhere near storage.
