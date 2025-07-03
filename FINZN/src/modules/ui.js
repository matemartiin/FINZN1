export class UIManager {
  constructor() {
    this.alertContainer = document.getElementById('alert-container');
  }

  updateBalance(balance) {
    const balanceAmount = document.getElementById('balance-amount');
    const monthlyExpenses = document.getElementById('monthly-expenses');
    const activeInstallments = document.getElementById('active-installments');
    
    if (balanceAmount) {
      balanceAmount.textContent = this.formatCurrency(balance.available);
    }
    if (monthlyExpenses) {
      monthlyExpenses.textContent = this.formatCurrency(balance.totalExpenses);
    }
    if (activeInstallments) {
      activeInstallments.textContent = balance.installments;
    }

    // Update new dashboard elements
    const activeInstallmentsSummary = document.getElementById('active-installments-summary');
    if (activeInstallmentsSummary) {
      activeInstallmentsSummary.textContent = balance.installments;
    }
  }

  updateExpensesList(expenses) {
    const container = document.getElementById('expenses-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (expenses.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay gastos registrados este mes</p>';
      return;
    }

    expenses.forEach(expense => {
      const item = document.createElement('div');
      item.className = 'expense-item fade-in';
      
      const category = this.getCategoryInfo(expense.category);
      
      // Show installment info if applicable
      const installmentInfo = expense.totalInstallments > 1 
        ? ` (${expense.installment}/${expense.totalInstallments})`
        : '';
      
      item.innerHTML = `
        <div class="expense-icon">${category.icon}</div>
        <div class="expense-details">
          <div class="expense-description">${expense.description}${installmentInfo}</div>
          <div class="expense-category">${category.name}</div>
        </div>
        <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
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
      container.innerHTML = '<p class="text-center text-muted">No hay objetivos creados</p>';
      return;
    }

    goals.forEach(goal => {
      const progress = Math.min((goal.current / goal.target) * 100, 100);
      
      const item = document.createElement('div');
      item.className = 'goal-item fade-in';
      item.innerHTML = `
        <div class="goal-header">
          <div class="goal-name">${goal.name}</div>
          <button class="goal-delete" onclick="window.app?.data.deleteGoal('${goal.id}'); window.app?.updateUI();">×</button>
        </div>
        <div class="goal-amount">${this.formatCurrency(goal.current)} / ${this.formatCurrency(goal.target)}</div>
        <div class="goal-progress">
          <div class="goal-progress-bar" style="width: ${progress}%"></div>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  updateGoalsListNew(goals) {
    const container = document.getElementById('goals-list-new');
    if (!container) return;
    
    container.innerHTML = '';

    if (goals.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay objetivos creados</p>';
      return;
    }

    goals.forEach(goal => {
      const progress = Math.min((goal.current / goal.target) * 100, 100);
      
      const item = document.createElement('div');
      item.className = 'goal-item-new fade-in';
      item.innerHTML = `
        <div class="goal-info">
          <span class="goal-name">${goal.name}</span>
          <span class="goal-percentage">${Math.round(progress)}%</span>
        </div>
        <div class="goal-progress-new">
          <div class="goal-progress-bar-new" style="width: ${progress}%"></div>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  updateCategoriesList(categories) {
    const container = document.getElementById('categories-list');
    if (!container) return;
    
    container.innerHTML = '';

    categories.forEach(category => {
      const item = document.createElement('div');
      item.className = 'category-item fade-in';
      item.innerHTML = `
        <div class="category-icon">${category.icon}</div>
        <div class="category-name">${category.name}</div>
        <button class="category-delete" onclick="window.app?.data.deleteCategory('${category.id}'); window.app?.updateUI();">×</button>
      `;
      
      container.appendChild(item);
    });
  }

  updateCategoryOptions(categories) {
    const select = document.getElementById('expense-category');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = `${category.icon} ${category.name}`;
      select.appendChild(option);
    });
  }

  updateIncomeDisplay(income) {
    const fixedIncomeAmount = document.getElementById('fixed-income-amount');
    const extraIncomeAmount = document.getElementById('extra-income-amount');
    
    if (fixedIncomeAmount) {
      fixedIncomeAmount.textContent = this.formatCurrency(income.fixed || 0);
    }
    if (extraIncomeAmount) {
      extraIncomeAmount.textContent = this.formatCurrency(income.extra || 0);
    }
  }

  updateStats(stats) {
    const totalSavings = document.getElementById('total-savings');
    const monthlyAverage = document.getElementById('monthly-average');
    
    if (totalSavings) {
      totalSavings.textContent = this.formatCurrency(stats.totalSavings);
    }
    if (monthlyAverage) {
      monthlyAverage.textContent = this.formatCurrency(stats.monthlyAverage);
    }
  }

  updateAchievements(achievements) {
    const container = document.getElementById('achievements-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (achievements.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay logros desbloqueados</p>';
      return;
    }

    achievements.forEach(achievement => {
      const item = document.createElement('div');
      item.className = 'achievement-item fade-in';
      item.innerHTML = `
        <div>${achievement.title}</div>
      `;
      
      container.appendChild(item);
    });
  }

  // NEW METHOD: Update installments display
  updateInstallmentsDisplay(installments) {
    const container = document.getElementById('installments-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (installments.length === 0) {
      container.innerHTML = '<div class="no-installments">No hay cuotas activas</div>';
      return;
    }

    // Group installments by original expense
    const groupedInstallments = {};
    installments.forEach(installment => {
      const key = installment.originalId || installment.id.split('-')[0];
      if (!groupedInstallments[key]) {
        groupedInstallments[key] = [];
      }
      groupedInstallments[key].push(installment);
    });

    Object.entries(groupedInstallments).forEach(([originalId, installmentGroup]) => {
      const firstInstallment = installmentGroup[0];
      
      const groupContainer = document.createElement('div');
      groupContainer.className = 'installment-group';
      
      const header = document.createElement('div');
      header.className = 'installment-group-header';
      header.innerHTML = `
        <div class="installment-expense-info">
          <h4>${firstInstallment.originalDescription || firstInstallment.description}</h4>
          <div class="installment-total">Total: ${this.formatCurrency(firstInstallment.originalAmount || (firstInstallment.amount * firstInstallment.totalInstallments))}</div>
        </div>
        <div class="installment-category">${firstInstallment.category}</div>
      `;
      
      groupContainer.appendChild(header);
      
      const installmentsList = document.createElement('div');
      installmentsList.className = 'installments-detail-list';
      
      // Sort installments by installment number
      installmentGroup.sort((a, b) => a.installment - b.installment);
      
      installmentGroup.forEach(installment => {
        const installmentItem = document.createElement('div');
        installmentItem.className = 'installment-detail-item';
        
        // Format month for display
        const monthDate = new Date(installment.month + '-01');
        const monthName = monthDate.toLocaleDateString('es-ES', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        // Check if this installment is in the current month
        const currentMonth = new Date().toISOString().slice(0, 7);
        const isCurrentMonth = installment.month === currentMonth;
        
        installmentItem.innerHTML = `
          <div class="installment-number">
            Cuota ${installment.installment}/${installment.totalInstallments}
          </div>
          <div class="installment-month ${isCurrentMonth ? 'current-month' : ''}">${monthName}</div>
          <div class="installment-amount">${this.formatCurrency(installment.amount)}</div>
        `;
        
        installmentsList.appendChild(installmentItem);
      });
      
      groupContainer.appendChild(installmentsList);
      container.appendChild(groupContainer);
    });
  }

  filterExpenses(query) {
    const items = document.querySelectorAll('.expense-item');
    
    items.forEach(item => {
      const description = item.querySelector('.expense-description')?.textContent.toLowerCase() || '';
      const category = item.querySelector('.expense-category')?.textContent.toLowerCase() || '';
      
      if (description.includes(query) || category.includes(query)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
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

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getCategoryInfo(categoryName) {
    // Default category info - this should be enhanced to work with the data manager
    const defaultCategories = {
      'Comida': { icon: '🍔', color: '#ef4444' },
      'Transporte': { icon: '🚗', color: '#3b82f6' },
      'Salud': { icon: '💊', color: '#8b5cf6' },
      'Ocio': { icon: '🎉', color: '#f59e0b' },
      'Supermercado': { icon: '🛒', color: '#10b981' },
      'Servicios': { icon: '📱', color: '#6b7280' },
      'Otros': { icon: '📦', color: '#9ca3af' }
    };
    
    return defaultCategories[categoryName] || defaultCategories['Otros'];
  }
}