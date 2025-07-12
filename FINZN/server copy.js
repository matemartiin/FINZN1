import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = "usuarios.json";

// Verificamos si está presente la API Key de Gemini
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Falta la variable GEMINI_API_KEY en el archivo .env");
  console.log("💡 Crea un archivo .env con: GEMINI_API_KEY=tu_api_key_aqui");
  console.log("🔗 Obtén tu API key en: https://makersuite.google.com/app/apikey");
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ----------- FUNCIONES AUXILIARES PARA USUARIOS -----------
// Cargar usuarios desde archivo o crear vacío
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error loading users:', error);
    return {};
  }
}

// Guardar usuarios
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// ----------- ENDPOINT DE REGISTRO -----------
app.post("/api/register", (req, res) => {
  const { user, pass } = req.body;
  if (!user || !pass) {
    return res.json({ ok: false, error: "Ingresá usuario y contraseña." });
  }
  const users = loadUsers();
  if (users[user]) {
    return res.json({ ok: false, error: "Ese usuario ya existe." });
  }
  users[user] = { pass }; // En producción, usá un hash, aquí es solo a modo educativo
  saveUsers(users);
  res.json({ ok: true });
});

// ----------- ENDPOINT DE LOGIN -----------
app.post("/api/login", (req, res) => {
  const { user, pass } = req.body;
  const users = loadUsers();
  if (users[user] && users[user].pass === pass) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false, error: "Usuario o contraseña incorrectos." });
  }
});

// ----------- ENDPOINT DE CHAT (Gemini) -----------
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ 
      reply: "Por favor, envía un mensaje válido." 
    });
  }

  // Si no hay API key, usar respuestas predefinidas
  if (!GEMINI_API_KEY) {
    const fallbackResponse = getFallbackResponse(message);
    return res.json({ reply: fallbackResponse });
  }

  try {
    const geminiRes = await fetch(
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

    if (!geminiRes.ok) {
      let errorMessage = "Error en el servicio de IA";
      
      if (geminiRes.status === 429) {
        errorMessage = "¡Muchas consultas! Esperá un minuto y volvé a intentarlo 😊";
      } else if (geminiRes.status === 403) {
        errorMessage = "Problema con la API key. Contactá al administrador.";
      } else if (geminiRes.status === 400) {
        errorMessage = "Tu mensaje no pudo ser procesado. Intentá reformularlo.";
      }
      
      console.error("❌ Error de Gemini API:", geminiRes.status, geminiRes.statusText);
      return res.status(500).json({ reply: errorMessage });
    }

    const data = await geminiRes.json();

    if (!data.candidates || data.candidates.length === 0) {
      return res.json({ 
        reply: "No pude generar una respuesta. ¿Podrías reformular tu pregunta?" 
      });
    }

    const reply = data.candidates[0]?.content?.parts?.[0]?.text || 
                  "No tengo una respuesta clara, ¿podés reformularlo?";

    res.json({ reply: reply.trim() });

  } catch (err) {
    console.error("❌ Error en la API de Gemini:", err);
    
    // Fallback response
    const fallbackResponse = getFallbackResponse(message);
    res.json({ reply: fallbackResponse });
  }
});

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

// ----------- ENDPOINT DE SALUD -----------
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    geminiApiAvailable: !!GEMINI_API_KEY
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
  console.log(`🤖 Gemini API: ${GEMINI_API_KEY ? '✅ Configurada' : '❌ No configurada'}`);
  if (!GEMINI_API_KEY) {
    console.log("💡 El chat funcionará con respuestas predefinidas");
  }
});