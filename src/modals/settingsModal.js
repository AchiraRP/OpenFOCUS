/**
 * settingsModal.js — OpenFocus Settings Panel
 *
 * Opens a sidebar-nav modal with the following sections:
 *   General | Appearance | Notifications | Data Management | About
 *
 * Only Data Management is fully implemented; the other tabs display
 * placeholder content ready for future features.
 */

import { el } from '../../utils/dom.js';
import {
  exportBackup,
  importBackup,
  restoreBackup,
  resetWorkspace,
  buildSummary,
} from '../../storage/backup.js';
import { openWidgetLibrary } from './widgetLibrary.js';
import { openThemeSelector } from './themeModal.js';
import { openGameSelector } from './gameModal.js';

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function openSettingsModal(modalRoot, store, themeManager, widgetManager, onSettingsChange) {
  let activeTab = 'data';

  const close = () => {
    modalRoot.replaceChildren();
    document.removeEventListener('keydown', onKey);
  };

  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);

  // ---- Sidebar nav -------------------------------------------------------
  const navItems = [
    { id: 'general',       label: 'General' },
    { id: 'appearance',    label: 'Appearance' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'data',          label: 'Data Management' },
    { id: 'feedback',      label: 'Feedback & Ideas' },
    { id: 'developer',     label: 'Developer' },
    { id: 'about',         label: 'About' },
  ];

  const contentArea = el('div', { class: 'stg-content' });

  const navEl = el('nav', { class: 'stg-nav', 'aria-label': 'Settings sections' },
    ...navItems.map(item => {
      const btn = el('button', {
        class: 'stg-nav-item' + (item.id === activeTab ? ' stg-nav-item--active' : ''),
        type: 'button',
        text: item.label,
        'aria-selected': item.id === activeTab ? 'true' : 'false',
        onclick: () => {
          activeTab = item.id;
          navEl.querySelectorAll('.stg-nav-item').forEach(b => {
            b.classList.remove('stg-nav-item--active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('stg-nav-item--active');
          btn.setAttribute('aria-selected', 'true');
          renderTab(activeTab);
        },
      });
      return btn;
    })
  );

  // ---- Modal shell -------------------------------------------------------
  const dialog = el('div', {
    class: 'stg-modal',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Settings',
  },
    el('div', { class: 'stg-sidebar' },
      el('h2', { class: 'stg-sidebar-title', text: 'Settings' }),
      navEl
    ),
    contentArea
  );

  const overlay = el('div', {
    class: 'modal-overlay',
    onclick: (e) => { if (e.target === overlay) close(); },
  }, dialog);

  modalRoot.replaceChildren(overlay);

  // ---- Tab renderer ------------------------------------------------------
  function renderTab(tab) {
    contentArea.replaceChildren();
    switch (tab) {
      case 'general':       contentArea.append(renderGeneral());       break;
      case 'appearance':    contentArea.append(renderAppearance());    break;
      case 'notifications': contentArea.append(renderNotifications()); break;
      case 'data':          contentArea.append(renderDataManagement()); break;
      case 'feedback':      contentArea.append(renderFeedback());      break;
      case 'developer':     contentArea.append(renderDeveloper());     break;
      case 'about':         contentArea.append(renderAbout());         break;
    }
  }

  renderTab(activeTab);
  navEl.querySelector('.stg-nav-item--active')?.focus();

  // ---------------------------------------------------------------------------
  // Tab: General
  // ---------------------------------------------------------------------------
  function renderGeneral() {
    const tab = el('div', { class: 'stg-tab' });
    tab.append(
      el('div', { class: 'stg-tab-header' },
        el('h3', { class: 'stg-tab-title', text: 'General' }),
        el('p', { class: 'stg-tab-desc', text: 'General workspace settings.' })
      )
    );

    const s = store.get('settings');

    function createSettingRow(title, desc, buttonLabel, isChecked, toggleCallback, buttonCallback) {
      const btn = el('button', {
        class: 'stg-action-btn',
        type: 'button',
        text: buttonLabel,
        onclick: buttonCallback
      });

      const checkbox = el('input', {
        type: 'checkbox',
        checked: isChecked,
        onchange: (e) => toggleCallback(e.target.checked)
      });
      const toggleLabel = el('label', { style: 'display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-dim); cursor: pointer;' },
        checkbox,
        'Show on Homescreen'
      );

      const rightCol = el('div', { style: 'display: flex; flex-direction: column; align-items: flex-end; gap: 8px;' },
        btn,
        toggleLabel
      );

      return el('div', { class: 'stg-card' },
        el('div', { class: 'stg-card-body' },
          el('div', { class: 'stg-card-left' },
            el('div', { class: 'stg-card-text' },
              el('div', { class: 'stg-card-title', text: title }),
              el('div', { class: 'stg-card-desc', text: desc })
            )
          ),
          rightCol
        )
      );
    }

    tab.append(createSettingRow(
      'Widget Library',
      'Manage which widgets are visible on your dashboard.',
      'Add Widget',
      s.showAddWidget,
      (val) => {
        const current = store.get('settings');
        store.set('settings', { ...current, showAddWidget: val });
        if (onSettingsChange) onSettingsChange();
      },
      () => {
        close();
        openWidgetLibrary(modalRoot, widgetManager);
      }
    ));

    tab.append(createSettingRow(
      'Themes',
      'Select a background theme for your workspace.',
      'Change Theme',
      s.showThemeBtn,
      (val) => {
        const current = store.get('settings');
        store.set('settings', { ...current, showThemeBtn: val });
        if (onSettingsChange) onSettingsChange();
      },
      () => {
        close();
        openThemeSelector(modalRoot, store, themeManager);
      }
    ));

    tab.append(createSettingRow(
      'Games',
      'Select an interactive game background.',
      'Play Games',
      s.showGameBtn,
      (val) => {
        const current = store.get('settings');
        store.set('settings', { ...current, showGameBtn: val });
        if (onSettingsChange) onSettingsChange();
      },
      () => {
        close();
        openGameSelector(modalRoot, store, themeManager);
      }
    ));

    return tab;
  }

  // ---------------------------------------------------------------------------
  // Tab: Developer
  // ---------------------------------------------------------------------------
  function renderDeveloper() {
    const tab = el('div', { class: 'stg-tab' });
    tab.append(
      el('div', { class: 'stg-tab-header' },
        el('h3', { class: 'stg-tab-title', text: 'Developer Options' }),
        el('p', { class: 'stg-tab-desc', text: 'Experimental features and testing.' })
      )
    );

    const s = store.get('settings');
    const isChecked = s.birthday?.demoMode || false;

    const checkbox = el('input', {
      type: 'checkbox',
      checked: isChecked,
      onchange: (e) => {
        const current = store.get('settings');
        store.set('settings', { 
          ...current, 
          birthday: { ...(current.birthday || {}), demoMode: e.target.checked }
        });
        if (onSettingsChange) onSettingsChange();
      }
    });

    const toggleLabel = el('label', { style: 'display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-dim); cursor: pointer;' },
      checkbox,
      'Enabled'
    );

    const row = el('div', { class: 'stg-card' },
      el('div', { class: 'stg-card-body' },
        el('div', { class: 'stg-card-left' },
          el('div', { class: 'stg-card-text' },
            el('div', { class: 'stg-card-title', text: 'Birthday Demo Mode' }),
            el('div', { class: 'stg-card-desc', text: 'When enabled, simulate the birthday experience regardless of today\'s date.' })
          )
        ),
        el('div', { style: 'display: flex; flex-direction: column; align-items: flex-end; gap: 8px;' },
          toggleLabel
        )
      )
    );

    tab.append(row);
    return tab;
  }

  // ---------------------------------------------------------------------------
  // Tab: Appearance (placeholder)
  // ---------------------------------------------------------------------------
  function renderAppearance() {
    const tab = el('div', { class: 'stg-tab' });
    tab.append(
      el('div', { class: 'stg-tab-header' },
        el('h3', { class: 'stg-tab-title', text: 'Appearance' }),
        el('p', { class: 'stg-tab-desc', text: 'Customize your global workspace background.' })
      )
    );

    const s = store.get('settings');

    const fileInput = el('input', { type: 'file', accept: 'image/*', style: 'display: none;' });
    
    const applyBg = (imgData, opacity) => {
      const overlay = document.getElementById('customBgOverlay');
      if (overlay) {
        if (imgData) {
          overlay.style.backgroundImage = `url("${imgData}")`;
          overlay.style.opacity = opacity;
        } else {
          overlay.style.backgroundImage = 'none';
          overlay.style.opacity = '0';
        }
      }
    };

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          const current = store.get('settings');
          const opacity = current.customBgOpacity !== undefined ? current.customBgOpacity : 0.5;
          store.set('settings', { ...current, customBgImage: dataUrl });
          applyBg(dataUrl, opacity);
          if (onSettingsChange) onSettingsChange();
        };
        reader.readAsDataURL(file);
      }
    });

    const uploadBtn = el('button', {
      class: 'stg-action-btn',
      type: 'button',
      text: 'Upload Image',
      onclick: () => fileInput.click()
    });

    const clearBtn = el('button', {
      class: 'stg-action-btn',
      type: 'button',
      text: 'Clear',
      style: 'margin-left: 8px;',
      onclick: () => {
        const current = store.get('settings');
        store.set('settings', { ...current, customBgImage: null });
        applyBg(null, 0);
        fileInput.value = '';
        if (onSettingsChange) onSettingsChange();
      }
    });

    const currentOpacity = s.customBgOpacity !== undefined ? s.customBgOpacity : 0.5;
    const opacitySlider = el('input', {
      type: 'range',
      min: '0',
      max: '1',
      step: '0.05',
      value: currentOpacity,
      oninput: (e) => {
        const val = parseFloat(e.target.value);
        const current = store.get('settings');
        store.set('settings', { ...current, customBgOpacity: val });
        if (current.customBgImage) {
          applyBg(current.customBgImage, val);
        }
        if (onSettingsChange) onSettingsChange();
      }
    });

    const opacityContainer = el('div', { style: 'display: flex; align-items: center; gap: 12px; margin-top: 12px;' },
      el('span', { text: 'Opacity', style: 'font-size: 13px; color: var(--text-dim);' }),
      opacitySlider
    );

    const row = el('div', { class: 'stg-card' },
      el('div', { class: 'stg-card-body' },
        el('div', { class: 'stg-card-left' },
          el('div', { class: 'stg-card-text' },
            el('div', { class: 'stg-card-title', text: 'Custom Background' }),
            el('div', { class: 'stg-card-desc', text: 'Upload an image to sit behind your dashboard widgets.' })
          )
        ),
        el('div', { style: 'display: flex; flex-direction: column; align-items: flex-end;' },
          el('div', { style: 'display: flex;' }, fileInput, uploadBtn, clearBtn),
          opacityContainer
        )
      )
    );

    tab.append(row);
    return tab;
  }

  // ---------------------------------------------------------------------------
  // Tab: Notifications (placeholder)
  // ---------------------------------------------------------------------------
  function renderNotifications() {
    return el('div', { class: 'stg-tab' },
      el('div', { class: 'stg-tab-header' },
        el('h3', { class: 'stg-tab-title', text: 'Notifications' }),
        el('p', { class: 'stg-tab-desc', text: 'Notification preferences will appear here in a future update.' })
      )
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: Data Management
  // ---------------------------------------------------------------------------
  function renderDataManagement() {
    const tab = el('div', { class: 'stg-tab' });

    tab.append(
      el('div', { class: 'stg-tab-header' },
        el('h3', { class: 'stg-tab-title', text: 'Data Management' }),
        el('p', {
          class: 'stg-tab-desc',
          text: 'Your OpenFocus workspace is stored locally in your browser. Create a backup to transfer it to another device or restore it later.',
        })
      )
    );

    // ---- Export card -------------------------------------------------------
    const exportBtn = el('button', {
      class: 'stg-action-btn',
      type: 'button',
      text: 'Export',
      'aria-label': 'Export backup',
      onclick: () => handleExport(exportBtn),
    });

    tab.append(stgCard(
      '↓', 'Export Backup',
      'Download your complete workspace as a JSON file.',
      exportBtn
    ));

    // ---- Import card -------------------------------------------------------
    const importBtn = el('button', {
      class: 'stg-action-btn',
      type: 'button',
      text: 'Import',
      'aria-label': 'Import backup',
      onclick: () => handleImport(tab, importBtn),
    });

    tab.append(stgCard(
      '↑', 'Import Backup',
      'Restore your workspace from a previously exported backup.',
      importBtn
    ));

    // ---- Reset card --------------------------------------------------------
    const resetBtn = el('button', {
      class: 'stg-action-btn stg-action-btn--danger',
      type: 'button',
      text: 'Reset Workspace',
      'aria-label': 'Reset workspace',
      onclick: () => handleReset(tab, resetBtn),
    });

    tab.append(stgCard(
      '⚠', 'Reset OpenFocus',
      'Erase all local data and restore OpenFocus to its default state.',
      resetBtn
    ));

    return tab;
  }

  // ---------------------------------------------------------------------------
  // Tab: About
  // ---------------------------------------------------------------------------
  function renderAbout() {
    const manifest = chrome?.runtime?.getManifest?.() ?? {};
    const version  = manifest.version ?? '—';

    return el('div', { class: 'stg-tab' },
      el('div', { class: 'stg-tab-header' },
        el('h3', { class: 'stg-tab-title', text: 'About' }),
        el('p', { class: 'stg-tab-desc', text: 'OpenFocus — A minimal productivity workspace for your browser.' })
      ),
      el('div', { class: 'stg-about-row' },
        el('span', { class: 'stg-about-label', text: 'Version' }),
        el('span', { class: 'stg-about-value', text: version })
      ),
      el('div', { class: 'stg-about-row' },
        el('span', { class: 'stg-about-label', text: 'Storage' }),
        el('span', { class: 'stg-about-value', text: 'browser.storage.local (local only)' })
      ),
      el('div', { class: 'stg-about-row' },
        el('span', { class: 'stg-about-label', text: 'Backup Format' }),
        el('span', { class: 'stg-about-value', text: 'JSON v1 (UTF-8, 2-space indentation)' })
      )
    );
  }

  // ---------------------------------------------------------------------------
  // Tab: Feedback & Ideas
  // ---------------------------------------------------------------------------
  function renderFeedback() {
    const tab = el('div', { class: 'stg-tab' },
      el('div', { class: 'stg-tab-header' },
        el('h3', { class: 'stg-tab-title', text: 'Feedback & Ideas' }),
        el('p', { class: 'stg-tab-desc', text: 'Help us improve OpenFocus by reporting issues or suggesting new features.' })
      )
    );

    const typeSelect = el('select', { class: 'stg-input', style: 'width: 100%; margin-bottom: 16px; padding: 8px;' },
      el('option', { value: 'bug', text: 'Report an Issue (Bug)' }),
      el('option', { value: 'feature', text: 'Suggest a Feature' }),
      el('option', { value: 'other', text: 'Other' })
    );

    const subjectInput = el('input', {
      type: 'text',
      class: 'stg-input',
      placeholder: 'Subject...',
      style: 'width: 100%; margin-bottom: 16px; padding: 8px;'
    });

    const bodyInput = el('textarea', {
      class: 'stg-input',
      placeholder: 'Describe your issue or feature idea in detail...',
      style: 'width: 100%; height: 120px; resize: vertical; margin-bottom: 16px; padding: 8px; font-family: inherit;'
    });

    const submitBtn = el('button', {
      class: 'stg-action-btn stg-action-btn--primary',
      text: 'Submit',
      onclick: () => {
        if (!subjectInput.value.trim() || !bodyInput.value.trim()) {
          const warn = el('div', { class: 'stg-error', text: 'Please fill in both subject and description.' });
          tab.insertBefore(warn, formContainer.nextSibling);
          setTimeout(() => warn.remove(), 3000);
          return;
        }

        // Generate a mailto link
        const subject = encodeURIComponent(`[OpenFocus ${typeSelect.value.toUpperCase()}] ${subjectInput.value}`);
        const body = encodeURIComponent(bodyInput.value);
        // Using a placeholder email address as there's no backend specified
        window.open(`mailto:feedback@openfocus.app?subject=${subject}&body=${body}`);

        subjectInput.value = '';
        bodyInput.value = '';

        const success = el('div', { class: 'stg-success', text: 'Opening your email client to send feedback. Thank you!' });
        tab.insertBefore(success, formContainer.nextSibling);
        setTimeout(() => success.remove(), 4000);
      }
    });

    const formContainer = el('div', { class: 'stg-card' },
      el('div', { class: 'stg-card-body', style: 'flex-direction: column; align-items: stretch; gap: 0;' },
        typeSelect,
        subjectInput,
        bodyInput,
        el('div', { style: 'text-align: right;' }, submitBtn)
      )
    );

    tab.append(formContainer);

    return tab;
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  function handleExport(btn) {
    const original = btn.textContent;
    btn.textContent = 'Exporting…';
    btn.disabled = true;

    // Use setTimeout so the UI updates before the synchronous export work.
    setTimeout(() => {
      try {
        exportBackup(store);
        btn.textContent = 'Done ✓';
        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
        }, 1800);
      } catch (err) {
        btn.textContent = original;
        btn.disabled = false;
        showInlineError(btn.closest('.stg-card'), err.message);
      }
    }, 50);
  }

  function handleImport(tab, btn) {
    btn.textContent = 'Importing…';
    btn.disabled = true;

    importBackup({
      onPreview: (data) => {
        btn.textContent = 'Import';
        btn.disabled = false;
        showImportPreview(tab, data);
      },
      onError: (msg) => {
        btn.textContent = 'Import';
        btn.disabled = false;
        showInlineError(btn.closest('.stg-card'), msg);
      },
    });
  }

  function handleReset(tab, btn) {
    // Show inline confirmation inside the Reset card.
    const card = btn.closest('.stg-card');
    if (card.querySelector('.stg-confirm')) return; // already shown

    const cancelBtn = el('button', {
      class: 'stg-action-btn',
      type: 'button',
      text: 'Cancel',
      onclick: () => confirm.remove(),
    });

    const confirmBtn = el('button', {
      class: 'stg-action-btn stg-action-btn--danger',
      type: 'button',
      text: 'Reset',
      onclick: async () => {
        confirmBtn.textContent = 'Resetting…';
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        try {
          await resetWorkspace(store);
        } catch (err) {
          confirmBtn.textContent = 'Reset';
          confirmBtn.disabled = false;
          cancelBtn.disabled = false;
          showInlineError(card, err.message);
        }
      },
    });

    const confirm = el('div', { class: 'stg-confirm' },
      el('p', { class: 'stg-confirm-msg', text: 'This will erase all tasks, notes, habits, shortcuts, and settings. This cannot be undone.' }),
      el('div', { class: 'stg-confirm-actions' }, cancelBtn, confirmBtn)
    );

    card.append(confirm);
    confirmBtn.focus();
  }

  function showImportPreview(tab, data) {
    // Remove any existing preview.
    tab.querySelector('.stg-preview')?.remove();

    const summary = buildSummary(data);

    const cancelBtn = el('button', {
      class: 'stg-action-btn',
      type: 'button',
      text: 'Cancel',
      onclick: () => preview.remove(),
    });

    const restoreBtn = el('button', {
      class: 'stg-action-btn stg-action-btn--primary',
      type: 'button',
      text: 'Restore',
      onclick: async () => {
        restoreBtn.textContent = 'Restoring…';
        restoreBtn.disabled = true;
        cancelBtn.disabled = true;
        try {
          await restoreBackup(store, data);
        } catch (err) {
          restoreBtn.textContent = 'Restore';
          restoreBtn.disabled = false;
          cancelBtn.disabled = false;
          showInlineError(preview, err.message);
        }
      },
    });

    const preview = el('div', { class: 'stg-preview', role: 'region', 'aria-label': 'Backup preview' },
      el('div', { class: 'stg-preview-header' },
        el('span', { class: 'stg-preview-title', text: 'Backup Preview' }),
        el('span', { class: 'stg-preview-warning', text: 'Current data will be overwritten.' })
      ),
      el('div', { class: 'stg-preview-rows' },
        ...summary.map(row =>
          el('div', { class: 'stg-preview-row' },
            el('span', { class: 'stg-preview-label', text: row.label }),
            el('span', { class: 'stg-preview-value', text: row.value })
          )
        )
      ),
      el('div', { class: 'stg-confirm-actions' }, cancelBtn, restoreBtn)
    );

    tab.append(preview);
    restoreBtn.focus();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a Data Management card block. */
function stgCard(icon, title, desc, actionBtn) {
  return el('div', { class: 'stg-card' },
    el('div', { class: 'stg-card-body' },
      el('div', { class: 'stg-card-left' },
        el('span', { class: 'stg-card-icon', 'aria-hidden': 'true', text: icon }),
        el('div', { class: 'stg-card-text' },
          el('div', { class: 'stg-card-title', text: title }),
          el('div', { class: 'stg-card-desc', text: desc })
        )
      ),
      actionBtn
    )
  );
}

/** Append an inline error message to a card, auto-removing after 5 s. */
function showInlineError(card, message) {
  card?.querySelector('.stg-inline-error')?.remove();
  const err = el('p', { class: 'stg-inline-error', role: 'alert', text: message });
  card?.append(err);
  setTimeout(() => err.remove(), 5000);
}
