const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.NOTIFICATION_PORT || 5005;

app.use(cors());
app.use(express.json());

// Notification audit log with initial demonstration logs
const notificationLogs = [
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

// Health check
app.get('/api/notifications/health', (req, res) => {
  res.json({
    service: 'notification-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Send booking confirmation notification
app.post('/api/notifications/send-confirmation', (req, res) => {
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

  notificationLogs.unshift(logEntry);
  console.log(`[Notification Service] Dispatched confirmation to ${recipientEmail}`);

  res.status(200).json({
    message: 'Booking confirmation notification dispatched successfully',
    notification: logEntry
  });
});

// Send reminder notification
app.post('/api/notifications/send-reminder', (req, res) => {
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

  notificationLogs.unshift(logEntry);
  console.log(`[Notification Service] Dispatched reminder to ${recipientEmail}`);

  res.status(200).json({
    message: 'Reminder notification dispatched',
    notification: logEntry
  });
});

// Send cancellation notification
app.post('/api/notifications/send-cancellation', (req, res) => {
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

  notificationLogs.unshift(logEntry);
  console.log(`[Notification Service] Dispatched cancellation notice to ${recipientEmail}`);

  res.status(200).json({
    message: 'Cancellation notification dispatched',
    notification: logEntry
  });
});

// View notification audit logs
app.get('/api/notifications/logs', (req, res) => {
  res.json({
    count: notificationLogs.length,
    logs: notificationLogs.slice(0, 50)
  });
});

app.listen(PORT, () => {
  console.log(`[Notification Service] Running on port ${PORT}`);
});
