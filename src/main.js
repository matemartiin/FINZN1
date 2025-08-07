import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { ChartManager } from './modules/charts.js';
import { ModalManager } from './modules/modals.js';
import { ChatManager } from './modules/chat.js';
import { ReportManager } from './modules/reports.js';
import { ThemeManager } from './modules/theme.js';
import { NavigationManager } from './modules/navigation.js';
import { CalendarManager } from './modules/calendar.js';
import { BudgetManager } from './modules/budget.js';

console.log('🔥 FINZN App - Starting initialization');

class FinznApp {
  constructor() {
    console.log('🏗️ Constructing FINZN App');
    
    // Initialize all managers
    this.auth = new AuthManager();
    this.data = new DataManager();
    this.ui = new UIManager();
    this.charts = new ChartManager();
    this.modals = new ModalManager();
    this.chat = new ChatManager();
    this.reports = new ReportManager();
    this.theme = new ThemeManager();
    this.navigation = new NavigationManager();
    this.calendar = new CalendarManager();
    this.budget = new BudgetManager();
    
    this.currentMonth = this.getCurrentMonth();
    this.currentExpenseId = null;
    
    console.log('🔧 All modules initialized');
    this.init();
  }

  async init() {
    console.log('🚀 Initializing FINZN App...');
    
    try {
      // Initialize theme first
      this.theme.init();
      
      // Initialize navigation
      this.navigation.init();
      
      // Initialize modals
      this.modals.init();
      
      // Initialize chat
      this.chat.init();
      
      // Initialize calendar
      this.calendar.init();
      
      // Setup month selector
      this.setupMonthSelector();
      
      // Check authentication
      await this.auth.initializeAuth();
      const currentUser = this.auth.getCurrentUser();
      console.log('Current user:', currentUser);
      
      if (currentUser) {
        this.showApp();
        await this.loadUserData();
        this.updateDashboard();
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
      this.setupAuthEvents();
      
      // Dashboard events
      this.setupDashboardEvents();
      
      // Theme toggle
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => {
          this.theme.toggle();
        });
      }
      
      // Month selector
      const monthSelect = document.getElementById('month-select');
      if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
          this.currentMonth = e.target.value;
          this.updateDashboard();
        });
      }
      
      console.log('✅ All event listeners set up successfully');
    } catch (error) {
      console.error('❌ Error setting up event listeners:', error);
    }
  }

  setupAuthEvents() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    const generateTestEmail = document.getElementById('generate-test-email');
    
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }
    
    if (showRegister) {
      showRegister.addEventListener('click', () => this.showRegister());
    }
    
    if (showLogin) {
      showLogin.addEventListener('click', () => this.showLogin());
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
    
    if (generateTestEmail) {
      generateTestEmail.addEventListener('click', () => {
        const testEmail = this.auth.generateTestEmail();
        const emailInput = document.getElementById('register-user');
        if (emailInput) {
          emailInput.value = testEmail;
          this.ui.showAlert('Email de prueba generado', 'info');
        }
      });
    }
  }

  setupDashboardEvents() {
    // Add expense buttons
    const addExpenseBtn = document.getElementById('add-expense-btn-dashboard');
    const addExpenseBtnTransactions = document.getElementById('add-expense-btn-transactions');
    
    if (addExpenseBtn) {
      addExpenseBtn.addEventListener('click', () => this.showAddExpenseModal());
    }
    
    if (addExpenseBtnTransactions) {
      addExpenseBtnTransactions.addEventListener('click', () => this.showAddExpenseModal());
    }
    
    // Add income button
    const addIncomeBtn = document.getElementById('add-income-btn-dashboard');
    const addIncomeBtnTransactions = document.getElementById('add-income-btn-transactions');
    
    if (addIncomeBtn) {
      addIncomeBtn.addEventListener('click', () => this.showAddIncomeModal());
    }
    
    if (addIncomeBtnTransactions) {
      addIncomeBtnTransactions.addEventListener('click', () => this.showAddIncomeModal());
    }
    
    // View incomes button
    const incomesIndicator = document.getElementById('incomes-indicator');
    if (incomesIndicator) {
      incomesIndicator.addEventListener('click', () => this.showViewIncomesModal());
    }
    
    // Installments button
    const installmentsBtn = document.getElementById('installments-btn');
    if (installmentsBtn) {
      installmentsBtn.addEventListener('click', () => this.showInstallmentsModal());
    }
    
    // Add goal button
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
      addGoalBtn.addEventListener('click', () => this.showAddGoalModal());
    }
    
    // Add spending limit button
    const addSpendingLimitBtnTransactions = document.getElementById('add-spending-limit-btn-transactions');
    if (addSpendingLimitBtnTransactions) {
      addSpendingLimitBtnTransactions.addEventListener('click', () => this.showAddSpendingLimitModal());
    }
    
    // Add budget button
    const addBudgetBtn = document.getElementById('add-budget-btn');
    const generateBudgetInsightsBtn = document.getElementById('generate-budget-insights-btn');
    
    if (addBudgetBtn) {
      addBudgetBtn.addEventListener('click', () => this.showAddBudgetModal());
    }
    
    if (generateBudgetInsightsBtn) {
      generateBudgetInsightsBtn.addEventListener('click', () => this.generateAllBudgetInsights());
    }
    
    // Settings buttons
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataBtn = document.getElementById('import-data-btn');
    const generateAiReportBtn = document.getElementById('generate-ai-report-btn');
    const generateReportBtnSection = document.getElementById('generate-report-btn-section');
    const backupDataBtn = document.getElementById('backup-data-btn');
    
    if (manageCategoriesBtn) {
      manageCategoriesBtn.addEventListener('click', () => this.showManageCategoriesModal());
    }
    
    if (exportDataBtn) {
      exportDataBtn.addEventListener('click', () => this.handleExportData());
    }
    
    if (importDataBtn) {
      importDataBtn.addEventListener('click', () => this.showImportDataModal());
    }
    
    if (generateAiReportBtn) {
      generateAiReportBtn.addEventListener('click', () => this.showGenerateAiReportModal());
    }
    
    if (generateReportBtnSection) {
      generateReportBtnSection.addEventListener('click', () => this.showGenerateAiReportModal());
    }
    
    if (backupDataBtn) {
      backupDataBtn.addEventListener('click', () => this.handleBackupData());
    }
    
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
    
    // Add goal form
    const addGoalForm = document.getElementById('add-goal-form');
    if (addGoalForm) {
      addGoalForm.addEventListener('submit', (e) => this.handleAddGoal(e));
    }
    
    // Edit goal form
    const editGoalForm = document.getElementById('edit-goal-form');
    if (editGoalForm) {
      editGoalForm.addEventListener('submit', (e) => this.handleEditGoal(e));
    }
    
    // Add money to goal form
    const addMoneyForm = document.getElementById('add-money-form');
    if (addMoneyForm) {
      addMoneyForm.addEventListener('submit', (e) => this.handleAddMoney(e));
    }
    
    // Add spending limit form
    const addSpendingLimitForm = document.getElementById('add-spending-limit-form');
    if (addSpendingLimitForm) {
      addSpendingLimitForm.addEventListener('submit', (e) => this.handleAddSpendingLimit(e));
    }
    
    // Add category form
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
      addCategoryForm.addEventListener('submit', (e) => this.handleAddCategory(e));
    }
    
    // Import data button
    const processImportBtn = document.getElementById('process-import-btn');
    if (processImportBtn) {
      processImportBtn.addEventListener('click', () => this.handleImportData());
    }
    
    // Generate AI report button
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', () => this.handleGenerateAiReport());
    }
    
    // Add budget form
    const addBudgetForm = document.getElementById('add-budget-form');
    if (addBudgetForm) {
      addBudgetForm.addEventListener('submit', (e) => this.handleAddBudget(e));
    }
    
    // Edit budget form
    const editBudgetForm = document.getElementById('edit-budget-form');
    if (editBudgetForm) {
      editBudgetForm.addEventListener('submit', (e) => this.handleEditBudget(e));
    }
  }

  setupModalEvents() {
    // Installments checkbox
    const installmentsCheckbox = document.getElementById('expense-installments');
    const installmentsGroup = document.getElementById('installments-group');
    
    if (installmentsCheckbox && installmentsGroup) {
      installmentsCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          installmentsGroup.classList.remove('hidden');
        } else {
          installmentsGroup.classList.add('hidden');
        }
      });
    }
    
    // Income type selector
    const incomeType = document.getElementById('income-type');
    const extraIncomeGroup = document.getElementById('extra-income-group');
    
    if (incomeType && extraIncomeGroup) {
      incomeType.addEventListener('change', (e) => {
        if (e.target.value === 'extra') {
          extraIncomeGroup.classList.remove('hidden');
        } else {
          extraIncomeGroup.classList.add('hidden');
        }
      });
    }
  }

  setupMonthSelector() {
    const monthSelect = document.getElementById('month-select');
    if (!monthSelect) return;
    
    // Generate last 12 months
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      months.push({ key: monthKey, name: monthName });
    }
    
    monthSelect.innerHTML = '';
    months.forEach(month => {
      const option = document.createElement('option');
      option.value = month.key;
      option.textContent = month.name;
      if (month.key === this.currentMonth) {
        option.selected = true;
      }
      monthSelect.appendChild(option);
    });
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
        this.updateDashboard();
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
    
    // Clear any previous error messages
    const errorElement = document.getElementById('register-error');
    if (errorElement) {
      errorElement.textContent = '';
    }
    
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
      
      // Show error in the form
      if (errorElement) {
        errorElement.textContent = error.message || 'Error al registrar usuario';
      }
      
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
    try {
      // Check if user is authenticated
      const currentUser = this.auth.getCurrentUser();
      if (!currentUser) {
        console.log('⚠️ No authenticated user, skipping data load');
        return;
      }
      
      await this.data.loadUserData();
      
      // Load budget data
      await this.budget.loadBudgets();
      
      // Update categories in selects
      const categories = this.data.getCategories();
      this.ui.updateCategoriesSelect(categories, 'expense-category');
      this.ui.updateCategoriesSelect(categories, 'category-filter');
      this.ui.updateCategoriesSelect(categories, 'limit-category');
      this.ui.updateCategoriesSelect(categories, 'budget-category');
      this.ui.updateCategoriesSelect(categories, 'edit-budget-category');
      
      console.log('✅ User data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      // Show user-friendly error message
      this.ui.showAlert('Error al cargar los datos. Verifica tu conexión.', 'error');
    }
  }

  async updateDashboard() {
    console.log('🔄 Updating dashboard for month:', this.currentMonth);
    
    try {
      // Load current month data
      console.log('📊 Loading expenses...');
      const expenses = await this.data.loadExpenses(this.currentMonth);
      console.log('💰 Loading income...');
      const income = await this.data.loadIncome(this.currentMonth);
      console.log('💵 Loading extra incomes...');
      const extraIncomes = await this.data.loadExtraIncomes(this.currentMonth);
      
      console.log('📊 Data loaded:', { expenses: expenses.length, income, extraIncomes: extraIncomes.length });
      
      // Calculate balance
      const balance = this.data.calculateBalance(this.currentMonth);
      console.log('💰 Balance calculated:', balance);
      
      // Update UI
      this.ui.updateBalance(balance);
      this.ui.updateExpensesList(expenses, this);
      
      // Update income details (this will show the indicator and total)
      this.ui.updateIncomeDetails(income, extraIncomes);
      
      // Update installments list
      this.ui.updateInstallmentsList(expenses);
      
      // Update goals
      const goals = this.data.getGoals();
      this.ui.updateGoalsList(goals);
      
      // Update spending limits
      const spendingLimits = this.data.getSpendingLimits();
      this.ui.updateSpendingLimitsList(spendingLimits, expenses);
      
      // Update budgets
      const budgets = this.budget.getBudgets();
      this.ui.updateBudgetsList(budgets, expenses);
      
      // Update budget summary
      const budgetSummary = this.budget.getBudgetSummary(expenses);
      this.ui.updateBudgetSummary(budgetSummary);
      
      // Check spending limit alerts
      const limitAlerts = this.data.checkSpendingLimits(this.currentMonth);
      // Show system alerts but not mascot alerts
      limitAlerts.forEach(alert => {
        this.ui.showAlert(alert.message, alert.type);
      });
      
      // Check budget alerts
      const budgetAlerts = this.budget.getBudgetAlerts(expenses);
      budgetAlerts.forEach(alert => {
        this.ui.displayBudgetAlert(alert);
      });
      
      // Update charts
      const expensesByCategory = this.data.getExpensesByCategory(this.currentMonth);
      this.charts.updateExpensesChart(expensesByCategory);
      
      // Update trend chart
      const trendData = await this.data.getTrendData();
      this.charts.updateTrendChart(trendData);
      
      // Mascot messages disabled - pet only speaks on hover
      
      console.log('✅ Dashboard updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating dashboard:', error);
      this.ui.showAlert('Error al cargar los datos. Intenta refrescar la página.', 'error');
    }
  }

  // Modal methods
  showAddExpenseModal() {
    console.log('💳 Show add expense modal');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
      dateInput.value = today;
    }
    
    this.modals.show('add-expense-modal');
  }

  showAddIncomeModal() {
    console.log('💰 Show add income modal');
    this.modals.show('add-income-modal');
  }

  showAddGoalModal() {
    console.log('🎯 Show add goal modal');
    this.modals.show('add-goal-modal');
  }

  showAddSpendingLimitModal() {
    console.log('⚠️ Show add spending limit modal');
    
    // Pre-select category if provided
    const categorySelect = document.getElementById('limit-category');
    if (arguments.length > 0 && categorySelect) {
      const preSelectedCategory = arguments[0];
      setTimeout(() => {
        categorySelect.value = preSelectedCategory;
      }, 100);
    }
    
    this.modals.show('add-spending-limit-modal');
  }
  
  showManageCategoriesModal() {
    console.log('🏷️ Show manage categories modal');
    
    // Update categories list before showing modal
    const categories = this.data.getCategories();
    this.ui.updateCategoriesManagementList(categories);
    
    this.modals.show('manage-categories-modal');
  }
  
  showImportDataModal() {
    console.log('📥 Show import data modal');
    this.modals.show('import-data-modal');
  }
  
  showGenerateAiReportModal() {
    console.log('🤖 Show generate AI report modal');
    this.modals.show('generate-ai-report-modal');
  }
  
  showViewIncomesModal() {
    console.log('👁️ Show view incomes modal');
    
    // Update income details
    const income = this.data.getIncome(this.currentMonth);
    const extraIncomes = this.data.getExtraIncomes(this.currentMonth);
    this.ui.updateIncomeDetails(income, extraIncomes);
    
    this.modals.show('view-incomes-modal');
  }
  
  showInstallmentsModal() {
    console.log('📊 Show installments modal');
    
    this.modals.show('view-installments-modal');
  }

  showAddBudgetModal() {
    console.log('💰 Show add budget modal');
    this.ui.showAddBudgetModal();
  }

  async handleAddExpense(e) {
    e.preventDefault();
    console.log('💳 Adding expense...');
    
    const formData = this.ui.getFormData('add-expense-form');
    
    if (!formData.description || !formData.amount || !formData.category || !formData.transactionDate) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }
    
    try {
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        transactionDate: formData.transactionDate,
        month: this.currentMonth,
        installment: 1,
        totalInstallments: 1,
        recurring: false
      };
      
      // Handle installments
      if (formData.hasInstallments && formData.installmentsCount) {
        const installmentsCount = parseInt(formData.installmentsCount);
        console.log('📊 Creating installments:', installmentsCount);
        const monthlyAmount = expenseData.amount / installmentsCount;
        
        // Store original amount for reference
        const originalAmount = expenseData.amount;
        
        // Create installments for future months
        for (let i = 0; i < installmentsCount; i++) {
          const installmentDate = new Date(formData.transactionDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          const installmentMonth = `${installmentDate.getFullYear()}-${(installmentDate.getMonth() + 1).toString().padStart(2, '0')}`;
          
          const installmentData = {
            ...expenseData,
            amount: monthlyAmount,
            month: installmentMonth,
            installment: i + 1,
            totalInstallments: installmentsCount,
            originalAmount: originalAmount,
            transactionDate: installmentDate.toISOString().split('T')[0]
          };
          
          console.log(`📊 Adding installment ${i + 1}/${installmentsCount}:`, installmentData);
          await this.data.addExpense(installmentData);
        }
        
        this.ui.showAlert(`Gasto dividido en ${installmentsCount} cuotas exitosamente`, 'success');
      } else {
        await this.data.addExpense(expenseData);
        this.ui.showAlert('Gasto agregado exitosamente', 'success');
      }
      
      this.modals.hide('add-expense-modal');
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error adding expense:', error);
      this.ui.showAlert('Error al agregar el gasto', 'error');
    }
  }

  async handleAddBudget(e) {
    e.preventDefault();
    console.log('💰 Adding budget...');
    
    const formData = this.ui.getBudgetFormData('add-budget-form');
    
    if (!formData.name || !formData.category || !formData.amount || !formData['start-date'] || !formData['end-date']) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }
    
    // Validate dates
    const startDate = new Date(formData['start-date']);
    const endDate = new Date(formData['end-date']);
    
    if (endDate <= startDate) {
      this.ui.showAlert('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
      return;
    }
    
    try {
      const budgetData = {
        name: formData.name,
        category: formData.category,
        amount: parseFloat(formData.amount),
        start_date: formData['start-date'],
        end_date: formData['end-date'],
        ai_recommended: formData['ai-recommendations'] || false
      };
      
      const success = await this.budget.addBudget(budgetData);
      
      if (success) {
        this.modals.hide('add-budget-modal');
        this.ui.showAlert('Presupuesto creado exitosamente', 'success');
        this.updateDashboard();
        
        // Generate AI insights if requested
        if (budgetData.ai_recommended) {
          this.generateBudgetInsights(budgetData.category);
        }
      } else {
        this.ui.showAlert('Error al crear el presupuesto', 'error');
      }
      
    } catch (error) {
      console.error('Error adding budget:', error);
      this.ui.showAlert('Error al crear el presupuesto', 'error');
    }
  }

  async handleEditBudget(e) {
    e.preventDefault();
    console.log('✏️ Editing budget...');
    
    const modal = document.getElementById('edit-budget-modal');
    const budgetId = modal?.dataset.budgetId;
    
    if (!budgetId) {
      this.ui.showAlert('Error: ID de presupuesto no encontrado', 'error');
      return;
    }
    
    const formData = this.ui.getBudgetFormData('edit-budget-form');
    
    if (!formData.name || !formData.category || !formData.amount || !formData['start-date'] || !formData['end-date']) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }
    
    // Validate dates
    const startDate = new Date(formData['start-date']);
    const endDate = new Date(formData['end-date']);
    
    if (endDate <= startDate) {
      this.ui.showAlert('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
      return;
    }
    
    try {
      const updates = {
        name: formData.name,
        category: formData.category,
        amount: parseFloat(formData.amount),
        start_date: formData['start-date'],
        end_date: formData['end-date']
      };
      
      const success = await this.budget.updateBudget(budgetId, updates);
      
      if (success) {
        this.modals.hide('edit-budget-modal');
        this.ui.showAlert('Presupuesto actualizado exitosamente', 'success');
        this.updateDashboard();
      } else {
        this.ui.showAlert('Error al actualizar el presupuesto', 'error');
      }
      
    } catch (error) {
      console.error('Error editing budget:', error);
      this.ui.showAlert('Error al actualizar el presupuesto', 'error');
    }
  }

  showEditBudgetModal(budgetId) {
    console.log('✏️ Show edit budget modal for:', budgetId);
    this.ui.showEditBudgetModal(budgetId);
  }

  async deleteBudget(budgetId, budgetName) {
    if (confirm(`¿Estás seguro de que quieres eliminar el presupuesto "${budgetName}"?`)) {
      try {
        const success = await this.budget.deleteBudget(budgetId);
        if (success) {
          this.ui.showAlert('Presupuesto eliminado exitosamente', 'success');
          this.updateDashboard();
        } else {
          this.ui.showAlert('Error al eliminar el presupuesto', 'error');
        }
      } catch (error) {
        console.error('Error deleting budget:', error);
        this.ui.showAlert('Error al eliminar el presupuesto', 'error');
      }
    }
  }

  async generateBudgetInsights(budgetId = null) {
    console.log('🤖 Generating budget insights for:', budgetId || 'all budgets');
    
    try {
      this.ui.showAlert('Generando análisis inteligente...', 'info');
      this.ui.showLoading('generate-budget-insights-btn');
      
      // Get user data for AI analysis
      const expenses = await this.data.loadExpenses(this.currentMonth);
      const income = await this.data.loadIncome(this.currentMonth);
      const extraIncomes = await this.data.loadExtraIncomes(this.currentMonth);
      const budgets = this.budget.getBudgets();
      const categories = this.data.getCategories();
      
      // Prepare data for AI analysis
      const analysisData = {
        currentMonth: this.currentMonth,
        expenses: expenses,
        income: income,
        extraIncomes: extraIncomes,
        budgets: budgets,
        categories: categories,
        budgetId: budgetId
      };
      
      // Generate AI insights
      const insights = await this.generateAIBudgetAnalysis(analysisData);
      
      // Display insights
      this.ui.displayAIBudgetInsights(insights);
      
      // Save insights to database
      for (const insight of insights) {
        await this.data.saveBudgetInsight(insight);
      }
      
      this.ui.showAlert('Análisis completado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error generating budget insights:', error);
      this.ui.showAlert('Error al generar el análisis. Intenta nuevamente.', 'error');
    } finally {
      this.ui.hideLoading('generate-budget-insights-btn');
    }
  }
  
  async generateAIBudgetAnalysis(data) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ No Gemini API key found, using fallback insights');
      return this.generateFallbackBudgetInsights(data);
    }
    
    try {
      // Prepare comprehensive prompt for budget analysis
      const prompt = this.buildBudgetAnalysisPrompt(data);
      
      console.log('🤖 Sending budget analysis request to Gemini API...');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1500,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        console.error('❌ Gemini API error:', response.status, response.statusText);
        return this.generateFallbackBudgetInsights(data);
      }

      const result = await response.json();
      console.log('✅ Gemini API response received for budget analysis');

      if (!result.candidates || result.candidates.length === 0) {
        console.warn('⚠️ No candidates in Gemini response, using fallback');
        return this.generateFallbackBudgetInsights(data);
      }

      const aiContent = result.candidates[0]?.content?.parts?.[0]?.text || '';
      
      if (!aiContent.trim()) {
        console.warn('⚠️ Empty AI response, using fallback');
        return this.generateFallbackBudgetInsights(data);
      }

      // Parse AI response into structured insights
      return this.parseAIBudgetInsights(aiContent, data);

    } catch (error) {
      console.error('❌ Error in AI budget analysis:', error);
      return this.generateFallbackBudgetInsights(data);
    }
  }
  
  buildBudgetAnalysisPrompt(data) {
    const totalExpenses = data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const totalIncome = parseFloat(data.income.fixed) + parseFloat(data.income.extra) + 
                       data.extraIncomes.reduce((sum, extra) => sum + parseFloat(extra.amount), 0);
    const balance = totalIncome - totalExpenses;
    
    // Get expenses by category
    const expensesByCategory = {};
    data.expenses.forEach(expense => {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + parseFloat(expense.amount);
    });
    
    // Get budget performance
    const budgetPerformance = data.budgets.map(budget => {
      const progress = this.budget.calculateBudgetProgress(budget, data.expenses);
      return {
        name: budget.name,
        category: budget.category,
        limit: budget.amount,
        spent: progress.spent,
        percentage: progress.percentage,
        status: progress.status
      };
    });

    let prompt = `Eres un experto asesor financiero especializado en análisis de presupuestos. Analiza los siguientes datos financieros y genera insights específicos sobre presupuestos en español.

DATOS FINANCIEROS DEL MES (${data.currentMonth}):
- Ingresos Totales: $${totalIncome.toLocaleString()}
- Gastos Totales: $${totalExpenses.toLocaleString()}
- Balance: $${balance.toLocaleString()}

GASTOS POR CATEGORÍA:`;

    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      const percentage = ((amount / totalExpenses) * 100).toFixed(1);
      prompt += `\n- ${category}: $${amount.toLocaleString()} (${percentage}%)`;
    });

    prompt += `\n\nPRESUPUESTOS CONFIGURADOS: ${data.budgets.length}`;
    
    if (budgetPerformance.length > 0) {
      prompt += `\n\nRENDIMIENTO DE PRESUPUESTOS:`;
      budgetPerformance.forEach(budget => {
        prompt += `\n- ${budget.name} (${budget.category}): ${budget.percentage.toFixed(1)}% utilizado ($${budget.spent.toLocaleString()}/$${budget.limit.toLocaleString()}) - Estado: ${budget.status}`;
      });
    }

    prompt += `\n\nGenera un análisis estructurado que incluya EXACTAMENTE estos elementos separados por "---":

1. INSIGHT_TYPE: recommendation
   TITLE: [Título de la recomendación]
   DESCRIPTION: [Descripción detallada de la recomendación]
   CONFIDENCE: [high/medium/low]

2. INSIGHT_TYPE: pattern
   TITLE: [Título del patrón identificado]
   DESCRIPTION: [Descripción del patrón de gasto detectado]
   CONFIDENCE: [high/medium/low]

3. INSIGHT_TYPE: prediction
   TITLE: [Título de la predicción]
   DESCRIPTION: [Predicción sobre gastos futuros]
   CONFIDENCE: [high/medium/low]

4. INSIGHT_TYPE: alert
   TITLE: [Título de la alerta]
   DESCRIPTION: [Alerta sobre presupuestos en riesgo]
   CONFIDENCE: [high/medium/low]

Cada insight debe ser específico, accionable y basado en los datos proporcionados. Usa números concretos y porcentajes. Máximo 100 palabras por descripción.`;

    return prompt;
  }
  
  parseAIBudgetInsights(aiContent, data) {
    const insights = [];
    const sections = aiContent.split('---').filter(section => section.trim());
    
    sections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      
      let insightType = 'recommendation';
      let title = `Insight ${index + 1}`;
      let description = 'Análisis generado por IA';
      let confidence = 0.8;
      
      lines.forEach(line => {
        if (line.includes('INSIGHT_TYPE:')) {
          insightType = line.split(':')[1].trim();
        } else if (line.includes('TITLE:')) {
          title = line.split(':')[1].trim();
        } else if (line.includes('DESCRIPTION:')) {
          description = line.split(':')[1].trim();
        } else if (line.includes('CONFIDENCE:')) {
          const confidenceStr = line.split(':')[1].trim().toLowerCase();
          confidence = confidenceStr === 'high' ? 0.9 : confidenceStr === 'medium' ? 0.7 : 0.5;
        }
      });
      
      insights.push({
        insight_type: insightType,
        title: title,
        description: description,
        confidence_score: confidence,
        data: {
          month: data.currentMonth,
          total_expenses: data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0),
          budget_count: data.budgets.length
        }
      });
    });
    
    // If no insights were parsed, create fallback
    if (insights.length === 0) {
      return this.generateFallbackBudgetInsights(data);
    }
    
    return insights;
  }
  
  generateFallbackBudgetInsights(data) {
    const insights = [];
    const totalExpenses = data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const totalIncome = parseFloat(data.income.fixed) + parseFloat(data.income.extra) + 
                       data.extraIncomes.reduce((sum, extra) => sum + parseFloat(extra.amount), 0);
    
    // Get top spending category
    const expensesByCategory = {};
    data.expenses.forEach(expense => {
      expensesByCategory[expense.category] = (expensesByCategory[expense.category] || 0) + parseFloat(expense.amount);
    });
    
    const topCategory = Object.entries(expensesByCategory)
      .sort(([,a], [,b]) => b - a)[0];
    
    // Budget performance analysis
    const budgetsWithProgress = data.budgets.map(budget => ({
      ...budget,
      progress: this.budget.calculateBudgetProgress(budget, data.expenses)
    }));
    
    const exceededBudgets = budgetsWithProgress.filter(b => b.progress.status === 'exceeded');
    const warningBudgets = budgetsWithProgress.filter(b => b.progress.status === 'warning');
    
    // Generate recommendation
    if (topCategory) {
      const [categoryName, categoryAmount] = topCategory;
      const percentage = ((categoryAmount / totalExpenses) * 100).toFixed(1);
      
      insights.push({
        insight_type: 'recommendation',
        title: `Optimizar gastos en ${categoryName}`,
        description: `${categoryName} representa el ${percentage}% de tus gastos ($${categoryAmount.toLocaleString()}). Considera establecer un presupuesto específico para esta categoría y buscar alternativas más económicas.`,
        confidence_score: 0.8,
        data: {
          category: categoryName,
          amount: categoryAmount,
          percentage: percentage
        }
      });
    }
    
    // Generate pattern insight
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0;
    insights.push({
      insight_type: 'pattern',
      title: `Patrón de ahorro del ${savingsRate}%`,
      description: `Tu tasa de ahorro actual es del ${savingsRate}%. ${savingsRate >= 20 ? 'Excelente disciplina financiera.' : savingsRate >= 10 ? 'Buen progreso, intenta llegar al 20%.' : 'Considera reducir gastos no esenciales para mejorar tu capacidad de ahorro.'}`,
      confidence_score: 0.9,
      data: {
        savings_rate: parseFloat(savingsRate),
        total_income: totalIncome,
        total_expenses: totalExpenses
      }
    });
    
    // Generate alert if budgets are exceeded
    if (exceededBudgets.length > 0) {
      insights.push({
        insight_type: 'alert',
        title: `${exceededBudgets.length} presupuesto(s) superado(s)`,
        description: `Has superado el límite en: ${exceededBudgets.map(b => b.category).join(', ')}. Revisa estos gastos y ajusta tus hábitos de consumo para el próximo mes.`,
        confidence_score: 1.0,
        data: {
          exceeded_budgets: exceededBudgets.length,
          categories: exceededBudgets.map(b => b.category)
        }
      });
    } else if (warningBudgets.length > 0) {
      insights.push({
        insight_type: 'alert',
        title: `${warningBudgets.length} presupuesto(s) cerca del límite`,
        description: `Estás cerca del límite en: ${warningBudgets.map(b => b.category).join(', ')}. Modera tus gastos en estas categorías para no superar el presupuesto.`,
        confidence_score: 0.8,
        data: {
          warning_budgets: warningBudgets.length,
          categories: warningBudgets.map(b => b.category)
        }
      });
    }
    
    // Generate prediction
    const avgDailyExpense = totalExpenses / new Date().getDate();
    const daysRemaining = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
    const projectedExpenses = totalExpenses + (avgDailyExpense * daysRemaining);
    
    insights.push({
      insight_type: 'prediction',
      title: `Proyección de gastos del mes`,
      description: `Basándome en tu patrón actual, proyecto gastos totales de $${projectedExpenses.toLocaleString()} para este mes. ${projectedExpenses > totalIncome ? 'Esto superaría tus ingresos.' : 'Esto está dentro de tus posibilidades.'}`,
      confidence_score: 0.7,
      data: {
        projected_expenses: projectedExpenses,
        current_expenses: totalExpenses,
        days_remaining: daysRemaining
      }
    });
    
    return insights;
  }

  async generateAllBudgetInsights() {
    console.log('🤖 Generating insights for all budgets');
    await this.generateBudgetInsights(null);
  }

  async handleAddIncome(e) {
    e.preventDefault();
    console.log('💰 Adding income...');
    
    const formData = this.ui.getFormData('add-income-form');
    
    if (!formData.amount || !formData.type) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }
    
    try {
      if (formData.type === 'fixed') {
        // Add fixed income
        await this.data.addFixedIncome(this.currentMonth, formData.amount);
      } else {
        // Add extra income to extra_incomes table
        const extraIncomeData = {
          description: formData.description || 'Ingreso extra',
          amount: formData.amount,
          category: formData.category || 'other'
        };
        await this.data.addExtraIncome(this.currentMonth, extraIncomeData);
      }
      
      this.modals.hide('add-income-modal');
      this.ui.showAlert('Ingreso agregado exitosamente', 'success');
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error adding income:', error);
      this.ui.showAlert('Error al agregar el ingreso', 'error');
    }
  }

  async handleAddGoal(e) {
    e.preventDefault();
    console.log('🎯 Adding goal...');
    
    const formData = this.ui.getFormData('add-goal-form');
    
    if (!formData.name || !formData.targetAmount) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }
    
    try {
      const goalData = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0
      };
      
      await this.data.addGoal(goalData);
      
      this.modals.hide('add-goal-modal');
      this.ui.showAlert('Objetivo creado exitosamente', 'success');
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error adding goal:', error);
      this.ui.showAlert('Error al crear el objetivo', 'error');
    }
  }

  async handleAddSpendingLimit(e) {
    e.preventDefault();
    console.log('🚦 Adding spending limit...');
    
    const formData = this.ui.getFormData('add-spending-limit-form');
    
    if (!formData.category || !formData.amount) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }
    
    try {
      const limitData = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        warningPercentage: parseInt(formData.warningPercentage) || 80
      };
      
      console.log('🚦 Creating spending limit:', limitData);
      await this.data.addSpendingLimit(limitData);
      
      this.modals.hide('add-spending-limit-modal');
      this.ui.showAlert('Límite de gasto creado exitosamente', 'success');
      this.updateDashboard();
      
    } catch (error) {
      console.error('❌ Error adding spending limit:', error);
      this.ui.showAlert('Error al crear el límite de gasto', 'error');
    }
  }
  
  async handleAddCategory(e) {
    e.preventDefault();
    console.log('🏷️ Adding category...');
    
    const formData = this.ui.getFormData('add-category-form');
    
    if (!formData.name || !formData.icon) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }
    
    try {
      const categoryData = {
        name: formData.name,
        icon: formData.icon,
        color: formData.color || '#B7A6FF'
      };
      
      await this.data.addCategory(categoryData);
      
      // Update categories list in modal
      const categories = this.data.getCategories();
      this.ui.updateCategoriesManagementList(categories);
      
      // Update all category selects
      this.ui.updateCategoriesSelect(categories, 'expense-category');
      this.ui.updateCategoriesSelect(categories, 'category-filter');
      this.ui.updateCategoriesSelect(categories, 'limit-category');
      
      // Clear form
      this.ui.clearForm('add-category-form');
      
      this.ui.showAlert('Categoría agregada exitosamente', 'success');
      
    } catch (error) {
      console.error('Error adding category:', error);
      this.ui.showAlert('Error al agregar la categoría', 'error');
    }
  }
  
  handleExportData() {
    console.log('📊 Exporting data...');
    
    // Show comprehensive export options
    const exportType = prompt('¿Qué datos quieres exportar?\n1. Completo (gastos + ingresos + cuotas)\n2. Solo gastos\n3. Solo ingresos\n\nEscribe "completo", "gastos" o "ingresos":');
    
    if (exportType) {
      let type = 'complete';
      
      if (exportType.toLowerCase().includes('gasto')) {
        type = 'expenses';
      } else if (exportType.toLowerCase().includes('ingreso')) {
        type = 'incomes';
      }
      
      const success = this.data.exportDataToCSV(type);
      
      if (success) {
        const typeText = type === 'complete' ? 'datos completos' : 
                        type === 'expenses' ? 'gastos' : 'ingresos';
        this.ui.showAlert(`${typeText.charAt(0).toUpperCase() + typeText.slice(1)} exportados exitosamente`, 'success');
      } else {
        this.ui.showAlert('Error al exportar los datos', 'error');
      }
    }
  }
  
  async handleImportData() {
    console.log('📥 Importing data...');
    
    const fileInput = document.getElementById('import-file');
    const importType = document.querySelector('input[name="import-type"]:checked')?.value || 'auto';
    
    if (!fileInput.files[0]) {
      this.ui.showAlert('Por favor selecciona un archivo CSV', 'error');
      return;
    }
    
    try {
      const file = fileInput.files[0];
      const result = await this.data.importDataFromCSV(file, importType);
      
      this.modals.hide('import-data-modal');
      
      let message = `Importación exitosa: ${result.imported} registros importados`;
      if (result.errors > 0) {
        message += `, ${result.errors} errores encontrados`;
      }
      
      this.ui.showAlert(message, result.errors > 0 ? 'warning' : 'success');
      
      // Refresh dashboard
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error importing data:', error);
      this.ui.showAlert('Error al importar los datos: ' + error.message, 'error');
    }
  }
  
  handleBackupData() {
    console.log('☁️ Backup data...');
    this.ui.showAlert('Función de respaldo próximamente', 'info');
  }
  
  async handleGenerateAiReport() {
    console.log('🤖 Generating AI report...');
    
    const period = document.getElementById('report-period').value;
    const focus = document.getElementById('report-focus').value;
    const questions = document.getElementById('report-questions').value;
    
    const resultDiv = document.getElementById('ai-report-result');
    const contentDiv = document.getElementById('ai-report-content');
    const generateBtn = document.getElementById('generate-report-btn');
    const downloadBtn = document.getElementById('download-report-btn');
    
    // Show loading state
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<div class="loading-spinner"></div> Generando...';
    
    try {
      // Prepare data for AI analysis
      const reportData = await this.prepareReportData(period);
      
      // Generate report with AI using ReportManager
      const report = await this.reports.generateAIReport(reportData, focus, questions);
      
      // Show result
      contentDiv.innerHTML = report;
      resultDiv.classList.remove('hidden');
      
      // Store report data for PDF generation
      this.currentReportData = reportData;
      this.currentReportContent = report;
      
      // Enable download button
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.onclick = () => this.handleDownloadReport();
      }
      
      this.ui.showAlert('Informe generado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error generating AI report:', error);
      this.ui.showAlert('Error al generar el informe', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<span>🤖</span> Generar Informe';
    }
  }
  
  async handleDownloadReport() {
    console.log('📄 Downloading report as PDF...');
    
    if (!this.currentReportContent || !this.currentReportData) {
      this.ui.showAlert('No hay informe para descargar', 'error');
      return;
    }
    
    try {
      const success = await this.reports.generatePDF(this.currentReportContent, this.currentReportData);
      
      if (success) {
        this.ui.showAlert('PDF generado exitosamente', 'success');
      } else {
        this.ui.showAlert('PDF generado como archivo HTML', 'info');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      this.ui.showAlert('Error al generar el PDF', 'error');
    }
  }
  
  async prepareReportData(period) {
    // Prepare financial data for AI analysis
    const currentMonth = this.getCurrentMonth();
    let months = [currentMonth];
    
    if (period === 'last3') {
      months = this.getLastMonths(3);
    } else if (period === 'last6') {
      months = this.getLastMonths(6);
    } else if (period === 'year') {
      months = this.getLastMonths(12);
    }
    
    const data = {
      period,
      months: months.length,
      totalExpenses: 0,
      totalIncome: 0,
      categories: {},
      goals: this.data.getGoals(),
      spendingLimits: this.data.getSpendingLimits()
    };
    
    // Aggregate data from all months
    for (const month of months) {
      const expenses = await this.data.loadExpenses(month);
      const income = await this.data.loadIncome(month);
      const extraIncomes = await this.data.loadExtraIncomes(month);
      
      data.totalExpenses += expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      data.totalIncome += parseFloat(income.fixed) + parseFloat(income.extra) + 
                         extraIncomes.reduce((sum, extra) => sum + parseFloat(extra.amount), 0);
      
      // Aggregate by category
      expenses.forEach(exp => {
        data.categories[exp.category] = (data.categories[exp.category] || 0) + parseFloat(exp.amount);
      });
    }
    
    return data;
  }
  
  getLastMonths(count) {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      months.push(monthKey);
    }
    
    return months;
  }
  
  // Expense management methods
  showEditExpenseModal(expenseId) {
    console.log('✏️ Edit expense:', expenseId);
    this.ui.showAlert('Función de editar gasto próximamente', 'info');
  }

  showDeleteConfirmation(expenseId, description) {
    if (confirm(`¿Estás seguro de que quieres eliminar "${description}"?`)) {
      this.deleteExpense(expenseId);
    }
  }

  async deleteExpense(expenseId) {
    try {
      await this.data.deleteExpense(expenseId);
      this.ui.showAlert('Gasto eliminado exitosamente', 'success');
      this.updateDashboard();
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.ui.showAlert('Error al eliminar el gasto', 'error');
    }
  }

  // Goal management methods
  addToGoal(goalId) {
    console.log('💰 Add to goal:', goalId);
    
    const goal = this.data.getGoals().find(g => g.id === goalId);
    if (!goal) {
      this.ui.showAlert('Objetivo no encontrado', 'error');
      return;
    }
    
    this.ui.showAddMoneyModal(goal);
  }

  editGoal(goalId) {
    console.log('✏️ Edit goal:', goalId);
    
    const goal = this.data.getGoals().find(g => g.id === goalId);
    if (!goal) {
      this.ui.showAlert('Objetivo no encontrado', 'error');
      return;
    }
    
    this.ui.showEditGoalModal(goal);
  }

  async deleteGoal(goalId, goalName) {
    if (confirm(`¿Estás seguro de que quieres eliminar el objetivo "${goalName}"?`)) {
      try {
        const success = await this.data.deleteGoal(goalId);
        if (success) {
          this.ui.showAlert('Objetivo eliminado exitosamente', 'success');
          this.updateDashboard();
        } else {
          this.ui.showAlert('Error al eliminar el objetivo', 'error');
        }
      } catch (error) {
        console.error('Error deleting goal:', error);
        this.ui.showAlert('Error al eliminar el objetivo', 'error');
      }
    }
  }

  async handleEditGoal(e) {
    e.preventDefault();
    console.log('✏️ Handling edit goal...');
    
    const modal = document.getElementById('edit-goal-modal');
    const goalId = modal.dataset.goalId;
    
    if (!goalId) {
      this.ui.showAlert('Error: ID de objetivo no encontrado', 'error');
      return;
    }
    
    const formData = this.ui.getFormData('edit-goal-form');
    
    if (!formData.name || !formData.targetAmount) {
      this.ui.showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }
    
    try {
      const updates = {
        name: formData.name,
        target_amount: parseFloat(formData.targetAmount),
        current_amount: parseFloat(formData.currentAmount) || 0
      };
      
      const success = await this.data.updateGoal(goalId, updates);
      
      if (success) {
        this.modals.hide('edit-goal-modal');
        this.ui.showAlert('Objetivo actualizado exitosamente', 'success');
        this.updateDashboard();
      } else {
        this.ui.showAlert('Error al actualizar el objetivo', 'error');
      }
      
    } catch (error) {
      console.error('Error editing goal:', error);
      this.ui.showAlert('Error al actualizar el objetivo', 'error');
    }
  }

  async handleAddMoney(e) {
    e.preventDefault();
    console.log('💰 Handling add money to goal...');
    
    const modal = document.getElementById('add-money-modal');
    const goalId = modal.dataset.goalId;
    
    if (!goalId) {
      this.ui.showAlert('Error: ID de objetivo no encontrado', 'error');
      return;
    }
    
    const formData = this.ui.getFormData('add-money-form');
    
    if (!formData.amount) {
      this.ui.showAlert('Por favor ingresa un monto', 'error');
      return;
    }
    
    try {
      const result = await this.data.addMoneyToGoal(goalId, formData.amount);
      
      if (result.success) {
        this.modals.hide('add-money-modal');
        
        if (result.completed) {
          this.ui.showAlert('¡Felicitaciones! Has completado tu objetivo de ahorro 🎉', 'success');
        } else {
          this.ui.showAlert(`Dinero agregado exitosamente. Nuevo total: ${this.ui.formatCurrency(result.goal.current_amount)}`, 'success');
        }
        
        this.updateDashboard();
      }
      
    } catch (error) {
      console.error('Error adding money to goal:', error);
      this.ui.showAlert(error.message || 'Error al agregar dinero al objetivo', 'error');
    }
  }

  // Category management methods
  async deleteCategory(categoryId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await this.data.deleteCategory(categoryId);
        this.ui.showAlert('Categoría eliminada exitosamente', 'success');
        
        // Update categories list
        const categories = this.data.getCategories();
        this.ui.updateCategoriesManagementList(categories);
        
        // Update selects
        this.ui.updateCategoriesSelect(categories, 'expense-category');
        this.ui.updateCategoriesSelect(categories, 'category-filter');
        this.ui.updateCategoriesSelect(categories, 'limit-category');
        
      } catch (error) {
        console.error('Error deleting category:', error);
        this.ui.showAlert('Error al eliminar la categoría', 'error');
      }
    }
  }
  // Spending limit management methods
  editSpendingLimit(limitId) {
    console.log('✏️ Edit spending limit:', limitId);
    this.ui.showAlert('Función de editar límite próximamente', 'info');
  }

  async deleteSpendingLimit(limitId) {
    if (confirm('¿Estás seguro de que quieres eliminar este límite de gasto?')) {
      try {
        await this.data.deleteSpendingLimit(limitId);
        this.ui.showAlert('Límite eliminado exitosamente', 'success');
        this.updateDashboard();
      } catch (error) {
        console.error('Error deleting spending limit:', error);
        this.ui.showAlert('Error al eliminar el límite', 'error');
      }
    }
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