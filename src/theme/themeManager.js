/**
 * ThemeManager — loads and applies animated background themes.
 *
 * Moved to src/theme/. Dynamic import path updated from
 * ../backgrounds/ to ../../themes/ following the backgrounds/ → themes/ rename.
 * The CSS link.href is a URL relative to newtab.html (the root), so it
 * references themes/<name>/theme.css (no leading ../).
 */

export class ThemeManager {
  constructor(store, containerId) {
    this.store = store;
    this.container = document.getElementById(containerId);
    this.currentTheme = null;
    this.cleanupFn = null;
    this.loadedCSS = new Map();
  }

  async apply(themeName) {
    if (this.currentTheme === themeName) return;
    
    // 1. Run cleanup from previous theme
    if (this.cleanupFn) {
      try { this.cleanupFn(); } catch(e) { console.warn('Theme cleanup error:', e); }
      this.cleanupFn = null;
    }
    
    // 2. Always clear the container
    if (this.container) {
      this.container.innerHTML = '';
    }

    // 3. Remove old theme class
    if (this.currentTheme) {
      document.body.classList.remove(`theme-${this.currentTheme}`);
    }

    this.currentTheme = themeName;
    
    // 4. If minimal/default, just stop here (clean slate)
    if (themeName === 'default' || themeName === 'minimal') {
      return; 
    }

    // 5. Add the new theme class
    document.body.classList.add(`theme-${themeName}`);

    // 6. Load CSS (only once per theme).
    //    link.href is relative to the HTML document (newtab.html at the root),
    //    so the path is themes/<name>/theme.css — no leading ../.
    if (!this.loadedCSS.has(themeName)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `themes/${themeName}/theme.css`;
      document.head.appendChild(link);
      this.loadedCSS.set(themeName, link);
    }

    // 7. Load and mount the JS module.
    //    The dynamic import path IS relative to this file (src/theme/themeManager.js),
    //    so we go two levels up to reach themes/ at the root.
    try {
      const module = await import(`../../themes/${themeName}/theme.js`);
      if (module.mount) {
        // Handle both sync and async mount functions
        const result = module.mount(this.container);
        if (result && typeof result.then === 'function') {
          this.cleanupFn = await result;
        } else {
          this.cleanupFn = result;
        }
      }
    } catch (e) {
      console.error(`Failed to load theme: ${themeName}`, e);
    }
  }

  init() {
    this.apply(this.store.get('settings').theme || 'minimal');
  }
}
