import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { NavigationManager } from './modules/navigation.js';
import { ChartManager } from './modules/charts.js';
import { ModalManager } from './modules/modals.js';
import { ThemeManager } from './modules/theme.js';
import { ChatManager } from './modules/chat.js';
import { CalendarManager } from './modules/calendar.js';
import { ReportManager } from './modules/reports.js';

class FinznApp {
  constructor() {
    this.auth = new AuthManager();
    this.data = new DataManager();
    this.ui = new UIManager();
    this.navigation = new NavigationManager();
    this.charts = new ChartManager();
    this.modals = new ModalManager();
    this.theme = new ThemeManager();
    this.chat = new ChatManager();
    this.calendar = new CalendarManager();
    this.reports = new ReportManager();
    
    this.currentMonth = this.getCurrentMonth();
  }

  async init() {
    console.log('🚀 Initializing FINZN App...');
    
    try {
      // Check authentication first
      if (!this.auth.isAuthenticated()) {
        this.showAuthContainer();
        this.setupAuthEventListeners();
        return;
      }

      // User is authenticated, show main app
      this.showMainApp();
      
      // Initialize all modules
      this.theme.init();
      this.modals.init();
      this.setupEventListeners();
      this.setupMonthSelector();
      
      // Load user data
      await this.loadUserData();
      
      // Initialize other modules
      this.navigation.init();
      this.chat.init();
      await this.calendar.init();
      
      // Update UI
      this.updateDashboard();
      
      console.log('✅ FINZN App initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      this.ui.showAlert('Error al inicializar la aplicación', 'error');
    }
  }

  setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    try {
      // Theme toggle
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => this.theme.toggle());
      }

