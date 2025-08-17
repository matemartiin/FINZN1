// Loading Screen Manager
export class LoadingManager {
  constructor() {
    this.loadingElement = null;
    this.isShowing = false;
  }

  // Create and show loading screen
  show() {
    if (this.isShowing) return;

    // Create loading screen element
    this.loadingElement = document.createElement('div');
    this.loadingElement.className = 'loading-screen';
    this.loadingElement.id = 'loading-screen';
    
    // Create logo element
    const logoElement = document.createElement('img');
    logoElement.className = 'loading-logo';
    logoElement.src = '/isotipo.png';
    logoElement.alt = 'FINZN Loading';
    logoElement.loading = 'eager'; // Load immediately
    
    // Handle image load error
    logoElement.onerror = () => {
      console.warn('Loading logo not found, using fallback');
      logoElement.style.display = 'none';
      // Create fallback with text
      const fallback = document.createElement('div');
      fallback.innerHTML = '<div style="font-size: 2rem; color: var(--primary-color); font-weight: bold;">FINZN</div>';
      fallback.className = 'loading-logo';
      this.loadingElement.appendChild(fallback);
    };
    
    this.loadingElement.appendChild(logoElement);
    
    // Add to document
    document.body.appendChild(this.loadingElement);
    this.isShowing = true;

    if (import.meta.env.DEV) {
      console.log('🔄 Loading screen shown');
    }
  }

  // Hide loading screen with fade animation
  hide() {
    if (!this.isShowing || !this.loadingElement) return;

    if (import.meta.env.DEV) {
      console.log('✅ Hiding loading screen');
    }

    // Add fade-out class for smooth transition
    this.loadingElement.classList.add('fade-out');
    
    // Remove element after animation completes
    setTimeout(() => {
      if (this.loadingElement && this.loadingElement.parentNode) {
        this.loadingElement.parentNode.removeChild(this.loadingElement);
      }
      this.loadingElement = null;
      this.isShowing = false;
    }, 500); // Match CSS transition duration
  }

  // Check if loading screen is currently showing
  isVisible() {
    return this.isShowing;
  }

  // Force hide without animation (useful for quick navigation)
  forceHide() {
    if (!this.loadingElement) return;
    
    if (this.loadingElement.parentNode) {
      this.loadingElement.parentNode.removeChild(this.loadingElement);
    }
    this.loadingElement = null;
    this.isShowing = false;
  }
}

// Create singleton instance
export const loadingManager = new LoadingManager();