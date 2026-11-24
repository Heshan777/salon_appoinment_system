const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'stylist', 'receptionist', 'admin'],
    default: 'customer',
    index: true
  },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema, 'users');

module.exports = { User };
