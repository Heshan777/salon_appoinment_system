const mongoose = require('mongoose');

const ServiceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Hair', 'Skincare', 'Nails', 'Massage', 'Bridal', 'Other'], default: 'Hair' },
  durationMinutes: { type: Number, required: true, default: 45 },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const StaffMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  specialties: [{ type: String }],
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' },
    daysOff: [{ type: String }] // e.g. ['Sunday', 'Monday']
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = {
  ServiceItem: mongoose.model('ServiceItem', ServiceItemSchema),
  StaffMember: mongoose.model('StaffMember', StaffMemberSchema)
};
