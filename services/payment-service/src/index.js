const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PAYMENT_PORT || 5004;

app.use(cors());
app.use(express.json());

// In-memory transactions store
const transactions = [];

// Health check
app.get('/api/payments/health', (req, res) => {
  res.json({
    service: 'payment-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
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
    customerEmail,
    amount,
    currency,
    paymentMethod,
    status: 'succeeded', // Instant mock success
    receiptUrl: `https://mock-payments.salon.internal/receipts/txn_${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  transactions.push(transaction);

  res.status(201).json({
    message: 'Payment processed successfully',
    transaction
  });
});

// Lookup transactions for an appointment
app.get('/api/payments/transactions/:appointmentId', (req, res) => {
  const { appointmentId } = req.params;
  const match = transactions.filter(t => t.appointmentId === appointmentId);
  res.json({ count: match.length, transactions: match });
});

app.listen(PORT, () => {
  console.log(`[Payment Service] Running on port ${PORT}`);
});
