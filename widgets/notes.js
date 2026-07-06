/**
 * Sticky Notes widget: a manager panel plus independently floating notes.
 * Each note remembers its own position, size, title, and content; notes can
 * overlap and drag from their headers. Content autosaves (debounced).
 * Closing the manager widget removes the floating layer too (cleanup fn).
 */

import { el, iconBtn, uid, debounce } from '../utils/dom.js';
import { makeDraggable, makeResizable, bringToFront } from '../src/ui/draggable.js';

const NOTE_DEFAULTS = { x: 140, y: 160, w: 260, h: 220 };
const DUPLICATE_OFFSET_PX = 24;
const NOTE_MIN_WIDTH = 180;
const NOTE_MIN_HEIGHT = 140;
const AUTOSAVE_MS = 400;

export function mount(body, { store }) {
  const layer = el('div', { class: 'notes-layer' });
  document.getElementById('canvas').append(layer);

  const root = el('div', { class: 'notes-widget' });
  body.append(root);
  renderManager();
  renderFloating();

  function notes() {
    return store.get('notes');
  }

  function save() {
    store.touch('notes');
  }

  function createNote() {
    const cascade = notes().length * DUPLICATE_OFFSET_PX;
    notes().push({
      id: uid(),
      title: 'New note',
      content: '',
      open: true,
      x: NOTE_DEFAULTS.x + cascade,
      y: NOTE_DEFAULTS.y + cascade,
      w: NOTE_DEFAULTS.w,
      h: NOTE_DEFAULTS.h,
    });
    save();
    renderManager();
    renderFloating();
  }

  function renderManager() {
    const rows = notes().map((note) => el('li', {},
      el('span', { class: 'label', text: note.title }),
      el('div', { class: 'row-actions row-actions-static' },
        iconBtn(note.open ? '▾' : '▸', note.open ? `Close ${note.title}` : `Open ${note.title}`, () => {
          note.open = !note.open;
          save();
          renderManager();
          renderFloating();
        }),
        iconBtn('⧉', `Duplicate ${note.title}`, () => {
          notes().push({
            ...note,
            id: uid(),
            title: `${note.title} (copy)`,
            x: note.x + DUPLICATE_OFFSET_PX,
            y: note.y + DUPLICATE_OFFSET_PX,
            open: true,
          });
          save();
          renderManager();
          renderFloating();
        }),
        iconBtn('✕', `Delete ${note.title}`, () => {
          store.set('notes', notes().filter((n) => n.id !== note.id));
          renderManager();
          renderFloating();
        }))));
    const list = el('ul', { class: 'todo-list' }, ...rows);
    if (notes().length === 0) {
      list.append(el('li', { class: 'empty-state', text: 'No notes yet — create one below.' }));
    }
    root.replaceChildren(
      list,
      el('button', { class: 'pill-btn', type: 'button', text: '+ New Note', onclick: createNote }),
    );
  }

  /** Rebuild the floating layer. Called on open/close/create/delete only —
   *  not on keystrokes — so typing never loses focus. */
  function renderFloating() {
    layer.replaceChildren(...notes().filter((n) => n.open).map(noteEl));
  }

  function noteEl(note) {
    const titleInput = el('input', {
      class: 'note-title', type: 'text', value: note.title, 'aria-label': 'Note title',
    });
    titleInput.addEventListener('input', debounce(() => {
      note.title = titleInput.value;
      save();
      renderManager();
    }, AUTOSAVE_MS));

    const editor = el('div', {
      class: 'note-content',
      contenteditable: 'true',
      'aria-label': 'Note content',
    });
    // Placeholder via CSS :empty
    if (!note.content) {
      editor.setAttribute('data-placeholder', 'Write something…');
    }
    editor.innerHTML = note.content;

    editor.addEventListener('input', debounce(() => {
      note.content = editor.innerHTML;
      if (note.content === '<br>') note.content = ''; // Cleanup empty state
      editor.setAttribute('data-placeholder', note.content ? '' : 'Write something…');
      save();
    }, AUTOSAVE_MS));

    // Hide placeholder on focus if empty
    editor.addEventListener('focus', () => editor.setAttribute('data-placeholder', ''));
    editor.addEventListener('blur', () => {
      if (!editor.textContent.trim() && !editor.querySelector('img')) {
        editor.innerHTML = '';
        note.content = '';
        editor.setAttribute('data-placeholder', 'Write something…');
      }
    });

    const tbBtn = (cmd, icon, label) => el('button', {
      type: 'button',
      class: 'note-tb-btn',
      'aria-label': label,
      title: label,
      onclick: () => {
        editor.focus();
        document.execCommand(cmd, false, null);
        note.content = editor.innerHTML;
        save();
      }
    }, icon);

    const fileInput = el('input', { type: 'file', accept: 'image/*', style: 'display: none;' });
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const cvs = document.createElement('canvas');
          const maxW = 600;
          let w = img.width, h = img.height;
          if (w > maxW) { h = (maxW / w) * h; w = maxW; }
          cvs.width = w; cvs.height = h;
          cvs.getContext('2d').drawImage(img, 0, 0, w, h);
          const dataUri = cvs.toDataURL('image/webp', 0.85);
          
          editor.focus();
          document.execCommand('insertImage', false, dataUri);
          note.content = editor.innerHTML;
          save();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset
    });

    const imgBtn = el('button', {
      type: 'button', class: 'note-tb-btn', 'aria-label': 'Insert Image', title: 'Insert Image',
      onclick: () => fileInput.click()
    }, '🖼');

    const toolbar = el('div', { class: 'note-toolbar' },
      tbBtn('bold', 'B', 'Bold'),
      tbBtn('italic', 'I', 'Italic'),
      tbBtn('underline', 'U', 'Underline'),
      tbBtn('strikeThrough', 'S', 'Strikethrough'),
      el('div', { class: 'note-tb-divider' }),
      tbBtn('insertUnorderedList', '•', 'Bullet List'),
      el('div', { class: 'note-tb-divider' }),
      imgBtn,
      fileInput
    );

    const header = el('div', { class: 'note-header' },
      titleInput,
      iconBtn('✕', 'Close note', () => {
        note.open = false;
        save();
        renderManager();
        renderFloating();
      }));
    const grip = el('div', { class: 'resize-grip', 'aria-hidden': 'true' });
    const node = el('section', { class: 'note', 'aria-label': `Sticky note: ${note.title}` },
      header, editor, toolbar, grip);

    node.style.left = `${note.x}px`;
    node.style.top = `${note.y}px`;
    node.style.width = `${note.w}px`;
    node.style.height = `${note.h}px`;

    node.addEventListener('pointerdown', () => bringToFront(node));
    makeDraggable(header, node, (pos) => { Object.assign(note, pos); save(); });
    makeResizable(grip, node, (size) => { Object.assign(note, size); save(); },
      { minWidth: NOTE_MIN_WIDTH, minHeight: NOTE_MIN_HEIGHT });
    return node;
  }

  return () => layer.remove();
}
