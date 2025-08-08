export class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || 'light';
    this.validThemes = ['light', 'dark'];
  }

  getStoredTheme() {
    try {
      return localStorage.getItem('finzn-theme');
    } catch (error) {
      console.warn('Error accessing localStorage for theme:', error);
      return null;
    }
  }

  setStoredTheme(theme) {
    try {
      localStorage.setItem('finzn-theme', theme);
      return true;
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
      return false;
    }
  }
  init() {
    // Validate current theme
    if (!this.validThemes.includes(this.currentTheme)) {
      console.warn('Invalid theme detected, falling back to light:', this.currentTheme);
      this.currentTheme = 'light';
    }
    
    this.applyTheme(this.currentTheme);
    this.updateToggleIcon();
  }

  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    
    if (!this.validThemes.includes(newTheme)) {
      console.error('Invalid theme transition:', newTheme);
      return;
    }
    
    this.currentTheme = newTheme;
    this.applyTheme(this.currentTheme);
    this.updateToggleIcon();
    this.setStoredTheme(this.currentTheme);
  }

  applyTheme(theme) {
    if (!theme || !this.validThemes.includes(theme)) {
      console.error('Invalid theme provided to applyTheme:', theme);
      return;
    }
    
    try {
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
      
      console.log('✅ Theme applied successfully:', theme);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }

  updateToggleIcon() {
    try {
      const icon = document.querySelector('.theme-icon');
      if (icon) {
        const iconText = this.currentTheme === 'light' ? '🌙' : '☀️';
        icon.textContent = iconText;
      } else {
        console.warn('Theme toggle icon not found in DOM');
      }
    } catch (error) {
      console.error('Error updating theme toggle icon:', error);
    }
  }
  
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  setTheme(theme) {
    if (!this.validThemes.includes(theme)) {
      console.error('Invalid theme provided to setTheme:', theme);
      return false;
    }
    
    this.currentTheme = theme;
    this.applyTheme(theme);
    this.updateToggleIcon();
    this.setStoredTheme(theme);
    return true;
  }
}