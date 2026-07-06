/**
 * Widget Library modal — lists every available widget with contextual
 * actions (Add / Show / Hide / Remove). Closes on Escape, overlay click,
 * or the ✕ button.
 *
 * Renamed from modal.js to widgetLibrary.js to reflect its actual purpose.
 */

import { el } from '../../utils/dom.js';
import { WIDGET_DEFS } from '../../widgets/index.js';

export function openWidgetLibrary(root, manager) {
  const close = () => {
    root.replaceChildren();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKey);

  const list = el('div', { class: 'library-list' });

  function render() {
    list.replaceChildren();
    for (const [id, def] of Object.entries(WIDGET_DEFS)) {
      const state = manager.widgetState(id);
      const actions = el('div', { class: 'library-actions' });
      if (!state.added) {
        actions.append(pill('Add', () => { manager.setAdded(id, true); render(); }));
      } else {
        actions.append(
          pill(state.visible ? 'Hide' : 'Show', () => { manager.setVisible(id, !state.visible); render(); }),
          pill('Remove', () => { manager.setAdded(id, false); render(); }),
        );
      }
      list.append(el('div', { class: 'library-row' },
        el('div', { class: 'library-info' },
          el('div', { class: 'library-name', text: def.title }),
          el('div', { class: 'library-blurb', text: def.blurb })),
        actions));
    }
  }

  function pill(label, onClick) {
    return el('button', { class: 'pill-btn', type: 'button', text: label, onclick: onClick });
  }

  render();

  const closeBtn = el('button', {
    class: 'widget-action', type: 'button', text: '✕', 'aria-label': 'Close widget library', onclick: close,
  });
  const dialog = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Widget library' },
    el('div', { class: 'modal-header' },
      el('h2', { class: 'modal-title', text: 'Widget Library' }),
      closeBtn),
    list);
  const overlay = el('div', {
    class: 'modal-overlay',
    onclick: (event) => { if (event.target === overlay) close(); },
  }, dialog);

  root.replaceChildren(overlay);
  closeBtn.focus();
}
