const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ServiceItem, StaffMember } = require('./models');

dotenv.config();

const app = express();
const PORT = process.env.CATALOG_PORT || 5003;
const MONGODB_URI = process.env.MONGODB_CATALOG_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_catalog';

app.use(cors());
app.use(express.json());

let isMongoConnected = false;

// In-memory fallback if Mongo is disconnected
const fallbackServices = [
  { _id: 'srv_1', name: 'Classic Haircut & Styling', category: 'Hair', durationMinutes: 45, price: 35, description: 'Shampoo, cut and blowdry styling', isActive: true },
  { _id: 'srv_2', name: 'Deluxe Facial Treatment', category: 'Skincare', durationMinutes: 60, price: 75, description: 'Deep cleansing and hydration facial', isActive: true },
  { _id: 'srv_3', name: 'Gel Manicure & Pedicure', category: 'Nails', durationMinutes: 75, price: 60, description: 'Long-lasting gel polish and spa treatment', isActive: true }
];

const fallbackStaff = [
  { _id: 'stf_1', name: 'Sarah Jenkins', email: 'sarah@salon.com', specialties: ['Hair', 'Bridal'], workingHours: { start: '09:00', end: '17:00', daysOff: ['Sunday'] }, isActive: true },
  { _id: 'stf_2', name: 'David Kim', email: 'david@salon.com', specialties: ['Skincare', 'Massage'], workingHours: { start: '10:00', end: '18:00', daysOff: ['Monday'] }, isActive: true }
];

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 })
  .then(() => {
    isMongoConnected = true;
    console.log('[Catalog Service] Connected to MongoDB Atlas/Database.');
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`[Catalog Service] MongoDB not reachable (${err.message}). Using local in-memory dataset.`);
  });

// Health check
app.get('/api/catalog/health', (req, res) => {
  res.json({
    service: 'catalog-service',
    status: 'healthy',
    mongoConnected: isMongoConnected,
    timestamp: new Date().toISOString()
  });
});

// Services routes
app.get('/api/catalog/services', async (req, res) => {
  try {
    if (isMongoConnected) {
      const services = await ServiceItem.find({ isActive: true });
      return res.json({ count: services.length, services });
    }
    res.json({ count: fallbackServices.length, services: fallbackServices, source: 'in-memory-cache' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/catalog/services', async (req, res) => {
  try {
    const { name, category, durationMinutes, price, description } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    if (isMongoConnected) {
      const newService = await ServiceItem.create({ name, category, durationMinutes, price, description });
      return res.status(201).json({ message: 'Service created', service: newService });
    }

    const newService = {
      _id: `srv_${Date.now()}`,
      name,
      category: category || 'Hair',
      durationMinutes: durationMinutes || 45,
      price,
      description: description || '',
      isActive: true
    };
    fallbackServices.push(newService);
    res.status(201).json({ message: 'Service created (in-memory)', service: newService });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staff routes
app.get('/api/catalog/staff', async (req, res) => {
  try {
    if (isMongoConnected) {
      const staff = await StaffMember.find({ isActive: true });
      return res.json({ count: staff.length, staff });
    }
    res.json({ count: fallbackStaff.length, staff: fallbackStaff, source: 'in-memory-cache' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/catalog/staff', async (req, res) => {
  try {
    const { name, email, specialties, workingHours } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (isMongoConnected) {
      const staff = await StaffMember.create({ name, email, specialties, workingHours });
      return res.status(201).json({ message: 'Staff member added', staff });
    }

    const staff = {
      _id: `stf_${Date.now()}`,
      name,
      email,
      specialties: specialties || [],
      workingHours: workingHours || { start: '09:00', end: '17:00', daysOff: [] },
      isActive: true
    };
    fallbackStaff.push(staff);
    res.status(201).json({ message: 'Staff member added (in-memory)', staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Catalog Service] Running on port ${PORT}`);
});
