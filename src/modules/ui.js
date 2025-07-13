export class UIManager {
  constructor() {
    this.alertContainer = document.getElementById('alert-container');
    this.mascotAlertTimeout = null;
  }

  updateBalance(balance) {
    const balanceAmount = document.getElementById('balance-amount-new');
    const monthlyExpenses = document.getElementById('monthly-expenses-summary');
    const incomeAmount = document.getElementById('income-summary');
    const installmentsCount = document.getElementById('installments-count');
    
    if (balanceAmount) {
      balanceAmount.textContent = this.formatCurrency(balance.available);
      // Change color based on balance
      if (balance.available < 0) {
        balanceAmount.style.color = '#ef4444';
      } else if (balance.available < 1000) {
        balanceAmount.style.color = '#f59e0b';
      } else {
        balanceAmount.style.color = '#B7A6FF';
      }
    }
    
    if (monthlyExpenses) {
      monthlyExpenses.textContent = this.formatCurrency(balance.totalExpenses);
    }
    
    if (incomeAmount) {
      incomeAmount.textContent = this.formatCurrency(balance.totalIncome);
    }
    
    if (installmentsCount) {
      installmentsCount.textContent = balance.installments;
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
      
      // Format transaction date for display
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
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  updateSpendingLimitsList(limits, expenses) {
    const container = document.getElementById('spending-limits-list');
    const summaryContainer = document.getElementById('spending-limits-summary');
    
    if (!container) return;
    
    container.innerHTML = '';
    if (summaryContainer) {
      summaryContainer.innerHTML = '';
    }

    if (limits.length === 0) {
      container.innerHTML = `
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
      
      if (summaryContainer) {
        summaryContainer.innerHTML = `
          <div class="empty-state">
            <p>No hay límites configurados</p>
          </div>
        `;
      }
      return;
    }

    limits.forEach(limit => {
      // Calcular gasto actual en la categoría
      const categoryExpenses = expenses.filter(exp => exp.category === limit.category);
      const currentSpent = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      const percentage = (currentSpent / limit.amount) * 100;
      
      let statusClass = 'safe';
      
      if (percentage >= 100) {
        statusClass = 'danger';
      } else if (percentage >= limit.warning_percentage) {
        statusClass = 'warning';
      }
      
      // Add to main list
      const item = document.createElement('div');
      item.className = 'spending-limit-item fade-in';
      
      item.innerHTML = `
        <div class="spending-limit-info">
          <div class="spending-limit-category">${limit.category}</div>
          <div class="spending-limit-amount">Límite: ${this.formatCurrency(limit.amount)}</div>
        </div>
        <div class="spending-limit-progress">
          <div class="spending-limit-bar">
            <div class="spending-limit-fill ${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
          </div>
          <div class="spending-limit-text">${this.formatCurrency(currentSpent)} / ${this.formatCurrency(limit.amount)} (${percentage.toFixed(1)}%)</div>
        </div>
        <div class="spending-limit-actions">
          <button class="expense-action-btn edit-btn" onclick="window.app.editSpendingLimit('${limit.id}')" title="Editar">
            ✏️
          </button>
          <button class="expense-action-btn delete-btn" onclick="window.app.deleteSpendingLimit('${limit.id}')" title="Eliminar">
            🗑️
          </button>
        </div>
      `;
      
      container.appendChild(item);
      
      // Add to summary card
      if (summaryContainer) {
        const summaryItem = document.createElement('div');
        summaryItem.className = `spending-limit-summary-item ${statusClass}`;
        
        // Crear semáforo funcional
        const semaphoreHtml = `
          <div class="limit-semaphore">
            <div class="semaphore-light red ${statusClass === 'danger' ? 'active' : ''}"></div>
            <div class="semaphore-light yellow ${statusClass === 'warning' ? 'active' : ''}"></div>
            <div class="semaphore-light green ${statusClass === 'safe' ? 'active' : ''}"></div>
          </div>
        `;
        
        summaryItem.innerHTML = `
          ${semaphoreHtml}
          <div class="limit-category-info">
            <span class="limit-category-name">${limit.category}</span>
          </div>
          <div class="limit-progress-info">
            <div class="limit-amount-info">${this.formatCurrency(currentSpent)} / ${this.formatCurrency(limit.amount)}</div>
            <div class="limit-percentage">${percentage.toFixed(1)}%</div>
          </div>
        `;
        
        summaryContainer.appendChild(summaryItem);
      }
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
    
    // Trigger animation
    setTimeout(() => alert.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
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
    // Clear existing mascot alert
    if (this.mascotAlertTimeout) {
      clearTimeout(this.mascotAlertTimeout);
    }

    const mascotContainer = document.querySelector('.chart-mascot-container');
    if (!mascotContainer) return;

    // Create or update tooltip
    let tooltip = mascotContainer.querySelector('.mascot-alert');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'mascot-alert';
      mascotContainer.appendChild(tooltip);
    }

    tooltip.textContent = message;
    tooltip.className = `mascot-alert mascot-alert-${type} show`;

    // Auto hide after 3 seconds
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
    // Get category info from data manager if available
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
    
    // Fallback to default categories
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

  // Utility methods for form handling
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

  updateIncomeDetails(income, extraIncomes = []) {
    const allIncomesList = document.getElementById('all-incomes-list');
    const incomesIndicator = document.getElementById('incomes-indicator');
    const incomeSummary = document.getElementById('income-summary');
    
    // Update indicator count
    let totalIncomes = 0;
    if (income.fixed > 0) totalIncomes++;
    if (extraIncomes.length > 0) totalIncomes += extraIncomes.length;
    
    // Update income summary in dashboard
    if (incomeSummary) {
      const totalIncome = income.fixed + income.extra;
      incomeSummary.textContent = this.formatCurrency(totalIncome);
    }
    
    if (incomesIndicator) {
      const countElement = incomesIndicator.querySelector('.indicator-count');
      if (countElement) {
        countElement.textContent = totalIncomes;
      }
      
      if (totalIncomes > 0) {
        incomesIndicator.classList.remove('hidden');
      } else {
        incomesIndicator.classList.add('hidden');
      }
    }
    
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
        
        // Add extra incomes
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

  // Loading states
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