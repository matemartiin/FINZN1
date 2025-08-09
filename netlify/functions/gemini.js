const rateLimit = new Map();

// Rate limiting: max 30 requests per hour per IP
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimit.get(ip) || [];
  
  // Clean old requests outside the window
  const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  validRequests.push(now);
  rateLimit.set(ip, validRequests);
  return true;
}

function validateInput(prompt, config = {}) {
  // Validate prompt
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }
  
  if (prompt.length > 4000) {
    throw new Error('Prompt too long (max 4000 characters)');
  }
  
  // Check for potential binary content or dangerous patterns
  if (prompt.includes('\0') || prompt.includes('\x00')) {
    throw new Error('Invalid characters in prompt');
  }
  
  // Basic HTML/script detection
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /javascript:/i,
    /data:text\/html/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(prompt)) {
      throw new Error('Potentially dangerous content detected');
    }
  }
  
  return true;
}

function sanitizeResponse(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove any potential script tags or dangerous content
  return text
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Rate limiting
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 30 requests per hour.' 
        })
      };
    }
    
    // Parse and validate request
    const { prompt, config = {} } = JSON.parse(event.body || '{}');
    validateInput(prompt, config);
    
    // Get API key from environment (server-side only)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'AI service temporarily unavailable' 
        })
      };
    }
    
    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: config.temperature || 0.7,
            topK: config.topK || 40,
            topP: config.topP || 0.95,
            maxOutputTokens: Math.min(config.maxOutputTokens || 1500, 2048)
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
        })
      }
    );
    
    if (!response.ok) {
      console.error('Gemini API error:', response.status, response.statusText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'AI service error' 
        })
      };
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          text: 'No pude generar una respuesta. Por favor, reformula tu pregunta.' 
        })
      };
    }
    
    const text = data.candidates[0]?.content?.parts?.[0]?.text || '';
    const sanitizedText = sanitizeResponse(text);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        text: sanitizedText 
      })
    };
    
  } catch (error) {
    console.error('Gemini function error:', error);
    
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Invalid request' 
      })
    };
  }
};