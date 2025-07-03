export class MascotManager {
  constructor() {
    this.tips = [
      {
        icon: '💰',
        title: 'Ahorro Inteligente',
        message: 'Basado en tus gastos, podrías ahorrar más este mes reduciendo gastos innecesarios.'
      },
      {
        icon: '📊',
        title: 'Análisis de Gastos',
        message: 'Revisa tus categorías de gastos para identificar oportunidades de ahorro.'
      },
      {
        icon: '🎯',
        title: 'Objetivos de Ahorro',
        message: '¡Estás progresando bien! Mantén el ritmo para alcanzar tus metas.'
      },
      {
        icon: '💡',
        title: 'Consejo del Día',
        message: 'Considera automatizar tus ahorros para crear un hábito financiero saludable.'
      },
      {
        icon: '📈',
        title: 'Tendencia Positiva',
        message: 'Tus hábitos financieros han mejorado este mes. ¡Sigue así!'
      },
      {
        icon: '⚡',
        title: 'Acción Recomendada',
        message: 'Es un buen momento para revisar y ajustar tu presupuesto mensual.'
      }
    ];
    
    this.currentTipIndex = 0;
    this.isActive = false;
  }

  init() {
    this.setupMascotInteractions();
    this.startPeriodicTips();
    this.setupSmartNotifications();
  }

  setupMascotInteractions() {
    const mascot = document.getElementById('interactive-mascot');
    const tooltip = document.getElementById('mascot-tooltip');
    
    if (mascot) {
      // Click interaction
      mascot.addEventListener('click', () => {
        this.showPersonalizedTips();
      });
      
      // Hover interactions
      mascot.addEventListener('mouseenter', () => {
        this.showQuickTip();
      });
      
      mascot.addEventListener('mouseleave', () => {
        this.hideQuickTip();
      });
      
      // Periodic animations
      setInterval(() => {
        this.playAttentionAnimation();
      }, 30000); // Every 30 seconds
    }
  }

  showQuickTip() {
    const tooltip = document.getElementById('mascot-tooltip');
    const message = document.getElementById('mascot-message');
    
    if (tooltip && message) {
      const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
      message.textContent = `${randomTip.icon} ${randomTip.message}`;
      tooltip.classList.add('show');
    }
  }

  hideQuickTip() {
    const tooltip = document.getElementById('mascot-tooltip');
    if (tooltip) {
      tooltip.classList.remove('show');
    }
  }

  showPersonalizedTips() {
    // Generate personalized tips based on user data
    const userData = this.getUserFinancialData();
    const personalizedTips = this.generatePersonalizedTips(userData);
    
    // Update modal content
    this.updateTipsModal(personalizedTips);
    
    // Show modal
    if (window.app && window.app.modals) {
      window.app.modals.show('mascot-tips-modal');
    }
    
    // Play success sound (if available)
    this.playInteractionSound();
  }

  generatePersonalizedTips(userData) {
    const tips = [];
    
    // Analyze spending patterns
    if (userData.totalExpenses > userData.totalIncome * 0.8) {
      tips.push({
        icon: '⚠️',
        title: 'Control de Gastos',
        message: 'Estás gastando el 80% de tus ingresos. Considera reducir gastos no esenciales.'
      });
    }
    
    // Check savings goals
    if (userData.goalsProgress < 50) {
      tips.push({
        icon: '🎯',
        title: 'Impulsa tus Objetivos',
        message: 'Tus objetivos de ahorro están por debajo del 50%. ¡Puedes lograrlo!'
      });
    }
    
    // Analyze top spending category
    if (userData.topCategory) {
      tips.push({
        icon: '📊',
        title: 'Categoría Principal',
        message: `Tu mayor gasto es en ${userData.topCategory}. Revisa si puedes optimizar esta área.`
      });
    }
    
    // Positive reinforcement
    if (userData.savingsRate > 20) {
      tips.push({
        icon: '🌟',
        title: '¡Excelente Trabajo!',
        message: 'Tu tasa de ahorro es superior al 20%. ¡Eres un experto en finanzas!'
      });
    }
    
    // Default tips if no specific recommendations
    if (tips.length === 0) {
      tips.push(...this.tips.slice(0, 3));
    }
    
    return tips;
  }

  getUserFinancialData() {
    // Get data from the app's data manager
    if (window.app && window.app.data) {
      const currentMonth = window.app.currentMonth;
      const balance = window.app.data.getBalance(currentMonth);
      const income = window.app.data.getIncome(currentMonth);
      const goals = window.app.data.getGoals();
      const expensesByCategory = window.app.data.getExpensesByCategory(currentMonth);
      
      // Calculate metrics
      const totalIncome = (income.fixed || 0) + (income.extra || 0);
      const savingsRate = totalIncome > 0 ? ((totalIncome - balance.totalExpenses) / totalIncome) * 100 : 0;
      const goalsProgress = goals.length > 0 ? 
        goals.reduce((sum, goal) => sum + (goal.current / goal.target * 100), 0) / goals.length : 0;
      
      const topCategory = Object.keys(expensesByCategory).reduce((a, b) => 
        expensesByCategory[a] > expensesByCategory[b] ? a : b, '');
      
      return {
        totalIncome,
        totalExpenses: balance.totalExpenses,
        savingsRate,
        goalsProgress,
        topCategory,
        balance: balance.available
      };
    }
    
    return {
      totalIncome: 0,
      totalExpenses: 0,
      savingsRate: 0,
      goalsProgress: 0,
      topCategory: '',
      balance: 0
    };
  }

  updateTipsModal(tips) {
    const content = document.getElementById('mascot-tips-content');
    if (content) {
      content.innerHTML = '';
      
      tips.forEach(tip => {
        const tipElement = document.createElement('div');
        tipElement.className = 'tip-item';
        tipElement.innerHTML = `
          <div class="tip-icon">${tip.icon}</div>
          <div class="tip-text">
            <h4>${tip.title}</h4>
            <p>${tip.message}</p>
          </div>
        `;
        content.appendChild(tipElement);
      });
    }
  }

  playAttentionAnimation() {
    const mascot = document.getElementById('interactive-mascot');
    if (mascot && !this.isActive) {
      mascot.style.animation = 'bounce 0.6s ease-in-out';
      setTimeout(() => {
        mascot.style.animation = '';
      }, 600);
    }
  }

  startPeriodicTips() {
    // Show a tip every 5 minutes
    setInterval(() => {
      if (!this.isActive) {
        this.showPeriodicNotification();
      }
    }, 300000); // 5 minutes
  }

  showPeriodicNotification() {
    const tip = this.tips[this.currentTipIndex];
    this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
    
    // Show as alert
    if (window.app && window.app.ui) {
      window.app.ui.showAlert(`${tip.icon} ${tip.title}: ${tip.message}`, 'info');
    }
    
    // Play attention animation
    this.playAttentionAnimation();
  }

  setupSmartNotifications() {
    // Check for important financial events
    setInterval(() => {
      this.checkFinancialAlerts();
    }, 60000); // Every minute
  }

  checkFinancialAlerts() {
    if (window.app && window.app.data) {
      const userData = this.getUserFinancialData();
      
      // Alert if spending is too high
      if (userData.totalExpenses > userData.totalIncome * 0.9) {
        this.showUrgentAlert('⚠️ ¡Atención! Estás gastando más del 90% de tus ingresos este mes.');
      }
      
      // Celebrate goal achievements
      const goals = window.app.data.getGoals();
      goals.forEach(goal => {
        const progress = (goal.current / goal.target) * 100;
        if (progress >= 100 && !goal.celebrated) {
          this.showCelebration(`🎉 ¡Felicitaciones! Has completado tu objetivo: ${goal.name}`);
          goal.celebrated = true;
        }
      });
    }
  }

  showUrgentAlert(message) {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert(message, 'warning');
    }
    this.playAttentionAnimation();
  }

  showCelebration(message) {
    if (window.app && window.app.ui) {
      window.app.ui.showAlert(message, 'success');
    }
    
    // Special celebration animation
    const mascot = document.getElementById('interactive-mascot');
    if (mascot) {
      mascot.style.animation = 'celebration 1s ease-in-out';
      setTimeout(() => {
        mascot.style.animation = '';
      }, 1000);
    }
  }

  playInteractionSound() {
    // Create a subtle click sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silently fail if Web Audio API is not supported
    }
  }

  // Method to be called when user interacts with financial data
  onFinancialUpdate() {
    // Trigger a quick positive feedback
    const mascot = document.getElementById('interactive-mascot');
    if (mascot) {
      mascot.style.transform = 'scale(1.1)';
      setTimeout(() => {
        mascot.style.transform = 'scale(1)';
      }, 200);
    }
  }
}