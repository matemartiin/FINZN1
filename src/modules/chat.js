export class ChatManager {
  constructor() {
    this.isOpen = false;
    this.isMinimized = false;
    this.messages = [];
    this.suggestions = [
      "¿Cómo puedo ahorrar más dinero?",
      "Analiza mis gastos del mes",
      "¿Cómo organizo mi presupuesto?",
      "¿Qué inversiones me recomiendas?",
      "Ayúdame a establecer objetivos financieros"
    ];
  }

  init() {
    console.log('💬 Initializing Chat Manager...');
    this.setupEventListeners();
    this.addWelcomeMessage();
  }

  setupEventListeners() {
    const chatToggle = document.getElementById('chat-toggle');
    const chatClose = document.getElementById('chat-close');
    const chatMinimize = document.getElementById('chat-minimize');
    const chatRestore = document.getElementById('chat-restore');
    const chatForm = document.getElementById('chat-form');
    const voiceBtn = document.getElementById('chat-voice-btn');

    if (chatToggle) {
      chatToggle.addEventListener('click', () => this.toggleChat());
    }

    if (chatClose) {
      chatClose.addEventListener('click', () => this.closeChat());
    }
    
    if (chatMinimize) {
      chatMinimize.addEventListener('click', () => this.minimizeChat());
    }
    
    if (chatRestore) {
      chatRestore.addEventListener('click', () => this.restoreChat());
    }

    if (chatForm) {
      chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => this.handleVoiceInput());
    }
    
    // Suggestion buttons
    this.setupSuggestionButtons();
  }
  
  setupSuggestionButtons() {
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    suggestionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const suggestion = e.target.getAttribute('data-suggestion');
        if (suggestion) {
          this.sendSuggestion(suggestion);
        }
      });
    });
  }

  toggleChat() {
    const chatWindow = document.getElementById('chat-window');
    const chatMinimized = document.getElementById('chat-minimized');
    
    if (chatWindow) {
      if (this.isOpen || this.isMinimized) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }
  }

  openChat() {
    const chatWindow = document.getElementById('chat-window');
    const chatMinimized = document.getElementById('chat-minimized');
    const notification = document.getElementById('chat-notification');
    
    if (chatWindow) {
      chatWindow.classList.remove('hidden');
      this.isOpen = true;
      this.isMinimized = false;
    }
    
    if (chatMinimized) {
      chatMinimized.classList.add('hidden');
    }
    
    if (notification) {
      notification.style.display = 'none';
    }
  }

  closeChat() {
    const chatWindow = document.getElementById('chat-window');
    const chatMinimized = document.getElementById('chat-minimized');
    
    if (chatWindow) {
      chatWindow.classList.add('hidden');
      this.isOpen = false;
      this.isMinimized = false;
    }
    
    if (chatMinimized) {
      chatMinimized.classList.add('hidden');
    }
  }
  
  minimizeChat() {
    const chatWindow = document.getElementById('chat-window');
    const chatMinimized = document.getElementById('chat-minimized');
    
    if (chatWindow) {
      chatWindow.classList.add('hidden');
      this.isOpen = false;
      this.isMinimized = true;
    }
    
    if (chatMinimized) {
      chatMinimized.classList.remove('hidden');
    }
  }
  
  restoreChat() {
    this.openChat();
  }
  
  showNotification() {
    const notification = document.getElementById('chat-notification');
    if (notification && !this.isOpen && !this.isMinimized) {
      notification.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (notification) {
          notification.style.display = 'none';
        }
      }, 5000);
    }
  }

  addWelcomeMessage() {
    const welcomeMessages = [
      '¡Hola! Soy tu asistente financiero personal. ¿En qué puedo ayudarte hoy?',
      'Puedo ayudarte con análisis de gastos, consejos de ahorro, planificación financiera y mucho más.',
      'También puedes usar las sugerencias rápidas de abajo para comenzar. 👇'
    ];
    
    welcomeMessages.forEach((message, index) => {
      setTimeout(() => {
        this.addMessage(message, 'bot');
      }, index * 1000);
    });
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    messageDiv.innerHTML = `
      <div class="chat-avatar">
        ${sender === 'user' ? 
          '<div class="user-avatar"><span class="user-avatar-icon">👤</span></div>' : 
          '<img src="/robot-chat.png" alt="Bot" class="chat-avatar-img" />'
        }
      </div>
      <div class="chat-text ${sender}-text">${text}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add fade-in animation
    setTimeout(() => messageDiv.classList.add('fade-in'), 100);
    
    // Show notification if chat is closed
    if (sender === 'bot' && !this.isOpen && !this.isMinimized) {
      this.showNotification();
    }
  }
  
  sendSuggestion(suggestion) {
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = suggestion;
      // Trigger form submission
      const form = document.getElementById('chat-form');
      if (form) {
        form.dispatchEvent(new Event('submit'));
      }
    }
  }
  
  handleVoiceInput() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      const voiceBtn = document.getElementById('chat-voice-btn');
      const input = document.getElementById('chat-input');
      
      recognition.onstart = () => {
        if (voiceBtn) voiceBtn.textContent = '🔴';
        if (input) input.placeholder = 'Escuchando...';
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (input) {
          input.value = transcript;
        }
      };
      
      recognition.onend = () => {
        if (voiceBtn) voiceBtn.textContent = '🎤';
        if (input) input.placeholder = 'Escribe tu pregunta...';
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (voiceBtn) voiceBtn.textContent = '🎤';
        if (input) input.placeholder = 'Error en reconocimiento de voz';
      };
      
      recognition.start();
    } else {
      this.addMessage('Lo siento, tu navegador no soporta reconocimiento de voz.', 'bot');
    }
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
    
    // Hide suggestions after first message
    const suggestions = document.getElementById('chat-suggestions');
    if (suggestions && this.messages.length === 0) {
      suggestions.style.display = 'none';
    }

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      
      this.hideTypingIndicator();
      this.addMessage(response, 'bot');
      
      // Update chat status
      this.updateChatStatus('En línea');

    } catch (error) {
      console.error('Chat error:', error);
      this.hideTypingIndicator();
      const fallbackResponse = this.getFallbackResponse(message);
      this.addMessage(fallbackResponse, 'bot');
      this.updateChatStatus('Error de conexión');
    }
  }
  
  updateChatStatus(status) {
    const statusElement = document.getElementById('chat-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  async getAIResponse(message) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    console.log('🤖 Attempting Gemini API call...');
    console.log('🔑 API Key check:', apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'Missing');

    // If no API key, use fallback responses
    if (!apiKey) {
      console.log('⚠️ No API key found, using fallback responses');
      return this.getFallbackResponse(message);
    }
    
    // Update status
    this.updateChatStatus('Pensando...');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Eres FINZN, un asistente financiero amigable y experto. Responde en español de manera clara y útil. Máximo 200 palabras. 

Contexto del usuario: Tienes acceso a información sobre sus finanzas personales, gastos, ingresos, objetivos de ahorro y clientes (si es un profesional).

Si la pregunta no es sobre finanzas, redirige amablemente hacia temas financieros. Siempre sé útil, motivador y ofrece consejos prácticos.

Pregunta del usuario: ${message}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 300,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
        }
      );

      if (!response.ok) {
        let errorMessage = "Error en el servicio de IA";
        
        if (response.status === 429) {
          errorMessage = "¡Muchas consultas! Esperá un minuto y volvé a intentarlo 😊";
        } else if (response.status === 403) {
          errorMessage = "Problema con la API key. Contactá al administrador.";
        } else if (response.status === 400) {
          errorMessage = "Tu mensaje no pudo ser procesado. Intentá reformularlo.";
        }
        
        console.error("❌ Error de Gemini API:", response.status, response.statusText);
        return errorMessage;
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');

      if (!data.candidates || data.candidates.length === 0) {
        return "No pude generar una respuesta. ¿Podrías reformular tu pregunta?";
      }

      const reply = data.candidates[0]?.content?.parts?.[0]?.text || 
                    "No tengo una respuesta clara, ¿podés reformularlo?";

      return reply.trim();

    } catch (error) {
      console.error("❌ Error en la API de Gemini:", error);
      
      // Fallback response
      return this.getFallbackResponse(message);
    }
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
      <div class="chat-avatar">
        <img src="/robot-chat.png" alt="Bot" class="chat-avatar-img" />
      </div>
      <div class="chat-text bot-text">
        <div class="typing-animation">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
        <div class="typing-text">Escribiendo...</div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Client management responses
    if (lowerMessage.includes('cliente') || lowerMessage.includes('customer')) {
      return "👥 Para gestionar tus clientes, ve a la sección 'Clientes' en el menú. Allí puedes agregar nuevos clientes, organizarlos por rango etario y llevar un registro completo de su información.";
    }
    
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
    
    if (lowerMessage.includes('reporte') || lowerMessage.includes('análisis')) {
      return "📊 Puedes generar reportes detallados con IA en la sección 'Reportes'. Te ayudo a analizar tus patrones de gasto, identificar oportunidades de ahorro y optimizar tu presupuesto.";
    }
    
    if (lowerMessage.includes('calendario') || lowerMessage.includes('recordatorio')) {
      return "📅 Usa el calendario financiero para programar pagos, recordatorios de cuotas y eventos importantes. Puedes sincronizarlo con Google Calendar para recibir notificaciones.";
    }
    
    return "🤖 Hola! Soy tu asistente financiero. Puedo ayudarte con presupuestos, ahorros, inversiones y planificación financiera. ¿En qué tema específico te gustaría que te ayude?";
  }
}