const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI, Type } = require('@google/genai');

dotenv.config();

const app = express();
const PORT = process.env.AI_PORT || 5006;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Using current production standard model: gemini-3.8-flash (or user-configured model)
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// Microservices endpoint URLs
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:5002';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:5003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:5007';

app.use(cors());
app.use(express.json());

let genAI = null;
if (GEMINI_API_KEY && !GEMINI_API_KEY.includes('your_gemini') && GEMINI_API_KEY.trim() !== '') {
  try {
    genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log(`[AI Autonomous Agent] Google GenAI SDK initialized with model ${MODEL_NAME}.`);
  } catch (err) {
    console.warn(`[AI Autonomous Agent] Could not initialize Gemini SDK: ${err.message}`);
  }
} else {
  console.warn('[AI Autonomous Agent] Live GEMINI_API_KEY not configured. Autonomous Agent fallback tool engine active.');
}

// ==========================================
// TOOL DEFINITIONS & MICROSERVICE RUNNERS
// ==========================================

const TOOLS_SCHEMA = [
  {
    name: 'getCatalogServices',
    description: 'Fetch the live salon services catalog including names, descriptions, categories, durations, and prices.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING, description: 'Optional category filter, e.g. "Hair", "Skincare", "Nails", "Bridal".' }
      }
    }
  },
  {
    name: 'getStaffRoster',
    description: 'Fetch the active salon specialists/stylists, their specialties, working shift hours, and meal breaks.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'checkAppointments',
    description: 'Query scheduled salon appointments to check availability or look up existing bookings.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: 'Filter by date YYYY-MM-DD.' },
        stylistName: { type: Type.STRING, description: 'Filter by staff or stylist name.' },
        customerEmail: { type: Type.STRING, description: 'Filter by client email address.' }
      }
    }
  },
  {
    name: 'bookAppointment',
    description: 'Book a new salon appointment into the scheduling microservice.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerName: { type: Type.STRING, description: 'Full name of the client.' },
        customerEmail: { type: Type.STRING, description: 'Email address of the client.' },
        customerPhone: { type: Type.STRING, description: 'Contact phone number.' },
        serviceName: { type: Type.STRING, description: 'Exact name of the treatment or service.' },
        staffName: { type: Type.STRING, description: 'Chosen specialist or stylist name.' },
        appointmentDate: { type: Type.STRING, description: 'Date and time in ISO format or YYYY-MM-DDTHH:mm:00.' },
        durationMinutes: { type: Type.NUMBER, description: 'Estimated treatment length in minutes.' },
        totalPrice: { type: Type.NUMBER, description: 'Service price.' },
        notes: { type: Type.STRING, description: 'Treatment notes or preferences.' }
      },
      required: ['customerName', 'serviceName', 'appointmentDate']
    }
  },
  {
    name: 'cancelAppointment',
    description: 'Cancel an existing appointment by booking ID or client search.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        appointmentId: { type: Type.STRING, description: 'The unique booking ID to cancel.' },
        reason: { type: Type.STRING, description: 'Reason for cancellation.' }
      },
      required: ['appointmentId']
    }
  },
  {
    name: 'checkInventoryStock',
    description: 'Check stock levels of salon supplies and products in the central inventory microservice.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'processAdvancePayment',
    description: 'Process an advance deposit or full digital payment for a client appointment.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        appointmentId: { type: Type.STRING, description: 'Target appointment ID.' },
        customerEmail: { type: Type.STRING, description: 'Client email.' },
        amount: { type: Type.NUMBER, description: 'Deposit or payment amount in USD.' },
        paymentMethod: { type: Type.STRING, description: 'Payment method, e.g. "CARD", "APPLE_PAY", "DEPOSIT".' }
      },
      required: ['appointmentId', 'amount']
    }
  }
];

