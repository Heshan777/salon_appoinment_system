const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
const PORT = process.env.AI_PORT || 5006;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

app.use(cors());
app.use(express.json());

let genAI = null;
if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('your_gemini')) {
  try {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log(`[AI Assistant Service] Google GenAI SDK initialized with model ${MODEL_NAME}.`);
  } catch (err) {
    console.warn(`[AI Assistant Service] Could not initialize Gemini SDK: ${err.message}`);
  }
} else {
  console.warn('[AI Assistant Service] GEMINI_API_KEY not configured. Running in demo simulated mode.');
}

// Health check
app.get('/api/ai/health', (req, res) => {
  res.json({
    service: 'ai-assistant-service',
    status: 'healthy',
    geminiConfigured: !!genAI,
    model: MODEL_NAME,
    timestamp: new Date().toISOString()
  });
});

// Conversational Salon Assistant
app.post('/api/ai/chat', async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Field "message" is required' });
  }

  const systemInstruction = `You are "Aura", the intelligent AI receptionist and concierge for the Luxe Salon & Spa.
Your job is to assist clients warmly with service recommendations (hair, skincare, nails, bridal packages), pricing inquiries, stylist matching, and booking advice.
Keep your answers elegant, helpful, and concise.`;

  try {
    if (genAI) {
      const response = await genAI.models.generateContent({
        model: MODEL_NAME,
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nClient inquiry: ${message}` }] }
        ]
      });

      const replyText = response.text || 'Thank you for reaching out to Luxe Salon & Spa. How else may I assist you today?';
      return res.json({
        reply: replyText,
        source: 'gemini-api'
      });
    }

    // Demo Simulated Mode
    const lower = message.toLowerCase();
    let reply = "Hello! Welcome to Luxe Salon & Spa. We offer premium haircutting, deluxe skincare facials, gel manicures, and bridal styling. How may I pamper you today?";
    if (lower.includes('hair') || lower.includes('cut')) {
      reply = "Our Classic Haircut & Styling starts at $35 with Sarah Jenkins or our master stylists. Would you like to schedule an appointment for this week?";
    } else if (lower.includes('facial') || lower.includes('skin')) {
      reply = "We offer a Deluxe Hydration Facial ($75, 60 mins) with David Kim. It deep cleanses and restores skin glow. Shall I check available slots for you?";
    } else if (lower.includes('book') || lower.includes('appointment')) {
      reply = "I would be happy to book that for you! Please tell me your preferred date, time, and service.";
    }

    res.json({
      reply,
      source: 'simulated-assistant',
      note: 'Provide a valid GEMINI_API_KEY in .env to activate live Gemini AI model generation.'
    });
  } catch (err) {
    console.error('[AI Chat Error]:', err.message);
    res.status(500).json({ error: 'Failed to generate AI response', details: err.message });
  }
});

// Intent & Slot Extraction for Autonomous Scheduling
app.post('/api/ai/parse-intent', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Field "prompt" is required' });
  }

  const instruction = `Analyze the client's scheduling request and return ONLY a valid JSON object with the following fields:
- intent: ("book_appointment", "cancel_appointment", "inquire_pricing", "other")
- service: string or null
- stylist: string or null
- requestedDate: string (e.g. YYYY-MM-DD or relative like "tomorrow") or null
- requestedTime: string (e.g. "14:00" or "3:00 PM") or null
- confidence: number between 0.0 and 1.0

Do not include backticks, markdown, or commentary. Output pure JSON only.`;

  try {
    if (genAI) {
      const response = await genAI.models.generateContent({
        model: MODEL_NAME,
        contents: [
          { role: 'user', parts: [{ text: `${instruction}\n\nClient Input: "${prompt}"` }] }
        ]
      });

      let raw = (response.text || '{}').trim();
      if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
      else if (raw.startsWith('```')) raw = raw.replace(/^```/, '').replace(/```$/, '').trim();

      const parsed = JSON.parse(raw);
      return res.json({ intent: parsed, source: 'gemini-api' });
    }

    // Heuristic simulated parsing
    const lower = prompt.toLowerCase();
    const isBooking = lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('haircut');
    res.json({
      intent: {
        intent: isBooking ? 'book_appointment' : 'inquire_pricing',
        service: lower.includes('hair') ? 'Classic Haircut' : (lower.includes('facial') ? 'Deluxe Facial' : null),
        stylist: lower.includes('sarah') ? 'Sarah Jenkins' : (lower.includes('david') ? 'David Kim' : null),
        requestedDate: lower.includes('tomorrow') ? 'tomorrow' : 'upcoming',
        requestedTime: lower.includes('pm') || lower.includes('am') ? 'afternoon' : 'flexible',
        confidence: 0.90
      },
      source: 'simulated-parser',
      note: 'Provide a valid GEMINI_API_KEY in .env to activate live Gemini entity extraction.'
    });
  } catch (err) {
    console.error('[AI Parse Error]:', err.message);
    res.status(500).json({ error: 'Failed to parse intent', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[AI Assistant Service] Running on port ${PORT}`);
});
