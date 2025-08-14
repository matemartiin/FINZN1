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
  }

  updateToggleIcon() {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
      icon.innerHTML = this.currentTheme === 'light' ? '<i class="ph ph-moon"></i>' : '<i class="ph ph-sun"></i>';
    }
  }
}