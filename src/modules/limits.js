export class LimitsManager {
  constructor(dataManager, uiManager) {
    this.data = dataManager;
    this.ui = uiManager;
    this.mascotAlerts = [];
  }

  async setCategoryLimit(categoryName, limit, month) {
    if (!this.data.data.categoryLimits) {
      this.data.data.categoryLimits = {};
    }
    
    if (!this.data.data.categoryLimits[month]) {
      this.data.data.categoryLimits[month] = {};
    }
    
    this.data.data.categoryLimits[month][categoryName] = {
      limit: parseFloat(limit),
      setDate: new Date().toISOString()
    };
    
    this.data.saveUserData();
    
    // Check if we're already over the limit
    this.checkCategoryLimit(categoryName, month);
  }

  getCategoryLimit(categoryName, month) {
    if (!this.data.data.categoryLimits || !this.data.data.categoryLimits[month]) {
      return null;
    }
    return this.data.data.categoryLimits[month][categoryName];
  }

  getAllCategoryLimits(month) {
    if (!this.data.data.categoryLimits || !this.data.data.categoryLimits[month]) {
      return {};
    }
    return this.data.data.categoryLimits[month];
  }

  checkCategoryLimit(categoryName, month) {
    const limit = this.getCategoryLimit(categoryName, month);
    if (!limit) return { status: 'no-limit', percentage: 0 };

    const expenses = this.data.getExpensesByCategory(month);
    const currentSpent = expenses[categoryName] || 0;
    const percentage = (currentSpent / limit.limit) * 100;

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
      percentage: Math.round(percentage),
      currentSpent,
      limit: limit.limit,
      remaining: Math.max(0, limit.limit - currentSpent)
    };
  }

  checkAllLimits(month) {
    const limits = this.getAllCategoryLimits(month);
    const results = {};

    Object.keys(limits).forEach(categoryName => {
      results[categoryName] = this.checkCategoryLimit(categoryName, month);
    });

    return results;
  }

  showMascotAlert(categoryName, limitInfo) {
    const alertId = `${categoryName}-${Date.now()}`;
    
    // Avoid duplicate alerts
    if (this.mascotAlerts.includes(`${categoryName}-${limitInfo.status}`)) {
      return;
    }

    let message = '';
    let alertType = 'warning';

    switch (limitInfo.status) {
      case 'warning':
        message = `¡Cuidado! Ya gastaste el ${limitInfo.percentage}% de tu límite en ${categoryName}. Te quedan ${this.ui.formatCurrency(limitInfo.remaining)}.`;
        alertType = 'warning';
        break;
      case 'critical':
        message = `🚨 ¡Alerta! Estás muy cerca del límite en ${categoryName} (${limitInfo.percentage}%). Solo te quedan ${this.ui.formatCurrency(limitInfo.remaining)}.`;
        alertType = 'error';
        break;
      case 'exceeded':
        message = `💸 ¡Te pasaste del límite en ${categoryName}! Has gastado ${this.ui.formatCurrency(limitInfo.currentSpent)} de ${this.ui.formatCurrency(limitInfo.limit)}.`;
        alertType = 'error';
        break;
    }

    if (message) {
      this.showMascotNotification(message, alertType);
      this.mascotAlerts.push(`${categoryName}-${limitInfo.status}`);
      
      // Clear alert after 10 seconds
      setTimeout(() => {
        const index = this.mascotAlerts.indexOf(`${categoryName}-${limitInfo.status}`);
        if (index > -1) {
          this.mascotAlerts.splice(index, 1);
        }
      }, 10000);
    }
  }

  showMascotNotification(message, type = 'info') {
    // Create mascot notification
    const notification = document.createElement('div');
    notification.className = `mascot-notification ${type}`;
    notification.innerHTML = `
      <div class="mascot-notification-content">
        <div class="mascot-avatar">
          <img src="/mascota-finzn.png" alt="FINZN Mascota" />
        </div>
        <div class="mascot-message">
          <div class="mascot-bubble">
            ${message}
          </div>
        </div>
        <button class="mascot-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto remove after 8 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 8000);

    // Play notification sound (optional)
    this.playNotificationSound();
  }

  playNotificationSound() {
    // Create a simple notification sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Audio notification not available');
    }
  }

  deleteCategoryLimit(categoryName, month) {
    if (this.data.data.categoryLimits && this.data.data.categoryLimits[month]) {
      delete this.data.data.categoryLimits[month][categoryName];
      this.data.saveUserData();
    }
  }

  getCategoryLimitStatus(categoryName, month) {
    const limitInfo = this.checkCategoryLimit(categoryName, month);
    
    if (limitInfo.status === 'no-limit') {
      return {
        hasLimit: false,
        message: 'Sin límite establecido'
      };
    }

    let statusText = '';
    let statusClass = '';

    switch (limitInfo.status) {
      case 'safe':
        statusText = `${limitInfo.percentage}% usado - Todo bien`;
        statusClass = 'safe';
        break;
      case 'warning':
        statusText = `${limitInfo.percentage}% usado - Cuidado`;
        statusClass = 'warning';
        break;
      case 'critical':
        statusText = `${limitInfo.percentage}% usado - ¡Alerta!`;
        statusClass = 'critical';
        break;
      case 'exceeded':
        statusText = `${limitInfo.percentage}% usado - ¡Excedido!`;
        statusClass = 'exceeded';
        break;
    }

    return {
      hasLimit: true,
      status: limitInfo.status,
      percentage: limitInfo.percentage,
      message: statusText,
      statusClass,
      currentSpent: limitInfo.currentSpent,
      limit: limitInfo.limit,
      remaining: limitInfo.remaining
    };
  }
}