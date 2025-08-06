export class UIManager {
  constructor() {
    this.alertContainer = document.getElementById('alert-container');
    this.mascotMessageQueue = [];
    this.isShowingMascotMessage = false;
    this.currentMascotTimeout = null;
    this.setupMascotHoverBehavior();
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

    console.log('🐾 Initializing mascot hover behavior');

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
    
    console.log('🐾 Mascot speaking on hover:', randomMessage.text);
  }

  hideHoverMessage(messageElement) {
    if (!messageElement) return;
    
    this.clearMascotMessage(messageElement);
    console.log('🐾 Mascot returning to silent state');
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
    // Get current balance if available
    const balanceElement = document.getElementById('balance-amount-new');
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
            <button class="expense-action-btn edit-btn" onclick="window.app.editSpendingLimit('${limit.id}')" title="Editar límite">
              ✏️
            </button>
            <button class="expense-action-btn delete-btn" onclick="window.app.deleteSpendingLimit('${limit.id}')" title="Eliminar límite">
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