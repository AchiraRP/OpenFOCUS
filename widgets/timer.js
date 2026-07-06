/**
 * Focus Timer widget. Preset (15/25/45/60) or custom duration, start/pause/
 * reset, SVG progress ring (same visual as the original design), completion
 * notification + optional beep. Completed sessions and focused minutes are
 * recorded into stats[dateKey] for the Productivity widget.
 */

import { el, svgEl, clamp } from '../utils/dom.js';
import { dateKey } from '../utils/dates.js';
import * as bus from '../utils/bus.js';

const PRESET_MINUTES = [15, 25, 45, 60];
const MIN_MINUTES = 1;
const MAX_MINUTES = 240;
const SECONDS_PER_MINUTE = 60;
const TICK_MS = 1000;

// Ring geometry, identical to the original design (r=22 → 2πr ≈ 138.2).
const RING_SIZE = 54;
const RING_RADIUS = 22;
const RING_CIRCUMFERENCE = 138.2;

const BEEP_FREQUENCY_HZ = 880;
const BEEP_DURATION_S = 0.25;
const BEEP_GAIN = 0.08;

export function mount(body, { store }) {
  let durationMinutes = store.get('settings').timerMinutes;
  let secondsLeft = durationMinutes * SECONDS_PER_MINUTE;
  let intervalId = null;
  let running = false;

  // --- Static DOM ---
  const timeText = el('div', { class: 'timer-text', text: formatTime(secondsLeft) });
  const ring = svgEl('circle', {
    class: 'timer-ring-progress',
    cx: RING_SIZE / 2, cy: RING_SIZE / 2, r: RING_RADIUS,
    'stroke-dasharray': RING_CIRCUMFERENCE, 'stroke-dashoffset': 0,
  });
  const startPauseBtn = el('button', { class: 'primary', type: 'button', text: 'Start', onclick: toggle });
  const resetBtn = el('button', { type: 'button', text: 'Reset', onclick: reset });
  const customInput = el('input', {
    class: 'field timer-custom', type: 'number', min: MIN_MINUTES, max: MAX_MINUTES,
    value: durationMinutes, 'aria-label': 'Custom duration in minutes',
  });
  customInput.addEventListener('change', () => setDuration(Number.parseInt(customInput.value, 10)));
  const presetsRow = el('div', { class: 'timer-presets', role: 'group', 'aria-label': 'Timer duration' },
    ...PRESET_MINUTES.map((minutes) => el('button', {
      class: 'chip', type: 'button', text: `${minutes}m`,
      'data-minutes': minutes, onclick: () => setDuration(minutes),
    })),
    customInput);
  const statsLine = el('p', { class: 'timer-stats' });
  const soundToggle = el('input', { type: 'checkbox', ...(store.get('settings').sound ? { checked: '' } : {}) });
  soundToggle.addEventListener('change', () => {
    store.get('settings').sound = soundToggle.checked;
    store.touch('settings');
  });

  body.append(
    el('div', { class: 'timer-body' },
      el('div', { class: 'timer-left' },
        el('div', { class: 'timer-ring-wrap' },
          svgEl('svg', { width: RING_SIZE, height: RING_SIZE, viewBox: `0 0 ${RING_SIZE} ${RING_SIZE}` },
            svgEl('circle', { class: 'timer-ring-bg', cx: RING_SIZE / 2, cy: RING_SIZE / 2, r: RING_RADIUS }),
            ring)),
        timeText),
      el('div', { class: 'timer-controls' }, resetBtn, startPauseBtn)),
    presetsRow,
    el('div', { class: 'timer-footer' },
      statsLine,
      el('label', { class: 'check-label' }, soundToggle, ' Sound')),
  );
  updatePresetHighlight();
  updateStatsLine();

  // --- Behavior ---
  function formatTime(totalSeconds) {
    const m = String(Math.floor(totalSeconds / SECONDS_PER_MINUTE)).padStart(2, '0');
    const s = String(totalSeconds % SECONDS_PER_MINUTE).padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateDisplay() {
    timeText.textContent = formatTime(secondsLeft);
    const progress = secondsLeft / (durationMinutes * SECONDS_PER_MINUTE);
    ring.setAttribute('stroke-dashoffset', RING_CIRCUMFERENCE * (1 - progress));
  }

  function toggle() {
    running ? pause() : start();
  }

  function start() {
    running = true;
    startPauseBtn.textContent = 'Pause';
    intervalId = setInterval(tick, TICK_MS);
  }

  function pause() {
    running = false;
    startPauseBtn.textContent = 'Start';
    clearInterval(intervalId);
  }

  function reset() {
    pause();
    secondsLeft = durationMinutes * SECONDS_PER_MINUTE;
    updateDisplay();
  }

  function tick() {
    if (secondsLeft > 0) {
      secondsLeft -= 1;
      updateDisplay();
      if (secondsLeft === 0) complete();
    }
  }

  function setDuration(minutes) {
    if (!Number.isFinite(minutes)) return;
    durationMinutes = clamp(minutes, MIN_MINUTES, MAX_MINUTES);
    customInput.value = durationMinutes;
    store.get('settings').timerMinutes = durationMinutes;
    store.touch('settings');
    updatePresetHighlight();
    reset();
  }

  function updatePresetHighlight() {
    for (const chip of presetsRow.querySelectorAll('.chip')) {
      const active = Number(chip.dataset.minutes) === durationMinutes;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    }
  }

  function complete() {
    pause();
    recordSession();
    notify();
    if (store.get('settings').sound) beep();
    secondsLeft = durationMinutes * SECONDS_PER_MINUTE;
    updateDisplay();
  }

  function recordSession() {
    const stats = store.get('stats');
    const key = dateKey();
    const day = stats[key] ?? (stats[key] = { focusSessions: 0, focusMinutes: 0 });
    day.focusSessions += 1;
    day.focusMinutes += durationMinutes;
    store.touch('stats');
    bus.emit(bus.EVENTS.DATA_CHANGED);
    updateStatsLine();
  }

  function updateStatsLine() {
    const today = store.get('stats')[dateKey()] ?? { focusSessions: 0, focusMinutes: 0 };
    statsLine.textContent = `${today.focusSessions} sessions · ${today.focusMinutes} min focused today`;
  }

  async function notify() {
    const api = globalThis.browser;
    if (!api?.notifications) return; // dev preview outside the extension
    try {
      await api.notifications.create({
        type: 'basic',
        title: 'Focus session complete',
        message: `${durationMinutes} minutes of focus done. Take a break.`,
        iconUrl: api.runtime.getURL('assets/icon-128.png'),
      });
    } catch {
      // Notifications can fail silently (e.g. OS-level denial) — not fatal.
    }
  }

  function beep() {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = BEEP_FREQUENCY_HZ;
    gain.gain.setValueAtTime(BEEP_GAIN, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + BEEP_DURATION_S);
    oscillator.onended = () => ctx.close();
  }

  return () => clearInterval(intervalId);
}
