const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true },
  staffId: { type: String, default: 'any' },
  staffName: { type: String, default: 'Any Available Stylist' },
  appointmentDate: { type: Date, required: true },
  durationMinutes: { type: Number, default: 45 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  totalPrice: { type: Number, required: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = {
  Appointment: mongoose.model('Appointment', AppointmentSchema)
};
