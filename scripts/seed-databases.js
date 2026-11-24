/**
 * Master Database Seeder - SalonSync Cloud Microservices
 * Seeds rich demo data across all independent microservice databases:
 * 1. salon_auth          (Auth Service - Users & RBAC)
 * 2. salon_bookings      (Booking Service - Appointments & Schedule)
 * 3. salon_catalog       (Catalog Service - Services & Specialists)
 * 4. salon_payments      (Payment Service - Financial Transactions & Refunds)
 * 5. salon_notifications (Notification Service - SMS & Email Delivery Logs)
 * 6. salon_inventory     (Inventory Service - Warehouse Stock & Consumption Logs)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', 'services', 'booking-service', '.env') });

const ATLAS_BASE = process.env.MONGODB_URI 
  ? process.env.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/{DB}$1')
  : 'mongodb://localhost:27017/{DB}';

const getUri = (dbName) => ATLAS_BASE.replace('{DB}', dbName);

// Demo Datasets
const authUsers = [
  {
    id: 'usr_admin_1',
    email: 'owner@glowsync.com',
    password: 'admin123',
    fullName: 'Sarah Olsen',
    role: 'admin',
    phone: '+1-555-0100',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_reception_1',
    email: 'reception@glowsync.com',
    password: 'reception123',
    fullName: 'Chloe Bennett',
    role: 'receptionist',
    phone: '+1-555-0105',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_stylist_1',
    email: 'stylist@glowsync.com',
    password: 'stylist123',
    fullName: 'Elena Rostova',
    role: 'stylist',
    phone: '+1-555-0101',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_customer_1',
    email: 'client@glowsync.com',
    password: 'client123',
    fullName: 'Alice Walker',
    role: 'customer',
    phone: '+1-555-0102',
    createdAt: new Date().toISOString()
  },
  { id: 'usr_legacy_1', email: 'owner@luxesalon.com', password: 'admin123', fullName: 'Sarah Olsen', role: 'admin', phone: '+1-555-0100', createdAt: new Date().toISOString() },
  { id: 'usr_legacy_2', email: 'stylist@luxesalon.com', password: 'stylist123', fullName: 'Elena Rostova', role: 'stylist', phone: '+1-555-0101', createdAt: new Date().toISOString() },
  { id: 'usr_legacy_3', email: 'client@luxesalon.com', password: 'client123', fullName: 'Alice Walker', role: 'customer', phone: '+1-555-0102', createdAt: new Date().toISOString() }
];

const catalogServices = [
  { _id: '6ac74530d318f677699faca6', name: 'Classic Haircut & Styling', category: 'Hair', durationMinutes: 45, price: 35, description: 'Shampoo, precision cut, and blowdry styling.', imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: '6ac74530d318f677699faca7', name: 'Deluxe Facial Treatment', category: 'Skincare', durationMinutes: 60, price: 75, description: 'Deep botanical cleansing and hydration facial.', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: '6ac74530d318f677699faca8', name: 'Gel Manicure & Pedicure', category: 'Nails', durationMinutes: 75, price: 60, description: 'Long-lasting vegan gel polish and spa treatment.', imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: '6ac74530d318f677699faca9', name: 'Balayage Color & Highlights', category: 'Hair', durationMinutes: 120, price: 140, description: 'Custom hand-painted highlights and gloss treatment.', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: '6ac74530d318f677699facaa', name: 'Bridal Haute Coiffure', category: 'Bridal', durationMinutes: 150, price: 210, description: 'Full wedding day hair styling, trial run, and makeup.', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80', isActive: true },
  { _id: '6ac7972f1f9ce3521ddc87a8', name: 'Aromatherapy Hair Spa', category: 'Hair', durationMinutes: 60, price: 65, description: 'Organic botanical oil massage and scalp renewal.', imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80', isActive: true }
];

const catalogStaff = [
  { _id: '6ac74530d318f677699facb1', name: 'Sarah Jenkins', email: 'sarah@salon.com', specialties: ['Hair', 'Bridal'], workingHours: { start: '09:00', end: '17:00', daysOff: ['Sunday'] }, isActive: true },
  { _id: '6ac74530d318f677699facb2', name: 'David Kim', email: 'david@salon.com', specialties: ['Skincare', 'Massage'], workingHours: { start: '10:00', end: '18:00', daysOff: ['Monday'] }, isActive: true },
  { _id: '6ac74530d318f677699facb3', name: 'Elena Rostova', email: 'elena@salon.com', specialties: ['Color', 'Nails', 'Styling'], workingHours: { start: '11:00', end: '19:00', daysOff: ['Tuesday'] }, isActive: true }
];

const bookingAppointments = [
  {
    _id: '6ac74530d318f677699facc1',
    customerName: 'Alice Walker',
    customerEmail: 'client@glowsync.com',
    customerPhone: '+1-555-0102',
    serviceId: '6ac74530d318f677699faca6',
    serviceName: 'Classic Haircut & Styling',
    staffId: '6ac74530d318f677699facb1',
    staffName: 'Sarah Jenkins',
    appointmentDate: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 45,
    status: 'confirmed',
    totalPrice: 35,
    notes: 'Prefers soft layers and light blowout.',
    createdAt: new Date().toISOString()
  },
  {
    _id: '6ac74530d318f677699facc2',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus@example.com',
    customerPhone: '+1-555-0199',
    serviceId: '6ac74530d318f677699faca7',
    serviceName: 'Deluxe Facial Treatment',
    staffId: '6ac74530d318f677699facb2',
    staffName: 'David Kim',
    appointmentDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    durationMinutes: 60,
    status: 'confirmed',
    totalPrice: 75,
    notes: 'Sensitive skin treatment protocol requested.',
    createdAt: new Date().toISOString()
  },
  {
    _id: '6ac74530d318f677699facc3',
    customerName: 'Sophia Martinez',
    customerEmail: 'sophia.m@example.com',
    customerPhone: '+1-555-0211',
    serviceId: '6ac74530d318f677699faca9',
    serviceName: 'Balayage Color & Highlights',
    staffId: '6ac74530d318f677699facb3',
    staffName: 'Elena Rostova',
    appointmentDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    durationMinutes: 120,
    status: 'confirmed',
    totalPrice: 140,
    notes: 'Full blonde balayage with gloss toner.',
    createdAt: new Date().toISOString()
  },
  {
    _id: '6ac74530d318f677699facc4',
    customerName: 'Chloe Bennett',
    customerEmail: 'reception@glowsync.com',
    customerPhone: '+1-555-0105',
    serviceId: '6ac74530d318f677699faca8',
    serviceName: 'Gel Manicure & Pedicure',
    staffId: '6ac74530d318f677699facb3',
    staffName: 'Elena Rostova',
    appointmentDate: new Date(Date.now() - 86400000).toISOString(),
    durationMinutes: 75,
    status: 'completed',
    totalPrice: 60,
    notes: 'Completed session on Tuesday.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const paymentTransactions = [
  {
    id: 'txn_1001',
    appointmentId: '6ac74530d318f677699facc1',
    customerEmail: 'client@glowsync.com',
    amount: 35,
    currency: 'USD',
    paymentMethod: 'card',
    status: 'succeeded',
    receiptUrl: 'https://mock-payments.salon.internal/receipts/txn_1001',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'txn_1002',
    appointmentId: '6ac74530d318f677699facc2',
    customerEmail: 'marcus@example.com',
    amount: 75,
    currency: 'USD',
    paymentMethod: 'apple_pay',
    status: 'succeeded',
    receiptUrl: 'https://mock-payments.salon.internal/receipts/txn_1002',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'txn_1003',
    appointmentId: '6ac74530d318f677699facc3',
    customerEmail: 'sophia.m@example.com',
    amount: 140,
    currency: 'USD',
    paymentMethod: 'card',
    status: 'succeeded',
    receiptUrl: 'https://mock-payments.salon.internal/receipts/txn_1003',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'txn_1004',
    appointmentId: '6ac74530d318f677699facc4',
    customerEmail: 'reception@glowsync.com',
    amount: 60,
    currency: 'USD',
    paymentMethod: 'card',
    status: 'succeeded',
    receiptUrl: 'https://mock-payments.salon.internal/receipts/txn_1004',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'txn_1005',
    appointmentId: 'apt_refunded_demo',
    customerEmail: 'guest@example.com',
    amount: 65,
    currency: 'USD',
    paymentMethod: 'card',
    status: 'refunded',
    refundReason: 'Customer requested reschedule',
    receiptUrl: 'https://mock-payments.salon.internal/receipts/txn_1005',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

const notificationLogs = [
  {
    id: 'notif_1001',
    type: 'booking_confirmation',
    recipientEmail: 'client@glowsync.com',
    recipientPhone: '+1-555-0102',
    message: 'Dear Alice Walker, your appointment for Classic Haircut & Styling with Sarah Jenkins is confirmed!',
    channel: 'SMS & Email',
    status: 'delivered',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'notif_1002',
    type: 'appointment_reminder',
    recipientEmail: 'marcus@example.com',
    recipientPhone: null,
    message: 'Reminder: Hello Marcus Vance, your salon appointment for Deluxe Facial Treatment is coming up.',
    channel: 'Email',
    status: 'delivered',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif_1003',
    type: 'booking_confirmation',
    recipientEmail: 'sophia.m@example.com',
    recipientPhone: '+1-555-0211',
    message: 'Dear Sophia Martinez, your appointment for Balayage Color & Highlights with Elena Rostova is confirmed!',
    channel: 'SMS & Email',
    status: 'delivered',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const inventoryStock = [
  { id: 'inv_1', name: 'Botanical Hair Toner', category: 'Hair Color & Chemistry', quantity: 2400, unit: 'ml', minThreshold: 500, unitCost: 0.12, location: 'Color Bar Shelf A' },
  { id: 'inv_2', name: 'Keratin Smoothing Solution', category: 'Hair Treatments', quantity: 1800, unit: 'ml', minThreshold: 300, unitCost: 0.25, location: 'Color Bar Shelf B' },
  { id: 'inv_3', name: 'Organic Argan Scalp Oil', category: 'Hair Treatments', quantity: 1200, unit: 'ml', minThreshold: 200, unitCost: 0.18, location: 'Spa Room Cabinet 1' },
  { id: 'inv_4', name: 'Deluxe Collagen Facial Mask', category: 'Skincare', quantity: 42, unit: 'units', minThreshold: 10, unitCost: 4.50, location: 'Facial Suite Cooler' },
  { id: 'inv_5', name: 'Vegan Gel Polish Base Coat', category: 'Nails', quantity: 35, unit: 'bottles', minThreshold: 8, unitCost: 8.00, location: 'Nail Station Station 3' },
  { id: 'inv_6', name: 'Bleach Powder & Developer', category: 'Hair Color & Chemistry', quantity: 3800, unit: 'g', minThreshold: 800, unitCost: 0.05, location: 'Color Bar Dispenser' }
];

const inventoryConsumptionLogs = [
  {
    id: 'log_1001',
    appointmentId: '6ac74530d318f677699facc1',
    stylistName: 'Sarah Jenkins',
    customerName: 'Alice Walker',
    serviceName: 'Classic Haircut & Styling',
    items: [
      { itemId: 'inv_3', name: 'Organic Argan Scalp Oil', amountUsed: 15, unit: 'ml', cost: 2.70 }
    ],
    totalCost: 2.70,
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'log_1002',
    appointmentId: '6ac74530d318f677699facc4',
    stylistName: 'Elena Rostova',
    customerName: 'Chloe Bennett',
    serviceName: 'Gel Manicure & Pedicure',
    items: [
      { itemId: 'inv_5', name: 'Vegan Gel Polish Base Coat', amountUsed: 1, unit: 'bottles', cost: 8.00 }
    ],
    totalCost: 8.00,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

async function seedDatabase(dbName, collections) {
  const uri = getUri(dbName);
  console.log(`\n⏳ Connecting to isolated DB [${dbName}]...`);
  
  const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 8000 }).asPromise();
  console.log(`  ✓ Connected to [${dbName}]`);

  for (const { name, data, schema } of collections) {
    const Model = conn.model(name, schema || new mongoose.Schema({}, { strict: false }), name);
    await Model.deleteMany({});
    const res = await Model.insertMany(data);
    console.log(`  ✓ Seeded collection '${name}': ${res.length} documents inserted.`);
  }

  await conn.close();
}

async function run() {
  console.log('================================================================');
  console.log('🌱 Starting Master Database Seeding for Microservices (Database-per-Service)');
  console.log('================================================================');

  try {
    // 1. Auth Service Database: salon_auth
    await seedDatabase('salon_auth', [
      { name: 'users', data: authUsers }
    ]);

    // 2. Booking Service Database: salon_bookings
    await seedDatabase('salon_bookings', [
      { name: 'appointments', data: bookingAppointments }
    ]);

    // 3. Catalog Service Database: salon_catalog
    await seedDatabase('salon_catalog', [
      { name: 'services', data: catalogServices },
      { name: 'staff', data: catalogStaff }
    ]);

    // 4. Payment Service Database: salon_payments
    await seedDatabase('salon_payments', [
      { name: 'transactions', data: paymentTransactions }
    ]);

    // 5. Notification Service Database: salon_notifications
    await seedDatabase('salon_notifications', [
      { name: 'dispatch_logs', data: notificationLogs }
    ]);

    // 6. Inventory Service Database: salon_inventory
    await seedDatabase('salon_inventory', [
      { name: 'stock_items', data: inventoryStock },
      { name: 'consumption_logs', data: inventoryConsumptionLogs }
    ]);

    console.log('\n================================================================');
    console.log('🎉 ALL 6 SEPARATE MICROSERVICE DATABASES SEEDED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding error:', err.message);
    process.exit(1);
  }
}

run();
