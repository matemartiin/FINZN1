export class NavigationManager {
  constructor() {
    this.currentSection = 'dashboard';
    this.currentTab = 'dashboard';
  }

  init() {
    this.setupTabNavigationEvents();
    this.setupSidebarNavigationEvents();
    this.setupPlanningTabs();
    this.setupReportsTabs();
    this.showSection('dashboard');
  }

  setupTabNavigationEvents() {
    const tabItems = document.querySelectorAll('.tab-item');
    
    tabItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        this.showSection(section);
        this.setActiveTabItem(item);
      });
    });
  }

  setupSidebarNavigationEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        this.showSection(section);
        this.setActiveNavItem(item);
        this.setActiveTabFromSidebar(section);
      });
    });
  }

  setupPlanningTabs() {
    const planningTabBtns = document.querySelectorAll('.planning-tab-btn');
    
    planningTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        this.showPlanningTab(tabName);
        this.setActivePlanningTab(btn);
      });
    });
  }

  setupReportsTabs() {
    const reportsTabBtns = document.querySelectorAll('.reports-tab-btn');
    
    reportsTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        this.showReportsTab(tabName);
        this.setActiveReportsTab(btn);
      });
    });
  }

  showSection(sectionName) {
    console.log('🧭 Navigating to section:', sectionName);
    
    // Hide all tab sections
    const sections = document.querySelectorAll('.tab-section');
    sections.forEach(section => {
      section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.classList.add('active');
      this.currentSection = sectionName;
      this.currentTab = sectionName;
      
      // Update page title
      this.updatePageTitle(sectionName);
      
      // Trigger section-specific initialization
      this.initializeSection(sectionName);
    }
  }

  setActiveTabItem(activeItem) {
    // Remove active class from all tab items
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
      item.classList.remove('active');
    });

    // Add active class to clicked item
    activeItem.classList.add('active');
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

  setActiveTabFromSidebar(section) {
    // Sync tab navigation with sidebar navigation
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-section') === section) {
        item.classList.add('active');
      }
    });
  }

  showPlanningTab(tabName) {
    // Hide all planning tabs
    const tabs = document.querySelectorAll('.planning-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
      targetTab.classList.add('active');
    }
  }

  setActivePlanningTab(activeBtn) {
    // Remove active class from all planning tab buttons
    const btns = document.querySelectorAll('.planning-tab-btn');
    btns.forEach(btn => {
      btn.classList.remove('active');
    });

    // Add active class to clicked button
    activeBtn.classList.add('active');
  }

  showReportsTab(tabName) {
    // Hide all reports tabs
    const tabs = document.querySelectorAll('.reports-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active');
    });

    // Show selected tab
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
      targetTab.classList.add('active');
    }
  }

  setActiveReportsTab(activeBtn) {
    // Remove active class from all reports tab buttons
    const btns = document.querySelectorAll('.reports-tab-btn');
    btns.forEach(btn => {
      btn.classList.remove('active');
    });

    // Add active class to clicked button
    activeBtn.classList.add('active');
  }

  updatePageTitle(sectionName) {
    const titles = {
      'dashboard': 'Dashboard - FINZN',
      'transactions': 'Transacciones - FINZN',
      'calendar': 'Calendario Financiero - FINZN',
      'planning': 'Planificación - FINZN',
      'reports': 'Reportes y Logros - FINZN',
      'settings': 'Configuración - FINZN'
    };
    
    document.title = titles[sectionName] || 'FINZN - Tu Compañero Financiero';
  }

  initializeSection(sectionName) {
    // Initialize section-specific functionality
    switch (sectionName) {
      case 'calendar':
        this.initializeCalendar();
        break;
      case 'transactions':
        this.initializeTransactions();
        break;
      case 'planning':
        this.initializePlanning();
        break;
      case 'reports':
        this.initializeReports();
        break;
    }
  }

  initializeCalendar() {
    console.log('📅 Initializing calendar section');
    // Calendar initialization will be handled by CalendarManager
    if (window.app && window.app.calendar) {
      window.app.calendar.init();
    }
  }

  initializeTransactions() {
    console.log('💳 Initializing transactions section');
    // Update transactions timeline
    if (window.app && window.app.updateTransactionsTimeline) {
      window.app.updateTransactionsTimeline();
    }
  }

  initializePlanning() {
    console.log('🎯 Initializing planning section');
    // Update planning widgets
    if (window.app && window.app.updatePlanningWidgets) {
      window.app.updatePlanningWidgets();
    }
  }

  initializeReports() {
    console.log('📊 Initializing reports section');
    // Update reports data
    if (window.app && window.app.updateReportsData) {
      window.app.updateReportsData();
    }
  }

  // Public method to navigate programmatically
  navigateTo(section, tab = null) {
    this.showSection(section);
    
    // Update both tab and sidebar navigation
    const tabItem = document.querySelector(`.tab-item[data-section="${section}"]`);
    const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
    
    if (tabItem) {
      this.setActiveTabItem(tabItem);
    }
    
    if (navItem) {
      this.setActiveNavItem(navItem);
    }
    
    // Handle sub-tabs if specified
    if (tab) {
      if (section === 'planning') {
        this.showPlanningTab(tab);
        const tabBtn = document.querySelector(`.planning-tab-btn[data-tab="${tab}"]`);
        if (tabBtn) {
          this.setActivePlanningTab(tabBtn);
        }
      } else if (section === 'reports') {
        this.showReportsTab(tab);
        const tabBtn = document.querySelector(`.reports-tab-btn[data-tab="${tab}"]`);
        if (tabBtn) {
          this.setActiveReportsTab(tabBtn);
        }
      }
    }
  }

  getCurrentSection() {
    return this.currentSection;
  }

  getCurrentTab() {
    return this.currentTab;
  }
}