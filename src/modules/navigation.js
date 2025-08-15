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
        this.switchTab(tabName);
        this.setActiveTab(button);
      });
    });
  }
  
  setupBreadcrumbs() {
    const breadcrumbItems = document.querySelectorAll('.breadcrumb-item[data-section]');
    
    breadcrumbItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        if (section) {
          this.showSection(section);
          this.updateActiveNavigation(section);
        }
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

  // Ir a Configuración
  settingsBtn?.addEventListener('click', () => {
    this.showSection('settings');
    close();
  });

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
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
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
    }
  }
  
  updatePageTitle(sectionName) {
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