// Netlify Function - AI Reports Proxy
// This function generates AI-powered financial reports

exports.handler = async (event, context) => {
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
    // Validate origin
    const origin = event.headers.origin || event.headers.referer;
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4173',
      'http://localhost:4174', 
      'http://localhost:4175',
      'http://localhost:4176',
      'http://localhost:4177',
      'https://finzn.netlify.app',
      'https://finzn-app.netlify.app'
    ];

    const isOriginAllowed = allowedOrigins.some(allowed => 
      origin && origin.startsWith(allowed)
    );

    // Temporarily disabled for debugging
    if (!isOriginAllowed && process.env.NODE_ENV === 'production' && false) {
      console.log('Origin validation failed:', origin);
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Forbidden origin' })
      };
    }

    // Note: In Netlify Functions, use GEMINI_API_KEY (without VITE_ prefix)
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    console.log('API Key status:', apiKey ? 'Present' : 'Missing');
    console.log('Origin:', origin);
    
    if (!apiKey) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          fallback: true,
          report: generateFallbackReport(JSON.parse(event.body))
        })
      };
    }

    const { data, focus, questions } = JSON.parse(event.body);

    if (!data) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing financial data' })
      };
    }

    // Build comprehensive prompt
    const prompt = buildAIPrompt(data, focus, questions);

    // Call Gemini API with current model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          fallback: true,
          report: generateFallbackReport({ data, focus, questions })
        })
      };
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          fallback: true,
          report: generateFallbackReport({ data, focus, questions })
        })
      };
    }

    const aiReport = result.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        report: aiReport,
        success: true
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        fallback: true,
        report: generateFallbackReport(JSON.parse(event.body || '{}'))
      })
    };
  }
};

function buildAIPrompt(data, focus, questions) {
  const balance = data.totalIncome - data.totalExpenses;
  const savingsRate = data.totalIncome > 0 ? ((balance / data.totalIncome) * 100).toFixed(1) : 0;
  const topCategories = Object.entries(data.categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return `Eres un experto asesor financiero personal. Analiza los siguientes datos financieros y genera un informe completo y personalizado en español.

DATOS FINANCIEROS:
- Período: ${data.period}
- Ingresos totales: $${data.totalIncome.toLocaleString()}
- Gastos totales: $${data.totalExpenses.toLocaleString()}
- Balance: $${balance.toLocaleString()}
- Tasa de ahorro: ${savingsRate}%

GASTOS POR CATEGORÍA:
${topCategories.map(([cat, amount]) => `- ${cat}: $${amount.toLocaleString()}`).join('\n')}

ENFOQUE DEL INFORME: ${focus || 'general'}

PREGUNTAS ESPECÍFICAS: ${questions || 'Análisis general'}

INSTRUCCIONES:
1. Genera un informe profesional en formato HTML con las siguientes secciones:
   - Resumen ejecutivo
   - Análisis de ingresos y gastos
   - Recomendaciones específicas
   - Plan de acción

2. Usa HTML semántico con clases CSS para styling:
   - <h3>, <h4> para títulos
   - <div class="metric"> para métricas importantes
   - <div class="recommendation"> para recomendaciones
   - <strong> para destacar puntos clave

3. Incluye insights específicos basados en los datos
4. Proporciona recomendaciones actionables
5. Mantén un tono profesional pero accesible

Genera el informe completo en HTML:`;
}

function generateFallbackReport({ data, focus, questions }) {
  if (!data) {
    return `
      <div class="report-header">
        <h3>📊 Informe Financiero - Modo Offline</h3>
        <p>El servicio de IA no está disponible actualmente. Aquí tienes un análisis básico de tus finanzas.</p>
      </div>
      
      <h4>💡 Recomendaciones Generales</h4>
      <div class="recommendation">
        <strong>Regla 50/30/20:</strong> Destina 50% a necesidades, 30% a deseos y 20% a ahorros.
      </div>
      <div class="recommendation">
        <strong>Fondo de emergencia:</strong> Acumula 3-6 meses de gastos básicos.
      </div>
      <div class="recommendation">
        <strong>Revisa gastos:</strong> Identifica gastos innecesarios que puedas eliminar.
      </div>
    `;
  }

  const balance = data.totalIncome - data.totalExpenses;
  const savingsRate = data.totalIncome > 0 ? ((balance / data.totalIncome) * 100).toFixed(1) : 0;

  return `
    <div class="report-header">
      <h3>📊 Informe Financiero Básico</h3>
      <div class="metric">
        <span class="metric-label">Balance:</span>
        <span class="metric-value ${balance >= 0 ? 'positive' : 'negative'}">$${balance.toLocaleString()}</span>
      </div>
      <div class="metric">
        <span class="metric-label">Tasa de Ahorro:</span>
        <span class="metric-value">${savingsRate}%</span>
      </div>
    </div>

    <h4>💰 Análisis de Balance</h4>
    <p>Tu balance actual es de <strong>$${balance.toLocaleString()}</strong> con una tasa de ahorro del <strong>${savingsRate}%</strong>.</p>
    
    ${savingsRate < 10 ? 
      '<div class="recommendation urgent"><strong>Prioridad:</strong> Tu tasa de ahorro está por debajo del 10%. Considera reducir gastos no esenciales.</div>' :
      '<div class="recommendation"><strong>¡Bien!</strong> Tienes una tasa de ahorro saludable. Mantén este hábito.</div>'
    }

    <h4>📈 Recomendaciones</h4>
    <div class="recommendation">
      <strong>Automatiza tus ahorros:</strong> Configura transferencias automáticas el día que cobras.
    </div>
    <div class="recommendation">
      <strong>Revisa gastos mensuales:</strong> Identifica suscripciones o servicios que no uses frecuentemente.
    </div>
  `;
}