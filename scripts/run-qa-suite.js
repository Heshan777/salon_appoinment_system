/**
 * Automated End-to-End QA Test Suite for Salon Management Microservices
 * Tests all 7 microservices across all features & architectural isolation
 */

const BASE_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

const results = [];

function record(suite, testName, passed, details) {
  results.push({ suite, testName, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${icon}] [${suite}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runQA() {
  console.log('================================================================');
  console.log('🧪 Starting Full System QA Audit - Salon Management Microservices');
  console.log('================================================================\n');

  // -----------------------------------------------------------
  // SUITE 1: MICROSERVICE HEALTH & DISCOVERY
  // -----------------------------------------------------------
  console.log('--- 1. Microservices Health & Discovery Audit ---');
  const healthEndpoints = [
    { name: 'API Gateway', path: '/health' },
    { name: 'Auth Service', path: '/api/auth/health' },
    { name: 'Booking Service', path: '/api/bookings/health' },
    { name: 'Catalog Service', path: '/api/catalog/health' },
    { name: 'Payment Service', path: '/api/payments/health' },
    { name: 'Notification Service', path: '/api/notifications/health' },
    { name: 'AI Assistant Service', path: '/api/ai/health' }
  ];

  for (const ep of healthEndpoints) {
    const t0 = performance.now();
    try {
      const res = await request(ep.path);
      const latency = Math.round(performance.now() - t0);
      const isHealthy = res.status === 200 && res.data?.status === 'healthy';
      record('Health & Discovery', ep.name, isHealthy, `${latency}ms`);
    } catch (err) {
      record('Health & Discovery', ep.name, false, err.message);
    }
  }

  // -----------------------------------------------------------
  // SUITE 2: AUTHENTICATION SERVICE AUDIT
  // -----------------------------------------------------------
  console.log('\n--- 2. Authentication & Identity Management Audit ---');
  const testUserEmail = `qa_user_${Date.now()}@test.com`;
  let userToken = '';
  let userId = '';

  // 2.1 Registration
  try {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'QA Test Customer',
        email: testUserEmail,
        password: 'Password123!',
        role: 'customer',
        phone: '+1-555-9000'
      })
    });
    const passed = res.status === 201 && (res.data?.user || res.data?.token);
    record('Auth Service', 'User Registration (POST /api/auth/register)', passed, `HTTP ${res.status}`);
  } catch (err) {
    record('Auth Service', 'User Registration', false, err.message);
  }

  // 2.2 Login with Valid Credentials
  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUserEmail, password: 'Password123!' })
    });
    userToken = res.data?.token || res.data?.session?.access_token || '';
    userId = res.data?.user?.id || '';
    const passed = res.status === 200 && !!userToken;
    record('Auth Service', 'Valid Login & Token Grant (POST /api/auth/login)', passed, `Token Length: ${userToken.length}`);
  } catch (err) {
    record('Auth Service', 'Valid Login', false, err.message);
  }

  // 2.3 Login with Invalid Credentials
  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUserEmail, password: 'WrongPassword999' })
    });
    const passed = res.status === 401;
    record('Auth Service', 'Invalid Credentials Rejection', passed, `HTTP ${res.status}`);
  } catch (err) {
    record('Auth Service', 'Invalid Credentials Rejection', false, err.message);
  }

  // 2.4 Profile verification with Bearer Token
  try {
    const res = await request('/api/auth/profile', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const passed = res.status === 200 && res.data?.user;
    record('Auth Service', 'Bearer Token Profile Inspection (GET /api/auth/profile)', passed, `User ID: ${res.data?.user?.id || userId}`);
  } catch (err) {
    record('Auth Service', 'Profile Inspection with Token', false, err.message);
  }

  // 2.5 Seeded Demo Profiles
  try {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'owner@luxesalon.com', password: 'admin123' })
    });
    const passed = res.status === 200 && res.data?.user?.role === 'admin';
    record('Auth Service', 'Seeded Demo Profile (Owner / Admin)', passed, `Role: ${res.data?.user?.role}`);
  } catch (err) {
    record('Auth Service', 'Seeded Demo Profile', false, err.message);
  }

  // -----------------------------------------------------------
  // SUITE 3: CATALOG & SERVICES AUDIT
  // -----------------------------------------------------------
  console.log('\n--- 3. Catalog & Master Data Service Audit ---');
  let firstService = null;
  let firstStaff = null;

  try {
    const res = await request('/api/catalog/services');
    const services = res.data?.services || [];
    firstService = services[0];
    const passed = res.status === 200 && services.length > 0;
    record('Catalog Service', 'List Salon Treatments (GET /api/catalog/services)', passed, `${services.length} services loaded`);
  } catch (err) {
    record('Catalog Service', 'List Services', false, err.message);
  }

  try {
    const res = await request('/api/catalog/staff');
    const staff = res.data?.staff || [];
    firstStaff = staff[0];
    const passed = res.status === 200 && staff.length > 0;
    record('Catalog Service', 'List Stylists & Artisans (GET /api/catalog/staff)', passed, `${staff.length} staff loaded`);
  } catch (err) {
    record('Catalog Service', 'List Staff', false, err.message);
  }

  try {
    const res = await request('/api/catalog/services', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Aromatherapy Hair Spa',
        category: 'Hair',
        durationMinutes: 50,
        price: 55,
        description: 'Deep revitalizing essential oil bath'
      })
    });
    const passed = res.status === 201;
    record('Catalog Service', 'Create New Treatment (POST /api/catalog/services)', passed, `HTTP ${res.status}`);
  } catch (err) {
    record('Catalog Service', 'Create Treatment', false, err.message);
  }

  // -----------------------------------------------------------
  // SUITE 4: BOOKING SERVICE AUDIT
  // -----------------------------------------------------------
  console.log('\n--- 4. Booking & Appointment Microservice Audit ---');
  let createdBookingId = '';
  const appointmentSlot = new Date(Date.now() + 86400000 * 3); // 3 days ahead
  appointmentSlot.setHours(14, 0, 0, 0);

  try {
    const res = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'QA Test Customer',
        customerEmail: testUserEmail,
        customerPhone: '+1-555-9000',
        serviceId: firstService?._id || 'srv_1',
        serviceName: firstService?.name || 'Classic Haircut & Styling',
        staffId: firstStaff?._id || 'stf_1',
        staffName: firstStaff?.name || 'Sarah Jenkins',
        appointmentDate: appointmentSlot.toISOString(),
        durationMinutes: 45,
        totalPrice: firstService?.price || 35,
        notes: 'Automated QA suite test appointment'
      })
    });
    createdBookingId = res.data?.booking?._id || '';
    const passed = res.status === 201 && !!createdBookingId;
    record('Booking Service', 'Create Appointment (POST /api/bookings)', passed, `ID: ${createdBookingId}`);
  } catch (err) {
    record('Booking Service', 'Create Appointment', false, err.message);
  }

  // 4.2 Query Bookings
  try {
    const res = await request('/api/bookings');
    const bookings = res.data?.bookings || [];
    const passed = res.status === 200 && bookings.length > 0;
    record('Booking Service', 'Query Appointments (GET /api/bookings)', passed, `${bookings.length} appointments total`);
  } catch (err) {
    record('Booking Service', 'Query Appointments', false, err.message);
  }

  // 4.3 Slot Conflict Validation
  try {
    const res = await request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Second Client',
        customerEmail: 'second@client.com',
        serviceId: firstService?._id || 'srv_1',
        serviceName: firstService?.name || 'Classic Haircut & Styling',
        staffId: firstStaff?._id || 'stf_1',
        staffName: firstStaff?.name || 'Sarah Jenkins',
        appointmentDate: appointmentSlot.toISOString(), // Same stylist & exact same time
        durationMinutes: 45,
        totalPrice: 35
      })
    });
    // Should detect time conflict (HTTP 409) or prevent double booking
    const passed = res.status === 409;
    record('Booking Service', 'Time Slot Conflict Prevention (409 Conflict)', passed, `HTTP ${res.status}`);
  } catch (err) {
    record('Booking Service', 'Conflict Detection', false, err.message);
  }

  // 4.4 Update Booking Status
  try {
    const res = await request(`/api/bookings/${createdBookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' })
    });
    const passed = res.status === 200 && res.data?.booking?.status === 'completed';
    record('Booking Service', 'Update Status (PATCH /api/bookings/:id/status)', passed, `Status: completed`);
  } catch (err) {
    record('Booking Service', 'Update Status', false, err.message);
  }

  // -----------------------------------------------------------
  // SUITE 5: PAYMENT SERVICE AUDIT
  // -----------------------------------------------------------
  console.log('\n--- 5. Payment Processing Microservice Audit ---');
  let checkoutTxnId = '';
  try {
    const res = await request('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({
        appointmentId: createdBookingId || 'apt_test_1',
        customerEmail: testUserEmail,
        amount: 35,
        paymentMethod: 'card'
      })
    });
    checkoutTxnId = res.data?.transaction?.id || '';
    const passed = res.status === 201 && res.data?.transaction?.status === 'succeeded';
    record('Payment Service', 'Checkout Transaction (POST /api/payments/checkout)', passed, `Txn ID: ${checkoutTxnId}`);
  } catch (err) {
    record('Payment Service', 'Checkout Transaction', false, err.message);
  }

  try {
    const res = await request('/api/payments/transactions');
    const passed = res.status === 200 && Array.isArray(res.data?.transactions) && res.data?.totalRevenue !== undefined;
    record('Payment Service', 'Global Financials Ledger (GET /api/payments/transactions)', passed, `Gross Volume: $${res.data?.totalRevenue}`);
  } catch (err) {
    record('Payment Service', 'Global Ledger', false, err.message);
  }

  try {
    const res = await request(`/api/payments/transactions/${createdBookingId || 'apt_test_1'}`);
    const passed = res.status === 200 && res.data?.count >= 1;
    record('Payment Service', 'Appointment Ledger Lookup (GET /api/payments/transactions/:id)', passed, `${res.data?.count} transactions found`);
  } catch (err) {
    record('Payment Service', 'Appointment Ledger Lookup', false, err.message);
  }

  try {
    const res = await request('/api/payments/refund', {
      method: 'POST',
      body: JSON.stringify({
        transactionId: checkoutTxnId,
        reason: 'Automated QA suite refund test'
      })
    });
    const passed = res.status === 200 && res.data?.transaction?.status === 'refunded';
    record('Payment Service', 'Transaction Refund (POST /api/payments/refund)', passed, `Refunded Txn: ${checkoutTxnId}`);
  } catch (err) {
    record('Payment Service', 'Transaction Refund', false, err.message);
  }

  // -----------------------------------------------------------
  // SUITE 6: NOTIFICATION SERVICE AUDIT
  // -----------------------------------------------------------
  console.log('\n--- 6. Notification Dispatch Microservice Audit ---');
  try {
    const res = await request('/api/notifications/send-confirmation', {
      method: 'POST',
      body: JSON.stringify({
        recipientEmail: testUserEmail,
        recipientPhone: '+1-555-9000',
        customerName: 'QA Test Customer',
        serviceName: 'Classic Haircut & Styling',
        staffName: 'Sarah Jenkins',
        appointmentDate: appointmentSlot.toLocaleString()
      })
    });
    const passed = res.status === 200 && res.data?.notification?.status === 'delivered';
    record('Notification Service', 'Dispatch Confirmation (POST /api/notifications/send-confirmation)', passed, `Channel: ${res.data?.notification?.channel}`);
  } catch (err) {
    record('Notification Service', 'Dispatch Confirmation', false, err.message);
  }

  try {
    const res = await request('/api/notifications/send-cancellation', {
      method: 'POST',
      body: JSON.stringify({
        recipientEmail: testUserEmail,
        customerName: 'QA Test Customer',
        serviceName: 'Classic Haircut & Styling',
        appointmentDate: appointmentSlot.toLocaleString(),
        reason: 'Customer schedule change'
      })
    });
    const passed = res.status === 200 && res.data?.notification?.type === 'booking_cancellation';
    record('Notification Service', 'Dispatch Cancellation (POST /api/notifications/send-cancellation)', passed, 'Delivered email update');
  } catch (err) {
    record('Notification Service', 'Dispatch Cancellation', false, err.message);
  }

  try {
    const res = await request('/api/notifications/logs');
    const logs = res.data?.logs || [];
    const passed = res.status === 200 && logs.length > 0;
    record('Notification Service', 'Notification Audit Log (GET /api/notifications/logs)', passed, `${logs.length} dispatch logs`);
  } catch (err) {
    record('Notification Service', 'Audit Log', false, err.message);
  }

  // -----------------------------------------------------------
  // SUITE 7: AI ASSISTANT SERVICE AUDIT
  // -----------------------------------------------------------
  console.log('\n--- 7. Gemini AI Assistant Service Audit ---');
  try {
    const res = await request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'What haircut services do you offer?' })
    });
    const passed = res.status === 200 && !!res.data?.reply;
    record('AI Assistant Service', 'Conversational Chat (POST /api/ai/chat)', passed, `Reply length: ${res.data?.reply?.length}`);
  } catch (err) {
    record('AI Assistant Service', 'Conversational Chat', false, err.message);
  }

  try {
    const res = await request('/api/ai/parse-intent', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'Book a haircut with Sarah tomorrow at 3pm' })
    });
    const passed = res.status === 200 && res.data?.intent;
    record('AI Assistant Service', 'Autonomous Intent Extraction (POST /api/ai/parse-intent)', passed, `Service: ${res.data?.intent?.service || 'parsed'}`);
  } catch (err) {
    record('AI Assistant Service', 'Intent Extraction', false, err.message);
  }

  // -----------------------------------------------------------
  // SUITE 8: FRONTEND USER EXPERIENCE & STATIC ASSETS
  // -----------------------------------------------------------
  console.log('\n--- 8. Frontend User Experience & Static Assets Audit ---');
  try {
    const res = await request('/');
    const passed = res.status === 200 && res.data?.includes('<div id="root">');
    record('Frontend Assets', 'React Single Page App HTML (GET /)', passed, 'Served by API Gateway');
  } catch (err) {
    record('Frontend Assets', 'React Single Page App HTML', false, err.message);
  }

  try {
    const res = await request('/portal.html');
    const passed = res.status === 200 && res.data?.includes('LUMIÈRE');
    record('Frontend Assets', 'Luxury Dark Portal HTML (GET /portal.html)', passed, 'Served by API Gateway');
  } catch (err) {
    record('Frontend Assets', 'Luxury Portal HTML', false, err.message);
  }

  // -----------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------
  const total = results.length;
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = total - passedCount;

  console.log('\n================================================================');
  console.log(`📊 QA AUDIT SUMMARY: ${passedCount}/${total} PASSED (${Math.round((passedCount/total)*100)}%)`);
  if (failedCount > 0) {
    console.log(`⚠️ ${failedCount} test(s) failed.`);
  } else {
    console.log('🎉 ALL FEATURES & MICROSERVICES VERIFIED OPERATIONAL & ROBUST!');
  }
  console.log('================================================================\n');

  return { total, passedCount, failedCount, results };
}

runQA();
