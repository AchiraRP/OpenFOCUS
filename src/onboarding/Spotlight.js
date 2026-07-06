import { el } from '../../utils/dom.js';

export class Spotlight {
  constructor(root) {
    this.root = root;
    this.overlay = el('div', { class: 'onboarding-overlay' });
    this.spotlight = el('div', { class: 'onboarding-spotlight' });
    this.overlay.appendChild(this.spotlight);
    this.root.appendChild(this.overlay);
  }

  highlight(targetEl) {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const padding = 12;
    
    this.spotlight.style.left = `${rect.left - padding}px`;
    this.spotlight.style.top = `${rect.top - padding}px`;
    this.spotlight.style.width = `${rect.width + padding * 2}px`;
    this.spotlight.style.height = `${rect.height + padding * 2}px`;
  }

  hide() {
    this.spotlight.style.opacity = '0';
  }

  show() {
    this.spotlight.style.opacity = '1';
  }

  destroy() {
    this.overlay.remove();
  }
}
