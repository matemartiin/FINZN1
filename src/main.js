import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { NavigationManager } from './modules/navigation.js';
import { ModalManager } from './modules/modals.js';
import { ThemeManager } from './modules/theme.js';
import { ChartManager } from './modules/charts.js';
import { CalendarManager } from './modules/calendar.js';
import { ReportManager } from './modules/reports.js';
import { UserProfileManager } from './modules/user-profile.js';
import { BudgetManager } from './modules/budget.js';
import { ContextualBarManager } from './modules/contextual-bar.js';
import { AIBudgetManager } from './modules/ai-budget.js';
import { ChatManager } from './modules/chat.js';

class FinznApp {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Initialize managers
    this.auth = new AuthManager();
    this.data = new DataManager();
    this.ui = new UIManager();
    this.navigation = new NavigationManager();
    this.modals = new ModalManager();
    this.theme = new ThemeManager();
    this.charts = new ChartManager();
    this.calendar = new CalendarManager();
    this.reports = new ReportManager();
    this.userProfile = new UserProfileManager();
    this.budget = new BudgetManager();
    this.contextualBar = new ContextualBarManager();
    this.aiBudget = new AIBudgetManager();
    this.chat = new ChatManager();
  }

  async init() {
    // Prevent multiple initializations
    if (this.isInitialized) {
      console.log('⚠️ App already initialized');
      return;
    }

    if (this.initializationPromise) {
      console.log('⏳ App initialization in progress, waiting...');
      return await this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    return await this.initializationPromise;
  }

  async _performInitialization() {
    try {
      console.log('🚀 Initializing FINZN App...');
      
      // Show loading screen
      this.showLoadingScreen();

      // Initialize core managers first
      console.log('🔧 Initializing core managers...');
      
      // Theme should be initialized first for proper styling
      this.theme.init();
      
      // Initialize modals early for authentication
      this.modals.init();
      
      // Initialize authentication
      await this.auth.initializeAuth();
      
      // Check if user is authenticated
      if (!this.auth.isAuthenticated()) {
        console.log('🔐 User not authenticated, showing login');
        this.hideLoadingScreen();
        this.showAuthenticationFlow();
        return;
      }

      console.log('✅ User authenticated, continuing initialization...');

      // Initialize user profile
      await this.userProfile.init();
      
      // Check if profile is complete
      if (!this.userProfile.hasCompleteProfile()) {
        console.log('👤 Profile incomplete, showing completion modal');
        this.hideLoadingScreen();
        this.userProfile.showCompleteProfileModal();
        return;
      }

      // Initialize remaining managers
      console.log('🔧 Initializing remaining managers...');
      
      this.navigation.init();
      this.ui.init();
      this.contextualBar.init();
      this.calendar.init();
      this.chat.init();

      // Load user data
      console.log('📊 Loading user data...');
      await this.data.loadUserData();
      await this.budget.loadBudgets();

      // Initialize UI with data
      console.log('🎨 Updating UI with data...');
      this.ui.updateBalance();
      this.ui.updateExpensesList();
      this.ui.updateGoalsList();
      this.ui.updateCategoriesList();
      this.ui.updateSpendingLimitsList();

      // Setup event listeners
      this.setupEventListeners();

      // Hide loading screen
      this.hideLoadingScreen();

      this.isInitialized = true;
      console.log('✅ FINZN App initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing app:', error);
      this.hideLoadingScreen();
      this.showError('Error al inicializar la aplicación. Por favor, recarga la página.');
    }
  }

  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'flex';
    }
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }

  showAuthenticationFlow() {
    // Show login modal
    this.modals.show('login-modal');
  }

  showError(message) {
    if (this.ui && this.ui.showAlert) {
      this.ui.showAlert(message, 'error');
    } else {
      alert(message);
    }
  }

  setupEventListeners() {
    // Authentication events
    this.setupAuthEvents();
    
    // Dashboard events
    this.setupDashboardEvents();
    
    // Transaction events
    this.setupTransactionEvents();
    
    // Budget events
    this.setupBudgetEvents();
    
    // Goal events
    this.setupGoalEvents();
    
    // Settings events
    this.setupSettingsEvents();
    
    // Report events
    this.setupReportEvents();
    
    // Theme events
    this.setupThemeEvents();
    
    // User menu events
    this.setupUserMenuEvents();
  }

  setupAuthEvents() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin(e);
      });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegister(e);
      });
    }

    // Show register modal
    const showRegisterBtn = document.getElementById('show-register-btn');
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', () => {
        this.modals.hide('login-modal');
        this.modals.show('register-modal');
      });
    }

    // Show login modal
    const showLoginBtn = document.getElementById('show-login-btn');
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => {
        this.modals.hide('register-modal');
        this.modals.show('login-modal');
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await this.handleLogout();
      });
    }
  }

  setupDashboardEvents() {
    // Quick action buttons
    const addExpenseBtn = document.getElementById('add-expense-btn');
    if (addExpenseBtn) {
      addExpenseBtn.addEventListener('click', () => {
        this.ui.showAddExpenseModal();
      });
    }

    const addIncomeBtn = document.getElementById('add-income-btn');
    if (addIncomeBtn) {
      addIncomeBtn.addEventListener('click', () => {
        this.modals.show('add-fixed-income-modal');
      });
    }

    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
      addGoalBtn.addEventListener('click', () => {
        this.modals.show('add-goal-modal');
      });
    }

    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', () => {
        this.navigation.showSection('reports');
      });
    }
  }

  setupTransactionEvents() {
    // Add expense (from transactions tab)
    const addExpenseTabBtn = document.getElementById('add-expense-tab-btn');
    if (addExpenseTabBtn) {
      addExpenseTabBtn.addEventListener('click', () => {
        this.ui.showAddExpenseModal();
      });
    }

    // Add fixed income
    const addFixedIncomeBtn = document.getElementById('add-fixed-income-btn');
    if (addFixedIncomeBtn) {
      addFixedIncomeBtn.addEventListener('click', () => {
        this.modals.show('add-fixed-income-modal');
      });
    }

    // Add extra income
    const addExtraIncomeBtn = document.getElementById('add-extra-income-btn');
    if (addExtraIncomeBtn) {
      addExtraIncomeBtn.addEventListener('click', () => {
        this.modals.show('add-extra-income-modal');
      });
    }

    // Import/Export events
    this.setupImportExportEvents();
  }

  setupImportExportEvents() {
    // Import buttons
    const importFinznBtn = document.getElementById('import-finzn-btn');
    if (importFinznBtn) {
      importFinznBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('import-finzn-file');
        if (fileInput && fileInput.files.length > 0) {
          this.handleImport(fileInput.files[0], 'finzn');
        } else {
          this.ui.showAlert('Por favor selecciona un archivo CSV', 'warning');
        }
      });
    }

    const importBankBtn = document.getElementById('import-bank-btn');
    if (importBankBtn) {
      importBankBtn.addEventListener('click', () => {
        const fileInput = document.getElementById('import-bank-file');
        if (fileInput && fileInput.files.length > 0) {
          this.handleImport(fileInput.files[0], 'bank');
        } else {
          this.ui.showAlert('Por favor selecciona un archivo CSV', 'warning');
        }
      });
    }

    // Export buttons
    const exportCompleteBtn = document.getElementById('export-complete-btn');
    if (exportCompleteBtn) {
      exportCompleteBtn.addEventListener('click', () => {
        this.handleExport('complete');
      });
    }

    const exportExpensesBtn = document.getElementById('export-expenses-btn');
    if (exportExpensesBtn) {
      exportExpensesBtn.addEventListener('click', () => {
        this.handleExport('expenses');
      });
    }

    const exportIncomesBtn = document.getElementById('export-incomes-btn');
    if (exportIncomesBtn) {
      exportIncomesBtn.addEventListener('click', () => {
        this.handleExport('incomes');
      });
    }
  }

  setupBudgetEvents() {
    // Add budget
    const addBudgetBtn = document.getElementById('add-budget-btn');
    if (addBudgetBtn) {
      addBudgetBtn.addEventListener('click', () => {
        this.ui.showAddBudgetModal();
      });
    }

    // AI budget analysis
    const aiBudgetAnalysisBtn = document.getElementById('ai-budget-analysis-btn');
    if (aiBudgetAnalysisBtn) {
      aiBudgetAnalysisBtn.addEventListener('click', async () => {
        await this.handleAIBudgetAnalysis();
      });
    }
  }

  setupGoalEvents() {
    // Add goal (from goals section)
    const addGoalHeaderBtn = document.getElementById('add-goal-header-btn');
    if (addGoalHeaderBtn) {
      addGoalHeaderBtn.addEventListener('click', () => {
        this.modals.show('add-goal-modal');
      });
    }
  }

  setupSettingsEvents() {
    // Add category
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
      addCategoryBtn.addEventListener('click', () => {
        this.modals.show('add-category-modal');
      });
    }

    // Add spending limit
    const addLimitBtn = document.getElementById('add-limit-btn');
    if (addLimitBtn) {
      addLimitBtn.addEventListener('click', () => {
        this.ui.showAddSpendingLimitModal();
      });
    }

    // Preferences
    const themePreference = document.getElementById('theme-preference');
    if (themePreference) {
      themePreference.addEventListener('change', (e) => {
        if (e.target.value !== 'auto') {
          this.theme.setTheme(e.target.value);
        }
      });
    }
  }

  setupReportEvents() {
    // Generate AI report
    const generateAIReportBtn = document.getElementById('generate-ai-report-btn');
    if (generateAIReportBtn) {
      generateAIReportBtn.addEventListener('click', async () => {
        await this.handleGenerateAIReport();
      });
    }

    // Download report
    const downloadReportBtn = document.getElementById('download-report-btn');
    if (downloadReportBtn) {
      downloadReportBtn.addEventListener('click', async () => {
        await this.handleDownloadReport();
      });
    }
  }

  setupThemeEvents() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.theme.toggle();
      });
    }
  }

  setupUserMenuEvents() {
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');

    if (userMenuBtn && userMenuDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenuDropdown.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', () => {
        userMenuDropdown.classList.remove('active');
      });
    }
  }

  // Event Handlers

  async handleLogin(e) {
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    if (!email || !password) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }

    try {
      this.ui.showAlert('Iniciando sesión...', 'info');
      
      const success = await this.auth.login(email, password);
      
      if (success) {
        this.modals.hide('login-modal');
        this.ui.showAlert('¡Bienvenido a FINZN!', 'success');
        
        // Reinitialize app for authenticated user
        this.isInitialized = false;
        this.initializationPromise = null;
        await this.init();
      }
    } catch (error) {
      console.error('Login error:', error);
      this.ui.showAlert(error.message || 'Error al iniciar sesión', 'error');
    }
  }

  async handleRegister(e) {
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (!email || !password || !confirmPassword) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.ui.showAlert('Las contraseñas no coinciden', 'error');
      return;
    }

    if (password.length < 6) {
      this.ui.showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      this.ui.showAlert('Creando cuenta...', 'info');
      
      const result = await this.auth.register(email, password);
      
      if (result.success) {
        this.modals.hide('register-modal');
        
        if (result.needsConfirmation) {
          this.ui.showAlert('Cuenta creada. Revisa tu email para confirmar.', 'success');
          this.modals.show('login-modal');
        } else {
          this.ui.showAlert('¡Cuenta creada exitosamente!', 'success');
          
          // Reinitialize app for new user
          this.isInitialized = false;
          this.initializationPromise = null;
          await this.init();
        }
      }
    } catch (error) {
      console.error('Register error:', error);
      this.ui.showAlert(error.message || 'Error al crear la cuenta', 'error');
    }
  }

  async handleLogout() {
    try {
      await this.auth.logout();
      this.ui.showAlert('Sesión cerrada exitosamente', 'success');
      
      // Reset app state
      this.isInitialized = false;
      this.initializationPromise = null;
      
      // Show authentication flow
      setTimeout(() => {
        this.showAuthenticationFlow();
      }, 1000);
      
    } catch (error) {
      console.error('Logout error:', error);
      this.ui.showAlert('Error al cerrar sesión', 'error');
    }
  }

  async handleImport(file, type) {
    if (!file) {
      this.ui.showAlert('No se seleccionó ningún archivo', 'error');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.ui.showAlert('Por favor selecciona un archivo CSV válido', 'error');
      return;
    }

    try {
      this.ui.showAlert('Importando datos...', 'info');
      
      const result = await this.data.importDataFromCSV(file, type);
      
      if (result.imported > 0) {
        this.ui.showAlert(
          `Importación exitosa: ${result.imported} registros importados${result.errors > 0 ? `, ${result.errors} errores` : ''}`,
          'success'
        );
        
        // Refresh data
        await this.data.loadUserData();
        this.ui.updateBalance();
        this.ui.updateExpensesList();
      } else {
        this.ui.showAlert('No se importaron datos. Verifica el formato del archivo.', 'warning');
      }
      
    } catch (error) {
      console.error('Import error:', error);
      this.ui.showAlert(error.message || 'Error al importar datos', 'error');
    }
  }

  handleExport(type) {
    try {
      const success = this.data.exportDataToCSV(type);
      
      if (success) {
        this.ui.showAlert('Datos exportados exitosamente', 'success');
      } else {
        this.ui.showAlert('Error al exportar datos', 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      this.ui.showAlert('Error al exportar datos', 'error');
    }
  }

  async handleAIBudgetAnalysis() {
    try {
      this.ui.showAlert('Generando análisis IA...', 'info');
      
      const recommendations = await this.aiBudget.generateAllRecommendations();
      
      if (recommendations.error) {
        this.ui.showAlert(recommendations.message, 'warning');
        
        // Show requirements if data is insufficient
        if (recommendations.requirements) {
          let message = 'Para generar análisis IA necesitas:\n';
          recommendations.issues.forEach(issue => {
            message += `• ${issue}\n`;
          });
          this.ui.showAlert(message, 'info');
        }
        return;
      }
      
      // Show recommendations in a modal or navigate to reports
      this.ui.showAlert('Análisis IA generado exitosamente', 'success');
      this.navigation.showSection('reports');
      
      // You could also display the recommendations in a dedicated modal
      
    } catch (error) {
      console.error('AI Budget Analysis error:', error);
      this.ui.showAlert('Error al generar análisis IA', 'error');
    }
  }

  async handleGenerateAIReport() {
    const period = document.getElementById('report-period')?.value || 'current';
    const focus = document.getElementById('report-focus')?.value || 'general';
    const questions = document.getElementById('report-questions')?.value || '';

    try {
      this.ui.showAlert('Generando reporte IA...', 'info');
      
      // Prepare data for report
      const reportData = await this.prepareReportData(period);
      
      // Generate AI report
      const reportContent = await this.reports.generateAIReport(reportData, focus, questions);
      
      // Display report
      const reportContainer = document.getElementById('report-content');
      if (reportContainer) {
        reportContainer.innerHTML = reportContent;
        
        // Enable download button
        const downloadBtn = document.getElementById('download-report-btn');
        if (downloadBtn) {
          downloadBtn.disabled = false;
        }
      }
      
      this.ui.showAlert('Reporte generado exitosamente', 'success');
      
    } catch (error) {
      console.error('Generate AI Report error:', error);
      this.ui.showAlert('Error al generar reporte', 'error');
    }
  }

  async handleDownloadReport() {
    const reportContent = document.getElementById('report-content')?.innerHTML;
    
    if (!reportContent || reportContent.includes('report-placeholder')) {
      this.ui.showAlert('Primero genera un reporte', 'warning');
      return;
    }

    try {
      const period = document.getElementById('report-period')?.value || 'current';
      const reportData = await this.prepareReportData(period);
      
      const success = await this.reports.generatePDF(reportContent, reportData);
      
      if (success) {
        this.ui.showAlert('Reporte descargado exitosamente', 'success');
      } else {
        this.ui.showAlert('Reporte guardado como HTML', 'info');
      }
      
    } catch (error) {
      console.error('Download Report error:', error);
      this.ui.showAlert('Error al descargar reporte', 'error');
    }
  }

  async prepareReportData(period) {
    const currentMonth = this.data.getCurrentMonth();
    let months = 1;
    let startMonth = currentMonth;

    // Calculate period
    if (period === 'last3') {
      months = 3;
    } else if (period === 'last6') {
      months = 6;
    } else if (period === 'year') {
      months = 12;
    }

    // Get data for the period
    const balance = this.data.calculateBalance(currentMonth);
    const categories = this.data.getExpensesByCategory(currentMonth);
    const goals = this.data.getGoals();
    const spendingLimits = this.data.getSpendingLimits();

    return {
      period,
      months,
      totalIncome: balance.totalIncome,
      totalExpenses: balance.totalExpenses,
      categories,
      goals,
      spendingLimits
    };
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🌟 DOM loaded, initializing FINZN...');
  
  try {
    window.app = new FinznApp();
    await window.app.init();
  } catch (error) {
    console.error('❌ Failed to initialize FINZN:', error);
    
    // Show error message to user
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.innerHTML = `
      <h3>Error al cargar FINZN</h3>
      <p>Hubo un problema al inicializar la aplicación. Por favor, recarga la página.</p>
      <button onclick="window.location.reload()" class="btn btn-primary">Recargar</button>
    `;
    
    document.body.appendChild(errorMessage);
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
  
  if (window.app && window.app.ui && window.app.ui.showAlert) {
    window.app.ui.showAlert('Error inesperado en la aplicación', 'error');
  }
  
  // Prevent the default browser behavior
  event.preventDefault();
});

// Handle general errors
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
  
  if (window.app && window.app.ui && window.app.ui.showAlert) {
    window.app.ui.showAlert('Error en la aplicación', 'error');
  }
});

// Export for debugging
if (typeof window !== 'undefined') {
  window.FinznApp = FinznApp;
}