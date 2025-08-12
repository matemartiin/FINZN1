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

  

  updateBalance(balance) {
    const balanceAmount = document.getElementById('balance-amount-new');
    const monthlyExpenses = document.getElementById('monthly-expenses-summary');
    const incomeAmount = document.getElementById('income-summary');
    const installmentsCount = document.getElementById('installments-count');
    
    console.log('🔄 Updating balance UI with:', balance);
    
    if (balanceAmount) {
      balanceAmount.textContent = this.formatCurrency(balance.available);
      console.log('💰 Balance amount updated:', balance.available);
      
      // Change color based on balance
      if (balance.available < 0) {
        balanceAmount.style.color = '#ef4444';
      } else if (balance.available < 1000) {
        balanceAmount.style.color = '#f59e0b';
      } else {
        balanceAmount.style.color = '#C8B6FF';
      }
    }
    
    if (monthlyExpenses) {
      monthlyExpenses.textContent = this.formatCurrency(balance.totalExpenses);
      console.log('💳 Monthly expenses updated:', balance.totalExpenses);
    }
    
    if (incomeAmount) {
      incomeAmount.textContent = this.formatCurrency(balance.totalIncome);
      console.log('💵 Income amount updated:', balance.totalIncome);
    }
    
    if (installmentsCount) {
      installmentsCount.textContent = balance.installments;
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
          <div class="empty-icon">💳</div>
          <h3>No hay gastos registrados</h3>
          <p>Comienza agregando tu primer gasto del mes</p>
          <button class="btn btn-primary" onclick="window.app.showAddExpenseModal()">
            <span>➕</span>
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
        ? new Date(expense.transaction_date).toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short' 
          })
        : 'Sin fecha';
      
      item.innerHTML = `
        <div class="expense-icon">${category.icon}</div>
        <div class="expense-details">
          <div class="expense-description">${expense.description}</div>
          <div class="expense-category">${category.name} • ${transactionDate}</div>
          ${expense.total_installments > 1 ? `<div class="expense-installment">Cuota ${expense.installment} de ${expense.total_installments}</div>` : ''}
        </div>
        <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
        <div class="expense-actions">
  <button class="expense-action-btn edit-btn js-expense-edit" 
          data-id="${expense.id}" 
          title="Editar">
    ✏️
  </button>
  <button class="expense-action-btn delete-btn js-expense-delete" 
          data-id="${expense.id}" 
          data-description="${this.escapeHtml(expense.description)}" 
          title="Eliminar">
    🗑️
  </button>
</div>
      `;
      
      item.style.borderLeftColor = category.color;
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
          <div class="empty-icon">🎯</div>
          <h3>No tienes objetivos de ahorro</h3>
          <p>Establece metas para motivarte a ahorrar</p>
          <button class="btn btn-primary" onclick="window.app.showAddGoalModal()">
            <span>➕</span>
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
      
      item.innerHTML = `
        <div class="goal-header">
          <div class="goal-name">${goal.name}</div>
          <div class="goal-amount">${this.formatCurrency(goal.current_amount)} / ${this.formatCurrency(goal.target_amount)}</div>
        </div>
        <div class="goal-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
          </div>
          <div class="progress-text">${progress.toFixed(1)}%</div>
        </div>
        <div class="goal-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.app.addToGoal('${goal.id}')">
            💰 Agregar
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.app.editGoal('${goal.id}')">
            ✏️ Editar
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.app.deleteGoal('${goal.id}', '${goal.name}')">
            🗑️ Eliminar
          </button>
        </div>
      `;
      
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
            <div class="empty-icon">⚠️</div>
            <h3>No tienes límites de gasto configurados</h3>
            <p>Establece límites para controlar mejor tus gastos</p>
            <button class="btn btn-primary" onclick="window.app.showAddSpendingLimitModal()">
              <span>➕</span>
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
    ✏️
  </button>
  <button class="expense-action-btn delete-btn js-limit-delete" 
          data-id="${limit.id}" 
          title="Eliminar límite">
    🗑️
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
          <div class="empty-icon">💰</div>
          <h3>No hay límites de gasto configurados</h3>
          <p>Establece límites presupuestarios para controlar mejor tus gastos por categoría</p>
          <button class="btn btn-primary" onclick="window.app.showAddSpendingLimitModal()">
            <span>➕</span>
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
    ✏️
  </button>
  <button class="expense-action-btn delete-btn js-limit-delete" 
          data-id="${limit.id}" 
          title="Eliminar límite">
    🗑️
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
              <span>➕</span>
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
      option.textContent = `${category.icon} ${category.name}`;
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
      'Comida': { icon: '🍔', color: '#ef4444' },
      'Transporte': { icon: '🚗', color: '#3b82f6' },
      'Salud': { icon: '💊', color: '#8b5cf6' },
      'Ocio': { icon: '🎉', color: '#f59e0b' },
      'Supermercado': { icon: '🛒', color: '#10b981' },
      'Servicios': { icon: '📱', color: '#6b7280' },
      'Otros': { icon: '📦', color: '#9ca3af' }
    };
    
    return defaultCategories[categoryName] || { 
      name: categoryName, 
      icon: '📦', 
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
              <div class="income-item-type">💰 Ingreso Fijo</div>
              <div class="income-item-description">Sueldo mensual</div>
            </div>
            <div class="income-item-amount">${this.formatCurrency(income.fixed)}</div>
          `;
          
          allIncomesList.appendChild(fixedItem);
        }
        
        // Add extra incomes from extra_incomes table
        extraIncomes.forEach(extraIncome => {
          const item = document.createElement('div');
          item.className = 'income-list-item extra';
          
          item.innerHTML = `
            <div class="income-item-details">
              <div class="income-item-type">💵 ${extraIncome.category}</div>
              <div class="income-item-description">${extraIncome.description}</div>
              <div class="income-item-date">${new Date(extraIncome.created_at).toLocaleDateString('es-ES')}</div>
            </div>
            <div class="income-item-amount">${this.formatCurrency(extraIncome.amount)}</div>
          `;
          
          allIncomesList.appendChild(item);
        });
      }
    }
    
    console.log('✅ Income details updated successfully');
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
          <div class="empty-icon">📊</div>
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
        ? new Date(installment.transaction_date).toLocaleDateString('es-ES', { 
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
          <button class="expense-action-btn delete-btn" onclick="window.app.deleteCategory('${category.id}')" title="Eliminar">
            🗑️
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
          <div class="empty-icon">💰</div>
          <h3>No tienes presupuestos configurados</h3>
          <p>Crea tu primer presupuesto para controlar mejor tus gastos</p>
          <button class="btn btn-primary" onclick="window.app.showAddBudgetModal()">
            <span>➕</span>
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
            ${budget.ai_recommended ? '<div class="ai-badge">🤖 Recomendado por IA</div>' : ''}
          </div>
        </div>
        
        <div class="budget-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.app.showEditBudgetModal('${budget.id}')">
            ✏️ Editar
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.app.deleteBudget('${budget.id}', '${budget.name}')">
            🗑️ Eliminar
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.app.generateBudgetInsights('${budget.id}')">
            🤖 Analizar
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
        'pattern': '📊',
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
          <div class="insufficient-data-icon">📊</div>
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
              <span>➕</span>
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
        'volatile': '📊'
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
        <h4>📊 Patrones de Gasto Detectados</h4>
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
        'amount_pattern': '💰'
      };
      
      patternCard.innerHTML = `
        <div class="pattern-header">
          <span class="pattern-icon">${typeIcons[pattern.type] || '📊'}</span>
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
}
