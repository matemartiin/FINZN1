export class NavigationManager {
  constructor() {
    this.currentSection = 'dashboard';
  }

  init() {
    this.setupNavigationEvents();
    this.showSection('dashboard');
  }

  setupNavigationEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');
        this.showSection(section);
        this.setActiveNavItem(item);
      });
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
    }
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

  getCurrentSection() {
    return this.currentSection;
  }
}