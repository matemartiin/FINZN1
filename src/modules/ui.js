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