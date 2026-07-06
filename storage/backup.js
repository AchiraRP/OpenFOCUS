/**
 * backup.js — OpenFocus Backup & Restore
 *
 * All backup logic is isolated here so it can evolve independently of
 * the rest of the storage layer.
 *
 * Public API
 * ----------
 *   exportBackup(store)          → downloads a JSON file (no return value)
 *   validateBackup(parsed)       → { valid: bool, error: string|null }
 *   migrateBackup(parsed)        → migrated data object (throws on unsupported version)
 *   importBackup(store, callbacks) → opens file picker, validates, calls back for
 *                                    preview + confirmation before writing storage
 *
 * Backup format
 * -------------
 * {
 *   "version": 1,
 *   "exportedAt": "<ISO-8601>",
 *   "settings":        { … },
 *   "widgets":         { … },
 *   "tasks":           [ … ],
 *   "notes":           [ … ],
 *   "habits":          [ … ],
 *   "stats":           { … },
 *   "timeTrack":       { … },
 *   "shortcuts":       [ … ],
 *   "shortcutFolders": [ … ]
 * }
 *
 * Versioning
 * ----------
 * Increment CURRENT_VERSION whenever the schema changes. Add a migration
 * block inside migrateBackup() for each old version.
 */

import { DEFAULTS } from './store.js';

/** The current schema version written into every export. */
export const CURRENT_VERSION = 1;

/**
 * All storage keys that belong in a backup.
 * Derived directly from DEFAULTS so new keys are automatically included.
 */
const BACKUP_KEYS = Object.keys(DEFAULTS);

/** Required top-level fields that must be present in any valid backup. */
const REQUIRED_FIELDS = ['version', 'exportedAt'];

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Collect all storage keys from the in-memory store and trigger a download.
 * Never throws — catches and re-throws with a user-friendly message.
 *
 * @param {import('./store.js').Store} store
 */
