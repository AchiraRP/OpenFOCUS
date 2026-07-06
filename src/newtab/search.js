import { AI_PROVIDERS, getProvider } from './providers.js';

const PROTOCOL_PATTERN = /^https?:\/\//i;
const DOMAIN_PATTERN = /^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i;
const PRIVATE_SEARCH_URL = 'https://www.google.com/search?q=';

export function initSearch(store) {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  
  const modeSwitcher = document.getElementById('searchModeSwitcher');
  const modeBtns = form.querySelectorAll('.mode-btn');
  
  const pickerContainer = document.getElementById('modelPickerContainer');
  const selectBtn = document.getElementById('modelSelectBtn');
  const selectIcon = document.getElementById('modelSelectIcon');
  const selectName = document.getElementById('modelSelectName');
  const dropdown = document.getElementById('modelDropdown');

  let settings = store.get('settings');
  let currentMode = settings.searchMode || 'private';
  let currentModel = settings.searchModel || 'chatgpt';
  let dropdownOpen = false;
  let highlightedIndex = AI_PROVIDERS.findIndex(p => p.id === currentModel);
  if (highlightedIndex === -1) highlightedIndex = 0;

  function saveSettings() {
    settings.searchMode = currentMode;
    settings.searchModel = currentModel;
    store.touch('settings');
  }

  function updateUI() {
    // Update Mode Buttons
    modeBtns.forEach(btn => {
      if (btn.dataset.mode === currentMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Placeholder & Picker Visibility
    if (currentMode === 'private') {
      input.placeholder = 'Search privately...';
      pickerContainer.style.display = 'none';
    } else if (currentMode === 'ai') {
      const provider = getProvider(currentModel);
      input.placeholder = `Ask ${provider.name}...`;
      pickerContainer.style.display = 'flex';
      selectIcon.innerHTML = provider.icon;
      selectName.textContent = provider.name;
    } else {
      input.placeholder = 'Search Google or type a URL';
      pickerContainer.style.display = 'none';
    }
  }

  function renderDropdown() {
    dropdown.innerHTML = '';
    
    const header = document.createElement('div');
    header.className = 'model-dropdown-header';
    header.innerHTML = `<span>Select your AI</span><span>→</span>`;
    dropdown.appendChild(header);

    AI_PROVIDERS.forEach((provider, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'model-option';
      if (provider.id === currentModel) btn.classList.add('selected');
      if (index === highlightedIndex) btn.style.background = 'var(--surface-raised)';
      
      btn.innerHTML = `
        <span class="model-option-icon">${provider.icon}</span>
        <span class="model-option-name">${provider.name}</span>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentModel = provider.id;
        highlightedIndex = index;
        saveSettings();
        closeDropdown();
        updateUI();
        input.focus();
      });
      dropdown.appendChild(btn);
    });
  }

  function toggleDropdown() {
    dropdownOpen = !dropdownOpen;
    dropdown.style.display = dropdownOpen ? 'flex' : 'none';
    if (dropdownOpen) {
      highlightedIndex = AI_PROVIDERS.findIndex(p => p.id === currentModel);
      if (highlightedIndex === -1) highlightedIndex = 0;
      renderDropdown();
    }
  }

  function closeDropdown() {
    dropdownOpen = false;
    dropdown.style.display = 'none';
  }

  // Click Events
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      currentMode = (currentMode === mode) ? 'standard' : mode;
      saveSettings();
      updateUI();
      input.focus();
    });
  });

  selectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener('click', (e) => {
    if (dropdownOpen && !pickerContainer.contains(e.target)) {
      closeDropdown();
    }
  });

  // Submit Handler
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    const isUrl = PROTOCOL_PATTERN.test(query) || (DOMAIN_PATTERN.test(query) && !query.includes(' '));
    if (isUrl) {
      window.location.href = query.startsWith('http') ? query : `https://${query}`;
      return;
    }

    if (currentMode === 'private') {
      const url = PRIVATE_SEARCH_URL + encodeURIComponent(query);
      if (globalThis.browser && globalThis.browser.windows) {
        try {
          await globalThis.browser.windows.create({ url, incognito: true });
          input.value = ''; // clear after open
          return;
        } catch (e) {
          console.warn('Could not open incognito window, falling back', e);
        }
      }
      window.location.href = url;
    } else if (currentMode === 'ai') {
      const provider = getProvider(currentModel);
      const url = provider.searchUrl + encodeURIComponent(query);
      window.location.href = url;
    } else {
      // standard mode
      const url = PRIVATE_SEARCH_URL + encodeURIComponent(query);
      window.location.href = url;
    }
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ctrl+K to focus
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      return;
    }
    // Ctrl+1 for Private
    if (e.ctrlKey && e.key === '1') {
      e.preventDefault();
      currentMode = 'private';
      saveSettings();
      updateUI();
      return;
    }
    // Ctrl+2 for AI
    if (e.ctrlKey && e.key === '2') {
      e.preventDefault();
      currentMode = 'ai';
      saveSettings();
      updateUI();
      return;
    }
    // Ctrl+Shift+M for Model Picker
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      if (currentMode !== 'ai') {
        currentMode = 'ai';
        saveSettings();
        updateUI();
      }
      toggleDropdown();
      return;
    }

    // Dropdown Navigation
    if (dropdownOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        highlightedIndex = (highlightedIndex + 1) % AI_PROVIDERS.length;
        renderDropdown();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        highlightedIndex = (highlightedIndex - 1 + AI_PROVIDERS.length) % AI_PROVIDERS.length;
        renderDropdown();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        currentModel = AI_PROVIDERS[highlightedIndex].id;
        saveSettings();
        closeDropdown();
        updateUI();
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    }
  });

  updateUI();
}
