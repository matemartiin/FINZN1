export class ChatManager {
  constructor() {
    this.isOpen = false;
    this.messages = [];
  }

  // Security: All API calls now go through secure server-side functions
  // No API keys are exposed in client code

  init() {
    console.log('💬 Initializing Chat Manager...');
    this.setupEventListeners();
    this.addWelcomeMessage();
  }

  setupEventListeners() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatClose = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');

    if (chatToggle) {
      chatToggle.addEventListener('click', () => this.toggleChat());
    }

    if (chatClose) {
      chatClose.addEventListener('click', () => this.closeChat());
    }

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }
  }

  openChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.classList.remove('hidden');
      this.isOpen = true;
    }
  }

  closeChat() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.classList.add('hidden');
      this.isOpen = false;
    }
  }

  addWelcomeMessage() {
    this.addMessage('¡Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?', 'bot');
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    // Create avatar section safely
    const chatAvatar = document.createElement('div');
    chatAvatar.className = 'chat-avatar';
    
    if (sender === 'user') {
      chatAvatar.innerHTML = '<div class="user-avatar"><span class="user-avatar-icon"><i class="ph ph-user"></i></span></div>';
    } else {
      chatAvatar.innerHTML = '<img src="/robot-chat.png" alt="Bot" class="chat-avatar-img" />';
    }
    
    // Create text section safely
    const chatText = document.createElement('div');
    chatText.className = `chat-text ${sender}-text`;
    chatText.textContent = text; // Safe - prevents XSS
    
    messageDiv.appendChild(chatAvatar);
    messageDiv.appendChild(chatText);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add fade-in animation
    setTimeout(() => messageDiv.classList.add('fade-in'), 100);
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('chat-input');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      
      this.hideTypingIndicator();
      this.addMessage(response, 'bot');

    } catch (error) {
      console.error('Chat error:', error);
      this.hideTypingIndicator();
      const fallbackResponse = this.getFallbackResponse(message);
      this.addMessage(fallbackResponse, 'bot');
    }
  }

  async getAIResponse(message, retryCount = 0) {
    // Use secure server-side proxy - NO API keys in client
    const maxRetries = 2;
    
    if (import.meta.env.DEV) {
      console.log('🤖 Attempting secure AI call...', { attempt: retryCount + 1, maxRetries: maxRetries + 1 });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      // Call our secure Netlify function instead of direct API
      const response = await fetch('/api/ai-chat',
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            message,
            context: 'Usuario de aplicación financiera FINZN'
          }),
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

      if (import.meta.env.DEV) {
        console.log('🤖 Secure API response status:', response.status);
      }

      const data = await response.json();

      if (data.fallback) {
        console.log('📴 Using fallback response from server');
        return data.message;
      }

      if (data.success && data.message) {
        if (import.meta.env.DEV) {
          console.log('✅ Successfully got secure AI response');
        }
        return data.message;
      }

      // If response format is unexpected, use fallback
      console.warn('🤖 Unexpected response format, using local fallback');
      return this.getFallbackResponse(message);

    } catch (error) {
      console.error('🤖 Secure API call error:', error);
      
      if (error.name === 'AbortError') {
        console.log('🕐 Request timed out, using fallback');
      }
      
      if (retryCount < maxRetries && error.name !== 'AbortError') {
        console.log(`🔄 Retrying secure API call due to error (${retryCount + 1}/${maxRetries})...`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.getAIResponse(message, retryCount + 1);
      }
      return this.getFallbackResponse(message);
    }
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    // Create typing indicator safely
    const chatAvatar = document.createElement('div');
    chatAvatar.className = 'chat-avatar';
    chatAvatar.innerHTML = '<img src="/robot-chat.png" alt="Bot" class="chat-avatar-img" />';
    
    const chatText = document.createElement('div');
    chatText.className = 'chat-text bot-text';
    
    const typingAnimation = document.createElement('div');
    typingAnimation.className = 'typing-animation';
    
    // Create typing dots
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.className = 'typing-dot';
      typingAnimation.appendChild(dot);
    }
    
    const typingText = document.createElement('div');
    typingText.className = 'typing-text';
    typingText.textContent = 'Escribiendo...';
    
    chatText.appendChild(typingAnimation);
    chatText.appendChild(typingText);
    
    typingDiv.appendChild(chatAvatar);
    typingDiv.appendChild(chatText);

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add fade-in animation
    setTimeout(() => typingDiv.classList.add('fade-in'), 100);
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('ahorro') || lowerMessage.includes('ahorrar')) {
      return "💰 Para ahorrar efectivamente, te recomiendo la regla 50/30/20: 50% gastos necesarios, 30% gastos personales, 20% ahorros. ¡Empieza poco a poco!";
    }
    
    if (lowerMessage.includes('presupuesto') || lowerMessage.includes('budget')) {
      return "📊 Un buen presupuesto incluye: ingresos, gastos fijos, gastos variables y ahorros. Registra todo durante un mes para conocer tus patrones de gasto.";
    }
    
    if (lowerMessage.includes('deuda') || lowerMessage.includes('credito')) {
      return "💳 Para manejar deudas: 1) Lista todas tus deudas, 2) Prioriza las de mayor interés, 3) Paga más del mínimo cuando puedas, 4) Evita nuevas deudas.";
    }
    
    if (lowerMessage.includes('inversion') || lowerMessage.includes('invertir')) {
      return "📈 Antes de invertir: 1) Ten un fondo de emergencia, 2) Edúcate sobre opciones de inversión, 3) Diversifica tu portafolio, 4) Invierte solo lo que puedas permitirte perder.";
    }
    
    if (lowerMessage.includes('emergencia') || lowerMessage.includes('fondo')) {
      return "🚨 Un fondo de emergencia debería cubrir 3-6 meses de gastos básicos. Guárdalo en una cuenta de fácil acceso pero separada de tus gastos diarios.";
    }
    
    if (lowerMessage.includes('gasto') || lowerMessage.includes('gastar')) {
      return "💳 Para controlar gastos: 1) Registra todo lo que gastas, 2) Categoriza tus gastos, 3) Identifica gastos innecesarios, 4) Establece límites por categoría.";
    }
    
    if (lowerMessage.includes('meta') || lowerMessage.includes('objetivo')) {
      return "🎯 Para lograr tus metas financieras: 1) Define objetivos específicos y medibles, 2) Establece plazos realistas, 3) Crea un plan de ahorro, 4) Revisa tu progreso regularmente.";
    }
    
    return "🤖 Hola! Soy tu asistente financiero. Puedo ayudarte con presupuestos, ahorros, inversiones y planificación financiera. ¿En qué tema específico te gustaría que te ayude?";
  }
  
  // Helper method for delays in retry logic
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}