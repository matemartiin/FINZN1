// User Profile Button & Modal Management
export class UserProfileButton {
  constructor() {
    this.modal = null;
    this.currentSection = 'profile';
    this.userProfile = null;
    this.auth = null;
    this.isInitialized = false;
  }

  // Initialize the user profile button system
  async init(userProfile, auth, themeManager = null) {
    if (this.isInitialized) return;
    
    this.userProfile = userProfile;
    this.auth = auth;
    this.themeManager = themeManager;
    
    this.setupEventListeners();
    await this.updateUserInitials();
    this.isInitialized = true;
    
    console.log('👤 User Profile Button initialized');
  }

  // Set up event listeners
  setupEventListeners() {
    // Profile button click
    const profileBtn = document.getElementById('user-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => this.openModal());
    }

    // Modal close
    this.setupModalClose();

    // Navigation between sections
    this.setupNavigation();

    // Theme toggle in modal
    this.setupThemeToggle();

    // Action buttons
    this.setupActionButtons();

    // Logout from modal
    this.setupLogout();
  }

  // Setup modal close functionality
  setupModalClose() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.modal-close') && e.target.closest('#user-profile-modal')) {
        this.closeModal();
      }
      
      // Close modal when clicking outside
      if (e.target.id === 'user-profile-modal') {
        this.closeModal();
      }
    });

    // Close with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalOpen()) {
        this.closeModal();
      }
    });
  }

  // Setup navigation between modal sections
  setupNavigation() {
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('.profile-nav-item');
      if (navItem && navItem.dataset.section) {
        this.switchSection(navItem.dataset.section);
      }
    });
  }

  // Setup theme toggle
  setupThemeToggle() {
    const themeToggle = document.getElementById('profile-theme-toggle');
    if (themeToggle) {
      // Sync with current theme
      this.syncThemeToggle();

      themeToggle.addEventListener('change', (e) => {
        if (this.themeManager) {
          this.themeManager.toggle();
          // Update toggle state after theme change
          setTimeout(() => this.syncThemeToggle(), 100);
        } else {
          const newTheme = e.target.checked ? 'dark' : 'light';
          this.changeTheme(newTheme);
        }
      });

      // Listen for theme changes from other parts of the app
      window.addEventListener('themeChanged', () => {
        this.syncThemeToggle();
      });
    }
  }

  // Sync theme toggle with current theme
  syncThemeToggle() {
    const themeToggle = document.getElementById('profile-theme-toggle');
    if (themeToggle) {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                    document.body.classList.contains('darkmode');
      themeToggle.checked = isDark;
    }
  }

  // Setup action buttons
  setupActionButtons() {
    // Edit profile from modal
    const editProfileBtn = document.getElementById('edit-profile-from-modal');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        this.closeModal();
        if (window.app && window.app.modals) {
          window.app.modals.show('edit-profile-modal');
        }
      });
    }

    // Manage categories from modal
    const manageCategoriesBtn = document.getElementById('manage-categories-from-modal');
    if (manageCategoriesBtn) {
      manageCategoriesBtn.addEventListener('click', () => {
        this.closeModal();
        if (window.app && window.app.modals) {
          window.app.modals.show('manage-categories-modal');
        }
      });
    }

    // Data actions
    this.setupDataActions();
  }

  // Setup data action buttons (export, import, backup)
  setupDataActions() {
    const exportBtn = document.getElementById('export-data-from-modal');
    const importBtn = document.getElementById('import-data-from-modal');
    const backupBtn = document.getElementById('backup-data-from-modal');

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.closeModal();
        // Trigger export functionality
        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
          exportDataBtn.click();
        }
      });
    }

    if (importBtn) {
      importBtn.addEventListener('click', () => {
        this.closeModal();
        const importDataBtn = document.getElementById('import-data-btn');
        if (importDataBtn) {
          importDataBtn.click();
        }
      });
    }

    if (backupBtn) {
      backupBtn.addEventListener('click', () => {
        this.closeModal();
        // Trigger backup functionality
        const backupDataBtn = document.getElementById('backup-data-btn');
        if (backupDataBtn) {
          backupDataBtn.click();
        }
      });
    }
  }

  // Setup logout functionality
  setupLogout() {
    const logoutBtn = document.getElementById('profile-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          this.closeModal();
          if (this.auth) {
            await this.auth.logout();
          }
        } catch (error) {
          console.error('Logout error:', error);
        }
      });
    }
  }

  // Open the profile modal
  openModal() {
    this.modal = document.getElementById('user-profile-modal');
    if (this.modal) {
      this.updateModalContent();
      this.modal.classList.add('show');
      this.switchSection('profile'); // Always start with profile section
      
      // Focus management for accessibility
      const firstFocusable = this.modal.querySelector('.profile-nav-item');
      if (firstFocusable) {
        firstFocusable.focus();
      }
      
      document.body.style.overflow = 'hidden';
    }
  }

  // Close the profile modal
  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('show');
      document.body.style.overflow = '';
      this.modal = null;
    }
  }

  // Check if modal is open
  isModalOpen() {
    return this.modal && this.modal.classList.contains('show');
  }

  // Switch between modal sections
  switchSection(section) {
    // Update navigation
    const navItems = document.querySelectorAll('.profile-nav-item[data-section]');
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Update content
    const sections = document.querySelectorAll('.profile-section');
    sections.forEach(sectionEl => {
      const sectionId = sectionEl.id.replace('-content-section', '');
      sectionEl.classList.toggle('active', sectionId === section);
    });

    this.currentSection = section;
  }

  // Update user initials in button and modal
  async updateUserInitials() {
    try {
      if (!this.userProfile) return;

      const profile = await this.userProfile.getCurrentProfile();
      let initials = 'U';
      
      if (profile && profile.first_name && profile.last_name) {
        initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
      } else if (profile && profile.display_name) {
        const names = profile.display_name.split(' ');
        if (names.length >= 2) {
          initials = `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
        } else {
          initials = profile.display_name.charAt(0).toUpperCase();
        }
      }

      // Update button initials
      const buttonInitials = document.getElementById('user-initials');
      if (buttonInitials) {
        buttonInitials.textContent = initials;
      }

      // Update modal initials
      const modalInitials = document.getElementById('profile-modal-initials');
      if (modalInitials) {
        modalInitials.textContent = initials;
      }

      console.log('👤 User initials updated:', initials);
    } catch (error) {
      console.error('Error updating user initials:', error);
    }
  }

  // Update modal content with user data
  updateModalContent() {
    if (!this.userProfile) return;

    try {
      const profile = this.userProfile.currentProfile;
      
      // Update name and email
      const nameEl = document.getElementById('profile-modal-name');
      const emailEl = document.getElementById('profile-modal-email');
      const firstNameEl = document.getElementById('profile-display-first-name');
      const lastNameEl = document.getElementById('profile-display-last-name');
      const emailDisplayEl = document.getElementById('profile-display-email');

      if (profile) {
        const displayName = profile.display_name || 
                          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
                          'Usuario';
        
        if (nameEl) nameEl.textContent = displayName;
        if (emailEl) emailEl.textContent = profile.email || 'email@ejemplo.com';
        if (firstNameEl) firstNameEl.textContent = profile.first_name || '-';
        if (lastNameEl) lastNameEl.textContent = profile.last_name || '-';
        if (emailDisplayEl) emailDisplayEl.textContent = profile.email || '-';
      }

      // Update theme toggle state
      this.syncThemeToggle();

    } catch (error) {
      console.error('Error updating modal content:', error);
    }
  }

  // Change theme
  changeTheme(theme) {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      // Trigger theme change event for other components
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
      
      console.log('🎨 Theme changed to:', theme);
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  }

  // Public method to refresh user data
  async refresh() {
    await this.updateUserInitials();
    if (this.isModalOpen()) {
      this.updateModalContent();
    }
  }

  // Public method to handle profile updates
  onProfileUpdate() {
    this.refresh();
  }
}