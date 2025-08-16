// Animation System Manager
export class AnimationManager {
  constructor() {
    this.animatedElements = new Set();
    this.observers = [];
    this.animationQueue = [];
    this.isAnimating = false;
  }

  init() {
    console.log('🎬 Initializing Animation Manager...');
    this.setupIntersectionObserver();
    this.animateInitialElements();
    this.setupMutationObserver();
    this.setupEventListeners();
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
    element.addEventListener('mouseenter', () => {
      element.style.transform = 'translateY(-5px)';
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

  // Button click animation
  animateButtonClick(button) {
    button.style.transform = 'scale(0.95)';
    button.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
      button.style.transform = '';
    }, 100);

    // Ripple effect
    this.createRippleEffect(button);
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

  // Animate page transitions
  animatePageTransition(fromSection, toSection) {
    return new Promise((resolve) => {
      if (fromSection) {
        fromSection.style.animation = 'slideInFromLeft 0.3s ease-out reverse';
        setTimeout(() => {
          fromSection.classList.remove('active');
          fromSection.style.display = 'none';
        }, 300);
      }
      
      if (toSection) {
        setTimeout(() => {
          toSection.style.display = 'block';
          toSection.classList.add('active');
          toSection.style.animation = 'slideInFromRight 0.3s ease-out forwards';
          resolve();
        }, fromSection ? 300 : 0);
      }
    });
  }

  // Re-animate elements (useful for dynamic content updates)
  refreshAnimations() {
    this.animatedElements.clear();
    this.animateInitialElements();
  }

  // Clean up observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.animatedElements.clear();
  }

  // Utility method to add custom animations
  addCustomAnimation(element, animationType = 'fadeIn', delay = 0) {
    element.style.animationDelay = `${delay}s`;
    element.classList.add(`animate-${animationType}`);
    this.animatedElements.add(element);
  }
}

// CSS for ripple effect
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes ripple {
    from {
      transform: translate(-50%, -50%) scale(0);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0;
    }
  }
`;
document.head.appendChild(rippleStyle);