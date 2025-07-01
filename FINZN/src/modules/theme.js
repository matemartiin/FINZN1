export class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('finzn-theme') || 'light';
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.updateToggleIcon();
  }

  toggle() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    this.updateToggleIcon();
    localStorage.setItem('finzn-theme', this.currentTheme);
  }

  applyTheme(theme) {
    // Remove existing theme classes
    document.body.classList.remove('darkmode', 'lightmode');
    
    // Apply new theme
    if (theme === 'dark') {
      document.body.classList.add('darkmode');
    } else {
      document.body.classList.add('lightmode');
    }
    
    // Update CSS custom properties for better theme support
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
  }

  updateToggleIcon() {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}