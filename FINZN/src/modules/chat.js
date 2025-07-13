export class ChatManager {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isTyping = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  init() {
    const toggle = document.getElementById('chat-toggle');
    const window = document.getElementById('chat-window');
    const close = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    if (!toggle || !window || !close || !form || !input) {
      console.error('Chat elements not found');
      return;
    }

    toggle.addEventListener('click', () => this.toggle());
    close.addEventListener('click', () => this.close());
    form.addEventListener('submit', (e) => this.sendMessage(e));

    // Add keyboard shortcuts
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });

    // Add welcome message
    this.addMessage('¡Hola! 👋 Soy tu asistente financiero FINZN. Puedo ayudarte con:', 'assistant');
    this.addMessage('💰 Consejos de ahorro\n📊 Presupuestos\n💳 Manejo de deudas\n📈 Inversiones básicas\n🚨 Fondos de emergencia', 'assistant');
    this.addMessage('¿En qué puedo ayudarte hoy?', 'assistant');
  }

  toggle() {
    const window = document.getElementById('chat-window');
    if (!window) return;

    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      window.classList.remove('hidden');
      document.getElementById('chat-input')?.focus();
      this.scrollToBottom();
    } else {
      window.classList.add('hidden');
    }
  }

  close() {
    this.isOpen = false;
    const window = document.getElementById('chat-window');
    if (window) {
      window.classList.add('hidden');
    }
  }

  async sendMessage(e) {
    e.preventDefault();
    
    if (this.isTyping) return;

    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    input.value = '';
    input.disabled = true;

    // Show typing indicator
    this.addTypingIndicator();
    this.isTyping = true;

    try {
      const response = await this.fetchWithRetry('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      if (data.reply) {
        this.addMessage(data.reply, 'assistant');
        this.retryCount = 0; // Reset retry count on success
      } else {
        this.addMessage('Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?', 'assistant');
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.removeTypingIndicator();
      
      let errorMessage = 'Lo siento, hay un problema de conexión.';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '🔌 Sin conexión al servidor. Verifica tu conexión a internet.';
      } else if (error.message.includes('429')) {
        errorMessage = '⏰ Demasiadas consultas. Espera un momento antes de intentar de nuevo.';
      } else if (error.message.includes('500')) {
        errorMessage = '🤖 El asistente está teniendo problemas. Intenta de nuevo en unos minutos.';
      }
      
      this.addMessage(errorMessage, 'assistant');
      
      // Offer retry option
      if (this.retryCount < this.maxRetries) {
        setTimeout(() => {
          this.addMessage('¿Quieres que intente responder de nuevo? Escribe tu pregunta otra vez.', 'assistant');
        }, 2000);
      }
    } finally {
      this.isTyping = false;
      input.disabled = false;
      input.focus();
    }
  }

  async fetchWithRetry(url, options, retries = 3) {
    const baseUrl = window.location.origin.includes('localhost') 
      ? 'http://localhost:3001' 
      : window.location.origin;
    
    const fullUrl = `${baseUrl}${url}`;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(fullUrl, {
          ...options,
          timeout: 30000 // 30 second timeout
        });
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const message = document.createElement('div');
    message.className = `chat-message ${sender}`;

    if (sender === 'assistant') {
      message.innerHTML = `
        <div class="chat-avatar">
          <img src="/robot-chat.png" alt="FINZN" class="chat-avatar-img" />
        </div>
        <div class="chat-text">${this.formatMessage(text)}</div>
      `;
    } else {
      message.innerHTML = `
        <div class="chat-text user-text">${this.escapeHtml(text)}</div>
        <div class="chat-avatar user-avatar">
          <div class="user-avatar-icon">👤</div>
        </div>
      `;
    }

    container.appendChild(message);
    this.scrollToBottom();

    // Add animation
    setTimeout(() => {
      message.classList.add('fade-in');
    }, 50);

    this.messages.push({ text, sender, timestamp: new Date() });
  }

  formatMessage(text) {
    // Convert line breaks to HTML
    let formatted = this.escapeHtml(text).replace(/\n/g, '<br>');
    
    // Make emojis larger
    formatted = formatted.replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu, 
      '<span class="emoji">$1</span>');
    
    // Make numbers with currency symbols stand out
    formatted = formatted.replace(/(\$[\d,]+)/g, '<strong class="currency">$1</strong>');
    
    // Make percentages stand out
    formatted = formatted.replace(/(\d+%)/g, '<strong class="percentage">$1</strong>');
    
    return formatted;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  addTypingIndicator() {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const indicator = document.createElement('div');
    indicator.className = 'chat-message assistant typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
      <div class="chat-avatar">
        <img src="/robot-chat.png" alt="FINZN" class="chat-avatar-img" />
      </div>
      <div class="chat-text">
        <div class="typing-animation">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
        <span class="typing-text">Pensando...</span>
      </div>
    `;
    
    container.appendChild(indicator);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }

  // Method to clear chat history
  clearHistory() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.innerHTML = '';
    }
    this.messages = [];
    
    // Re-add welcome message
    this.addMessage('¡Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte?', 'assistant');
  }

  // Method to get chat history
  getHistory() {
    return this.messages;
  }

  // Method to export chat
  exportChat() {
    const chatData = {
      messages: this.messages,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finzn-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}