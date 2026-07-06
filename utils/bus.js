/**
 * Minimal pub/sub bus for cross-widget updates.
 * Currently one event is used: "data-changed" — emitted whenever tasks,
 * habits, or focus stats mutate, so the Productivity widget can re-render.
 */

const listeners = new Map();

/**
 * Subscribe to an event.
 * @returns {() => void} unsubscribe function (call it on widget unmount).
 */
export function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => listeners.get(event)?.delete(handler);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach((handler) => handler(payload));
}

/** Event name constants (avoid stringly-typed typos at call sites). */
export const EVENTS = { DATA_CHANGED: 'data-changed' };
