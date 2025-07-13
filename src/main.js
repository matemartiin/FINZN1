import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { ChartManager } from './modules/charts.js';
import { ModalManager } from './modules/modals.js';
import { ChatManager } from './modules/chat.js';
import { ReportManager } from './modules/reports.js';
import { ThemeManager } from './modules/theme.js';
import { NavigationManager } from './modules/navigation.js';

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
      
      // Modal events
      this.setupModalEvents();
      
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
    const addExpenseBtnSection = document.getElementById('add-expense-btn');
    
    if (addExpenseBtn) {
      addExpenseBtn.addEventListener('click', () => this.showAddExpenseModal());
    }
    
    if (addExpenseBtnSection) {
      addExpenseBtnSection.addEventListener('click', () => this.showAddExpenseModal());
    }
    
    // Add income button
    const addIncomeBtn = document.getElementById('add-income-btn-dashboard');
    if (addIncomeBtn) {
      addIncomeBtn.addEventListener('click', () => this.showAddIncomeModal());
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
    const addSpendingLimitBtn = document.getElementById('add-spending-limit-btn');
    if (addSpendingLimitBtn) {
      addSpendingLimitBtn.addEventListener('click', () => this.showAddSpendingLimitModal());
    }
    
    // Settings buttons
    const manageLimitsBtn = document.getElementById('manage-limits-btn');
    if (manageLimitsBtn) {
      manageLimitsBtn.addEventListener('click', () => this.navigation.showSection('settings'));
    }
  }

  setupModalEvents() {
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
    
    // Add spending limit form
    const addSpendingLimitForm = document.getElementById('add-spending-limit-form');
    if (addSpendingLimitForm) {
      addSpendingLimitForm.addEventListener('submit', (e) => this.handleAddSpendingLimit(e));
    }
    
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
      await this.data.loadUserData();
      
      // Update categories in selects
      const categories = this.data.getCategories();
      this.ui.updateCategoriesSelect(categories, 'expense-category');
      this.ui.updateCategoriesSelect(categories, 'category-filter');
      this.ui.updateCategoriesSelect(categories, 'limit-category');
      
      console.log('✅ User data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  }

  async updateDashboard() {
    console.log('🔄 Updating dashboard for month:', this.currentMonth);
    
    try {
      // Load current month data
      const expenses = await this.data.loadExpenses(this.currentMonth);
      const income = await this.data.loadIncome(this.currentMonth);
      
      // Calculate balance
      const balance = this.data.calculateBalance(this.currentMonth);
      
      // Update UI
      this.ui.updateBalance(balance);
      this.ui.updateExpensesList(expenses, this);
      
      // Update goals
      const goals = this.data.getGoals();
      this.ui.updateGoalsList(goals);
      
      // Update spending limits
      const spendingLimits = this.data.getSpendingLimits();
      this.ui.updateSpendingLimitsList(spendingLimits, expenses);
      
      // Check spending limit alerts
      const limitAlerts = this.data.checkSpendingLimits(this.currentMonth);
      limitAlerts.forEach(alert => {
        this.ui.showAlert(alert.message, alert.type);
      });
      
      // Update charts
      const expensesByCategory = this.data.getExpensesByCategory(this.currentMonth);
      this.charts.updateExpensesChart(expensesByCategory);
      
      // Show mascot message based on balance
      if (balance.available < 0) {
        this.ui.showMascotAlert('¡Cuidado! Estás gastando más de lo que ingresas', 'warning');
      } else if (balance.available > balance.totalIncome * 0.2) {
        this.ui.showMascotAlert('¡Excelente! Tienes un buen balance este mes', 'success');
      }
      
    } catch (error) {
      console.error('❌ Error updating dashboard:', error);
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
    this.modals.show('add-spending-limit-modal');
  }
  showInstallmentsModal() {
    console.log('📊 Show installments modal');
    this.ui.showAlert('Función de cuotas próximamente', 'info');
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
        const monthlyAmount = expenseData.amount / installmentsCount;
        
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
            transactionDate: installmentDate.toISOString().split('T')[0]
          };
          
          await this.data.addExpense(installmentData);
        }
      } else {
        await this.data.addExpense(expenseData);
      }
      
      this.modals.hide('add-expense-modal');
      this.ui.showAlert('Gasto agregado exitosamente', 'success');
      this.updateDashboard();
      
    } catch (error) {
      console.error('Error adding expense:', error);
      this.ui.showAlert('Error al agregar el gasto', 'error');
    }
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
      const currentIncome = this.data.getIncome(this.currentMonth);
      
      if (formData.type === 'fixed') {
        await this.data.updateIncome(this.currentMonth, {
          fixed: parseFloat(formData.amount),
          extra: currentIncome.extra
        });
      } else {
        await this.data.updateIncome(this.currentMonth, {
          fixed: currentIncome.fixed,
          extra: currentIncome.extra + parseFloat(formData.amount)
        });
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
    this.ui.showAlert('Función de agregar a objetivo próximamente', 'info');
  }

  editGoal(goalId) {
    console.log('✏️ Edit goal:', goalId);
    this.ui.showAlert('Función de editar objetivo próximamente', 'info');
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