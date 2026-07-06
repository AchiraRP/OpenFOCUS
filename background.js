/**
 * Background time tracking (opt-in). Runs as a Chrome MV3 service worker AND
 * a Firefox MV3 event page — the manifest declares both background keys and
 * each browser loads this same file, so it stays a plain script (no ES
 * imports; the few helpers it needs are duplicated here by design).
 *
 * Every minute (alarms API) while tracking is enabled in settings AND the
 * browser window is focused, it adds one minute to today's totalMinutes in
 * the `timeTrack` storage key — plus learningMinutes when the active tab's
 * host matches settings.learningDomains. Reading tab URLs requires the
 * optional "tabs" permission, which the Productivity widget requests when
 * the user opts in. The newtab page treats timeTrack as read-only.
 */

const api = globalThis.browser ?? globalThis.chrome;

const TICK_ALARM = 'time-track-tick';
const TICK_PERIOD_MINUTES = 1;

api.alarms.create(TICK_ALARM, { periodInMinutes: TICK_PERIOD_MINUTES });

api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === TICK_ALARM) recordTick();
});

/** Local-date key (YYYY-MM-DD); duplicated from utils/dates.js — see header. */
function localDateKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isLearningHost(host, domains) {
  return !!host && domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

async function recordTick() {
  const { settings } = await api.storage.local.get('settings');
  if (!settings || !settings.tracking) return;

  let focusedWindow;
  try {
    focusedWindow = await api.windows.getLastFocused();
  } catch {
    return;
  }
  if (!focusedWindow || !focusedWindow.focused) return; // browser not in use

  const tabs = await api.tabs.query({ active: true, windowId: focusedWindow.id });
  const activeUrl = tabs[0] ? tabs[0].url : null; // undefined without "tabs" permission

  const stored = await api.storage.local.get('timeTrack');
  const timeTrack = stored.timeTrack || {};
  const key = localDateKey();
  const day = timeTrack[key] || { totalMinutes: 0, learningMinutes: 0 };
  day.totalMinutes += TICK_PERIOD_MINUTES;
  if (isLearningHost(hostnameOf(activeUrl), settings.learningDomains || [])) {
    day.learningMinutes += TICK_PERIOD_MINUTES;
  }
  timeTrack[key] = day;
  await api.storage.local.set({ timeTrack });
}
