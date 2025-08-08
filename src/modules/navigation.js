export class NavigationManager {
  constructor() {
    this.currentSection = 'dashboard';
    this.mobileMenuOpen = false;
  }

  init() {
    this.setupNavigationEvents();
    this.setupMobileMenu();
    this.setupTabNavigation();
    this.setupBreadcrumbs();
    this.showSection('dashboard');
  }

  setupNavigationEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    if (navItems.length === 0 && mobileNavItems.length === 0) {
      console.warn('⚠️ No navigation items found in DOM');
      return;
    }
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        if (section) {
          this.showSection(section);
          this.setActiveNavItem(item);
          this.closeMobileMenu();
        } else {
          console.warn('Navigation item missing data-section attribute:', item);
        }
      });
    });
    
    // Mobile navigation events
    mobileNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        if (section) {
          this.showSection(section);
          this.setActiveMobileNavItem(item);
        } else {
          console.warn('Mobile navigation item missing data-section attribute:', item);
        }
      });
    });
  }
  
  setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar-nav') && this.mobileMenuOpen) {
          this.closeMobileMenu();
        }
      });
    } else {
      console.warn('⚠️ Mobile menu elements not found:', {
        toggle: !!mobileToggle,
        menu: !!navMenu
      });
    }
  }
  
  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    if (tabButtons.length === 0) {
      console.log('ℹ️ No tab buttons found - tab navigation not needed');
      return;
    }
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        if (tabName) {
          this.switchTab(tabName);
          this.setActiveTab(button);
        } else {
          console.warn('Tab button missing data-tab attribute:', button);
        }
      });
    });
  }
  
  setupBreadcrumbs() {
    const breadcrumbItems = document.querySelectorAll('.breadcrumb-item[data-section]');
    
    if (breadcrumbItems.length === 0) {
      console.log('ℹ️ No breadcrumb items found - breadcrumb navigation not needed');
      return;
    }
    
    breadcrumbItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        if (section) {
          this.showSection(section);
          this.updateActiveNavigation(section);
        } else {
          console.warn('Breadcrumb item missing data-section attribute:', item);
        }
      });
    });
  }
  
  toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    
    if (navMenu && mobileToggle) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      
      if (this.mobileMenuOpen) {
        navMenu.classList.add('mobile-open');
        mobileToggle.innerHTML = '<div class="nav-icon">✕</div><span class="nav-label">Cerrar</span>';
      } else {
        navMenu.classList.remove('mobile-open');
        mobileToggle.innerHTML = '<div class="nav-icon">📊</div><span class="nav-label">Menú</span>';
      }
    }
  }
  
  closeMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    
    if (navMenu && mobileToggle && this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
      navMenu.classList.remove('mobile-open');
      mobileToggle.innerHTML = '<div class="nav-icon">📊</div><span class="nav-label">Menú</span>';
    }
  }
  
  switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
  }
  
  setActiveTab(activeButton) {
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });
    
    // Add active class to clicked button
    activeButton.classList.add('active');
  }
  
  updateActiveNavigation(section) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const itemSection = item.getAttribute('data-section');
      if (itemSection === section) {
        this.setActiveNavItem(item);
      }
    });
  }

  showSection(sectionName) {
    if (!sectionName || typeof sectionName !== 'string') {
      console.error('NavigationManager: Invalid section name:', sectionName);
      return;
    }
    
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    
    if (sections.length === 0) {
      console.warn('⚠️ No dashboard sections found in DOM');
      return;
    }
    
    sections.forEach(section => {
      section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
      this.currentSection = sectionName;
      
      // Update page title
      this.updatePageTitle(sectionName);
      
      // Update contextual bar visibility
      if (window.app && window.app.contextualBar) {
        setTimeout(() => {
          window.app.contextualBar.updateVisibility(sectionName);
        }, 100);
      }
    } else {
      console.error('NavigationManager: Section not found:', `${sectionName}-section`);
    }
  }
  
  updatePageTitle(sectionName) {
    if (!sectionName) {
      console.warn('NavigationManager: No section name provided for title update');
      return;
    }
    
    const titles = {
      'dashboard': 'Resumen General',
      'transactions': 'Transacciones',
      'goals': 'Objetivos de Ahorro',
      'reports': 'Reportes y Análisis',
      'settings': 'Configuración',
      'calendar': 'Calendario Financiero',
      'budgets': 'Gestión de Presupuestos'
    };
    
    const title = titles[sectionName] || 'FINZN';
    
    try {
      document.title = `${title} - FINZN`;
    } catch (error) {
      console.warn('Error updating document title:', error);
    }
  }

  setActiveNavItem(activeItem) {
    if (!activeItem) {
      console.error('NavigationManager: No item provided to setActiveNavItem');
      return;
    }
    
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    navItems.forEach(item => {
      item.classList.remove('active');
    });
    
    mobileNavItems.forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to clicked item
    activeItem.classList.add('active');
    
    // Also activate corresponding mobile nav item
    const section = activeItem.getAttribute('data-section');
    if (section) {
      const mobileItem = document.querySelector(`.mobile-nav-item[data-section="${section}"]`);
      if (mobileItem) {
        mobileItem.classList.add('active');
      }
    }
  }
  
  setActiveMobileNavItem(activeItem) {
    if (!activeItem) {
      console.error('NavigationManager: No item provided to setActiveMobileNavItem');
      return;
    }
    
    // Remove active class from all mobile nav items
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    const navItems = document.querySelectorAll('.nav-item');
    
    mobileNavItems.forEach(item => {
      item.classList.remove('active');
    });
    
    navItems.forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to clicked item
    activeItem.classList.add('active');
    
    // Also activate corresponding desktop nav item
    const section = activeItem.getAttribute('data-section');
    if (section) {
      const desktopItem = document.querySelector(`.nav-item[data-section="${section}"]`);
      if (desktopItem) {
        desktopItem.classList.add('active');
      }
    }
  }
    