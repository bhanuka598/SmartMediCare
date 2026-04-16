require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Service URLs configuration
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5002',
  appointment: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5001',
  doctor: process.env.DOCTOR_SERVICE_URL || 'http://localhost:5003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004',
  patient: process.env.PATIENT_SERVICE_URL || 'http://localhost:5005',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5006',
  telemedicine: process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:5007'
};

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Note: express.json() removed - gateway proxies raw requests

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Gateway`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICES)
  });
});

// Proxy middleware options
const proxyOptions = {
  changeOrigin: true,
  secure: false,
  timeout: 30000,
  proxyTimeout: 30000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Proxying ${req.method} ${req.path} → ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Gateway] Response ${proxyRes.statusCode} for ${req.path}`);
  },
  onError: (err, req, res) => {
    console.error(`[Gateway] Proxy error for ${req.path}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({
        message: 'Service temporarily unavailable',
        error: err.message
      });
    }
  }
};

// Body parser middleware
// Note: body parser removed - gateway proxies raw requests without parsing

// Auth Service Routes - Public
const authProxy = createProxyMiddleware({
  ...proxyOptions,
  target: SERVICES.auth,
  pathRewrite: { '^/': '/api/auth/' },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Proxying ${req.method} ${req.path} → ${SERVICES.auth}${req.path}`);
    console.log(`[Gateway] Headers:`, JSON.stringify(req.headers));
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Gateway] Response ${proxyRes.statusCode} from auth service for ${req.path}`);
  },
  onError: (err, req, res) => {
    console.error(`[Gateway] Proxy error for ${req.path}:`, err.message, err.code);
    if (!res.headersSent) {
      res.status(502).json({
        message: 'Auth service unavailable',
        error: err.message
      });
    }
  }
});

app.use('/api/auth', authProxy);

// Protected Service Routes - Require Authentication
// These will have auth middleware added later

// Appointment Service
app.use('/api/appointments', createProxyMiddleware({
  ...proxyOptions,
  target: SERVICES.appointment,
  pathRewrite: (path) => `/api/appointments${path}`
}));

// Doctor Service
app.use('/api/doctors', createProxyMiddleware({
  ...proxyOptions,
  target: SERVICES.doctor,
  pathRewrite: (path) => `/api/doctors${path}`
}));

// Patient Service (singular) - must come before plural
app.use('/api/patient', createProxyMiddleware({
  ...proxyOptions,
  target: SERVICES.patient,
  pathRewrite: { '^/api/patient': '' },
  onError: (err, req, res) => {
    console.error('Patient service proxy error:', err.message);
    res.status(500).json({ message: 'Patient service unavailable', error: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway -> Patient Service] ${req.method} ${req.path} -> ${proxyReq.path}`);
  }
}));

// Patient Service (plural)
app.use('/api/patients', createProxyMiddleware({
  ...proxyOptions,
  target: SERVICES.patient,
  pathRewrite: { '^/api/patients': '' },
  onError: (err, req, res) => {
    console.error('Patient service proxy error:', err.message);
    res.status(500).json({ message: 'Patient service unavailable', error: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway -> Patient Service] ${req.method} ${req.path} -> ${proxyReq.path}`);
  }
}));

// Payment Service
app.use('/api/payments', createProxyMiddleware({
  ...proxyOptions,
  target: SERVICES.payment,
  pathRewrite: (path) => `/api/payments${path}`
}));

// Telemedicine Service
app.use('/api/telemedicine', createProxyMiddleware({
  ...proxyOptions,
  target: SERVICES.telemedicine,
  pathRewrite: (path) => `/api/telemedicine${path}`
}));

// Notification Service
app.use('/api/notifications', createProxyMiddleware({
  ...proxyOptions,
  target: SERVICES.notification,
  pathRewrite: (path) => `/api/notifications${path}`
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err.stack);
  res.status(500).json({
    message: 'Internal gateway error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Connected services:', Object.entries(SERVICES).map(([name, url]) => `\n  - ${name}: ${url}`).join(''));
});

module.exports = app;
