const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { NotificationLog } = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.NOTIFICATION_PORT || 5005;
const MONGODB_URI = process.env.MONGODB_NOTIFICATION_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_notifications';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// In-memory fallback logs with initial demonstration records
const fallbackLogs = [
  {
    id: 'notif_1001',
    type: 'booking_confirmation',
    recipientEmail: 'alice@example.com',
    recipientPhone: '+1-555-0199',
    message: 'Dear Alice Walker, your appointment for Classic Haircut & Styling with Sarah Jenkins is confirmed!',
    channel: 'SMS & Email',
    status: 'delivered',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'notif_1002',
    type: 'appointment_reminder',
    recipientEmail: 'marcus@example.com',
    recipientPhone: null,
    message: 'Reminder: Hello Marcus Vance, your salon appointment for Deluxe Facial Treatment is coming up.',
    channel: 'Email',
    status: 'delivered',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// Dedicated Database-per-Service Connection: salon_notifications
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    isMongoConnected = true;
    console.log('[Notification Service] Connected to dedicated MongoDB database (salon_notifications).');
    const count = await NotificationLog.countDocuments();
    if (count === 0) {
      await NotificationLog.insertMany(fallbackLogs);
      console.log('[Notification Service] Seeded initial logs into salon_notifications database.');
    }
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`[Notification Service] MongoDB not reachable (${err.message}). Using local in-memory dataset.`);
  });

// Health check
app.get('/api/notifications/health', (req, res) => {
  res.json({
    service: 'notification-service',
    status: 'healthy',
    database: isMongoConnected ? 'mongodb:salon_notifications' : 'in-memory-fallback',
    timestamp: new Date().toISOString()
  });
});

// Send booking confirmation notification
app.post('/api/notifications/send-confirmation', async (req, res) => {
  const { recipientEmail, recipientPhone, customerName, serviceName, appointmentDate, staffName } = req.body;

  if (!recipientEmail || !customerName || !serviceName || !appointmentDate) {
    return res.status(400).json({ error: 'recipientEmail, customerName, serviceName, and appointmentDate are required' });
  }

  const logEntry = {
    id: `notif_${Date.now()}`,
    type: 'booking_confirmation',
    recipientEmail,
    recipientPhone: recipientPhone || null,
    message: `Dear ${customerName}, your appointment for ${serviceName} with ${staffName || 'our team'} on ${appointmentDate} is confirmed!`,
    channel: recipientPhone ? 'SMS & Email' : 'Email',
    status: 'delivered',
    timestamp: new Date().toISOString()
  };

  try {
    if (isMongoConnected) {
      const created = await NotificationLog.create(logEntry);
      console.log(`[Notification Service] Dispatched & saved confirmation to ${recipientEmail}`);
      return res.status(200).json({
        message: 'Booking confirmation notification dispatched successfully',
        notification: created
      });
    }

    fallbackLogs.unshift(logEntry);
    console.log(`[Notification Service] Dispatched confirmation to ${recipientEmail}`);
    res.status(200).json({
      message: 'Booking confirmation notification dispatched successfully',
      notification: logEntry
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send reminder notification
app.post('/api/notifications/send-reminder', async (req, res) => {
  const { recipientEmail, customerName, serviceName, appointmentDate } = req.body;

  const logEntry = {
    id: `notif_${Date.now()}`,
    type: 'appointment_reminder',
    recipientEmail,
    message: `Reminder: Hello ${customerName}, your salon appointment for ${serviceName} is scheduled for ${appointmentDate}.`,
    channel: 'Email',
    status: 'delivered',
    timestamp: new Date().toISOString()
  };

  try {
    if (isMongoConnected) {
      const created = await NotificationLog.create(logEntry);
      return res.status(200).json({
        message: 'Reminder notification dispatched',
        notification: created
      });
    }

    fallbackLogs.unshift(logEntry);
    res.status(200).json({
      message: 'Reminder notification dispatched',
      notification: logEntry
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send cancellation notification
app.post('/api/notifications/send-cancellation', async (req, res) => {
  const { recipientEmail, customerName, serviceName, appointmentDate, reason } = req.body;

  const logEntry = {
    id: `notif_${Date.now()}`,
    type: 'booking_cancellation',
    recipientEmail,
    message: `Appointment Update: Hello ${customerName || 'Client'}, your appointment for ${serviceName || 'service'} on ${appointmentDate || 'scheduled date'} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    channel: 'Email',
    status: 'delivered',
    timestamp: new Date().toISOString()
  };

  try {
    if (isMongoConnected) {
      const created = await NotificationLog.create(logEntry);
      return res.status(200).json({
        message: 'Cancellation notification dispatched',
        notification: created
      });
    }

    fallbackLogs.unshift(logEntry);
    res.status(200).json({
      message: 'Cancellation notification dispatched',
      notification: logEntry
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View notification audit logs
app.get('/api/notifications/logs', async (req, res) => {
  try {
    if (isMongoConnected) {
      const logs = await NotificationLog.find().sort({ timestamp: -1 }).limit(50).lean();
      return res.json({
        count: logs.length,
        logs
      });
    }

    res.json({
      count: fallbackLogs.length,
      logs: fallbackLogs.slice(0, 50)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Notification Service] Running on port ${PORT}`);
});
