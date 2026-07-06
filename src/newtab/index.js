/**
 * New tab entry point. Loads persisted state once, then wires up the four
 * home-screen elements (greeting, logo is static, search, Add Widget) and
 * restores whichever widgets were added/visible last session.
 */

import { Store } from '../../storage/store.js';
import { initGreeting } from './greeting.js';
import { initSearch } from './search.js';
import { createWidgetManager } from '../ui/widgetManager.js';
import { openWidgetLibrary } from '../modals/widgetLibrary.js';
import { TourManager } from '../onboarding/TourManager.js';
import { ThemeManager } from '../theme/themeManager.js';
import { openThemeSelector } from '../modals/themeModal.js';
import { openGameSelector } from '../modals/gameModal.js';
import { openSettingsModal } from '../modals/settingsModal.js';
import { BirthdayOverlay } from '../birthday/birthdayOverlay.js';

async function init() {
  const store = new Store();
  await store.load();

  initGreeting(store);
  initSearch(store);

  const themeManager = new ThemeManager(store, 'themeCanvasContainer');
  themeManager.init();

  const canvas = document.getElementById('canvas');
  const modalRoot = document.getElementById('modalRoot');
  const manager = createWidgetManager(store, canvas);
  manager.applyAll();

  const themeBtn = document.getElementById('themeBtn');
  const gameBtn = document.getElementById('gameBtn');
  const addWidgetBtn = document.getElementById('addWidgetBtn');

  function syncButtonVisibility() {
    const s = store.get('settings');
    themeBtn.style.display = s.showThemeBtn ? '' : 'none';
    gameBtn.style.display = s.showGameBtn ? '' : 'none';
    addWidgetBtn.style.display = s.showAddWidget ? '' : 'none';
  }
  syncButtonVisibility();

  // Apply custom background if set
  const overlay = document.getElementById('customBgOverlay');
  if (overlay) {
    const s = store.get('settings');
    if (s.customBgImage) {
      overlay.style.backgroundImage = `url("${s.customBgImage}")`;
      overlay.style.opacity = s.customBgOpacity !== undefined ? s.customBgOpacity : 0.5;
    }
  }

  themeBtn.addEventListener('click', () => {
    openThemeSelector(modalRoot, store, themeManager);
  });
  
  gameBtn.addEventListener('click', () => {
    openGameSelector(modalRoot, store, themeManager);
  });

  document.getElementById('settingsBtn').addEventListener('click', () => {
    openSettingsModal(modalRoot, store, themeManager, manager, syncButtonVisibility);
  });

  document.getElementById('addWidgetBtn').addEventListener('click', () => {
    openWidgetLibrary(modalRoot, manager);
  });

  const testBdayBtn = document.getElementById('testBdayBtn');
  if (testBdayBtn) {
    testBdayBtn.addEventListener('click', () => {
      const s = store.get('settings');
      const age = new Date().getFullYear() - 2004;
      const overlay = new BirthdayOverlay(store, age, s.name || 'Achira');
      overlay.init();
    });
  }

  // ---- Birthday check ----------------------------------------------------
  const s = store.get('settings');
  const bday = s.birthday || {};
  const today = new Date();
  const currentYear = today.getFullYear();
  
  const isBirthday = bday.month === today.getMonth() + 1 && bday.day === today.getDate();
  const isDemo = bday.demoMode;
  
  if ((isBirthday || isDemo) && bday.lastShownYear !== currentYear) {
    const age = bday.year ? currentYear - bday.year : 22;
    const overlay = new BirthdayOverlay(store, age, s.name || 'User');
    overlay.init();
  }

  // ---- Onboarding check --------------------------------------------------
  if (!s.onboardingCompleted || s.onboardingVersion < 1) {
    const tour = new TourManager(store, manager, 'onboardingRoot');
    tour.start();
  }
}

init();
