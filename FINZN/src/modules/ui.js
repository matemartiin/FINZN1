export class UIManager {
  constructor() {
    this.alertContainer = document.getElementById('alert-container');
    this.mascotAlertTimeout = null;
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

  updateExpensesList(expenses, app) {
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
      
      // Format transaction date for display
      const transactionDate = expense.transactionDate 
        ? new Date(expense.transactionDate).toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short' 
          })
        : 'Sin fecha';
      
      item.innerHTML = `
        <div class="expense-icon">${category.icon}</div>
        <div class="expense-details">
          <div class="expense-description">${expense.description}</div>
          <div class="expense-category">${category.name} • ${transactionDate}</div>
          ${expense.totalInstallments > 1 ? `<div class="expense-installment">Cuota ${expense.installment} de ${expense.totalInstallments}</div>` : ''}
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

  showExtraIncomesModal(extraIncomes) {
    const container = document.getElementById('extra-incomes-list');
    const totalExtraIncomes = document.getElementById('total-extra-incomes');
    const currentMonthExtraIncomes = document.getElementById('current-month-extra-incomes');
    
    if (!container) return;
    
    container.innerHTML = '';

    if (extraIncomes.length === 0) {
      container.innerHTML = `
        <div class="extra-incomes-empty">
          <div class="extra-incomes-empty-icon">✨</div>
          <div class="extra-incomes-empty-title">No hay ingresos extras registrados</div>
          <div class="extra-incomes-empty-description">
            Cuando registres ingresos adicionales como ventas, trabajos freelance o regalos, aparecerán aquí.
          </div>
        </div>
      `;
      
      if (totalExtraIncomes) totalExtraIncomes.textContent = '$0';
      if (currentMonthExtraIncomes) currentMonthExtraIncomes.textContent = '$0';
      return;
    }

    // Calculate totals
    const currentMonth = this.getCurrentMonth();
    const totalAmount = extraIncomes.reduce((sum, income) => sum + income.amount, 0);
    const currentMonthAmount = extraIncomes
      .filter(income => income.month === currentMonth)
      .reduce((sum, income) => sum + income.amount, 0);
    
    if (totalExtraIncomes) totalExtraIncomes.textContent = this.formatCurrency(totalAmount);
    if (currentMonthExtraIncomes) currentMonthExtraIncomes.textContent = this.formatCurrency(currentMonthAmount);

    // Group by month
    const groupedByMonth = {};
    extraIncomes.forEach(income => {
      if (!groupedByMonth[income.month]) {
        groupedByMonth[income.month] = [];
      }
      groupedByMonth[income.month].push(income);
    });

    // Create month sections
    Object.entries(groupedByMonth)
      .sort(([a], [b]) => b.localeCompare(a)) // Sort months descending
      .forEach(([month, incomes]) => {
        const monthSection = document.createElement('div');
        monthSection.className = 'extra-incomes-month-section';
        
        const monthTotal = incomes.reduce((sum, income) => sum + income.amount, 0);
        const monthName = new Date(month + '-01').toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long' 
        });
        
        monthSection.innerHTML = `
          <div class="extra-incomes-month-header">
            <h3 class="extra-incomes-month-title">${monthName}</h3>
            <div class="extra-incomes-month-total">${this.formatCurrency(monthTotal)}</div>
          </div>
          <div class="extra-incomes-month-list">
            ${incomes.map(income => {
              const createdDate = new Date(income.createdAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
              });
              
              return `
                <div class="extra-income-item fade-in">
                  <div class="extra-income-icon">${this.getCategoryIcon(income.category)}</div>
                  <div class="extra-income-details">
                    <div class="extra-income-description">${income.description}</div>
                    <div class="extra-income-category">${income.category}</div>
                    <div class="extra-income-date">${createdDate}</div>
                  </div>
                  <div class="extra-income-amount">${this.formatCurrency(income.amount)}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
        
        container.appendChild(monthSection);
      });
  }

  getCategoryIcon(category) {
    const categoryIcons = {
      'Venta': '💰',
      'Regalo': '🎁',
      'Trabajo': '💼',
      'Freelance': '💻',
      'Inversión': '📈',
      'Bono': '🎯',
      'Comisión': '💸',
      'Reembolso': '🔄',
      'Otro': '📦'
    };
    
    return categoryIcons[category] || '📦';
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
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

  updateSpendingLimitsList(limits, expensesByCategory) {
    const container = document.getElementById('limits-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (limits.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay límites establecidos</p>';
      return;
    }

    limits.forEach(limit => {
      const spent = expensesByCategory[limit.category] || 0;
      const percentage = limit.amount > 0 ? (spent / limit.amount) * 100 : 0;
      const remaining = Math.max(0, limit.amount - spent);
      
      let statusClass = 'safe';
      let statusIcon = '✅';
      let statusText = 'Dentro del límite';
      
      if (percentage >= 100) {
        statusClass = 'exceeded';
        statusIcon = '🚨';
        statusText = 'Límite superado';
      } else if (percentage >= limit.warning) {
        statusClass = 'warning';
        statusIcon = '⚠️';
        statusText = 'Cerca del límite';
      }
      
      const item = document.createElement('div');
      item.className = `limit-item fade-in limit-${statusClass}`;
      item.innerHTML = `
        <div class="limit-header">
          <div class="limit-category">
            <div class="limit-icon">${this.getCategoryInfo(limit.category).icon}</div>
            <div class="limit-name">${limit.category}</div>
          </div>
          <button class="limit-delete" onclick="window.app?.data.deleteSpendingLimit('${limit.id}'); window.app?.updateUI();" title="Eliminar límite">×</button>
        </div>
        
        <div class="limit-amounts">
          <div class="limit-spent">
            <span class="limit-label">Gastado:</span>
            <span class="limit-value">${this.formatCurrency(spent)}</span>
          </div>
          <div class="limit-total">
            <span class="limit-label">Límite:</span>
            <span class="limit-value">${this.formatCurrency(limit.amount)}</span>
          </div>
          <div class="limit-remaining">
            <span class="limit-label">Disponible:</span>
            <span class="limit-value">${this.formatCurrency(remaining)}</span>
          </div>
        </div>
        
        <div class="limit-progress">
          <div class="limit-progress-bar">
            <div class="limit-progress-fill limit-progress-${statusClass}" style="width: ${Math.min(percentage, 100)}%"></div>
          </div>
          <div class="limit-percentage">${Math.round(percentage)}%</div>
        </div>
        
        <div class="limit-status">
          <span class="limit-status-icon">${statusIcon}</span>
          <span class="limit-status-text">${statusText}</span>
          <span class="limit-warning-threshold">Alerta: ${limit.warning}%</span>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  updateSpendingLimitsGrid(limits, expensesByCategory) {
    const container = document.getElementById('spending-limits-grid');
    if (!container) return;
    
    container.innerHTML = '';

    if (limits.length === 0) {
      container.innerHTML = `
        <div class="spending-limits-empty">
          <div class="spending-limits-empty-icon">🎯</div>
          <div class="spending-limits-empty-title">No hay límites establecidos</div>
          <div class="spending-limits-empty-description">
            Establece límites de gasto para cada categoría y mantén el control de tus finanzas.
            <br>Haz clic en "Nuevo Límite" para comenzar.
          </div>
        </div>
      `;
      return;
    }

    limits.forEach(limit => {
      const spent = expensesByCategory[limit.category] || 0;
      const percentage = limit.amount > 0 ? (spent / limit.amount) * 100 : 0;
      const remaining = Math.max(0, limit.amount - spent);
      
      let statusClass = 'safe';
      let statusIcon = '✅';
      let statusText = 'Dentro del límite';
      
      if (percentage >= 100) {
        statusClass = 'danger';
        statusIcon = '🚨';
        statusText = 'Límite superado';
      } else if (percentage >= limit.warning) {
        statusClass = 'warning';
        statusIcon = '⚠️';
        statusText = 'Cerca del límite';
      }
      
      const categoryInfo = this.getCategoryInfo(limit.category);
      
      const card = document.createElement('div');
      card.className = `spending-limit-card limit-${statusClass} fade-in`;
      card.innerHTML = `
        <div class="limit-card-header">
          <div class="limit-category-info">
            <div class="limit-category-icon">${categoryInfo.icon}</div>
            <div class="limit-category-name">${limit.category}</div>
          </div>
          <button class="limit-delete-btn" onclick="window.app?.data.deleteSpendingLimit('${limit.id}'); window.app?.updateUI();" title="Eliminar límite">
            ×
          </button>
        </div>
        
        <div class="limit-amounts-grid">
          <div class="limit-amount-item">
            <div class="limit-amount-label">Gastado</div>
            <div class="limit-amount-value spent">${this.formatCurrency(spent)}</div>
          </div>
          <div class="limit-amount-item">
            <div class="limit-amount-label">Límite</div>
            <div class="limit-amount-value">${this.formatCurrency(limit.amount)}</div>
          </div>
        </div>
        
        <div class="limit-progress-container">
          <div class="limit-progress-header">
            <div class="limit-progress-label">Progreso</div>
            <div class="limit-progress-percentage">${Math.round(percentage)}%</div>
          </div>
          <div class="limit-progress-bar-container">
            <div class="limit-progress-bar-animated ${statusClass}" style="width: 0%" data-width="${Math.min(percentage, 100)}%"></div>
          </div>
        </div>
        
        <div class="limit-status-badge ${statusClass}">
          <span>${statusIcon}</span>
          <span>${statusText}</span>
        </div>
        
        <div class="limit-warning-threshold">
          Alerta configurada al ${limit.warning}%
        </div>
      `;
      
      container.appendChild(card);
    });
    
    // Trigger animations after DOM insertion
    setTimeout(() => {
      const progressBars = container.querySelectorAll('.limit-progress-bar-animated');
      progressBars.forEach(bar => {
        const targetWidth = bar.getAttribute('data-width');
        bar.style.width = targetWidth;
      });
    }, 100);
  }

  updateLimitCategoryOptions(categories) {
    const select = document.getElementById('limit-category');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = `${category.icon} ${category.name}`;
      select.appendChild(option);
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
    
    // Show savings achievement if user has accumulated savings
    if (stats.totalSavings > 0) {
      console.log(`💰 Total de ahorros acumulados: ${this.formatCurrency(stats.totalSavings)}`);
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

  showMascotAlert(message, type = 'warning') {
    const mascotAlert = document.getElementById('mascot-alert');
    const mascotAlertText = document.getElementById('mascot-alert-text');
    
    if (!mascotAlert || !mascotAlertText) return;
    
    // Clear any existing timeout
    if (this.mascotAlertTimeout) {
      clearTimeout(this.mascotAlertTimeout);
    }
    
    // Set the message and show the alert
    mascotAlertText.textContent = message;
    mascotAlert.className = `mascot-alert mascot-alert-${type}`;
    
    // Add bounce animation to mascot
    const mascot = document.querySelector('.finzn-mascot-dashboard img');
    if (mascot) {
      mascot.classList.add('mascot-bounce');
      setTimeout(() => mascot.classList.remove('mascot-bounce'), 1000);
    }
    
    // Auto-hide after 8 seconds for warnings, 12 seconds for danger
    const hideDelay = type === 'danger' ? 12000 : 8000;
    this.mascotAlertTimeout = setTimeout(() => {
      mascotAlert.classList.add('hidden');
    }, hideDelay);
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