import { inputValidator } from './input-validation.js';

export class UIManager {
  constructor() {
    this.alertContainer = document.getElementById('alert-container');
    this.mascotMessageQueue = [];
    this.isShowingMascotMessage = false;
    this.currentMascotTimeout = null;
    this.setupMascotHoverBehavior();
  }

  // Utility function to safely escape HTML characters
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility function to safely set text content
  safeSetText(element, text) {
    if (element && typeof text === 'string') {
      element.textContent = text;
    }
  }

  // Utility function to format dates safely without timezone issues
  formatDateSafe(dateStr, options = {}) {
    if (!dateStr) return 'Sin fecha';
    
    // If it's already in YYYY-MM-DD format, parse it manually to avoid timezone issues
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      const defaultOptions = {
        day: 'numeric', 
        month: 'short' 
      };
      
      const formatOptions = { ...defaultOptions, ...options };
      return date.toLocaleDateString('es-ES', formatOptions);
    }
    
    // Fallback to Date constructor with timezone fix
    try {
      const date = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
      const defaultOptions = {
        day: 'numeric', 
        month: 'short' 
      };
      
      const formatOptions = { ...defaultOptions, ...options };
      return date.toLocaleDateString('es-ES', formatOptions);
    } catch (e) {
      console.warn('Could not format date:', dateStr, e);
      return 'Sin fecha';
    }
  }

  parseDateSafe(dateStr) {
    if (!dateStr) return new Date();
    
    // If it's already in YYYY-MM-DD format, parse it manually to avoid timezone issues
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Fallback to Date constructor with timezone fix
    try {
      return new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
    } catch (e) {
      console.warn('Could not parse date:', dateStr, e);
      return new Date();
    }
  }

  setupMascotHoverBehavior() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeMascotHover();
    });
    
    // Also try to initialize immediately in case DOM is already ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeMascotHover();
      });
    } else {
      this.initializeMascotHover();
    }
  }

  initializeMascotHover() {
    const mascotContainer = document.querySelector('.chart-mascot-container');
    const dynamicMessage = document.getElementById('mascot-dynamic-message');
    
    if (!mascotContainer || !dynamicMessage) {
      // Retry after a short delay if elements aren't ready
      setTimeout(() => this.initializeMascotHover(), 500);
      return;
    }

    console.log('Initializing mascot hover behavior');

    mascotContainer.addEventListener('mouseenter', () => {
      this.showHoverMessage(dynamicMessage);
    });

    mascotContainer.addEventListener('mouseleave', () => {
      this.hideHoverMessage(dynamicMessage);
    });
  }

  showHoverMessage(messageElement) {
    if (!messageElement) return;

    // Clear any existing message first
    this.clearMascotMessage(messageElement);

    // Get current financial context for personalized message
    const messages = this.getContextualMascotMessages();
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Set flag to prevent overlapping
    this.isShowingMascotMessage = true;
    
    messageElement.textContent = randomMessage.text;
    messageElement.className = `mascot-alert mascot-alert-${randomMessage.type}`;
    messageElement.style.opacity = '1';
    messageElement.style.visibility = 'visible';
    messageElement.style.pointerEvents = 'none';
    
    console.log('Mascot speaking on hover:', randomMessage.text);
  }

  hideHoverMessage(messageElement) {
    if (!messageElement) return;
    
    this.clearMascotMessage(messageElement);
    console.log('Mascot returning to silent state');
  }

  clearMascotMessage(messageElement) {
    if (!messageElement) return;
    
    // Clear any existing timeout
    if (this.currentMascotTimeout) {
      clearTimeout(this.currentMascotTimeout);
      this.currentMascotTimeout = null;
    }
    
    // Hide message immediately
    messageElement.style.opacity = '0';
    messageElement.style.visibility = 'hidden';
    messageElement.textContent = '';
    messageElement.className = 'mascot-alert';
    
    // Reset flag
    this.isShowingMascotMessage = false;
  }

  getContextualMascotMessages() {
    // Get current balance if available (try both new unified and legacy IDs)
    const balanceElement = document.getElementById('balance-amount-new') || document.querySelector('.balance-amount');
    const balanceText = balanceElement ? balanceElement.textContent : '';
    
    // Parse balance (remove currency symbols and convert to number)
    const balanceValue = parseFloat(balanceText.replace(/[^0-9.-]/g, '')) || 0;
    
    const messages = [
      { text: '¡Hola! Soy tu asistente financiero personal', type: 'info' },
      { text: '¿Sabías que ahorrar el 20% de tus ingresos es ideal?', type: 'info' },
      { text: 'Revisa tus gastos regularmente para mantener el control', type: 'info' },
      { text: '¡Cada peso ahorrado es un paso hacia tus metas!', type: 'success' },
      { text: 'Planifica tus compras para evitar gastos impulsivos', type: 'info' }
    ];

    // Add contextual messages based on balance
    if (balanceValue < 0) {
      messages.push(
        { text: '¡Cuidado! Estás gastando más de lo que ingresas', type: 'warning' },
        { text: 'Considera revisar tus gastos no esenciales', type: 'warning' }
      );
    } else if (balanceValue > 1000) {
      messages.push(
        { text: '¡Excelente! Tienes un buen balance este mes', type: 'success' },
        { text: '¡Buen trabajo! Considera invertir tus ahorros', type: 'success' }
      );
    }

    return messages;
  }

  updateBalance(balance) {
    // New unified card elements (primary)
    const balanceAmount = document.getElementById('balance-amount-new');
    const monthlyExpenses = document.getElementById('monthly-expenses-summary');
    const incomeAmount = document.getElementById('income-summary');
    const installmentsCount = document.getElementById('installments-count');
    
    // Alternative selectors for unified card and new card
    const unifiedBalanceAmount = document.querySelector('.balance-amount');
    const newBalanceAmount = document.querySelector('.new-balance-amount');
    const unifiedIncomeAmount = document.querySelector('#income-summary');
    const unifiedExpensesAmount = document.querySelector('#monthly-expenses-summary');
    const unifiedInstallmentsCount = document.querySelector('#installments-count');
    
    console.log('🔄 Updating balance UI with:', balance);
    
    // Update balance amount (try all selectors)
    const balanceEl = balanceAmount || unifiedBalanceAmount || newBalanceAmount;
    if (balanceEl) {
      balanceEl.textContent = this.formatCurrency(balance.available);
      console.log('💰 Balance amount updated:', balance.available);
      
      // Use FINZN brand color for all balance numbers
      if (balanceAmount) {
        balanceAmount.style.color = '#C8B6FF';
      }
    }
    
    // Update expenses (try both selectors)
    const expensesEl = monthlyExpenses || unifiedExpensesAmount;
    if (expensesEl) {
      expensesEl.textContent = this.formatCurrency(balance.totalExpenses);
      // Use FINZN brand color for all expense amounts
      if (unifiedExpensesAmount) {
        expensesEl.style.setProperty('color', '#C8B6FF', 'important');
        expensesEl.setAttribute('data-color-forced', 'true');
      }
      console.log('💳 Monthly expenses updated:', balance.totalExpenses);
    }
    
    // Update income (try both selectors)
    const incomeEl = incomeAmount || unifiedIncomeAmount;
    if (incomeEl) {
      incomeEl.textContent = this.formatCurrency(balance.totalIncome);
      // Use FINZN brand color for all income amounts
      if (unifiedIncomeAmount) {
        incomeEl.style.setProperty('color', '#C8B6FF', 'important');
        incomeEl.setAttribute('data-color-forced', 'true');
      }
      console.log('💵 Income amount updated:', balance.totalIncome);
    }
    
    // Update installments count (try both selectors)
    const installmentsEl = installmentsCount || unifiedInstallmentsCount;
    if (installmentsEl) {
      installmentsEl.textContent = balance.installments;
      console.log('📊 Installments count updated:', balance.installments);
    }
  }

  updateExpensesList(expenses, app) {
    const container = document.getElementById('expenses-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (expenses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="ph ph-credit-card"></i></div>
          <h3>No hay gastos registrados</h3>
          <p>Comienza agregando tu primer gasto del mes</p>
          <button class="btn btn-primary" onclick="window.app.showAddExpenseModal()">
            <i class="ph ph-plus" aria-hidden="true"></i>
            Agregar Gasto
          </button>
        </div>
      `;
      return;
    }

    expenses.forEach(expense => {
      const item = document.createElement('div');
      item.className = 'expense-item fade-in';
      
      const category = this.getCategoryInfo(expense.category);
      
      const transactionDate = expense.transaction_date 
        ? this.formatDateSafe(expense.transaction_date, { 
            day: 'numeric', 
            month: 'short' 
          })
        : 'Sin fecha';
      
      // Create elements safely without innerHTML
      const expenseIcon = document.createElement('div');
      expenseIcon.className = 'expense-icon';
      expenseIcon.innerHTML = category.icon; // Safe - controlled content from getCategoryInfo

      const expenseDetails = document.createElement('div');
      expenseDetails.className = 'expense-details';

      const expenseDescription = document.createElement('div');
      expenseDescription.className = 'expense-description';
      expenseDescription.textContent = expense.description;

      const expenseCategory = document.createElement('div');
      expenseCategory.className = 'expense-category';
      expenseCategory.textContent = `${category.name} • ${transactionDate}`;

      expenseDetails.appendChild(expenseDescription);
      expenseDetails.appendChild(expenseCategory);

      if (expense.total_installments > 1) {
        const expenseInstallment = document.createElement('div');
        expenseInstallment.className = 'expense-installment';
        expenseInstallment.textContent = `Cuota ${expense.installment} de ${expense.total_installments}`;
        expenseDetails.appendChild(expenseInstallment);
      }

      const expenseAmount = document.createElement('div');
      expenseAmount.className = 'expense-amount';
      expenseAmount.textContent = this.formatCurrency(expense.amount);

      const expenseActions = document.createElement('div');
      expenseActions.className = 'expense-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'expense-action-btn edit-btn js-expense-edit';
      editBtn.setAttribute('data-id', expense.id);
      editBtn.setAttribute('title', 'Editar');
      editBtn.innerHTML = '<i class="ph ph-pencil-simple" aria-hidden="true"></i>';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'expense-action-btn delete-btn js-expense-delete';
      deleteBtn.setAttribute('data-id', expense.id);
      deleteBtn.setAttribute('data-description', expense.description);
      deleteBtn.setAttribute('title', 'Eliminar');
      deleteBtn.innerHTML = '<i class="ph ph-trash" aria-hidden="true"></i>';

      expenseActions.appendChild(editBtn);
      expenseActions.appendChild(deleteBtn);

      item.appendChild(expenseIcon);
      item.appendChild(expenseDetails);
      item.appendChild(expenseAmount);
      item.appendChild(expenseActions);
      
      item.style.borderLeftColor = category.color;
      container.appendChild(item);
    });
  }

  updateRecentTransactions(expenses, income, extraIncomes) {
    const container = document.getElementById('recent-transactions-list');
    if (!container) return;
    
    container.innerHTML = '';

    // Combine all transactions
    const allTransactions = [];
    
    // Add expenses
    expenses.forEach(expense => {
      allTransactions.push({
        type: 'expense',
        id: expense.id,
        description: expense.description,
        amount: -expense.amount,
        date: this.parseDateSafe(expense.transaction_date),
        category: expense.category
      });
    });
    
    // Add fixed income
    if (income && income.amount > 0) {
      allTransactions.push({
        type: 'income',
        id: 'fixed-income',
        description: income.description || 'Salario fijo',
        amount: income.amount,
        date: new Date(),
        category: 'income'
      });
    }
    
    // Add extra incomes
    extraIncomes.forEach(extraIncome => {
      allTransactions.push({
        type: 'income',
        id: extraIncome.id,
        description: extraIncome.description,
        amount: extraIncome.amount,
        date: new Date(extraIncome.date),
        category: 'income'
      });
    });
    
    // Sort by date (most recent first) and take last 5
    const recentTransactions = allTransactions
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
      
    if (recentTransactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state-small">
          <i class="ph ph-list-dashes"></i>
          <span>No hay transacciones recientes</span>
        </div>
      `;
      return;
    }

    recentTransactions.forEach(transaction => {
      const item = document.createElement('div');
      item.className = 'recent-transaction-item';
      
      const isIncome = transaction.type === 'income';
      const categoryInfo = isIncome 
        ? { icon: '<i class="ph ph-arrow-up"></i>', name: 'Ingreso', color: '#22c55e' }
        : this.getCategoryInfo(transaction.category);
      
      const formattedDate = transaction.date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
      
      // Create elements safely
      const transactionIcon = document.createElement('div');
      transactionIcon.className = 'transaction-icon';
      transactionIcon.style.color = categoryInfo.color;
      transactionIcon.innerHTML = categoryInfo.icon; // Icon HTML is safe (controlled content)

      const transactionDetails = document.createElement('div');
      transactionDetails.className = 'transaction-details';

      const transactionDescription = document.createElement('div');
      transactionDescription.className = 'transaction-description';
      transactionDescription.textContent = transaction.description; // Safe text content

      const transactionDate = document.createElement('div');
      transactionDate.className = 'transaction-date';
      transactionDate.textContent = formattedDate;

      transactionDetails.appendChild(transactionDescription);
      transactionDetails.appendChild(transactionDate);

      const transactionAmount = document.createElement('div');
      transactionAmount.className = `transaction-amount ${isIncome ? 'income' : 'expense'}`;
      transactionAmount.textContent = `${isIncome ? '+' : ''}${this.formatCurrency(Math.abs(transaction.amount))}`;

      item.appendChild(transactionIcon);
      item.appendChild(transactionDetails);
      item.appendChild(transactionAmount);
      
      container.appendChild(item);
    });
  }

  updateGoalsList(goals) {
    const container = document.getElementById('goals-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="ph ph-target"></i></div>
          <h3>No tienes objetivos de ahorro</h3>
          <p>Establece metas para motivarte a ahorrar</p>
          <button class="btn btn-primary" data-action="create-goal">
            <i class="ph ph-plus" aria-hidden="true"></i>
            Crear Objetivo
          </button>
        </div>
      `;
      return;
    }

    goals.forEach(goal => {
      const progress = (goal.current_amount / goal.target_amount) * 100;
      const item = document.createElement('div');
      item.className = 'goal-item fade-in';
      
      // Create goal header
      const goalHeader = document.createElement('div');
      goalHeader.className = 'goal-header';

      const goalName = document.createElement('div');
      goalName.className = 'goal-name';
      goalName.textContent = goal.name; // Safe text content

      const goalAmount = document.createElement('div');
      goalAmount.className = 'goal-amount';
      goalAmount.textContent = `${this.formatCurrency(goal.current_amount)} / ${this.formatCurrency(goal.target_amount)}`;

      goalHeader.appendChild(goalName);
      goalHeader.appendChild(goalAmount);

      // Create progress section
      const goalProgress = document.createElement('div');
      goalProgress.className = 'goal-progress';

      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';

      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressFill.style.width = `${Math.min(progress, 100)}%`;

      const progressText = document.createElement('div');
      progressText.className = 'progress-text';
      progressText.textContent = `${progress.toFixed(1)}%`;

      progressBar.appendChild(progressFill);
      goalProgress.appendChild(progressBar);
      goalProgress.appendChild(progressText);

      // Create actions section
      const goalActions = document.createElement('div');
      goalActions.className = 'goal-actions';

      const addBtn = document.createElement('button');
      addBtn.className = 'btn btn-secondary btn-sm';
      addBtn.setAttribute('data-action', 'add-money');
      addBtn.setAttribute('data-goal-id', goal.id);
      addBtn.innerHTML = '<i class="ph ph-plus-circle" aria-hidden="true"></i> Agregar';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.setAttribute('data-action', 'edit-goal');
      editBtn.setAttribute('data-goal-id', goal.id);
      editBtn.innerHTML = '<i class="ph ph-pencil-simple" aria-hidden="true"></i> Editar';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.setAttribute('data-action', 'delete-goal');
      deleteBtn.setAttribute('data-goal-id', goal.id);
      deleteBtn.setAttribute('data-goal-name', goal.name);
      deleteBtn.innerHTML = '<i class="ph ph-trash" aria-hidden="true"></i> Eliminar';

      goalActions.appendChild(addBtn);
      goalActions.appendChild(editBtn);
      goalActions.appendChild(deleteBtn);

      // Assemble the item
      item.appendChild(goalHeader);
      item.appendChild(goalProgress);
      item.appendChild(goalActions);
      
      container.appendChild(item);
    });
  }

  // FIXED: Spending limits with REAL functional semaphore
  updateSpendingLimitsList(limits, expenses) {
    const summaryContainer = document.getElementById('spending-limits-summary');
    const categoryLimitsContainer = document.getElementById('category-limits-display');
    const totalLimitsCount = document.getElementById('total-limits-count');
    
    console.log('🚦 Updating spending limits UI:', { limits: limits.length, expenses: expenses.length });
    
    // Update total count
    if (totalLimitsCount) {
      totalLimitsCount.textContent = limits.length;
    }
    
    // Update category limits display (new main view)
    if (categoryLimitsContainer) {
      this.updateCategoryLimitsDisplay(limits, expenses);
    }
    
    // Keep existing summary container for dashboard
    if (summaryContainer) {
      summaryContainer.innerHTML = '';
    }

    if (limits.length === 0) {
      if (summaryContainer) {
        summaryContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon"><i class="ph ph-warning"></i></div>
            <h3>No tienes límites de gasto configurados</h3>
            <p>Establece límites para controlar mejor tus gastos</p>
            <button class="btn btn-primary" onclick="window.app.showAddSpendingLimitModal()">
              <i class="ph ph-plus" aria-hidden="true"></i>
              Agregar Límite
            </button>
          </div>
        `;
      }
      return;
    }

    limits.forEach(limit => {
      const categoryExpenses = expenses.filter(exp => exp.category === limit.category);
      const currentSpent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const percentage = (currentSpent / limit.amount) * 100;
      
      let statusClass = 'safe';
      let semaphoreHtml = '';
      
      if (percentage >= 100) {
        statusClass = 'danger';
        semaphoreHtml = `
          <div class="functional-semaphore">
            <div class="semaphore-light red active"></div>
            <div class="semaphore-light yellow"></div>
            <div class="semaphore-light green"></div>
          </div>
        `;
      } else if (percentage >= limit.warning_percentage) {
        statusClass = 'warning';
        semaphoreHtml = `
          <div class="functional-semaphore">
            <div class="semaphore-light red"></div>
            <div class="semaphore-light yellow active"></div>
            <div class="semaphore-light green"></div>
          </div>
        `;
      } else {
        statusClass = 'safe';
        semaphoreHtml = `
          <div class="functional-semaphore">
            <div class="semaphore-light red"></div>
            <div class="semaphore-light yellow"></div>
            <div class="semaphore-light green active"></div>
          </div>
        `;
      }
      
      console.log('🚦 Creating limit item:', { category: limit.category, percentage, statusClass });
      
      // Add to summary card with FUNCTIONAL SEMAPHORE and actions
      if (summaryContainer) {
        const summaryItem = document.createElement('div');
        summaryItem.className = `spending-limit-summary-item ${statusClass}`;
        
        summaryItem.innerHTML = `
          ${semaphoreHtml}
          <div class="limit-category-info">
            <span class="limit-category-name">${limit.category}</span>
          </div>
          <div class="limit-progress-info">
            <div class="limit-amount-info">${this.formatCurrency(currentSpent)} / ${this.formatCurrency(limit.amount)}</div>
            <div class="limit-percentage">${percentage.toFixed(1)}%</div>
          </div>
          <div class="limit-actions">
  <button class="expense-action-btn edit-btn js-limit-edit" 
          data-id="${limit.id}" 
          title="Editar límite">
    <i class="ph ph-pencil-simple" aria-hidden="true"></i>
  </button>
  <button class="expense-action-btn delete-btn js-limit-delete" 
          data-id="${limit.id}" 
          title="Eliminar límite">
    <i class="ph ph-trash" aria-hidden="true"></i>
  </button>
</div>
        `;
        
        summaryContainer.appendChild(summaryItem);
      }
    });
    
    console.log('✅ Spending limits UI updated successfully');
  }

  // NEW: Update category limits display for expenses section
  updateCategoryLimitsDisplay(limits, expenses) {
    const container = document.getElementById('category-limits-display');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (limits.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="ph ph-money"></i></div>
          <h3>No hay límites de gasto configurados</h3>
          <p>Establece límites presupuestarios para controlar mejor tus gastos por categoría</p>
          <button class="btn btn-primary" onclick="window.app.showAddSpendingLimitModal()">
            <i class="ph ph-plus" aria-hidden="true"></i>
            Configurar Primer Límite
          </button>
        </div>
      `;
      return;
    }
    
    // Get all categories to show both with and without limits
    const categories = window.app?.data?.getCategories() || [];
    const categoriesWithLimits = new Set(limits.map(limit => limit.category));
    
    // Show categories with limits first
    limits.forEach(limit => {
      const categoryExpenses = expenses.filter(exp => exp.category === limit.category);
      const currentSpent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const percentage = (currentSpent / limit.amount) * 100;
      const remaining = limit.amount - currentSpent;
      
      let statusClass = 'safe';
      let statusIcon = '🟢';
      let statusText = 'Dentro del límite';
      
      if (percentage >= 100) {
        statusClass = 'danger';
        statusIcon = '🔴';
        statusText = 'Límite superado';
      } else if (percentage >= limit.warning_percentage) {
        statusClass = 'warning';
        statusIcon = '🟡';
        statusText = 'Cerca del límite';
      }
      
      const categoryInfo = this.getCategoryInfo(limit.category);
      
      const limitItem = document.createElement('div');
      limitItem.className = `category-limit-item ${statusClass}`;
      
      limitItem.innerHTML = `
        <div class="category-limit-header">
          <div class="category-info-display">
            <div class="category-icon-large">${categoryInfo.icon}</div>
            <div class="category-details">
              <h4 class="category-name">${limit.category}</h4>
              <div class="category-status">
                ${statusIcon} ${statusText}
              </div>
            </div>
          </div>
         <div class="limit-actions">
  <button class="expense-action-btn edit-btn js-limit-edit" 
          data-id="${limit.id}" 
          title="Editar límite">
    <i class="ph ph-pencil-simple" aria-hidden="true"></i>
  </button>
  <button class="expense-action-btn delete-btn js-limit-delete" 
          data-id="${limit.id}" 
          title="Eliminar límite">
    <i class="ph ph-trash" aria-hidden="true"></i>
  </button>
</div>
        </div>
        
        <div class="limit-details">
          <div class="limit-amounts">
            <div class="limit-amount-row">
              <span class="limit-label">Límite Mensual:</span>
              <span class="limit-value primary">${this.formatCurrency(limit.amount)}</span>
            </div>
            <div class="limit-amount-row">
              <span class="limit-label">Gastado:</span>
              <span class="limit-value ${statusClass}">${this.formatCurrency(currentSpent)}</span>
            </div>
            <div class="limit-amount-row">
              <span class="limit-label">Disponible:</span>
              <span class="limit-value ${remaining >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(remaining)}</span>
            </div>
          </div>
          
          <div class="limit-progress">
            <div class="progress-bar-limit">
              <div class="progress-fill-limit ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="progress-text-limit">${percentage.toFixed(1)}% utilizado</div>
          </div>
          
          <div class="limit-config">
            <div class="config-item">
              <span class="config-label">Período:</span>
              <span class="config-value">Mensual</span>
            </div>
            <div class="config-item">
              <span class="config-label">Alerta al:</span>
              <span class="config-value">${limit.warning_percentage}%</span>
            </div>
          </div>
        </div>
      `;
      
      container.appendChild(limitItem);
    });
    
    // Show categories without limits
    const categoriesWithoutLimits = categories.filter(cat => !categoriesWithLimits.has(cat.name));
    
    if (categoriesWithoutLimits.length > 0) {
      const noLimitsSection = document.createElement('div');
      noLimitsSection.className = 'no-limits-section';
      
      noLimitsSection.innerHTML = `
        <div class="section-divider">
          <h4>📋 Categorías sin límites configurados</h4>
        </div>
      `;
      
      categoriesWithoutLimits.forEach(category => {
        const noLimitItem = document.createElement('div');
        noLimitItem.className = 'category-no-limit-item';
        
        noLimitItem.innerHTML = `
          <div class="category-info-display">
            <div class="category-icon-large">${category.icon}</div>
            <div class="category-details">
              <h4 class="category-name">${category.name}</h4>
              <div class="category-status no-limit">
                ⚪ Sin límite establecido
              </div>
            </div>
          </div>
          <div class="no-limit-actions">
            <button class="btn btn-secondary btn-sm" onclick="window.app.showAddSpendingLimitModal('${category.name}')">
              <i class="ph ph-plus" aria-hidden="true"></i>
              Configurar Límite
            </button>
          </div>
        `;
        
        noLimitsSection.appendChild(noLimitItem);
      });
      
      container.appendChild(noLimitsSection);
    }
  }

  updateCategoriesSelect(categories, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = `${category.name}`;
      select.appendChild(option);
    });
  }

  showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    this.alertContainer.appendChild(alert);
    
    setTimeout(() => alert.classList.add('show'), 100);
    
    setTimeout(() => {
      alert.classList.remove('show');
      setTimeout(() => {
        if (alert.parentNode) {
          alert.parentNode.removeChild(alert);
        }
      }, 300);
    }, 5000);
  }

  showMascotAlert(message, type = 'info') {
    // Mascot alerts are now disabled - pet only speaks on hover
    console.log('Mascot alert suppressed (hover-only mode):', message);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getCategoryInfo(categoryName) {
    if (window.app && window.app.data) {
      const categories = window.app.data.getCategories();
      const category = categories.find(cat => cat.name === categoryName);
      if (category) {
        return {
          name: category.name,
          icon: category.icon,
          color: category.color
        };
      }
    }
    
    const defaultCategories = {
      'Comida': { icon: '<i class="ph ph-fork-knife"></i>', color: '#ef4444' },
      'Transporte': { icon: '<i class="ph ph-car"></i>', color: '#3b82f6' },
      'Salud': { icon: '<i class="ph ph-pill"></i>', color: '#8b5cf6' },
      'Ocio': { icon: '<i class="ph ph-party-popper"></i>', color: '#f59e0b' },
      'Supermercado': { icon: '<i class="ph ph-shopping-cart"></i>', color: '#10b981' },
      'Servicios': { icon: '<i class="ph ph-device-mobile"></i>', color: '#6b7280' },
      'Otros': { icon: '<i class="ph ph-package"></i>', color: '#9ca3af' }
    };
    
    return defaultCategories[categoryName] || { 
      name: categoryName, 
      icon: '<i class="ph ph-package"></i>', 
      color: '#9ca3af' 
    };
  }

  // FIXED: Income details with proper counting and display
  updateIncomeDetails(income, extraIncomes = []) {
    const allIncomesList = document.getElementById('all-incomes-list');
    const incomesIndicator = document.getElementById('incomes-indicator');
    const incomeSummary = document.getElementById('income-summary');
    
    console.log('💰 Updating income details:', { income, extraIncomes: extraIncomes.length });
    
    // Count total incomes
    let totalIncomes = 0;
    if (income.fixed > 0) totalIncomes++;
    if (extraIncomes.length > 0) totalIncomes += extraIncomes.length;
    
    // Calculate total income amount
    const extraIncomesTotal = extraIncomes.reduce((sum, extra) => sum + parseFloat(extra.amount), 0);
    const totalIncome = income.fixed + income.extra + extraIncomesTotal;
    
    console.log('💰 Income calculation:', {
      fixed: income.fixed,
      extraFromTable: income.extra,
      extraFromIncomes: extraIncomesTotal,
      total: totalIncome,
      count: totalIncomes
    });
    
    // Update income summary in dashboard
    if (incomeSummary) {
      incomeSummary.textContent = this.formatCurrency(totalIncome);
      console.log('💰 Income summary updated:', totalIncome);
    }
    
    // Update indicator count
    if (incomesIndicator) {
      const countElement = incomesIndicator.querySelector('.indicator-count');
      if (countElement) {
        countElement.textContent = totalIncomes;
      }
      
      // SIEMPRE mostrar el indicador, incluso con 0 ingresos
      incomesIndicator.classList.remove('hidden');
      incomesIndicator.classList.add('visible');
      incomesIndicator.style.display = 'flex';
      incomesIndicator.style.visibility = 'visible';
      incomesIndicator.style.opacity = '1';
      
      console.log('💰 Income indicator updated:', totalIncomes);
    }
    
    // Update modal content
    if (allIncomesList) {
      allIncomesList.innerHTML = '';
      
      if (totalIncomes === 0) {
        allIncomesList.innerHTML = `
          <div class="empty-state">
            <p>No hay ingresos registrados este mes</p>
          </div>
        `;
      } else {
        // Add fixed income if exists
        if (income.fixed > 0) {
          const fixedItem = document.createElement('div');
          fixedItem.className = 'income-list-item fixed';
          
          fixedItem.innerHTML = `
            <div class="income-item-details">
              <div class="income-item-type"><i class="ph ph-coins"></i> Ingreso Fijo</div>
              <div class="income-item-description">Sueldo mensual</div>
            </div>
            <div class="income-item-amount">${this.formatCurrency(income.fixed)}</div>
            <div class="income-item-actions">
              <button class="btn btn-sm btn-secondary edit-income-btn" data-type="fixed">
                <i class="ph ph-pencil"></i> Editar
              </button>
              <button class="btn btn-sm btn-danger delete-income-btn" data-type="fixed">
                <i class="ph ph-trash"></i> Eliminar
              </button>
            </div>
          `;
          
          allIncomesList.appendChild(fixedItem);
        }
        
        // Add extra incomes from extra_incomes table
        extraIncomes.forEach(extraIncome => {
          const item = document.createElement('div');
          item.className = 'income-list-item extra';
          
          item.innerHTML = `
            <div class="income-item-details">
              <div class="income-item-type"><i class="ph ph-money"></i> ${extraIncome.category}</div>
              <div class="income-item-description">${extraIncome.description}</div>
              <div class="income-item-date">${new Date(extraIncome.created_at).toLocaleDateString('es-ES')}</div>
            </div>
            <div class="income-item-amount">${this.formatCurrency(extraIncome.amount)}</div>
            <div class="income-item-actions">
              <button class="btn btn-sm btn-secondary edit-income-btn" data-id="${extraIncome.id}" data-type="extra">
                <i class="ph ph-pencil"></i> Editar
              </button>
              <button class="btn btn-sm btn-danger delete-income-btn" data-id="${extraIncome.id}" data-type="extra">
                <i class="ph ph-trash"></i> Eliminar
              </button>
            </div>
          `;
          
          allIncomesList.appendChild(item);
        });
      }
    }
    
    // Setup event listeners for income buttons
    this.setupIncomeActionListeners();
    
    console.log('✅ Income details updated successfully');
  }

  // Update income list in transactions tab
  updateIncomeList(extraIncomes, income) {
    const incomeList = document.getElementById('income-list');
    
    if (!incomeList) return;
    
    console.log('💰 Updating income list in transactions tab:', {income, extraIncomes: extraIncomes.length});
    
    incomeList.innerHTML = '';
    
    let totalItems = 0;
    if (income.fixed > 0) totalItems++;
    totalItems += extraIncomes.length;
    
    if (totalItems === 0) {
      incomeList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="ph ph-money"></i></div>
          <h3>No hay ingresos este mes</h3>
          <p>Los ingresos que agregues aparecerán aquí</p>
        </div>
      `;
      return;
    }
    
    // Add fixed income if exists
    if (income.fixed > 0) {
      const fixedItem = document.createElement('div');
      fixedItem.className = 'income-list-item fixed';
      
      fixedItem.innerHTML = `
        <div class="income-item-details">
          <div class="income-item-type"><i class="ph ph-coins"></i> Ingreso Fijo</div>
          <div class="income-item-description">Sueldo mensual</div>
        </div>
        <div class="income-item-amount">${this.formatCurrency(income.fixed)}</div>
        <div class="income-item-actions">
          <button class="btn btn-sm btn-secondary edit-income-btn" data-type="fixed">
            <i class="ph ph-pencil"></i> Editar
          </button>
          <button class="btn btn-sm btn-danger delete-income-btn" data-type="fixed">
            <i class="ph ph-trash"></i> Eliminar
          </button>
        </div>
      `;
      
      incomeList.appendChild(fixedItem);
    }
    
    // Add extra incomes
    extraIncomes.forEach(extraIncome => {
      const item = document.createElement('div');
      item.className = 'income-list-item extra';
      
      item.innerHTML = `
        <div class="income-item-details">
          <div class="income-item-type"><i class="ph ph-money"></i> ${extraIncome.category}</div>
          <div class="income-item-description">${extraIncome.description}</div>
          <div class="income-item-date">${new Date(extraIncome.created_at).toLocaleDateString('es-ES')}</div>
        </div>
        <div class="income-item-amount">${this.formatCurrency(extraIncome.amount)}</div>
        <div class="income-item-actions">
          <button class="btn btn-sm btn-secondary edit-income-btn" data-id="${extraIncome.id}" data-type="extra">
            <i class="ph ph-pencil"></i> Editar
          </button>
          <button class="btn btn-sm btn-danger delete-income-btn" data-id="${extraIncome.id}" data-type="extra">
            <i class="ph ph-trash"></i> Eliminar
          </button>
        </div>
      `;
      
      incomeList.appendChild(item);
    });
    
    // Setup event listeners for income buttons in transactions section
    this.setupIncomeActionListeners();
    
    console.log('✅ Income list updated successfully');
  }

  // NUEVO: Update installments list
  updateInstallmentsList(expenses) {
    const installmentsList = document.getElementById('installments-list');
    
    if (!installmentsList) return;
    
    console.log('📊 Updating installments list with expenses:', expenses.length);
    
    // Filter installments (expenses with total_installments > 1)
    const installments = expenses.filter(expense => expense.total_installments > 1);
    
    console.log('📊 Found installments:', installments.length);
    
    installmentsList.innerHTML = '';
    
    if (installments.length === 0) {
      installmentsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="ph ph-chart-pie"></i></div>
          <h3>No hay cuotas activas este mes</h3>
          <p>Los gastos en cuotas aparecerán aquí</p>
        </div>
      `;
      return;
    }
    
    installments.forEach(installment => {
      const item = document.createElement('div');
      item.className = 'installment-item fade-in';
      
      const category = this.getCategoryInfo(installment.category);
      const transactionDate = installment.transaction_date 
        ? this.formatDateSafe(installment.transaction_date, { 
            day: 'numeric', 
            month: 'short' 
          })
        : 'Sin fecha';
      
      item.innerHTML = `
        <div class="installment-details">
          <div class="installment-description">${category.icon} ${installment.description}</div>
          <div class="installment-info">${category.name} • ${transactionDate}</div>
          <div class="installment-progress">Cuota ${installment.installment} de ${installment.total_installments}</div>
        </div>
        <div class="installment-amount">
          ${this.formatCurrency(installment.amount)}
          ${installment.original_amount ? `<div class="installment-original">Total: ${this.formatCurrency(installment.original_amount)}</div>` : ''}
        </div>
      `;
      
      item.style.borderLeftColor = category.color;
      installmentsList.appendChild(item);
    });
    
    console.log('✅ Installments list updated successfully');
  }

  // Categories Management UI
  updateCategoriesManagementList(categories) {
    const container = document.getElementById('categories-management-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (categories.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No hay categorías personalizadas</p>
        </div>
      `;
      return;
    }

    categories.forEach(category => {
      const item = document.createElement('div');
      item.className = 'category-management-item';
      item.style.borderLeftColor = category.color;
      
      item.innerHTML = `
        <div class="category-info">
          <div class="category-icon-display" style="background-color: ${category.color}20;">
            ${category.icon}
          </div>
          <div class="category-name-display">${category.name}</div>
        </div>
        <div class="category-actions">
          <button class="expense-action-btn delete-btn delete-category-btn" data-category-id="${category.id}" title="Eliminar">
            <i class="ph ph-trash" aria-hidden="true"></i>
          </button>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
      form.reset();
    }
  }

  setFormData(formId, data) {
    const form = document.getElementById(formId);
    if (!form) return;

    Object.keys(data).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        input.value = data[key];
      }
    });
  }

  getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }

  showEditGoalModal(goal) {
    console.log('✏️ Showing edit goal modal for:', goal);
    
    // Populate form with current goal data
    const nameInput = document.getElementById('edit-goal-name');
    const targetInput = document.getElementById('edit-goal-target');
    const currentInput = document.getElementById('edit-goal-current');
    const modal = document.getElementById('edit-goal-modal');
    
    if (nameInput) nameInput.value = goal.name;
    if (targetInput) targetInput.value = goal.target_amount;
    if (currentInput) currentInput.value = goal.current_amount;
    if (modal) modal.dataset.goalId = goal.id;
    
    // Show modal using modal manager
    if (window.app && window.app.modals) {
      window.app.modals.show('edit-goal-modal');
    }
  }
  
  showAddMoneyModal(goal) {
    console.log('💰 Showing add money modal for:', goal);
    
    const goalNameElement = document.getElementById('add-money-goal-name');
    const goalProgressElement = document.getElementById('add-money-goal-progress');
    const maxAmountElement = document.getElementById('add-money-max-amount');
    const amountInput = document.getElementById('add-money-amount');
    const modal = document.getElementById('add-money-modal');
    
    const progress = (goal.current_amount / goal.target_amount) * 100;
    const remaining = goal.target_amount - goal.current_amount;
    
    if (goalNameElement) goalNameElement.textContent = goal.name;
    if (goalProgressElement) {
      goalProgressElement.textContent = `${this.formatCurrency(goal.current_amount)} / ${this.formatCurrency(goal.target_amount)} (${progress.toFixed(1)}%)`;
    }
    if (maxAmountElement) {
      maxAmountElement.textContent = `Máximo disponible: ${this.formatCurrency(remaining)}`;
    }
    if (amountInput) {
      amountInput.max = remaining;
      amountInput.value = '';
    }
    if (modal) modal.dataset.goalId = goal.id;
    
    // Show modal using modal manager
    if (window.app && window.app.modals) {
      window.app.modals.show('add-money-modal');
    }
  }

  // Budget UI Methods
  updateBudgetsList(budgets, expenses = []) {
    const container = document.getElementById('budgets-list');
    const countElement = document.getElementById('budgets-count');
    
    if (!container) return;
    
    console.log('💰 Updating budgets list:', budgets.length, 'budgets');
    
    // Update count
    if (countElement) {
      countElement.textContent = budgets.length;
    }
    
    // Load AI budget insights if available
    this.loadAIBudgetInsights();
    
    container.innerHTML = '';

    if (budgets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="ph ph-money"></i></div>
          <h3>No tienes presupuestos configurados</h3>
          <p>Crea tu primer presupuesto para controlar mejor tus gastos</p>
          <button class="btn btn-primary" data-action="create-budget">
            <i class="ph ph-plus" aria-hidden="true"></i>
            Crear Presupuesto
          </button>
        </div>
      `;
      return;
    }

    budgets.forEach(budget => {
      const progress = window.app.budget.calculateBudgetProgress(budget, expenses);
      const item = document.createElement('div');
      item.className = 'budget-card fade-in';
      
      const category = this.getCategoryInfo(budget.category);
      const startDate = new Date(budget.start_date).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
      const endDate = new Date(budget.end_date).toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
      });
      
      let statusClass = 'safe';
      let statusIcon = '🟢';
      let statusText = 'En control';
      
      if (progress.status === 'exceeded') {
        statusClass = 'exceeded';
        statusIcon = '🔴';
        statusText = 'Superado';
      } else if (progress.status === 'warning') {
        statusClass = 'warning';
        statusIcon = '🟡';
        statusText = 'Cerca del límite';
      } else if (progress.status === 'caution') {
        statusClass = 'caution';
        statusIcon = '🟠';
        statusText = 'Precaución';
      }
      
      item.innerHTML = `
        <div class="budget-card-header">
          <div class="budget-info">
            <div class="budget-category">
              <span class="category-icon">${category.icon}</span>
              <span class="category-name">${budget.category}</span>
            </div>
            <div class="budget-name">${budget.name}</div>
            <div class="budget-period">${startDate} - ${endDate}</div>
          </div>
          <div class="budget-status ${statusClass}">
            <span class="status-icon">${statusIcon}</span>
            <span class="status-text">${statusText}</span>
          </div>
        </div>
        
        <div class="budget-progress-section">
          <div class="budget-amounts">
            <div class="amount-spent">
              <span class="amount-label">Gastado:</span>
              <span class="amount-value ${statusClass}">${this.formatCurrency(progress.spent)}</span>
            </div>
            <div class="amount-limit">
              <span class="amount-label">Límite:</span>
              <span class="amount-value">${this.formatCurrency(budget.amount)}</span>
            </div>
            <div class="amount-remaining">
              <span class="amount-label">Disponible:</span>
              <span class="amount-value ${progress.remaining >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(progress.remaining)}</span>
            </div>
          </div>
          
          <div class="budget-progress-bar">
            <div class="progress-bar-budget">
              <div class="progress-fill-budget ${statusClass}" style="width: ${progress.percentage}%"></div>
            </div>
            <div class="progress-text-budget">${progress.percentage.toFixed(1)}% utilizado</div>
          </div>
          
          <div class="budget-details">
            <div class="detail-item">
              <span class="detail-label">Transacciones:</span>
              <span class="detail-value">${progress.expenseCount}</span>
            </div>
            ${budget.ai_recommended ? '<div class="ai-badge"><i class="ph ph-robot" aria-hidden="true"></i> Recomendado por IA</div>' : ''}
          </div>
        </div>
        
        <div class="budget-actions">
          <button class="btn btn-secondary btn-sm" data-action="edit-budget" data-budget-id="${budget.id}">
            <i class="ph ph-pencil-simple" aria-hidden="true"></i> Editar
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete-budget" data-budget-id="${budget.id}" data-budget-name="${budget.name}">
            <i class="ph ph-trash" aria-hidden="true"></i> Eliminar
          </button>
          <button class="btn btn-primary btn-sm" data-action="analyze-budget" data-budget-id="${budget.id}">
            <i class="ph ph-robot" aria-hidden="true"></i> Analizar
          </button>
        </div>
      `;
      
      item.style.borderLeftColor = category.color;
      container.appendChild(item);
    });
  }

  showAddBudgetModal() {
    console.log('💰 Show add budget modal');
    
    // Set default dates
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startDateInput = document.getElementById('budget-start-date');
    const endDateInput = document.getElementById('budget-end-date');
    
    if (startDateInput) {
      startDateInput.value = today.toISOString().split('T')[0];
    }
    if (endDateInput) {
      endDateInput.value = nextMonth.toISOString().split('T')[0];
    }
    
    // Update categories in select
    if (window.app && window.app.data) {
      const categories = window.app.data.getCategories();
      this.updateCategoriesSelect(categories, 'budget-category');
    }
    
    if (window.app && window.app.modals) {
      window.app.modals.show('add-budget-modal');
    }
  }

  showEditBudgetModal(budgetId) {
    console.log('✏️ Show edit budget modal for:', budgetId);
    
    if (!window.app || !window.app.budget) return;
    
    const budget = window.app.budget.getBudgets().find(b => b.id === budgetId);
    if (!budget) {
      this.showAlert('Presupuesto no encontrado', 'error');
      return;
    }
    
    // Populate form with current budget data
    const nameInput = document.getElementById('edit-budget-name');
    const categorySelect = document.getElementById('edit-budget-category');
    const amountInput = document.getElementById('edit-budget-amount');
    const startDateInput = document.getElementById('edit-budget-start-date');
    const endDateInput = document.getElementById('edit-budget-end-date');
    const modal = document.getElementById('edit-budget-modal');
    
    if (nameInput) nameInput.value = budget.name;
    if (amountInput) amountInput.value = budget.amount;
    if (startDateInput) startDateInput.value = budget.start_date;
    if (endDateInput) endDateInput.value = budget.end_date;
    if (modal) modal.dataset.budgetId = budget.id;
    
    // Update categories and select current one
    if (window.app && window.app.data) {
      const categories = window.app.data.getCategories();
      this.updateCategoriesSelect(categories, 'edit-budget-category');
      if (categorySelect) {
        setTimeout(() => {
          categorySelect.value = budget.category;
        }, 100);
      }
    }
    
    if (window.app && window.app.modals) {
      window.app.modals.show('edit-budget-modal');
    }
  }

