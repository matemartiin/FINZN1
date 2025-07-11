import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { ChartManager } from './modules/charts.js';
import { ModalManager } from './modules/modals.js';
import { ChatManager } from './modules/chat.js';
import { ReportManager } from './modules/reports.js';
import { ThemeManager } from './modules/theme.js';
import { NavigationManager } from './modules/navigation.js';

class FinznApp {
  constructor() {
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
    this.currentExpenseId = null; // For editing expenses
    this.init();
  }

  async init() {
    // Initialize theme first
    this.theme.init();
    
    // Initialize navigation
    this.navigation.init();
    
    // Check if user is already logged in
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      this.showApp();
      await this.loadUserData();
    } else {
      this.showAuth();
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Auth events
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
    document.getElementById('show-register').addEventListener('click', () => this.showRegister());
    document.getElementById('show-login').addEventListener('click', () => this.showLogin());
    
    // Logout event
    document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

    // App events
    document.getElementById('month-select').addEventListener('change', (e) => this.handleMonthChange(e));
    document.getElementById('theme-toggle').addEventListener('click', () => this.theme.toggle());
    
    // Installments popup
    document.getElementById('installments-btn').addEventListener('click', () => this.showInstallmentsPopup());
    
    // Expense management
    document.getElementById('add-expense-btn').addEventListener('click', () => this.showAddExpenseModal());
    document.getElementById('expense-form').addEventListener('submit', (e) => this.handleExpenseSubmit(e));
    
    // Delete confirmation
    document.getElementById('confirm-delete-btn').addEventListener('click', () => this.confirmDelete());
    
    // Income management
    document.getElementById('add-income-btn-dashboard').addEventListener('click', () => this.showIncomeModal());
    document.getElementById('fixed-income-form-modal').addEventListener('submit', (e) => this.handleFixedIncomeModal(e));
    document.getElementById('extra-income-form-modal').addEventListener('submit', (e) => this.handleExtraIncomeModal(e));
    document.getElementById('extra-income-form').addEventListener('submit', (e) => this.handleExtraIncome(e));
    
    // Extra incomes indicator
    document.getElementById('extra-incomes-indicator').addEventListener('click', () => this.showExtraIncomesModal());
    document.getElementById('add-extra-income-from-modal').addEventListener('click', () => {
      this.modals.hide('extra-incomes-modal');
      this.modals.show('extra-income-modal');
    });
    
    // Goals management
    const addGoalBtnSection = document.getElementById('add-goal-btn-section');
    
    if (addGoalBtnSection) {
      addGoalBtnSection.addEventListener('click', () => this.modals.show('goal-modal'));
    }
    
    document.getElementById('goal-form').addEventListener('submit', (e) => this.handleAddGoal(e));
    
    // Categories management
    document.getElementById('add-category-btn').addEventListener('click', () => this.modals.show('category-modal'));
    document.getElementById('category-form').addEventListener('submit', (e) => this.handleAddCategory(e));
    
    // Spending limits management
    document.getElementById('add-expense-btn-dashboard').addEventListener('click', () => this.showAddExpenseModal());
    document.getElementById('add-limit-btn-expenses').addEventListener('click', () => this.showAddLimitModal());
    document.getElementById('limit-form').addEventListener('submit', (e) => this.handleAddLimit(e));
    
    // Reports and exports
    document.getElementById('generate-report-btn').addEventListener('click', () => this.generateReport());
    document.getElementById('export-csv-btn').addEventListener('click', () => this.exportCSV());
    document.getElementById('import-csv').addEventListener('change', (e) => this.importCSV(e));
    
    // Search
    const expenseSearch = document.getElementById('expense-search');
    if (expenseSearch) {
      expenseSearch.addEventListener('input', (e) => this.handleSearch(e));
    }
    
    // Chat
    this.chat.init();
    
    // Modal events
    this.modals.init();
    
    // Income modal tab switching
    this.setupIncomeModalTabs();
  }

  async handleLogin(e) {
    e.preventDefault();
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
    const username = document.getElementById('register-user').value;
    const password = document.getElementById('register-pass').value;

    if (!username || !password) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }

    if (password.length < 4) {
      this.ui.showAlert('La contraseña debe tener al menos 4 caracteres', 'error');
      return;
    }

