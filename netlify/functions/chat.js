export default async (request, context) => {
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message } = await request.json();

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ 
        reply: "Por favor, envía un mensaje válido." 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GEMINI_API_KEY = Netlify.env.get('VITE_GEMINI_API_KEY');

    // If no API key, use fallback responses
    if (!GEMINI_API_KEY) {
      const fallbackResponse = getFallbackResponse(message);
      return new Response(JSON.stringify({ reply: fallbackResponse }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const geminiResponse = await fetch(
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

      if (!geminiResponse.ok) {
        let errorMessage = "Error en el servicio de IA";
        
        if (geminiResponse.status === 429) {
          errorMessage = "¡Muchas consultas! Esperá un minuto y volvé a intentarlo 😊";
        } else if (geminiResponse.status === 403) {
          errorMessage = "Problema con la API key. Contactá al administrador.";
        } else if (geminiResponse.status === 400) {
          errorMessage = "Tu mensaje no pudo ser procesado. Intentá reformularlo.";
        }
        
        console.error("❌ Error de Gemini API:", geminiResponse.status, geminiResponse.statusText);
        return new Response(JSON.stringify({ reply: errorMessage }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await geminiResponse.json();

      if (!data.candidates || data.candidates.length === 0) {
        return new Response(JSON.stringify({ 
          reply: "No pude generar una respuesta. ¿Podrías reformular tu pregunta?" 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const reply = data.candidates[0]?.content?.parts?.[0]?.text || 
                    "No tengo una respuesta clara, ¿podés reformularlo?";

      return new Response(JSON.stringify({ reply: reply.trim() }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      console.error("❌ Error en la API de Gemini:", err);
      
      // Fallback response
      const fallbackResponse = getFallbackResponse(message);
      return new Response(JSON.stringify({ reply: fallbackResponse }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('❌ Error processing request:', error);
    return new Response(JSON.stringify({ 
      reply: "Lo siento, hubo un error procesando tu mensaje. Intenta de nuevo." 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

// Función para respuestas predefinidas cuando no hay API key
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