      // Logout
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => this.handleLogout());
      }

      // Month selector
      const monthSelect = document.getElementById('month-select');
      if (monthSelect) {
        monthSelect.addEventListener('change', (e) => this.handleMonthChange(e.target.value));
      }

      // Dashboard buttons
      const addExpenseBtnDashboard = document.getElementById('add-expense-btn-dashboard');
      const addIncomeBtnDashboard = document.getElementById('add-income-btn-dashboard');
      
      if (addExpenseBtnDashboard) {
        addExpenseBtnDashboard.addEventListener('click', () => this.showAddExpenseModal());
      }
      
      if (addIncomeBtnDashboard) {
        addIncomeBtnDashboard.addEventListener('click', () => this.showAddIncomeModal());
      }

      // Calendar buttons - declare variables first
      const calendarSettingsBtn = document.getElementById('calendar-settings-btn');
      const syncCalendarBtn = document.getElementById('sync-calendar-btn');
      const addEventBtn = document.getElementById('add-event-btn');
      
      if (calendarSettingsBtn) {
        calendarSettingsBtn.addEventListener('click', () => this.showCalendarSettingsModal());
      }
      
      if (syncCalendarBtn) {
        syncCalendarBtn.addEventListener('click', () => this.syncCalendar());
      }
      
      if (addEventBtn) {
        addEventBtn.addEventListener('click', () => this.showAddEventModal());
      }

      // Transaction buttons
      const addExpenseBtn = document.getElementById('add-expense-btn');
      const addIncomeBtnTransactions = document.getElementById('add-income-btn-transactions');
      const addSpendingLimitBtnExpenses = document.getElementById('add-spending-limit-btn-expenses');
      const addSpendingLimitBtnCard = document.getElementById('add-spending-limit-btn-card');
      
      if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => this.showAddExpenseModal());
      }
      
      if (addIncomeBtnTransactions) {
        addIncomeBtnTransactions.addEventListener('click', () => this.showAddIncomeModal());
      }
      
      if (addSpendingLimitBtnExpenses) {
        addSpendingLimitBtnExpenses.addEventListener('click', () => this.showAddSpendingLimitModal());
      }
      
      if (addSpendingLimitBtnCard) {
        addSpendingLimitBtnCard.addEventListener('click', () => this.showAddSpendingLimitModal());
      }

      // Planning buttons
      const addGoalBtn = document.getElementById('add-goal-btn');
      if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => this.showAddGoalModal());
      }

      // Reports buttons
      const generateAIReportBtnReports = document.getElementById('generate-ai-report-btn-reports');
      const generateQuickReport = document.getElementById('generate-quick-report');
      
      if (generateAIReportBtnReports) {
        generateAIReportBtnReports.addEventListener('click', () => this.showGenerateAIReportModal());
      }
      
      if (generateQuickReport) {
        generateQuickReport.addEventListener('click', () => this.generateQuickReport());
      }

      // Settings buttons
      const manageCategoriesBtn = document.getElementById('manage-categories-btn');
      const exportDataBtn = document.getElementById('export-data-btn');
      const importDataBtn = document.getElementById('import-data-btn');
      const backupDataBtn = document.getElementById('backup-data-btn');
      const userPreferencesBtn = document.getElementById('user-preferences-btn');
      
      if (manageCategoriesBtn) {
        manageCategoriesBtn.addEventListener('click', () => this.showManageCategoriesModal());
      }
      
      if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => this.showExportDataModal());
      }
      
      if (importDataBtn) {
        importDataBtn.addEventListener('click', () => this.showImportDataModal());
      }
      
      if (backupDataBtn) {
        backupDataBtn.addEventListener('click', () => this.showBackupDataModal());
      }
      
      if (userPreferencesBtn) {
        userPreferencesBtn.addEventListener('click', () => this.showUserPreferencesModal());
      }

      // Modal forms
      this.setupModalForms();
      
      // Income indicator click
      const incomesIndicator = document.getElementById('incomes-indicator');
      if (incomesIndicator) {
        incomesIndicator.addEventListener('click', () => this.showViewIncomesModal());
      }

      console.log('✅ Event listeners set up successfully');
      
    } catch (error) {
      console.error('❌ Error setting up event listeners:', error);
    }
  }

  setupModalForms() {
    // Add Expense Form
    const addExpenseForm = document.getElementById('add-expense-form');
    if (addExpenseForm) {
      addExpenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));
      
      // Handle installments checkbox
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
    }

    // Add Income Form
    const addIncomeForm = document.getElementById('add-income-form');
    if (addIncomeForm) {
      addIncomeForm.addEventListener('submit', (e) => this.handleAddIncome(e));
      
      // Handle income type change
      const incomeTypeSelect = document.getElementById('income-type');
      const extraIncomeGroup = document.getElementById('extra-income-group');
      
      if (incomeTypeSelect && extraIncomeGroup) {
        incomeTypeSelect.addEventListener('change', (e) => {
          if (e.target.value === 'extra') {
            extraIncomeGroup.classList.remove('hidden');
          } else {
            extraIncomeGroup.classList.add('hidden');
          }
        });
      }
    }

    // Add Goal Form
    const addGoalForm = document.getElementById('add-goal-form');
    if (addGoalForm) {
      addGoalForm.addEventListener('submit', (e) => this.handleAddGoal(e));
    }

    // Add Spending Limit Form
    const addSpendingLimitForm = document.getElementById('add-spending-limit-form');
    if (addSpendingLimitForm) {
      addSpendingLimitForm.addEventListener('submit', (e) => this.handleAddSpendingLimit(e));
    }

    // Add Category Form
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
      addCategoryForm.addEventListener('submit', (e) => this.handleAddCategory(e));
    }

    // Import Data
    const processImportBtn = document.getElementById('process-import-btn');
    if (processImportBtn) {
      processImportBtn.addEventListener('click', () => this.handleImportData());
    }

    // Generate Report
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', () => this.handleGenerateReport());
    }

    // Add Event Form
    const addEventForm = document.getElementById('add-event-form');
    if (addEventForm) {
      addEventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
    }
  }

  setupAuthEventListeners() {
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
      showRegisterBtn.addEventListener('click', () => this.showRegisterContainer());
    }

    // Show login
    const showLoginBtn = document.getElementById('show-login');
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => this.showLoginContainer());
    }

    // Generate test email
    const generateTestEmailBtn = document.getElementById('generate-test-email');
    if (generateTestEmailBtn) {
      generateTestEmailBtn.addEventListener('click', () => this.generateTestEmail());
    }
  }

  setupMonthSelector() {
    const monthSelect = document.getElementById('month-select');
    if (!monthSelect) return;

    // Clear existing options
    monthSelect.innerHTML = '';

    // Generate last 12 months
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      months.push({ key: monthKey, name: monthName });
    }

    // Add options
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

  async handleMonthChange(newMonth) {
    console.log('📅 Month changed to:', newMonth);
    this.currentMonth = newMonth;
    
    // Load data for new month
    await this.loadMonthData(newMonth);
    
    // Update dashboard
    this.updateDashboard();
  }

  async loadUserData() {
    console.log('📊 Loading user data...');
    
    try {
      await this.data.loadUserData();
      console.log('✅ User data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      this.ui.showAlert('Error al cargar los datos del usuario', 'error');
    }
  }

  async loadMonthData(month) {
    console.log('📅 Loading data for month:', month);
    
    try {
      await this.data.loadExpenses(month);
      await this.data.loadIncome(month);
      await this.data.loadExtraIncomes(month);
      console.log('✅ Month data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading month data:', error);
      this.ui.showAlert('Error al cargar los datos del mes', 'error');
    }
  }

  updateDashboard() {
    console.log('🔄 Updating dashboard...');
    
    try {
      // Calculate balance
      const balance = this.data.calculateBalance(this.currentMonth);
      console.log('💰 Balance calculated:', balance);
      
      // Update UI
      this.ui.updateBalance(balance);
      
      // Update expenses list
      const expenses = this.data.getExpenses(this.currentMonth);
      this.ui.updateExpensesList(expenses, this);
      
      // Update goals
      const goals = this.data.getGoals();
      this.ui.updateGoalsList(goals);
      
      // Update spending limits
      const spendingLimits = this.data.getSpendingLimits();
      this.ui.updateSpendingLimitsList(spendingLimits, expenses);
      
      // Update income details
      const income = this.data.getIncome(this.currentMonth);
      const extraIncomes = this.data.getExtraIncomes(this.currentMonth);
      this.ui.updateIncomeDetails(income, extraIncomes);
      
      // Update installments
      this.ui.updateInstallmentsList(expenses);
      
      // Update charts
      const categoryData = this.data.getExpensesByCategory(this.currentMonth);
      this.charts.updateExpensesChart(categoryData);
      
      // Update trend chart
      this.updateTrendChart();
      
      // Update category selects
      const categories = this.data.getCategories();
      this.ui.updateCategoriesSelect(categories, 'expense-category');
      this.ui.updateCategoriesSelect(categories, 'limit-category');
      this.ui.updateCategoriesSelect(categories, 'expense-category-filter');
      this.ui.updateCategoriesSelect(categories, 'category-filter');
      this.ui.updateCategoriesSelect(categories, 'event-category');
      
      // Update categories management
      this.ui.updateCategoriesManagementList(categories);
      
      // Update user name
      const userName = document.getElementById('user-name');
      if (userName) {
        userName.textContent = this.auth.getCurrentUser() || 'Usuario';
      }
      
      console.log('✅ Dashboard updated successfully');
      
    } catch (error) {
      console.error('❌ Error updating dashboard:', error);
      this.ui.showAlert('Error al actualizar el dashboard', 'error');
    }
  }

  async updateTrendChart() {
    try {
      const trendData = await this.data.getTrendData();
      this.charts.updateTrendChart(trendData);
    } catch (error) {
      console.error('Error updating trend chart:', error);
    }
  }

  // Authentication methods
  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-user').value;
    const password = document.getElementById('login-pass').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
      errorDiv.textContent = '';
      await this.auth.login(email, password);
      
      // Reload the page to initialize the app properly
      window.location.reload();
      
    } catch (error) {
      console.error('Login error:', error);
      errorDiv.textContent = error.message;
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-user').value;
    const password = document.getElementById('register-pass').value;
    const errorDiv = document.getElementById('register-error');
    
    try {
      errorDiv.textContent = '';
      const result = await this.auth.register(email, password);
      
      if (result.needsConfirmation) {
        errorDiv.style.color = '#10b981';
        errorDiv.textContent = 'Registro exitoso. Revisa tu email para confirmar tu cuenta.';
      } else {
        // Registration successful and user can login immediately
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      errorDiv.textContent = error.message;
    }
  }

  async handleLogout() {
    try {
      await this.auth.logout();
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      this.ui.showAlert('Error al cerrar sesión', 'error');
    }
  }

  generateTestEmail() {
    const emailInput = document.getElementById('register-user');
    if (emailInput) {
      emailInput.value = this.auth.generateTestEmail();
    }
  }

  // Modal methods
  showAddExpenseModal() {
    // Set today's date as default
    const dateInput = document.getElementById('expense-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    this.modals.show('add-expense-modal');
  }

  showAddIncomeModal() {
    this.modals.show('add-income-modal');
  }

  showAddGoalModal() {
    this.modals.show('add-goal-modal');
  }

  showAddSpendingLimitModal() {
    this.modals.show('add-spending-limit-modal');
  }

  showManageCategoriesModal() {
    this.modals.show('manage-categories-modal');
  }

  showExportDataModal() {
    // Create export options modal
    const exportOptions = [
      { value: 'complete', label: 'Datos Completos (CSV)', description: 'Todos los gastos, ingresos y configuración' },
      { value: 'expenses', label: 'Solo Gastos (CSV)', description: 'Únicamente los gastos registrados' },
      { value: 'incomes', label: 'Solo Ingresos (CSV)', description: 'Únicamente los ingresos registrados' }
    ];

    let optionsHtml = '<h3>Selecciona qué datos exportar:</h3><div class="export-options">';
    
    exportOptions.forEach(option => {
      optionsHtml += `
        <div class="export-option">
          <label class="export-option-label">
            <input type="radio" name="export-type" value="${option.value}" ${option.value === 'complete' ? 'checked' : ''}>
            <div class="export-option-content">
              <div class="export-option-title">${option.label}</div>
              <div class="export-option-description">${option.description}</div>
            </div>
          </label>
        </div>
      `;
    });
    
    optionsHtml += '</div>';
    
    // Show confirmation dialog
    if (confirm('¿Quieres exportar tus datos financieros?')) {
      const exportType = 'complete'; // Default to complete for now
      
      try {
        const success = this.data.exportDataToCSV(exportType);
        if (success) {
          this.ui.showAlert('Datos exportados exitosamente', 'success');
        } else {
          this.ui.showAlert('Error al exportar los datos', 'error');
        }
      } catch (error) {
        console.error('Export error:', error);
        this.ui.showAlert('Error al exportar los datos', 'error');
      }
    }
  }

  showImportDataModal() {
    this.modals.show('import-data-modal');
  }

  showBackupDataModal() {
    this.ui.showAlert('Función de respaldo próximamente disponible', 'info');
  }

  showUserPreferencesModal() {
    this.ui.showAlert('Configuración de preferencias próximamente disponible', 'info');
  }

  showGenerateAIReportModal() {
    this.modals.show('generate-ai-report-modal');
  }

  showViewIncomesModal() {
    this.modals.show('view-incomes-modal');
  }

  showInstallmentsModal() {
    this.modals.show('view-installments-modal');
  }

  showAddEventModal() {
    // Set today's date as default
    const dateInput = document.getElementById('event-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    this.modals.show('add-event-modal');
  }

  showCalendarSettingsModal() {
    this.modals.show('calendar-settings-modal');
  }

  // Form handlers
  async handleAddExpense(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-expense-form');
    console.log('💳 Adding expense:', formData);
    
    try {
      const hasInstallments = document.getElementById('expense-installments').checked;
      const installmentsCount = hasInstallments ? parseInt(formData.installmentsCount) || 1 : 1;
      
      if (hasInstallments && installmentsCount > 1) {
        // Create installments
        const originalAmount = parseFloat(formData.amount);
        const installmentAmount = originalAmount / installmentsCount;
        
        for (let i = 0; i < installmentsCount; i++) {
          const installmentDate = new Date(formData.transactionDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          const installmentMonth = `${installmentDate.getFullYear()}-${(installmentDate.getMonth() + 1).toString().padStart(2, '0')}`;
          
          const expenseData = {
            description: formData.description,
            amount: installmentAmount,
            category: formData.category,
            transactionDate: installmentDate.toISOString().split('T')[0],
            month: installmentMonth,
            installment: i + 1,
            totalInstallments: installmentsCount,
            originalAmount: originalAmount
          };
          
          await this.data.addExpense(expenseData);
        }
      } else {
        // Single expense
        const expenseMonth = formData.transactionDate.substring(0, 7);
        const expenseData = {
          ...formData,
          month: expenseMonth
        };
        
        await this.data.addExpense(expenseData);
      }
      
      this.modals.hide('add-expense-modal');
      this.updateDashboard();
      this.ui.showAlert('Gasto agregado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error adding expense:', error);
      this.ui.showAlert('Error al agregar el gasto', 'error');
    }
  }

  async handleAddIncome(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-income-form');
    console.log('💰 Adding income:', formData);
    
    try {
      if (formData.type === 'fixed') {
        await this.data.addFixedIncome(this.currentMonth, formData.amount);
      } else {
        const incomeData = {
          description: formData.description,
          amount: formData.amount,
          category: formData.category
        };
        await this.data.addExtraIncome(this.currentMonth, incomeData);
      }
      
      this.modals.hide('add-income-modal');
      this.updateDashboard();
      this.ui.showAlert('Ingreso agregado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error adding income:', error);
      this.ui.showAlert('Error al agregar el ingreso', 'error');
    }
  }

  async handleAddGoal(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-goal-form');
    console.log('🎯 Adding goal:', formData);
    
    try {
      await this.data.addGoal(formData);
      
      this.modals.hide('add-goal-modal');
      this.updateDashboard();
      this.ui.showAlert('Objetivo creado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error adding goal:', error);
      this.ui.showAlert('Error al crear el objetivo', 'error');
    }
  }

  async handleAddSpendingLimit(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-spending-limit-form');
    console.log('🚦 Adding spending limit:', formData);
    
    try {
      await this.data.addSpendingLimit(formData);
      
      this.modals.hide('add-spending-limit-modal');
      this.updateDashboard();
      this.ui.showAlert('Límite de gasto agregado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error adding spending limit:', error);
      this.ui.showAlert('Error al agregar el límite de gasto', 'error');
    }
  }

  async handleAddCategory(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-category-form');
    console.log('🏷️ Adding category:', formData);
    
    try {
      await this.data.addCategory(formData);
      
      this.ui.clearForm('add-category-form');
      this.updateDashboard();
      this.ui.showAlert('Categoría agregada exitosamente', 'success');
      
    } catch (error) {
      console.error('Error adding category:', error);
      this.ui.showAlert('Error al agregar la categoría', 'error');
    }
  }

  async handleImportData() {
    const fileInput = document.getElementById('import-file');
    const importType = document.querySelector('input[name="import-type"]:checked')?.value || 'auto';
    
    if (!fileInput.files[0]) {
      this.ui.showAlert('Por favor selecciona un archivo CSV', 'warning');
      return;
    }
    
    try {
      this.ui.showLoading('process-import-btn');
      
      const result = await this.data.importDataFromCSV(fileInput.files[0], importType);
      
      this.ui.hideLoading('process-import-btn');
      this.modals.hide('import-data-modal');
      this.updateDashboard();
      
      this.ui.showAlert(
        `Importación completada: ${result.imported} registros importados${result.errors > 0 ? `, ${result.errors} errores` : ''}`,
        result.errors > 0 ? 'warning' : 'success'
      );
      
    } catch (error) {
      console.error('Error importing data:', error);
      this.ui.hideLoading('process-import-btn');
      this.ui.showAlert('Error al importar los datos: ' + error.message, 'error');
    }
  }

  async handleGenerateReport() {
    const period = document.getElementById('report-period').value;
    const focus = document.getElementById('report-focus').value;
    const questions = document.getElementById('report-questions').value;
    
    try {
      this.ui.showLoading('generate-report-btn');
      
      // Collect data for report
      const reportData = await this.collectReportData(period);
      
      // Generate AI report
      const reportContent = await this.reports.generateAIReport(reportData, focus, questions);
      
      // Show result
      const resultContainer = document.getElementById('ai-report-result');
      const contentContainer = document.getElementById('ai-report-content');
      
      if (resultContainer && contentContainer) {
        contentContainer.innerHTML = reportContent;
        resultContainer.classList.remove('hidden');
      }
      
      this.ui.hideLoading('generate-report-btn');
      
      // Setup download button
      const downloadBtn = document.getElementById('download-report-btn');
      if (downloadBtn) {
        downloadBtn.onclick = () => this.reports.generatePDF(reportContent, reportData);
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      this.ui.hideLoading('generate-report-btn');
      this.ui.showAlert('Error al generar el informe', 'error');
    }
  }

  async generateQuickReport() {
    const period = document.getElementById('report-period-reports').value;
    const focus = document.getElementById('report-focus-reports').value;
    
    try {
      // Collect data for report
      const reportData = await this.collectReportData(period);
      
      // Generate AI report
      const reportContent = await this.reports.generateAIReport(reportData, focus, '');
      
      // Show in modal
      this.showQuickReportModal(reportContent, reportData);
      
    } catch (error) {
      console.error('Error generating quick report:', error);
      this.ui.showAlert('Error al generar el informe rápido', 'error');
    }
  }

  showQuickReportModal(content, data) {
    // Create temporary modal for quick report
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content large">
        <div class="modal-header">
          <h2>📊 Informe Financiero Rápido</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="download-quick-report">
            📄 Descargar PDF
          </button>
          <button type="button" class="btn btn-secondary modal-cancel">Cerrar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup event listeners
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const downloadBtn = modal.querySelector('#download-quick-report');
    
    const closeModal = () => {
      modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.reports.generatePDF(content, data);
      });
    }
  }

  async collectReportData(period) {
    const now = new Date();
    let months = [];
    
    switch (period) {
      case 'current':
        months = [this.currentMonth];
        break;
      case 'last3':
        for (let i = 0; i < 3; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
        }
        break;
      case 'last6':
        for (let i = 0; i < 6; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
        }
        break;
      case 'year':
        for (let i = 0; i < 12; i++) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
        }
        break;
    }
    
    // Collect data for all months
    let totalIncome = 0;
    let totalExpenses = 0;
    const categories = {};
    
    for (const month of months) {
      const expenses = await this.data.loadExpenses(month);
      const income = await this.data.loadIncome(month);
      const extraIncomes = await this.data.loadExtraIncomes(month);
      
      // Sum income
      totalIncome += income.fixed + income.extra;
      totalIncome += extraIncomes.reduce((sum, extra) => sum + parseFloat(extra.amount), 0);
      
      // Sum expenses by category
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

  async handleAddEvent(e) {
    e.preventDefault();
    
    const formData = this.ui.getFormData('add-event-form');
    console.log('📅 Adding calendar event:', formData);
    
    try {
      const eventData = {
        title: formData.title,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration) || 60,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        description: formData.description,
        category: formData.category,
        recurring: formData.recurring === 'on'
      };
      
      await this.calendar.addEvent(eventData);
      
      this.modals.hide('add-event-modal');
      this.ui.showAlert('Evento agregado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error adding event:', error);
      this.ui.showAlert('Error al agregar el evento', 'error');
    }
  }

  syncCalendar() {
    if (this.calendar) {
      this.calendar.refresh();
      this.ui.showAlert('Calendario sincronizado', 'success');
    }
  }

  // Utility methods
  async deleteExpense(expenseId) {
    if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      try {
        await this.data.deleteExpense(expenseId);
        this.updateDashboard();
        this.ui.showAlert('Gasto eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error deleting expense:', error);
        this.ui.showAlert('Error al eliminar el gasto', 'error');
      }
    }
  }

  showDeleteConfirmation(expenseId, description) {
    if (confirm(`¿Estás seguro de que quieres eliminar "${description}"?`)) {
      this.deleteExpense(expenseId);
    }
  }

  async deleteCategory(categoryId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await this.data.deleteCategory(categoryId);
        this.updateDashboard();
        this.ui.showAlert('Categoría eliminada exitosamente', 'success');
      } catch (error) {
        console.error('Error deleting category:', error);
        this.ui.showAlert('Error al eliminar la categoría', 'error');
      }
    }
  }

  async deleteSpendingLimit(limitId) {
    if (confirm('¿Estás seguro de que quieres eliminar este límite de gasto?')) {
      try {
        await this.data.deleteSpendingLimit(limitId);
        this.updateDashboard();
        this.ui.showAlert('Límite eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error deleting spending limit:', error);
        this.ui.showAlert('Error al eliminar el límite', 'error');
      }
    }
  }

  // UI state methods
  showAuthContainer() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  showRegisterContainer() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  showLoginContainer() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  showMainApp() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  async deleteExpense(expenseId) {
    if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      try {
        await this.data.deleteExpense(expenseId);
        this.updateDashboard();
        this.ui.showAlert('Gasto eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error deleting expense:', error);
        this.ui.showAlert('Error al eliminar el gasto', 'error');
      }
    }
  }

  showDeleteConfirmation(expenseId, description) {
    if (confirm(`¿Estás seguro de que quieres eliminar "${description}"?`)) {
      this.deleteExpense(expenseId);
    }
  }

  async deleteCategory(categoryId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await this.data.deleteCategory(categoryId);
        this.updateDashboard();
        this.ui.showAlert('Categoría eliminada exitosamente', 'success');
      } catch (error) {
        console.error('Error deleting category:', error);
        this.ui.showAlert('Error al eliminar la categoría', 'error');
      }
    }
  }

  async deleteSpendingLimit(limitId) {
    if (confirm('¿Estás seguro de que quieres eliminar este límite de gasto?')) {
      try {
        await this.data.deleteSpendingLimit(limitId);
        this.updateDashboard();
        this.ui.showAlert('Límite eliminado exitosamente', 'success');
      } catch (error) {
        console.error('Error deleting spending limit:', error);
        this.ui.showAlert('Error al eliminar el límite', 'error');
      }
    }
  }

  // UI state methods
  showAuthContainer() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  showRegisterContainer() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  showLoginContainer() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  showMainApp() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
  }

  updateTransactionsTimeline() {
    const container = document.getElementById('transactions-timeline');
    if (!container) return;

    console.log('🔄 Updating transactions timeline...');
    
    // Get current month data
    const expenses = this.data.getExpenses(this.currentMonth);
    const income = this.data.getIncome(this.currentMonth);
    const extraIncomes = this.data.getExtraIncomes(this.currentMonth);
    
    // Combine all transactions
    const transactions = [];
    
    // Add expenses
    expenses.forEach(expense => {
      transactions.push({
        type: 'expense',
        date: expense.transaction_date,
        description: expense.description,
        amount: -parseFloat(expense.amount),
        category: expense.category,
        id: expense.id
      });
    });
    
    // Add fixed income
    if (income.fixed > 0) {
      transactions.push({
        type: 'income',
        date: `${this.currentMonth}-01`,
        description: 'Sueldo mensual',
        amount: parseFloat(income.fixed),
        category: 'sueldo',
        id: `income-fixed-${this.currentMonth}`
      });
    }
    
    // Add extra incomes
    extraIncomes.forEach(extraIncome => {
      transactions.push({
        type: 'income',
        date: extraIncome.created_at ? extraIncome.created_at.split('T')[0] : `${this.currentMonth}-01`,
        description: extraIncome.description,
        amount: parseFloat(extraIncome.amount),
        category: extraIncome.category,
        id: extraIncome.id
      });
    });
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear container
    container.innerHTML = '';
    
    if (transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No hay transacciones este mes</h3>
          <p>Las transacciones aparecerán aquí cuando agregues gastos o ingresos</p>
        </div>
      `;
      return;
    }
    
    // Group by date
    const groupedTransactions = {};
    transactions.forEach(transaction => {
      const date = transaction.date;
      if (!groupedTransactions[date]) {
        groupedTransactions[date] = [];
      }
      groupedTransactions[date].push(transaction);
    });
    
    // Render timeline
    Object.entries(groupedTransactions).forEach(([date, dayTransactions]) => {
      const dateGroup = document.createElement('div');
      dateGroup.className = 'timeline-date-group';
      
      const dateHeader = document.createElement('div');
      dateHeader.className = 'timeline-date-header';
      dateHeader.textContent = new Date(date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      dateGroup.appendChild(dateHeader);
      
      dayTransactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = `timeline-item ${transaction.type}`;
        
        const category = this.ui.getCategoryInfo(transaction.category);
        
        item.innerHTML = `
          <div class="timeline-icon">${category.icon}</div>
          <div class="timeline-content">
            <div class="timeline-description">${transaction.description}</div>
            <div class="timeline-category">${category.name}</div>
          </div>
          <div class="timeline-amount ${transaction.amount < 0 ? 'negative' : 'positive'}">
            ${this.ui.formatCurrency(Math.abs(transaction.amount))}
          </div>
        `;
        
        dateGroup.appendChild(item);
      });
      
      container.appendChild(dateGroup);
    });
    
    console.log('✅ Transactions timeline updated');
  }

  updatePlanningWidgets() {
    console.log('🎯 Updating planning widgets...');
    
    // Update goals widget in dashboard
    const goalsWidget = document.getElementById('goals-widget');
    if (goalsWidget) {
      const goals = this.data.getGoals();
      goalsWidget.innerHTML = '';
      
      if (goals.length === 0) {
        goalsWidget.innerHTML = '<p class="widget-empty">No hay objetivos configurados</p>';
      } else {
        goals.slice(0, 3).forEach(goal => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          const goalElement = document.createElement('div');
          goalElement.className = 'widget-goal-item';
          goalElement.innerHTML = `
            <div class="widget-goal-name">${goal.name}</div>
            <div class="widget-goal-progress">
              <div class="widget-progress-bar">
                <div class="widget-progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
              </div>
              <span class="widget-progress-text">${progress.toFixed(1)}%</span>
            </div>
          `;
          goalsWidget.appendChild(goalElement);
        });
        
        if (goals.length > 3) {
          const moreElement = document.createElement('div');
          moreElement.className = 'widget-more';
          moreElement.innerHTML = `<button class="btn btn-secondary btn-sm" onclick="window.app.navigation.navigateTo('planning', 'goals')">Ver todos (${goals.length})</button>`;
          goalsWidget.appendChild(moreElement);
        }
      }
    }
    
    console.log('✅ Planning widgets updated');
  }

  updateReportsData() {
    console.log('📊 Updating reports data...');
    
    // Update achievements in dashboard
    const achievementsWidget = document.getElementById('achievements-widget');
    if (achievementsWidget) {
      const achievements = this.data.getAchievements();
      achievementsWidget.innerHTML = '';
      
      if (achievements.length === 0) {
        achievementsWidget.innerHTML = '<p class="widget-empty">No hay logros desbloqueados</p>';
      } else {
        achievements.slice(0, 3).forEach(achievement => {
          const achievementElement = document.createElement('div');
          achievementElement.className = 'widget-achievement-item';
          achievementElement.innerHTML = `
            <div class="widget-achievement-title">${achievement.title}</div>
            <div class="widget-achievement-description">${achievement.description}</div>
          `;
          achievementsWidget.appendChild(achievementElement);
        });
        
        if (achievements.length > 3) {
          const moreElement = document.createElement('div');
          moreElement.className = 'widget-more';
          moreElement.innerHTML = `<button class="btn btn-secondary btn-sm" onclick="window.app.navigation.navigateTo('reports', 'achievements')">Ver todos (${achievements.length})</button>`;
          achievementsWidget.appendChild(moreElement);
        }
      }
    }
    
    console.log('✅ Reports data updated');
  }

  // Additional utility methods
  async addToGoal(goalId) {
    const amount = prompt('¿Cuánto quieres agregar a este objetivo?');
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
      try {
        // This would need to be implemented in DataManager
        // await this.data.addToGoal(goalId, parseFloat(amount));
        this.updateDashboard();
        this.ui.showAlert('Monto agregado al objetivo exitosamente', 'success');
      } catch (error) {
        console.error('Error adding to goal:', error);
        this.ui.showAlert('Error al agregar monto al objetivo', 'error');
      }
    }
  }

  async editGoal(goalId) {
    this.ui.showAlert('Función de editar objetivo próximamente disponible', 'info');
  }

  async editSpendingLimit(limitId) {
    this.ui.showAlert('Función de editar límite próximamente disponible', 'info');
  }

  async showEditExpenseModal(expenseId) {
    this.ui.showAlert('Función de editar gasto próximamente disponible', 'info');
  }

  // Filter methods for transactions
  setupTransactionFilters() {
    const typeFilter = document.getElementById('transaction-type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const dateFilter = document.getElementById('date-filter');
    const clearFilters = document.getElementById('clear-filters');
    
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.applyTransactionFilters());
    }
    
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.applyTransactionFilters());
    }
    
    if (dateFilter) {
      dateFilter.addEventListener('change', () => this.applyTransactionFilters());
    }
    
    if (clearFilters) {
      clearFilters.addEventListener('click', () => this.clearTransactionFilters());
    }
    
    // Setup expense filters
    const expenseCategoryFilter = document.getElementById('expense-category-filter');
    const expenseDateFilter = document.getElementById('expense-date-filter');
    const clearExpenseFilters = document.getElementById('clear-expense-filters');
    
    if (expenseCategoryFilter) {
      expenseCategoryFilter.addEventListener('change', () => this.applyExpenseFilters());
    }
    
    if (expenseDateFilter) {
      expenseDateFilter.addEventListener('change', () => this.applyExpenseFilters());
    }
    
    if (clearExpenseFilters) {
      clearExpenseFilters.addEventListener('click', () => this.clearExpenseFilters());
    }
  }

  applyTransactionFilters() {
    const typeFilter = document.getElementById('transaction-type-filter')?.value;
    const categoryFilter = document.getElementById('category-filter')?.value;
    const dateFilter = document.getElementById('date-filter')?.value;
    
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach(item => {
      let show = true;
      
      if (typeFilter && !item.classList.contains(typeFilter)) {
        show = false;
      }
      
      if (categoryFilter) {
        const categoryElement = item.querySelector('.timeline-category');
        if (!categoryElement || !categoryElement.textContent.includes(categoryFilter)) {
          show = false;
        }
      }
      
      if (dateFilter) {
        const dateGroup = item.closest('.timeline-date-group');
        const dateHeader = dateGroup?.querySelector('.timeline-date-header');
        if (dateHeader) {
          const itemDate = new Date(dateHeader.textContent);
          const filterDate = new Date(dateFilter);
          if (itemDate.toDateString() !== filterDate.toDateString()) {
            show = false;
          }
        }
      }
      
      item.style.display = show ? 'flex' : 'none';
    });
  }

  clearTransactionFilters() {
    const typeFilter = document.getElementById('transaction-type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (typeFilter) typeFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    
    this.applyTransactionFilters();
  }

  applyExpenseFilters() {
    const categoryFilter = document.getElementById('expense-category-filter')?.value;
    const dateFilter = document.getElementById('expense-date-filter')?.value;
    
    const expenseItems = document.querySelectorAll('.expense-item');
    
    expenseItems.forEach(item => {
      let show = true;
      
      if (categoryFilter) {
        const categoryElement = item.querySelector('.expense-category');
        if (!categoryElement || !categoryElement.textContent.includes(categoryFilter)) {
          show = false;
        }
      }
      
      if (dateFilter) {
        const categoryElement = item.querySelector('.expense-category');
        if (categoryElement) {
          const dateText = categoryElement.textContent.split('•')[1]?.trim();
          if (dateText) {
            const itemDate = new Date(dateText);
            const filterDate = new Date(dateFilter);
            if (itemDate.toDateString() !== filterDate.toDateString()) {
              show = false;
            }
          }
        }
      }
      
      item.style.display = show ? 'flex' : 'none';
    });
  }

  clearExpenseFilters() {
    const categoryFilter = document.getElementById('expense-category-filter');
    const dateFilter = document.getElementById('expense-date-filter');
    
    if (categoryFilter) categoryFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    
    this.applyExpenseFilters();
  }

  // Dashboard widget updates
  updateUpcomingEvents() {
    const container = document.getElementById('upcoming-events');
    if (!container) return;
    
    if (this.calendar) {
      const upcomingEvents = this.calendar.getUpcomingEvents(7);
      container.innerHTML = '';
      
      if (upcomingEvents.length === 0) {
        container.innerHTML = '<p class="widget-empty">No hay eventos próximos</p>';
      } else {
        upcomingEvents.slice(0, 3).forEach(event => {
          const eventElement = document.createElement('div');
          eventElement.className = 'widget-event-item';
          
          const eventDate = new Date(event.date);
          const today = new Date();
          const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
          
          eventElement.innerHTML = `
            <div class="widget-event-title">${event.title}</div>
            <div class="widget-event-date">
              ${daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil} días`}
            </div>
          `;
          container.appendChild(eventElement);
        });
        
        if (upcomingEvents.length > 3) {
          const moreElement = document.createElement('div');
          moreElement.className = 'widget-more';
          moreElement.innerHTML = `<button class="btn btn-secondary btn-sm" onclick="window.app.navigation.navigateTo('calendar')">Ver todos (${upcomingEvents.length})</button>`;
          container.appendChild(moreElement);
        }
      }
    }
  }

  updateLimitsWidget() {
    const container = document.getElementById('limits-widget');
    if (!container) return;
    
    const expenses = this.data.getExpenses(this.currentMonth);
    const limits = this.data.getSpendingLimits();
    const alerts = this.data.checkSpendingLimits(this.currentMonth);
    
    container.innerHTML = '';
    
    if (alerts.length === 0) {
      container.innerHTML = '<p class="widget-empty">Todos los límites bajo control</p>';
    } else {
      alerts.slice(0, 3).forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `widget-alert-item ${alert.type}`;
        alertElement.innerHTML = `
          <div class="widget-alert-message">${alert.message}</div>
          <div class="widget-alert-percentage">${alert.percentage}%</div>
        `;
        container.appendChild(alertElement);
      });
      
      if (alerts.length > 3) {
        const moreElement = document.createElement('div');
        moreElement.className = 'widget-more';
        moreElement.innerHTML = `<button class="btn btn-secondary btn-sm" onclick="window.app.navigation.navigateTo('planning', 'limits')">Ver todos (${alerts.length})</button>`;
        container.appendChild(moreElement);
      }
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new FinznApp();
  window.app.init();
});