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
      
      item.innerHTML = `
        <div class="expense-icon">${category.icon}</div>
        <div class="expense-details">
          <div class="expense-description">${expense.description}</div>
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

  showInstallmentsModal(installments) {
    const container = document.getElementById('installments-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (installments.length === 0) {
      container.innerHTML = `
        <div class="installment-item">
          <div class="installment-header">
            <h3 class="installment-title">No hay cuotas activas</h3>
          </div>
          <p style="color: var(--text-secondary); margin: 0;">
            Cuando registres un gasto en cuotas, aparecerá aquí con todos los detalles.
          </p>
        </div>
      `;
      return;
    }

    installments.forEach(installment => {
      const item = document.createElement('div');
      item.className = 'installment-item fade-in';
      
      const createdDate = new Date(installment.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      item.innerHTML = `
        <div class="installment-header">
          <h3 class="installment-title">${installment.description}</h3>
          <div class="installment-amount">${this.formatCurrency(installment.monthlyAmount)}</div>
        </div>
        
        <div class="installment-details">
          <div class="installment-detail">
            <div class="installment-detail-label">Categoría</div>
            <div class="installment-detail-value">${installment.category}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Cuota Actual</div>
            <div class="installment-detail-value">${installment.currentInstallment} de ${installment.totalInstallments}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Monto Original</div>
            <div class="installment-detail-value">${this.formatCurrency(installment.originalAmount)}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Fecha de Creación</div>
            <div class="installment-detail-value">${createdDate}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Cuotas Restantes</div>
            <div class="installment-detail-value">${installment.remainingInstallments}</div>
          </div>
          
          <div class="installment-detail">
            <div class="installment-detail-label">Monto Restante</div>
            <div class="installment-detail-value">${this.formatCurrency(installment.remainingAmount)}</div>
          </div>
        </div>
        
        <div class="installment-progress">
          <div class="installment-progress-label">Progreso: ${installment.progress}%</div>
          <div class="installment-progress-bar">
            <div class="installment-progress-fill" style="width: ${installment.progress}%"></div>
          </div>
        </div>
      `;
      
      container.appendChild(item);
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