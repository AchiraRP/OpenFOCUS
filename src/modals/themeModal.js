/**
 * Theme selector modal. Moved to src/modals/; inline styles replaced with
 * CSS classes (.selector-btn, .selector-btn--active) defined in modal.css.
 */

import { el } from '../../utils/dom.js';

export function openThemeSelector(modalRoot, store, themeManager) {
  let currentTheme = store.get('settings').theme || 'minimal';
  if (currentTheme === 'default') currentTheme = 'minimal';
  
  const makeIcon = (path, name) => `<div style="display: flex; align-items: center; gap: 8px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg><span>${name}</span></div>`;

  const themes = [
    { id: 'minimal', html: makeIcon('<circle cx="12" cy="12" r="10"></circle>', 'Minimal Grayscale (Default)') },
    { id: 'hacker_green', html: makeIcon('<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>', 'Hacker Terminal (Green Matrix)') },
    { id: 'hacker_white', html: makeIcon('<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>', 'Hacker Terminal (White Matrix)') },
    { id: 'snow', html: makeIcon('<line x1="12" y1="2" x2="12" y2="22"></line><line x1="22" y1="12" x2="2" y2="12"></line><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"></line><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>', 'Winter (Falling Snow)') },
    { id: 'real_snow', html: makeIcon('<line x1="12" y1="2" x2="12" y2="22"></line><line x1="22" y1="12" x2="2" y2="12"></line><line x1="19.07" y1="4.93" x2="4.93" y2="19.07"></line><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>', 'Flurry (Real Snow)') },
    { id: 'snow_storm', html: makeIcon('<path d="M12 2l9 5v10l-9 5-9-5V7l9-5z"></path>', 'Angry Bees') },
    { id: 'star', html: makeIcon('<polygon points="12 2 15 8.5 22 9.3 17 14 18.5 21 12 17.3 5.5 21 7 14 2 9.3 9 8.5 12 2"></polygon>', 'Constellations (Interactive Stars)') },
    { id: 'game_of_life', html: makeIcon('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line>', 'Meaningless') }
  ];

  const content = el('div', { class: 'modal-body selector-list' },
    ...themes.map(t => {
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
    el('h2', { class: 'modal-title', text: 'Select Theme' }),
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
