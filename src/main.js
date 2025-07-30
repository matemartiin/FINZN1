import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { ModalManager } from './modules/modals.js';
import { NavigationManager } from './modules/navigation.js';
import { ChartManager } from './modules/charts.js';
import { ThemeManager } from './modules/theme.js';
import { ChatManager } from './modules/chat.js';
import { CalendarManager } from './modules/calendar.js';
import { ReportManager } from './modules/reports.js';
import { ContactsManager } from './modules/contacts.js';
import { MascotManager } from './modules/mascot.js';

class FinznApp {
  constructor() {
    console.log('🚀 Initializing FINZN App...');
    
    // Initialize managers
    this.auth = new AuthManager();
    this.data = new DataManager();
    this.ui = new UIManager();
    this.modals = new ModalManager();
    this.navigation = new NavigationManager();
    this.charts = new ChartManager();
    this.theme = new ThemeManager();
    this.chat = new ChatManager();
    this.calendar = new CalendarManager();
    this.reports = new ReportManager();
    this.contacts = new ContactsManager();
    this.mascot = new MascotManager();
    
    this.currentMonth = this.getCurrentMonth();
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('🔧 Starting app initialization...');
      
      // Initialize theme first
      this.theme.init();
      
      // Initialize modals
      this.modals.init();
      
      // Wait for auth to initialize
      await this.auth.initializeAuth();
      
      // Check if user is authenticated
      if (this.auth.isAuthenticated()) {
        console.log('✅ User is authenticated, loading main app');
        await this.loadMainApp();
      } else {
        console.log('🔐 User not authenticated, showing login');
        this.showLogin();
      }
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ FINZN App initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      this.ui.showAlert('Error al inicializar la aplicación. Recarga la página.', 'error');
    }
  }

  async loadMainApp() {
    try {
      console.log('📊 Loading main application...');
      
      // Hide auth containers and show main app
      this.hideAuthContainers();
      this.showMainApp();
      
      // Update user info
      this.updateUserInfo();
      
      // Load user data
      await this.data.loadUserData();
      
      // Initialize other managers
      this.navigation.init();
      this.chat.init();
      this.contacts.init();
      this.mascot.init();
      
      // Load current month data
      await this.loadCurrentMonthData();
      
      // Initialize month selector
      this.initializeMonthSelector();
      
      console.log('✅ Main app loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading main app:', error);
      this.ui.showAlert('Error al cargar la aplicación', 'error');
    }
  }

  showLogin() {
    console.log('🔐 Showing login interface');
    
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const appContainer = document.getElementById('app');
    
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (registerContainer) registerContainer.classList.add('hidden');
    if (appContainer) appContainer.classList.add('hidden');
  }

  hideAuthContainers() {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    
    if (loginContainer) loginContainer.classList.add('hidden');
    if (registerContainer) registerContainer.classList.add('hidden');
  }

  showMainApp() {
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.classList.remove('hidden');
    }
  }

  updateUserInfo() {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      const userEmail = this.auth.getCurrentUser();
      userNameElement.textContent = userEmail || 'Usuario';
    }
  }

  setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Auth form listeners
    this.setupAuthListeners();
    
    // Main app listeners
    this.setupMainAppListeners();
    
    // Modal listeners
    this.setupModalListeners();
    
    // Dashboard interactions
    this.setupDashboardListeners();
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.theme.toggle());
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
    
    // Month selector
    const monthSelect = document.getElementById('month-select');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => this.handleMonthChange(e.target.value));
    }
  }

  setupAuthListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }
    
    // Show register
    const showRegisterBtn = document.getElementById('show-register');
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', () => this.showRegister());
    }
    
    // Show login
    const showLoginBtn = document.getElementById('show-login');
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => this.showLogin());
    }
    
    // Generate test email
    const generateTestEmailBtn = document.getElementById('generate-test-email');
    if (generateTestEmailBtn) {
      generateTestEmailBtn.addEventListener('click', () => this.generateTestEmail());
    }
  }

  setupMainAppListeners() {
    // Dashboard buttons
    const addExpenseBtns = document.querySelectorAll('#add-expense-btn, #add-expense-btn-dashboard');
    addExpenseBtns.forEach(btn => {
      btn.addEventListener('click', () => this.showAddExpenseModal());
    });
    
    const addIncomeBtns = document.querySelectorAll('#add-income-btn-dashboard, #add-income-btn-transactions');
    addIncomeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.showAddIncomeModal());
    });
    
    const addSpendingLimitBtns = document.querySelectorAll('#add-spending-limit-btn-expenses, #add-spending-limit-btn-card');
    addSpendingLimitBtns.forEach(btn => {
      btn.addEventListener('click', () => this.showAddSpendingLimitModal());
    });
    
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
      addGoalBtn.addEventListener('click', () => this.showAddGoalModal());
    }
    
    // Settings buttons
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    if (manageCategoriesBtn) {
      manageCategoriesBtn.addEventListener('click', () => this.showManageCategoriesModal());
    }
    
    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => this.exportData());
    }
    
    const importDataBtn = document.getElementById('import-data-btn');
    if (importDataBtn) {
      importDataBtn.addEventListener('click', () => this.showImportDataModal());
    }
  }

  setupDashboardListeners() {
    // Balance detail button
    const balanceDetailBtn = document.querySelector('.balance-card .btn');
    if (balanceDetailBtn) {
      balanceDetailBtn.addEventListener('click', () => this.showBalanceDetail());
    }

    // Toggle expenses chart
    const toggleChartBtn = document.getElementById('toggle-expenses-chart');
    if (toggleChartBtn) {
      toggleChartBtn.addEventListener('click', () => this.toggleExpensesChart());
    }
    
    // Income indicator click
    const incomesIndicator = document.getElementById('incomes-indicator');
    if (incomesIndicator) {
      incomesIndicator.addEventListener('click', () => this.showViewIncomesModal());
    }
    
    // Installments button click
    const installmentsBtn = document.getElementById('installments-btn');
    if (installmentsBtn) {
      installmentsBtn.addEventListener('click', () => this.showInstallmentsModal());
    }
    
    // AI Report buttons
    const generateAIReportBtns = document.querySelectorAll('#generate-ai-report-btn-reports, #generate-quick-report');
    generateAIReportBtns.forEach(btn => {
      btn.addEventListener('click', () => this.showGenerateAIReportModal());
    });
    
    // Calendar buttons
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => this.showAddEventModal());
    }
    
    const calendarSettingsBtn = document.getElementById('calendar-settings-btn');
    if (calendarSettingsBtn) {
      calendarSettingsBtn.addEventListener('click', () => this.showCalendarSettingsModal());
    }

    // Contact management
    const addContactBtn = document.getElementById('add-contact-btn');
    if (addContactBtn) {
      addContactBtn.addEventListener('click', () => this.showAddContactModal());
    }
  }

  setupModalListeners() {
    // Add expense form
    const addExpenseForm = document.getElementById('add-expense-form');
    if (addExpenseForm) {
      addExpenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));
    }
    
    // Add income form
    const addIncomeForm = document.getElementById('add-income-form');
    if (addIncomeForm) {
      addIncomeForm.addEventListener('submit', (e) => this.handleAddIncome(e));
    }
    
    // Add spending limit form
    const addSpendingLimitForm = document.getElementById('add-spending-limit-form');
    if (addSpendingLimitForm) {
      addSpendingLimitForm.addEventListener('submit', (e) => this.handleAddSpendingLimit(e));
    }
    
    // Add goal form
    const addGoalForm = document.getElementById('add-goal-form');
    if (addGoalForm) {
      addGoalForm.addEventListener('submit', (e) => this.handleAddGoal(e));
    }
    
    // Add category form
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
      addCategoryForm.addEventListener('submit', (e) => this.handleAddCategory(e));
    }
    
    // Import data
    const processImportBtn = document.getElementById('process-import-btn');
    if (processImportBtn) {
      processImportBtn.addEventListener('click', () => this.handleImportData());
    }
    
    // Generate AI report
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', () => this.handleGenerateAIReport());
    }
    
    // Add calendar event form
    const addEventForm = document.getElementById('add-event-form');
    if (addEventForm) {
      addEventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
    }
    
    // Contact management
    const addContactForm = document.getElementById('add-contact-form');
    const editContactForm = document.getElementById('edit-contact-form');
    
    if (addContactForm) {
      addContactForm.addEventListener('submit', (e) => this.handleAddContact(e));
    }
    
    if (editContactForm) {
      editContactForm.addEventListener('submit', (e) => this.handleEditContact(e));
    }
    
    // Installments checkbox
    const installmentsCheckbox = document.getElementById('expense-installments');
    if (installmentsCheckbox) {
      installmentsCheckbox.addEventListener('change', (e) => {
        const installmentsGroup = document.getElementById('installments-group');
        if (installmentsGroup) {
          installmentsGroup.classList.toggle('hidden', !e.target.checked);
        }
      });
    }
    
    // Income type change
    const incomeTypeSelect = document.getElementById('income-type');
    if (incomeTypeSelect) {
      incomeTypeSelect.addEventListener('change', (e) => {
        const extraIncomeGroup = document.getElementById('extra-income-group');
        if (extraIncomeGroup) {
          extraIncomeGroup.classList.toggle('hidden', e.target.value === 'fixed');
        }
      });
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;
    const errorElement = document.getElementById('login-error');
    
    if (!email || !password) {
      this.showError(errorElement, 'Por favor completa todos los campos');
      return;
    }
    
    try {
      console.log('🔐 Attempting login...');
      this.showError(errorElement, ''); // Clear previous errors
      
      const success = await this.auth.login(email, password);
      
      if (success) {
        console.log('✅ Login successful');
        await this.loadMainApp();
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      this.showError(errorElement, error.message || 'Error al iniciar sesión');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-user').value.trim();
    const password = document.getElementById('register-pass').value;
    const errorElement = document.getElementById('register-error');
    
    if (!email || !password) {
      this.showError(errorElement, 'Por favor completa todos los campos');
      return;
    }
    
    if (password.length < 6) {
      this.showError(errorElement, 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      console.log('📝 Attempting registration...');
      this.showError(errorElement, ''); // Clear previous errors
      
      const result = await this.auth.register(email, password);
      
      if (result.success) {
        if (result.needsConfirmation) {
          this.ui.showAlert('Registro exitoso. Revisa tu email para confirmar tu cuenta.', 'success');
          this.showLogin();
        } else {
          console.log('✅ Registration successful, logging in...');
          await this.loadMainApp();
        }
      }
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      this.showError(errorElement, error.message || 'Error al registrarse');
    }
  }

  showError(errorElement, message) {
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = message ? 'block' : 'none';
    }
  }

  showRegister() {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    
    if (loginContainer) loginContainer.classList.add('hidden');
    if (registerContainer) registerContainer.classList.remove('hidden');
  }

  generateTestEmail() {
    const emailInput = document.getElementById('register-user');
    if (emailInput) {
      emailInput.value = this.auth.generateTestEmail();
    }
  }

  async handleLogout() {
    try {
      console.log('👋 Logging out...');
      await this.auth.logout();
      this.showLogin();
      
      // Clear any cached data
      this.data = new DataManager();
      
      this.ui.showAlert('Sesión cerrada correctamente', 'success');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      this.ui.showAlert('Error al cerrar sesión', 'error');
    }
  }

  // Month management
  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  initializeMonthSelector() {
    const monthSelect = document.getElementById('month-select');
    if (!monthSelect) return;
    
    monthSelect.innerHTML = '';
    
    const currentDate = new Date();
    const months = [];
    
    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      months.push({ key: monthKey, name: monthName });
    }
    
    months.forEach(month => {
      const option = document.createElement('option');
      option.value = month.key;
      option.textContent = month.name.charAt(0).toUpperCase() + month.name.slice(1);
      if (month.key === this.currentMonth) {
        option.selected = true;
      }
      monthSelect.appendChild(option);
    });
  }

  async handleMonthChange(selectedMonth) {
    console.log('📅 Month changed to:', selectedMonth);
    this.currentMonth = selectedMonth;
    await this.loadCurrentMonthData();
  }

  async loadCurrentMonthData() {
    try {
      console.log('📊 Loading data for month:', this.currentMonth);
      
      // Load month data
      const expenses = await this.data.loadExpenses(this.currentMonth);
      const income = await this.data.loadIncome(this.currentMonth);
      const extraIncomes = await this.data.loadExtraIncomes(this.currentMonth);
      
      // Update UI
      this.updateDashboard();
      
    } catch (error) {
      console.error('❌ Error loading month data:', error);
      this.ui.showAlert('Error al cargar los datos del mes', 'error');
    }
  }

  updateDashboard() {
    console.log('🔄 Updating dashboard...');
    
    // Calculate balance
    const balance = this.data.calculateBalance(this.currentMonth);
    
    // Update UI components
    this.ui.updateBalance(balance);
    this.ui.updateIncomeVsExpensesSummary(balance);
    
    const expenses = this.data.getExpenses(this.currentMonth);
    const income = this.data.getIncome(this.currentMonth);
    const extraIncomes = this.data.getExtraIncomes(this.currentMonth);
    const goals = this.data.getGoals();
    const spendingLimits = this.data.getSpendingLimits();
    const categories = this.data.getCategories();
    
    this.ui.updateExpensesList(expenses, this);
    this.ui.updateGoalsProgress(goals);
    this.ui.updateSpendingLimitsList(spendingLimits, expenses);
    this.ui.updateLimitsAlerts(spendingLimits, expenses);
    this.ui.updateIncomeDetails(income, extraIncomes);
    this.ui.updateInstallmentsList(expenses);
    this.ui.updateTopCategories(expenses);
    this.ui.updateCategoriesSelect(categories, 'expense-category');
    this.ui.updateCategoriesSelect(categories, 'limit-category');
    this.ui.updateCategoriesSelect(categories, 'event-category');
    
    // Update charts
    const categoryData = this.data.getExpensesByCategory(this.currentMonth);
    this.charts.updateExpensesChart(categoryData);
    
    // Update trend chart
    this.updateTrendChart();
    
    // Check spending limits
    this.checkSpendingLimits();
    
    // Check for savings suggestions
    this.checkSavingsSuggestions(balance);
  }

  async updateTrendChart() {
    try {
      const trendData = await this.data.getTrendData();
      this.charts.updateTrendChart(trendData);
    } catch (error) {
      console.error('Error updating trend chart:', error);
    }
  }

  checkSpendingLimits() {
    const alerts = this.data.checkSpendingLimits(this.currentMonth);
    
    alerts.forEach(alert => {
      if (alert.type === 'danger') {
        this.ui.showAlert(`⚠️ Has superado el límite de ${alert.category} (${alert.percentage}%)`, 'error');
        this.mascot.alertSpendingLimit(alert.category, alert.percentage);
      } else if (alert.type === 'warning') {
        this.ui.showAlert(`⚠️ Te acercas al límite de ${alert.category} (${alert.percentage}%)`, 'warning');
        this.mascot.alertSpendingLimit(alert.category, alert.percentage);
      }
    });
  }

  checkSavingsSuggestions(balance) {
    // Suggest savings if user has significant available balance
    if (balance.available > 10000) {
      setTimeout(() => {
        this.mascot.suggestSavings(balance.available);
      }, 3000);
    }
  }

  // Modal methods
  showAddExpenseModal() {
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    this.modals.show('add-expense-modal');
  }

  showAddIncomeModal() {
    this.modals.show('add-income-modal');
  }

  showAddSpendingLimitModal() {
    this.modals.show('add-spending-limit-modal');
  }

  showAddGoalModal() {
    this.modals.show('add-goal-modal');
  }

  showManageCategoriesModal() {
    const categories = this.data.getCategories();
    this.ui.updateCategoriesManagementList(categories);
    this.modals.show('manage-categories-modal');
  }

  showImportDataModal() {
    this.modals.show('import-data-modal');
  }

  showViewIncomesModal() {
    this.modals.show('view-incomes-modal');
  }

  showInstallmentsModal() {
    this.modals.show('view-installments-modal');
  }

  showGenerateAIReportModal() {
    this.modals.show('generate-ai-report-modal');
  }

  showAddEventModal() {
    const dateInput = document.getElementById('event-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    this.modals.show('add-event-modal');
  }

  showCalendarSettingsModal() {
    this.modals.show('calendar-settings-modal');
  }
  
  // Contact management methods
  showAddContactModal() {
    this.contacts.showAddContactModal();
  }
  
  showEditContactModal(contactId) {
    this.contacts.showEditContactModal(contactId);
  }

  // Dashboard methods
  showBalanceDetail() {
    this.navigation.navigateTo('transactions');
  }

  toggleExpensesChart() {
    const container = document.getElementById('expenses-chart-container');
    const toggleBtn = document.getElementById('toggle-expenses-chart');
    
    if (container && toggleBtn) {
      container.classList.toggle('collapsed');
      toggleBtn.textContent = container.classList.contains('collapsed') ? '▶' : '▼';
    }
  }

  // Form handlers
  async handleAddExpense(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-expense-form');
    
    if (!formData.description || !formData.amount || !formData.category || !formData.transactionDate) {
      this.ui.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }
    
    try {
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        transactionDate: formData.transactionDate,
        month: formData.transactionDate.substring(0, 7),
        installment: 1,
        totalInstallments: 1,
        recurring: false
      };
      
      // Handle installments
      if (formData.hasInstallments) {
        const installmentsCount = parseInt(formData.installmentsCount) || 2;
        const monthlyAmount = expenseData.amount / installmentsCount;
        
        expenseData.totalInstallments = installmentsCount;
        expenseData.originalAmount = expenseData.amount;
        expenseData.amount = monthlyAmount;
        
        // Add all installments
        for (let i = 0; i < installmentsCount; i++) {
          const installmentDate = new Date(formData.transactionDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          const installmentData = {
            ...expenseData,
            installment: i + 1,
            transactionDate: installmentDate.toISOString().split('T')[0],
            month: `${installmentDate.getFullYear()}-${(installmentDate.getMonth() + 1).toString().padStart(2, '0')}`
          };
          
          await this.data.addExpense(installmentData);
        }
      } else {
        await this.data.addExpense(expenseData);
      }
      
      this.ui.showAlert('Gasto agregado correctamente', 'success');
      this.modals.hide('add-expense-modal');
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error adding expense:', error);
      this.ui.showAlert('Error al agregar el gasto', 'error');
    }
  }

  async handleAddIncome(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-income-form');
    
    if (!formData.amount || !formData.type) {
      this.ui.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }
    
    try {
      const amount = parseFloat(formData.amount);
      
      if (formData.type === 'fixed') {
        await this.data.addFixedIncome(this.currentMonth, amount);
        this.ui.showAlert('Ingreso fijo agregado correctamente', 'success');
      } else {
        const incomeData = {
          description: formData.description || 'Ingreso extra',
          amount: amount,
          category: formData.category || 'other'
        };
        
        await this.data.addExtraIncome(this.currentMonth, incomeData);
        this.ui.showAlert('Ingreso extra agregado correctamente', 'success');
      }
      
      this.modals.hide('add-income-modal');
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error adding income:', error);
      this.ui.showAlert('Error al agregar el ingreso', 'error');
    }
  }

  async handleAddSpendingLimit(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-spending-limit-form');
    
    if (!formData.category || !formData.amount) {
      this.ui.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }
    
    try {
      const limitData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        warningPercentage: parseInt(formData.warningPercentage) || 80
      };
      
      const success = await this.data.addSpendingLimit(limitData);
      
      if (success) {
        this.ui.showAlert('Límite de gasto agregado correctamente', 'success');
        this.modals.hide('add-spending-limit-modal');
        this.updateDashboard();
      } else {
        this.ui.showAlert('Error al agregar el límite de gasto', 'error');
      }
      
    } catch (error) {
      console.error('Error adding spending limit:', error);
      this.ui.showAlert('Error al agregar el límite de gasto', 'error');
    }
  }

  async handleAddGoal(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-goal-form');
    
    if (!formData.name || !formData.targetAmount) {
      this.ui.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }
    
    try {
      const goalData = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0
      };
      
      const success = await this.data.addGoal(goalData);
      
      if (success) {
        this.ui.showAlert('Objetivo agregado correctamente', 'success');
        this.modals.hide('add-goal-modal');
        this.updateDashboard();
      } else {
        this.ui.showAlert('Error al agregar el objetivo', 'error');
      }
      
    } catch (error) {
      console.error('Error adding goal:', error);
      this.ui.showAlert('Error al agregar el objetivo', 'error');
    }
  }

  async handleAddCategory(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-category-form');
    
    if (!formData.name || !formData.icon) {
      this.ui.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }
    
    try {
      const categoryData = {
        name: formData.name,
        icon: formData.icon,
        color: formData.color || '#B7A6FF'
      };
      
      const success = await this.data.addCategory(categoryData);
      
      if (success) {
        this.ui.showAlert('Categoría agregada correctamente', 'success');
        this.ui.clearForm('add-category-form');
        
        // Update categories list and selects
        const categories = this.data.getCategories();
        this.ui.updateCategoriesManagementList(categories);
        this.ui.updateCategoriesSelect(categories, 'expense-category');
        this.ui.updateCategoriesSelect(categories, 'limit-category');
        this.ui.updateCategoriesSelect(categories, 'event-category');
      } else {
        this.ui.showAlert('Error al agregar la categoría', 'error');
      }
      
    } catch (error) {
      console.error('Error adding category:', error);
      this.ui.showAlert('Error al agregar la categoría', 'error');
    }
  }

  async handleImportData() {
    const fileInput = document.getElementById('import-file');
    const importType = document.querySelector('input[name="import-type"]:checked')?.value || 'auto';
    
    if (!fileInput.files || fileInput.files.length === 0) {
      this.ui.showAlert('Por favor selecciona un archivo CSV', 'error');
      return;
    }
    
    try {
      const file = fileInput.files[0];
      const result = await this.data.importDataFromCSV(file, importType);
      
      this.ui.showAlert(
        `Importación completada: ${result.imported} registros importados${result.errors > 0 ? `, ${result.errors} errores` : ''}`,
        result.errors > 0 ? 'warning' : 'success'
      );
      
      this.modals.hide('import-data-modal');
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error importing data:', error);
      this.ui.showAlert('Error al importar los datos: ' + error.message, 'error');
    }
  }

  async handleGenerateAIReport() {
    const period = document.getElementById('report-period')?.value || 'current';
    const focus = document.getElementById('report-focus')?.value || 'general';
    const questions = document.getElementById('report-questions')?.value || '';
    
    try {
      this.ui.showLoading('generate-report-btn');
      
      // Prepare data for AI report
      const reportData = await this.prepareReportData(period);
      
      // Generate report
      const reportContent = await this.reports.generateAIReport(reportData, focus, questions);
      
      // Show report
      const resultContainer = document.getElementById('ai-report-result');
      const contentContainer = document.getElementById('ai-report-content');
      
      if (resultContainer && contentContainer) {
        contentContainer.innerHTML = reportContent;
        resultContainer.classList.remove('hidden');
      }
      
      // Setup download button
      const downloadBtn = document.getElementById('download-report-btn');
      if (downloadBtn) {
        downloadBtn.onclick = () => this.reports.generatePDF(reportContent, reportData);
      }
      
      this.ui.showAlert('Informe generado correctamente', 'success');
      
    } catch (error) {
      console.error('Error generating AI report:', error);
      this.ui.showAlert('Error al generar el informe', 'error');
    } finally {
      this.ui.hideLoading('generate-report-btn');
    }
  }

  async prepareReportData(period) {
    const months = this.getMonthsForPeriod(period);
    let totalIncome = 0;
    let totalExpenses = 0;
    const categories = {};
    
    for (const month of months) {
      const expenses = await this.data.loadExpenses(month);
      const income = await this.data.loadIncome(month);
      const extraIncomes = await this.data.loadExtraIncomes(month);
      
      totalIncome += income.fixed + income.extra;
      totalIncomes += extraIncomes.reduce((sum, extra) => sum + parseFloat(extra.amount), 0);
      
      expenses.forEach(expense => {
        const amount = parseFloat(expense.amount);
        totalExpenses += amount;
        categories[expense.category] = (categories[expense.category] || 0) + amount;
      });
    }
    
    return {
      period,
      months: months.length,
      totalIncome,
      totalExpenses,
      categories,
      goals: this.data.getGoals(),
      spendingLimits: this.data.getSpendingLimits()
    };
  }

  getMonthsForPeriod(period) {
    const months = [];
    const now = new Date();
    
    let monthsCount = 1;
    if (period === 'last3') monthsCount = 3;
    else if (period === 'last6') monthsCount = 6;
    else if (period === 'year') monthsCount = 12;
    
    for (let i = 0; i < monthsCount; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      months.push(monthKey);
    }
    
    return months;
  }

  async handleAddEvent(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-event-form');
    
    if (!formData.title || !formData.type || !formData.date) {
      this.ui.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }
    
    try {
      const eventData = {
        title: formData.title,
        type: formData.type,
        date: formData.date,
        time: formData.time || '09:00',
        duration: parseInt(formData.duration) || 60,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        description: formData.description || '',
        category: formData.category || '',
        recurring: formData.recurring || false
      };
      
      if (this.calendar) {
        await this.calendar.addEvent(eventData);
        this.ui.showAlert('Evento agregado correctamente', 'success');
        this.modals.hide('add-event-modal');
      } else {
        this.ui.showAlert('Error: Calendario no inicializado', 'error');
      }
      
    } catch (error) {
      console.error('Error adding event:', error);
      this.ui.showAlert('Error al agregar el evento', 'error');
    }
  }

  // Contact form handlers
  async handleAddContact(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-contact-form');
    
    if (!formData.name || !formData.type) {
      this.ui.showAlert('El nombre y tipo son obligatorios', 'error');
      return;
    }
    
    try {
      const success = await this.contacts.addContact(formData);
      
      if (success) {
        this.ui.showAlert('Contacto agregado correctamente', 'success');
        this.modals.hide('add-contact-modal');
        this.mascot.celebrateNewContact();
        this.updateDashboard(); // Refresh dashboard to show new contact
      } else {
        this.ui.showAlert('Error al agregar el contacto', 'error');
      }
      
    } catch (error) {
      console.error('Error adding contact:', error);
      this.ui.showAlert('Error al agregar el contacto', 'error');
    }
  }

  async handleEditContact(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('edit-contact-form');
    const contactId = formData.contactId;
    
    if (!formData.name || !formData.type) {
      this.ui.showAlert('El nombre y tipo son obligatorios', 'error');
      return;
    }
    
    try {
      const success = await this.contacts.updateContact(contactId, formData);
      
      if (success) {
        this.ui.showAlert('Contacto actualizado correctamente', 'success');
        this.modals.hide('edit-contact-modal');
        this.updateDashboard(); // Refresh dashboard
      } else {
        this.ui.showAlert('Error al actualizar el contacto', 'error');
      }
      
    } catch (error) {
      console.error('Error updating contact:', error);
      this.ui.showAlert('Error al actualizar el contacto', 'error');
    }
  }
  // Export data
  exportData() {
    try {
      const success = this.data.exportDataToCSV('complete');
      if (success) {
        this.ui.showAlert('Datos exportados correctamente', 'success');
      } else {
        this.ui.showAlert('Error al exportar los datos', 'error');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      this.ui.showAlert('Error al exportar los datos', 'error');
    }
  }

  // Delete methods
  async deleteExpense(expenseId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      return;
    }
    
    try {
      const success = await this.data.deleteExpense(expenseId);
      if (success) {
        this.ui.showAlert('Gasto eliminado correctamente', 'success');
        this.updateDashboard();
      } else {
        this.ui.showAlert('Error al eliminar el gasto', 'error');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.ui.showAlert('Error al eliminar el gasto', 'error');
    }
  }

  async deleteSpendingLimit(limitId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este límite?')) {
      return;
    }
    
    try {
      const success = await this.data.deleteSpendingLimit(limitId);
      if (success) {
        this.ui.showAlert('Límite eliminado correctamente', 'success');
        this.updateDashboard();
      } else {
        this.ui.showAlert('Error al eliminar el límite', 'error');
      }
    } catch (error) {
      console.error('Error deleting spending limit:', error);
      this.ui.showAlert('Error al eliminar el límite', 'error');
    }
  }

  async deleteCategory(categoryId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }
    
    try {
      const success = await this.data.deleteCategory(categoryId);
      if (success) {
        this.ui.showAlert('Categoría eliminada correctamente', 'success');
        
        // Update UI
        const categories = this.data.getCategories();
        this.ui.updateCategoriesManagementList(categories);
        this.ui.updateCategoriesSelect(categories, 'expense-category');
        this.ui.updateCategoriesSelect(categories, 'limit-category');
        this.ui.updateCategoriesSelect(categories, 'event-category');
      } else {
        this.ui.showAlert('Error al eliminar la categoría', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      this.ui.showAlert('Error al eliminar la categoría', 'error');
    }
  }

  // Global methods for HTML onclick handlers
  showDeleteConfirmation(expenseId, description) {
    if (confirm(`¿Eliminar "${description}"?`)) {
      this.deleteExpense(expenseId);
    }
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
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
      const errorAlert = document.createElement('div');
      errorAlert.className = 'alert alert-error show';
      errorAlert.textContent = 'Error al inicializar la aplicación. Por favor recarga la página.';
      alertContainer.appendChild(errorAlert);
    }
  }
});