export function exportBackup(store) {
  try {
    const payload = {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
    };

    for (const key of BACKUP_KEYS) {
      // Deep-clone so the export is a snapshot, not a live reference.
      const value = store.get(key);
      payload[key] = value !== undefined ? structuredClone(value) : DEFAULTS[key];
    }

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url  = URL.createObjectURL(blob);

    const date   = _localDateString();
    const anchor = document.createElement('a');
    anchor.href     = url;
    anchor.download  = `OpenFocus-Backup-${date}.json`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Revoke after a tick so the download has a chance to start.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    throw new Error(`Unable to export backup. ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a parsed JSON object as an OpenFocus backup.
 *
 * @param {unknown} parsed
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateBackup(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, error: 'This file is not a valid OpenFocus backup.' };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in parsed)) {
      return {
        valid: false,
        error: `Invalid backup file. Missing required field: "${field}".`,
      };
    }
  }

  if (typeof parsed.version !== 'number') {
    return { valid: false, error: 'Invalid backup file. The version field is malformed.' };
  }

  if (parsed.version > CURRENT_VERSION) {
    return {
      valid: false,
      error: `Unsupported backup version (${parsed.version}). Please update OpenFocus.`,
    };
  }

  return { valid: true, error: null };
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

/**
 * Migrate a validated backup object to the current schema version.
 * Add a `case` block here for each schema version that needs transformation.
 *
 * @param {object} parsed  A validated backup object.
 * @returns {object}       A migrated backup object (same reference or new).
 */
export function migrateBackup(parsed) {
  let data = structuredClone(parsed);

  switch (data.version) {
    case 1:
      // v1 is the current schema — nothing to migrate.
      break;

    // case 2:
    //   // Example: rename a field introduced in v2
    //   data = migrateV2toV3(data);
    //   data.version = 3;
    //   break;

    default:
      throw new Error(`Unsupported backup version: ${data.version}`);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Import (orchestrator — UI callbacks provided by settingsModal.js)
// ---------------------------------------------------------------------------

/**
 * Open a file picker, read the selected JSON, validate, and hand control
 * back to the caller via callbacks for the preview/confirm step.
 *
 * This function does NOT write to storage — the caller is responsible for
 * calling `restoreBackup()` after the user confirms.
 *
 * @param {object} callbacks
 * @param {function(object): void}  callbacks.onPreview  — called with the validated+migrated data
 * @param {function(string): void}  callbacks.onError    — called with a user-friendly error string
 */
export function importBackup({ onPreview, onError }) {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  document.body.appendChild(input);

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    document.body.removeChild(input);

    if (!file) return;

    const reader = new FileReader();

    reader.addEventListener('error', () => {
      onError('Unable to read file. The file may be inaccessible or corrupted.');
    });

    reader.addEventListener('load', () => {
      let parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch {
        onError('Backup is corrupted. The file does not contain valid JSON.');
        return;
      }

      const { valid, error } = validateBackup(parsed);
      if (!valid) {
        onError(error);
        return;
      }

      let migrated;
      try {
        migrated = migrateBackup(parsed);
      } catch (err) {
        onError(err.message);
        return;
      }

      onPreview(migrated);
    });

    reader.readAsText(file, 'utf-8');
  });

  input.click();
}

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------

/**
 * Write all keys from a validated, migrated backup into browser.storage.local
 * and reload the page.
 *
 * @param {import('./store.js').Store} store
 * @param {object} data  A validated+migrated backup object.
 */
export async function restoreBackup(store, data) {
  try {
    for (const key of BACKUP_KEYS) {
      if (key in data) {
        store.set(key, data[key]);
      }
    }

    // Wait a tick so the debounced writes are flushed before reload.
    await _flushStore(store);
    location.reload();
  } catch (err) {
    throw new Error(`Storage write failed. ${err.message}`);
  }
}

/**
 * Erase ALL OpenFocus storage keys and reload.
 *
 * @param {import('./store.js').Store} store
 */
export async function resetWorkspace(store) {
  try {
    // Set every key back to its default value.
    for (const [key, defaultValue] of Object.entries(DEFAULTS)) {
      store.set(key, structuredClone(defaultValue));
    }
    await _flushStore(store);
    location.reload();
  } catch (err) {
    throw new Error(`Reset failed. ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Summary helpers (used by settingsModal.js for the preview card)
// ---------------------------------------------------------------------------

/**
 * Build a human-readable summary from a backup object.
 *
 * @param {object} data  Validated+migrated backup.
 * @returns {Array<{label: string, value: string}>}
 */
export function buildSummary(data) {
  const date = data.exportedAt
    ? new Date(data.exportedAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Unknown';

  const widgetCount    = data.widgets  ? Object.keys(data.widgets).filter(k => data.widgets[k]?.added).length : 0;
  const taskCount      = Array.isArray(data.tasks)           ? data.tasks.length           : 0;
  const noteCount      = Array.isArray(data.notes)           ? data.notes.length           : 0;
  const habitCount     = Array.isArray(data.habits)          ? data.habits.length          : 0;
  const shortcutCount  = Array.isArray(data.shortcuts)       ? data.shortcuts.length       : 0;
  const statsCount     = data.stats    ? Object.keys(data.stats).length    : 0;
  const settingsIncluded = !!data.settings;

  return [
    { label: 'Backup Date',         value: date },
    { label: 'Widgets',             value: String(widgetCount) },
    { label: 'Tasks',               value: String(taskCount) },
    { label: 'Notes',               value: String(noteCount) },
    { label: 'Habits',              value: String(habitCount) },
    { label: 'Shortcuts',           value: String(shortcutCount) },
    { label: 'Productivity Records', value: String(statsCount) },
    { label: 'Settings Included',   value: settingsIncluded ? 'Yes' : 'No' },
  ];
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/** Returns "YYYY-MM-DD" in local time. */
function _localDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Force-flush any pending debounced writes by directly calling the backend.
 * This is only needed just before a page reload.
 */
async function _flushStore(store) {
  if (!store.isPersistent) return;
  const batch = {};
  for (const key of BACKUP_KEYS) {
    batch[key] = store.data[key];
  }
  await store.backend.set(batch);
}
