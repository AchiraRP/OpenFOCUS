/**
 * Game background selector modal. Moved to src/modals/; inline styles
 * replaced with CSS classes (.selector-btn, .selector-btn--active).
 */

import { el } from '../../utils/dom.js';

export function openGameSelector(modalRoot, store, themeManager) {
  let currentTheme = store.get('settings').theme || 'minimal';
  
  const makeIcon = (path, name) => `<div style="display: flex; align-items: center; gap: 8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg><span>${name}</span></div>`;

  const games = [
    { id: 'snake_game', html: makeIcon('<path d="M3 15C3 17.8 5.2 20 8 20C10.8 20 13 17.8 13 15V9C13 6.2 15.2 4 18 4C20.8 4 23 6.2 23 9"></path>', 'Snake Game') },
    { id: 'pong', html: makeIcon('<rect x="2" y="6" width="4" height="12" rx="1"></rect><rect x="18" y="6" width="4" height="12" rx="1"></rect><circle cx="12" cy="12" r="2"></circle>', 'Pong') },
    { id: 'tetris', html: makeIcon('<rect x="10" y="4" width="4" height="4"></rect><rect x="10" y="8" width="4" height="4"></rect><rect x="10" y="12" width="4" height="4"></rect><rect x="14" y="12" width="4" height="4"></rect>', 'Tetris') },
    { id: 'breakout', html: makeIcon('<rect x="3" y="3" width="5" height="4"></rect><rect x="9" y="3" width="5" height="4"></rect><rect x="15" y="3" width="5" height="4"></rect><rect x="8" y="20" width="8" height="2"></rect><circle cx="12" cy="15" r="2"></circle>', 'Breakout') },
    { id: 'flappy', html: makeIcon('<path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z"></path><path d="M12 16v-4"></path><path d="M12 8h.01"></path>', 'Flappy Bird') },
    { id: 'asteroids', html: makeIcon('<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>', 'Asteroids') },
    { id: 'tron', html: makeIcon('<path d="M4 17l6-6-6-6"></path><path d="M12 19h8"></path>', 'Tron Light Cycles') },
    { id: 'space_invaders', html: makeIcon('<path d="M12 2A10 10 0 1 0 22 12"></path><path d="M22 12A10 10 0 0 0 12 22"></path>', 'Space Invaders') },
    { id: 'dino_runner', html: makeIcon('<path d="M3 20l5-5 5 5"></path><path d="M13 20l5-5 5 5"></path>', 'Dino Runner') },
    { id: 'minesweeper', html: makeIcon('<circle cx="11" cy="13" r="7"></circle><path d="M16 8l3-3"></path><path d="M19.5 4a1.5 1.5 0 0 0 0-3 1.5 1.5 0 0 0 0 3z"></path>', 'Minesweeper') }
  ];

  const content = el('div', { class: 'modal-body selector-list' },
    ...games.map(t => {
      const isActive = t.id === currentTheme;
      const btn = el('button', {
        class: `selector-btn${isActive ? ' selector-btn--active' : ''}`,
        html: t.html,
        type: 'button',
        onclick: () => {
          store.set('settings', { ...store.get('settings'), theme: t.id });
          themeManager.apply(t.id);
          close();
        }
      });
      return btn;
    })
  );

  const header = el('header', { class: 'modal-header' },
    el('h2', { class: 'modal-title', text: 'Select Game Background' }),
    el('button', { class: 'modal-action', text: '✕', title: 'Close', onclick: close })
  );
  
  const windowEl = el('section', { class: 'modal-window' }, header, content);
  const overlay = el('div', { class: 'modal-overlay', onclick: close }, windowEl);

  function close(e) {
    if (e && e.target !== overlay && e.currentTarget !== e.target) return;
    overlay.remove();
  }

  modalRoot.replaceChildren(overlay);
}
