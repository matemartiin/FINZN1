export const handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { message } = JSON.parse(event.body);

    if (!message || message.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          reply: "Por favor, envía un mensaje válido." 
        }),
      };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // If no API key, use fallback responses
    if (!GEMINI_API_KEY) {
      const fallbackResponse = getFallbackResponse(message);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ reply: fallbackResponse }),
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ reply: errorMessage }),
      };
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          reply: "No pude generar una respuesta. ¿Podrías reformular tu pregunta?" 
        }),
      };
    }

    const reply = data.candidates[0]?.content?.parts?.[0]?.text || 
                  "No tengo una respuesta clara, ¿podés reformularlo?";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: reply.trim() }),
    };

  } catch (error) {
    console.error('Chat error:', error);
    
    const fallbackResponse = getFallbackResponse(message || '');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: fallbackResponse }),
    };
  }
};

function getFallbackResponse(message) {
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
  
  return "🤖 Hola! Soy tu asistente financiero. Puedo ayudarte con presupuestos, ahorros, inversiones y planificación financiera. ¿En qué tema específico te gustaría que te ayude?";
}