/**
 * Owns which widgets are added/visible and mounts/unmounts them on the
 * canvas. Widget code itself is lazy-loaded (dynamic import) the first time
 * a widget is actually shown, so hidden widgets cost nothing.
 */

import { WIDGET_DEFS, loadWidget } from '../../widgets/index.js';
import { createWidgetFrame } from './widgetFrame.js';

// Cascade offsets for widgets that have never been positioned.
const DEFAULT_X = 48;
const DEFAULT_Y = 96;
const CASCADE_STEP = 36;

export function createWidgetManager(store, canvas) {
  /** id -> { frame, cleanup } for currently mounted widgets. */
  const mounted = new Map();

  /** Persisted state for a widget, creating defaults on first access. */
  function widgetState(id) {
    const widgets = store.get('widgets');
    if (!widgets[id]) {
      widgets[id] = { added: false, visible: true, x: null, y: null, w: null, h: null };
    }
    return widgets[id];
  }

  async function mount(id) {
    if (mounted.has(id)) return;
    const def = WIDGET_DEFS[id];
    const state = widgetState(id);
    const index = Object.keys(WIDGET_DEFS).indexOf(id);
    const geometry = {
      x: state.x ?? DEFAULT_X + index * CASCADE_STEP,
      y: state.y ?? DEFAULT_Y + index * CASCADE_STEP,
      w: state.w ?? def.width,
      h: state.h,
    };
    const { frame, body } = createWidgetFrame({
      id,
      title: def.title,
      geometry,
      onGeometryChange(change) {
        Object.assign(state, change);
        store.touch('widgets');
      },
      onHide: () => setVisible(id, false),
      onRemove: () => setAdded(id, false),
    });
    canvas.append(frame);
    const entry = { frame, cleanup: null };
    mounted.set(id, entry);
    const module = await loadWidget(id);
    // A widget's mount() may return a cleanup fn (stop timers, remove
    // floating elements, unsubscribe from the bus).
    entry.cleanup = module.mount(body, { store }) ?? null;
  }

  function unmount(id) {
    const entry = mounted.get(id);
    if (!entry) return;
    if (typeof entry.cleanup === 'function') entry.cleanup();
    entry.frame.remove();
    mounted.delete(id);
  }

  /** Reconcile the DOM with the persisted added/visible flags. */
  function applyAll() {
    for (const id of Object.keys(WIDGET_DEFS)) {
      const state = widgetState(id);
      if (state.added && state.visible) mount(id);
      else unmount(id);
    }
  }

  function setAdded(id, added) {
    const state = widgetState(id);
    state.added = added;
    if (added) state.visible = true; // re-adding always shows it
    store.touch('widgets');
    applyAll();
  }

  function setVisible(id, visible) {
    const state = widgetState(id);
    state.visible = visible;
    store.touch('widgets');
    applyAll();
  }

  return { applyAll, setAdded, setVisible, widgetState };
}