getBudgetFormData(formId) {
  const form = document.getElementById(formId);
  if (!form) return {};

  const fd = new FormData(form);
  const data = {};

  for (let [key, value] of fd.entries()) {
    // Normalizar nombres a los que usa handleAddBudget
    if (key === 'ai-recommendations' || key === 'aiRecommended') key = 'ai_recommended';
    if (key === 'startDate') key = 'start_date';
    if (key === 'endDate') key = 'end_date';

    // Trim en strings
    if (typeof value === 'string') value = value.trim();

    data[key] = value;
  }

  // Checkbox: mapear a boolean y tolerar distintos names
  const aiRaw =
    fd.get('ai_recommended') ??
    fd.get('ai-recommendations') ??
    fd.get('aiRecommended');
  data.ai_recommended = aiRaw === 'on' || aiRaw === 'true' || aiRaw === '1';

  // (opcional) normalizar monto a "12.34" si el usuario pone coma
  if (typeof data.amount === 'string') {
    data.amount = data.amount.replace(',', '.');
  }

  return data;
}


  displayAIBudgetInsights(insights) {
    const container = document.getElementById('budget-ai-insights');
    if (!container) return;
    
    if (!insights || insights.length === 0) {
      container.innerHTML = `
        <div class="ai-insights-empty">
          <div class="empty-icon">🤖</div>
          <h4>No hay recomendaciones disponibles</h4>
          <p>Registra más gastos para obtener recomendaciones personalizadas</p>
        </div>
      `;
      container.classList.remove('hidden');
      return;
    }
    
    console.log('🤖 Displaying AI budget insights:', insights.length);
    
    container.innerHTML = `
      <div class="ai-insights-header">
        <h4>🤖 Recomendaciones Inteligentes</h4>
        <p>Análisis personalizado basado en tus patrones de gasto y machine learning</p>
      </div>
    `;
    
    const insightsGrid = document.createElement('div');
    insightsGrid.className = 'ai-insights-grid';
    
    insights.forEach(insight => {
      const insightCard = document.createElement('div');
      insightCard.className = `ai-insight-card ${insight.type || 'ai_recommendation'}`;
      insightCard.dataset.recommendationId = insight.id;
      insightCard.dataset.category = insight.category;
      insightCard.dataset.suggestedBudget = insight.suggestedBudget;
      insightCard.dataset.action = insight.action;
      
      const iconMap = {
        'ai_recommendation': '🤖',
        'ml_recommendation': '🧠',
        'pattern': '<i class="ph ph-chart-bar"></i>',
        'prediction': '🔮',
        'warning': '⚠️',
        'opportunity': '💡'
      };
      
      const priorityColors = {
        'high': '#ef4444',
        'medium': '#f59e0b',
        'low': '#10b981'
      };
      
      insightCard.innerHTML = `
        <div class="insight-header">
          <div class="insight-title-section">
            <span class="insight-icon">${iconMap[insight.type] || '🤖'}</span>
            <span class="insight-category">${insight.category}</span>
            <span class="insight-priority" style="background-color: ${priorityColors[insight.priority] || '#6b7280'}">${insight.priority || 'medium'}</span>
          </div>
          ${insight.confidence ? `<span class="confidence-score">${Math.round(insight.confidence * 100)}%</span>` : ''}
        </div>
        
        <div class="insight-content">
          <div class="insight-action">${insight.action}</div>
          <div class="insight-justification">${insight.justification}</div>
          
          <div class="insight-budget-suggestion">
            <span class="budget-label">Presupuesto sugerido:</span>
            <span class="budget-amount">${this.formatCurrency(insight.suggestedBudget)}</span>
          </div>
        </div>
        
        <div class="insight-actions">
          <button class="btn btn-sm btn-secondary dismiss-recommendation-btn" onclick="window.app.dismissAIRecommendation('${insight.id}')">
            Descartar
          </button>
          ${insight.applicable ? `
            <button class="btn btn-sm btn-primary apply-recommendation-btn" onclick="window.app.applyAIRecommendation('${insight.id}')">
              ✨ Aplicar al Presupuesto
            </button>
          ` : ''}
        </div>
      `;
      
      insightsGrid.appendChild(insightCard);
    });
    
    container.appendChild(insightsGrid);
    container.classList.remove('hidden');
  }

  // Mostrar mensaje de datos insuficientes
  showInsufficientDataMessage(validationResult) {
    const insightsContainer = document.getElementById('budget-ai-insights');
    if (!insightsContainer) return;

    insightsContainer.innerHTML = `
      <div class="insufficient-data-message">
        <div class="insufficient-data-header">
          <div class="insufficient-data-icon"><i class="ph ph-chart-bar"></i></div>
          <h3>Datos Insuficientes para Análisis IA</h3>
        </div>
        
        <div class="insufficient-data-content">
          <p class="insufficient-data-description">
            ${validationResult.message}. Para generar recomendaciones precisas, necesitas:
          </p>
          
          <div class="data-requirements">
            <h4>📋 Requisitos Mínimos:</h4>
            <div class="requirements-grid">
              <div class="requirement-item ${validationResult.current.expenses >= validationResult.requirements.minExpenses ? 'completed' : 'pending'}">
                <div class="requirement-icon">${validationResult.current.expenses >= validationResult.requirements.minExpenses ? '✅' : '⏳'}</div>
                <div class="requirement-text">
                  <strong>Gastos registrados:</strong> ${validationResult.current.expenses}/${validationResult.requirements.minExpenses}
                </div>
              </div>
              
              <div class="requirement-item ${validationResult.current.categories >= validationResult.requirements.minCategories ? 'completed' : 'pending'}">
                <div class="requirement-icon">${validationResult.current.categories >= validationResult.requirements.minCategories ? '✅' : '⏳'}</div>
                <div class="requirement-text">
                  <strong>Categorías diferentes:</strong> ${validationResult.current.categories}/${validationResult.requirements.minCategories}
                </div>
              </div>
              
              <div class="requirement-item ${validationResult.current.days >= validationResult.requirements.minDays ? 'completed' : 'pending'}">
                <div class="requirement-icon">${validationResult.current.days >= validationResult.requirements.minDays ? '✅' : '⏳'}</div>
                <div class="requirement-text">
                  <strong>Días con gastos:</strong> ${validationResult.current.days}/${validationResult.requirements.minDays}
                </div>
              </div>
              
              <div class="requirement-item ${validationResult.current.totalAmount >= validationResult.requirements.minAmount ? 'completed' : 'pending'}">
                <div class="requirement-icon">${validationResult.current.totalAmount >= validationResult.requirements.minAmount ? '✅' : '⏳'}</div>
                <div class="requirement-text">
                  <strong>Monto total:</strong> $${validationResult.current.totalAmount.toFixed(2)}/$${validationResult.requirements.minAmount}
                </div>
              </div>
            </div>
          </div>
          
          ${validationResult.issues ? `
            <div class="missing-requirements">
              <h4>⚠️ Qué necesitas hacer:</h4>
              <ul class="issues-list">
                ${validationResult.issues.map(issue => `<li>${issue}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="insufficient-data-actions">
            <button class="btn btn-primary" onclick="window.app.navigation.showSection('transactions')">
              <i class="ph ph-plus" aria-hidden="true"></i>
              Registrar Más Gastos
            </button>
            <button class="btn btn-secondary" onclick="window.app.generateBudgetInsights()">
              <span>🔄</span>
              Verificar Nuevamente
            </button>
          </div>
        </div>
      </div>
    `;

    // Mostrar el contenedor
    insightsContainer.style.display = 'block';
  }

  // Mostrar predicciones de Machine Learning
  displayMLPredictions(predictions) {
    const container = document.getElementById('ml-predictions-container');
    if (!container || !predictions || predictions.length === 0) return;
    
    console.log('🧠 Displaying ML predictions:', predictions.length);
    
    container.innerHTML = `
      <div class="ml-predictions-header">
        <h4>🧠 Predicciones de Machine Learning</h4>
        <p>Análisis predictivo basado en tus patrones históricos de gasto</p>
      </div>
    `;
    
    const predictionsGrid = document.createElement('div');
    predictionsGrid.className = 'ml-predictions-grid';
    
    predictions.forEach(prediction => {
      const predictionCard = document.createElement('div');
      predictionCard.className = `ml-prediction-card trend-${prediction.trend}`;
      
      const trendIcons = {
        'increasing': '📈',
        'decreasing': '📉',
        'stable': '➡️',
        'volatile': '<i class="ph ph-chart-line"></i>'
      };
      
      const trendColors = {
        'increasing': '#ef4444',
        'decreasing': '#10b981',
        'stable': '#6b7280',
        'volatile': '#f59e0b'
      };
      
      predictionCard.innerHTML = `
        <div class="prediction-header">
          <div class="prediction-category">
            <span class="category-name">${prediction.category}</span>
            <span class="trend-indicator" style="color: ${trendColors[prediction.trend]}">
              ${trendIcons[prediction.trend]} ${prediction.trend}
            </span>
          </div>
          <div class="confidence-badge">${Math.round(prediction.confidence * 100)}% confianza</div>
        </div>
        
        <div class="prediction-content">
          <div class="predicted-amount">
            <span class="amount-label">Gasto predicho:</span>
            <span class="amount-value">${this.formatCurrency(prediction.predicted)}</span>
          </div>
          
          <div class="recommendation-preview">
            <div class="rec-type ${prediction.recommendation.type}">
              ${prediction.recommendation.type === 'warning' ? '⚠️' : 
                prediction.recommendation.type === 'opportunity' ? '💡' : '✅'}
              ${prediction.recommendation.message}
            </div>
          </div>
        </div>
      `;
      
      predictionsGrid.appendChild(predictionCard);
    });
    
    container.appendChild(predictionsGrid);
    container.classList.remove('hidden');
  }

  // Mostrar patrones de gasto detectados
  displaySpendingPatterns(patterns) {
    const container = document.getElementById('spending-patterns-container');
    if (!container || !patterns || patterns.length === 0) return;
    
    console.log('📊 Displaying spending patterns:', patterns.length);
    
    container.innerHTML = `
      <div class="patterns-header">
        <h4><i class="ph ph-chart-bar"></i> Patrones de Gasto Detectados</h4>
        <p>Insights automáticos sobre tu comportamiento financiero</p>
      </div>
    `;
    
    const patternsGrid = document.createElement('div');
    patternsGrid.className = 'patterns-grid';
    
    patterns.forEach(pattern => {
      const patternCard = document.createElement('div');
      patternCard.className = `pattern-card pattern-${pattern.type}`;
      
      const typeIcons = {
        'day_pattern': '📅',
        'category_pattern': '🏷️',
        'time_pattern': '⏰',
        'amount_pattern': '<i class="ph ph-coins"></i>'
      };
      
      patternCard.innerHTML = `
        <div class="pattern-header">
          <span class="pattern-icon">${typeIcons[pattern.type] || '<i class="ph ph-chart-bar"></i>'}</span>
          <span class="pattern-title">${pattern.title}</span>
        </div>
        
        <div class="pattern-content">
          <div class="pattern-description">${pattern.description}</div>
          ${pattern.actionable ? `
            <div class="pattern-suggestion">
              💡 <strong>Sugerencia:</strong> ${pattern.suggestion}
            </div>
          ` : ''}
        </div>
      `;
      
      patternsGrid.appendChild(patternCard);
    });
    
    container.appendChild(patternsGrid);
    container.classList.remove('hidden');
  }

  formatInsightData(data) {
    if (!data || typeof data !== 'object') return '';
    
    let html = '<div class="insight-data-items">';
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'number' && key.includes('amount')) {
        html += `<div class="data-item"><strong>${key}:</strong> ${this.formatCurrency(value)}</div>`;
      } else {
        html += `<div class="data-item"><strong>${key}:</strong> ${value}</div>`;
      }
    });
    
    html += '</div>';
    return html;
  }

  displayBudgetAlert(alert) {
    // Use existing alert system but with budget-specific styling
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${alert.severity} budget-alert`;
    
    alertElement.innerHTML = `
      <div class="alert-content">
        <div class="alert-title">${alert.title}</div>
        <div class="alert-message">${alert.message}</div>
        ${alert.category ? `<div class="alert-category">Categoría: ${alert.category}</div>` : ''}
      </div>
      <div class="alert-actions">
        <button class="btn btn-sm btn-secondary" onclick="this.parentElement.parentElement.remove()">
          Cerrar
        </button>
      </div>
    `;
    
    this.alertContainer.appendChild(alertElement);
    
    setTimeout(() => alertElement.classList.add('show'), 100);
    
    // Auto-remove after 10 seconds for budget alerts
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertElement.classList.remove('show');
        setTimeout(() => {
          if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
          }
        }, 300);
      }
    }, 10000);
  }

  updateBudgetSummary(summary) {
    const totalBudgetsElement = document.getElementById('total-budgets-count');
    const activeBudgetsElement = document.getElementById('active-budgets-count');
    
    if (totalBudgetsElement) {
      totalBudgetsElement.textContent = summary.totalBudgets;
    }
    
    if (activeBudgetsElement) {
      activeBudgetsElement.textContent = summary.activeBudgets;
    }
    
    // Update navigation badge
    const budgetNavBadge = document.querySelector('[data-section="budgets"] .nav-badge');
    if (budgetNavBadge) {
      budgetNavBadge.textContent = summary.activeBudgets;
      budgetNavBadge.style.display = summary.activeBudgets > 0 ? 'flex' : 'none';
    }
  }

  showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('loading');
      element.disabled = true;
    }
  }

  hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove('loading');
      element.disabled = false;
    }
  }

  // Cargar insights de IA para presupuestos
  async loadAIBudgetInsights() {
    const container = document.getElementById('budget-ai-insights');
    if (!container) return;
    
    // Mostrar estado de carga
    container.innerHTML = `
      <div class="ai-insights-loading">
        <div class="loading-spinner"></div>
        <p>Cargando análisis inteligente...</p>
      </div>
    `;
    container.classList.remove('hidden');
  }

  async handleLogout() {
    console.log('🚪 Handling logout...');
    
    try {
      // Clear all data
      if (window.app && window.app.data) {
        await window.app.data.clearAllData();
      }
      
      // Clear localStorage
      localStorage.clear();
      
      // Redirect to login
      window.location.href = 'login.html';
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      this.showAlert('Error al cerrar sesión', 'error');
    }
  }
  // === 1) Arranque del dashboard ===
initDashboard() {
  document.addEventListener('DOMContentLoaded', () => {
    this.wireDashboardButtons();
    this.bindBudgetForm();
    this.initExpensesChart();
  });
}

// === 2) Botones / atajos ===
wireDashboardButtons() {
  const $ = (sel) => document.querySelector(sel);

  // Atajos rápidos
  $('#qa-add-expense')?.addEventListener('click', () => window.app?.showAddExpenseModal?.());
  $('#qa-add-income')?.addEventListener('click', () => window.app?.showAddIncomeModal?.());
  $('#qa-import')?.addEventListener('click', () => window.app?.modals?.show?.('import-data-modal'));
  $('#qa-ai-report')?.addEventListener('click', () => window.app?.modals?.show?.('generate-ai-report-modal'));
  $('#qa-add-budget')?.addEventListener('click', () => this.showAddBudgetModal());

  // Botones de las cards
  $('#add-expense-btn-dashboard')?.addEventListener('click', () => window.app?.showAddExpenseModal?.());
  $('#add-income-btn-dashboard')?.addEventListener('click', () => window.app?.showAddIncomeModal?.());

  // Ir a secciones
  $('#go-reports')?.addEventListener('click', () => window.app?.navigation?.showSection?.('reports'));
  $('#go-transactions')?.addEventListener('click', () => window.app?.navigation?.showSection?.('transactions'));
}

// === 3) Gráfico de gastos (doughnut) ===
initExpensesChart() {
  const canvas = document.getElementById('expenses-chart');
  if (!canvas || !window.Chart) return;

  // Obtener gastos del mes (fallbacks defensivos)
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const getAll = () => (window.app?.data?.getExpenses?.() || []);
  const expenses = (window.app?.data?.getCurrentMonthExpenses?.() || getAll())
    .filter(e => {
      if (!e?.transaction_date) return true; // si no viene fecha, lo contamos
      const d = this.parseDateSafe(e.transaction_date);
      return d.getFullYear() === y && d.getMonth() === m;
    });

  // Agrupar por categoría
  const byCat = new Map();
  for (const e of expenses) {
    const cat = e.category || 'Otros';
    const amt = Number(e.amount) || 0;
    byCat.set(cat, (byCat.get(cat) || 0) + amt);
  }

  // Si no hay datos, mostramos un dataset vacío simpático
  const labels = byCat.size ? [...byCat.keys()] : ['Sin datos'];
  const data = byCat.size ? [...byCat.values()] : [1];

  // Limpiar gráfico previo si existe
  if (this._expensesChart) {
    this._expensesChart.destroy();
  }

  this._expensesChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      cutout: '62%',
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: {
          label: (ctx) => {
            const val = ctx.parsed || 0;
            return `${ctx.label}: ${this.formatCurrency(val)}`;
          }
        }}
      }
    }
  });
}

// Llamá esto cada vez que cambien gastos para refrescar el gráfico
refreshExpensesChart() {
  this.initExpensesChart();
}

// === 4) Crear Presupuesto (sin recargar) ===
bindBudgetForm() {
  const form = document.getElementById('add-budget-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // <— evita el reload

    const data = new FormData(form);
    const budget = {
      name: data.get('name')?.trim(),
      category: data.get('category'),
      amount: Number(data.get('amount') || 0),
      start_date: data.get('start_date'),
      end_date: data.get('end_date'),
      ai_recommended: data.get('ai_recommended') === 'on'
    };

    // Validaciones básicas
    if (!budget.name || !budget.category || !budget.amount || !budget.start_date || !budget.end_date) {
      this.showAlert('Por favor, completá todos los campos del presupuesto.', 'error');
      return;
    }

    try {
      // Intentar con los métodos más probables de tu capa de budgets
      if (window.app?.budget?.addBudget) {
        await window.app.budget.addBudget(budget);
      } else if (window.app?.budget?.createBudget) {
        await window.app.budget.createBudget(budget);
      } else {
        // fallback: disparar un evento para que tu lógica lo capture
        document.dispatchEvent(new CustomEvent('budget:create', { detail: budget }));
      }

      this.showAlert('Presupuesto creado ✅', 'success');
      window.app?.modals?.hide?.('add-budget-modal');
      form.reset();

      // refrescar UI
      const budgets = window.app?.budget?.getBudgets?.() || [];
      const expenses = window.app?.data?.getExpenses?.() || [];
      this.updateBudgetsList(budgets, expenses);

    } catch (err) {
      console.error('Error creando presupuesto', err);
      this.showAlert('No se pudo crear el presupuesto.', 'error');
    }
  });
}

  updateNavigationBadges(expenses, extraIncomes, income) {
    console.log('🏷️ Updating navigation badges...');
    
    // Update transactions counter (expenses + extra incomes)
    const totalTransactions = expenses.length + extraIncomes.length;
    const transactionsBadge = document.getElementById('pending-transactions');
    if (transactionsBadge) {
      transactionsBadge.textContent = totalTransactions;
      console.log('🏷️ Updated transactions badge:', totalTransactions);
    }
    
    // Update other badges as needed (placeholder for future enhancements)
    const upcomingEventsBadge = document.getElementById('upcoming-events');
    if (upcomingEventsBadge) {
      // For now, we'll keep this as is, but could be enhanced with calendar data
      console.log('🏷️ Upcoming events badge: keeping current value');
    }
    
    const activeBudgetsBadge = document.getElementById('active-budgets');
    if (activeBudgetsBadge) {
      // Could be enhanced with budget data
      console.log('🏷️ Active budgets badge: keeping current value');
    }
  }

  setupIncomeActionListeners() {
    // Remove previous listeners to avoid duplicates
    document.querySelectorAll('.edit-income-btn').forEach(btn => {
      btn.removeEventListener('click', this.handleEditIncome);
    });
    document.querySelectorAll('.delete-income-btn').forEach(btn => {
      btn.removeEventListener('click', this.handleDeleteIncome);
    });

    // Add new listeners
    document.querySelectorAll('.edit-income-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleEditIncome(e));
    });
    document.querySelectorAll('.delete-income-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleDeleteIncome(e));
    });
  }

  handleEditIncome(e) {
    const btn = e.target.closest('.edit-income-btn');
    const incomeType = btn.dataset.type;
    const incomeId = btn.dataset.id;
    
    console.log('✏️ Edit income:', { type: incomeType, id: incomeId });
    
    if (incomeType === 'fixed') {
      // Show edit fixed income modal
      this.showEditFixedIncomeModal();
    } else if (incomeType === 'extra') {
      // Show edit extra income modal
      this.showEditExtraIncomeModal(incomeId);
    }
  }

  handleDeleteIncome(e) {
    const btn = e.target.closest('.delete-income-btn');
    const incomeType = btn.dataset.type;
    const incomeId = btn.dataset.id;
    
    console.log('🗑️ Delete income:', { type: incomeType, id: incomeId });
    
    if (incomeType === 'extra') {
      if (confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
        this.deleteExtraIncome(incomeId);
      }
    } else if (incomeType === 'fixed') {
      if (confirm('¿Estás seguro de que quieres eliminar el ingreso fijo? Esto lo pondrá en $0.')) {
        this.deleteFixedIncome();
      }
    }
  }

  async deleteExtraIncome(incomeId) {
    try {
      if (window.app && window.app.data && window.app.data.deleteExtraIncome) {
        await window.app.data.deleteExtraIncome(incomeId);
        this.showAlert('Ingreso eliminado correctamente', 'success');
        
        // Refresh the dashboard
        if (window.app.updateDashboard) {
          window.app.updateDashboard();
        }
      } else {
        this.showAlert('Error: No se pudo eliminar el ingreso', 'error');
      }
    } catch (error) {
      console.error('Error deleting income:', error);
      this.showAlert('Error eliminando el ingreso', 'error');
    }
  }

  async deleteFixedIncome() {
    try {
      if (window.app && window.app.data && window.app.data.addFixedIncome) {
        console.log('🗑️ Deleting fixed income by setting to 0');
        // Set fixed income to 0 using addFixedIncome (which does upsert)
        const success = await window.app.data.addFixedIncome(window.app.currentMonth, 0);
        
        if (success) {
          this.showAlert('Ingreso fijo eliminado (puesto en $0)', 'success');
          
          // Refresh the dashboard
          if (window.app.updateDashboard) {
            window.app.updateDashboard();
          }
        } else {
          this.showAlert('Error: No se pudo eliminar el ingreso fijo', 'error');
        }
      } else {
        console.error('addFixedIncome method not found');
        this.showAlert('Error: Método addFixedIncome no disponible', 'error');
      }
    } catch (error) {
      console.error('Error deleting fixed income:', error);
      this.showAlert('Error eliminando el ingreso fijo: ' + error.message, 'error');
    }
  }

  showEditFixedIncomeModal() {
    // For now, we'll redirect to add income to change the fixed income
    this.showAlert('Para editar el ingreso fijo, agrega un nuevo ingreso y se actualizará automáticamente', 'info');
    if (window.app && window.app.showAddIncomeModal) {
      window.app.showAddIncomeModal();
    }
  }

  showEditExtraIncomeModal(incomeId) {
    // For now, we'll show an alert - this could be enhanced with a proper edit modal
    this.showAlert('Función de edición de ingresos en desarrollo. Por ahora puedes eliminar y crear uno nuevo.', 'info');
  }
}
