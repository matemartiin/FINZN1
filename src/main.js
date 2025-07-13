import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { ChartManager } from './modules/charts.js';
import { ModalManager } from './modules/modals.js';
import { ChatManager } from './modules/chat.js';
import { ReportManager } from './modules/reports.js';
import { ThemeManager } from './modules/theme.js';
import { NavigationManager } from './modules/navigation.js';

console.log('🔥 MAIN.JS LOADING - Starting FINZN App initialization');

class FinznApp {
  constructor() {
    console.log('🏗️ CONSTRUCTING FINZN APP');
    
    this.auth = new AuthManager();
    this.data = new DataManager();
    this.ui = new UIManager();
    this.charts = new ChartManager();
    this.modals = new ModalManager();
    this.chat = new ChatManager();
    this.reports = new ReportManager();
    this.theme = new ThemeManager();
    this.navigation = new NavigationManager();
    
    this.currentMonth = this.getCurrentMonth();
    this.currentExpenseId = null;
    
    console.log('🔧 ALL MODULES INITIALIZED');
    this.init();
  }

  async init() {
    console.log('🚀 Initializing FINZN App...');
    
    try {
      // Initialize theme first
      this.theme.init();
      
      // Initialize navigation
      this.navigation.init();
      
      // Check if user is already logged in
      await this.auth.initializeAuth();
      const currentUser = this.auth.getCurrentUser();
      console.log('Current user:', currentUser);
      
      if (currentUser) {
        this.showApp();
        await this.loadUserData();
      } else {
        this.showAuth();
      }
      
      this.setupEventListeners();
      console.log('✅ FINZN App initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      this.showAuth();
      this.setupEventListeners();
    }
  }

  setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    try {
      // Auth events
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      const showRegister = document.getElementById('show-register');
      const showLogin = document.getElementById('show-login');
      
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        console.log('✅ Login form listener added');
      }
      
      if (registerForm) {
        registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        console.log('✅ Register form listener added');
      }
      
      if (showRegister) {
        showRegister.addEventListener('click', () => this.showRegister());
        console.log('✅ Show register button listener added');
      }
      
      if (showLogin) {
        showLogin.addEventListener('click', () => this.showLogin());
        console.log('✅ Show login button listener added');
      }
      
      // Logout event
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.handleLogout());
        console.log('✅ Logout button listener added');
      }

      console.log('✅ All event listeners set up successfully');
    } catch (error) {
      console.error('❌ Error setting up event listeners:', error);
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Handling login...');
    
    const username = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;

    if (!username || !password) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }

    try {
      const success = await this.auth.login(username, password);
      if (success) {
        this.showApp();
        await this.loadUserData();
        this.ui.showAlert('¡Bienvenido de vuelta!', 'success');
      } else {
        this.ui.showAlert('Credenciales incorrectas', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.ui.showAlert('Error al iniciar sesión', 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    console.log('📝 Handling registration...');
    
    const username = document.getElementById('register-user').value;
    const password = document.getElementById('register-pass').value;

    if (!username || !password) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }

    if (password.length < 6) {
      this.ui.showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
      this.ui.showAlert('Por favor ingresa un email válido', 'error');
      return;
    }

    try {
      const success = await this.auth.register(username, password);
      if (success) {
        this.showLogin();
        this.ui.showAlert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.', 'success');
      } else {
        this.ui.showAlert('Error al crear la cuenta. Intenta con otro email.', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      this.ui.showAlert(error.message || 'Error al registrar usuario', 'error');
    }
  }

  handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.ui.showAlert('Cerrando sesión...', 'info');
      setTimeout(() => {
        this.auth.logout();
      }, 1000);
    }
  }

  showAuth() {
    console.log('👤 Showing auth screen');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  showApp() {
    console.log('🏠 Showing main app');
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    const currentUser = this.auth.getCurrentUser();
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = `👤 ${currentUser}`;
    }
  }

  showLogin() {
    console.log('🔐 Showing login form');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
  }

  showRegister() {
    console.log('📝 Showing register form');
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.remove('hidden');
  }

  async loadUserData() {
    console.log('📊 Loading user data...');
    await this.data.loadUserData();
    this.updateUI();
  }

  updateUI() {
    console.log('🔄 Updating UI...');
    // Basic UI update for now
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌟 DOM LOADED - Creating FINZN App instance');
  window.app = new FinznApp();
});

console.log('✅ MAIN.JS LOADED SUCCESSFULLY');