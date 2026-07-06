/**
 * BirthdaySounds — all audio synthesized via Web Audio API, no files needed.
 */
class BirthdaySounds {
  constructor() {
    this.ctx = null;
    this._songTimer = null;
    this._songLoop = false;
    this._masterGain = null;
  }

  warmup() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start(0);
    } catch (e) {
      console.warn('AudioContext unavailable', e);
    }
  }

  _ctx() { return this.ctx; }

  playSong() {
    const ctx = this._ctx();
    if (!ctx) return;
    this._songLoop = true;

    const G4 = 392, A4 = 440, B4 = 494, C5 = 523, D5 = 587, E5 = 659, F5 = 698, G5 = 784;
    const melody = [
      [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [C5, 1], [B4, 2],
      [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [D5, 1], [C5, 2],
      [G4, 0.75], [G4, 0.25], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 2],
      [F5, 0.75], [F5, 0.25], [E5, 1], [C5, 1], [D5, 1], [C5, 3],
    ];

    const BPM = 108;
    const beat = 60 / BPM;

    this._masterGain = ctx.createGain();
    this._masterGain.gain.value = 0;
    // Fade in
    this._masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
    this._masterGain.connect(ctx.destination);

    const scheduleMelody = (startAt) => {
      if (!this._songLoop) return;
      let t = startAt;

      melody.forEach(([freq, beats]) => {
        if (!this._songLoop) return;
        const dur = beats * beat;
        if (freq > 0) {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          noteGain.gain.setValueAtTime(0, t);
          noteGain.gain.linearRampToValueAtTime(1, t + 0.02);
          noteGain.gain.setValueAtTime(1, t + dur * 0.75);
          noteGain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
          osc.connect(noteGain);
          noteGain.connect(this._masterGain);
          osc.start(t);
          osc.stop(t + dur);
        }
        t += dur;
      });

      const totalDur = melody.reduce((acc, curr) => acc + curr[1] * beat, 0);
      this._songTimer = setTimeout(() => scheduleMelody(ctx.currentTime + 1), (totalDur + 1) * 1000);
    };

    scheduleMelody(ctx.currentTime + 0.2);
  }

  stopSong() {
    this._songLoop = false;
    clearTimeout(this._songTimer);
    if (this._masterGain && this._ctx()) {
      const t = this._ctx().currentTime;
      this._masterGain.gain.cancelScheduledValues(t);
      this._masterGain.gain.setValueAtTime(this._masterGain.gain.value, t);
      // Fade out smoothly
      this._masterGain.gain.linearRampToValueAtTime(0.001, t + 2);
    }
  }

  popSound() {
    const ctx = this._ctx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  giftDing() {
    const ctx = this._ctx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

export class BirthdayOverlay {
  constructor(store, age, name) {
    this.store = store;
    this.age = age;
    this.name = name;
    this.candleBlown = false;
    this.sounds = new BirthdaySounds();
    
    this.quotes = [
      '"The best investment is the one you make in yourself."',
      '"What we achieve inwardly will change outer reality."',
      '"Your focus determines your reality."',
      '"The secret of getting ahead is getting started."',
      '"Growth and comfort do not coexist."'
    ];
  }

  init() {
    this.sounds.warmup();
    document.getElementById('bdayOverlay')?.remove();

    // Trigger dashboard blur and scale
    document.body.classList.add('bday-active');

    this.overlay = document.createElement('div');
    this.overlay.id = 'bdayOverlay';
    this.overlay.className = 'birthday-overlay';

    this.overlay.innerHTML = `
      <!-- Deep Background Elements -->
      <div class="bday-ambient-glow"></div>
      <div id="bdayParticles"></div>
      
      <div class="bday-ribbon">OpenFocus / Birthday Celebration</div>
      
      <div class="birthday-content">
        <div class="bday-greeting" id="bdayGreeting">
          <span class="greeting-part">Happy Birthday,</span>
          <span class="greeting-part"><strong>${this.name}</strong></span>
        </div>
        <div class="bday-subheading" id="bdaySubheading">
          Today you turn
        </div>
        
        <div class="bday-age-container" id="bdayAgeContainer">
          <div class="bday-odometer" id="bdayOdometer">
            ${[...Array(6)].map((_, i) => `<span>${Math.max(0, this.age - 5 + i)}</span>`).join('')}
          </div>
        </div>
        
        <div class="bday-cake" id="bdayCake" title="Click or press Space to blow the candle">
          <div class="cake-guide bday-guide" id="cakeGuide">Click to blow the candle</div>
          <div class="bday-cake-glow"></div>
          <svg viewBox="0 0 200 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="120" rx="90" ry="15" fill="#151515" stroke="#333" stroke-width="1"/>
            <ellipse cx="100" cy="116" rx="80" ry="12" fill="#222"/>
            <path d="M30 115 C30 130, 170 130, 170 115 L170 65 C170 50, 30 50, 30 65 Z" fill="#2a2a2c"/>
            <path d="M30 65 C30 50, 170 50, 170 65 C170 68, 165 75, 160 75 C155 75, 150 68, 145 68 C140 68, 135 80, 125 80 C115 80, 110 65, 100 65 C90 65, 85 85, 75 85 C65 85, 60 70, 50 70 C40 70, 35 75, 30 65 Z" fill="#ece8e2"/>
            <circle cx="125" cy="83" r="2.5" fill="#E8C36A"/>
            <circle cx="75" cy="88" r="3" fill="#E8C36A"/>
            <circle cx="160" cy="78" r="2" fill="#E8C36A"/>
            <path d="M30 65 C30 50, 170 50, 170 65" stroke="#E8C36A" stroke-width="2" stroke-linecap="round" stroke-dasharray="10 20"/>
            <rect x="96" y="35" width="8" height="28" rx="4" fill="#d0d0d0"/>
            <path d="M96 40 L104 45 M96 48 L104 53 M96 56 L104 61" stroke="#a0a0a0" stroke-width="1.5"/>
            <rect x="99" y="30" width="2" height="5" fill="#333"/>
            <ellipse class="candle-flame" cx="100" cy="22" rx="6" ry="10" fill="#E8C36A"/>
            <ellipse class="candle-flame" cx="100" cy="25" rx="3" ry="6" fill="#fff" opacity="0.8"/>
            <g class="smoke" opacity="0">
              <path d="M100 28 Q90 15 100 5" stroke="#aaa" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M100 28 Q110 15 100 5" stroke="#888" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5"/>
            </g>
          </svg>
        </div>

        <div class="bday-glass-card" id="bdayQuoteCard">
          <div class="bday-quote-text" id="quoteTextContainer"></div>
          <div class="bday-quote-author">OpenFocus</div>
        </div>
      </div>
      
      <!-- Right Gift Only -->
      <div class="bday-gifts-container">
        <div class="bday-gift-box" id="bdayGiftRight">
          <div class="gift-guide bday-guide" id="giftGuide">Click to open</div>
          <div class="bday-gift-glow"></div>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="45" width="60" height="45" rx="2" fill="#1c1c1e"/>
            <rect x="45" y="35" width="10" height="55" fill="#E8C36A"/>
            <g class="bday-gift-lid">
              <rect x="15" y="35" width="70" height="10" rx="2" fill="#2a2a2c"/>
              <g class="bday-gift-ribbon">
                <path d="M50 35 C40 20, 20 20, 40 35 Z" fill="#E8C36A" opacity="0.9"/>
                <path d="M50 35 C60 20, 80 20, 60 35 Z" fill="#E8C36A" opacity="0.9"/>
              </g>
            </g>
          </svg>
        </div>
      </div>

      <div class="bday-actions" id="bdayActions">
        <button class="bday-btn primary" id="bdayContinueBtn">
          Continue &rarr;
        </button>
      </div>

      <div class="bday-farewell" id="bdayFarewell">
        Have an amazing year, ${this.name}.
        <span>Make today count.</span>
      </div>
    `;

    document.body.appendChild(this.overlay);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.overlay.classList.add('active');
        this.sounds.playSong();
      });
    });

    this.bindEvents();
    this.startSequence();
  }

  bindEvents() {
    const blowCandle = () => {
      if (this.candleBlown) return;
      this.candleBlown = true;

      this.sounds.popSound();

      const flames = this.overlay.querySelectorAll('.candle-flame');
      const smoke = this.overlay.querySelector('.smoke');
      flames.forEach(f => { f.style.display = 'none'; });
      if (smoke) { smoke.style.opacity = '1'; smoke.style.transition = 'opacity 1s ease'; }
      
      const cake = document.getElementById('bdayCake');
      cake.classList.add('bounced');
      
      const cakeGuide = document.getElementById('cakeGuide');
      if (cakeGuide) cakeGuide.style.opacity = '0';

      this.sounds.stopSong();
      
      // Reveal the gift
      setTimeout(() => {
        const gift = document.getElementById('bdayGiftRight');
        if (gift) gift.style.opacity = '1';
        gift.style.transform = 'translateY(0)';
      }, 1000);
    };

    document.getElementById('bdayCake').addEventListener('click', blowCandle);

    this.keydownHandler = (e) => {
      if (e.code === 'Space' && this.overlay.classList.contains('active')) {
        e.preventDefault();
        blowCandle();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    // Gift Opening logic
    const openGift = () => {
      const gift = document.getElementById('bdayGiftRight');
      if (gift.classList.contains('opened')) return;

      const giftGuide = document.getElementById('giftGuide');
      if (giftGuide) giftGuide.style.opacity = '0';

      this.sounds.giftDing();
      gift.classList.add('opened');
      
      setTimeout(() => {
        const card = document.getElementById('bdayQuoteCard');
        card.classList.add('visible');
        this._typeQuote();
      }, 600);
      
      setTimeout(() => {
        const actions = document.getElementById('bdayActions');
        actions.style.opacity = '1';
        actions.style.transform = 'translateY(0)';
      }, 1500);
    };

    document.getElementById('bdayGiftRight').addEventListener('click', openGift);
    document.getElementById('bdayContinueBtn').addEventListener('click', () => this.close());
  }

  _typeQuote() {
    const quote = this.quotes[Math.floor(Math.random() * this.quotes.length)];
    const container = document.getElementById('quoteTextContainer');
    container.innerHTML = '';
    
    let i = 0;
    const typeWriter = setInterval(() => {
      if (i < quote.length) {
        container.innerHTML += quote.charAt(i);
        i++;
      } else {
        clearInterval(typeWriter);
      }
    }, 40);
  }

  startSequence() {
    setTimeout(() => this._startPremiumParticles(), 500);

    const greetingParts = document.querySelectorAll('.greeting-part');
    greetingParts.forEach((part, index) => {
      setTimeout(() => {
        part.style.opacity = '1';
        part.style.transform = 'translateY(0)';
      }, 1500 + (index * 600));
    });

    setTimeout(() => {
      const sub = document.getElementById('bdaySubheading');
      sub.style.opacity = '1';
      sub.style.transform = 'translateY(0)';
    }, 1500 + (greetingParts.length * 600));

    // Age counter
    setTimeout(() => {
      const container = document.getElementById('bdayAgeContainer');
      container.style.opacity = '1';
      const odometer = document.getElementById('bdayOdometer');
      const items = odometer.querySelectorAll('span').length;
      const offset = -(items - 1) * 140; // 140px matches the font height
      setTimeout(() => {
        odometer.style.transform = `translateY(${offset}px)`;
      }, 200);
    }, 3200);

    // Cake rises
    setTimeout(() => {
      const cake = document.getElementById('bdayCake');
      cake.style.opacity = '1';
      cake.style.transform = 'translateY(0) scale(1)';
      setTimeout(() => cake.classList.add('floating'), 2000);
    }, 4500);
  }

  _startPremiumParticles() {
    const container = document.getElementById('bdayParticles');
    if (!container) return;
    
    const colors = ['#E8C36A', '#ffffff', '#c0c0c0'];
    
    // Create 80 advanced particles (dust, shapes, stars)
    for (let i = 0; i < 80; i++) {
      const p = document.createElement('div');
      p.style.position = 'absolute';
      
      const type = Math.random();
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      if (type > 0.7) {
        // Star or ribbon shape
        p.style.width = '10px';
        p.style.height = '10px';
        p.style.background = color;
        p.style.clipPath = type > 0.85 
          ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' // star
          : 'polygon(0% 0%, 100% 20%, 80% 100%, 20% 80%)'; // ribbon
      } else {
        // Dust
        const size = Math.random() * 4 + 1;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.background = color;
        p.style.borderRadius = '50%';
        p.style.boxShadow = `0 0 ${size * 3}px ${color}`;
      }

      p.style.left = `${Math.random() * 100}vw`;
      p.style.top = `-5vh`;
      p.style.opacity = '0';
      container.appendChild(p);

      const duration = 12000 + Math.random() * 10000;
      const delay = Math.random() * 5000;
      const xDrift = (Math.random() * 20 - 10);
      const rotations = Math.random() * 720 - 360;
      
      p.animate([
        { transform: `translate3d(0vw, 0vh, 0) rotate3d(1, 1, 1, 0deg)`, opacity: 0 },
        { transform: `translate3d(${xDrift / 3}vw, 30vh, 0) rotate3d(1, 1, 1, ${rotations / 3}deg)`, opacity: Math.random() * 0.8 + 0.2, offset: 0.3 },
        { transform: `translate3d(${xDrift * 0.8}vw, 80vh, 0) rotate3d(1, 1, 1, ${rotations * 0.8}deg)`, opacity: Math.random() * 0.8 + 0.2, offset: 0.8 },
        { transform: `translate3d(${xDrift}vw, 110vh, 0) rotate3d(1, 1, 1, ${rotations}deg)`, opacity: 0 }
      ], {
        duration,
        delay,
        iterations: Infinity,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
    }
  }

  close() {
    document.removeEventListener('keydown', this.keydownHandler);
    this.sounds.stopSong();
    
    // Hide UI elements
    const cake = document.getElementById('bdayCake');
    const actions = document.getElementById('bdayActions');
    const quote = document.getElementById('bdayQuoteCard');
    const gifts = document.querySelector('.bday-gifts-container');
    
    if (cake) cake.style.opacity = '0';
    if (actions) actions.style.opacity = '0';
    if (quote) quote.style.opacity = '0';
    if (gifts) gifts.style.opacity = '0';

    // Show farewell message
    const farewell = document.getElementById('bdayFarewell');
    setTimeout(() => {
      if (farewell) farewell.style.opacity = '1';
    }, 500);

    // Fade everything out and restore dashboard
    setTimeout(() => {
      document.body.classList.remove('bday-active');
      this.overlay.style.opacity = '0';
      
      // Save state
      const s = this.store.get('settings');
      this.store.set('settings', {
        ...s,
        birthday: { ...(s.birthday || {}), lastShownYear: new Date().getFullYear() }
      });

      // Remove DOM
      setTimeout(() => this.overlay?.remove(), 1200);
    }, 2500);
  }
}
