const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { supabase } = require('./supabaseClient');

dotenv.config();

const app = express();
const PORT = process.env.AUTH_PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'salon_secret_key_12345';

app.use(cors());
app.use(express.json());

// Seeded demo accounts matching 4 Target Actors in GlowSync
const localUsers = [
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
  // Backwards compatibility aliases
  { id: 'usr_legacy_1', email: 'owner@luxesalon.com', password: 'admin123', fullName: 'Sarah Olsen', role: 'admin', phone: '+1-555-0100', createdAt: new Date().toISOString() },
  { id: 'usr_legacy_2', email: 'stylist@luxesalon.com', password: 'stylist123', fullName: 'Elena Rostova', role: 'stylist', phone: '+1-555-0101', createdAt: new Date().toISOString() },
  { id: 'usr_legacy_3', email: 'client@luxesalon.com', password: 'client123', fullName: 'Alice Walker', role: 'customer', phone: '+1-555-0102', createdAt: new Date().toISOString() }
];

// Health Check
app.get('/api/auth/health', (req, res) => {
  res.json({
    service: 'auth-service',
    status: 'healthy',
    supabaseConnected: !!supabase,
    timestamp: new Date().toISOString()
  });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, role = 'customer', phone } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { fullName, role, phone }
        }
      });

      if (error) throw error;
      const userPayload = {
        id: data.user?.id,
        email: data.user?.email || email,
        fullName: data.user?.user_metadata?.fullName || fullName || email.split('@')[0],
        role: data.user?.user_metadata?.role || role,
        phone: data.user?.user_metadata?.phone || phone || ''
      };
      return res.status(201).json({
        message: 'User registered successfully via Supabase',
        user: userPayload,
        token: data.session?.access_token || '',
        session: data.session
      });
    }

    // Mock Mode
    const existing = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      email,
      fullName: fullName || email.split('@')[0],
      role, // customer, stylist, admin
      phone: phone || '',
      createdAt: new Date().toISOString()
    };
    localUsers.push({ ...newUser, password });

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
      expiresIn: '24h'
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token
    });
  } catch (err) {
    console.error('[Auth Error - Register]:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      const userPayload = {
        id: data.user?.id,
        email: data.user?.email,
        fullName: data.user?.user_metadata?.fullName || data.user?.email?.split('@')[0],
        role: data.user?.user_metadata?.role || 'customer',
        phone: data.user?.user_metadata?.phone || ''
      };
      return res.json({
        message: 'Login successful via Supabase',
        user: userPayload,
        token: data.session?.access_token || '',
        session: data.session
      });
    }

    // Mock Mode
    const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '24h'
    });

    const { password: _, ...userSafe } = user;
    res.json({
      message: 'Login successful',
      user: userSafe,
      token
    });
  } catch (err) {
    console.error('[Auth Error - Login]:', err.message);
    res.status(401).json({ error: err.message });
  }
});

// Get Current Profile / Verify Token
app.get('/api/auth/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      return res.json({ user });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Auth Service] Running on port ${PORT}`);
});
