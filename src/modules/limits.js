export class LimitsManager {
  constructor() {
    this.limits = {};
    this.mascotAlerts = [];
  }

  async loadLimits() {
    const user = this.getCurrentUser();
    if (!user) return;

    const savedLimits = localStorage.getItem(`finzn-limits-${user}`);
    if (savedLimits) {
      try {
        this.limits = JSON.parse(savedLimits);
      } catch (error) {
        console.error('Error loading limits:', error);
        this.limits = {};
      }
    }
  }

  saveLimits() {
    const user = this.getCurrentUser();
    if (!user) return;

    try {
      localStorage.setItem(`finzn-limits-${user}`, JSON.stringify(this.limits));
    } catch (error) {
      console.error('Error saving limits:', error);
    }
  }

  getCurrentUser() {
    return localStorage.getItem('currentUser');
  }

  setCategoryLimit(category, limit, month = null) {
    const key = month || 'default';
    
    if (!this.limits[key]) {
      this.limits[key] = {};
    }
    
    this.limits[key][category] = {
      amount: parseFloat(limit),
      createdAt: new Date().toISOString()
    };
    
    this.saveLimits();
  }

  getCategoryLimit(category, month = null) {
    const key = month || 'default';
    return this.limits[key]?.[category]?.amount || null;
  }

  getAllLimits(month = null) {
    const key = month || 'default';
    return this.limits[key] || {};
  }

  deleteCategoryLimit(category, month = null) {
    const key = month || 'default';
    
    if (this.limits[key] && this.limits[key][category]) {
      delete this.limits[key][category];
      this.saveLimits();
    }
  }

  checkCategoryLimit(category, month, currentSpent = 0) {
    const limit = this.getCategoryLimit(category, month);
    
    if (!limit) {
      return {
        status: 'no-limit',
        limit: null,
        spent: currentSpent,
        remaining: null,
        percentage: 0
      };
    }

    const percentage = (currentSpent / limit) * 100;
    let status = 'safe';
    
    if (percentage >= 100) {
      status = 'exceeded';
    } else if (percentage >= 90) {
      status = 'critical';
    } else if (percentage >= 75) {
      status = 'warning';
    }

    return {
      status,
      limit,
      spent: currentSpent,
      remaining: Math.max(0, limit - currentSpent),
      percentage: Math.round(percentage)
    };
  }

  checkAllLimits(expensesByCategory, month) {
    const results = {};
    const limits = this.getAllLimits(month);
    
    Object.keys(limits).forEach(category => {
      const spent = expensesByCategory[category] || 0;
      results[category] = this.checkCategoryLimit(category, month, spent);
    });

    return results;
  }

  shouldShowMascotAlert(category, limitCheck) {
    const alertKey = `${category}-${limitCheck.status}`;
    
    // Don't show the same alert multiple times in a short period
    if (this.mascotAlerts.includes(alertKey)) {
      return false;
    }

    if (limitCheck.status === 'critical' || limitCheck.status === 'exceeded') {
      this.mascotAlerts.push(alertKey);
      
      // Clear alert after 1 hour to allow showing again
      setTimeout(() => {
        const index = this.mascotAlerts.indexOf(alertKey);
        if (index > -1) {
          this.mascotAlerts.splice(index, 1);
        }
      }, 3600000);
      
      return true;
    }

    return false;
  }

  getMascotMessage(category, limitCheck) {
    const messages = {
      critical: [
        `¡Cuidado! 🚨 Ya gastaste el ${limitCheck.percentage}% de tu límite en ${category}. Solo te quedan ${this.formatCurrency(limitCheck.remaining)}.`,
        `¡Atención! ⚠️ Estás muy cerca del límite en ${category}. Te quedan ${this.formatCurrency(limitCheck.remaining)} para este mes.`,
        `¡Alerta! 🔔 Has usado el ${limitCheck.percentage}% de tu presupuesto en ${category}. ¡Modera tus gastos!`
      ],
      exceeded: [
        `¡Oh no! 😱 Te pasaste del límite en ${category} por ${this.formatCurrency(Math.abs(limitCheck.remaining))}. ¡Revisa tus gastos!`,
        `¡Límite superado! 🚫 En ${category} gastaste ${this.formatCurrency(limitCheck.spent)} de ${this.formatCurrency(limitCheck.limit)}. ¡Cuidado!`,
        `¡Ups! 💸 Te excediste en ${category}. Considera ajustar tus próximos gastos para equilibrar tu presupuesto.`
      ]
    };

    const messageArray = messages[limitCheck.status] || [];
    return messageArray[Math.floor(Math.random() * messageArray.length)];
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}