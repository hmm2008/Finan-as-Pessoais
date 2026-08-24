export function applyPrefs() {
  try {
    const raw = localStorage.getItem('finanas_user_prefs');
    if (raw) {
      const prefs = JSON.parse(raw);
      const root = window.document.documentElement;

      const isDark = prefs.theme === 'dark' || (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      root.classList.remove('light', 'dark');
      if (isDark) {
        root.classList.add('dark');
      }

      if (prefs.accentColor) {
        root.style.setProperty('--custom-accent-color', prefs.accentColor);
      }
      
      root.classList.remove('font-inter', 'font-system', 'font-serif', 'font-mono');
      if (prefs.fontFamily === 'serif') {
        root.style.fontFamily = 'Georgia, Cambria, "Times New Roman", Times, serif';
      } else if (prefs.fontFamily === 'mono') {
        root.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      } else if (prefs.fontFamily === 'system') {
        root.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      } else {
        root.style.fontFamily = 'Plus Jakarta Sans, Inter, sans-serif';
      }

      if (prefs.baseFontSize === 'sm') {
        root.style.fontSize = '14px';
      } else if (prefs.baseFontSize === 'lg') {
        root.style.fontSize = '18px';
      } else {
        root.style.fontSize = '16px';
      }

      if (prefs.density) {
        root.setAttribute('data-density', prefs.density);
      }
    }
  } catch (e) {
    console.error('Failed to apply local prefs on boot', e);
  }
}
