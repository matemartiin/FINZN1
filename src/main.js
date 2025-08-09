import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { ChartManager } from './modules/charts.js';
import { ModalManager } from './modules/modals.js';
import { NavigationManager } from './modules/navigation.js';
import { ThemeManager } from './modules/theme.js';
import { ChatManager } from './modules/chat.js';
import { ReportManager } from './modules/reports.js';
import { CalendarManager } from './modules/calendar.js';
import { BudgetManager } from './modules/budget.js';
import { AIBudgetManager } from './modules/ai-budget.js';
import { UserProfileManager } from './modules/user-profile.js';
import { ContextualBarManager } from './modules/contextual-bar.js';

class FinznApp {
  constructor() {
    this.auth = new AuthManager();
    this.data = new DataManager();
    this.ui = new UIManager();
    this.charts = new ChartManager();
    this.modals = new ModalManager();
    this.navigation = new NavigationManager();
    this.theme = new ThemeManager();
    this.chat = new ChatManager();
    this.reports = new ReportManager();
    this.calendar = new CalendarManager();
    this.budget = new BudgetManager();
    this.aiBudget = new AIBudgetManager();
    this.userProfile = new UserProfileManager();
    this.contextualBar = new ContextualBarManager();
  }

  async init() {
    console.log('🚀 Initializing FINZN App...');
    
    try {
      // Initialize theme first for better UX
      this.theme.init();
      
      // Initialize core managers
      this.modals.init();
      this.navigation.init();
      
      // Initialize auth and wait for it
      await this.auth.initializeAuth();
      
      // Check if user is authenticated
      if (this.auth.isAuthenticated()) {
        console.log('✅ User is authenticated, initializing app...');
        await this.initializeAuthenticatedApp();
      } else {
        console.log('❌ User not authenticated, showing login...');
        this.showLoginScreen();
      }
      
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      this.handleInitializationError(error);
    }
  }

  async initializeAuthenticatedApp() {
    try {
      // Initialize user profile first
      await this.userProfile.init();
      
      // Load user data
      await this.data.loadUserData();
      
      // Initialize UI components
      this.ui.init();
      this.contextualBar.init();
      this.chat.init();
      this.calendar.init();
      
      // Initialize budget managers
      await this.budget.loadBudgets();
      
      // Show main app
      this.showMainApp();
      
      console.log('✅ FINZN App initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing authenticated app:', error);
      this.ui.showAlert('Error al cargar la aplicación', 'error');
    }
  }

  showLoginScreen() {
    // Hide main app sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show login section
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.classList.add('active');
    }
    
    // Hide header and navigation
    const header = document.querySelector('.header');
    const sidebar = document.querySelector('.sidebar-nav');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (header) header.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    if (mobileNav) mobileNav.style.display = 'none';
  }

  showMainApp() {
    // Show header and navigation
    const header = document.querySelector('.header');
    const sidebar = document.querySelector('.sidebar-nav');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (header) header.style.display = 'flex';
    if (sidebar) sidebar.style.display = 'flex';
    if (mobileNav) mobileNav.style.display = 'flex';
    
    // Hide login section
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.classList.remove('active');
    }
    
    // Show dashboard by default
    this.navigation.showSection('dashboard');
  }

  handleInitializationError(error) {
    console.error('Initialization error:', error);
    
    // Show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.className = 'initialization-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h2>Error al inicializar FINZN</h2>
        <p>Hubo un problema al cargar la aplicación. Por favor, recarga la página.</p>
        <button onclick="window.location.reload()" class="btn btn-primary">
          Recargar Página
        </button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    window.app = new FinznApp();
    await window.app.init();
  } catch (error) {
    console.error('❌ Failed to initialize FINZN:', error);
  }
});

// Handle authentication state changes
window.addEventListener('authStateChanged', async (event) => {
  const { user } = event.detail;
  
  if (user) {
    console.log('🔐 User signed in, initializing app...');
    await window.app.initializeAuthenticatedApp();
  } else {
    console.log('🔐 User signed out, showing login...');
    window.app.showLoginScreen();
  }
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});