    try {
      const success = await this.auth.register(username, password);
      if (success) {
        this.showLogin();
        this.ui.showAlert('Cuenta creada exitosamente. Ahora puedes iniciar sesión.', 'success');
      } else {
        this.ui.showAlert('Error al crear la cuenta. El usuario ya existe.', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      this.ui.showAlert('Error al registrar usuario', 'error');
    }
  }

  handleLogout() {
    // Show confirmation dialog
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      this.ui.showAlert('Cerrando sesión...', 'info');
      
      // Small delay to show the alert before logout
      setTimeout(() => {
        this.auth.logout();
      }, 1000);
    }
  }

  showAuth() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  showApp() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    // Update user info
    const currentUser = this.auth.getCurrentUser();
    document.getElementById('user-name').textContent = `👤 ${currentUser}`;
    
    // Initialize month selector
    this.initMonthSelector();
  }

  showLogin() {
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    // Clear any error messages
    document.getElementById('register-error').textContent = '';
    document.getElementById('login-error').textContent = '';
  }

  showRegister() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.remove('hidden');
    // Clear any error messages
    document.getElementById('register-error').textContent = '';
    document.getElementById('login-error').textContent = '';
  }

  async loadUserData() {
    await this.data.loadUserData();
    this.updateUI();
  }

  initMonthSelector() {
    const select = document.getElementById('month-select');
    select.innerHTML = '';
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Generate options for current year and next year
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = new Date(year, month - 1).toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long' 
        });
        select.appendChild(option);
      }
    }
    
    select.value = this.currentMonth;
  }

  handleMonthChange(e) {
    const previousMonth = this.currentMonth;
    this.currentMonth = e.target.value;
    
    // Save previous month's balance as savings if it's a valid previous month
    if (previousMonth && previousMonth !== this.currentMonth) {
      this.savePreviousMonthBalance(previousMonth);
    }
    
    this.updateUI();
  }

  savePreviousMonthBalance(previousMonth) {
    const balance = this.data.getBalance(previousMonth);
    if (balance.available > 0) {
      this.data.saveMonthlySavings(previousMonth, balance.available);
      console.log(`Saved ${this.ui.formatCurrency(balance.available)} as savings for ${previousMonth}`);
    }
  }

  showInstallmentsPopup() {
    const installments = this.data.getActiveInstallments(this.currentMonth);
    this.ui.showInstallmentsModal(installments);
    this.modals.show('installments-modal');
  }

  showAddExpenseModal() {
    this.currentExpenseId = null;
    this.resetExpenseForm();
    // Set default date to today
    document.getElementById('expense-transaction-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-modal-title').textContent = 'Nuevo Gasto';
    document.getElementById('expense-submit-btn').textContent = 'Agregar Gasto';
    document.getElementById('expense-edit-mode').value = 'false';
    this.modals.show('expense-modal');
  }

  showEditExpenseModal(expenseId) {
    const expense = this.data.getExpenseById(expenseId, this.currentMonth);
    if (!expense) {
      this.ui.showAlert('Gasto no encontrado', 'error');
      return;
    }

    this.currentExpenseId = expenseId;
    this.populateExpenseForm(expense);
    document.getElementById('expense-modal-title').textContent = 'Editar Gasto';
    document.getElementById('expense-submit-btn').textContent = 'Guardar Cambios';
    document.getElementById('expense-edit-mode').value = 'true';
    this.modals.show('expense-modal');
  }

  resetExpenseForm() {
    document.getElementById('expense-form').reset();
    document.getElementById('expense-id').value = '';
  }

  populateExpenseForm(expense) {
    document.getElementById('expense-id').value = expense.id;
    document.getElementById('expense-description').value = expense.description;
    document.getElementById('expense-amount').value = expense.originalAmount || expense.amount;
    document.getElementById('expense-category').value = expense.category;
    document.getElementById('expense-transaction-date').value = expense.transactionDate || new Date().toISOString().split('T')[0];
    document.getElementById('expense-installments').value = expense.totalInstallments || 1;
    document.getElementById('expense-recurring').checked = expense.recurring || false;
  }

  async handleExpenseSubmit(e) {
    e.preventDefault();
    
    const isEditMode = document.getElementById('expense-edit-mode').value === 'true';
    
    if (isEditMode) {
      await this.handleEditExpense(e);
    } else {
      await this.handleAddExpense(e);
    }
  }

  setupIncomeModalTabs() {
    const tabs = document.querySelectorAll('.income-type-tab');
    const forms = document.querySelectorAll('.income-form-section');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-type');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding form
        forms.forEach(form => {
          form.classList.remove('active');
          if (form.id.includes(type)) {
            form.classList.add('active');
          }
        });
      });
    });
  }

  showIncomeModal() {
    // Reset to fixed income tab by default
    const tabs = document.querySelectorAll('.income-type-tab');
    const forms = document.querySelectorAll('.income-form-section');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));
    
    document.querySelector('[data-type="fixed"]').classList.add('active');
    document.getElementById('fixed-income-form-modal').classList.add('active');
    
    this.modals.show('income-modal');
  }

  async handleFixedIncomeModal(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('fixed-income-amount-modal').value);
    
    if (!amount || amount <= 0) {
      this.ui.showAlert('Por favor ingresa un monto válido', 'error');
      return;
    }

    try {
      await this.data.setFixedIncome(amount);
      this.modals.hide('income-modal');
      e.target.reset();
      this.updateUI();
      this.ui.showAlert(`💼 Ingreso fijo de ${this.ui.formatCurrency(amount)} configurado exitosamente`, 'success');
    } catch (error) {
      console.error('Error setting fixed income:', error);
      this.ui.showAlert('Error al configurar el ingreso fijo', 'error');
    }
  }

  async handleExtraIncomeModal(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const description = formData.get('description')?.trim() || '';
    const amountString = formData.get('amount') || '';
    const category = formData.get('category') || '';
    
    // Validation
    if (!description) {
      this.ui.showAlert('Por favor ingresa una descripción', 'error');
      return;
    }

    if (!amountString || amountString.trim() === '') {
      this.ui.showAlert('Por favor ingresa un monto', 'error');
      return;
    }

    const amount = parseFloat(amountString);
    if (isNaN(amount) || amount <= 0) {
      this.ui.showAlert('Por favor ingresa un monto válido mayor a 0', 'error');
      return;
    }

    if (!category) {
      this.ui.showAlert('Por favor selecciona una categoría', 'error');
      return;
    }

    const extraIncome = {
      description,
      amount,
      category,
      date: this.currentMonth
    };

    try {
      await this.data.addExtraIncome(extraIncome, this.currentMonth);
      this.modals.hide('income-modal');
      e.target.reset();
      this.updateUI();
      this.ui.showAlert(`✨ Ingreso extra de ${this.ui.formatCurrency(amount)} agregado exitosamente`, 'success');
    } catch (error) {
      console.error('Error adding extra income:', error);
      this.ui.showAlert('Error al agregar el ingreso extra', 'error');
    }
  }

  showAddLimitModal() {
    // Update category options in limit modal
    this.ui.updateLimitCategoryOptions(this.data.getCategories());
    this.modals.show('limit-modal');
  }

  async handleAddLimit(e) {
    e.preventDefault();
    
    const limit = {
      category: document.getElementById('limit-category').value,
      amount: parseFloat(document.getElementById('limit-amount').value),
      warning: parseInt(document.getElementById('limit-warning').value) || 80
    };

    if (!limit.category || !limit.amount || limit.amount <= 0) {
      this.ui.showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (limit.warning < 50 || limit.warning > 100) {
      this.ui.showAlert('El porcentaje de alerta debe estar entre 50% y 100%', 'error');
      return;
    }

    try {
      await this.data.addSpendingLimit(limit);
      this.modals.hide('limit-modal');
      e.target.reset();
      this.updateUI();
      this.ui.showAlert('Límite de gasto establecido exitosamente', 'success');
    } catch (error) {
      console.error('Error adding spending limit:', error);
      this.ui.showAlert('Error al establecer el límite', 'error');
    }
  }

  async handleAddExpense(e) {
    e.preventDefault();
    
    const expense = {
      description: document.getElementById('expense-description').value,
      amount: parseFloat(document.getElementById('expense-amount').value),
      category: document.getElementById('expense-category').value,
      transactionDate: document.getElementById('expense-transaction-date').value,
      installments: parseInt(document.getElementById('expense-installments').value) || 1,
      recurring: document.getElementById('expense-recurring').checked,
      date: this.currentMonth
    };

    if (!expense.description || !expense.amount || !expense.category || !expense.transactionDate) {
      this.ui.showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (expense.amount <= 0) {
      this.ui.showAlert('El monto debe ser mayor a 0', 'error');
      return;
    }

    // Validate transaction date
    const transactionDate = new Date(expense.transactionDate);
    const today = new Date();
    if (transactionDate > today) {
      this.ui.showAlert('La fecha del gasto no puede ser futura', 'error');
      return;
    }

    try {
      await this.data.addExpense(expense);
      this.modals.hide('expense-modal');
      e.target.reset();
      this.updateUI();
      this.checkSpendingLimits(); // Check limits after adding expense
      this.ui.showAlert('Gasto agregado exitosamente', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      this.ui.showAlert('Error al agregar el gasto', 'error');
    }
  }

  async handleEditExpense(e) {
    e.preventDefault();
    
    const expenseData = {
      id: this.currentExpenseId,
      description: document.getElementById('expense-description').value,
      amount: parseFloat(document.getElementById('expense-amount').value),
      category: document.getElementById('expense-category').value,
      transactionDate: document.getElementById('expense-transaction-date').value,
      installments: parseInt(document.getElementById('expense-installments').value) || 1,
      recurring: document.getElementById('expense-recurring').checked
    };

    if (!expenseData.description || !expenseData.amount || !expenseData.category || !expenseData.transactionDate) {
      this.ui.showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (expenseData.amount <= 0) {
      this.ui.showAlert('El monto debe ser mayor a 0', 'error');
      return;
    }

    // Validate transaction date
    const transactionDate = new Date(expenseData.transactionDate);
    const today = new Date();
    if (transactionDate > today) {
      this.ui.showAlert('La fecha del gasto no puede ser futura', 'error');
      return;
    }

    try {
      await this.data.updateExpense(this.currentExpenseId, expenseData, this.currentMonth);
      this.modals.hide('expense-modal');
      this.updateUI();
      this.checkSpendingLimits(); // Check limits after updating expense
      this.ui.showAlert('Gasto actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error updating expense:', error);
      this.ui.showAlert('Error al actualizar el gasto', 'error');
    }
  }

  showDeleteConfirmation(expenseId, expenseDescription) {
    this.currentExpenseId = expenseId;
    document.getElementById('delete-confirmation-message').textContent = 
      `¿Estás seguro de que quieres eliminar el gasto "${expenseDescription}"?`;
    this.modals.show('delete-confirmation-modal');
  }

  async confirmDelete() {
    if (!this.currentExpenseId) return;

    try {
      await this.data.deleteExpense(this.currentExpenseId, this.currentMonth);
      this.modals.hide('delete-confirmation-modal');
      this.updateUI();
      this.checkSpendingLimits(); // Check limits after deleting expense
      this.ui.showAlert('Gasto eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.ui.showAlert('Error al eliminar el gasto', 'error');
    }
  }

  checkSpendingLimits() {
    const limits = this.data.getSpendingLimits();
    const expensesByCategory = this.data.getExpensesByCategory(this.currentMonth);
    
    limits.forEach(limit => {
      const spent = expensesByCategory[limit.category] || 0;
      const percentage = (spent / limit.amount) * 100;
      
      if (percentage >= limit.warning) {
        let message = '';
        let alertType = 'warning';
        
        if (percentage >= 100) {
          message = `¡Has superado el límite de ${limit.category}! Gastaste ${this.ui.formatCurrency(spent)} de ${this.ui.formatCurrency(limit.amount)}`;
          alertType = 'danger';
        } else if (percentage >= limit.warning) {
          message = `¡Cuidado! Estás cerca del límite en ${limit.category}. Has gastado ${Math.round(percentage)}% (${this.ui.formatCurrency(spent)} de ${this.ui.formatCurrency(limit.amount)})`;
        }
        
        if (message) {
          this.ui.showMascotAlert(message, alertType);
        }
      }
    });
  }

  async handleFixedIncome(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('fixed-income-input').value);
    
    if (!amount || amount <= 0) {
      this.ui.showAlert('Por favor ingresa un monto válido', 'error');
      return;
    }

    try {
      await this.data.setFixedIncome(amount);
      document.getElementById('fixed-income-input').value = '';
      this.updateUI();
      this.ui.showAlert('Ingreso fijo actualizado', 'success');
    } catch (error) {
      console.error('Error setting fixed income:', error);
      this.ui.showAlert('Error al actualizar el ingreso', 'error');
    }
  }

  async handleExtraIncome(e) {
    e.preventDefault();
    console.log('🔥 STARTING EXTRA INCOME PROCESS');
    
    // Get form data using FormData API - this is more reliable
    const formData = new FormData(e.target);
    
    console.log('📋 FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}: "${value}"`);
    }
    
    // Extract values from FormData
    const description = formData.get('description')?.trim() || '';
    const amountString = formData.get('amount') || '';
    const category = formData.get('category') || '';
    
    console.log('📝 Extracted values:', {
      description: `"${description}"`,
      amountString: `"${amountString}"`,
      category: `"${category}"`
    });

    // Validation
    if (!description) {
      console.log('❌ VALIDATION FAILED: Empty description');
      this.ui.showAlert('Por favor ingresa una descripción', 'error');
      return;
    }

    if (!amountString || amountString.trim() === '') {
      console.log('❌ VALIDATION FAILED: Empty amount string');
      this.ui.showAlert('Por favor ingresa un monto', 'error');
      return;
    }

    // Parse amount
    const amount = parseFloat(amountString);
    console.log('🔢 Parsed amount:', amount);

    if (isNaN(amount)) {
      console.log('❌ VALIDATION FAILED: Amount is NaN');
      this.ui.showAlert('Por favor ingresa un monto válido (solo números)', 'error');
      return;
    }

    if (amount <= 0) {
      console.log('❌ VALIDATION FAILED: Amount is not positive');
      this.ui.showAlert('El monto debe ser mayor a 0', 'error');
      return;
    }

    if (!category) {
      console.log('❌ VALIDATION FAILED: No category selected');
      this.ui.showAlert('Por favor selecciona una categoría', 'error');
      return;
    }

    const extraIncome = {
      description,
      amount,
      category,
      date: this.currentMonth
    };

    console.log('✅ FINAL EXTRA INCOME OBJECT:', extraIncome);

    try {
      console.log('💾 SAVING TO DATA MANAGER...');
      await this.data.addExtraIncome(extraIncome, this.currentMonth);
      console.log('✅ SAVED SUCCESSFULLY!');
      
      this.modals.hide('extra-income-modal');
      e.target.reset();
      this.updateUI();
      this.ui.showAlert(`✅ Ingreso extra de $${amount.toLocaleString()} agregado exitosamente`, 'success');
    } catch (error) {
      console.error('❌ ERROR SAVING:', error);
      this.ui.showAlert('Error al agregar el ingreso extra', 'error');
    }
  }

  async handleAddGoal(e) {
    e.preventDefault();
    
    const goal = {
      name: document.getElementById('goal-name').value,
      target: parseFloat(document.getElementById('goal-target').value),
      current: parseFloat(document.getElementById('goal-current').value) || 0
    };

    if (!goal.name || !goal.target || goal.target <= 0) {
      this.ui.showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      await this.data.addGoal(goal);
      this.modals.hide('goal-modal');
      e.target.reset();
      this.updateUI();
      this.ui.showAlert('Objetivo creado exitosamente', 'success');
    } catch (error) {
      console.error('Error adding goal:', error);
      this.ui.showAlert('Error al crear el objetivo', 'error');
    }
  }

  async handleAddCategory(e) {
    e.preventDefault();
    
    const category = {
      name: document.getElementById('category-name').value,
      icon: document.getElementById('category-icon').value || '🏷️',
      color: document.getElementById('category-color').value
    };

    if (!category.name) {
      this.ui.showAlert('Por favor ingresa un nombre para la categoría', 'error');
      return;
    }

    try {
      await this.data.addCategory(category);
      this.modals.hide('category-modal');
      e.target.reset();
      this.updateUI();
      this.ui.showAlert('Categoría creada exitosamente', 'success');
    } catch (error) {
      console.error('Error adding category:', error);
      this.ui.showAlert('Error al crear la categoría', 'error');
    }
  }

  handleSearch(e) {
    const query = e.target.value.toLowerCase();
    this.ui.filterExpenses(query);
  }

  async generateReport() {
    try {
      const reportData = await this.data.generateReport(this.currentMonth);
      this.reports.generate(reportData);
      this.modals.show('report-modal');
    } catch (error) {
      console.error('Error generating report:', error);
      this.ui.showAlert('Error al generar el informe', 'error');
    }
  }

  async exportCSV() {
    try {
      const csvData = await this.data.exportToCSV();
      this.downloadFile(csvData, 'finzn-export.csv', 'text/csv');
      this.ui.showAlert('Datos exportados exitosamente', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      this.ui.showAlert('Error al exportar los datos', 'error');
    }
  }

  async importCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      await this.data.importFromCSV(text);
      this.updateUI();
      this.ui.showAlert('Datos importados exitosamente', 'success');
    } catch (error) {
      console.error('Error importing CSV:', error);
      this.ui.showAlert('Error al importar los datos', 'error');
    }
  }

  updateUI() {
    // Update summary cards
    const balance = this.data.getBalance(this.currentMonth);
    const income = this.data.getIncome(this.currentMonth);
    const extraIncomes = this.data.getExtraIncomes(this.currentMonth);
    
    // Update new dashboard elements
    const monthlyExpensesSummary = document.getElementById('monthly-expenses-summary');
    const incomeSummary = document.getElementById('income-summary');
    const balanceAmountNew = document.getElementById('balance-amount-new');
    const installmentsCount = document.getElementById('installments-count');
    const extraIncomesIndicator = document.getElementById('extra-incomes-indicator');
    const extraIncomesCount = document.querySelector('#extra-incomes-indicator .indicator-count');
    
    if (monthlyExpensesSummary) {
      monthlyExpensesSummary.textContent = this.ui.formatCurrency(balance.totalExpenses);
    }
    if (incomeSummary) {
      incomeSummary.textContent = this.ui.formatCurrency(income.fixed + income.extra);
    }
    if (balanceAmountNew) {
      balanceAmountNew.textContent = this.ui.formatCurrency(balance.available);
    }
    if (installmentsCount) {
      installmentsCount.textContent = balance.installments;
    }
    
    // Update extra incomes indicator
    if (extraIncomesIndicator && extraIncomesCount) {
      if (extraIncomes.length > 0) {
        extraIncomesIndicator.classList.remove('hidden');
        extraIncomesCount.textContent = extraIncomes.length;
      } else {
        extraIncomesIndicator.classList.add('hidden');
      }
    }
    
    // Update goals in new layout
    this.ui.updateGoalsListNew(this.data.getGoals());
    
    // Update traditional UI elements
    this.ui.updateBalance(balance);
    this.ui.updateExpensesList(this.data.getExpenses(this.currentMonth), this);
    this.ui.updateGoalsList(this.data.getGoals());
    this.ui.updateCategoriesList(this.data.getCategories());
    this.ui.updateIncomeDisplay(income);
    this.ui.updateStats(this.data.getStats());
    this.ui.updateAchievements(this.data.getAchievements());
    this.ui.updateSpendingLimitsList(this.data.getSpendingLimits(), this.data.getExpensesByCategory(this.currentMonth));
    this.ui.updateSpendingLimitsGrid(this.data.getSpendingLimits(), this.data.getExpensesByCategory(this.currentMonth));
    
    // Update charts
    this.charts.updateExpensesChart(this.data.getExpensesByCategory(this.currentMonth));
    this.charts.updateTrendChart(this.data.getMonthlyTrend());
    
    // Update category options in expense form
    this.ui.updateCategoryOptions(this.data.getCategories());
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  showExtraIncomesModal() {
    const extraIncomes = this.data.getAllExtraIncomes();
    this.ui.showExtraIncomesModal(extraIncomes);
    this.modals.show('extra-incomes-modal');
  }
}

// Make app globally accessible for debugging
window.app = null;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FinznApp();
});