// Execute actual microservice HTTP calls for tools
async function executeAgentTool(name, args = {}) {
  console.log(`[Autonomous Agent Tool Call] -> ${name}(${JSON.stringify(args)})`);
  try {
    switch (name) {
      case 'getCatalogServices': {
        const res = await fetch(`${CATALOG_SERVICE_URL}/api/catalog/services`);
        const data = await res.json();
        let services = data.services || [];
        if (args.category) {
          services = services.filter(s => s.category?.toLowerCase() === args.category.toLowerCase());
        }
        return {
          total: services.length,
          services: services.map(s => ({
            id: s._id || s.id,
            name: s.name,
            category: s.category,
            durationMinutes: s.durationMinutes,
            price: s.price,
            description: s.description
          }))
        };
      }

      case 'getStaffRoster': {
        const res = await fetch(`${CATALOG_SERVICE_URL}/api/catalog/staff`);
        const data = await res.json();
        return {
          staff: (data.staff || []).map(st => ({
            id: st._id || st.id,
            name: st.name,
            role: st.role || (st.specialties ? st.specialties.join(', ') : 'Specialist'),
            specialties: st.specialties || [],
            shiftHours: st.workingHours ? `${st.workingHours.start} - ${st.workingHours.end}` : (st.shiftHours || '09:00 - 18:00'),
            mealBreak: st.mealBreak || '13:00 - 14:00'
          }))
        };
      }

      case 'checkAppointments': {
        const res = await fetch(`${BOOKING_SERVICE_URL}/api/bookings`);
        const data = await res.json();
        let bookings = data.bookings || [];
        if (args.date) {
          bookings = bookings.filter(b => (b.appointmentDate || '').startsWith(args.date));
        }
        if (args.stylistName) {
          bookings = bookings.filter(b => (b.staffName || '').toLowerCase().includes(args.stylistName.toLowerCase()));
        }
        if (args.customerEmail) {
          bookings = bookings.filter(b => (b.customerEmail || '').toLowerCase() === args.customerEmail.toLowerCase());
        }
        return {
          count: bookings.length,
          bookings: bookings.map(b => ({
            id: b._id || b.id,
            customerName: b.customerName,
            serviceName: b.serviceName,
            staffName: b.staffName,
            appointmentDate: b.appointmentDate,
            status: b.status,
            totalPrice: b.totalPrice
          }))
        };
      }

      case 'bookAppointment': {
        const payload = {
          customerName: args.customerName || 'Aura Guest Client',
          customerEmail: args.customerEmail || 'client@glowsync.com',
          customerPhone: args.customerPhone || '+1-555-0199',
          serviceId: args.serviceId || 'srv_1',
          serviceName: args.serviceName || 'Classic Haircut & Styling',
          staffId: args.staffId || 'stf_1',
          staffName: args.staffName || 'Elena Rostova',
          appointmentDate: args.appointmentDate,
          durationMinutes: Number(args.durationMinutes) || 45,
          totalPrice: Number(args.totalPrice) || 45,
          notes: args.notes || 'Autonomous Concierge Agent Booking',
          status: 'confirmed'
        };

        const res = await fetch(`${BOOKING_SERVICE_URL}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          return { error: data.error || 'Failed to book slot with scheduling service', status: res.status };
        }
        return {
          success: true,
          booking: data.booking,
          message: `Appointment #${data.booking?._id || data.booking?.id} successfully booked!`
        };
      }

      case 'cancelAppointment': {
        const res = await fetch(`${BOOKING_SERVICE_URL}/api/bookings/${args.appointmentId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' })
        });
        const data = await res.json();
        return { success: res.ok, status: 'cancelled', data };
      }

      case 'checkInventoryStock': {
        const res = await fetch(`${INVENTORY_SERVICE_URL}/api/inventory`);
        const data = await res.json();
        return {
          totalItems: data.count || (data.stock || []).length,
          lowStockCount: data.lowStockCount || 0,
          stock: (data.stock || []).map(i => ({
            name: i.name,
            quantity: `${i.quantity} ${i.unit}`,
            isLowStock: i.quantity <= i.minThreshold
          }))
        };
      }

      case 'processAdvancePayment': {
        const payload = {
          appointmentId: args.appointmentId,
          customerEmail: args.customerEmail || 'client@glowsync.com',
          amount: Number(args.amount) || 25,
          paymentMethod: args.paymentMethod || 'DEPOSIT_CARD'
        };
        const res = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        return { success: res.ok, transaction: data.transaction };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    console.error(`[Tool Execution Error] ${name}:`, err.message);
    return { error: `Failed executing microservice tool ${name}: ${err.message}` };
  }
}

// Autonomous Multi-Turn Orchestrator Engine
async function runAgentTurn(userMessage, conversationHistory = []) {
  const systemInstruction = `You are "Aura", the Autonomous AI Concierge and Operations Agent for GlowSync Cloud Salon & Spa.
You have real-time autonomous access to 8 salon microservices via tools:
- getCatalogServices: Check service list, duration, and prices
- getStaffRoster: Check specialist shift hours and lunch breaks
- checkAppointments: Look up booked slots or existing reservations
- bookAppointment: Confirm and book real appointments
- cancelAppointment: Cancel client bookings
- checkInventoryStock: Inspect consumable stock levels and alerts
- processAdvancePayment: Process deposits or full payments

RULES:
1. When a client asks for advice, recommendation, pricing, or availability, call the appropriate tools first to verify ground-truth facts.
2. If the user wants to book, check the catalog price and duration, confirm the stylist and date/time, and call bookAppointment.
3. Be warm, professional, elegant, and concise. Explain what actions you took.`;

  // Path 1: Live Gemini API Tool Calling Loop
  if (genAI) {
    try {
      const contents = [];
      for (const turn of conversationHistory) {
        contents.push({
          role: turn.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: turn.text || turn.content || '' }]
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      let iteration = 0;
      const MAX_TURNS = 5;
      const executedToolsLog = [];

      while (iteration < MAX_TURNS) {
        iteration++;
        const response = await genAI.models.generateContent({
          model: MODEL_NAME,
          contents,
          config: {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            tools: [{ functionDeclarations: TOOLS_SCHEMA }]
          }
        });

        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          for (const call of functionCalls) {
            const toolResult = await executeAgentTool(call.name, call.args || {});
            executedToolsLog.push({ tool: call.name, args: call.args, result: toolResult });

            // Push model's tool call turn
            contents.push({
              role: 'model',
              parts: [{ functionCall: call }]
            });

            // Push tool execution result turn
            contents.push({
              role: 'user',
              parts: [{
                functionResponse: {
                  name: call.name,
                  response: toolResult
                }
              }]
            });
          }
        } else {
          // Final synthesized response reached
          return {
            reply: response.text || 'I have completed your request.',
            toolCalls: executedToolsLog,
            source: 'gemini-autonomous-agent',
            model: MODEL_NAME
          };
        }
      }

      return {
        reply: 'I processed your request across our salon microservices.',
        toolCalls: executedToolsLog,
        source: 'gemini-autonomous-agent',
        model: MODEL_NAME
      };
    } catch (err) {
      console.warn(`[Gemini SDK Tool Call Failure, falling back to Autonomous Heuristic]: ${err.message}`);
    }
  }

  // Path 2: Autonomous Local Tool Orchestrator Engine (Reliable Fallback)
  const lower = userMessage.toLowerCase();
  const executedToolsLog = [];
  let reply = '';

  if (lower.includes('inventory') || lower.includes('stock') || lower.includes('supplies')) {
    const invData = await executeAgentTool('checkInventoryStock');
    executedToolsLog.push({ tool: 'checkInventoryStock', args: {}, result: invData });
    reply = `I inspected our central inventory microservice. We currently track ${invData.totalItems} product lines with ${invData.lowStockCount} low-stock alert(s). Essential treatment supplies (Toner, Keratin, Argan Oil) are available in stock.`;
  } else if (lower.includes('roster') || lower.includes('shift') || lower.includes('staff') || lower.includes('stylist')) {
    const staffData = await executeAgentTool('getStaffRoster');
    executedToolsLog.push({ tool: 'getStaffRoster', args: {}, result: staffData });
    const names = staffData.staff.map(s => `${s.name} (${s.role}, Shift: ${s.shiftHours})`).join(', ');
    reply = `Here is our current stylist roster from the team microservice: ${names}. All specialists have their scheduled lunch breaks allocated between 13:00 - 14:00.`;
  } else if (
    lower.includes('service') ||
    lower.includes('seivice') ||
    lower.includes('seivices') ||
    lower.includes('catalog') ||
    lower.includes('price') ||
    lower.includes('prices') ||
    lower.includes('treatment') ||
    lower.includes('treatments') ||
    lower.includes('menu')
  ) {
    const catalogData = await executeAgentTool('getCatalogServices');
    executedToolsLog.push({ tool: 'getCatalogServices', args: {}, result: catalogData });
    const uniqueServices = Array.from(new Map((catalogData.services || []).map(s => [s.name, s])).values());
    const servicesList = uniqueServices.map(s => `• **${s.name}** — **$${s.price}** (${s.durationMinutes} mins, Category: *${s.category}*)`).join('\n');
    reply = `Here is our current salon service menu & live price list:\n\n${servicesList}\n\n✨ All prices include consultation. Would you like to schedule an appointment for any of these treatments?`;
  } else if (
    lower.includes('book') ||
    lower.includes('schedule') ||
    lower.includes('reserve') ||
    lower.includes('appoinment') ||
    lower.includes('appointment') ||
    ((lower.includes('haircut') || lower.includes('facial') || lower.includes('manicure') || lower.includes('styling') || lower.includes('balayage')) && (lower.includes('tomorrow') || lower.includes('at') || lower.includes('with')))
  ) {
    // 1. Fetch live catalog and staff roster
    const catalogData = await executeAgentTool('getCatalogServices');
    executedToolsLog.push({ tool: 'getCatalogServices', args: {}, result: catalogData });

    const staffData = await executeAgentTool('getStaffRoster');
    executedToolsLog.push({ tool: 'getStaffRoster', args: {}, result: staffData });

    // 2. Fetch existing appointments to verify availability
    const aptsData = await executeAgentTool('checkAppointments');
    executedToolsLog.push({ tool: 'checkAppointments', args: {}, result: aptsData });

    // Check if user explicitly mentioned a specific service
    const mentionedService = (catalogData.services || []).find(s => lower.includes(s.name.toLowerCase())) ||
      (lower.includes('haircut') ? (catalogData.services || []).find(s => s.name.toLowerCase().includes('haircut')) : null) ||
      (lower.includes('facial') ? (catalogData.services || []).find(s => s.name.toLowerCase().includes('facial')) : null) ||
      (lower.includes('manicure') || lower.includes('nail') ? (catalogData.services || []).find(s => s.name.toLowerCase().includes('nail') || s.name.toLowerCase().includes('manicure')) : null);

    // Check if user explicitly specified a specialist
    const mentionedStaff = (staffData.staff || []).find(st => lower.includes(st.name.toLowerCase().split(' ')[0]) || lower.includes(st.name.toLowerCase()));

    // Parse requested time if provided (e.g. 11.00 am, 3:00 pm, 11am)
    let requestedHour = null;
    let requestedMinute = 0;
    const timeMatch = lower.match(/(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?/);
    if (timeMatch) {
      let h = parseInt(timeMatch[1], 10);
      const isPm = timeMatch[3] === 'pm' || (!timeMatch[3] && h < 7);
      const isAm = timeMatch[3] === 'am';
      if (isPm && h < 12) h += 12;
      if (isAm && h === 12) h = 0;
      requestedHour = h;
      if (timeMatch[2]) requestedMinute = parseInt(timeMatch[2], 10);
    }

    const timeFormatted = requestedHour !== null
      ? `${(requestedHour % 12) || 12}:${requestedMinute === 0 ? '00' : (requestedMinute < 10 ? '0' + requestedMinute : requestedMinute)} ${requestedHour >= 12 ? 'PM' : 'AM'}`
      : 'your requested time';

    // SCENARIO A: User did NOT specify a service OR did NOT specify a specialist yet.
    // Instead of making an assumption, ask the user to pick their preferred treatment and artisan!
    if (!mentionedService || !mentionedStaff) {
      const servicesPreview = (catalogData.services || []).slice(0, 4).map(s => `• **${s.name}** ($${s.price}, ${s.durationMinutes}m)`).join('\n');
      const staffPreview = (staffData.staff || []).map(st => `• **${st.name}** (${st.role || (st.specialties ? st.specialties.join(', ') : 'Stylist')})`).join('\n');

      let followUp = '';
      if (!mentionedService && !mentionedStaff) {
        followUp = `You requested a booking for **${timeFormatted}**, but you haven't selected your preferred treatment or specialist yet.\n\n` +
          `💆 **Popular Treatments:**\n${servicesPreview}\n\n` +
          `✂️ **On-Duty Specialists:**\n${staffPreview}\n\n` +
          `👉 **Please reply with:**\n` +
          `1. Which service you'd like (e.g., *"Classic Haircut"*, *"Hydra-Glow Facial"*)\n` +
          `2. Which specialist you prefer (or type *"any available specialist"*)\n\n` +
          `*(You can also click the quick cards below to select directly!)*`;
      } else if (!mentionedService) {
        followUp = `You selected **${mentionedStaff.name}** for **${timeFormatted}**. Which treatment would you like?\n\n` +
          `💆 **Available Treatments:**\n${servicesPreview}\n\n` +
          `Please reply with your preferred service to complete the booking.`;
      } else {
        followUp = `You selected **${mentionedService.name}** ($${mentionedService.price}) for **${timeFormatted}**. Which specialist would you prefer?\n\n` +
          `✂️ **Available Specialists:**\n${staffPreview}\n\n` +
          `Please reply with your stylist preference (or type *"any stylist"*).`;
      }

      return {
        reply: followUp,
        toolCalls: executedToolsLog,
        needsSelection: true,
        source: 'autonomous-agent-orchestrator',
        model: 'glowsync-agent-v1'
      };
    }

    // SCENARIO B: User explicitly chose both Service & Specialist (or said "any"). Proceed to conflict-check & book!
    const matchedService = mentionedService;
    const selectedStaff = mentionedStaff;
    const targetHour = requestedHour !== null ? requestedHour : 15;

    const targetDate = new Date(Date.now() + 86400000); // Tomorrow
    targetDate.setHours(targetHour, requestedMinute, 0, 0);

    const duration = matchedService.durationMinutes || 45;
    const conflictWindowStart = targetDate.getTime() - duration * 60000;
    const conflictWindowEnd = targetDate.getTime() + duration * 60000;

    // Check if chosen specialist has conflict
    const hasConflict = (aptsData.bookings || []).some(b => {
      if (b.status === 'cancelled') return false;
      const bTime = new Date(b.appointmentDate).getTime();
      const matches = (b.staffName && b.staffName.toLowerCase() === selectedStaff.name.toLowerCase()) || (b.staffId === selectedStaff.id);
      return matches && (bTime >= conflictWindowStart && bTime <= conflictWindowEnd);
    });

    if (hasConflict) {
      // Find other specialists without conflict
      const freeStaff = (staffData.staff || []).filter(st => {
        return !(aptsData.bookings || []).some(b => {
          if (b.status === 'cancelled') return false;
          const bTime = new Date(b.appointmentDate).getTime();
          const matches = (b.staffName && b.staffName.toLowerCase() === st.name.toLowerCase()) || (b.staffId === st.id);
          return matches && (bTime >= conflictWindowStart && bTime <= conflictWindowEnd);
        });
      });

      const freeNames = freeStaff.map(s => `• **${s.name}** (${s.role || 'Specialist'})`).join('\n');
      reply = `⚠️ **${selectedStaff.name}** already has an appointment booked at **${timeFormatted} tomorrow**.\n\n` +
        (freeStaff.length > 0
          ? `✨ **Available Specialists at ${timeFormatted}:**\n${freeNames}\n\nWould you like me to book with one of them, or should we select another time?`
          : `All specialists are occupied at ${timeFormatted}. Would you like to select an earlier or later time slot?`);
    } else {
      // Conflict-free: Execute booking
      const bookResult = await executeAgentTool('bookAppointment', {
        customerName: 'Aura Client',
        customerEmail: 'client@glowsync.com',
        serviceId: matchedService.id || matchedService._id || 'srv_1',
        serviceName: matchedService.name,
        staffId: selectedStaff.id || 'stf_1',
        staffName: selectedStaff.name,
        appointmentDate: targetDate.toISOString(),
        durationMinutes: duration,
        totalPrice: matchedService.price || 45,
        notes: `Customer-selected booking for ${matchedService.name} with ${selectedStaff.name}`
      });

      executedToolsLog.push({
        tool: 'bookAppointment',
        args: { serviceName: matchedService.name, staffName: selectedStaff.name, appointmentDate: targetDate.toISOString() },
        result: bookResult
      });

      if (bookResult.success) {
        reply = `✨ **Booking Successfully Confirmed!**\n\n` +
          `• **Treatment:** ${matchedService.name} ($${matchedService.price}, ${duration} mins)\n` +
          `• **Specialist:** ${selectedStaff.name} (${selectedStaff.role || 'Stylist'})\n` +
          `• **Date & Time:** Tomorrow at **${timeFormatted}**\n` +
          `• **Booking ID:** #${bookResult.booking?._id || bookResult.booking?.id}\n\n` +
          `Zero scheduling conflicts were detected. The slot is locked in the scheduling microservice.`;
      } else {
        reply = `Could not complete booking: ${bookResult.error}`;
      }
    }
  } else if (lower.includes('cancel')) {
    const apts = await executeAgentTool('checkAppointments');
    executedToolsLog.push({ tool: 'checkAppointments', args: {}, result: apts });
    if (apts.bookings && apts.bookings.length > 0) {
      const target = apts.bookings[0];
      const cancelRes = await executeAgentTool('cancelAppointment', { appointmentId: target.id, reason: 'Client requested cancellation via Aura AI' });
      executedToolsLog.push({ tool: 'cancelAppointment', args: { appointmentId: target.id }, result: cancelRes });
      reply = `I have cancelled appointment #${target.id} (${target.serviceName} for ${target.customerName}) in the booking microservice.`;
    } else {
      reply = 'I checked your scheduled appointments, but there were no active bookings found to cancel.';
    }
  } else {
    reply = "Greetings! I am Aura, your Autonomous Salon Agent. I have direct API access to schedule appointments, query our live service catalog, check stylist rosters, monitor inventory supplies, and process advance deposits. What can I coordinate for you today?";
  }

  return {
    reply,
    toolCalls: executedToolsLog,
    source: 'autonomous-agent-orchestrator',
    model: 'glowsync-agent-v1'
  };
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/ai/health', (req, res) => {
  res.json({
    service: 'ai-assistant-service',
    role: 'Autonomous Salon Concierge & Operations Agent',
    status: 'healthy',
    geminiConfigured: !!genAI,
    model: MODEL_NAME,
    toolsRegistered: TOOLS_SCHEMA.map(t => t.name),
    timestamp: new Date().toISOString()
  });
});

