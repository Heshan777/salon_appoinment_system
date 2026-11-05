const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PAYMENT_PORT || 5004;

app.use(cors());
app.use(express.json());

// In-memory transactions ledger with initial historical records
const transactions = [
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

// Health check
app.get('/api/payments/health', (req, res) => {
  res.json({
    service: 'payment-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// List all transactions / ledger with financial summary
app.get('/api/payments/transactions', (req, res) => {
  const totalRevenue = transactions
    .filter(t => t.status === 'succeeded')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const totalRefunded = transactions
    .filter(t => t.status === 'refunded')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  res.json({
    count: transactions.length,
    totalRevenue,
    totalRefunded,
    netRevenue: totalRevenue - totalRefunded,
    transactions: [...transactions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  });
});

// Create payment checkout session / intent
app.post('/api/payments/checkout', (req, res) => {
  const { appointmentId, customerEmail, amount, currency = 'USD', paymentMethod = 'card' } = req.body;

  if (!appointmentId || !amount) {
    return res.status(400).json({ error: 'appointmentId and amount are required' });
  }

  const transaction = {
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

  transactions.unshift(transaction);

  res.status(201).json({
    message: 'Payment processed successfully',
    transaction
  });
});

// Issue a refund for a transaction
app.post('/api/payments/refund', (req, res) => {
  const { transactionId, appointmentId, reason } = req.body;

  const target = transactions.find(t => 
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
});

// Lookup transactions for a specific appointment
app.get('/api/payments/transactions/:appointmentId', (req, res) => {
  const { appointmentId } = req.params;
  const match = transactions.filter(t => t.appointmentId === appointmentId);
  res.json({ count: match.length, transactions: match });
});

app.listen(PORT, () => {
  console.log(`[Payment Service] Running on port ${PORT}`);
});
