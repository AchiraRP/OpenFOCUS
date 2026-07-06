/**
 * Time-of-day greeting ("Good Morning," etc.).
 * settings.name is kept in storage and rendered here each minute.
 */

import { greetingFor } from '../../utils/dates.js';

// Re-check the greeting once a minute so a tab left open rolls over
// (morning → afternoon) without a reload.
const REFRESH_MS = 60_000;

export function initGreeting(store) {
  const lineEl = document.getElementById('greetingLine');
  const nameEl = document.getElementById('nameHeading');

  const update = () => {
    const name = store.get('settings').name || 'User';
    lineEl.textContent = `${greetingFor(new Date().getHours())},`;
    nameEl.textContent = name.toUpperCase();
  };
  update();
  setInterval(update, REFRESH_MS);
}
