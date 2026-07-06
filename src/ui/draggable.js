/**
 * Pointer-based drag and resize for absolutely positioned elements
 * (widget frames and floating sticky notes).
 *
 * Geometry is applied via element.style.left/top/width/height — dynamic
 * layout state, not theming, so it's the one sanctioned use of inline style.
 */

import { clamp } from '../../utils/dom.js';

// Keep at least this many px of a dragged element inside the viewport.
const MIN_VISIBLE_PX = 60;
const TOP_MARGIN_PX = 8;

const BASE_Z_INDEX = 10;
let zCounter = BASE_Z_INDEX;

/** Raise an element above its floating siblings (per-session, not persisted). */
export function bringToFront(target) {
  zCounter += 1;
  target.style.zIndex = zCounter;
}

/**
 * Make `target` draggable by grabbing `handle`. Drags never start from
 * interactive children (buttons/inputs), so header controls stay clickable.
 * @param {(pos: {x: number, y: number}) => void} [onEnd] - final position on release.
 */
export function makeDraggable(handle, target, onEnd) {
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if (event.target.closest('button, input, textarea, select')) return;
    event.preventDefault();
    bringToFront(target);
    const startX = event.clientX;
    const startY = event.clientY;
    const rect = target.getBoundingClientRect();

    const move = (e) => {
      const x = clamp(
        rect.left + e.clientX - startX,
        MIN_VISIBLE_PX - rect.width,
        window.innerWidth - MIN_VISIBLE_PX,
      );
      const y = clamp(
        rect.top + e.clientY - startY,
        TOP_MARGIN_PX,
        window.innerHeight - MIN_VISIBLE_PX,
      );
      target.style.left = `${x}px`;
      target.style.top = `${y}px`;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const final = target.getBoundingClientRect();
      onEnd?.({ x: Math.round(final.left), y: Math.round(final.top) });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

/**
 * Make `target` resizable from a bottom-right grip element.
 * @param {(size: {w: number, h: number}) => void} [onEnd] - final size on release.
 */
export function makeResizable(grip, target, onEnd, { minWidth = 280, minHeight = 160 } = {}) {
  grip.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    bringToFront(target);
    const startX = event.clientX;
    const startY = event.clientY;
    const rect = target.getBoundingClientRect();

    const move = (e) => {
      const w = Math.max(minWidth, rect.width + e.clientX - startX);
      const h = Math.max(minHeight, rect.height + e.clientY - startY);
      target.style.width = `${w}px`;
      target.style.height = `${h}px`;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const final = target.getBoundingClientRect();
      onEnd?.({ w: Math.round(final.width), h: Math.round(final.height) });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}
