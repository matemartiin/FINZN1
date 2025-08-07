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
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        if (section) {
          this.showSection(section);
          this.setActiveNavItem(item);
          this.closeMobileMenu();
          
          // Trigger section change event for budget analytics
          document.dispatchEvent(new CustomEvent('sectionChanged', {
            detail: { section }
          }));
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
    }
  }
  
  updatePageTitle(sectionName) {
    const titles = {
      'dashboard': 'Resumen General',
      'transactions': 'Transacciones',
      'budget': 'Presupuesto',
      'goals': 'Objetivos de Ahorro',
      'reports': 'Reportes y Análisis',
      'settings': 'Configuración',
      'calendar': 'Calendario Financiero'
    };
    
    const title = titles[sectionName] || 'FINZN';
    document.title = `${title} - FINZN`;
  }

  setActiveNavItem(activeItem) {
    // Remove active class from all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to clicked item
    activeItem.classList.add('active');
  }
}