export class UIManager {
  constructor() {
    this.currentMonth = this.getCurrentMonth();
    this.isLoading = false;
  }

  // Security utilities
  escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(match) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[match];
    });
  }

  validateNumericInput(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num) || num < min || num > max) {
      return { valid: false, value: 0 };
    }
    return { valid: true, value: num };
  }

  validateStringInput(value, maxLength = 255) {
    if (!value || typeof value !== 'string') {
      return { valid: false, value: '' };
    }
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > maxLength) {
      return { valid: false, value: '' };
    }
    return { valid: true, value: trimmed };
  }

  validateDateInput(dateStr) {
    if (!dateStr) return { valid: false, value: new Date().toISOString().split('T')[0] };
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { valid: false, value: new Date().toISOString().split('T')[0] };
    }
    return { valid: true, value: dateStr };
  }

  init() {
    console.log('🎨 Initializing UI Manager...');
    this.setupEventListeners();
    this.updateBalance();
    this.updateExpensesList();
    this.updateGoalsList();
    this.updateSpendingLimitsList();
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  setupEventListeners() {
    // Expense form
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
      expenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));
    }

    // Income forms
    const incomeForm = document.getElementById('income-form');
    if (incomeForm) {
      incomeForm.addEventListener('submit', (e) => this.handleAddIncome(e));
    }

    const extraIncomeForm = document.getElementById('extra-income-form');
    if (extraIncomeForm) {
      extraIncomeForm.addEventListener('submit', (e) => this.handleAddExtraIncome(e));
    }

    // Goal forms
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => this.handleAddGoal(e));
    }

    // Spending limit form
    const limitForm = document.getElementById('limit-form');
    if (limitForm) {
      limitForm.addEventListener('submit', (e) => this.handleAddSpendingLimit(e));
    }

    // Installment checkbox
    const installmentCheckbox = document.getElementById('expense-installments');
    const installmentOptions = document.getElementById('installment-options');
    
    if (installmentCheckbox && installmentOptions) {
      installmentCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          installmentOptions.classList.remove('hidden');
        } else {
          installmentOptions.classList.add('hidden');
        }
      });
    }

    // Export buttons
    const exportCompleteBtn = document.getElementById('export-complete');
    const exportExpensesBtn = document.getElementById('export-expenses');
    const exportIncomesBtn = document.getElementById('export-incomes');

    if (exportCompleteBtn) {
      exportCompleteBtn.addEventListener('click', () => this.exportData('complete'));
    }
    if (exportExpensesBtn) {
      exportExpensesBtn.addEventListener('click', () => this.exportData('expenses'));
    }
    if (exportIncomesBtn) {
      exportIncomesBtn.addEventListener('click', () => this.exportData('incomes'));
    }

    // Import button
    const importBtn = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');
    
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => this.handleImportData(e));
    }
  }

  async handleAddExpense(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Validate inputs
    const description = this.validateStringInput(formData.get('description'));
    const amount = this.validateNumericInput(formData.get('amount'), 0.01);
    const category = this.validateStringInput(formData.get('category'));
    const date = this.validateDateInput(formData.get('date'));

    if (!description.valid || !amount.valid || !category.valid || !date.valid) {
      this.showAlert('Por favor completa todos los campos correctamente', 'error');
      return;
    }

    const isInstallment = formData.get('installments') === 'on';
    let totalInstallments = 1;
    
    if (isInstallment) {
      const installmentsValidation = this.validateNumericInput(formData.get('total-installments'), 2, 60);
      if (!installmentsValidation.valid) {
        this.showAlert('El número de cuotas debe ser entre 2 y 60', 'error');
        return;
      }
      totalInstallments = installmentsValidation.value;
    }

    try {
      const expenseDate = new Date(date.value);
      const month = `${expenseDate.getFullYear()}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (isInstallment) {
        // Add installments
        const monthlyAmount = amount.value / totalInstallments;
        
        for (let i = 0; i < totalInstallments; i++) {
          const installmentDate = new Date(expenseDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);
          
          const installmentMonth = `${installmentDate.getFullYear()}-${(installmentDate.getMonth() + 1).toString().padStart(2, '0')}`;
          
          const expenseData = {
            description: `${description.value} (${i + 1}/${totalInstallments})`,
            amount: monthlyAmount,
            category: category.value,
            transactionDate: installmentDate.toISOString().split('T')[0],
            month: installmentMonth,
            installment: i + 1,
            totalInstallments: totalInstallments,
            originalAmount: amount.value
          };

          await window.app.data.addExpense(expenseData);
        }
      } else {
        // Add single expense
        const expenseData = {
          description: description.value,
          amount: amount.value,
          category: category.value,
          transactionDate: date.value,
          month: month
        };

        await window.app.data.addExpense(expenseData);
      }

      // Reset form and update UI
      e.target.reset();
      document.getElementById('installment-options').classList.add('hidden');
      
      if (window.app.modals) {
        window.app.modals.hide('add-expense-modal');
      }
      
      this.showAlert('Gasto agregado exitosamente', 'success');
      this.updateBalance();
      this.updateExpensesList();
      
    } catch (error) {
      console.error('Error adding expense:', error);
      this.showAlert('Error al agregar el gasto', 'error');
    }
  }

  async handleAddIncome(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const amount = this.validateNumericInput(formData.get('amount'), 0.01);

    if (!amount.valid) {
      this.showAlert('Por favor ingresa un monto válido', 'error');
      return;
    }

    try {
      await window.app.data.addFixedIncome(this.currentMonth, amount.value);
      
      e.target.reset();
      if (window.app.modals) {
        window.app.modals.hide('add-income-modal');
      }
      
      this.showAlert('Ingreso agregado exitosamente', 'success');
      this.updateBalance();
      
    } catch (error) {
      console.error('Error adding income:', error);
      this.showAlert('Error al agregar el ingreso', 'error');
    }
  }

  async handleAddExtraIncome(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const description = this.validateStringInput(formData.get('description'));
    const amount = this.validateNumericInput(formData.get('amount'), 0.01);
    const category = this.validateStringInput(formData.get('category'));

    if (!description.valid || !amount.valid || !category.valid) {
      this.showAlert('Por favor completa todos los campos correctamente', 'error');
      return;
    }

    try {
      const incomeData = {
        description: description.value,
        amount: amount.value,
        category: category.value
      };

      await window.app.data.addExtraIncome(this.currentMonth, incomeData);
      
      e.target.reset();
      if (window.app.modals) {
        window.app.modals.hide('add-extra-income-modal');
      }
      
      this.showAlert('Ingreso extra agregado exitosamente', 'success');
      this.updateBalance();
      
    } catch (error) {
      console.error('Error adding extra income:', error);
      this.showAlert('Error al agregar el ingreso extra', 'error');
    }
  }

  async handleAddGoal(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const name = this.validateStringInput(formData.get('name'));
    const targetAmount = this.validateNumericInput(formData.get('target-amount'), 1);
    const currentAmount = this.validateNumericInput(formData.get('current-amount'), 0);

    if (!name.valid || !targetAmount.valid) {
      this.showAlert('Por favor completa todos los campos correctamente', 'error');
      return;
    }

    if (currentAmount.value > targetAmount.value) {
      this.showAlert('El monto actual no puede ser mayor al objetivo', 'error');
      return;
    }

    try {
      const goalData = {
        name: name.value,
        targetAmount: targetAmount.value,
        currentAmount: currentAmount.value
      };

      await window.app.data.addGoal(goalData);
      
      e.target.reset();
      if (window.app.modals) {
        window.app.modals.hide('add-goal-modal');
      }
      
      this.showAlert('Objetivo agregado exitosamente', 'success');
      this.updateGoalsList();
      
    } catch (error) {
      console.error('Error adding goal:', error);
      this.showAlert('Error al agregar el objetivo', 'error');
    }
  }

  async handleAddSpendingLimit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const category = this.validateStringInput(formData.get('category'));
    const amount = this.validateNumericInput(formData.get('amount'), 1);
    const warningPercentage = this.validateNumericInput(formData.get('warning-percentage'), 1, 100);

    if (!category.valid || !amount.valid || !warningPercentage.valid) {
      this.showAlert('Por favor completa todos los campos correctamente', 'error');
      return;
    }

    try {
      const limitData = {
        category: category.value,
        amount: amount.value,
        warningPercentage: warningPercentage.value
      };

      await window.app.data.addSpendingLimit(limitData);
      
      e.target.reset();
      if (window.app.modals) {
        window.app.modals.hide('add-limit-modal');
      }
      
      this.showAlert('Límite agregado exitosamente', 'success');
      this.updateSpendingLimitsList();
      
    } catch (error) {
      console.error('Error adding spending limit:', error);
      this.showAlert('Error al agregar el límite', 'error');
    }
  }

  updateBalance() {
    if (!window.app || !window.app.data) return;

    const balance = window.app.data.calculateBalance(this.currentMonth);
    
    // Update balance display
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const availableEl = document.getElementById('available');
    const installmentsEl = document.getElementById('installments');

    if (totalIncomeEl) {
      totalIncomeEl.textContent = this.formatCurrency(balance.totalIncome);
    }
    
    if (totalExpensesEl) {
      totalExpensesEl.textContent = this.formatCurrency(balance.totalExpenses);
    }
    
    if (availableEl) {
      availableEl.textContent = this.formatCurrency(balance.available);
      availableEl.className = balance.available >= 0 ? 'positive' : 'negative';
    }
    
    if (installmentsEl) {
      installmentsEl.textContent = balance.installments.toString();
    }

    // Update progress bar
    const progressBar = document.querySelector('.balance-progress');
    if (progressBar && balance.totalIncome > 0) {
      const percentage = Math.min((balance.totalExpenses / balance.totalIncome) * 100, 100);
      const progressFill = progressBar.querySelector('.progress-fill');
      if (progressFill) {
        progressFill.style.width = `${percentage}%`;
        progressFill.className = `progress-fill ${percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'safe'}`;
      }
    }
  }

  updateExpensesList() {
    if (!window.app || !window.app.data) return;

    const expensesList = document.getElementById('expenses-list');
    if (!expensesList) return;

    const expenses = window.app.data.getExpenses(this.currentMonth);
    
    // Clear existing content
    expensesList.innerHTML = '';

    if (expenses.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-icon">💳</div>
        <h3>No hay gastos registrados</h3>
        <p>Agrega tu primer gasto para comenzar a hacer seguimiento</p>
      `;
      expensesList.appendChild(emptyState);
      return;
    }

    expenses.forEach(expense => {
      const expenseItem = document.createElement('div');
      expenseItem.className = 'expense-item';
      
      const categoryIcon = this.getCategoryIcon(expense.category);
      const installmentText = expense.total_installments > 1 
        ? ` (${expense.installment}/${expense.total_installments})` 
        : '';

      // Create elements safely
      const iconDiv = document.createElement('div');
      iconDiv.className = 'expense-icon';
      iconDiv.textContent = categoryIcon;

      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'expense-details';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'expense-title';
      titleDiv.textContent = this.escapeHTML(expense.description) + installmentText;

      const metaDiv = document.createElement('div');
      metaDiv.className = 'expense-meta';
      metaDiv.textContent = `${this.escapeHTML(expense.category)} • ${this.formatDate(expense.transaction_date)}`;

      const amountDiv = document.createElement('div');
      amountDiv.className = 'expense-amount';
      amountDiv.textContent = this.formatCurrency(expense.amount);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'expense-actions';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon delete';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.setAttribute('aria-label', 'Eliminar gasto');
      deleteBtn.addEventListener('click', () => this.deleteExpense(expense.id));

      detailsDiv.appendChild(titleDiv);
      detailsDiv.appendChild(metaDiv);
      actionsDiv.appendChild(deleteBtn);

      expenseItem.appendChild(iconDiv);
      expenseItem.appendChild(detailsDiv);
      expenseItem.appendChild(amountDiv);
      expenseItem.appendChild(actionsDiv);

      expensesList.appendChild(expenseItem);
    });
  }

  updateGoalsList() {
    if (!window.app || !window.app.data) return;

    const goalsList = document.getElementById('goals-list');
    if (!goalsList) return;

    const goals = window.app.data.getGoals();
    
    // Clear existing content
    goalsList.innerHTML = '';

    if (goals.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-icon">🎯</div>
        <h3>No hay objetivos definidos</h3>
        <p>Crea tu primer objetivo de ahorro para comenzar</p>
      `;
      goalsList.appendChild(emptyState);
      return;
    }

    goals.forEach(goal => {
      const goalItem = document.createElement('div');
      goalItem.className = 'goal-item';
      
      const currentAmount = parseFloat(goal.current_amount) || 0;
      const targetAmount = parseFloat(goal.target_amount) || 1;
      const progress = Math.min((currentAmount / targetAmount) * 100, 100);
      const progressClamped = Math.max(0, Math.min(progress, 100));

      // Create elements safely
      const headerDiv = document.createElement('div');
      headerDiv.className = 'goal-header';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'goal-title';
      titleDiv.textContent = this.escapeHTML(goal.name);

      const amountDiv = document.createElement('div');
      amountDiv.className = 'goal-amount';
      amountDiv.textContent = `${this.formatCurrency(currentAmount)} / ${this.formatCurrency(targetAmount)}`;

      const progressDiv = document.createElement('div');
      progressDiv.className = 'goal-progress';

      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';

      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = `${progressClamped}%`;

      const progressText = document.createElement('div');
      progressText.className = 'progress-text';
      progressText.textContent = `${progressClamped.toFixed(1)}%`;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'goal-actions';

      const addMoneyBtn = document.createElement('button');
      addMoneyBtn.className = 'btn btn-sm btn-primary';
      addMoneyBtn.textContent = 'Agregar $';
      addMoneyBtn.addEventListener('click', () => this.showAddMoneyModal(goal.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon delete';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.setAttribute('aria-label', 'Eliminar objetivo');
      deleteBtn.addEventListener('click', () => this.deleteGoal(goal.id));

      headerDiv.appendChild(titleDiv);
      headerDiv.appendChild(amountDiv);
      progressBar.appendChild(progressFill);
      progressDiv.appendChild(progressBar);
      progressDiv.appendChild(progressText);
      actionsDiv.appendChild(addMoneyBtn);
      actionsDiv.appendChild(deleteBtn);

      goalItem.appendChild(headerDiv);
      goalItem.appendChild(progressDiv);
      goalItem.appendChild(actionsDiv);

      goalsList.appendChild(goalItem);
    });
  }

  updateSpendingLimitsList() {
    if (!window.app || !window.app.data) return;

    const limitsList = document.getElementById('limits-list');
    if (!limitsList) return;

    const limits = window.app.data.getSpendingLimits();
    
    // Clear existing content
    limitsList.innerHTML = '';

    if (limits.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div class="empty-icon">🚦</div>
        <h3>No hay límites configurados</h3>
        <p>Establece límites de gasto para mejor control</p>
      `;
      limitsList.appendChild(emptyState);
      return;
    }

    limits.forEach(limit => {
      const limitItem = document.createElement('div');
      limitItem.className = 'limit-item';
      
      const expenses = window.app.data.getExpenses(this.currentMonth);
      const categoryExpenses = expenses.filter(exp => exp.category === limit.category);
      const currentSpent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const percentage = (currentSpent / limit.amount) * 100;
      const status = percentage >= 100 ? 'exceeded' : percentage >= limit.warning_percentage ? 'warning' : 'safe';

      // Create elements safely
      const headerDiv = document.createElement('div');
      headerDiv.className = 'limit-header';

      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'limit-category';
      categoryDiv.textContent = `${this.getCategoryIcon(limit.category)} ${this.escapeHTML(limit.category)}`;

      const amountDiv = document.createElement('div');
      amountDiv.className = 'limit-amount';
      amountDiv.textContent = `${this.formatCurrency(currentSpent)} / ${this.formatCurrency(limit.amount)}`;

      const progressDiv = document.createElement('div');
      progressDiv.className = 'limit-progress';

      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';

      const progressFill = document.createElement('div');
      progressFill.className = `progress-fill ${status}`;
      progressFill.style.width = `${Math.min(percentage, 100)}%`;

      const statusDiv = document.createElement('div');
      statusDiv.className = `limit-status ${status}`;
      statusDiv.textContent = `${percentage.toFixed(1)}%`;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'limit-actions';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon delete';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.setAttribute('aria-label', 'Eliminar límite');
      deleteBtn.addEventListener('click', () => this.deleteSpendingLimit(limit.id));

      headerDiv.appendChild(categoryDiv);
      headerDiv.appendChild(amountDiv);
      progressBar.appendChild(progressFill);
      progressDiv.appendChild(progressBar);
      progressDiv.appendChild(statusDiv);
      actionsDiv.appendChild(deleteBtn);

      limitItem.appendChild(headerDiv);
      limitItem.appendChild(progressDiv);
      limitItem.appendChild(actionsDiv);

      limitsList.appendChild(limitItem);
    });
  }

  async deleteExpense(expenseId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return;

    try {
      await window.app.data.deleteExpense(expenseId);
      this.showAlert('Gasto eliminado exitosamente', 'success');
      this.updateBalance();
      this.updateExpensesList();
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.showAlert('Error al eliminar el gasto', 'error');
    }
  }

  async deleteGoal(goalId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este objetivo?')) return;

    try {
      await window.app.data.deleteGoal(goalId);
      this.showAlert('Objetivo eliminado exitosamente', 'success');
      this.updateGoalsList();
    } catch (error) {
      console.error('Error deleting goal:', error);
      this.showAlert('Error al eliminar el objetivo', 'error');
    }
  }

  async deleteSpendingLimit(limitId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este límite?')) return;

    try {
      await window.app.data.deleteSpendingLimit(limitId);
      this.showAlert('Límite eliminado exitosamente', 'success');
      this.updateSpendingLimitsList();
    } catch (error) {
      console.error('Error deleting spending limit:', error);
      this.showAlert('Error al eliminar el límite', 'error');
    }
  }

  showAddMoneyModal(goalId) {
    const modal = document.getElementById('add-money-modal');
    if (modal) {
      modal.dataset.goalId = goalId;
      
      // Setup form handler
      const form = document.getElementById('add-money-form');
      if (form) {
        form.onsubmit = (e) => this.handleAddMoneyToGoal(e, goalId);
      }
      
      if (window.app.modals) {
        window.app.modals.show('add-money-modal');
      }
    }
  }

  async handleAddMoneyToGoal(e, goalId) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const amount = this.validateNumericInput(formData.get('amount'), 0.01);

    if (!amount.valid) {
      this.showAlert('Por favor ingresa un monto válido', 'error');
      return;
    }

    try {
      const result = await window.app.data.addMoneyToGoal(goalId, amount.value);
      
      e.target.reset();
      if (window.app.modals) {
        window.app.modals.hide('add-money-modal');
      }
      
      if (result.completed) {
        this.showAlert('¡Felicitaciones! Has completado tu objetivo 🎉', 'success');
      } else {
        this.showAlert('Dinero agregado al objetivo exitosamente', 'success');
      }
      
      this.updateGoalsList();
      
    } catch (error) {
      console.error('Error adding money to goal:', error);
      this.showAlert(error.message || 'Error al agregar dinero al objetivo', 'error');
    }
  }

  exportData(type) {
    if (!window.app || !window.app.data) return;

    try {
      const success = window.app.data.exportDataToCSV(type);
      if (success) {
        this.showAlert('Datos exportados exitosamente', 'success');
      } else {
        this.showAlert('Error al exportar los datos', 'error');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showAlert('Error al exportar los datos', 'error');
    }
  }

  async handleImportData(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.showAlert('Por favor selecciona un archivo CSV válido', 'error');
      return;
    }

    try {
      const result = await window.app.data.importDataFromCSV(file);
      
      if (result.imported > 0) {
        this.showAlert(`Importados ${result.imported} registros exitosamente`, 'success');
        this.updateBalance();
        this.updateExpensesList();
      } else {
        this.showAlert('No se pudieron importar los datos', 'error');
      }
      
      if (result.errors > 0) {
        this.showAlert(`${result.errors} registros tuvieron errores`, 'warning');
      }
      
    } catch (error) {
      console.error('Error importing data:', error);
      this.showAlert('Error al importar los datos', 'error');
    }

    // Reset file input
    e.target.value = '';
  }

  getCategoryIcon(category) {
    const icons = {
      'Comida': '🍔',
      'Transporte': '🚗',
      'Salud': '💊',
      'Ocio': '🎉',
      'Supermercado': '🛒',
      'Servicios': '📱',
      'Otros': '📦'
    };
    return icons[category] || '📦';
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'alert-close';
    closeBtn.innerHTML = '×';
    closeBtn.setAttribute('aria-label', 'Cerrar alerta');
    closeBtn.addEventListener('click', () => alert.remove());
    
    alert.appendChild(messageSpan);
    alert.appendChild(closeBtn);

    // Add to page
    const alertContainer = document.getElementById('alert-container') || document.body;
    alertContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }

  updateReportsData() {
    // This method is called by contextual bar when filters change
    console.log('📊 Updating reports data...');
    // Implementation depends on reports section structure
  }
}