import { el } from '../../utils/dom.js';

export class TourCard {
  constructor(root, onNext, onPrev, onSkip) {
    this.root = root;
    this.onNext = onNext;
    this.onPrev = onPrev;
    this.onSkip = onSkip;
    
    this.card = el('div', { class: 'tour-card' });
    this.title = el('h3', { class: 'tour-title' });
    this.description = el('p', { class: 'tour-desc' });
    this.progress = el('div', { class: 'tour-progress' });
    
    this.prevBtn = el('button', { class: 'tour-btn prev', text: 'Back', onclick: () => this.onPrev() });
    this.nextBtn = el('button', { class: 'tour-btn next', text: 'Next', onclick: () => this.onNext() });
    this.skipBtn = el('button', { class: 'tour-btn skip', text: 'Skip Tour', onclick: () => this.onSkip() });
    
    this.nameInput = el('input', {
      type: 'text',
      class: 'welcome-input',
      placeholder: 'Your name',
      autocomplete: 'off',
      style: 'display: none; margin-bottom: 24px; width: 100%; box-sizing: border-box;'
    });
    
    // Allow pressing Enter to submit the name
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.onNext();
      }
    });

    this.birthdayContainer = el('div', {
      style: 'display: none; gap: 8px; margin-bottom: 24px; width: 100%; box-sizing: border-box;'
    });
    
    this.monthSelect = el('select', { class: 'welcome-input', style: 'flex: 1; padding: 12px; border-radius: 8px; background: var(--surface); color: var(--text); border: 1px solid var(--border); outline: none;' });
    const months = ['Month', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((m, i) => {
      this.monthSelect.append(el('option', { value: i === 0 ? '' : i, text: m }));
    });
    
    this.dayInput = el('input', {
      type: 'number', class: 'welcome-input', placeholder: 'Day', min: 1, max: 31,
      style: 'width: 80px; padding: 12px; border-radius: 8px; background: var(--surface); color: var(--text); border: 1px solid var(--border); outline: none;'
    });
    this.yearInput = el('input', {
      type: 'number', class: 'welcome-input', placeholder: 'Year', min: 1900, max: new Date().getFullYear(),
      style: 'width: 90px; padding: 12px; border-radius: 8px; background: var(--surface); color: var(--text); border: 1px solid var(--border); outline: none;'
    });
    
    this.birthdayContainer.append(this.monthSelect, this.dayInput, this.yearInput);


    const footer = el('div', { class: 'tour-footer' },
      this.progress,
      el('div', { class: 'tour-controls' }, this.prevBtn, this.nextBtn, this.skipBtn)
    );
    
    this.card.append(this.title, this.description, this.nameInput, this.birthdayContainer, footer);
    this.root.appendChild(this.card);
  }

  update(stepData, currentStep, totalSteps) {
    this.title.textContent = stepData.title;
    this.description.textContent = stepData.description;
    this.progress.textContent = `${currentStep} / ${totalSteps}`;
    
    if (currentStep === 1) {
      this.prevBtn.style.display = 'none';
    } else {
      this.prevBtn.style.display = 'inline-block';
    }
    
    if (currentStep === totalSteps) {
      this.nextBtn.textContent = 'Finish';
    } else {
      this.nextBtn.textContent = 'Next';
    }

    if (stepData.isWelcome || stepData.isNameInput || stepData.isBirthdayInput) {
      this.card.classList.add('welcome-mode');
      this.nextBtn.textContent = stepData.isWelcome ? 'Start Tour' : 'Next';
    } else {
      this.card.classList.remove('welcome-mode');
    }

    if (stepData.isNameInput) {
      this.nameInput.style.display = 'block';
      setTimeout(() => this.nameInput.focus(), 50);
    } else {
      this.nameInput.style.display = 'none';
    }
    
    if (stepData.isBirthdayInput) {
      this.birthdayContainer.style.display = 'flex';
    } else {
      this.birthdayContainer.style.display = 'none';
    }
    
    this.positionCard(stepData.targetSelector);
  }

  positionCard(selector) {
    if (!selector) {
      // Center for welcome screen
      this.card.style.top = '50%';
      this.card.style.left = '50%';
      this.card.style.transform = 'translate(-50%, -50%)';
      return;
    }
    
    const target = document.querySelector(selector);
    if (!target) return;
    
    const rect = target.getBoundingClientRect();
    const cardRect = this.card.getBoundingClientRect();
    
    // Attempt to place below the target
    let top = rect.bottom + 24;
    let left = rect.left;
    
    // Constrain to viewport
    if (top + cardRect.height > window.innerHeight) {
      top = rect.top - cardRect.height - 24; // place above
    }
    if (left + cardRect.width > window.innerWidth) {
      left = window.innerWidth - cardRect.width - 24; // flush right
    }
    
    this.card.style.top = `${top}px`;
    this.card.style.left = `${Math.max(24, left)}px`;
    this.card.style.transform = 'none';
  }

  destroy() {
    this.card.remove();
  }
}
