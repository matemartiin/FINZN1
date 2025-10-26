export class NavigationManager {
  constructor() {
    this.currentSection = 'dashboard';
    this.mobileMenuOpen = false;
    this.isTransitioning = false;
    this.pendingTab = null;
  }

  init() {
    this.setupNavigationEvents();
    this.setupMobileMenu();
    this.setupTabNavigation();
    this.setupHeaderMenu();
    this.showSection('dashboard');
  }

  setupNavigationEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        if (section) {
          this.showSection(section);
          this.setActiveNavItem(item);
          this.closeMobileMenu();
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
    }
  }
  
  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');

        // If already transitioning, queue this tab change
        if (this.isTransitioning) {
          this.pendingTab = { name: tabName, button: button };
          return;
        }

        this.switchTab(tabName, button);
      });
    });
  }
  

  setupHeaderMenu() {
  const btn = document.getElementById('header-menu-toggle');
  const menu = document.getElementById('header-menu');
  const closeBtn = document.getElementById('header-menu-close');
  const settingsBtn = document.getElementById('header-menu-settings');
  const logoutBtn = document.getElementById('header-menu-logout');
  const themeSwitch = document.getElementById('header-theme-switch');
  const nameLabel = document.getElementById('menu-user-name');

  // Sincronizar nombre del usuario
  const headerName = document.getElementById('user-name');
  if (headerName && nameLabel) nameLabel.textContent = headerName.textContent || 'Usuario';

  const open = () => menu?.classList.add('open');
  const close = () => menu?.classList.remove('open');

  btn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);

  // Cerrar al clickear fuera
  document.addEventListener('click', (e) => {
    if (!menu) return;
    const inside = e.target.closest('#header-menu') || e.target.closest('#header-menu-toggle');
    if (!inside && menu.classList.contains('open')) close();
  });

  // Esc para cerrar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Settings now handled by user profile modal - remove this handler

  // Logout (usa el mismo handler que ya tenés)
  logoutBtn?.addEventListener('click', () => {
    document.getElementById('logout-btn')?.click();
  });

  // Sincronizar switch con el tema actual
  try {
    const isDark = (window.app?.theme?.currentTheme === 'dark');
    if (typeof isDark === 'boolean' && themeSwitch) themeSwitch.checked = isDark;
  } catch {}

  // Toggle tema desde el switch
  themeSwitch?.addEventListener('change', () => {
    window.app?.theme?.toggle?.();
    // mantener el switch en sync por si cambio viene de otro lado
    setTimeout(() => {
      themeSwitch.checked = (window.app?.theme?.currentTheme === 'dark');
    }, 0);
  });
}

  
  toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    
    if (navMenu && mobileToggle) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      
      if (this.mobileMenuOpen) {
        navMenu.classList.add('mobile-open');
        mobileToggle.innerHTML = '<div class="nav-icon"><i class="ph ph-x"></i></div><span class="nav-label">Cerrar</span>';
      } else {
        navMenu.classList.remove('mobile-open');
        mobileToggle.innerHTML = '<div class="nav-icon"><i class="ph ph-list"></i></div><span class="nav-label">Menú</span>';
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
  
  async switchTab(tabName, activeButton) {
    // Prevent multiple transitions at once
    if (this.isTransitioning) return;

    this.isTransitioning = true;

    // Get current and target tab contents
    const currentTab = document.querySelector('.tab-content.active');
    const targetTab = document.getElementById(`${tabName}-tab`);

    if (!targetTab || currentTab === targetTab) {
      this.isTransitioning = false;
      return;
    }

    // Update button states immediately for visual feedback
    this.setActiveTab(activeButton);

    // Phase 1: Fade out current tab
    if (currentTab) {
      currentTab.style.opacity = '0';
      currentTab.style.transform = 'translateX(-10px)';

      // Wait for fade out animation
      await new Promise(resolve => setTimeout(resolve, 300));

      currentTab.classList.remove('active');
      currentTab.style.transform = '';
    }

    // Phase 2: Prepare and fade in new tab
    targetTab.style.opacity = '0';
    targetTab.style.transform = 'translateX(10px)';
    targetTab.classList.add('active');

    // Force reflow
    targetTab.offsetHeight;

    // Fade in
    await new Promise(resolve => setTimeout(resolve, 50));
    targetTab.style.opacity = '1';
    targetTab.style.transform = 'translateX(0)';

    // Wait for fade in animation
    await new Promise(resolve => setTimeout(resolve, 400));

    // Clear inline styles
    targetTab.style.opacity = '';
    targetTab.style.transform = '';

    this.isTransitioning = false;

    // Process pending tab change if any
    if (this.pendingTab) {
      const pending = this.pendingTab;
      this.pendingTab = null;
      this.switchTab(pending.name, pending.button);
    }
  }

  setActiveTab(activeButton) {
    if (!activeButton) return;

    // Remove active class from all tab buttons with smooth transition
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

  async showSection(sectionName) {
    const currentActiveSection = document.querySelector('.dashboard-section.active');
    const targetSection = document.getElementById(`${sectionName}-section`);
    
    if (!targetSection) return;
    
    // Animate section transition if animation manager is available
    if (window.app && window.app.animations && currentActiveSection !== targetSection) {
      await window.app.animations.animatePageTransition(currentActiveSection, targetSection);
    } else {
      // Fallback to instant transition
      const sections = document.querySelectorAll('.dashboard-section');
      sections.forEach(section => {
        section.classList.remove('active');
      });
      targetSection.classList.add('active');
    }
    
    this.currentSection = sectionName;
    
    // Update page title
    this.updatePageTitle(sectionName);
    
    // Special handling for calendar section
    if (sectionName === 'calendar' && window.app && window.app.calendar) {
      setTimeout(async () => {
        console.log('📅 Navigation: Calendar section activated, refreshing events...');
        await window.app.calendar.loadEvents();
        window.app.calendar.renderCalendar();
      }, 100);
    }
    
    // Trigger animation refresh for new section content
    if (window.app && window.app.animations) {
      setTimeout(() => {
        window.app.animations.refreshAnimations();
      }, 400);
    }
    
  }
  
  updatePageTitle(sectionName) {
    const titles = {
      'dashboard': 'Resumen General',
      'transactions': 'Transacciones',
      'goals': 'Objetivos de Ahorro',
      'reports': 'Reportes y Análisis',
      'calendar': 'Calendario Financiero',
      'budgets': 'Gestión de Presupuestos'
    };
    
    const title = titles[sectionName] || 'FINZN';
    document.title = `${title} - FINZN`;
  }

  setActiveNavItem(activeItem) {
    if (!activeItem) {
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
}