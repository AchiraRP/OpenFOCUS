import { el, iconBtn } from '../utils/dom.js';

export function mount(body, { store }) {
  const root = el('div', { class: 'brightness-widget' });

  function save() {
    store.touch('brightness');
    render();
  }

  function handleSlider(e, key) {
    let config = store.get('brightness');
    let val = parseInt(e.target.value, 10);
    
    if (config.locked && (key === 'dayLevel' || key === 'nightLevel')) {
      let diff = val - config[key];
      config[key] = val;
      
      let otherKey = key === 'dayLevel' ? 'nightLevel' : 'dayLevel';
      let otherVal = config[otherKey] + diff;
      config[otherKey] = Math.max(0, Math.min(100, otherVal));
    } else {
      config[key] = val;
    }
    
    // Update DOM directly for smooth sliding without full re-render
    if (key === 'simpleLevel') {
      root.querySelector('.bw-simple-val').textContent = val + '%';
    } else if (key === 'dayLevel') {
      root.querySelector('.bw-day-val').textContent = val + '%';
      if (config.locked) {
        let otherInput = root.querySelector('.bw-night-range');
        if (otherInput) {
          otherInput.value = config.nightLevel;
          otherInput.style.setProperty('--val', config.nightLevel + '%');
        }
        let otherValNode = root.querySelector('.bw-night-val');
        if (otherValNode) otherValNode.textContent = config.nightLevel + '%';
      }
    } else if (key === 'nightLevel') {
      root.querySelector('.bw-night-val').textContent = val + '%';
      if (config.locked) {
        let otherInput = root.querySelector('.bw-day-range');
        if (otherInput) {
          otherInput.value = config.dayLevel;
          otherInput.style.setProperty('--val', config.dayLevel + '%');
        }
        let otherValNode = root.querySelector('.bw-day-val');
        if (otherValNode) otherValNode.textContent = config.dayLevel + '%';
      }
    }
    
    // Update CSS variables for progress fill
    e.target.style.setProperty('--val', val + '%');
    
    store.touch('brightness');
  }

  function render() {
    const config = store.get('brightness');
    
    // Header
    const toggleInput = el('input', { type: 'checkbox', checked: config.enabled });
    toggleInput.onchange = (e) => {
      config.enabled = e.target.checked;
      save();
    };
    
    const header = el('div', { class: 'bw-header' },
      el('div', { class: 'bw-header-text' },
        el('div', { class: 'bw-title' }, '🌞 Brightness Control'),
        el('div', { class: 'bw-subtitle' }, 'Control screen brightness for websites to reduce eye strain.')
      ),
      el('div', { class: 'bw-header-actions' },
        iconBtn('⚙', 'Settings', () => {}),
        iconBtn('?', 'Help', () => {}),
        el('label', { class: 'bw-toggle' },
          toggleInput,
          el('span', { class: 'bw-toggle-slider' })
        )
      )
    );

    // Mode Switcher
    const modeSwitcher = el('div', { class: 'bw-mode-switcher' },
      el('button', {
        class: `bw-mode-btn ${config.mode === 'simple' ? 'active' : ''}`,
        onclick: () => { config.mode = 'simple'; save(); }
      }, 'Simple'),
      el('button', {
        class: `bw-mode-btn ${config.mode === 'schedule' ? 'active' : ''}`,
        onclick: () => { config.mode = 'schedule'; save(); }
      }, 'Schedule')
    );

    let modeContent;
    if (config.mode === 'simple') {
      const slider = el('input', {
        type: 'range', class: 'bw-range bw-simple-range',
        min: '0', max: '100', value: config.simpleLevel
      });
      slider.style.setProperty('--val', config.simpleLevel + '%');
      slider.oninput = (e) => handleSlider(e, 'simpleLevel');

      modeContent = el('div', { class: 'bw-card bw-simple' },
        el('div', { class: 'bw-card-top' },
          el('span', {}, '☀ Day Brightness'),
          el('span', { class: 'bw-val bw-simple-val' }, `${config.simpleLevel}%`)
        ),
        slider,
        el('div', { class: 'bw-desc' }, 'Recommended for daytime usage.')
      );
    } else {
      // Day Card
      const daySlider = el('input', {
        type: 'range', class: 'bw-range bw-day-range',
        min: '0', max: '100', value: config.dayLevel
      });
      daySlider.style.setProperty('--val', config.dayLevel + '%');
      daySlider.oninput = (e) => handleSlider(e, 'dayLevel');
      
      const dayTime = el('input', { type: 'time', class: 'bw-time', value: config.dayStart });
      dayTime.onchange = (e) => { config.dayStart = e.target.value; save(); };

      const dayCard = el('div', { class: 'bw-card bw-day-card' },
        el('div', { class: 'bw-card-top' },
          el('span', {}, '☀ Day'),
          dayTime
        ),
        daySlider,
        el('div', { class: 'bw-card-bottom' },
          el('div', { class: 'bw-desc' }, 'Recommended label'),
          el('div', { class: 'bw-val bw-day-val' }, `${config.dayLevel}%`)
        )
      );

      // Night Card
      const nightSlider = el('input', {
        type: 'range', class: 'bw-range bw-night-range',
        min: '0', max: '100', value: config.nightLevel
      });
      nightSlider.style.setProperty('--val', config.nightLevel + '%');
      nightSlider.oninput = (e) => handleSlider(e, 'nightLevel');

      const nightTime = el('input', { type: 'time', class: 'bw-time', value: config.nightStart });
      nightTime.onchange = (e) => { config.nightStart = e.target.value; save(); };

      const nightCard = el('div', { class: 'bw-card bw-night-card' },
        el('div', { class: 'bw-card-top' },
          el('span', {}, '🌙 Night'),
          nightTime
        ),
        nightSlider,
        el('div', { class: 'bw-card-bottom' },
          el('div', { class: 'bw-desc' }, 'Recommended label'),
          el('div', { class: 'bw-val bw-night-val' }, `${config.nightLevel}%`)
        )
      );

      // Lock Button
      const lockBtn = el('button', {
        class: `bw-lock-btn ${config.locked ? 'locked' : ''}`,
        onclick: () => { config.locked = !config.locked; save(); },
        title: config.locked ? 'Unlock sliders' : 'Lock sliders together'
      }, config.locked ? '🔒' : '🔓');

      modeContent = el('div', { class: 'bw-schedule-container' }, dayCard, lockBtn, nightCard);
    }

    // Apply To Section
    const applyToRadios = ['all', 'current', 'custom'].map(val => {
      const radio = el('input', { type: 'radio', name: 'bw-apply', value: val, checked: config.applyTo === val });
      radio.onchange = () => { config.applyTo = val; save(); };
      const labelText = val === 'all' ? 'All Websites' : val === 'current' ? 'Current Website' : 'Custom Rule';
      return el('label', { class: 'bw-radio-label' }, radio, el('span', {}, labelText));
    });

    const applyToSection = el('div', { class: 'bw-section' },
      el('div', { class: 'bw-section-title' }, 'Apply Brightness To'),
      el('div', { class: 'bw-radio-group' }, ...applyToRadios)
    );

    if (config.applyTo === 'current') {
      applyToSection.append(el('div', { class: 'bw-current-site' },
        el('span', { class: 'bw-hostname' }, 'example.com'),
        el('button', { class: 'bw-pill' }, 'Save For This Site')
      ));
    }

    // Quick Actions
    const quickActions = el('div', { class: 'bw-quick-actions' },
      el('button', { class: 'bw-pill', onclick: () => { config.enabled = true; config.applyTo = 'all'; save(); } }, 'Enable Everywhere'),
      el('button', { class: 'bw-pill', onclick: () => { config.enabled = false; config.applyTo = 'all'; save(); } }, 'Disable Everywhere'),
      el('button', { class: 'bw-pill' }, 'Disable This Website'),
      el('button', { class: 'bw-pill', onclick: () => { config.simpleLevel = 85; config.dayLevel = 100; config.nightLevel = 70; save(); } }, 'Reset Brightness')
    );

    // Advanced Section
    const methodSelect = el('select', { class: 'bw-select' },
      el('option', { value: 'adaptive', selected: config.method === 'adaptive' }, 'Adaptive'),
      el('option', { value: 'css', selected: config.method === 'css' }, 'CSS Filter'),
      el('option', { value: 'overlay', selected: config.method === 'overlay' }, 'Overlay Layer'),
      el('option', { value: 'svg', selected: config.method === 'svg' }, 'SVG Filter')
    );
    methodSelect.onchange = (e) => { config.method = e.target.value; save(); };

    const advancedContent = el('div', { class: 'bw-advanced-content' },
      el('div', { class: 'bw-setting-row' }, el('span', {}, 'Brightness Method'), methodSelect),
      ...Object.entries(config.advanced).map(([key, value]) => {
        const checkbox = el('input', { type: 'checkbox', checked: value });
        checkbox.onchange = (e) => { config.advanced[key] = e.target.checked; save(); };
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return el('label', { class: 'bw-checkbox-label' }, checkbox, el('span', {}, label));
      })
    );
    
    const advancedDetails = el('details', { class: 'bw-details' },
      el('summary', {}, 'Advanced Settings'),
      advancedContent
    );

    // Shortcuts Section
    const shortcutsDetails = el('details', { class: 'bw-details' },
      el('summary', {}, 'Keyboard Shortcuts'),
      el('div', { class: 'bw-shortcuts-content' },
        el('div', { class: 'bw-shortcut-row' }, el('span', {}, 'Increase Brightness'), el('kbd', {}, 'Ctrl + Shift + ↑')),
        el('div', { class: 'bw-shortcut-row' }, el('span', {}, 'Decrease Brightness'), el('kbd', {}, 'Ctrl + Shift + ↓')),
        el('div', { class: 'bw-shortcut-row' }, el('span', {}, 'Toggle Brightness'), el('kbd', {}, 'Ctrl + Shift + B')),
        el('button', { class: 'bw-pill bw-customize-btn' }, 'Customize')
      )
    );

    // Status Bar
    const statusVal = config.mode === 'simple' ? config.simpleLevel : config.dayLevel; // Simplified status
    const applyToText = config.applyTo === 'all' ? 'All Websites' : config.applyTo === 'current' ? 'example.com' : 'Custom';
    const statusStr = `${config.enabled ? 'Enabled' : 'Disabled'} • ${statusVal}% • ${applyToText}`;
    const statusBar = el('div', { class: 'bw-status' },
      el('div', { class: 'bw-status-left' }, statusStr),
      el('div', { class: 'bw-status-right' }, 'Just now')
    );

    root.replaceChildren(header, modeSwitcher, modeContent, applyToSection, quickActions, advancedDetails, shortcutsDetails, statusBar);
  }

  render();
  body.append(root);

  return () => root.remove();
}
