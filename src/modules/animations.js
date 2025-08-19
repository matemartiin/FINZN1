// Animation System Manager
export class AnimationManager {
  constructor() {
    this.animatedElements = new Set();
    this.observers = [];
    this.animationQueue = [];
    this.isAnimating = false;
    this.isTransitioning = false;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.activeAnimations = new Map();
  }

  init() {
    console.log('🎬 Initializing Animation Manager...');
    
    // Listen for reduced motion preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      console.log('🎬 Reduced motion preference changed:', this.prefersReducedMotion);
    });

    this.setupIntersectionObserver();
    this.animateInitialElements();
    this.setupMutationObserver();
    this.setupEventListeners();
    this.preloadAnimations();
  }

  // Setup Intersection Observer for scroll-triggered animations
  setupIntersectionObserver() {
    if (!window.IntersectionObserver) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    this.observers.push(observer);

    // Observe elements that should animate on scroll
    const scrollAnimatedElements = document.querySelectorAll(`
      .card:not(.animated),
      .dashboard-card:not(.animated),
      .metric-card:not(.animated),
      .summary-card:not(.animated),
      .table-row:not(.animated),
      .expense-item:not(.animated),
      .transaction-item:not(.animated),
      .chart-container:not(.animated)
    `);

    scrollAnimatedElements.forEach(el => observer.observe(el));
  }

  // Setup Mutation Observer to animate dynamically added elements
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.animateNewElement(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(observer);
  }

  // Animate initial page elements
  animateInitialElements() {
    // Animate dashboard cards with stagger
    this.animateDashboardCards();
    
    // Animate navigation elements
    this.animateNavigation();
    
    // Animate section headers
    this.animateSectionHeaders();
    
    // Animate forms
    this.animateForms();
    
    // Animate numbers with counting effect
    this.animateNumbers();
  }

  animateDashboardCards() {
    const cards = document.querySelectorAll('.card, .dashboard-card, .metric-card, .summary-card');
    
    cards.forEach((card, index) => {
      if (this.animatedElements.has(card)) return;
      
      card.style.setProperty('--card-delay', index);
      card.classList.add('animated');
      this.animatedElements.add(card);
      
      // Add hover animations
      this.addHoverEffects(card);
    });
  }

  animateNavigation() {
    // Animate sidebar items
    const navItems = document.querySelectorAll('.nav-item, .sidebar-item');
    navItems.forEach((item, index) => {
      if (this.animatedElements.has(item)) return;
      
      item.style.setProperty('--nav-delay', index);
      item.classList.add('animated');
      this.animatedElements.add(item);
    });

    // Animate header elements
    const headerElements = document.querySelectorAll('.user-profile, .notification-bell, .search-box');
    headerElements.forEach((element, index) => {
      if (this.animatedElements.has(element)) return;
      
      element.style.setProperty('--header-delay', index);
      element.classList.add('animated');
      this.animatedElements.add(element);
    });
  }

  animateSectionHeaders() {
    const headers = document.querySelectorAll('.section-header, .section-title, h1, h2, h3');
    headers.forEach((header, index) => {
      if (this.animatedElements.has(header)) return;
      
      header.classList.add('animated');
      this.animatedElements.add(header);
    });
  }

  animateForms() {
    const formGroups = document.querySelectorAll('.form-group, .input-group');
    formGroups.forEach((group, index) => {
      if (this.animatedElements.has(group)) return;
      
      group.style.setProperty('--form-delay', index);
      group.classList.add('animated');
      this.animatedElements.add(group);
    });

    // Add focus animations to inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      this.addInputAnimations(input);
    });
  }

  animateNumbers() {
    const numberElements = document.querySelectorAll('.metric-number, .balance-amount, .total-amount');
    
    numberElements.forEach((element, index) => {
      if (this.animatedElements.has(element)) return;
      
      element.style.setProperty('--number-delay', index);
      
      // Extract number value
      const text = element.textContent;
      const number = parseFloat(text.replace(/[^\d.-]/g, ''));
      
      if (!isNaN(number)) {
        this.animateCountUp(element, 0, number, 1000);
      }
      
      this.animatedElements.add(element);
    });
  }

  // Animate newly added elements
  animateNewElement(element) {
    const animatableSelectors = [
      '.card', '.dashboard-card', '.metric-card', '.summary-card',
      '.table-row', '.expense-item', '.transaction-item',
      '.form-group', '.input-group', '.modal', '.alert'
    ];

    animatableSelectors.forEach(selector => {
      if (element.matches && element.matches(selector)) {
        this.animateElement(element);
      }
      
      // Check children as well
      const children = element.querySelectorAll(selector);
      children.forEach(child => this.animateElement(child));
    });
  }

  // Generic element animation
  animateElement(element) {
    if (this.animatedElements.has(element)) return;

    // Determine animation type based on element type
    let animationClass = 'animate-slide-up';
    
    if (element.classList.contains('card') || element.classList.contains('dashboard-card')) {
      animationClass = 'animate-slide-up';
    } else if (element.classList.contains('table-row') || element.classList.contains('expense-item')) {
      animationClass = 'animate-slide-left';
    } else if (element.classList.contains('modal')) {
      animationClass = 'animate-scale-in';
    } else if (element.classList.contains('alert')) {
      animationClass = 'animate-bounce-in';
    }

    element.classList.add(animationClass);
    element.classList.add('animated');
    this.animatedElements.add(element);
  }

  // Add hover effects to elements
  addHoverEffects(element) {
    if (this.prefersReducedMotion) return;
    
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-3px)';
    });

    element.addEventListener('mouseleave', () => {
      element.style.transform = '';
    });
  }

  // Add input focus animations
  addInputAnimations(input) {
    input.addEventListener('focus', () => {
      input.style.transform = 'scale(1.02)';
      input.style.boxShadow = '0 0 0 3px rgba(200, 182, 255, 0.3)';
    });

    input.addEventListener('blur', () => {
      input.style.transform = '';
      input.style.boxShadow = '';
    });
  }

  // Count up animation for numbers
  animateCountUp(element, start, end, duration) {
    const startTime = performance.now();
    const originalText = element.textContent;
    const prefix = originalText.replace(/[\d.-]/g, '').split(end.toString())[0] || '';
    const suffix = originalText.replace(/[\d.-]/g, '').split(end.toString())[1] || '';

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(start + (end - start) * easedProgress);
      
      element.textContent = prefix + currentValue.toLocaleString() + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.textContent = originalText; // Restore original formatting
      }
    };

    requestAnimationFrame(animate);
  }

  // Setup event listeners for interactions
  setupEventListeners() {
    // Button click animations
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn, button')) {
        this.animateButtonClick(e.target);
      }
    });

    // Form submission animations
    document.addEventListener('submit', (e) => {
      const submitBtn = e.target.querySelector('[type="submit"], .btn-primary');
      if (submitBtn) {
        this.animateButtonLoading(submitBtn);
      }
    });

    // Navigation click animations
    document.addEventListener('click', (e) => {
      if (e.target.matches('.nav-item, .sidebar-item')) {
        this.animateNavClick(e.target);
      }
    });
  }

  // Button press animation
  animateButtonPress(button) {
    if (!button || this.prefersReducedMotion) return;

    const originalTransform = button.style.transform;
    button.style.transition = 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)';
    button.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      button.style.transform = originalTransform;
      setTimeout(() => {
        button.style.transition = '';
      }, 150);
    }, 150);
  }

  // Button click animation (legacy)
  animateButtonClick(button) {
    this.animateButtonPress(button);
    
    if (!this.prefersReducedMotion) {
      // Ripple effect
      this.createRippleEffect(button);
    }
  }

  // Create ripple effect
  createRippleEffect(element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.transform = 'translate(-50%, -50%) scale(0)';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.3)';
    ripple.style.position = 'absolute';
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'ripple 0.6s ease-out';
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Button loading animation
  animateButtonLoading(button) {
    button.classList.add('loading');
    button.disabled = true;
    
    // Remove loading state after 2 seconds (adjust based on actual form processing)
    setTimeout(() => {
      button.classList.remove('loading');
      button.disabled = false;
    }, 2000);
  }

  // Navigation click animation
  animateNavClick(navItem) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item, .sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to clicked item
    navItem.classList.add('active');
  }

  // Preload critical animations
  preloadAnimations() {
    if (this.prefersReducedMotion) return;
    
    // Force browser to create animation contexts
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      width: 1px;
      height: 1px;
      opacity: 0;
      transform: translateX(0);
      transition: all 0.3s ease-out;
      will-change: transform, opacity;
    `;
    document.body.appendChild(testElement);
    
    // Trigger a small animation to warm up the engine
    requestAnimationFrame(() => {
      testElement.style.transform = 'translateX(1px)';
      setTimeout(() => {
        document.body.removeChild(testElement);
      }, 350);
    });
  }

  // Main page transition animation - SEQUENTIAL to avoid overlap
  async animatePageTransition(fromSection, toSection) {
    if (this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    
    try {
      if (this.prefersReducedMotion) {
        // Instant transition for reduced motion
        this.instantTransition(fromSection, toSection);
        return;
      }

      // STEP 1: Animate OUT the current section first
      if (fromSection) {
        fromSection.classList.add('transitioning-out');
        await new Promise(resolve => setTimeout(resolve, 120)); // Quick fade out
        fromSection.classList.remove('active');
        fromSection.classList.remove('transitioning-out');
      }
      
      // STEP 2: Then animate IN the new section
      if (toSection) {
        toSection.classList.add('transitioning-in');
        // No delay - start immediately after previous section is hidden
        toSection.classList.add('active');
        await new Promise(resolve => setTimeout(resolve, 180)); // Wait for smooth fade in
        toSection.classList.remove('transitioning-in');
      }
      
    } finally {
      this.isTransitioning = false;
    }
  }

  // Unused methods - removed for cleaner code
  // All transition logic is now handled by CSS in transitions.css

  instantTransition(fromSection, toSection) {
    if (fromSection) {
      fromSection.classList.remove('active');
    }
    if (toSection) {
      toSection.classList.add('active');
    }
  }

  // Modal animation methods
  animateModalIn(modalElement, backdropElement) {
    if (!modalElement) return Promise.resolve();

    return new Promise(resolve => {
      const duration = this.prefersReducedMotion ? 0 : 300;
      
      // Set initial state
      modalElement.style.cssText = `
        opacity: 0;
        transform: scale(0.95) translateY(20px);
        transition: all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1);
      `;
      
      if (backdropElement) {
        backdropElement.style.cssText = `
          opacity: 0;
          backdrop-filter: blur(0px);
          transition: all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1);
        `;
      }

      requestAnimationFrame(() => {
        modalElement.style.opacity = '1';
        modalElement.style.transform = 'scale(1) translateY(0)';
        
        if (backdropElement) {
          backdropElement.style.opacity = '1';
          backdropElement.style.backdropFilter = 'blur(8px)';
        }
        
        setTimeout(resolve, duration);
      });
    });
  }

  animateModalOut(modalElement, backdropElement) {
    if (!modalElement) return Promise.resolve();

    return new Promise(resolve => {
      const duration = this.prefersReducedMotion ? 0 : 250;
      
      modalElement.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      modalElement.style.opacity = '0';
      modalElement.style.transform = 'scale(0.95) translateY(-20px)';
      
      if (backdropElement) {
        backdropElement.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        backdropElement.style.opacity = '0';
        backdropElement.style.backdropFilter = 'blur(0px)';
      }
      
      setTimeout(resolve, duration);
    });
  }

  // Enhanced card hover animations
  enhanceCardHovers() {
    const cards = document.querySelectorAll('.expense-card, .goal-card, .budget-card, .card, .dashboard-card');
    
    cards.forEach(card => {
      if (this.activeAnimations.has(card)) return;
      
      card.style.transition = 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)';
      
      const handleMouseEnter = () => {
        if (!this.prefersReducedMotion) {
          card.style.transform = 'translateY(-2px)';
          card.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        }
      };
      
      const handleMouseLeave = () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      };
      
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
      
      this.activeAnimations.set(card, { handleMouseEnter, handleMouseLeave });
    });
  }

  // Stagger animation for lists
  animateListItems(container, itemSelector = '.list-item') {
    if (!container || this.prefersReducedMotion) return;

    const items = container.querySelectorAll(itemSelector);
    items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = `all 300ms cubic-bezier(0.4, 0, 0.2, 1)`;
      item.style.transitionDelay = `${index * 50}ms`;
      
      requestAnimationFrame(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      });
    });
  }

  // Loading animation
  showLoadingAnimation(element, text = 'Cargando...') {
    if (!element) return;

    const loadingHTML = `
      <div class="loading-animation">
        <div class="loading-spinner"></div>
        <span class="loading-text">${text}</span>
      </div>
    `;
    
    element.innerHTML = loadingHTML;
    
    if (!this.prefersReducedMotion) {
      const spinner = element.querySelector('.loading-spinner');
      if (spinner) {
        spinner.style.animation = 'spin 1s linear infinite';
      }
    }
  }

  // Success/Error feedback animations
  showFeedbackAnimation(element, type = 'success', message = '') {
    if (!element) return;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const colors = {
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    element.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: ${colors[type]}20;
      border: 1px solid ${colors[type]}40;
      color: ${colors[type]};
      transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateY(10px);
      opacity: 0;
    `;
    
    element.innerHTML = `
      <span style="font-size: 16px;">${icons[type]}</span>
      <span>${message}</span>
    `;

    requestAnimationFrame(() => {
      element.style.transform = 'translateY(0)';
      element.style.opacity = '1';
    });
  }

  // Re-animate elements (useful for dynamic content updates)
  refreshAnimations() {
    if (this.prefersReducedMotion || this.isTransitioning) return;

    // Wait a bit to ensure section transitions are complete
    setTimeout(() => {
      if (this.isTransitioning) return; // Double check

      // Re-enhance card hovers for newly added elements
      this.enhanceCardHovers();
      
      // Animate any new list items ONLY in the active section
      const activeSection = document.querySelector('.dashboard-section.active');
      if (!activeSection) return;

      const containers = activeSection.querySelectorAll('.expenses-list, .goals-list, .budgets-list');
      containers.forEach(container => {
        const newItems = container.querySelectorAll('[data-new="true"]');
        newItems.forEach(item => {
          // Only animate if parent section is active and visible
          if (!item.closest('.dashboard-section.active')) return;
          
          item.style.opacity = '0';
          item.style.transform = 'translateY(20px)';
          item.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
          
          requestAnimationFrame(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            item.removeAttribute('data-new');
          });
        });
      });
      
      // Re-run initial animations ONLY for active section
      this.animateActiveSection();
    }, 350); // Wait for section transition to complete
  }

  // Animate only the currently active section
  animateActiveSection() {
    const activeSection = document.querySelector('.dashboard-section.active');
    if (!activeSection) return;

    // Clear and re-animate elements only in active section
    const elementsInActiveSection = activeSection.querySelectorAll('.card, .dashboard-card, .metric-card, .summary-card');
    elementsInActiveSection.forEach(element => {
      this.animatedElements.delete(element); // Remove from set to re-animate
    });

    // Re-run animations for active section only
    this.animateDashboardCards();
  }

  // Cleanup method
  cleanup() {
    this.activeAnimations.forEach((listeners, element) => {
      if (listeners.handleMouseEnter) {
        element.removeEventListener('mouseenter', listeners.handleMouseEnter);
      }
      if (listeners.handleMouseLeave) {
        element.removeEventListener('mouseleave', listeners.handleMouseLeave);
      }
    });
    
    this.activeAnimations.clear();
    this.animationQueue.length = 0;
  }

  // Clean up observers
  destroy() {
    this.cleanup();
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.animatedElements.clear();
  }

  // Utility method to check if animations are enabled
  get animationsEnabled() {
    return !this.prefersReducedMotion;
  }

  // Utility method to add custom animations
  addCustomAnimation(element, animationType = 'fadeIn', delay = 0) {
    element.style.animationDelay = `${delay}s`;
    element.classList.add(`animate-${animationType}`);
    this.animatedElements.add(element);
  }
}

