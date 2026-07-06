/**
 * Shared chrome around every widget: the panel-styled frame with a draggable
 * header (drag starts ONLY from the header, never the body), hide/remove
 * controls, and a resize grip.
 */

import { el } from '../../utils/dom.js';
import { makeDraggable, makeResizable, bringToFront } from './draggable.js';

/**
 * @param {Object} options
 * @param {string} options.id - widget id (data attribute for styling/tests)
 * @param {string} options.title - visible header title
 * @param {{x:number, y:number, w:?number, h:?number}} options.geometry
 * @param {(change: Object) => void} options.onGeometryChange - receives {x,y} or {w,h}
 * @param {() => void} options.onHide
 * @param {() => void} options.onRemove
 * @returns {{frame: HTMLElement, body: HTMLElement}}
 */
export function createWidgetFrame({ id, title, geometry, onGeometryChange, onHide, onRemove }) {
  const body = el('div', { class: 'widget-body' });
  const header = el('div', { class: 'widget-header' },
    el('h2', { class: 'widget-title', text: title }),
    el('div', { class: 'widget-actions' },
      el('button', {
        class: 'widget-action', type: 'button', text: '–',
        title: 'Hide', 'aria-label': `Hide ${title}`, onclick: onHide,
      }),
      el('button', {
        class: 'widget-action', type: 'button', text: '✕',
        title: 'Remove', 'aria-label': `Remove ${title}`, onclick: onRemove,
      })));
  const grip = el('div', { class: 'resize-grip', 'aria-hidden': 'true' });
  const frame = el('section', {
    class: 'widget', role: 'region', 'aria-label': title, 'data-widget': id,
  }, header, body, grip);

  frame.style.left = `${geometry.x}px`;
  frame.style.top = `${geometry.y}px`;
  if (geometry.w) frame.style.width = `${geometry.w}px`;
  if (geometry.h) frame.style.height = `${geometry.h}px`;

  frame.addEventListener('pointerdown', () => bringToFront(frame));
  makeDraggable(header, frame, onGeometryChange);
  makeResizable(grip, frame, onGeometryChange);

  return { frame, body };
}
