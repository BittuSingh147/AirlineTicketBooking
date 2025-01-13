const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const flightRoutes = require('./routes/flight');
const bookingRoutes = require('./routes/booking');
const paymentRoutes = require('./routes/booking');
require('dotenv').config();  // This must be at the top of the file



dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());  // Middleware to parse JSON request bodies

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/flights', flightRoutes);
app.use('/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);
// app.use('/api/flights', flightRoutes);

// Basic route to test server
app.get('/', (req, res) => {
  res.send('Airline Booking System API');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
