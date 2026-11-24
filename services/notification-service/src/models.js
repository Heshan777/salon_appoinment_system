const mongoose = require('mongoose');

const NotificationLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { 
    type: String, 
    enum: ['booking_confirmation', 'appointment_reminder', 'booking_cancellation'],
    default: 'booking_confirmation'
  },
  recipientEmail: { type: String, required: true, index: true },
  recipientPhone: { type: String },
  message: { type: String, required: true },
  channel: { type: String, default: 'SMS & Email' },
  status: { type: String, default: 'delivered' },
  timestamp: { type: Date, default: Date.now }
});

const NotificationLog = mongoose.model('NotificationLog', NotificationLogSchema, 'dispatch_logs');

module.exports = { NotificationLog };
