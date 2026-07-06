import { Spotlight } from './Spotlight.js';
import { TourCard } from './TourCard.js';
import { steps } from './tourSteps.js';
import { sleep } from './tourHelpers.js';

export class TourManager {
  constructor(store, widgetManager, rootId = 'onboardingRoot') {
    this.store = store;
    this.widgetManager = widgetManager;
    this.root = document.getElementById(rootId);
    
    this.currentIndex = 0;
    this.spotlight = new Spotlight(this.root);
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  async start() {
    this.currentIndex = 0;
    this.card = new TourCard(
      this.root,
      () => this.next(),
      () => this.prev(),
      () => this.skip()
    );
    await this.renderStep();
  }

  async renderStep() {
    const step = steps[this.currentIndex];
    
    if (step.beforeEnter) {
      this.spotlight.hide();
      await step.beforeEnter(this);
      await sleep(100);
    }
    
    if (step.targetSelector) {
      this.spotlight.show();
      const el = document.querySelector(step.targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await sleep(300);
        this.spotlight.highlight(el);
      }
    } else {
      this.spotlight.hide();
    }
    
    this.card.update(step, this.currentIndex + 1, steps.length);
  }

  async next() {
    const step = steps[this.currentIndex];
    
    if (step.isNameInput) {
      const name = this.card.nameInput.value.trim();
      if (!name) return; // Wait for input
      const settings = this.store.get('settings');
      this.store.set('settings', { ...settings, name });
      const nameEl = document.getElementById('nameHeading');
      if (nameEl) nameEl.textContent = name.toUpperCase();
    }

    if (step.isBirthdayInput) {
      const month = this.card.monthSelect.value;
      const day = parseInt(this.card.dayInput.value, 10);
      const year = parseInt(this.card.yearInput.value, 10);
      
      const settings = this.store.get('settings');
      const birthday = { ...settings.birthday };
      if (month && !isNaN(day)) {
        birthday.month = parseInt(month, 10);
        birthday.day = day;
        if (!isNaN(year)) birthday.year = year;
      }
      this.store.set('settings', { ...settings, birthday });
    }


    if (step.afterLeave) await step.afterLeave(this);
    
    if (this.currentIndex < steps.length - 1) {
      this.currentIndex++;
      await this.renderStep();
    } else {
      this.finish();
    }
  }

  async prev() {
    if (this.currentIndex > 0) {
      const step = steps[this.currentIndex];
      if (step.afterLeave) await step.afterLeave(this);
      this.currentIndex--;
      await this.renderStep();
    }
  }

  skip() {
    if (confirm('Skip the OpenFocus tour?\n\nYou can restart the tour anytime from Settings.')) {
      this.finish();
    }
  }

  finish() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.spotlight.destroy();
    this.card.destroy();
    
    const settings = this.store.get('settings');
    this.store.set('settings', {
      ...settings,
      onboardingCompleted: true,
      onboardingVersion: 1
    });
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      this.next();
    } else if (e.key === 'ArrowLeft') {
      this.prev();
    } else if (e.key === 'Escape') {
      this.skip();
    }
  }
}
