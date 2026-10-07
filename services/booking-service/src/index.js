const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Appointment } = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.BOOKING_PORT || 5002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_bookings';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// Fallback in-memory storage for immediate dev testing
const fallbackAppointments = [
  {
    _id: 'apt_sample_1',
    customerName: 'Alice Walker',
    customerEmail: 'alice@example.com',
    customerPhone: '+1-555-0199',
    serviceId: 'srv_1',
    serviceName: 'Classic Haircut & Styling',
    staffId: 'stf_1',
    staffName: 'Sarah Jenkins',
    appointmentDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    durationMinutes: 45,
    status: 'confirmed',
    totalPrice: 35,
    notes: 'Prefers layered cut',
    createdAt: new Date().toISOString()
  }
];

// Connect to MongoDB Atlas / Local MongoDB
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
  .then(() => {
    isMongoConnected = true;
    console.log('[Booking Service] Connected to MongoDB Atlas/Database.');
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`[Booking Service] MongoDB not reachable (${err.message}). Using local in-memory dataset.`);
  });

// Health check
app.get('/api/bookings/health', (req, res) => {
  res.json({
    service: 'booking-service',
    status: 'healthy',
    mongoConnected: isMongoConnected,
    timestamp: new Date().toISOString()
  });
});

// List all appointments with optional filters
app.get('/api/bookings', async (req, res) => {
  const { customerEmail, staffId, status, date } = req.query;

  try {
    if (isMongoConnected) {
      const filter = {};
      if (customerEmail) filter.customerEmail = customerEmail;
      if (staffId) filter.staffId = staffId;
      if (status) filter.status = status;
      if (date) {
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);
        filter.appointmentDate = { $gte: start, $lt: end };
      }

      const bookings = await Appointment.find(filter).sort({ appointmentDate: 1 });
      return res.json({ count: bookings.length, bookings });
    }

    // Fallback filter
    let results = [...fallbackAppointments];
    if (customerEmail) results = results.filter(b => b.customerEmail === customerEmail);
    if (staffId) results = results.filter(b => b.staffId === staffId);
    if (status) results = results.filter(b => b.status === status);

    res.json({ count: results.length, bookings: results, source: 'in-memory-cache' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get appointment by ID
app.get('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isMongoConnected) {
      const appointment = await Appointment.findById(id);
      if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
      return res.json({ appointment });
    }

    const appointment = fallbackAppointments.find(b => b._id === id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new appointment
app.post('/api/bookings', async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    serviceId,
    serviceName,
    staffId,
    staffName,
    appointmentDate,
    durationMinutes = 45,
    totalPrice,
    notes
  } = req.body;

  if (!customerName || !customerEmail || !serviceId || !serviceName || !appointmentDate || totalPrice === undefined) {
    return res.status(400).json({
      error: 'Missing required fields: customerName, customerEmail, serviceId, serviceName, appointmentDate, totalPrice'
    });
  }

  const requestedTime = new Date(appointmentDate);
  if (isNaN(requestedTime.getTime())) {
    return res.status(400).json({ error: 'Invalid appointmentDate format' });
  }

  try {
    if (isMongoConnected) {
      // Conflict check for same staff around same time window
      if (staffId && staffId !== 'any') {
        const conflictWindowStart = new Date(requestedTime.getTime() - durationMinutes * 60000);
        const conflictWindowEnd = new Date(requestedTime.getTime() + durationMinutes * 60000);

        const existingConflict = await Appointment.findOne({
          staffId,
          status: { $in: ['confirmed', 'pending'] },
          appointmentDate: { $gte: conflictWindowStart, $lte: conflictWindowEnd }
        });

        if (existingConflict) {
          return res.status(409).json({
            error: 'Time slot conflict',
            message: `Selected staff already has an appointment scheduled around this time.`
          });
        }
      }

      const newBooking = await Appointment.create({
        customerName,
        customerEmail,
        customerPhone,
        serviceId,
        serviceName,
        staffId,
        staffName,
        appointmentDate: requestedTime,
        durationMinutes,
        totalPrice,
        notes,
        status: 'confirmed'
      });

      return res.status(201).json({
        message: 'Appointment booked successfully',
        booking: newBooking
      });
    }

    // In-memory mode
    const newBooking = {
      _id: `apt_${Date.now()}`,
      customerName,
      customerEmail,
      customerPhone,
      serviceId,
      serviceName,
      staffId: staffId || 'any',
      staffName: staffName || 'Any Available Stylist',
      appointmentDate: requestedTime.toISOString(),
      durationMinutes,
      totalPrice,
      notes: notes || '',
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    fallbackAppointments.push(newBooking);

    res.status(201).json({
      message: 'Appointment booked successfully (in-memory)',
      booking: newBooking
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update appointment status
app.patch('/api/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    if (isMongoConnected) {
      const updated = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
      if (!updated) return res.status(404).json({ error: 'Appointment not found' });
      return res.json({ message: 'Status updated', booking: updated });
    }

    const booking = fallbackAppointments.find(b => b._id === id);
    if (!booking) return res.status(404).json({ error: 'Appointment not found' });
    booking.status = status;
    res.json({ message: 'Status updated (in-memory)', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Booking Service] Running on port ${PORT}`);
});