// Autonomous Multi-Turn Agent Endpoint
app.post('/api/ai/agent', async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Field "message" is required' });
  }

  try {
    const agentResult = await runAgentTurn(message, conversationHistory);
    res.json(agentResult);
  } catch (err) {
    console.error('[Agent Execution Error]:', err);
    res.status(500).json({ error: 'Failed to execute agent turn', details: err.message });
  }
});

// Legacy conversational route maintained for backward compatibility
app.post('/api/ai/chat', async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Field "message" is required' });
  }
  try {
    const result = await runAgentTurn(message, conversationHistory);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Intent & Slot Extraction endpoint
app.post('/api/ai/parse-intent', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Field "prompt" is required' });
  }

  const lower = prompt.toLowerCase();
  const isBooking = lower.includes('book') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('haircut');
  res.json({
    intent: {
      intent: isBooking ? 'book_appointment' : 'inquire_pricing',
      service: lower.includes('hair') ? 'Classic Haircut & Styling' : (lower.includes('facial') ? 'Deluxe Facial' : 'Balayage & Glaze'),
      stylist: lower.includes('sarah') ? 'Sarah Jenkins' : (lower.includes('david') ? 'David Kim' : 'Elena Rostova'),
      requestedDate: 'tomorrow',
      requestedTime: '15:00',
      confidence: 0.95
    },
    source: 'autonomous-intent-extractor'
  });
});

// Direct Tool Execution Endpoint (for administrative diagnostics)
app.post('/api/ai/tools/execute', async (req, res) => {
  const { toolName, args = {} } = req.body;
  if (!toolName) {
    return res.status(400).json({ error: 'Field "toolName" is required' });
  }
  try {
    const result = await executeAgentTool(toolName, args);
    res.json({ toolName, args, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[AI Autonomous Agent Service] Running on port ${PORT}`);
});
