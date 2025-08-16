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
import { AIBudgetManager } from './modules/ai-budget.js';
import { UserProfileManager } from './modules/user-profile.js';
import { AnimationManager } from './modules/animations.js';
import { DOMHelpers } from './utils/dom-helpers.js';


console.log('FINZN App - Starting initialization');

class FinznApp {
  constructor() {
    console.log('Constructing FINZN App');
    
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
    this.aiBudget = new AIBudgetManager();
    this.userProfile = new UserProfileManager();
    this.animations = new AnimationManager();
    
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

      // 🔧 Agregar esta línea:
this.setupModalEvents();
      
      // Initialize animations (before other UI elements)
      this.animations.init();
      
      // Initialize chat
      this.chat.init();
      
      // Initialize calendar
      this.calendar.init();
      
      // Initialize user profile
      this.userProfile.init();
      
      // Setup month selector
      this.setupMonthSelector();
      
      // Check authentication
      await this.auth.initializeAuth();
      const currentUser = this.auth.getCurrentUser();
      console.log('Current user:', currentUser);
      
      if (currentUser) {
        this.showApp();
        await this.loadUserData();
        
        // Check if user needs to complete profile
        await this.checkProfileCompletion();
        
        // Load calendar events after user data is loaded
        if (this.calendar) {
          await this.calendar.loadEvents();
        }
        
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

  async checkProfileCompletion() {
    // Wait a bit for profile to load
    setTimeout(async () => {
      console.log('👤 Checking profile completion...');
      
      // Force reload profile to ensure we have latest data
      await this.userProfile.loadUserProfile();
      
      const hasComplete = this.userProfile.hasCompleteProfile();
      console.log('👤 Has complete profile:', hasComplete);
      
      if (!this.userProfile.hasCompleteProfile()) {
        console.log('👤 User needs to complete profile');
        this.userProfile.showCompleteProfileModal();
      } else {
        console.log('👤 Profile is complete, updating header');
        this.userProfile.updateHeaderDisplay();
      }
    }, 1000);
  }

  setupEventListeners() {
    console.log('🔗 Setting up event listeners...');
    
    try {
      // Auth events
      this.setupAuthEvents();
      
      // Dashboard events
      this.setupDashboardEvents();

      const goReports = document.getElementById('go-reports');
if (goReports) {
  goReports.addEventListener('click', () => {
    if (window.app && window.app.navigation) {
      window.app.navigation.showSection('reports');
    }
  });
}


      
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

      // Event delegation for goals section buttons
      const goalsList = document.getElementById('goals-list');
      if (goalsList) {
        goalsList.addEventListener('click', (e) => {
          const button = e.target.closest('button[data-action]');
          if (!button) return;
          
          e.preventDefault();
          const action = button.getAttribute('data-action');
          const goalId = button.getAttribute('data-goal-id');
          const goalName = button.getAttribute('data-goal-name');
          
          switch (action) {
            case 'create-goal':
              this.showAddGoalModal();
              break;
            case 'add-money':
              if (goalId) this.addToGoal(goalId);
              break;
            case 'edit-goal':
              if (goalId) this.editGoal(goalId);
              break;
            case 'delete-goal':
              if (goalId && goalName) this.deleteGoal(goalId, goalName);
              break;
            default:
              console.warn('Unknown goal action:', action);
          }
        });
      }

      // Event delegation for budgets section buttons
      const budgetsList = document.getElementById('budgets-list');
      if (budgetsList) {
        budgetsList.addEventListener('click', (e) => {
          const button = e.target.closest('button[data-action]');
          if (!button) return;
          
          e.preventDefault();
          const action = button.getAttribute('data-action');
          const budgetId = button.getAttribute('data-budget-id');
          const budgetName = button.getAttribute('data-budget-name');
          
          switch (action) {
            case 'create-budget':
              this.showAddBudgetModal();
              break;
            case 'edit-budget':
              if (budgetId) this.showEditBudgetModal(budgetId);
              break;
            case 'delete-budget':
              if (budgetId && budgetName) this.deleteBudget(budgetId, budgetName);
              break;
            case 'analyze-budget':
              if (budgetId) this.generateBudgetInsights(budgetId);
              break;
            default:
              console.warn('Unknown budget action:', action);
          }
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
  // evita doble binding si alguien llama dos veces
  if (this._dashboardEventsBound) return;
  this._dashboardEventsBound = true;

  // ---- Botones principales ----
  const addExpenseBtn = document.getElementById('add-expense-btn-dashboard');
  if (addExpenseBtn) addExpenseBtn.addEventListener('click', () => this.showAddExpenseModal());

  const addExpenseBtnTransactions = document.getElementById('add-expense-btn-transactions');
  if (addExpenseBtnTransactions) addExpenseBtnTransactions.addEventListener('click', () => this.showAddExpenseModal());

  const addIncomeBtn = document.getElementById('add-income-btn-dashboard');
  if (addIncomeBtn) addIncomeBtn.addEventListener('click', () => this.showAddIncomeModal());

  const addIncomeBtnTransactions = document.getElementById('add-income-btn-transactions');
  if (addIncomeBtnTransactions) addIncomeBtnTransactions.addEventListener('click', () => this.showAddIncomeModal());

  const incomesIndicator = document.getElementById('incomes-indicator');
  if (incomesIndicator) incomesIndicator.addEventListener('click', () => this.showViewIncomesModal());

  const installmentsBtn = document.getElementById('installments-btn');
  if (installmentsBtn) installmentsBtn.addEventListener('click', () => this.showInstallmentsModal());

  const addGoalBtn = document.getElementById('add-goal-btn');
  if (addGoalBtn) addGoalBtn.addEventListener('click', () => this.showAddGoalModal());

  const addSpendingLimitBtnTransactions = document.getElementById('add-spending-limit-btn-transactions');
  if (addSpendingLimitBtnTransactions) addSpendingLimitBtnTransactions.addEventListener('click', () => this.showAddSpendingLimitModal());

  const manageCategoriesBtn = document.getElementById('manage-categories-btn');
  if (manageCategoriesBtn) manageCategoriesBtn.addEventListener('click', () => this.showManageCategoriesModal());

  const exportDataBtn = document.getElementById('export-data-btn');
  if (exportDataBtn) exportDataBtn.addEventListener('click', () => this.handleExportData());

  const importDataBtn = document.getElementById('import-data-btn');
  if (importDataBtn) importDataBtn.addEventListener('click', () => this.showImportDataModal());

  const generateAiReportBtn = document.getElementById('generate-ai-report-btn');
  if (generateAiReportBtn) generateAiReportBtn.addEventListener('click', () => this.showGenerateAiReportModal());

  const generateReportBtnSection = document.getElementById('generate-report-btn-section');
  if (generateReportBtnSection) generateReportBtnSection.addEventListener('click', () => this.showGenerateAiReportModal());

  const backupDataBtn = document.getElementById('backup-data-btn');
  if (backupDataBtn) backupDataBtn.addEventListener('click', () => this.handleBackupData());

  const addBudgetBtn = document.getElementById('add-budget-btn');
  if (addBudgetBtn) addBudgetBtn.addEventListener('click', () => this.showAddBudgetModal());

  const generateBudgetInsightsBtn = document.getElementById('generate-budget-insights-btn');
  if (generateBudgetInsightsBtn) generateBudgetInsightsBtn.addEventListener('click', () => this.generateAllBudgetInsights());

  // ---- Formularios (una sola vez) ----
  const addExpenseForm = document.getElementById('add-expense-form');
  if (addExpenseForm) addExpenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));

  const addIncomeForm = document.getElementById('add-income-form');
  if (addIncomeForm) addIncomeForm.addEventListener('submit', (e) => this.handleAddIncome(e));

  const addGoalForm = document.getElementById('add-goal-form');
  if (addGoalForm) addGoalForm.addEventListener('submit', (e) => this.handleAddGoal(e));

  const editGoalForm = document.getElementById('edit-goal-form');
  if (editGoalForm) editGoalForm.addEventListener('submit', (e) => this.handleEditGoal(e));

  const addMoneyForm = document.getElementById('add-money-form');
  if (addMoneyForm) addMoneyForm.addEventListener('submit', (e) => this.handleAddMoney(e));

  const addSpendingLimitForm = document.getElementById('add-spending-limit-form');
  if (addSpendingLimitForm) addSpendingLimitForm.addEventListener('submit', (e) => this.handleAddSpendingLimit(e));

  const addCategoryForm = document.getElementById('add-category-form');
  if (addCategoryForm) addCategoryForm.addEventListener('submit', (e) => this.handleAddCategory(e));

  const processImportBtn = document.getElementById('process-import-btn');
  if (processImportBtn) processImportBtn.addEventListener('click', () => this.handleImportData());

  const generateReportBtn = document.getElementById('generate-report-btn');
  if (generateReportBtn) generateReportBtn.addEventListener('click', () => this.handleGenerateAiReport());

  // ---- Delegación en lista de gastos ----
  const expensesList = document.getElementById('expenses-list');
  if (expensesList) {
    expensesList.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('js-expense-edit')) {
        const id = btn.dataset.id;
        if (id) this.showEditExpenseModal(id);
      }

      if (btn.classList.contains('js-expense-delete')) {
        const id = btn.dataset.id;
        const desc = btn.dataset.description || 'este gasto';
        if (id) this.showDeleteConfirmation(id, desc);
      }
    }); // ← cierra el click de expensesList
  } // ← cierra if (expensesList)

  // ---- Quick actions (una sola vez, fuera del click) ----
  const qaAddExpense = document.getElementById('qa-add-expense');
  if (qaAddExpense) qaAddExpense.addEventListener('click', () => this.showAddExpenseModal());

  const qaAddIncome = document.getElementById('qa-add-income');
  if (qaAddIncome) qaAddIncome.addEventListener('click', () => this.showAddIncomeModal());

  const qaImport = document.getElementById('qa-import');
  if (qaImport) qaImport.addEventListener('click', () => this.showImportDataModal());

  const qaAiReport = document.getElementById('qa-ai-report');
  if (qaAiReport) qaAiReport.addEventListener('click', () => this.showGenerateAiReportModal());

  const qaAddBudget = document.getElementById('qa-add-budget');
  if (qaAddBudget) qaAddBudget.addEventListener('click', () => this.showAddBudgetModal());

  // ---- “Ver todas” → Transacciones ----
  const goTransactions = document.getElementById('go-transactions');
  if (goTransactions) goTransactions.addEventListener('click', () => {
    this.navigation.showSection('transactions');
  });

  // ---- Submits de presupuesto / límite ----
  const addBudgetForm = document.getElementById('add-budget-form');
  if (addBudgetForm) addBudgetForm.addEventListener('submit', (e) => this.handleAddBudget(e));

  const editBudgetForm = document.getElementById('edit-budget-form');
  if (editBudgetForm) editBudgetForm.addEventListener('submit', (e) => this.handleEditBudget(e));

  const editLimitForm = document.getElementById('edit-limit-form');
  if (editLimitForm) editLimitForm.addEventListener('submit', (e) => this.handleEditLimitSubmit(e));

  // ---- Delegación en límites: vista principal ----
  const limitsList = document.getElementById('category-limits-display');
  if (limitsList) {
    limitsList.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('js-limit-edit')) {
        const id = btn.dataset.id;
        if (id) this.showEditLimitModal(id);
      }
      if (btn.classList.contains('js-limit-delete')) {
        const id = btn.dataset.id;
        if (id) this.deleteSpendingLimit(id);
      }
    });
  }

  // ---- Delegación en límites: resumen del dashboard ----
  const limitsSummary = document.getElementById('spending-limits-summary');
  if (limitsSummary) {
    limitsSummary.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.classList.contains('js-limit-edit')) {
        const id = btn.dataset.id;
        if (id) this.showEditLimitModal(id);
      }
      if (btn.classList.contains('js-limit-delete')) {
        const id = btn.dataset.id;
        if (id) this.deleteSpendingLimit(id);
      }
    });
  }
} // ← cierra setupDashboardEvents

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

  showAddIncomeModal() {
    console.log('💰 Show add income modal');
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('income-date');
    if (dateInput) {
      dateInput.value = today;
    }
    
    this.modals.show('add-income-modal');
  }

  async handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Handling login...');
    
    const username = DOMHelpers.safeGetValue('login-user');
    const password = DOMHelpers.safeGetValue('login-pass');

    if (!username || !password) {
      this.ui.showAlert('Por favor completa todos los campos', 'error');
      return;
    }

    try {
      const success = await this.auth.login(username, password);
      if (success) {
        this.showApp();
        await this.loadUserData();
        
        // Load calendar events after login
        if (this.calendar) {
          await this.calendar.loadEvents();
        }
        
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
    
    const username = DOMHelpers.safeGetValue('register-user');
    const password = DOMHelpers.safeGetValue('register-pass');

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
      const result = await this.auth.register(username, password);
      if (result && result.success) {
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
      this.ui.updateRecentTransactions(expenses, income, extraIncomes);
      
      // Update income details (this will show the indicator and total)
      this.ui.updateIncomeDetails(income, extraIncomes);
      
      // Update income list in transactions tab
      this.ui.updateIncomeList(extraIncomes, income);
      
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
      // Show system alerts but not mascot alerts
      limitAlerts.forEach(alert => {
        this.ui.showAlert(alert.message, alert.type);
      });
      
      // Update charts
      try {
        const expensesByCategory = this.data.getExpensesByCategory(this.currentMonth);
        this.charts.updateExpensesChart(expensesByCategory);
        this.charts.updateDashboardExpensesChart(expensesByCategory);
        
        // Update trend chart
        const trendData = await this.data.getTrendData();
        this.charts.updateTrendChart(trendData);
      } catch (chartError) {
        console.log('ℹ️ Charts not available in current view:', chartError.message);
      }
      
      // Update budgets with AI insights
      const budgets = await this.budget.loadBudgets();
      this.ui.updateBudgetsList(budgets, expenses);
      
      // Train AI model periodically (non-blocking)
      if (expenses.length > 10) {
        setTimeout(() => {
          this.aiBudget.trainModel().catch(error => {
            console.log('AI model training skipped:', error.message);
          });
        }, 1000);
      }
      
      // Mascot messages disabled - pet only speaks on hover

      // ====== Widgets del dashboard ======
try {
  // 1) Movimientos recientes (últimos 5 gastos por fecha)
  const recent = [...expenses]
    .sort((a,b) => new Date(b.transaction_date || b.created_at) - new Date(a.transaction_date || a.created_at))
    .slice(0,5);

  const recentList = document.getElementById('recent-transactions');
  if (recentList) {
    recentList.innerHTML = recent.map(tx => {
      const date = (tx.transaction_date || tx.created_at || '').slice(0,10);
      const amount = this.ui.formatCurrency(tx.amount);
      const desc = tx.description || 'Gasto';
      return `
        <li class="tx-item">
          <div class="tx-meta"><span>${date}</span>·<span>${desc}</span></div>
          <div class="tx-amount">-${amount}</div>
        </li>`;
    }).join('') || `<li class="tx-item"><div>Sin movimientos recientes</div></li>`;
  }

  // 2) Gasto vs Presupuesto - ELIMINADO - La card ya no existe en el dashboard

  // 3) Próximos pagos (cuotas activas que continúan el mes siguiente)
  const upcoming = [];
  expenses.forEach(e => {
    const tot = e.total_installments || e.totalInstallments || 1;
    const n   = e.installment || 1;
    if (tot > 1 && n < tot) {
      // Próxima cuota: siguiente mes
      const d = new Date(e.transaction_date || e.created_at || new Date());
      d.setMonth(d.getMonth() + 1);
      const nextDate = d.toISOString().slice(0,10);
      upcoming.push({
        description: e.description || 'Compra en cuotas',
        nextDate,
        nextN: (n + 1),
        total: tot,
        amount: e.amount // monto por cuota
      });
    }
  });
  const upList = document.getElementById('upcoming-list');
  if (upList) {
    upList.innerHTML = (upcoming.slice(0,5).map(u => `
      <li class="upcoming-item">
        <div><strong>${u.description}</strong><br>
          <small>Cuota ${u.nextN}/${u.total} · ${u.nextDate}</small>
        </div>
        <div class="tx-amount">${this.ui.formatCurrency(u.amount)}</div>
      </li>
    `).join('')) || `<li class="upcoming-item"><div>No hay pagos próximos</div></li>`;
  }

  // Goals and alerts cards have been removed from dashboard
} catch (wErr) {
  console.log('Widgets skipped:', wErr);
}

      
            // Trigger animations for updated content
      if (this.animations) {
        setTimeout(() => {
          this.animations.refreshAnimations();
        }, 100);
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

  // Fecha por defecto = hoy
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('expense-date');
  if (dateInput) dateInput.value = today;

  // Abrir modal
  this.modals.show('add-expense-modal');

  // 🔧 Preparar comportamiento de "Pagar en cuotas"
  const installmentsCheckbox = document.getElementById('expense-installments');
  const installmentsGroup = document.getElementById('installments-group');
  const installmentsCount = document.getElementById('expense-installments-count');
  const installmentsInterest = document.getElementById('expense-installments-interest'); // si aún no lo agregaste, ver nota

  if (installmentsGroup) {
    // reset visual y valores
    installmentsGroup.classList.add('hidden');
    if (installmentsCount) installmentsCount.value = '';
    if (installmentsInterest) installmentsInterest.value = '';
  }
  if (installmentsCheckbox && installmentsGroup) {
    installmentsCheckbox.onchange = (e) => {
      installmentsGroup.classList.toggle('hidden', !e.target.checked);
    };
    // estado inicial (por si quedó tildado de una apertura anterior)
    installmentsGroup.classList.toggle('hidden', !installmentsCheckbox.checked);
  }
}



showEditLimitModal(limitId) {
  const modal = document.getElementById('edit-limit-modal');
  const form = document.getElementById('edit-limit-form');
  if (!modal || !form) return;

  const limits = this.data.getSpendingLimits() || [];
  const lim = limits.find(l => String(l.id) === String(limitId));
  if (!lim) {
    this.ui.showAlert('Límite no encontrado', 'error');
    return;
  }

  // Cargar categorías
  const categories = this.data.getCategories();
  this.ui.updateCategoriesSelect(categories, 'edit-limit-category');

  // Precargar
  DOMHelpers.safeSetValue('edit-limit-category', lim.category || '');
  DOMHelpers.safeSetValue('edit-limit-amount', parseFloat(lim.amount || 0));
  const warn = (lim.warning_percentage ?? 80);
  const warnInput = form.querySelector('input[name="warningPercentage"]');
  if (warnInput) warnInput.value = warn;

  modal.dataset.limitId = String(limitId);
  this.modals.show('edit-limit-modal');
}

async handleEditLimitSubmit(e) {
  e.preventDefault();

  const modal = document.getElementById('edit-limit-modal');
  const formData = this.ui.getFormData('edit-limit-form');
  const limitId = modal?.dataset?.limitId;
  if (!limitId) return;

  if (!formData.category || !formData.amount) {
    this.ui.showAlert('Por favor completa todos los campos', 'error');
    return;
  }

  try {
    const updates = {
      category: formData.category,
      amount: parseFloat(formData.amount),
    };
    // warning (opcional)
    if (formData.warningPercentage !== undefined && formData.warningPercentage !== '') {
      const wp = parseInt(formData.warningPercentage, 10);
      if (!Number.isNaN(wp)) updates.warning_percentage = wp;
    }

    const ok = await this.data.updateSpendingLimit(limitId, updates);
    if (!ok) throw new Error('No se pudo actualizar');

    this.modals.hide('edit-limit-modal');
    this.ui.showAlert('Límite actualizado exitosamente', 'success');
    this.updateDashboard();
  } catch (err) {
    console.error(err);
    this.ui.showAlert('Error al actualizar el límite', 'error');
  }
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
  
  showAddBudgetModal() {
    console.log('💰 Show add budget modal');
    this.ui.showAddBudgetModal();
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
  console.log('💳 Adding/Editing expense...');

  const formData = this.ui.getFormData('add-expense-form');

  if (!formData.description || !formData.amount || !formData.category || !formData.transactionDate) {
    this.ui.showAlert('Por favor completa todos los campos', 'error');
    return;
  }

  const modal = document.getElementById('add-expense-modal');
  const isEditing = modal?.dataset.editing === 'true';
  const editingId = modal?.dataset.expenseId;

  try {
    // datos base
    const expenseBase = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      transactionDate: formData.transactionDate,
      month: this.currentMonth,
      installment: 1,
      totalInstallments: 1,
      recurring: false
    };

    // --- si es EDICIÓN, actualizamos el gasto y salimos ---
    if (isEditing && editingId) {
      const updates = {
        description: expenseBase.description,
        amount: expenseBase.amount,
        category: expenseBase.category,
        transaction_date: expenseBase.transactionDate,
        month: expenseBase.month
      };
      const ok = await this.data.updateExpense(editingId, updates);
      if (!ok) {
        this.ui.showAlert('No se pudo actualizar el gasto', 'error');
        return;
      }
      this.ui.showAlert('Gasto actualizado', 'success');

      // limpiar flags de edición y cerrar
      delete modal.dataset.editing;
      delete modal.dataset.expenseId;
      this.modals.hide('add-expense-modal');
      this.updateDashboard();
      return;
    }

    // --- ALTA normal (cuotas opcionales con interés) ---
    const hasInstallments = !!formData.hasInstallments;
    const installmentsCount = parseInt(formData.installmentsCount || '0', 10);

    if (hasInstallments && installmentsCount >= 2) {
      // interés opcional (%)
      let interestPct = 0;
      if (formData.installmentsInterest !== undefined && formData.installmentsInterest !== '') {
        const parsed = parseFloat(formData.installmentsInterest);
        if (!Number.isNaN(parsed) && parsed >= 0) interestPct = parsed;
      }

      const baseTotal = expenseBase.amount;
      const totalWithInterest = baseTotal * (1 + (interestPct / 100));

      // prorrateo con redondeo a 2 decimales y ajuste en la última cuota
      const monthlyRaw = totalWithInterest / installmentsCount;
      const amounts = Array.from({ length: installmentsCount }, () => Math.round(monthlyRaw * 100) / 100);
      const sumRounded = amounts.reduce((a, b) => a + b, 0);
      const diff = Math.round((totalWithInterest - sumRounded) * 100) / 100;
      amounts[amounts.length - 1] = Math.round((amounts[amounts.length - 1] + diff) * 100) / 100;

      // qué guardar como "originalAmount"
      // opción A (total financiado): totalWithInterest
      // opción B (precio contado): baseTotal
      // si querés ver el total del plan en UI, dejá A:
      const originalAmountForUI = Math.round(totalWithInterest * 100) / 100;

      for (let i = 0; i < installmentsCount; i++) {
        const installmentDate = new Date(formData.transactionDate);
        installmentDate.setMonth(installmentDate.getMonth() + i);

        const installmentMonth = `${installmentDate.getFullYear()}-${(installmentDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;

        const installmentData = {
          ...expenseBase,
          amount: amounts[i],
          month: installmentMonth,
          installment: i + 1,
          totalInstallments: installmentsCount,
          originalAmount: originalAmountForUI,
          transactionDate: installmentDate.toISOString().split('T')[0]
        };

        console.log(`📊 Adding installment ${i + 1}/${installmentsCount}:`, installmentData);
        await this.data.addExpense(installmentData);
      }

      this.ui.showAlert(
        `Gasto dividido en ${installmentsCount} cuotas${interestPct ? ` con ${interestPct}% de interés` : ''}`,
        'success'
      );
    } else {
      await this.data.addExpense(expenseBase);
      this.ui.showAlert('Gasto agregado exitosamente', 'success');
    }

    this.modals.hide('add-expense-modal');
    this.updateDashboard();
  } catch (error) {
    console.error('Error saving expense:', error);
    this.ui.showAlert('Error al guardar el gasto', 'error');
  }
}


async handleAddBudget(e) {
  e.preventDefault();
  console.log('💰 Adding budget...');

  const formData = this.ui.getBudgetFormData('add-budget-form');

  // OJO: aquí usamos start_date y end_date (con guión bajo), que es como están en el HTML
  if (!formData.name || !formData.category || !formData.amount || !formData.start_date || !formData.end_date) {
    this.ui.showAlert('Por favor completa todos los campos', 'error');
    return;
  }

  const startDate = new Date(formData.start_date);
  const endDate = new Date(formData.end_date);

  if (endDate <= startDate) {
    this.ui.showAlert('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
    return;
  }

  try {
    const budgetData = {
      name: formData.name,
      category: formData.category,
      amount: parseFloat(formData.amount),
      start_date: formData.start_date,
      end_date: formData.end_date,
      ai_recommended: formData.ai_recommended || false
    };

    const success = await this.budget.addBudget(budgetData);

    if (success) {
      this.modals.hide('add-budget-modal');
      this.ui.showAlert('Presupuesto creado exitosamente', 'success');
      this.updateDashboard();

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

  // Usamos start_date y end_date como en el formulario
  if (!formData.name || !formData.category || !formData.amount || !formData.start_date || !formData.end_date) {
    this.ui.showAlert('Por favor completa todos los campos', 'error');
    return;
  }

  const startDate = new Date(formData.start_date);
  const endDate = new Date(formData.end_date);

  if (endDate <= startDate) {
    this.ui.showAlert('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
    return;
  }

  try {
    const updates = {
      name: formData.name,
      category: formData.category,
      amount: parseFloat(formData.amount),
      start_date: formData.start_date,
      end_date: formData.end_date
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
      this.ui.showAlert('Generando análisis inteligente con IA...', 'info');
      
      // Generar análisis completo con IA
      const recommendations = await this.aiBudget.generateAllRecommendations();
      
      // Verificar si hay datos suficientes
      if (recommendations.error === 'insufficient_data') {
        this.ui.showInsufficientDataMessage(recommendations);
        return null;
      }
      
      // Mostrar recomendaciones en la UI
      this.ui.displayAIBudgetInsights(recommendations.aiRecommendations);
      
      // Mostrar predicciones ML
      this.ui.displayMLPredictions(recommendations.mlPredictions);
      
      // Mostrar patrones detectados
      this.ui.displaySpendingPatterns(recommendations.patterns);
      
      this.ui.showAlert('¡Análisis IA completado! Revisa las recomendaciones.', 'success');
      
      return recommendations;
    } catch (error) {
      console.error('Error generating AI insights:', error);
      this.ui.showAlert('Error al generar análisis IA. Intenta nuevamente.', 'error');
      return null;
    }
  }

  // Aplicar recomendación de IA
  async applyAIRecommendation(recommendationId) {
    try {
      console.log('✅ Applying AI recommendation:', recommendationId);
      
      // Buscar la recomendación
      const recommendations = document.querySelectorAll('.ai-insight-card');
      let targetRecommendation = null;
      
      recommendations.forEach(card => {
        if (card.dataset.recommendationId === recommendationId) {
          const recommendation = {
            id: recommendationId,
            category: card.dataset.category,
            suggestedBudget: parseFloat(card.dataset.suggestedBudget),
            action: card.dataset.action
          };
          targetRecommendation = recommendation;
        }
      });
      
      if (!targetRecommendation) {
        this.ui.showAlert('Recomendación no encontrada', 'error');
        return;
      }
      
      // Aplicar la recomendación
      const success = await this.aiBudget.applyRecommendation(targetRecommendation);
      
      if (success) {
        this.ui.showAlert('¡Recomendación aplicada exitosamente!', 'success');
        
        // Actualizar la UI
        const card = document.querySelector(`[data-recommendation-id="${recommendationId}"]`);
        if (card) {
          card.classList.add('applied');
          const applyBtn = card.querySelector('.apply-recommendation-btn');
          if (applyBtn) {
            applyBtn.textContent = '✅ Aplicada';
            applyBtn.disabled = true;
          }
        }
        
        // Actualizar dashboard
        this.updateDashboard();
      } else {
        this.ui.showAlert('Error al aplicar la recomendación', 'error');
      }
    } catch (error) {
      console.error('Error applying AI recommendation:', error);
      this.ui.showAlert('Error al aplicar la recomendación', 'error');
    }
  }

  // Descartar recomendación
  dismissAIRecommendation(recommendationId) {
    const card = document.querySelector(`[data-recommendation-id="${recommendationId}"]`);
    if (card) {
      card.style.opacity = '0.5';
      card.classList.add('dismissed');
      
      const dismissBtn = card.querySelector('.dismiss-recommendation-btn');
      if (dismissBtn) {
        dismissBtn.textContent = '❌ Descartada';
        dismissBtn.disabled = true;
      }
      
      const applyBtn = card.querySelector('.apply-recommendation-btn');
      if (applyBtn) {
        applyBtn.disabled = true;
      }
    }
    
    this.ui.showAlert('Recomendación descartada', 'info');
  }

  async generateAllBudgetInsights() {
    console.log('🤖 Generating insights for all budgets');
    await this.generateBudgetInsights();
  }

async handleAddIncome(e) {
  e.preventDefault();
  console.log('💰 Adding income...');

  const formData = this.ui.getFormData('add-income-form');

  if (!formData.amount || !formData.type) {
    this.ui.showAlert('Por favor completa todos los campos', 'error');
    return;
  }

  const amount = parseFloat(formData.amount);
  if (Number.isNaN(amount)) {
    this.ui.showAlert('Monto inválido', 'error');
    return;
  }

  try {
    if (formData.type === 'fixed') {
      await this.data.addFixedIncome(this.currentMonth, amount);
    } else {
      const extraIncomeData = {
        description: formData.description || 'Ingreso extra',
        amount: amount,
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
      // Generate a random color for the category
      const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#06b6d4', '#84cc16', '#f97316'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const categoryData = {
        name: formData.name,
        icon: formData.icon,
        color: formData.color || randomColor
      };
      
      await this.data.addCategory(categoryData);
      
      // Update categories list in modal
      const categories = this.data.getCategories();
      this.ui.updateCategoriesManagementList(categories);
      
      // Update all category selects
      this.ui.updateCategoriesSelect(categories, 'expense-category');
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
    
    const period = DOMHelpers.safeGetValue('report-period', 'current');
    const focus = DOMHelpers.safeGetValue('report-focus', 'general');
    const questions = DOMHelpers.safeGetValue('report-questions');
    
    const resultDiv = DOMHelpers.safeGetElement('ai-report-result');
    const contentDiv = DOMHelpers.safeGetElement('ai-report-content');
    const generateBtn = DOMHelpers.safeGetElement('generate-report-btn');
    const downloadBtn = DOMHelpers.safeGetElement('download-report-btn');
    
    // Show loading state
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<div class="loading-spinner"></div> Generando...';
    }
    
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
      generateBtn.innerHTML = '<i class="ph ph-robot"></i> Generar Informe';
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
  console.log('✏️ Show edit expense modal', expenseId);
  const list = this.data.getExpenses(this.currentMonth) || [];
  const exp = list.find(e => String(e.id) === String(expenseId));
  if (!exp) return this.ui.showAlert('No se encontró el gasto a editar', 'error');

  const form = document.getElementById('add-expense-form');
  if (!form) return;
  form.reset();

  (document.getElementById('expense-description') || {}).value = exp.description || '';
  (document.getElementById('expense-amount') || {}).value = parseFloat(exp.amount || 0);
  (document.getElementById('expense-category') || {}).value = exp.category || '';
  (document.getElementById('expense-date') || {}).value =
    (exp.transaction_date && String(exp.transaction_date).slice(0,10)) ||
    (exp.created_at && String(exp.created_at).slice(0,10)) ||
    new Date().toISOString().split('T')[0];

  // cuotas UI (si la usás)
  const installmentsCheckbox = document.getElementById('expense-installments');
  const installmentsGroup = document.getElementById('installments-group');
  if (installmentsCheckbox && installmentsGroup) {
    const hasInst = (exp.total_installments || exp.totalInstallments || 1) > 1;
    installmentsCheckbox.checked = hasInst;
    installmentsGroup.classList.toggle('hidden', !hasInst);
    if (hasInst) {
      const cnt = document.getElementById('expense-installments-count');
      if (cnt) cnt.value = exp.total_installments || exp.totalInstallments || 2;
    }
  }

  const modal = document.getElementById('add-expense-modal');
  if (modal) {
    modal.dataset.editing = 'true';
    modal.dataset.expenseId = String(expenseId);
  }
  this.modals.show('add-expense-modal');
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

(() => {
  const widget = document.getElementById('chat-widget');
  const btn = document.getElementById('chat-toggle');
  const win = document.getElementById('chat-window');
  if (!widget || !btn || !win) return;

  // Garantizar que el widget cuelgue directo de <body> y no herede ocultamientos
  document.body.appendChild(widget);

  // Mostrar/ocultar SOLO la ventana, nunca el botón
  btn.addEventListener('click', () => {
    win.classList.toggle('hidden');
  });

  // Cerrar con la X
  const close = document.getElementById('chat-close');
  close?.addEventListener('click', () => win.classList.add('hidden'));
})();

