// Netlify Function - AI Budget Recommendations Proxy

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
          recommendations: getFallbackBudgetRecommendations(JSON.parse(event.body))
        })
      };
    }

    const userData = JSON.parse(event.body);

    if (!userData || !userData.totalIncome) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing user financial data' })
      };
    }

    // Build Gemini prompt for budget recommendations
    const prompt = buildBudgetPrompt(userData);

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
            maxOutputTokens: 1024,
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
          recommendations: getFallbackBudgetRecommendations(userData)
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
          recommendations: getFallbackBudgetRecommendations(userData)
        })
      };
    }

    const aiRecommendations = result.candidates[0].content.parts[0].text;

    // Parse AI response and structure it
    const recommendations = parseAIBudgetResponse(aiRecommendations, userData);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        recommendations,
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
        recommendations: getFallbackBudgetRecommendations(JSON.parse(event.body || '{}'))
      })
    };
  }
};

function buildBudgetPrompt(userData) {
  const { totalIncome, totalExpenses, categories, goals } = userData;
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

  return `Como experto en finanzas personales, analiza los siguientes datos y proporciona recomendaciones específicas de presupuesto:

SITUACIÓN FINANCIERA:
- Ingresos mensuales: $${totalIncome.toLocaleString()}
- Gastos actuales: $${totalExpenses.toLocaleString()}
- Balance: $${balance.toLocaleString()}
- Tasa de ahorro actual: ${savingsRate}%

GASTOS POR CATEGORÍA:
${Object.entries(categories || {}).map(([cat, amount]) => 
  `- ${cat}: $${amount.toLocaleString()} (${((amount / totalExpenses) * 100).toFixed(1)}%)`
).join('\n')}

OBJETIVOS FINANCIEROS:
${goals && goals.length > 0 ? 
  goals.map(goal => `- ${goal.name}: $${goal.target_amount.toLocaleString()}`).join('\n') :
  'Sin objetivos específicos definidos'
}

Proporciona recomendaciones específicas en formato JSON con esta estructura:
{
  "overallAssessment": "Evaluación general de la situación financiera",
  "budgetRecommendations": [
    {
      "category": "Nombre de categoría",
      "currentAmount": monto_actual,
      "recommendedAmount": monto_recomendado,
      "reasoning": "Justificación de la recomendación",
      "priority": "high|medium|low"
    }
  ],
  "savingsGoal": "Objetivo de ahorro recomendado",
  "actionItems": ["Acción específica 1", "Acción específica 2"]
}

Responde únicamente con el JSON válido:`;
}

function parseAIBudgetResponse(aiResponse, userData) {
  try {
    // Try to parse as JSON first
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('Could not parse AI response as JSON, using fallback');
  }
  
  // Fallback if JSON parsing fails
  return getFallbackBudgetRecommendations(userData);
}

function getFallbackBudgetRecommendations(userData) {
  const { totalIncome = 0, totalExpenses = 0, categories = {} } = userData || {};
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;

  const budgetRecommendations = [];
  
  // Analyze each category and provide recommendations
  Object.entries(categories).forEach(([category, amount]) => {
    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
    
    let recommendedAmount = amount;
    let reasoning = "Mantén el gasto actual";
    let priority = "low";

    if (category === 'Comida' && percentage > 15) {
      recommendedAmount = totalIncome * 0.15;
      reasoning = "Se recomienda no gastar más del 15% de ingresos en comida";
      priority = "medium";
    } else if (category === 'Transporte' && percentage > 15) {
      recommendedAmount = totalIncome * 0.15;
      reasoning = "El transporte no debería exceder el 15% de tus ingresos";
      priority = "medium";
    } else if (category === 'Ocio' && percentage > 10) {
      recommendedAmount = totalIncome * 0.10;
      reasoning = "Limita el entretenimiento al 10% para mejorar el ahorro";
      priority = "medium";
    }

    budgetRecommendations.push({
      category,
      currentAmount: amount,
      recommendedAmount: Math.round(recommendedAmount),
      reasoning,
      priority
    });
  });

  return {
    overallAssessment: savingsRate < 10 ? 
      "Tu tasa de ahorro está por debajo del objetivo. Considera optimizar gastos." :
      "Tienes una situación financiera saludable. Mantén estos hábitos.",
    budgetRecommendations,
    savingsGoal: `Objetivo recomendado: ahorrar 20% de ingresos ($${Math.round(totalIncome * 0.20).toLocaleString()}/mes)`,
    actionItems: [
      "Revisa gastos no esenciales mensualmente",
      "Automatiza transferencias a ahorro",
      "Establece límites de gasto por categoría"
    ]
  };
}