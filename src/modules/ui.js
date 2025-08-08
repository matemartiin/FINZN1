export class UIManager {
  constructor() {
    this.currentMonth = this.getCurrentMonth();
    this.alertTimeout = null;
  }

  init() {
    console.log('🎨 Initializing UI Manager...');
    this.setupFormEvents();
    this.setupInstallmentToggle();
    this.setupModalEvents();
    this.updateCurrentDate();
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  getCurrentUserId() {
    return window.app?.auth?.getCurrentUserId() || null;
  }

  setupFormEvents() {
    // Add Expense Form
    const addExpenseForm = document.getElementById('add-expense-form');
    if (addExpenseForm) {
      addExpenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));
    }

    // Add Fixed Income Form
    const addFixedIncomeForm = document.getElementById('add-fixed-income-form');
    if (addFixedIncomeForm) {
      addFixedIncomeForm.addEventListener('submit', (e) => this.handleAddFixedIncome(e));
    }

    // Add Extra Income Form
    const addExtraIncomeForm = document.getElementById('add-extra-income-form');
    if (addExtraIncomeForm) {
      addExtraIncomeForm.addEventListener('submit', (e) => this.handleAddExtraIncome(e));
    }

    // Add Goal Form
    const addGoalForm = document.getElementById('add-goal-form');
    if (addGoalForm) {
      addGoalForm.addEventListener('submit', (e) => this.handleAddGoal(e));
    }

    // Add Money to Goal Form
    const addMoneyGoalForm = document.getElementById('add-money-goal-form');
    if (addMoneyGoalForm) {
      addMoneyGoalForm.addEventListener('submit', (e) => this.handleAddMoneyToGoal(e));
    }

    // Add Budget Form
    const addBudgetForm = document.getElementById('add-budget-form');
    if (addBudgetForm) {
      addBudgetForm.addEventListener('submit', (e) => this.handleAddBudget(e));
    }

    // Add Category Form
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
      addCategoryForm.addEventListener('submit', (e) => this.handleAddCategory(e));
    }

    // Add Spending Limit Form
    const addLimitForm = document.getElementById('add-limit-form');
    if (addLimitForm) {
      addLimitForm.addEventListener('submit', (e) => this.handleAddSpendingLimit(e));
    }
  }

  setupInstallmentToggle() {
    const installmentsCheckbox = document.getElementById('expense-installments');
    const installmentsOptions = document.getElementById('installments-options');
    
    if (installmentsCheckbox && installmentsOptions) {
      installmentsCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          installmentsOptions.classList.remove('hidden');
        } else {
          installmentsOptions.classList.add('hidden');
        }
      });
    }
  }

  setupModalEvents() {
    // Setup budget modal events if modals manager exists
    if (window.app && window.app.modals && window.app.modals.setupBudgetModalEvents) {
      window.app.modals.setupBudgetModalEvents();
    }
  }

  updateCurrentDate() {
    // Set current date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    
    const expenseDateInput = document.getElementById('expense-date');
    if (expenseDateInput && !expenseDateInput.value) {
      expenseDateInput.value = today;
    }

    const budgetStartDate = document.getElementById('budget-start-date');
    if (budgetStartDate && !budgetStartDate.value) {
      budgetStartDate.value = today;
    }

    // Set end date to end of current month
    const budgetEndDate = document.getElementById('budget-end-date');
    if (budgetEndDate && !budgetEndDate.value) {
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      budgetEndDate.value = endOfMonth.toISOString().split('T')[0];
    }
  }

  // Form Handlers

  async handleAddExpense(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expenseData = {
      description: formData.get('description')?.trim(),
      amount: formData.get('amount'),
      category: formData.get('category'),
      transactionDate: formData.get('date'),
      month: this.currentMonth,
      installments: formData.get('installments') === 'on',
      totalInstallments: parseInt(formData.get('total_installments')) || 1
    };

    // Validation
    if (!expenseData.description || !expenseData.amount || !expenseData.category || !expenseData.transactionDate) {
      this.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    if (parseFloat(expenseData.amount) <= 0) {
      this.showAlert('El monto debe ser mayor a 0', 'error');
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.addExpense(expenseData);
        
        if (success) {
          if (window.app.modals) {
            window.app.modals.hide('add-expense-modal');
          }
          
          this.showAlert('Gasto agregado exitosamente', 'success');
          this.updateBalance();
          this.updateExpensesList();
        } else {
          this.showAlert('Error al agregar el gasto', 'error');
        }
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      this.showAlert('Error al agregar el gasto', 'error');
    }
  }

  async handleAddFixedIncome(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const amount = formData.get('amount');

    if (!amount || parseFloat(amount) <= 0) {
      this.showAlert('Por favor ingresa un monto válido', 'error');
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.addFixedIncome(this.currentMonth, amount);
        
        if (success) {
          if (window.app.modals) {
            window.app.modals.hide('add-fixed-income-modal');
          }
          
          this.showAlert('Ingreso fijo configurado exitosamente', 'success');
          this.updateBalance();
          this.updateIncomeDisplay();
        } else {
          this.showAlert('Error al configurar el ingreso fijo', 'error');
        }
      }
    } catch (error) {
      console.error('Error adding fixed income:', error);
      this.showAlert('Error al configurar el ingreso fijo', 'error');
    }
  }

  async handleAddExtraIncome(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const incomeData = {
      description: formData.get('description')?.trim(),
      amount: formData.get('amount'),
      category: formData.get('category')
    };

    if (!incomeData.description || !incomeData.amount || !incomeData.category) {
      this.showAlert('Por favor completa todos los campos', 'error');
      return;
    }

    if (parseFloat(incomeData.amount) <= 0) {
      this.showAlert('El monto debe ser mayor a 0', 'error');
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.addExtraIncome(this.currentMonth, incomeData);
        
        if (success) {
          if (window.app.modals) {
            window.app.modals.hide('add-extra-income-modal');
          }
          
          this.showAlert('Ingreso extra agregado exitosamente', 'success');
          this.updateBalance();
          this.updateIncomeDisplay();
          this.updateExtraIncomesList();
        } else {
          this.showAlert('Error al agregar el ingreso extra', 'error');
        }
      }
    } catch (error) {
      console.error('Error adding extra income:', error);
      this.showAlert('Error al agregar el ingreso extra', 'error');
    }
  }

  async handleAddGoal(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const goalData = {
      name: formData.get('name')?.trim(),
      targetAmount: formData.get('target_amount'),
      currentAmount: formData.get('current_amount') || 0
    };

    if (!goalData.name || !goalData.targetAmount) {
      this.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    if (parseFloat(goalData.targetAmount) <= 0) {
      this.showAlert('El monto objetivo debe ser mayor a 0', 'error');
      return;
    }

    if (parseFloat(goalData.currentAmount) < 0) {
      this.showAlert('El monto actual no puede ser negativo', 'error');
      return;
    }

    if (parseFloat(goalData.currentAmount) > parseFloat(goalData.targetAmount)) {
      this.showAlert('El monto actual no puede ser mayor al objetivo', 'error');
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.addGoal(goalData);
        
        if (success) {
          if (window.app.modals) {
            window.app.modals.hide('add-goal-modal');
          }
          
          this.showAlert('Objetivo creado exitosamente', 'success');
          this.updateGoalsList();
        } else {
          this.showAlert('Error al crear el objetivo', 'error');
        }
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      this.showAlert('Error al crear el objetivo', 'error');
    }
  }

  async handleAddMoneyToGoal(e) {
    e.preventDefault();
    
    const modal = document.getElementById('add-money-goal-modal');
    const goalId = modal?.dataset.goalId;
    
    if (!goalId) {
      this.showAlert('Error: Objetivo no identificado', 'error');
      return;
    }

    const formData = new FormData(e.target);
    const amount = formData.get('amount');

    if (!amount || parseFloat(amount) <= 0) {
      this.showAlert('Por favor ingresa un monto válido', 'error');
      return;
    }

    try {
      if (window.app && window.app.data) {
        const result = await window.app.data.addMoneyToGoal(goalId, amount);
        
        if (result.success) {
          if (window.app.modals) {
            window.app.modals.hide('add-money-goal-modal');
          }
          
          if (result.completed) {
            this.showAlert('¡Felicitaciones! Has completado tu objetivo 🎉', 'success');
          } else {
            this.showAlert('Dinero agregado al objetivo exitosamente', 'success');
          }
          
          this.updateGoalsList();
        }
      }
    } catch (error) {
      console.error('Error adding money to goal:', error);
      this.showAlert(error.message || 'Error al agregar dinero al objetivo', 'error');
    }
  }

  async handleAddBudget(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const budgetData = {
      name: formData.get('name')?.trim(),
      category: formData.get('category'),
      amount: formData.get('amount'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      ai_recommended: formData.get('ai_recommendations') === 'on'
    };

    // Validation
    if (!budgetData.name || !budgetData.category || !budgetData.amount || !budgetData.start_date || !budgetData.end_date) {
      this.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    if (parseFloat(budgetData.amount) <= 0) {
      this.showAlert('El monto del presupuesto debe ser mayor a 0', 'error');
      return;
    }

    const startDate = new Date(budgetData.start_date);
    const endDate = new Date(budgetData.end_date);
    
    if (endDate <= startDate) {
      this.showAlert('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
      return;
    }

    try {
      if (window.app && window.app.budget) {
        const success = await window.app.budget.addBudget(budgetData);
        
        if (success) {
          if (window.app.modals) {
            window.app.modals.hide('add-budget-modal');
          }
          
          this.showAlert('Presupuesto creado exitosamente', 'success');
          this.updateBudgetsList();
        } else {
          this.showAlert('Error al crear el presupuesto', 'error');
        }
      }
    } catch (error) {
      console.error('Error adding budget:', error);
      this.showAlert('Error al crear el presupuesto', 'error');
    }
  }

  async handleAddCategory(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const categoryData = {
      name: formData.get('name')?.trim(),
      icon: formData.get('icon')?.trim(),
      color: formData.get('color')
    };

    if (!categoryData.name || !categoryData.icon || !categoryData.color) {
      this.showAlert('Por favor completa todos los campos', 'error');
      return;
    }

    // Validate icon (should be emoji or single character)
    if (categoryData.icon.length > 2) {
      this.showAlert('El icono debe ser un emoji o carácter único', 'error');
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.addCategory(categoryData);
        
        if (success) {
          if (window.app.modals) {
            window.app.modals.hide('add-category-modal');
          }
          
          this.showAlert('Categoría creada exitosamente', 'success');
          this.updateCategoriesList();
          this.updateCategorySelects();
        } else {
          this.showAlert('Error al crear la categoría', 'error');
        }
      }
    } catch (error) {
      console.error('Error adding category:', error);
      this.showAlert('Error al crear la categoría', 'error');
    }
  }

  async handleAddSpendingLimit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const limitData = {
      category: formData.get('category'),
      amount: formData.get('amount'),
      warningPercentage: formData.get('warning_percentage') || 80
    };

    if (!limitData.category || !limitData.amount) {
      this.showAlert('Por favor completa todos los campos obligatorios', 'error');
      return;
    }

    if (parseFloat(limitData.amount) <= 0) {
      this.showAlert('El límite debe ser mayor a 0', 'error');
      return;
    }

    const warningPercentage = parseInt(limitData.warningPercentage);
    if (warningPercentage < 1 || warningPercentage > 100) {
      this.showAlert('El porcentaje de alerta debe estar entre 1 y 100', 'error');
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.addSpendingLimit(limitData);
        
        if (success) {
          if (window.app.modals) {
            window.app.modals.hide('add-limit-modal');
          }
          
          this.showAlert('Límite de gasto creado exitosamente', 'success');
          this.updateSpendingLimitsList();
        } else {
          this.showAlert('Error al crear el límite de gasto', 'error');
        }
      }
    } catch (error) {
      console.error('Error adding spending limit:', error);
      this.showAlert('Error al crear el límite de gasto', 'error');
    }
  }

  // Modal Helpers

  showAddExpenseModal() {
    this.updateCategorySelects();
    if (window.app && window.app.modals) {
      window.app.modals.show('add-expense-modal');
    }
  }

  showAddBudgetModal() {
    this.updateCategorySelects();
    if (window.app && window.app.modals) {
      window.app.modals.show('add-budget-modal');
    }
  }

  showAddSpendingLimitModal() {
    this.updateCategorySelects();
    if (window.app && window.app.modals) {
      window.app.modals.show('add-limit-modal');
    }
  }

  showAddMoneyToGoalModal(goalId, goalName, currentAmount, targetAmount) {
    const modal = document.getElementById('add-money-goal-modal');
    const goalInfoName = document.getElementById('goal-info-name');
    const goalInfoProgress = document.getElementById('goal-info-progress');
    
    if (modal && goalInfoName && goalInfoProgress) {
      modal.dataset.goalId = goalId;
      goalInfoName.textContent = goalName;
      
      const percentage = ((currentAmount / targetAmount) * 100).toFixed(1);
      goalInfoProgress.textContent = `${this.formatCurrency(currentAmount)} de ${this.formatCurrency(targetAmount)} (${percentage}%)`;
      
      if (window.app && window.app.modals) {
        window.app.modals.show('add-money-goal-modal');
      }
    }
  }

  // UI Update Methods

  updateBalance() {
    if (!window.app || !window.app.data) return;

    const balance = window.app.data.calculateBalance(this.currentMonth);
    
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpensesEl = document.getElementById('total-expenses');
    const availableBalanceEl = document.getElementById('available-balance');
    const activeInstallmentsEl = document.getElementById('active-installments');

    if (totalIncomeEl) {
      totalIncomeEl.textContent = this.formatCurrency(balance.totalIncome);
    }
    
    if (totalExpensesEl) {
      totalExpensesEl.textContent = this.formatCurrency(balance.totalExpenses);
    }
    
    if (availableBalanceEl) {
      availableBalanceEl.textContent = this.formatCurrency(balance.available);
      availableBalanceEl.className = `balance-amount ${balance.available >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (activeInstallmentsEl) {
      activeInstallmentsEl.textContent = balance.installments;
    }

    // Update spending limit alerts
    this.updateSpendingAlerts();
  }

  updateExpensesList() {
    if (!window.app || !window.app.data) return;

    const expenses = window.app.data.getExpenses(this.currentMonth);
    const expensesList = document.getElementById('expenses-list');
    const recentTransactions = document.getElementById('recent-transactions');

    if (!expensesList) return;

    if (expenses.length === 0) {
      expensesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💳</div>
          <h3>No hay gastos registrados</h3>
          <p>Comienza agregando tus primeros gastos para llevar un control de tus finanzas</p>
          <button class="btn btn-primary" onclick="window.app.ui.showAddExpenseModal()">
            <span class="btn-icon">➕</span>
            Agregar Primer Gasto
          </button>
        </div>
      `;
      
      if (recentTransactions) {
        recentTransactions.innerHTML = '<p class="no-data">No hay transacciones recientes</p>';
      }
      return;
    }

    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(b.transaction_date) - new Date(a.transaction_date)
    );

    // Update main expenses list
    expensesList.innerHTML = sortedExpenses.map(expense => `
      <div class="transaction-item expense">
        <div class="transaction-icon">💳</div>
        <div class="transaction-details">
          <div class="transaction-description">${this.escapeHtml(expense.description)}</div>
          <div class="transaction-meta">
            <span class="transaction-category">${this.escapeHtml(expense.category)}</span>
            <span class="transaction-date">${this.formatDate(expense.transaction_date)}</span>
            ${expense.total_installments > 1 ? 
              `<span class="transaction-installment">${expense.installment}/${expense.total_installments}</span>` : 
              ''
            }
          </div>
        </div>
        <div class="transaction-amount expense-amount">
          -${this.formatCurrency(expense.amount)}
        </div>
        <div class="transaction-actions">
          <button class="action-btn delete" onclick="window.app.ui.deleteExpense('${expense.id}')" title="Eliminar">
            🗑️
          </button>
        </div>
      </div>
    `).join('');

    // Update recent transactions (show last 5)
    if (recentTransactions) {
      const recentExpenses = sortedExpenses.slice(0, 5);
      recentTransactions.innerHTML = recentExpenses.map(expense => `
        <div class="activity-item">
          <div class="activity-icon">💳</div>
          <div class="activity-details">
            <div class="activity-description">${this.escapeHtml(expense.description)}</div>
            <div class="activity-meta">${this.escapeHtml(expense.category)} • ${this.formatDate(expense.transaction_date)}</div>
          </div>
          <div class="activity-amount expense">-${this.formatCurrency(expense.amount)}</div>
        </div>
      `).join('');
    }
  }

  updateIncomeDisplay() {
    if (!window.app || !window.app.data) return;

    const income = window.app.data.getIncome(this.currentMonth);
    const extraIncomes = window.app.data.getExtraIncomes(this.currentMonth);
    
    const fixedIncomeEl = document.getElementById('fixed-income-amount');
    const extraIncomeEl = document.getElementById('extra-income-amount');

    if (fixedIncomeEl) {
      fixedIncomeEl.textContent = this.formatCurrency(income.fixed);
    }

    if (extraIncomeEl) {
      const totalExtra = extraIncomes.reduce((sum, extra) => sum + parseFloat(extra.amount), 0);
      extraIncomeEl.textContent = this.formatCurrency(totalExtra);
    }
  }

  updateExtraIncomesList() {
    if (!window.app || !window.app.data) return;

    const extraIncomes = window.app.data.getExtraIncomes(this.currentMonth);
    const extraIncomesList = document.getElementById('extra-incomes-list');

    if (!extraIncomesList) return;

    if (extraIncomes.length === 0) {
      extraIncomesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💵</div>
          <h3>No hay ingresos extra registrados</h3>
          <p>Agrega ingresos adicionales como freelance, ventas, etc.</p>
        </div>
      `;
      return;
    }

    extraIncomesList.innerHTML = extraIncomes.map(income => `
      <div class="transaction-item income">
        <div class="transaction-icon">💵</div>
        <div class="transaction-details">
          <div class="transaction-description">${this.escapeHtml(income.description)}</div>
          <div class="transaction-meta">
            <span class="transaction-category">${this.escapeHtml(income.category)}</span>
            <span class="transaction-date">${this.formatDate(income.created_at)}</span>
          </div>
        </div>
        <div class="transaction-amount income-amount">
          +${this.formatCurrency(income.amount)}
        </div>
      </div>
    `).join('');
  }

  updateGoalsList() {
    if (!window.app || !window.app.data) return;

    const goals = window.app.data.getGoals();
    const goalsList = document.getElementById('goals-list');

    if (!goalsList) return;

    if (goals.length === 0) {
      goalsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <h3>No tienes objetivos de ahorro</h3>
          <p>Define tus metas financieras y trabaja para alcanzarlas</p>
          <button class="btn btn-primary" onclick="window.app.modals.show('add-goal-modal')">
            <span class="btn-icon">🎯</span>
            Crear Primer Objetivo
          </button>
        </div>
      `;
      return;
    }

    goalsList.innerHTML = goals.map(goal => {
      const currentAmount = parseFloat(goal.current_amount) || 0;
      const targetAmount = parseFloat(goal.target_amount) || 1;
      const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
      const isCompleted = percentage >= 100;

      return `
        <div class="goal-card ${isCompleted ? 'completed' : ''}">
          <div class="goal-header">
            <h4 class="goal-name">${this.escapeHtml(goal.name)}</h4>
            <div class="goal-percentage">${percentage.toFixed(1)}%</div>
          </div>
          
          <div class="goal-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="progress-text">
              ${this.formatCurrency(currentAmount)} de ${this.formatCurrency(targetAmount)}
            </div>
          </div>
          
          <div class="goal-actions">
            ${!isCompleted ? `
              <button class="btn btn-primary btn-sm" onclick="window.app.ui.showAddMoneyToGoalModal('${goal.id}', '${this.escapeHtml(goal.name)}', ${currentAmount}, ${targetAmount})">
                <span class="btn-icon">💰</span>
                Agregar Dinero
              </button>
            ` : `
              <div class="goal-completed">
                <span class="completion-icon">🎉</span>
                ¡Objetivo Completado!
              </div>
            `}
            <button class="btn btn-danger btn-sm" onclick="window.app.ui.deleteGoal('${goal.id}')" title="Eliminar objetivo">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  updateBudgetsList() {
    if (!window.app || !window.app.budget || !window.app.data) return;

    const budgets = window.app.budget.getBudgets();
    const expenses = window.app.data.getExpenses(this.currentMonth);
    const budgetsList = document.getElementById('budgets-list');

    if (!budgetsList) return;

    if (budgets.length === 0) {
      budgetsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <h3>No tienes presupuestos configurados</h3>
          <p>Crea presupuestos para controlar mejor tus gastos por categoría</p>
          <button class="btn btn-primary" onclick="window.app.ui.showAddBudgetModal()">
            <span class="btn-icon">➕</span>
            Crear Primer Presupuesto
          </button>
        </div>
      `;
      return;
    }

    const budgetsWithProgress = window.app.budget.getBudgetsWithProgress(expenses);

    budgetsList.innerHTML = budgetsWithProgress.map(budget => {
      const progress = budget.progress;
      const statusClass = progress.status;
      const statusIcon = {
        'safe': '✅',
        'caution': '⚠️',
        'warning': '🚨',
        'exceeded': '🔴'
      }[progress.status] || '📊';

      return `
        <div class="budget-card ${statusClass}">
          <div class="budget-header">
            <div class="budget-info">
              <h4 class="budget-name">${this.escapeHtml(budget.name)}</h4>
              <div class="budget-category">${this.escapeHtml(budget.category)}</div>
            </div>
            <div class="budget-status">
              <span class="status-icon">${statusIcon}</span>
            </div>
          </div>
          
          <div class="budget-progress">
            <div class="progress-bar">
              <div class="progress-fill ${statusClass}" style="width: ${Math.min(progress.percentage, 100)}%"></div>
            </div>
            <div class="progress-text">
              ${this.formatCurrency(progress.spent)} de ${this.formatCurrency(budget.amount)}
              (${progress.percentage.toFixed(1)}%)
            </div>
          </div>
          
          <div class="budget-details">
            <div class="budget-period">
              ${this.formatDate(budget.start_date)} - ${this.formatDate(budget.end_date)}
            </div>
            <div class="budget-remaining ${progress.remaining >= 0 ? 'positive' : 'negative'}">
              Restante: ${this.formatCurrency(progress.remaining)}
            </div>
          </div>
          
          <div class="budget-actions">
            <button class="btn btn-danger btn-sm" onclick="window.app.ui.deleteBudget('${budget.id}')" title="Eliminar presupuesto">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Update budget summary
    this.updateBudgetSummary(budgetsWithProgress);
  }

  updateBudgetSummary(budgetsWithProgress) {
    const activeBudgetsCount = document.getElementById('active-budgets-count');
    const totalBudgeted = document.getElementById('total-budgeted');
    const totalSpent = document.getElementById('total-spent');

    if (activeBudgetsCount) {
      activeBudgetsCount.textContent = budgetsWithProgress.length;
    }

    if (totalBudgeted) {
      const total = budgetsWithProgress.reduce((sum, budget) => sum + parseFloat(budget.amount), 0);
      totalBudgeted.textContent = this.formatCurrency(total);
    }

    if (totalSpent) {
      const total = budgetsWithProgress.reduce((sum, budget) => sum + budget.progress.spent, 0);
      totalSpent.textContent = this.formatCurrency(total);
    }
  }

  updateCategoriesList() {
    if (!window.app || !window.app.data) return;

    const categories = window.app.data.getCategories();
    const categoriesList = document.getElementById('categories-list');

    if (!categoriesList) return;

    if (categories.length === 0) {
      categoriesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏷️</div>
          <h3>No hay categorías personalizadas</h3>
          <p>Las categorías por defecto están disponibles. Puedes crear categorías adicionales.</p>
        </div>
      `;
      return;
    }

    categoriesList.innerHTML = categories.map(category => `
      <div class="category-card" style="border-left: 4px solid ${category.color}">
        <div class="category-icon" style="background-color: ${category.color}20">
          ${category.icon}
        </div>
        <div class="category-info">
          <h4 class="category-name">${this.escapeHtml(category.name)}</h4>
          <div class="category-color" style="background-color: ${category.color}"></div>
        </div>
        <div class="category-actions">
          <button class="btn btn-danger btn-sm" onclick="window.app.ui.deleteCategory('${category.id}')" title="Eliminar categoría">
            🗑️
          </button>
        </div>
      </div>
    `).join('');
  }

  updateSpendingLimitsList() {
    if (!window.app || !window.app.data) return;

    const limits = window.app.data.getSpendingLimits();
    const limitsList = document.getElementById('limits-list');

    if (!limitsList) return;

    if (limits.length === 0) {
      limitsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🚦</div>
          <h3>No hay límites de gasto configurados</h3>
          <p>Establece límites para controlar tus gastos por categoría</p>
          <button class="btn btn-primary" onclick="window.app.ui.showAddSpendingLimitModal()">
            <span class="btn-icon">🚦</span>
            Crear Primer Límite
          </button>
        </div>
      `;
      return;
    }

    // Get current spending for each category
    const expenses = window.app.data.getExpenses(this.currentMonth);
    
    limitsList.innerHTML = limits.map(limit => {
      const categoryExpenses = expenses.filter(exp => exp.category === limit.category);
      const currentSpent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const percentage = (currentSpent / parseFloat(limit.amount)) * 100;
      const warningPercentage = limit.warning_percentage || 80;
      
      let statusClass = 'safe';
      let statusIcon = '✅';
      
      if (percentage >= 100) {
        statusClass = 'exceeded';
        statusIcon = '🔴';
      } else if (percentage >= warningPercentage) {
        statusClass = 'warning';
        statusIcon = '🚨';
      } else if (percentage >= 60) {
        statusClass = 'caution';
        statusIcon = '⚠️';
      }

      return `
        <div class="limit-card ${statusClass}">
          <div class="limit-header">
            <div class="limit-info">
              <h4 class="limit-category">${this.escapeHtml(limit.category)}</h4>
              <div class="limit-amount">Límite: ${this.formatCurrency(limit.amount)}</div>
            </div>
            <div class="limit-status">
              <span class="status-icon">${statusIcon}</span>
            </div>
          </div>
          
          <div class="limit-progress">
            <div class="progress-bar">
              <div class="progress-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="progress-text">
              ${this.formatCurrency(currentSpent)} gastado (${percentage.toFixed(1)}%)
            </div>
          </div>
          
          <div class="limit-details">
            <div class="limit-remaining ${currentSpent <= parseFloat(limit.amount) ? 'positive' : 'negative'}">
              Restante: ${this.formatCurrency(parseFloat(limit.amount) - currentSpent)}
            </div>
            <div class="limit-warning">
              Alerta al ${warningPercentage}%
            </div>
          </div>
          
          <div class="limit-actions">
            <button class="btn btn-danger btn-sm" onclick="window.app.ui.deleteSpendingLimit('${limit.id}')" title="Eliminar límite">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  updateCategorySelects() {
    if (!window.app || !window.app.data) return;

    const categories = window.app.data.getCategories();
    const selects = [
      'expense-category',
      'budget-category',
      'limit-category'
    ];

    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        // Clear existing options
        select.innerHTML = '';
        
        // Add categories
        categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.name;
          option.textContent = `${category.icon} ${category.name}`;
          select.appendChild(option);
        });
      }
    });
  }

  updateSpendingAlerts() {
    if (!window.app || !window.app.data) return;

    const alerts = window.app.data.checkSpendingLimits(this.currentMonth);
    const alertsContainer = document.getElementById('dashboard-alerts');

    if (!alertsContainer) return;

    if (alerts.length === 0) {
      alertsContainer.innerHTML = '';
      return;
    }

    alertsContainer.innerHTML = alerts.map(alert => `
      <div class="alert alert-${alert.type}">
        <div class="alert-icon">
          ${alert.type === 'danger' ? '🚨' : '⚠️'}
        </div>
        <div class="alert-content">
          <div class="alert-message">${alert.message}</div>
          <div class="alert-details">${alert.percentage}% del límite utilizado</div>
        </div>
        <button class="alert-close" onclick="this.parentElement.remove()">✕</button>
      </div>
    `).join('');
  }

  // Delete Methods

  async deleteExpense(expenseId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.deleteExpense(expenseId);
        
        if (success) {
          this.showAlert('Gasto eliminado exitosamente', 'success');
          this.updateBalance();
          this.updateExpensesList();
        } else {
          this.showAlert('Error al eliminar el gasto', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.showAlert('Error al eliminar el gasto', 'error');
    }
  }

  async deleteGoal(goalId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este objetivo?')) {
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.deleteGoal(goalId);
        
        if (success) {
          this.showAlert('Objetivo eliminado exitosamente', 'success');
          this.updateGoalsList();
        } else {
          this.showAlert('Error al eliminar el objetivo', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      this.showAlert('Error al eliminar el objetivo', 'error');
    }
  }

  async deleteBudget(budgetId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
      return;
    }

    try {
      if (window.app && window.app.budget) {
        const success = await window.app.budget.deleteBudget(budgetId);
        
        if (success) {
          this.showAlert('Presupuesto eliminado exitosamente', 'success');
          this.updateBudgetsList();
        } else {
          this.showAlert('Error al eliminar el presupuesto', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      this.showAlert('Error al eliminar el presupuesto', 'error');
    }
  }

  async deleteCategory(categoryId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.deleteCategory(categoryId);
        
        if (success) {
          this.showAlert('Categoría eliminada exitosamente', 'success');
          this.updateCategoriesList();
          this.updateCategorySelects();
        } else {
          this.showAlert('Error al eliminar la categoría', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      this.showAlert('Error al eliminar la categoría', 'error');
    }
  }

  async deleteSpendingLimit(limitId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este límite?')) {
      return;
    }

    try {
      if (window.app && window.app.data) {
        const success = await window.app.data.deleteSpendingLimit(limitId);
        
        if (success) {
          this.showAlert('Límite eliminado exitosamente', 'success');
          this.updateSpendingLimitsList();
        } else {
          this.showAlert('Error al eliminar el límite', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting spending limit:', error);
      this.showAlert('Error al eliminar el límite', 'error');
    }
  }

  // Utility Methods

  showAlert(message, type = 'info') {
    if (!message || typeof message !== 'string') {
      console.warn('Invalid alert message:', message);
      return;
    }

    if (!['info', 'success', 'warning', 'error'].includes(type)) {
      console.warn('Invalid alert type:', type);
      type = 'info';
    }

    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
      console.warn('Alert container not found');
      return;
    }

    // Clear existing timeout
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    const alertId = 'alert-' + Date.now();
    const alertElement = document.createElement('div');
    alertElement.id = alertId;
    alertElement.className = `alert alert-${type}`;
    
    const alertIcon = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    }[type] || 'ℹ️';

    alertElement.innerHTML = `
      <div class="alert-icon">${alertIcon}</div>
      <div class="alert-message">${this.escapeHtml(message)}</div>
      <button class="alert-close" onclick="this.parentElement.remove()">✕</button>
    `;

    alertContainer.appendChild(alertElement);

    // Auto-remove after 5 seconds
    this.alertTimeout = setTimeout(() => {
      const alert = document.getElementById(alertId);
      if (alert) {
        alert.remove();
      }
    }, 5000);
  }

  formatCurrency(amount) {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return dateString;
    }
  }

  escapeHtml(text) {
    if (typeof text !== 'string') {
      return String(text || '');
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Reports Data Update
  updateReportsData() {
    // This method can be called by contextual bar to refresh reports
    console.log('📊 Updating reports data...');
    
    // If we're in the reports section, we might want to regenerate the current report
    const reportContent = document.getElementById('report-content');
    if (reportContent && !reportContent.innerHTML.includes('report-placeholder')) {
      // There's an existing report, we could offer to regenerate it
      // For now, we'll just log that data has been updated
      console.log('📊 Reports data context updated');
    }
  }
}