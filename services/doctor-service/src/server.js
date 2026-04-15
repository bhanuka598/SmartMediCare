require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Doctor Service`);
  next();
});

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'doctor-service' });
});

// Routes - handle /api/doctors prefix from gateway
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/', require('./routes/doctorRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});
