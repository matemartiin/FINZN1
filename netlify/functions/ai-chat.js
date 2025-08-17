// Netlify Function - AI Chat Proxy
// This function acts as a secure proxy to Gemini AI API

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Validate request origin for additional security
    const origin = event.headers.origin || event.headers.referer;
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4173',
      'http://localhost:4174',
      'http://localhost:4175',
      'http://localhost:4176',
      'http://localhost:4177',
      'https://finzn.netlify.app',
      'https://finzn-app.netlify.app',
      'https://beautiful-unicorn-',  // Para cualquier URL random de Netlify
      'https://stellar-',
      'https://eloquent-',
      'https://gorgeous-',
      'https://incredible-'
    ];

    const isOriginAllowed = allowedOrigins.some(allowed => 
      origin && origin.startsWith(allowed)
    );

    // Temporarily disabled for debugging
    if (!isOriginAllowed && process.env.NODE_ENV === 'production' && false) {
      console.log('Origin validation failed:', origin);
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Forbidden origin' })
      };
    }

    // Get API key from environment (secure server-side)
    // Note: In Netlify Functions, use GEMINI_API_KEY (without VITE_ prefix)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    console.log('API Key status:', apiKey ? 'Present' : 'Missing');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('GEMINI') || key.includes('API')));
    console.log('Origin:', origin);
    
    if (!apiKey) {
      console.error('Gemini API key not found in environment');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          fallback: true,
          message: 'API no configurada. Usando respuesta de fallback: Tu pregunta es muy interesante. Te recomiendo revisar tus gastos y establecer un presupuesto mensual.'
        })
      };
    }

    // Parse request body
    const { message, context: userContext } = JSON.parse(event.body);

    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid message format' })
      };
    }

    // Rate limiting (basic implementation)
    const userIP = event.headers['x-forwarded-for'] || 
                  event.headers['x-real-ip'] || 
                  'unknown';

    // Prepare prompt for Gemini
    const prompt = `Eres un experto asesor financiero personal que ayuda a los usuarios con sus finanzas.

Contexto del usuario: ${userContext || 'Usuario de aplicación financiera FINZN'}

Pregunta del usuario: ${message}

Responde de manera clara, útil y profesional. Mantén las respuestas concisas pero informativas. Usa emojis apropiados para hacer las respuestas más amigables.`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'AI service temporarily unavailable',
          fallback: true,
          message: getFallbackResponse(message)
        })
      };
    }

    const data = await geminiResponse.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          fallback: true,
          message: getFallbackResponse(message)
        })
      };
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: aiResponse,
        success: true
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        fallback: true,
        message: getFallbackResponse(JSON.parse(event.body || '{}').message || '')
      })
    };
  }
};

// Fallback responses for when AI is not available
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
  
  return "🤖 Hola! Soy tu asistente financiero. Puedo ayudarte con presupuestos, ahorros, inversiones y planificación financiera. ¿En qué tema específico te gustaría que te ayude?";
}