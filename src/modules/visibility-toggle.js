export class VisibilityToggle {
  constructor() {
    this.isVisible = true;
    this.elements = [
      { id: 'balance-amount-new', originalValue: '' },
      { id: 'income-summary', originalValue: '' },
      { id: 'monthly-expenses-summary', originalValue: '' }
    ];
    this.hiddenPlaceholder = '••••••';
    this.storageKey = 'finzn-values-visibility';
  }

  init() {
    console.log('👁️ Initializing Visibility Toggle...');
    
    // Load saved state
    this.loadState();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Apply initial state
    this.applyVisibilityState();
  }

  setupEventListeners() {
    const toggleBtn = document.getElementById('toggle-visibility-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleVisibility());
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved !== null) {
        this.isVisible = JSON.parse(saved);
      }
    } catch (error) {
      console.log('👁️ Could not load visibility state:', error);
      this.isVisible = true;
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.isVisible));
    } catch (error) {
      console.log('👁️ Could not save visibility state:', error);
    }
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.saveState();
    this.applyVisibilityState();
    
    console.log(`👁️ Visibility toggled: ${this.isVisible ? 'visible' : 'hidden'}`);
  }

  applyVisibilityState() {
    // Update toggle button icon
    this.updateToggleIcon();
    
    // Update each element
    this.elements.forEach(element => {
      const el = document.getElementById(element.id);
      if (!el) return;

      if (this.isVisible) {
        // Show real values
        if (element.originalValue) {
          el.textContent = element.originalValue;
        }
        el.setAttribute('data-visible', 'true');
      } else {
        // Store original value if not already stored
        if (!element.originalValue) {
          element.originalValue = el.textContent;
        }
        
        // Show hidden placeholder
        el.textContent = this.hiddenPlaceholder;
        el.setAttribute('data-visible', 'false');
      }
    });
  }

  updateToggleIcon() {
    const icon = document.getElementById('visibility-icon');
    if (!icon) return;

    if (this.isVisible) {
      icon.className = 'ph ph-eye';
      icon.parentElement.title = 'Ocultar valores';
    } else {
      icon.className = 'ph ph-eye-slash';
      icon.parentElement.title = 'Mostrar valores';
    }
  }

  // Method to update values when they change (called by other modules)
  updateValue(elementId, newValue) {
    const element = this.elements.find(el => el.id === elementId);
    if (element) {
      element.originalValue = newValue;
      
      // If currently visible, update the display immediately
      if (this.isVisible) {
        const el = document.getElementById(elementId);
        if (el) {
          el.textContent = newValue;
        }
      }
    }
  }

  // Method to refresh all values (called when data updates)
  refreshValues() {
    if (this.isVisible) {
      // Re-capture current values
      this.elements.forEach(element => {
        const el = document.getElementById(element.id);
        if (el && el.getAttribute('data-visible') !== 'false') {
          element.originalValue = el.textContent;
        }
      });
    }
  }

  // Public method to check if values are currently visible
  areValuesVisible() {
    return this.isVisible;
  }
}