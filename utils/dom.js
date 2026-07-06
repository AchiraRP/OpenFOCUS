/**
 * DOM helpers shared by all widgets and components.
 * All rendering goes through `el()` / text nodes — never innerHTML with
 * user content — so no HTML-escaping helper is needed.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create an HTML element.
 * @param {string} tag
 * @param {Object} [attrs] - `class` sets className, `text` sets textContent,
 *   keys starting with "on" attach listeners (e.g. onclick), everything else
 *   becomes an attribute. Null/undefined values are skipped.
 * @param {...(Node|string|null)} children
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  applyAttrs(node, attrs);
  for (const child of children) if (child != null) node.append(child);
  return node;
}

/** Create an SVG element (SVG needs a namespaced constructor). */
export function svgEl(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) node.setAttribute(key, value);
  }
  for (const child of children) if (child != null) node.append(child);
  return node;
}

function applyAttrs(node, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
}

/** Small icon-style action button with an accessible label. */
export function iconBtn(glyph, label, onClick) {
  return el('button', {
    class: 'icon-action',
    type: 'button',
    'aria-label': label,
    title: label,
    onclick: onClick,
  }, glyph);
}

/** Trailing-edge debounce. */
export function debounce(fn, waitMs) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), waitMs);
  };
}

/** Unique-enough id for stored records. */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
