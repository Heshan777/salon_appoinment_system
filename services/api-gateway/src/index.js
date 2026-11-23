const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const crypto = require('crypto');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Production Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
}));

// Distributed Tracing: Attach Request Correlation ID
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Production Logging with Request ID
morgan.token('req-id', (req) => req.id);
app.use(morgan(':req-id :method :url :status :response-time ms'));

// Serve Static Frontend Assets (SPA)
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: isProd ? '1d' : 0,
  etag: true
}));

// Downstream Microservices Topology
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:5002',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:5003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5005',
  ai: process.env.AI_SERVICE_URL || 'http://localhost:5006',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:5007'
};

// Production Rate Limiter for Authentication & Sensitive Endpoints
const rateLimitMap = new Map();
const authRateLimiter = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'global';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 60;

  const clientRecord = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > clientRecord.resetAt) {
    clientRecord.count = 1;
    clientRecord.resetAt = now + windowMs;
  } else {
    clientRecord.count += 1;
  }
  rateLimitMap.set(ip, clientRecord);

  res.setHeader('X-RateLimit-Limit', maxAttempts);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - clientRecord.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(clientRecord.resetAt / 1000));

  if (clientRecord.count > maxAttempts) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please slow down and try again shortly.'
    });
  }
  next();
};

// Periodic Rate Limit Cleanup (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) rateLimitMap.delete(key);
  }
}, 10 * 60 * 1000);

// Comprehensive Gateway Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    gateway: 'GlowSync API Gateway',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
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

// Resilient Reverse Proxy Setup
const setupProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.setHeader('X-Request-Id', req.id);
      },
      error: (err, req, res) => {
        console.error(`[Gateway Proxy Error] Target: ${target} (${req.id})`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            error: 'Service Unavailable',
            message: `Downstream service temporarily unreachable at ${target}`,
            requestId: req.id,
            details: isProd ? undefined : err.message
          });
        }
      }
    }
  });
};

// Register Gateway Proxy Routes
app.use('/api/auth', authRateLimiter, setupProxy(services.auth));
app.use('/api/bookings', setupProxy(services.booking));
app.use('/api/catalog', setupProxy(services.catalog));
app.use('/api/payments', setupProxy(services.payment));
app.use('/api/notifications', setupProxy(services.notification));
app.use('/api/ai', setupProxy(services.ai));
app.use('/api/inventory', setupProxy(services.inventory));

// Client SPA Route Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 Handler for Unhandled API Routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found on GlowSync API Gateway`,
    requestId: req.id
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
  console.log('[API Gateway] Distributed Microservice Route Topology:');
  Object.entries(services).forEach(([name, url]) => {
    console.log(`  -> ${name.toUpperCase().padEnd(12)} : ${url}`);
  });
});

// Graceful Shutdown Handling (Zero-Downtime Containers)
const gracefulShutdown = (signal) => {
  console.log(`\n[API Gateway] ${signal} signal received. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('[API Gateway] HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[API Gateway] Forced shutdown: connections timed out after 10s.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
