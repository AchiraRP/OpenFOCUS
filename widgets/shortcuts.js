import { el, iconBtn, uid } from '../utils/dom.js';
import * as bus from '../utils/bus.js';

export function mount(body, { store }) {
  const root = el('div', { class: 'shortcuts-widget' });
  body.append(root);

  let searchQuery = '';
  let activeFolderId = null; 
  let draggedItem = null; // { type: 'shortcut' | 'folder', id }
  let contextMenuEl = null;

  // Ensure DOM handles click-outside for context menu and folder overlay
  function onGlobalClick(e) {
    if (contextMenuEl && !contextMenuEl.contains(e.target)) {
      contextMenuEl.remove();
      contextMenuEl = null;
    }
    const overlay = root.querySelector('.folder-overlay');
    if (overlay && overlay.classList.contains('open') && e.target === overlay) {
      activeFolderId = null;
      render();
    }
  }
  function onGlobalKeydown(e) {
    if (e.key === 'Escape') {
      if (contextMenuEl) {
        contextMenuEl.remove();
        contextMenuEl = null;
      } else if (activeFolderId) {
        activeFolderId = null;
        render();
      }
    }
  }

  document.addEventListener('mousedown', onGlobalClick);
  document.addEventListener('keydown', onGlobalKeydown);

  // --- Data Helpers ---
  function getShortcuts() { return store.get('shortcuts') ?? []; }
  function getFolders() { return store.get('shortcutFolders') ?? []; }
  function save() { 
    store.touch('shortcuts'); 
    store.touch('shortcutFolders'); 
    bus.emit(bus.EVENTS.DATA_CHANGED); 
    render(); 
  }

  // Fallback icon fetcher
  function getIconUrl(url) {
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
    } catch {
      return '';
    }
  }

  // --- Render Core ---
  function render() {
    // Top toolbar
    const searchInput = el('input', {
      class: 'shortcuts-search',
      type: 'text',
      placeholder: 'Search...',
      value: searchQuery,
    });
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderGrid();
    });

    const addShortcutBtn = iconBtn('+', 'Add Shortcut', () => openShortcutModal());
    const addFolderBtn = iconBtn('📁', 'New Folder', () => openFolderModal());

    const toolbar = el('div', { class: 'shortcuts-toolbar' }, searchInput, addShortcutBtn, addFolderBtn);

    // Main Grid
    const grid = el('div', { class: 'shortcuts-grid' });
    
    // Replace old children
    root.innerHTML = '';
    root.append(toolbar, grid);

    // If searching, we flatten. If not, we show root folders and root shortcuts.
    renderGrid(grid);

    // Folder Overlay
    const overlay = el('div', { class: 'folder-overlay' });
    root.append(overlay);
    if (activeFolderId) {
      const folder = getFolders().find(f => f.id === activeFolderId);
      if (folder) {
        overlay.classList.add('open');
        const header = el('div', { class: 'folder-overlay-header' },
          el('span', { class: 'folder-overlay-title', text: folder.name }),
          iconBtn('✕', 'Close', () => { activeFolderId = null; render(); })
        );
        const content = el('div', { class: 'folder-overlay-content shortcuts-grid' });
        
        // Render folder contents
        const folderShortcuts = getShortcuts().filter(s => s.folderId === folder.id).sort((a,b) => a.order - b.order);
        folderShortcuts.forEach(s => content.append(renderShortcut(s)));

        // Handle drop inside overlay grid
        content.addEventListener('dragover', (e) => e.preventDefault());
        content.addEventListener('drop', (e) => {
          e.preventDefault();
          if (draggedItem?.type === 'shortcut') {
            const s = getShortcuts().find(x => x.id === draggedItem.id);
            if (s && s.folderId !== folder.id) {
              s.folderId = folder.id;
              s.order = Date.now();
              save();
            }
          }
        });

        overlay.append(header, content);
      } else {
        activeFolderId = null;
      }
    }
    
    // Focus logic preservation
    if (searchQuery) searchInput.focus();
  }

  function renderGrid(container = root.querySelector('.shortcuts-grid')) {
    container.innerHTML = '';
    const allShortcuts = getShortcuts();
    const allFolders = getFolders();

    if (searchQuery) {
      // Flatten all
      const filtered = allShortcuts.filter(s => s.title.toLowerCase().includes(searchQuery) || s.url.toLowerCase().includes(searchQuery));
      filtered.forEach(s => container.append(renderShortcut(s)));
      return;
    }

    // Root level items
    const rootFolders = allFolders.sort((a, b) => a.order - b.order);
    const rootShortcuts = allShortcuts.filter(s => !s.folderId).sort((a, b) => a.order - b.order);

    rootFolders.forEach(f => container.append(renderFolder(f)));
    rootShortcuts.forEach(s => container.append(renderShortcut(s)));

    // Allow dropping on the root grid to pull out of folders
    container.addEventListener('dragover', (e) => e.preventDefault());
    container.addEventListener('drop', (e) => {
      e.preventDefault();
      // If we are dropping onto the empty space of the grid, move to root
      if (e.target === container && draggedItem?.type === 'shortcut') {
        const s = getShortcuts().find(x => x.id === draggedItem.id);
        if (s) {
          s.folderId = null;
          s.order = Date.now();
          save();
        }
      }
    });
  }

  function renderShortcut(shortcut) {
    const card = el('a', { 
      class: 'shortcut-card', 
      href: shortcut.url, 
      draggable: 'true' 
    });
    
    const iconWrapper = el('div', { class: 'shortcut-icon-wrapper' });
    const img = el('img', { src: shortcut.icon || getIconUrl(shortcut.url), alt: shortcut.title });
    // fallback if img fails
    img.onerror = () => { img.style.display = 'none'; };
    iconWrapper.append(img);

    const title = el('div', { class: 'shortcut-title', text: shortcut.title });
    card.append(iconWrapper, title);

    card.addEventListener('dragstart', (e) => {
      draggedItem = { type: 'shortcut', id: shortcut.id };
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      draggedItem = null;
      card.classList.remove('dragging');
    });

    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, [
        { label: 'Edit', onClick: () => openShortcutModal(shortcut) },
        { label: 'Duplicate', onClick: () => duplicateShortcut(shortcut) },
        { label: 'Remove from Folder', onClick: () => { shortcut.folderId = null; save(); }, hide: !shortcut.folderId },
        { label: 'Delete', danger: true, onClick: () => deleteShortcut(shortcut.id) }
      ]);
    });

    return card;
  }

  function renderFolder(folder) {
    const card = el('div', { class: 'shortcut-card', draggable: 'true' });
    
    const iconWrapper = el('div', { class: 'shortcut-icon-wrapper folder-preview-grid' });
    const folderShortcuts = getShortcuts().filter(s => s.folderId === folder.id).sort((a,b) => a.order - b.order).slice(0, 4);
    
    // fill 4 slots
    for (let i = 0; i < 4; i++) {
      if (folderShortcuts[i]) {
        const s = folderShortcuts[i];
        const img = el('img', { src: s.icon || getIconUrl(s.url) });
        img.onerror = () => { img.style.display = 'none'; };
        iconWrapper.append(img);
      } else {
        iconWrapper.append(el('div', { class: 'empty-slot' }));
      }
    }

    const title = el('div', { class: 'shortcut-title', text: folder.name });
    card.append(iconWrapper, title);

    card.addEventListener('click', () => {
      activeFolderId = folder.id;
      render();
    });

    // Drag events
    card.addEventListener('dragstart', (e) => {
      draggedItem = { type: 'folder', id: folder.id };
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      draggedItem = null;
      card.classList.remove('dragging');
    });

    // Drop onto folder
    card.addEventListener('dragover', (e) => {
      if (draggedItem?.type === 'shortcut') {
        e.preventDefault();
        card.style.transform = 'scale(1.05)';
      }
    });
    card.addEventListener('dragleave', () => {
      card.style.transform = '';
    });
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.style.transform = '';
      if (draggedItem?.type === 'shortcut') {
        const s = getShortcuts().find(x => x.id === draggedItem.id);
        if (s) {
          s.folderId = folder.id;
          s.order = Date.now();
          save();
        }
      }
    });

    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, [
        { label: 'Rename', onClick: () => openFolderModal(folder) },
        { label: 'Delete (Keep items)', onClick: () => deleteFolder(folder.id, false) },
        { label: 'Delete All', danger: true, onClick: () => deleteFolder(folder.id, true) }
      ]);
    });

    return card;
  }

  // --- Actions ---
  function duplicateShortcut(shortcut) {
    const s = { ...shortcut, id: uid(), order: Date.now() };
    getShortcuts().push(s);
    save();
  }
  function deleteShortcut(id) {
    store.set('shortcuts', getShortcuts().filter(s => s.id !== id));
    save();
  }
  function deleteFolder(id, cascade) {
    if (cascade) {
      store.set('shortcuts', getShortcuts().filter(s => s.folderId !== id));
    } else {
      getShortcuts().forEach(s => { if (s.folderId === id) s.folderId = null; });
    }
    store.set('shortcutFolders', getFolders().filter(f => f.id !== id));
    save();
  }

  // --- Context Menu ---
  function showContextMenu(x, y, items) {
    if (contextMenuEl) contextMenuEl.remove();
    contextMenuEl = el('div', { class: 'context-menu', style: `left:${x}px; top:${y}px;` });
    
    items.forEach(item => {
      if (item.hide) return;
      const btn = el('button', { 
        class: `context-menu-item${item.danger ? ' danger' : ''}`, 
        text: item.label 
      });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        contextMenuEl.remove();
        contextMenuEl = null;
        item.onClick();
      });
      contextMenuEl.append(btn);
    });
    document.body.append(contextMenuEl);

    // Adjust if goes off screen
    const rect = contextMenuEl.getBoundingClientRect();
    if (rect.right > window.innerWidth) contextMenuEl.style.left = `${window.innerWidth - rect.width - 8}px`;
    if (rect.bottom > window.innerHeight) contextMenuEl.style.top = `${window.innerHeight - rect.height - 8}px`;
  }

  // --- Modals ---
  function openShortcutModal(editing = null) {
    // Creates a generic modal container over the widget
    const modalOverlay = el('div', { class: 'folder-overlay open', style: 'align-items: center; justify-content: center; pointer-events: auto;' });
    
    const titleInput = el('input', { class: 'field', type: 'text', placeholder: 'Name (e.g. GitHub)', value: editing?.title || '' });
    const urlInput = el('input', { class: 'field', type: 'url', placeholder: 'URL (e.g. https://github.com)', value: editing?.url || '' });
    const iconInput = el('input', { class: 'field', type: 'url', placeholder: 'Custom Icon URL (optional)', value: editing?.icon || '' });
    
    const folderSelect = el('select', { class: 'field' }, el('option', { value: '', text: 'None (Root)' }));
    getFolders().forEach(f => {
      const opt = el('option', { value: f.id, text: f.name });
      if (editing && editing.folderId === f.id) opt.selected = true;
      else if (activeFolderId === f.id) opt.selected = true;
      folderSelect.append(opt);
    });

    const form = el('form', { class: 'shortcuts-form' },
      el('h3', { text: editing ? 'Edit Shortcut' : 'New Shortcut', style: 'margin:0; font-weight:500; font-size:16px;' }),
      titleInput, urlInput, iconInput, folderSelect,
      el('div', { style: 'display:flex; gap:8px; margin-top: 8px;' },
        el('button', { class: 'pill-btn primary', type: 'submit', text: 'Save' }),
        el('button', { class: 'pill-btn', type: 'button', text: 'Cancel', onclick: () => modalOverlay.remove() })
      )
    );

    form.onsubmit = (e) => {
      e.preventDefault();
      if (!titleInput.value || !urlInput.value) return;
      let url = urlInput.value;
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;

      if (editing) {
        editing.title = titleInput.value;
        editing.url = url;
        editing.icon = iconInput.value;
        editing.folderId = folderSelect.value || null;
      } else {
        getShortcuts().push({
          id: uid(),
          title: titleInput.value,
          url: url,
          icon: iconInput.value,
          folderId: folderSelect.value || null,
          order: Date.now()
        });
      }
      save();
      modalOverlay.remove();
    };

    const container = el('div', { class: 'widget', style: 'padding: 20px; width: 300px; max-width: 90%;' }, form);
    modalOverlay.append(container);
    root.append(modalOverlay);
    titleInput.focus();
  }

  function openFolderModal(editing = null) {
    const modalOverlay = el('div', { class: 'folder-overlay open', style: 'align-items: center; justify-content: center; pointer-events: auto;' });
    const titleInput = el('input', { class: 'field', type: 'text', placeholder: 'Folder Name', value: editing?.name || '' });
    
    const form = el('form', { class: 'shortcuts-form' },
      el('h3', { text: editing ? 'Rename Folder' : 'New Folder', style: 'margin:0; font-weight:500; font-size:16px;' }),
      titleInput,
      el('div', { style: 'display:flex; gap:8px; margin-top: 8px;' },
        el('button', { class: 'pill-btn primary', type: 'submit', text: 'Save' }),
        el('button', { class: 'pill-btn', type: 'button', text: 'Cancel', onclick: () => modalOverlay.remove() })
      )
    );

    form.onsubmit = (e) => {
      e.preventDefault();
      if (!titleInput.value) return;
      if (editing) {
        editing.name = titleInput.value;
      } else {
        getFolders().push({
          id: uid(),
          name: titleInput.value,
          order: Date.now()
        });
      }
      save();
      modalOverlay.remove();
    };

    const container = el('div', { class: 'widget', style: 'padding: 20px; width: 300px; max-width: 90%;' }, form);
    modalOverlay.append(container);
    root.append(modalOverlay);
    titleInput.focus();
  }

  // Initialization
  render();

  return () => {
    document.removeEventListener('mousedown', onGlobalClick);
    document.removeEventListener('keydown', onGlobalKeydown);
    if (contextMenuEl) contextMenuEl.remove();
    root.remove();
  };
}
