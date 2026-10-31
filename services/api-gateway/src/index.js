const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Logging Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan('dev'));

const path = require('path');
// Serve static frontend assets
app.use(express.static(path.join(__dirname, '../public')));

// Service Target URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:5002',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:5003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005',
  ai: process.env.AI_SERVICE_URL || 'http://localhost:5006',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:5007'
};

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    gateway: 'GlowSync API Gateway',
    timestamp: new Date().toISOString(),
    routes: {
      auth: '/api/auth',
      bookings: '/api/bookings',
      catalog: '/api/catalog',
      payments: '/api/payments',
      notifications: '/api/notifications',
      ai: '/api/ai',
      inventory: '/api/inventory'
    }
  });
});

// Configure Reverse Proxy Routes
const setupProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
    onError: (err, req, res) => {
      console.error(`[Gateway Proxy Error] Target: ${target}`, err.message);
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: `Unable to connect to downstream service at ${target}`,
          details: err.message
        });
      }
    }
  });
};

app.use('/api/auth', setupProxy(services.auth));
app.use('/api/bookings', setupProxy(services.booking));
app.use('/api/catalog', setupProxy(services.catalog));
app.use('/api/payments', setupProxy(services.payment));
app.use('/api/notifications', setupProxy(services.notification));
app.use('/api/ai', setupProxy(services.ai));
app.use('/api/inventory', setupProxy(services.inventory));

// Client SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 Handler for unhandled API routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found on API Gateway`
  });
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT}`);
  console.log('[API Gateway] Service routes registered:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`  -> ${name.toUpperCase()} Service: ${url}`);
  });
});
