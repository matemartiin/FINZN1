export class MascotManager {
  constructor() {
    this.mascot = null;
    this.bubble = null;
    this.message = null;
    this.isVisible = false;
    this.currentTimeout = null;
    this.lastActivity = Date.now();
    this.checkInterval = null;
  }

  init() {
    console.log('🐾 Initializing Mascot Manager...');
    this.mascot = document.getElementById('mascot-avatar');
    this.bubble = document.getElementById('mascot-bubble');
    this.message = document.getElementById('mascot-message');
    
    if (this.mascot) {
      this.setupEventListeners();
      this.startActivityMonitoring();
      this.showWelcomeMessage();
    }
  }

  setupEventListeners() {
    // Click on mascot to show/hide chat
    if (this.mascot) {
      this.mascot.addEventListener('click', () => {
        if (window.app && window.app.chat) {
          window.app.chat.toggleChat();
        }
      });
    }

    // Track user activity
    document.addEventListener('click', () => this.updateActivity());
    document.addEventListener('keypress', () => this.updateActivity());
    document.addEventListener('scroll', () => this.updateActivity());
  }

  updateActivity() {
    this.lastActivity = Date.now();
  }

  startActivityMonitoring() {
    // Check every 30 seconds for inactivity
    this.checkInterval = setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivity;
      const inactiveMinutes = inactiveTime / (1000 * 60);
      
      // Show message after 5 minutes of inactivity
      if (inactiveMinutes >= 5 && !this.isVisible) {
        this.showMessage("¡Hola! ¿Necesitas ayuda con algo? 🤔", 'info', 8000);
      }
    }, 30000);
  }

  showWelcomeMessage() {
    setTimeout(() => {
      this.showMessage("¡Hola! Soy tu asistente financiero. Haz clic en mí para chatear 💬", 'welcome', 5000);
    }, 2000);
  }

  showMessage(text, type = 'info', duration = 4000) {
    if (!this.bubble || !this.message) return;

    // Clear existing timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }

    // Set message and show bubble
    this.message.textContent = text;
    this.bubble.className = `mascot-bubble ${type}`;
    this.bubble.classList.remove('hidden');
    this.isVisible = true;

    // Add bounce animation to mascot
    if (this.mascot) {
      this.mascot.classList.add('bounce');
      setTimeout(() => {
        this.mascot.classList.remove('bounce');
      }, 600);
    }

    // Hide after duration
    this.currentTimeout = setTimeout(() => {
      this.hideMessage();
    }, duration);
  }

  hideMessage() {
    if (this.bubble) {
      this.bubble.classList.add('hidden');
      this.isVisible = false;
    }
  }

  // Alert methods for different scenarios
  alertSpendingLimit(category, percentage) {
    const messages = [
      `⚠️ Te estás acercando al límite de ${category} (${percentage}%)`,
      `🚨 ¡Cuidado! Ya gastaste ${percentage}% en ${category}`,
      `💡 Considera reducir gastos en ${category} este mes`
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.showMessage(message, 'warning', 6000);
  }

  congratulateGoal(goalName) {
    const messages = [
      `🎉 ¡Felicitaciones! Completaste tu objetivo: ${goalName}`,
      `🏆 ¡Increíble! Lograste tu meta de ${goalName}`,
      `✨ ¡Excelente trabajo! ${goalName} completado`
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.showMessage(message, 'success', 7000);
  }

  remindActivity() {
    const messages = [
      "📊 ¿Registraste tus gastos de hoy?",
      "💰 Recuerda anotar tus movimientos financieros",
      "📝 ¡No olvides actualizar tu presupuesto!",
      "🎯 ¿Cómo van tus objetivos de ahorro?"
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.showMessage(message, 'reminder', 6000);
  }

  celebrateNewContact() {
    this.showMessage("📇 ¡Nuevo contacto agregado! Mantén organizadas tus relaciones financieras", 'success', 4000);
  }

  suggestSavings(amount) {
    this.showMessage(`💡 Tienes ${this.formatCurrency(amount)} disponible. ¿Qué tal si ahorras parte?`, 'suggestion', 6000);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
  }
}