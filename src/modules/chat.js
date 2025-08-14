export class ChatManager {
  constructor() {
    this.isOpen = false;
    this.messages = [];
  }

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
    
    messageDiv.innerHTML = `
      <div class="chat-avatar">
        ${sender === 'user' ? 
          '<div class="user-avatar"><span class="user-avatar-icon"><i class="ph ph-user"></i></span></div>' : 
          '<img src="/robot-chat.png" alt="Bot" class="chat-avatar-img" />'
        }
      </div>
      <div class="chat-text ${sender}-text">${text}</div>
    `;

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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const maxRetries = 2;
    
    if (import.meta.env.DEV) {
      console.log('🤖 Attempting Gemini API call...', { attempt: retryCount + 1, maxRetries: maxRetries + 1 });
      console.log('🔑 API Key check:', apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'Missing');
    }

    // If no API key, use fallback responses
    if (!apiKey) {
      console.log('⚠️ No API key found, using fallback responses');
      return this.getFallbackResponse(message);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
                    text: `Eres FINZN, un asistente financiero amigable y experto. Responde en español de manera clara y útil. Máximo 150 palabras. Si la pregunta no es sobre finanzas, redirige amablemente hacia temas financieros.

Pregunta del usuario: ${message}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 200,
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
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Error en el servicio de IA";
        
        if (response.status === 429) {
          errorMessage = "¡Muchas consultas! Esperá un minuto y volvé a intentarlo 😊";
        } else if (response.status === 403) {
          errorMessage = "Problema con la API key. Contactá al administrador.";
        } else if (response.status === 400) {
          errorMessage = "Tu mensaje no pudo ser procesado. Intentá reformularlo.";
        } else if (response.status === 503) {
          // Service unavailable - retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.log(`⚠️ Gemini API 503 error, retrying in ${(retryCount + 1) * 2} seconds... (attempt ${retryCount + 2}/${maxRetries + 1})`);
            await this.delay((retryCount + 1) * 2000); // Progressive delay: 2s, 4s
            return this.getAIResponse(message, retryCount + 1);
          }
          errorMessage = "El servicio de IA está temporalmente no disponible. Intentá en unos minutos.";
        } else if (response.status >= 500) {
          // Other server errors
          if (retryCount < maxRetries) {
            console.log(`⚠️ Gemini API server error ${response.status}, retrying... (attempt ${retryCount + 2}/${maxRetries + 1})`);
            await this.delay(1000 * (retryCount + 1)); // Progressive delay
            return this.getAIResponse(message, retryCount + 1);
          }
          errorMessage = "Error del servidor. Por favor intentá más tarde.";
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
      
      // Handle network errors and timeouts
      if (error.name === 'AbortError') {
        if (retryCount < maxRetries) {
          console.log(`⚠️ Request timeout, retrying... (attempt ${retryCount + 2}/${maxRetries + 1})`);
          await this.delay(1000 * (retryCount + 1));
          return this.getAIResponse(message, retryCount + 1);
        }
        return "La consulta tomó demasiado tiempo. Intentá con un mensaje más corto.";
      }
      
      if (error.message.includes('Failed to fetch') && retryCount < maxRetries) {
        console.log(`⚠️ Network error, retrying... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        await this.delay(2000 * (retryCount + 1));
        return this.getAIResponse(message, retryCount + 1);
      }
      
      // Fallback response for other errors
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