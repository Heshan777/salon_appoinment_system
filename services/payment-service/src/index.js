const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Transaction } = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.PAYMENT_PORT || 5004;
const MONGODB_URI = process.env.MONGODB_PAYMENT_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_payments';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// In-memory fallback ledger with initial historical records
const fallbackTransactions = [
  {
    id: 'txn_1001',
    appointmentId: 'apt_sample_1',
    customerEmail: 'alice@example.com',
    amount: 35,
    currency: 'USD',
    paymentMethod: 'card',
    status: 'succeeded',
    receiptUrl: 'https://mock-payments.salon.internal/receipts/txn_1001',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'txn_1002',
    appointmentId: 'apt_sample_2',
    customerEmail: 'marcus@example.com',
    amount: 75,
    currency: 'USD',
    paymentMethod: 'apple_pay',
    status: 'succeeded',
    receiptUrl: 'https://mock-payments.salon.internal/receipts/txn_1002',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// Dedicated Database-per-Service Connection: salon_payments
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    isMongoConnected = true;
    console.log('[Payment Service] Connected to dedicated MongoDB database (salon_payments).');
    const count = await Transaction.countDocuments();
    if (count === 0) {
      await Transaction.insertMany(fallbackTransactions);
      console.log('[Payment Service] Seeded initial transactions into salon_payments database.');
    }
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`[Payment Service] MongoDB not reachable (${err.message}). Using local in-memory dataset.`);
  });

// Health check
app.get('/api/payments/health', (req, res) => {
  res.json({
    service: 'payment-service',
    status: 'healthy',
    database: isMongoConnected ? 'mongodb:salon_payments' : 'in-memory-fallback',
    timestamp: new Date().toISOString()
  });
});

// List all transactions / ledger with financial summary
app.get('/api/payments/transactions', async (req, res) => {
  try {
    let txns = fallbackTransactions;
    if (isMongoConnected) {
      txns = await Transaction.find().sort({ createdAt: -1 }).lean();
    }

    const totalRevenue = txns
      .filter(t => t.status === 'succeeded')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalRefunded = txns
      .filter(t => t.status === 'refunded')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    res.json({
      count: txns.length,
      totalRevenue,
      totalRefunded,
      netRevenue: totalRevenue - totalRefunded,
      transactions: [...txns].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create payment checkout session / intent
app.post('/api/payments/checkout', async (req, res) => {
  const { appointmentId, customerEmail, amount, currency = 'USD', paymentMethod = 'card' } = req.body;

  if (!appointmentId || !amount) {
    return res.status(400).json({ error: 'appointmentId and amount are required' });
  }

  const transactionData = {
    id: `txn_${Date.now()}`,
    appointmentId,
    customerEmail: customerEmail || 'guest@example.com',
    amount: parseFloat(amount),
    currency,
    paymentMethod,
    status: 'succeeded',
    receiptUrl: `https://mock-payments.salon.internal/receipts/txn_${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  try {
    if (isMongoConnected) {
      const created = await Transaction.create(transactionData);
      return res.status(201).json({
        message: 'Payment processed successfully in salon_payments DB',
        transaction: created
      });
    }

    fallbackTransactions.unshift(transactionData);
    res.status(201).json({
      message: 'Payment processed successfully',
      transaction: transactionData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Issue a refund for a transaction
app.post('/api/payments/refund', async (req, res) => {
  const { transactionId, appointmentId, reason } = req.body;

  try {
    if (isMongoConnected) {
      const target = await Transaction.findOne({
        $or: [
          { id: transactionId },
          { appointmentId: appointmentId }
        ]
      });

      if (!target) {
        return res.status(404).json({ error: 'Transaction not found for refund' });
      }

      if (target.status === 'refunded') {
        return res.status(400).json({ error: 'Transaction has already been refunded' });
      }

      target.status = 'refunded';
      target.refundReason = reason || 'Customer requested refund or cancellation';
      await target.save();

      return res.json({
        message: 'Refund issued successfully',
        transaction: target
      });
    }

    const target = fallbackTransactions.find(t => 
      (transactionId && t.id === transactionId) || 
      (appointmentId && t.appointmentId === appointmentId)
    );

    if (!target) {
      return res.status(404).json({ error: 'Transaction not found for refund' });
    }

    if (target.status === 'refunded') {
      return res.status(400).json({ error: 'Transaction has already been refunded' });
    }

    target.status = 'refunded';
    target.refundReason = reason || 'Customer requested refund or cancellation';
    target.refundedAt = new Date().toISOString();

    res.json({
      message: 'Refund issued successfully',
      transaction: target
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lookup transactions for a specific appointment
app.get('/api/payments/transactions/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;

  try {
    if (isMongoConnected) {
      const match = await Transaction.find({ appointmentId }).lean();
      return res.json({ count: match.length, transactions: match });
    }

    const match = fallbackTransactions.filter(t => t.appointmentId === appointmentId);
    res.json({ count: match.length, transactions: match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Payment Service] Running on port ${PORT}`);
});
