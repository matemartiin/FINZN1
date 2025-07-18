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
    const addSpendingLimitBtn = document.getElementById('add-spending-limit-btn');
    const addSpendingLimitBtnExpenses = document.getElementById('add-spending-limit-btn-expenses');
    const addSpendingLimitBtnCard = document.getElementById('add-spending-limit-btn-card');
    
    if (addSpendingLimitBtn) {
      addSpendingLimitBtn.addEventListener('click', () => this.showAddSpendingLimitModal());
    }
    
    if (addSpendingLimitBtnExpenses) {
      addSpendingLimitBtnExpenses.addEventListener('click', () => this.showAddSpendingLimitModal());
    }
    
    if (addSpendingLimitBtnCard) {
      addSpendingLimitBtnCard.addEventListener('click', () => this.showAddSpendingLimitModal());
    }
    
    // Settings buttons
    const manageLimitsBtn = document.getElementById('manage-limits-btn');
    if (manageLimitsBtn) {
      manageLimitsBtn.addEventListener('click', () => this.navigation.showSection('settings'));
    }
    
    // Settings buttons
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    const importDataBtn = document.getElementById('import-data-btn');
    const generateAiReportBtn = document.getElementById('generate-ai-report-btn');
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
    
    if (backupDataBtn) {
      backupDataBtn.addEventListener('click', () => this.handleBackupData());
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
      
      // Update categories in selects
      const categories = this.data.getCategories();
      this.ui.updateCategoriesSelect(categories, 'expense-category');
      this.ui.updateCategoriesSelect(categories, 'category-filter');
      this.ui.updateCategoriesSelect(categories, 'limit-category');
      
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
      
      // Check spending limit alerts
      const limitAlerts = this.data.checkSpendingLimits(this.currentMonth);
      limitAlerts.forEach(alert => {
        this.ui.showAlert(alert.message, alert.type);
      });
      
      // Update charts
      const expensesByCategory = this.data.getExpensesByCategory(this.currentMonth);
      this.charts.updateExpensesChart(expensesByCategory);
      
      // Update trend chart
      const trendData = await this.data.getTrendData();
      this.charts.updateTrendChart(trendData);
      
      // Show mascot message based on balance
      if (balance.available < 0) {
        this.ui.showMascotAlert('¡Cuidado! Estás gastando más de lo que ingresas', 'warning');
      } else if (balance.available > balance.totalIncome * 0.2) {
        this.ui.showMascotAlert('¡Excelente! Tienes un buen balance este mes', 'success');
      }
      
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
    this.ui.showAlert('Función de agregar a objetivo próximamente', 'info');
  }

  editGoal(goalId) {
    console.log('✏️ Edit goal:', goalId);
    this.ui.showAlert('Función de editar objetivo próximamente', 'info');
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