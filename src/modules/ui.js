export class UIManager {
  constructor() {
    this.alertContainer = document.getElementById('alert-container');
    this.mascotAlertTimeout = null;
  }

  updateBalance(balance) {
    const balanceAmount = document.getElementById('balance-amount-new');
    const monthlyExpenses = document.getElementById('monthly-expenses-summary');
    const incomeAmount = document.getElementById('income-summary');
    
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
  }

  updateIncomeVsExpensesSummary(balance) {
    const summaryElement = document.getElementById('income-vs-expenses-summary');
    if (summaryElement) {
      summaryElement.textContent = `Ingresos: ${this.formatCurrency(balance.totalIncome)} • Gastos: ${this.formatCurrency(balance.totalExpenses)}`;
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
          <button class="expense-action-btn edit-btn" onclick="window.app.showEditExpenseModal('${expense.id}')" title="Editar">
            ✏️
          </button>
          <button class="expense-action-btn delete-btn" onclick="window.app.showDeleteConfirmation('${expense.id}', '${expense.description}')" title="Eliminar">
            🗑️
          </button>
        </div>
      `;
      
      item.style.borderLeftColor = category.color;
      container.appendChild(item);
    });
  }

  updateGoalsProgress(goals) {
    const container = document.getElementById('dashboard-goals-progress');
    if (!container) return;
    
    container.innerHTML = '';

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state-small">
          <p>No hay objetivos configurados</p>
        </div>
      `;
      return;
    }

    // Show only first 3 goals in dashboard
    goals.slice(0, 3).forEach(goal => {
      const progress = (goal.current_amount / goal.target_amount) * 100;
      const item = document.createElement('div');
      item.className = 'goal-progress-item';
      
      item.innerHTML = `
        <div class="goal-info">
          <span class="goal-name">${goal.name}</span>
          <span class="goal-percentage">${progress.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  // FIXED: Spending limits with REAL functional semaphore
  updateSpendingLimitsList(limits, expenses) {
    const summaryContainer = document.getElementById('spending-limits-summary');
    
    console.log('🚦 Updating spending limits UI:', { limits: limits.length, expenses: expenses.length });
    
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
            <button class="expense-action-btn edit-btn" onclick="window.app.editSpendingLimit('${limit.id}')" title="Editar límite">
              ✏️
            </button>
            <button class="expense-action-btn delete-btn" onclick="window.app.deleteSpendingLimit('${limit.id}')" title="Eliminar límite">
              🗑️
            </button>
          </div>
        `;
        
        summaryContainer.appendChild(summaryItem);
      }
    });
    
    console.log('✅ Spending limits UI updated successfully');
  }

  updateLimitsAlerts(limits, expenses) {
    const alertCard = document.getElementById('limits-alert-card');
    const alertsList = document.getElementById('limits-alerts-list');
    
    if (!alertCard || !alertsList) return;

    // Find limits that are close to or over the threshold
    const alerts = [];
    
    limits.forEach(limit => {
      const categoryExpenses = expenses.filter(exp => exp.category === limit.category);
      const currentSpent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const percentage = (currentSpent / limit.amount) * 100;
      
      if (percentage >= limit.warning_percentage) {
        alerts.push({
          category: limit.category,
          percentage: percentage.toFixed(1),
          status: percentage >= 100 ? 'danger' : 'warning',
          current: currentSpent,
          limit: limit.amount
        });
      }
    });

    if (alerts.length === 0) {
      alertCard.classList.add('hidden');
      return;
    }

    alertCard.classList.remove('hidden');
    alertsList.innerHTML = '';

    alerts.forEach(alert => {
      const alertItem = document.createElement('div');
      alertItem.className = `limit-alert ${alert.status}`;
      
      alertItem.innerHTML = `
        <div class="alert-icon">${alert.status === 'danger' ? '🚨' : '⚠️'}</div>
        <div class="alert-info">
          <div class="alert-category">${alert.category}</div>
          <div class="alert-details">${this.formatCurrency(alert.current)} / ${this.formatCurrency(alert.limit)} (${alert.percentage}%)</div>
        </div>
      `;
      
      alertsList.appendChild(alertItem);
    });
  }

  updateTopCategories(expenses) {
    const container = document.getElementById('top-categories-summary');
    if (!container) return;

    // Calculate category totals
    const categoryTotals = {};
    expenses.forEach(expense => {
      const category = expense.category;
      const amount = parseFloat(expense.amount) || 0;
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });

    // Get top 3 categories
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    container.innerHTML = '';

    if (topCategories.length === 0) {
      container.innerHTML = '<p class="no-data">No hay gastos este mes</p>';
      return;
    }

    topCategories.forEach(([category, amount], index) => {
      const categoryInfo = this.getCategoryInfo(category);
      const item = document.createElement('div');
      item.className = 'top-category-item';
      
      item.innerHTML = `
        <span class="category-rank">#${index + 1}</span>
        <span class="category-icon">${categoryInfo.icon}</span>
        <span class="category-name">${category}</span>
        <span class="category-amount">${this.formatCurrency(amount)}</span>
      `;
      
      container.appendChild(item);
    });
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
    if (this.mascotAlertTimeout) {
      clearTimeout(this.mascotAlertTimeout);
    }

    const mascotContainer = document.querySelector('.chart-mascot-container');
    if (!mascotContainer) return;

    let tooltip = mascotContainer.querySelector('.mascot-alert');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'mascot-alert';
      mascotContainer.appendChild(tooltip);
    }

    tooltip.textContent = message;
    tooltip.className = `mascot-alert mascot-alert-${type} show`;

    this.mascotAlertTimeout = setTimeout(() => {
      tooltip.classList.remove('show');
    }, 3000);
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
}