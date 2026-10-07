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

// In-memory fallback store for local development if Supabase credentials are not connected yet
const localUsers = [];

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
      return res.status(201).json({
        message: 'User registered successfully via Supabase',
        user: data.user,
        session: data.session
      });
    }

    // Mock Mode
    const existing = localUsers.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
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
      message: 'User registered successfully (Local Mock Mode)',
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
      return res.json({
        message: 'Login successful via Supabase',
        user: data.user,
        session: data.session
      });
    }

    // Mock Mode
    const user = localUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '24h'
    });

    const { password: _, ...userSafe } = user;
    res.json({
      message: 'Login successful (Local Mock Mode)',
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
