const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  appointmentId: { type: String, required: true, index: true },
  customerEmail: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentMethod: { type: String, default: 'card' },
  status: { type: String, enum: ['succeeded', 'refunded', 'failed'], default: 'succeeded' },
  receiptUrl: { type: String },
  refundReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', TransactionSchema, 'transactions');

module.exports = { Transaction };
