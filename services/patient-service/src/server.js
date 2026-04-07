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

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'patient-service' });
});

// Routes
app.use('/', require('./routes/patientRoutes'));

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});
