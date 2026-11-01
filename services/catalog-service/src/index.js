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
  { _id: 'srv_1', name: 'Classic Haircut & Styling', category: 'Hair', durationMinutes: 45, price: 35, description: 'Shampoo, precision cut, and blowdry styling.', imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: 'srv_2', name: 'Deluxe Facial Treatment', category: 'Skincare', durationMinutes: 60, price: 75, description: 'Deep botanical cleansing and hydration facial.', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: 'srv_3', name: 'Gel Manicure & Pedicure', category: 'Nails', durationMinutes: 75, price: 60, description: 'Long-lasting vegan gel polish and spa treatment.', imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: 'srv_4', name: 'Balayage Color & Highlights', category: 'Hair', durationMinutes: 120, price: 140, description: 'Custom hand-painted highlights and gloss treatment.', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: 'srv_5', name: 'Bridal Haute Coiffure', category: 'Bridal', durationMinutes: 150, price: 210, description: 'Full wedding day hair styling, trial run, and makeup.', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: 'srv_6', name: 'Aromatherapy Hair Spa', category: 'Hair', durationMinutes: 60, price: 65, description: 'Organic botanical oil massage and scalp renewal.', imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80', isActive: true }
];

const fallbackStaff = [
  { _id: 'stf_1', name: 'Sarah Jenkins', email: 'sarah@salon.com', specialties: ['Hair', 'Bridal'], workingHours: { start: '09:00', end: '17:00', daysOff: ['Sunday'] }, isActive: true },
  { _id: 'stf_2', name: 'David Kim', email: 'david@salon.com', specialties: ['Skincare', 'Massage'], workingHours: { start: '10:00', end: '18:00', daysOff: ['Monday'] }, isActive: true }
];

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    isMongoConnected = true;
    console.log('[Catalog Service] Connected to MongoDB Atlas/Database.');
    await seedCatalogIfEmpty();
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`[Catalog Service] MongoDB not reachable (${err.message}). Using local in-memory dataset.`);
  });

async function seedCatalogIfEmpty() {
  try {
    const serviceCount = await ServiceItem.countDocuments();
    if (serviceCount === 0) {
      await ServiceItem.insertMany([
        { name: 'Classic Haircut & Styling', category: 'Hair', durationMinutes: 45, price: 35, description: 'Shampoo, precision cut, and blowdry styling.', imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80', isActive: true },
        { name: 'Deluxe Facial Treatment', category: 'Skincare', durationMinutes: 60, price: 75, description: 'Deep botanical cleansing and hydration facial.', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80', isActive: true },
        { name: 'Gel Manicure & Pedicure', category: 'Nails', durationMinutes: 75, price: 60, description: 'Long-lasting vegan gel polish and spa treatment.', imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80', isActive: true },
        { name: 'Balayage Color & Highlights', category: 'Hair', durationMinutes: 120, price: 140, description: 'Custom hand-painted highlights and gloss treatment.', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', isActive: true },
        { name: 'Bridal Haute Coiffure', category: 'Bridal', durationMinutes: 150, price: 210, description: 'Full wedding day hair styling, trial run, and makeup.', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80', isActive: true },
        { name: 'Aromatherapy Hair Spa', category: 'Hair', durationMinutes: 60, price: 65, description: 'Organic botanical oil massage and scalp renewal.', imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80', isActive: true }
      ]);
      console.log('[Catalog Service] Seeded default services with imagery into MongoDB Atlas.');
    } else {
      // Update any existing services that lack imageUrl
      const defaultImages = {
        'Classic Haircut & Styling': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
        'Deluxe Facial Treatment': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
        'Gel Manicure & Pedicure': 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
        'Balayage Color & Highlights': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
        'Bridal Haute Coiffure': 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'
      };
      for (const [sName, sImg] of Object.entries(defaultImages)) {
        await ServiceItem.updateOne(
          { name: sName, $or: [{ imageUrl: { $exists: false } }, { imageUrl: '' }, { imageUrl: null }] },
          { $set: { imageUrl: sImg } }
        );
      }
    }

    const staffCount = await StaffMember.countDocuments();
    if (staffCount === 0) {
      await StaffMember.insertMany([
        { name: 'Sarah Jenkins', email: 'sarah@salon.com', specialties: ['Hair', 'Bridal', 'Color'], workingHours: { start: '09:00', end: '17:00', daysOff: ['Sunday'] }, isActive: true },
        { name: 'David Kim', email: 'david@salon.com', specialties: ['Skincare', 'Massage'], workingHours: { start: '10:00', end: '18:00', daysOff: ['Monday'] }, isActive: true },
        { name: 'Elena Rostova', email: 'elena@salon.com', specialties: ['Nails', 'Lashes'], workingHours: { start: '09:30', end: '17:30', daysOff: [] }, isActive: true }
      ]);
      console.log('[Catalog Service] Seeded default staff into MongoDB Atlas.');
    }
  } catch (err) {
    console.warn('[Catalog Service] Auto-seed note:', err.message);
  }
}

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
    const { name, category, durationMinutes, price, description, imageUrl } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    if (isMongoConnected) {
      const newService = await ServiceItem.create({ name, category, durationMinutes, price, description, imageUrl: imageUrl || '' });
      return res.status(201).json({ message: 'Service created', service: newService });
    }

    const newService = {
      _id: `srv_${Date.now()}`,
      name,
      category: category || 'Hair',
      durationMinutes: durationMinutes || 45,
      price,
      description: description || '',
      imageUrl: imageUrl || '',
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

// Delete Service
app.delete('/api/catalog/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected) {
      const deleted = await ServiceItem.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Service not found' });
      return res.json({ message: 'Service deleted', service: deleted });
    }
    const idx = fallbackServices.findIndex(s => s._id === id);
    if (idx === -1) return res.status(404).json({ error: 'Service not found' });
    const deleted = fallbackServices.splice(idx, 1)[0];
    res.json({ message: 'Service deleted (in-memory)', service: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Staff
app.delete('/api/catalog/staff/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected) {
      const deleted = await StaffMember.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Staff member not found' });
      return res.json({ message: 'Staff member deleted', staff: deleted });
    }
    const idx = fallbackStaff.findIndex(s => s._id === id);
    if (idx === -1) return res.status(404).json({ error: 'Staff member not found' });
    const deleted = fallbackStaff.splice(idx, 1)[0];
    res.json({ message: 'Staff member deleted (in-memory)', staff: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Catalog Service] Running on port ${PORT}`);
});
