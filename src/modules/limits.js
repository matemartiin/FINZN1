export class LimitsManager {
  constructor(dataManager, uiManager) {
    this.data = dataManager;
    this.ui = uiManager;
    this.mascotAlerts = [];
  }

  async setLimit(categoryName, amount, month) {
    if (!this.data.data.limits) {
      this.data.data.limits = {};
    }
    
    if (!this.data.data.limits[month]) {
      this.data.data.limits[month] = {};
    }
    
    this.data.data.limits[month][categoryName] = {
      amount: amount,
      createdAt: new Date().toISOString()
    };
    
    this.data.saveUserData();
    this.checkLimitsForCategory(categoryName, month);
  }

  getLimit(categoryName, month) {
    if (!this.data.data.limits || !this.data.data.limits[month]) {
      return null;
    }
    return this.data.data.limits[month][categoryName];
  }

  getAllLimits(month) {
    if (!this.data.data.limits || !this.data.data.limits[month]) {
      return {};
    }
    return this.data.data.limits[month];
  }

  deleteLimit(categoryName, month) {
    if (this.data.data.limits && this.data.data.limits[month]) {
      delete this.data.data.limits[month][categoryName];
      this.data.saveUserData();
    }
  }

  checkLimitsForCategory(categoryName, month) {
    const limit = this.getLimit(categoryName, month);
    if (!limit) return;

    const categoryExpenses = this.data.getExpensesByCategory(month);
    const currentSpent = categoryExpenses[categoryName] || 0;
    const limitAmount = limit.amount;
    const percentage = (currentSpent / limitAmount) * 100;

    // Verificar diferentes niveles de alerta
    if (percentage >= 100) {
      this.showMascotAlert(categoryName, 'exceeded', currentSpent, limitAmount);
    } else if (percentage >= 90) {
      this.showMascotAlert(categoryName, 'critical', currentSpent, limitAmount);
    } else if (percentage >= 75) {
      this.showMascotAlert(categoryName, 'warning', currentSpent, limitAmount);
    }

    return {
      percentage: Math.round(percentage),
      status: this.getLimitStatus(percentage),
      currentSpent,
      limitAmount,
      remaining: Math.max(0, limitAmount - currentSpent)
    };
  }

  checkAllLimits(month) {
    const limits = this.getAllLimits(month);
    const results = {};

    Object.keys(limits).forEach(categoryName => {
      results[categoryName] = this.checkLimitsForCategory(categoryName, month);
    });

    return results;
  }

  getLimitStatus(percentage) {
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'caution';
    return 'safe';
  }

  showMascotAlert(categoryName, alertType, currentSpent, limitAmount) {
    const alertId = `${categoryName}-${alertType}-${Date.now()}`;
    
    // Evitar alertas duplicadas recientes
    const recentAlert = this.mascotAlerts.find(alert => 
      alert.category === categoryName && 
      alert.type === alertType && 
      Date.now() - alert.timestamp < 300000 // 5 minutos
    );
    
    if (recentAlert) return;

    // Registrar la alerta
    this.mascotAlerts.push({
      id: alertId,
      category: categoryName,
      type: alertType,
      timestamp: Date.now()
    });

    // Limpiar alertas antiguas
    this.mascotAlerts = this.mascotAlerts.filter(alert => 
      Date.now() - alert.timestamp < 3600000 // 1 hora
    );

    const messages = this.getMascotMessages(alertType, categoryName, currentSpent, limitAmount);
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    this.displayMascotAlert(randomMessage, alertType);
  }

  getMascotMessages(alertType, categoryName, currentSpent, limitAmount) {
    const remaining = limitAmount - currentSpent;
    const percentage = Math.round((currentSpent / limitAmount) * 100);

    switch (alertType) {
      case 'exceeded':
        return [
          `¡Ups! 😱 Te pasaste del límite en ${categoryName}. Has gastado ${this.ui.formatCurrency(currentSpent)} de ${this.ui.formatCurrency(limitAmount)}`,
          `¡Alerta roja! 🚨 El límite de ${categoryName} fue superado por ${this.ui.formatCurrency(currentSpent - limitAmount)}`,
          `¡Frena! 🛑 Ya gastaste ${this.ui.formatCurrency(currentSpent)} en ${categoryName}, tu límite era ${this.ui.formatCurrency(limitAmount)}`,
          `¡Cuidado! 💸 Te excediste en ${categoryName}. Es momento de revisar tus gastos.`
        ];

      case 'critical':
        return [
          `¡Atención! 🔥 Estás al ${percentage}% del límite en ${categoryName}. Solo te quedan ${this.ui.formatCurrency(remaining)}`,
          `¡Casi llegamos al límite! 😰 En ${categoryName} te quedan ${this.ui.formatCurrency(remaining)} para gastar`,
          `¡Zona peligrosa! ⚠️ Has usado el ${percentage}% de tu límite en ${categoryName}`,
          `¡Cuidado! 🚨 Solo te quedan ${this.ui.formatCurrency(remaining)} en ${categoryName} antes de superar el límite`
        ];

      case 'warning':
        return [
          `¡Ojo! 👀 Ya usaste el ${percentage}% de tu límite en ${categoryName}. Te quedan ${this.ui.formatCurrency(remaining)}`,
          `¡Atención! 📢 Estás cerca del límite en ${categoryName}. Quedan ${this.ui.formatCurrency(remaining)}`,
          `¡Precaución! ⚡ Has gastado ${this.ui.formatCurrency(currentSpent)} de ${this.ui.formatCurrency(limitAmount)} en ${categoryName}`,
          `¡Aviso! 📊 El ${percentage}% de tu presupuesto en ${categoryName} ya fue usado`
        ];

      default:
        return [`Revisa tus gastos en ${categoryName}`];
    }
  }

  displayMascotAlert(message, alertType) {
    // Crear el elemento de alerta de la mascota
    const mascotAlert = document.createElement('div');
    mascotAlert.className = `mascot-alert mascot-alert-${alertType}`;
    
    mascotAlert.innerHTML = `
      <div class="mascot-alert-content">
        <div class="mascot-alert-avatar">
          <img src="/mascota-finzn.png" alt="FINZN Mascota" />
        </div>
        <div class="mascot-alert-message">
          <div class="mascot-alert-text">${message}</div>
          <button class="mascot-alert-close">×</button>
        </div>
      </div>
    `;

    // Agregar al DOM
    document.body.appendChild(mascotAlert);

    // Mostrar con animación
    setTimeout(() => mascotAlert.classList.add('show'), 100);

    // Configurar cierre
    const closeBtn = mascotAlert.querySelector('.mascot-alert-close');
    closeBtn.addEventListener('click', () => this.closeMascotAlert(mascotAlert));

    // Auto-cerrar después de 8 segundos
    setTimeout(() => this.closeMascotAlert(mascotAlert), 8000);

    // Reproducir sonido de alerta (opcional)
    this.playAlertSound(alertType);
  }

  closeMascotAlert(alertElement) {
    if (alertElement && alertElement.parentNode) {
      alertElement.classList.remove('show');
      setTimeout(() => {
        if (alertElement.parentNode) {
          alertElement.parentNode.removeChild(alertElement);
        }
      }, 300);
    }
  }

  playAlertSound(alertType) {
    // Crear un sonido simple usando Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Diferentes tonos para diferentes tipos de alerta
      switch (alertType) {
        case 'exceeded':
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          break;
        case 'critical':
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          break;
        case 'warning':
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
          break;
      }

      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Silenciosamente fallar si no hay soporte de audio
      console.log('Audio not supported');
    }
  }

  getLimitProgress(categoryName, month) {
    const limit = this.getLimit(categoryName, month);
    if (!limit) return null;

    const categoryExpenses = this.data.getExpensesByCategory(month);
    const currentSpent = categoryExpenses[categoryName] || 0;
    const percentage = Math.min((currentSpent / limit.amount) * 100, 100);

    return {
      percentage: Math.round(percentage),
      currentSpent,
      limitAmount: limit.amount,
      remaining: Math.max(0, limit.amount - currentSpent),
      status: this.getLimitStatus(percentage)
    };
  }

  // Método para obtener estadísticas de límites
  getLimitStats(month) {
    const limits = this.getAllLimits(month);
    const stats = {
      totalLimits: Object.keys(limits).length,
      exceeded: 0,
      critical: 0,
      warning: 0,
      safe: 0
    };

    Object.keys(limits).forEach(categoryName => {
      const progress = this.getLimitProgress(categoryName, month);
      if (progress) {
        stats[progress.status]++;
      }
    });

    return stats;
  }
}