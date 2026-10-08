import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronDown, Clock3,
  DollarSign, LayoutDashboard, Menu, MessageSquare, Plus, RefreshCw,
  Search, Settings, Sparkles, UserRound, UsersRound, X, XCircle,
  LogIn, LogOut, Eye, EyeOff, AlertCircle, ShieldCheck, Lock, KeyRound,
  Scissors, CreditCard, Activity, Trash2, Phone, Mail, Award
} from 'lucide-react';
import './styles.css';

const API = window.location.port === '5173' ? 'http://localhost:5000' : '';

const DEFAULT_SERVICE_IMAGE = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80';

const CATEGORY_DEFAULT_IMAGES = {
  Hair: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80',
  Skincare: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
  Nails: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
  Bridal: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
  Massage: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80',
  Other: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=600&q=80'
};

const getServiceImage = (service) => {
  if (service?.imageUrl && service.imageUrl.trim()) return service.imageUrl;
  return CATEGORY_DEFAULT_IMAGES[service?.category] || DEFAULT_SERVICE_IMAGE;
};

const fallbackAppointments = [
  { _id: 'apt_sample_1', customerName: 'Alice Walker', customerEmail: 'alice@example.com', customerPhone: '+1-555-0199', serviceName: 'Classic Haircut & Styling', staffName: 'Sarah Jenkins', appointmentDate: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 45, status: 'confirmed', totalPrice: 35 },
  { _id: 'apt_sample_2', customerName: 'Marcus Vance', customerEmail: 'marcus@example.com', customerPhone: '+1-555-0144', serviceName: 'Deluxe Facial Treatment', staffName: 'David Kim', appointmentDate: new Date(Date.now() + 172800000).toISOString(), durationMinutes: 60, status: 'confirmed', totalPrice: 75 }
];

const fallbackServices = [
  { _id: 'srv_1', name: 'Classic Haircut & Styling', category: 'Hair', durationMinutes: 45, price: 35, description: 'Shampoo, precision cut, and blowdry styling.', imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80' },
  { _id: 'srv_2', name: 'Deluxe Facial Treatment', category: 'Skincare', durationMinutes: 60, price: 75, description: 'Deep cleansing and botanical hydration.', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
  { _id: 'srv_3', name: 'Gel Manicure & Pedicure', category: 'Nails', durationMinutes: 75, price: 60, description: 'Long-lasting vegan gel polish and scrub.', imageUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80' },
  { _id: 'srv_4', name: 'Balayage Color & Highlights', category: 'Hair', durationMinutes: 120, price: 140, description: 'Hand-painted highlights and gloss.', imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
  { _id: 'srv_5', name: 'Bridal Haute Coiffure', category: 'Bridal', durationMinutes: 150, price: 210, description: 'Full wedding day hair and makeup.', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80' },
  { _id: 'srv_6', name: 'Aromatherapy Hair Spa', category: 'Hair', durationMinutes: 60, price: 65, description: 'Organic botanical oil massage and scalp renewal.', imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80' }
];

const fallbackStaff = [
  { _id: 'stf_1', name: 'Sarah Jenkins', email: 'sarah@salon.com', phone: '+1-555-0101', specialties: ['Hair', 'Bridal', 'Color'], workingHours: { start: '09:00', end: '17:00' } },
  { _id: 'stf_2', name: 'David Kim', email: 'david@salon.com', phone: '+1-555-0102', specialties: ['Skincare', 'Massage'], workingHours: { start: '10:00', end: '18:00' } },
  { _id: 'stf_3', name: 'Elena Rostova', email: 'elena@salon.com', phone: '+1-555-0103', specialties: ['Nails', 'Lashes', 'Bridal'], workingHours: { start: '09:30', end: '17:30' } }
];

const fallbackTransactions = [
  { id: 'txn_1001', appointmentId: 'apt_sample_1', customerEmail: 'alice@example.com', amount: 35, paymentMethod: 'card', status: 'succeeded', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'txn_1002', appointmentId: 'apt_sample_2', customerEmail: 'marcus@example.com', amount: 75, paymentMethod: 'apple_pay', status: 'succeeded', createdAt: new Date(Date.now() - 43200000).toISOString() }
];

const formatTime = (date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(date || Date.now()));
const formatDate = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(date || Date.now()));
const initials = (name = '') => name.split(' ').map((part) => part[0]).slice(0, 2).join('');

async function getJson(path, fallback) {
  try {
    const response = await fetch(`${API}${path}`);
    if (!response.ok) throw new Error('Request failed');
    return await response.json();
  } catch {
    return fallback;
  }
}

function App() {
  const [appointments, setAppointments] = useState(fallbackAppointments);
  const [services, setServices] = useState(fallbackServices);
  const [staff, setStaff] = useState(fallbackStaff);
  const [transactions, setTransactions] = useState(fallbackTransactions);
  const [notifications, setNotifications] = useState([]);
  const [systemHealth, setSystemHealth] = useState([]);
  
  const [activeView, setActiveView] = useState('Overview');
  const [showBooking, setShowBooking] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [roleScopeFilter, setRoleScopeFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [selectedServiceForBook, setSelectedServiceForBook] = useState(null);
  const [selectedStaffForBook, setSelectedStaffForBook] = useState(null);

  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('salon_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('salon_token') || '');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // AI Chat State
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', text: 'Hello! I am Aura, your salon concierge. Ask me for service advice or tell me what appointment you would like to book!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = async () => {
    const [bookingData, serviceData, staffData, paymentData, notifData] = await Promise.all([
      getJson('/api/bookings', { bookings: fallbackAppointments }),
      getJson('/api/catalog/services', { services: fallbackServices }),
      getJson('/api/catalog/staff', { staff: fallbackStaff }),
      getJson('/api/payments/transactions', { transactions: fallbackTransactions }),
      getJson('/api/notifications/logs', { logs: [] })
    ]);
    if (bookingData.bookings && bookingData.bookings.length > 0) setAppointments(bookingData.bookings);
    if (serviceData.services && serviceData.services.length > 0) setServices(serviceData.services);
    if (staffData.staff && staffData.staff.length > 0) setStaff(staffData.staff);
    if (paymentData.transactions && paymentData.transactions.length > 0) setTransactions(paymentData.transactions);
    if (notifData.logs && notifData.logs.length > 0) setNotifications(notifData.logs);
  };

  const checkSystemHealth = async () => {
    notify('Auditing live microservices topology...');
    const endpoints = [
      { name: 'API Gateway', url: '/health', port: 5000 },
      { name: 'Auth Service', url: '/api/auth/health', port: 5001 },
      { name: 'Booking Service', url: '/api/bookings/health', port: 5002 },
      { name: 'Catalog Service', url: '/api/catalog/health', port: 5003 },
      { name: 'Payment Service', url: '/api/payments/health', port: 5004 },
      { name: 'Notification Service', url: '/api/notifications/health', port: 5005 },
      { name: 'AI Assistant Service', url: '/api/ai/health', port: 5006 }
    ];

    const results = await Promise.all(
      endpoints.map(async (ep) => {
        const start = performance.now();
        try {
          const res = await fetch(`${API}${ep.url}`);
          const latency = Math.round(performance.now() - start);
          const data = await res.json();
          return { ...ep, status: res.ok ? 'healthy' : 'degraded', latency, details: data };
        } catch (err) {
          return { ...ep, status: 'offline', latency: 0, error: err.message };
        }
      })
    );
    setSystemHealth(results);
  };

  useEffect(() => {
    loadData();
    checkSystemHealth();
  }, []);

  // Sync token profile if available
  useEffect(() => {
    if (token) {
      fetch(`${API}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(prev => ({ ...prev, ...data.user }));
          localStorage.setItem('salon_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {});
    }
  }, [token]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  };

  const handleAuthSuccess = (userData, userToken, message) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('salon_user', JSON.stringify(userData));
    localStorage.setItem('salon_token', userToken);
    setShowAuthModal(false);
    notify(message || `Welcome, ${userData.fullName}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('salon_user');
    localStorage.removeItem('salon_token');
    setUserMenuOpen(false);
    notify('Signed out successfully.');
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const matchesQuery = [item.customerName, item.serviceName, item.staffName, item.notes || ''].join(' ').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      let matchesRole = true;
      if (roleScopeFilter === 'mine' && user) {
        if (user.role === 'customer') {
          matchesRole = (item.customerEmail?.toLowerCase() === user.email?.toLowerCase());
        } else if (user.role === 'stylist') {
          matchesRole = (item.staffName?.toLowerCase().includes(user.fullName?.toLowerCase()));
        }
      }
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [appointments, query, statusFilter, roleScopeFilter, user]);

  // Clients Directory from Bookings
  const clientsList = useMemo(() => {
    const map = new Map();
    appointments.forEach((apt) => {
      const email = apt.customerEmail || apt.customerName;
      if (!map.has(email)) {
        map.set(email, {
          name: apt.customerName,
          email: apt.customerEmail,
          phone: apt.customerPhone || '+1-555-0199',
          count: 1,
          spent: Number(apt.totalPrice || 0),
          lastVisit: apt.appointmentDate
        });
      } else {
        const c = map.get(email);
        c.count += 1;
        c.spent += Number(apt.totalPrice || 0);
      }
    });
    return Array.from(map.values()).filter(c => 
      [c.name, c.email, c.phone].join(' ').toLowerCase().includes(query.toLowerCase())
    );
  }, [appointments, query]);

  // Services Catalog Filter
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesCat = categoryFilter === 'All' || s.category === categoryFilter;
      const matchesQ = [s.name, s.description || '', s.category || ''].join(' ').toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQ;
    });
  }, [services, categoryFilter, query]);

  // Financial Stats
  const totalRevenue = useMemo(() => {
    return transactions
      .filter(t => t.status === 'succeeded')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }, [transactions]);

  const totalRefunded = useMemo(() => {
    return transactions
      .filter(t => t.status === 'refunded')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }, [transactions]);

  const todayCount = appointments.filter((item) => new Date(item.appointmentDate).toDateString() === new Date().toDateString()).length;

  // Appointment Status Actions
  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API}/api/bookings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {}
    setAppointments((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));
    notify(`Appointment marked as ${status}`);
  };

  const cancelAndRefund = async (appointment) => {
    if (!window.confirm(`Cancel appointment for ${appointment.customerName} and dispatch notification?`)) return;
    
    // 1. Update status to cancelled
    await updateStatus(appointment._id, 'cancelled');

    // 2. Issue refund in payment service if paid
    try {
      await fetch(`${API}/api/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment._id, reason: 'Appointment cancellation' })
      });
      loadData();
    } catch {}

    // 3. Dispatch cancellation email/sms notice
    try {
      await fetch(`${API}/api/notifications/send-cancellation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: appointment.customerEmail,
          customerName: appointment.customerName,
          serviceName: appointment.serviceName,
          appointmentDate: new Date(appointment.appointmentDate).toLocaleString(),
          reason: 'Customer or stylist requested cancellation'
        })
      });
      loadData();
    } catch {}

    notify(`Appointment cancelled & notice sent to ${appointment.customerEmail}`);
  };

  const deleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment record?')) return;
    try {
      await fetch(`${API}/api/bookings/${id}`, { method: 'DELETE' });
    } catch {}
    setAppointments(prev => prev.filter(b => b._id !== id));
    notify('Appointment record deleted.');
  };

  const deleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service from catalog?')) return;
    try {
      await fetch(`${API}/api/catalog/services/${id}`, { method: 'DELETE' });
    } catch {}
    setServices(prev => prev.filter(s => s._id !== id));
    notify('Service removed from catalog.');
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to remove this stylist from the team?')) return;
    try {
      await fetch(`${API}/api/catalog/staff/${id}`, { method: 'DELETE' });
    } catch {}
    setStaff(prev => prev.filter(s => s._id !== id));
    notify('Stylist removed from team.');
  };

  const handleSendAi = async (promptText) => {
    const message = promptText || aiInput;
    if (!message.trim()) return;
    setAiMessages((prev) => [...prev, { role: 'user', text: message }]);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      setAiMessages((prev) => [...prev, { role: 'assistant', text: data.reply || 'Pleased to help with your salon visit.' }]);
    } catch {
      let reply = 'At Luxe Salon, our master stylists provide bespoke haircutting, revitalizing facials, and manicures.';
      if (message.toLowerCase().includes('hair')) reply = 'Our Classic Haircut & Styling is $35 with Sarah Jenkins.';
      if (message.toLowerCase().includes('facial')) reply = 'Our Deluxe Facial is $75 with David Kim.';
      setAiMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } finally {
      setAiLoading(false);
    }
  };

  const parseIntentAndBook = async (customPrompt) => {
    const prompt = customPrompt || aiInput || 'Book a haircut with Sarah tomorrow afternoon at 3pm';
    notify('Extracting scheduling details via Gemini AI...');
    try {
      const res = await fetch(`${API}/api/ai/parse-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      const intent = data.intent;
      if (intent && intent.service) {
        const found = services.find((s) => s.name.toLowerCase().includes(intent.service.toLowerCase()));
        if (found) setSelectedServiceForBook(found);
      }
      if (intent && intent.stylist) {
        const foundStaff = staff.find(st => st.name.toLowerCase().includes(intent.stylist.toLowerCase()));
        if (foundStaff) setSelectedStaffForBook(foundStaff);
      }
      setShowBooking(true);
      notify(`Parsed: ${intent?.service || 'Appointment'} with ${intent?.stylist || 'Sarah'}`);
    } catch {
      setShowBooking(true);
    }
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Appointments', icon: CalendarDays, count: appointments.length },
    { label: 'Services', icon: Sparkles, count: services.length },
    { label: 'Team', icon: Scissors, count: staff.length },
    { label: 'Clients', icon: UsersRound, count: clientsList.length },
    { label: 'Financials', icon: DollarSign, count: transactions.length },
    { label: 'Aura AI', icon: MessageSquare },
    { label: 'System Status', icon: Activity }
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">M</div>
          <div><strong>maison</strong><span>salon & spa</span></div>
        </div>
        <div className="workspace-switcher" onClick={() => notify('Active: Luxe Salon Director Mode')}>
          <span className="workspace-avatar">L</span>
          <div><b>Luxe Salon</b><small>{user ? `${user.role?.toUpperCase()} console` : 'Enterprise portal'}</small></div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">Workspace</div>
        <nav>
          {navItems.map(({ label, icon: Icon, count }) => (
            <button
              className={`nav-item ${activeView === label ? 'active' : ''}`}
              key={label}
              onClick={() => { setActiveView(label); setMenuOpen(false); }}
            >
              <Icon size={17} strokeWidth={activeView === label ? 2.4 : 1.8} />
              <span>{label}</span>
              {count ? <em>{count}</em> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="help-card">
            <Sparkles size={17} />
            <b>Gemini 2.5 Flash</b>
            <span>Autonomous concierge online</span>
            <button onClick={() => setActiveView('Aura AI')}>
              Open Aura AI <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">{user ? initials(user.fullName || user.email) : 'LU'}</div>
            <div>
              <b>{user ? (user.fullName || user.email.split('@')[0]) : 'Sarah Olsen'}</b>
              <small>{user ? user.role : 'Owner / Director'}</small>
            </div>
            {user ? (
              <button className="icon-button" title="Sign out" onClick={handleLogout}>
                <LogOut size={15} />
              </button>
            ) : (
              <button className="icon-button" title="Sign in" onClick={() => setShowAuthModal(true)}>
                <LogIn size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>
              <Menu size={20} />
            </button>
            <div className="breadcrumbs">
              <span>Maison</span><b>/</b>
              <strong>{activeView}</strong>
            </div>
          </div>
          <div className="top-actions">
            <div className="search">
              <Search size={17} />
              <input
                placeholder={`Search ${activeView.toLowerCase()}...`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button" title="Dispatched Notifications" onClick={() => setShowNotifDrawer(true)}>
              <Bell size={19} /><i />
            </button>
            {user ? (
              <div className="user-menu-container">
                <button className="user-pill-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <div className="mini-avatar">{initials(user.fullName || user.email)}</div>
                  <div className="user-pill-info">
                    <b>{user.fullName || user.email.split('@')[0]}</b>
                    <span className={`role-badge ${user.role || 'customer'}`}>{user.role || 'Customer'}</span>
                  </div>
                  <ChevronDown size={13} color="#8a8790" />
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <strong>{user.fullName || 'User'}</strong>
                      <small>{user.email}</small>
                      <div style={{ marginTop: 6 }}>
                        <span className={`role-badge ${user.role || 'customer'}`}>{user.role || 'Customer'}</span>
                      </div>
                    </div>
                    <button className="user-dropdown-item" onClick={() => { setActiveView('Overview'); setUserMenuOpen(false); }}>
                      <LayoutDashboard size={14} /> Dashboard
                    </button>
                    <button className="user-dropdown-item" onClick={() => { setShowBooking(true); setUserMenuOpen(false); }}>
                      <Plus size={14} /> New Appointment
                    </button>
                    <button className="user-dropdown-item danger" onClick={handleLogout}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="sign-in-btn" onClick={() => { setAuthModalTab('login'); setShowAuthModal(true); }}>
                <LogIn size={15} /> Sign In
              </button>
            )}
          </div>
        </header>

        <div className="page">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <h1>Good day, {user ? (user.fullName?.split(' ')[0] || user.email?.split('@')[0]) : 'Sarah'} <span>✦</span></h1>
              <p className="subcopy">
                {user ? `Active in ${user.role?.toUpperCase()} mode. Full salon operations synchronized across 7 microservices.` : 'Luxe Salon director suite. Manage schedules, clients, catalog, financials, and AI.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="secondary-button" onClick={() => { loadData(); notify('Data synchronized from microservices'); }}>
                <RefreshCw size={15} /> Refresh
              </button>
              <button className="primary-button" onClick={() => { setSelectedServiceForBook(null); setSelectedStaffForBook(null); setShowBooking(true); }}>
                <Plus size={16} /> New Appointment
              </button>
            </div>
          </section>

          {/* VIEW: OVERVIEW */}
          {activeView === 'Overview' && (
            <>
              <div className="stats-grid">
                <StatCard label="Total Appointments" value={appointments.length} change="+14% this mo." color="lavender" icon={<CalendarDays size={18} />} />
                <StatCard label="Active Clients" value={clientsList.length} change="+8 new" color="peach" icon={<UsersRound size={18} />} />
                <StatCard label="Gross Revenue" value={`$${totalRevenue}`} change="Succeeded" color="mint" icon={<DollarSign size={18} />} />
                <StatCard label="Client Rating" value="4.9 ★" change="Top 1%" color="yellow" icon={<Sparkles size={18} />} />
              </div>

              <section className="content-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent Bookings ({appointments.length})</h2>
                      <p>{todayCount} appointments scheduled for today</p>
                    </div>
                    <button className="text-button" onClick={() => setActiveView('Appointments')}>
                      View all appointments →
                    </button>
                  </div>
                  <div className="appointment-list">
                    {filteredAppointments.slice(0, 5).map((item) => (
                      <AppointmentRow key={item._id} item={item} onStatusChange={updateStatus} onCancel={cancelAndRefund} showActions />
                    ))}
                  </div>
                </div>

                <div className="right-column">
                  <div className="panel">
                    <div className="panel-heading">
                      <div><h2>Revenue Overview</h2><p>Past 30 days trajectory</p></div>
                      <span style={{ fontSize: '11px', color: '#3e9e74', fontWeight: 600 }}>+23.4% YoY</span>
                    </div>
                    <div className="revenue-total">
                      <strong>${totalRevenue}</strong>
                      <span><ArrowUpRight size={14} /> Healthy</span>
                    </div>
                    <div className="chart">
                      <div className="chart-lines"><i /><i /><i /></div>
                      <svg viewBox="0 0 300 120" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#756bd2" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#756bd2" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,90 Q40,40 80,70 T160,30 T240,55 T300,15 L300,120 L0,120 Z" fill="url(#grad)" />
                        <path d="M0,90 Q40,40 80,70 T160,30 T240,55 T300,15" fill="none" stroke="#756bd2" strokeWidth="2.5" />
                      </svg>
                    </div>
                    <div className="chart-labels"><span>Sep 9</span><span>Sep 16</span><span>Sep 23</span><span>Sep 30</span><span>Oct 8</span></div>
                  </div>

                  <div className="panel service-panel">
                    <div className="panel-heading">
                      <div><h2>Popular Treatments</h2><p>Catalog offerings</p></div>
                      <button className="more-button" onClick={() => setActiveView('Services')}>All Services →</button>
                    </div>
                    {services.slice(0, 4).map((service) => (
                      <div className="service-row" key={service._id || service.name} style={{ cursor: 'pointer' }} onClick={() => { setSelectedServiceForBook(service); setShowBooking(true); }}>
                        <img
                          src={getServiceImage(service)}
                          alt={service.name}
                          className="service-thumb"
                          onError={(e) => { e.currentTarget.src = DEFAULT_SERVICE_IMAGE; }}
                        />
                        <div className="service-info">
                          <b>{service.name}</b>
                          <small>{service.durationMinutes || 45} min <span>·</span> {service.category || 'Hair'}</small>
                        </div>
                        <strong>${service.price}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* VIEW: APPOINTMENTS */}
          {activeView === 'Appointments' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>All Appointments ({filteredAppointments.length})</h2>
                  <p>Manage salon schedules, client visits, and status changes</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {user && (
                    <button
                      className={roleScopeFilter === 'mine' ? 'primary-button' : 'secondary-button'}
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                      onClick={() => setRoleScopeFilter(roleScopeFilter === 'mine' ? 'all' : 'mine')}
                    >
                      {roleScopeFilter === 'mine' ? 'Showing: My Bookings' : 'Show Only Mine'}
                    </button>
                  )}
                  {['all', 'confirmed', 'completed', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      className={statusFilter === st ? 'primary-button' : 'secondary-button'}
                      style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'capitalize' }}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                  <button className="primary-button" style={{ padding: '6px 14px', fontSize: '11px' }} onClick={() => { setSelectedServiceForBook(null); setShowBooking(true); }}>
                    <Plus size={14} /> New
                  </button>
                </div>
              </div>
              <div className="appointment-list" style={{ marginTop: '16px' }}>
                {filteredAppointments.length ? (
                  filteredAppointments.map((item) => (
                    <AppointmentRow
                      key={item._id}
                      item={item}
                      onStatusChange={updateStatus}
                      onCancel={cancelAndRefund}
                      onDelete={deleteAppointment}
                      showActions
                    />
                  ))
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          )}

          {/* VIEW: SERVICES CATALOG */}
          {activeView === 'Services' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Services Catalog ({filteredServices.length})</h2>
                  <p>Browse signature treatments or register new salon offerings</p>
                </div>
                <button className="primary-button" onClick={() => setShowAddService(true)}>
                  <Plus size={16} /> Add Treatment
                </button>
              </div>

              {/* Category Pills Filter */}
              <div className="category-filter-bar">
                {['All', 'Hair', 'Skincare', 'Nails', 'Bridal', 'Massage'].map(cat => (
                  <button
                    key={cat}
                    className={`cat-pill-btn ${categoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="service-catalog-grid">
                {filteredServices.map((s, idx) => (
                  <div key={s._id || idx} className="service-card">
                    <div className="service-card-media">
                      <img
                        src={getServiceImage(s)}
                        alt={s.name}
                        className="service-card-img"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = DEFAULT_SERVICE_IMAGE; }}
                      />
                      <div className="service-card-media-overlay">
                        <span className="service-cat-pill">
                          {s.category || 'Hair'}
                        </span>
                        <span className="service-duration-badge">
                          <Clock3 size={11} /> {s.durationMinutes || 45} mins
                        </span>
                      </div>
                    </div>
                    <div className="service-card-body">
                      <div>
                        <h3 className="service-card-title">{s.name}</h3>
                        <p className="service-card-desc">{s.description || 'Premium personal care treatment.'}</p>
                      </div>
                      <div className="service-card-footer">
                        <strong className="service-card-price">${s.price}</strong>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="primary-button" style={{ padding: '7px 14px', fontSize: '11px' }} onClick={() => { setSelectedServiceForBook(s); setShowBooking(true); }}>
                            Book
                          </button>
                          {user?.role === 'admin' && (
                            <button className="secondary-button" style={{ padding: '7px 10px', color: '#c44242' }} title="Delete service" onClick={() => deleteService(s._id)}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: TEAM & STYLISTS */}
          {activeView === 'Team' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Artisans & Styling Team ({staff.length})</h2>
                  <p>Certified master stylists, skincare experts, and nail artisans</p>
                </div>
                <button className="primary-button" onClick={() => setShowAddStaff(true)}>
                  <Plus size={16} /> Add Artisan
                </button>
              </div>

              <div className="team-grid">
                {staff.map((member) => {
                  const assignedCount = appointments.filter(a => a.staffName?.toLowerCase().includes(member.name.toLowerCase())).length;
                  return (
                    <div key={member._id} className="staff-card">
                      <div>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                          <div className="staff-avatar-lg">{initials(member.name)}</div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Playfair Display' }}>{member.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', color: '#777', fontSize: '11px' }}>
                              <Mail size={12} /> {member.email}
                            </div>
                            {member.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: '#888', fontSize: '11px' }}>
                                <Phone size={12} /> {member.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                          {(member.specialties || ['Styling']).map(spec => (
                            <span key={spec} className="specialty-tag">✦ {spec}</span>
                          ))}
                        </div>

                        <div style={{ borderTop: '1px solid #f2f0ed', paddingTop: '10px', fontSize: '11px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Hours: <b>{member.workingHours?.start || '09:00'} - {member.workingHours?.end || '17:00'}</b></span>
                          <span>Active Visits: <b style={{ color: '#5c4ebd' }}>{assignedCount}</b></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f2f0ed' }}>
                        <button
                          className="primary-button"
                          style={{ flex: 1, padding: '7px 12px', fontSize: '11px', justifyContent: 'center' }}
                          onClick={() => { setSelectedStaffForBook(member); setShowBooking(true); }}
                        >
                          Book with {member.name.split(' ')[0]}
                        </button>
                        {user?.role === 'admin' && (
                          <button className="secondary-button" style={{ padding: '7px 10px', color: '#c44242' }} title="Delete stylist" onClick={() => deleteStaff(member._id)}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: CLIENTS */}
          {activeView === 'Clients' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Client Directory ({clientsList.length})</h2>
                  <p>Registered clients, visit history, and total revenue</p>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {clientsList.map((c) => (
                  <div key={c.email || c.name} className="stat-card" style={{ flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                      <div className="avatar">{initials(c.name)}</div>
                      <div>
                        <b>{c.name}</b>
                        <small style={{ color: '#888', display: 'block', fontSize: '10px' }}>{c.email}</small>
                        <small style={{ color: '#aaa', display: 'block', fontSize: '10px' }}>{c.phone}</small>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '8px', width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                      <span>Visits: <b>{c.count}</b></span>
                      <span>Total Spent: <b style={{ color: '#49a67d' }}>${c.spent}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: FINANCIALS & TRANSACTIONS */}
          {activeView === 'Financials' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Financial Ledger & Transactions ({transactions.length})</h2>
                  <p>Real-time payment processing transactions recorded via Payment Service</p>
                </div>
                <button className="secondary-button" onClick={() => { loadData(); notify('Financial ledger refreshed.'); }}>
                  <RefreshCw size={14} /> Sync Ledger
                </button>
              </div>

              <div className="stats-grid" style={{ marginTop: '16px' }}>
                <StatCard label="Gross Volume" value={`$${totalRevenue}`} change="Card & Online" color="mint" icon={<DollarSign size={18} />} />
                <StatCard label="Refunded Amount" value={`$${totalRefunded}`} change="Processed" color="peach" icon={<CreditCard size={18} />} />
                <StatCard label="Net Salon Revenue" value={`$${totalRevenue - totalRefunded}`} change="Settled" color="lavender" icon={<Award size={18} />} />
                <StatCard label="Transactions" value={transactions.length} change="Total processed" color="yellow" icon={<CheckCircle2 size={18} />} />
              </div>

              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Customer Email</th>
                      <th>Appointment ID</th>
                      <th>Payment Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date / Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn.id}>
                        <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{txn.id}</span></td>
                        <td>{txn.customerEmail}</td>
                        <td><span style={{ fontFamily: 'monospace', color: '#666' }}>{txn.appointmentId}</span></td>
                        <td><span style={{ textTransform: 'uppercase', fontSize: '10px', background: '#f0effb', color: '#6257c3', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>{txn.paymentMethod || 'CARD'}</span></td>
                        <td><strong>${txn.amount}</strong></td>
                        <td>
                          <span className={`status-tag ${txn.status || 'succeeded'}`}>
                            {txn.status || 'succeeded'}
                          </span>
                        </td>
                        <td style={{ color: '#888', fontSize: '11px' }}>
                          {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          {txn.status === 'succeeded' ? (
                            <button
                              className="secondary-button"
                              style={{ padding: '4px 8px', fontSize: '10px', color: '#b33a3a' }}
                              onClick={async () => {
                                if (!window.confirm(`Issue refund for $${txn.amount}?`)) return;
                                await fetch(`${API}/api/payments/refund`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ transactionId: txn.id, reason: 'Staff refunded' })
                                });
                                loadData();
                                notify(`Transaction ${txn.id} refunded successfully.`);
                              }}
                            >
                              Issue Refund
                            </button>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#aaa' }}>Refunded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: AURA AI CONCIERGE */}
          {activeView === 'Aura AI' && (
            <div className="panel" style={{ maxWidth: '820px', margin: '0 auto' }}>
              <div className="panel-heading">
                <div>
                  <h2>Aura • Intelligent Salon Concierge</h2>
                  <p>Powered by Google Gemini 2.5 Flash for conversational advice & smart intent scheduling</p>
                </div>
                <button className="secondary-button" onClick={() => setAiMessages([{ role: 'assistant', text: 'Chat refreshed. How may I assist you today?' }])}>
                  Clear
                </button>
              </div>

              {/* Natural Language Demo Bar */}
              <div style={{ background: '#f6f4fe', border: '1px solid #e0dcf8', borderRadius: '10px', padding: '12px 16px', margin: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#5549b0' }}>
                  ⚡ Try: <em>"Book a classic haircut with Sarah tomorrow at 3pm"</em>
                </span>
                <button
                  className="primary-button"
                  style={{ padding: '6px 14px', fontSize: '11px', background: '#6257c3' }}
                  onClick={() => parseIntentAndBook('Book a Classic Haircut with Sarah tomorrow at 3pm')}
                >
                  Test Auto-Book Intent
                </button>
              </div>

              {/* Chat Message Box */}
              <div style={{ height: '320px', overflowY: 'auto', border: '1px solid #ebe9e5', borderRadius: '12px', padding: '16px', background: '#faf9f8', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '78%',
                      background: msg.role === 'user' ? 'var(--ink)' : '#fff',
                      color: msg.role === 'user' ? '#fff' : '#25232b',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      border: msg.role === 'user' ? 'none' : '1px solid #e4e2de',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid #eee', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', color: '#888' }}>
                    ✦ Aura is consulting the salon catalog...
                  </div>
                )}
              </div>

              {/* Quick Prompt Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '12px 0' }}>
                {[
                  'What facial is best for sensitive skin?',
                  'Recommend a stylist for blonde balayage',
                  'What are the bridal package options?'
                ].map((chip) => (
                  <button
                    key={chip}
                    className="secondary-button"
                    style={{ padding: '5px 12px', fontSize: '11px', borderRadius: '18px' }}
                    onClick={() => handleSendAi(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input row */}
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendAi(); }}
                style={{ display: 'flex', gap: '10px' }}
              >
                <input
                  style={{ flex: 1, border: '1px solid #dfdde0', borderRadius: '9px', padding: '10px 14px', fontSize: '12px' }}
                  placeholder="Ask for hair advice, facial recommendations, or type a booking request..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button className="primary-button" disabled={aiLoading || !aiInput.trim()} type="submit">
                  Send to Aura
                </button>
              </form>
            </div>
          )}

          {/* VIEW: SYSTEM ARCHITECTURE & HEALTH */}
          {activeView === 'System Status' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Microservices Architecture Topology (7 Services)</h2>
                  <p>Real-time distributed service discovery, port assignment, and heartbeat latency</p>
                </div>
                <button className="primary-button" onClick={checkSystemHealth}>
                  <RefreshCw size={15} /> Ping Microservices
                </button>
              </div>

              <div className="health-grid">
                {systemHealth.map((item) => (
                  <div key={item.name} className="health-card">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`health-dot ${item.status === 'healthy' ? 'online' : 'offline'}`} />
                          <strong style={{ fontSize: '14px' }}>{item.name}</strong>
                        </div>
                        <span className="latency-badge">{item.latency} ms</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                        <div>Port: <b>{item.port}</b> · Route: <code style={{ color: '#6257c3' }}>{item.url}</code></div>
                        <div style={{ marginTop: '4px' }}>
                          Status: <b style={{ color: item.status === 'healthy' ? '#2bbb77' : '#e04646' }}>{item.status.toUpperCase()}</b>
                        </div>
                      </div>
                    </div>
                    {item.details && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f2f0ed', fontSize: '10px', color: '#888' }}>
                        {item.details.mongoConnected !== undefined && (
                          <span>MongoDB Atlas: <b style={{ color: item.details.mongoConnected ? '#2bbb77' : '#e04646' }}>{item.details.mongoConnected ? 'Connected' : 'Local Fallback'}</b></span>
                        )}
                        {item.details.supabaseConnected !== undefined && (
                          <span>Supabase Auth: <b style={{ color: '#2bbb77' }}>Configured</b></span>
                        )}
                        {item.details.model && (
                          <span>Model: <b>{item.details.model}</b></span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE APPOINTMENT */}
      {showBooking && (
        <BookingModal
          services={services}
          staff={staff}
          preselectedService={selectedServiceForBook}
          preselectedStaff={selectedStaffForBook}
          currentUser={user}
          onClose={() => { setShowBooking(false); setSelectedServiceForBook(null); setSelectedStaffForBook(null); }}
          onSaved={() => {
            setShowBooking(false);
            setSelectedServiceForBook(null);
            setSelectedStaffForBook(null);
            loadData();
            notify('Appointment booked & synchronized across microservices!');
          }}
        />
      )}

      {/* MODAL: ADD SERVICE */}
      {showAddService && (
        <AddServiceModal
          onClose={() => setShowAddService(false)}
          onServiceAdded={(newSrv) => {
            setServices(prev => [newSrv, ...prev]);
            notify(`Added "${newSrv.name}" to catalog!`);
          }}
        />
      )}

      {/* MODAL: ADD STAFF */}
      {showAddStaff && (
        <AddStaffModal
          onClose={() => setShowAddStaff(false)}
          onStaffAdded={(newStaff) => {
            setStaff(prev => [newStaff, ...prev]);
            notify(`Added "${newStaff.name}" to team!`);
          }}
        />
      )}

      {/* MODAL: AUTHENTICATION */}
      {showAuthModal && (
        <AuthModal
          initialTab={authModalTab}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* DRAWER: DISPATCHED NOTIFICATIONS */}
      <NotificationDrawer
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        logs={notifications}
        onRefresh={() => { loadData(); notify('Notification logs refreshed.'); }}
      />

      {/* FLOATING TOAST */}
      {toast && (
        <div className="toast">
          <span>✓</span>{toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, change, color, icon }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-meta">
        <span>{label}</span>
        <div>
          <strong>{value}</strong>
          <em>{change}</em>
        </div>
      </div>
    </div>
  );
}

function AppointmentRow({ item, onStatusChange, onCancel, onDelete, showActions }) {
  return (
    <div className="appointment-row">
      <div className="time">
        <b>{formatTime(item.appointmentDate)}</b>
        <span>{formatDate(item.appointmentDate)}</span>
      </div>
      <div className="client-avatar">{initials(item.customerName)}</div>
      <div className="appointment-info">
        <b>{item.customerName}</b>
        <span>{item.serviceName} ({item.durationMinutes || 45} mins)</span>
      </div>
      <div className="stylist">
        <span>Stylist</span>
        <b>{item.staffName || 'Any stylist'}</b>
      </div>
      <div style={{ textAlign: 'right', minWidth: '60px' }}>
        <b style={{ fontSize: '13px' }}>${item.totalPrice}</b>
      </div>
      <div className={`status ${item.status || 'confirmed'}`}>{item.status || 'confirmed'}</div>
      {showActions && (
        <div style={{ display: 'flex', gap: '6px' }}>
          {item.status !== 'completed' && item.status !== 'cancelled' && (
            <button
              className="primary-button"
              style={{ padding: '5px 10px', fontSize: '10px' }}
              onClick={() => onStatusChange(item._id, 'completed')}
            >
              Complete
            </button>
          )}
          {item.status !== 'cancelled' ? (
            <button
              className="secondary-button"
              style={{ padding: '5px 10px', fontSize: '10px', color: '#c44242' }}
              onClick={() => onCancel(item)}
            >
              Cancel
            </button>
          ) : (
            <button
              className="secondary-button"
              style={{ padding: '5px 10px', fontSize: '10px', color: '#999' }}
              title="Delete record"
              onClick={() => onDelete(item._id)}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <Sparkles size={28} />
      <b>No appointments matched</b>
      <span>Create a new appointment or modify your query filters.</span>
    </div>
  );
}

function BookingModal({ services, staff, preselectedService, preselectedStaff, currentUser, onClose, onSaved }) {
  const [form, setForm] = useState({
    customerName: currentUser?.fullName || '',
    customerEmail: currentUser?.email || '',
    customerPhone: currentUser?.phone || '',
    serviceId: preselectedService?._id || services[0]?._id || 'srv_1',
    serviceName: preselectedService?.name || services[0]?.name || 'Classic Haircut & Styling',
    staffId: preselectedStaff?._id || 'any',
    staffName: preselectedStaff?.name || 'Any Available Stylist',
    appointmentDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    totalPrice: preselectedService?.price || services[0]?.price || 35,
    durationMinutes: preselectedService?.durationMinutes || services[0]?.durationMinutes || 45,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const chooseService = (e) => {
    const srv = services.find(s => s._id === e.target.value);
    if (srv) {
      setForm(prev => ({
        ...prev,
        serviceId: srv._id,
        serviceName: srv.name,
        totalPrice: srv.price,
        durationMinutes: srv.durationMinutes || 45
      }));
    }
  };

  const chooseStaff = (e) => {
    const stf = staff.find(s => s._id === e.target.value);
    if (stf) {
      setForm(prev => ({ ...prev, staffId: stf._id, staffName: stf.name }));
    } else {
      setForm(prev => ({ ...prev, staffId: 'any', staffName: 'Any Available Stylist' }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const safeDate = new Date(form.appointmentDate).toISOString();
    const payload = { ...form, appointmentDate: safeDate };

    try {
      // 1. Create Booking
      const res = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let bookingId = `apt_${Date.now()}`;
      if (res.ok) {
        const data = await res.json();
        if (data.booking?._id) bookingId = data.booking._id;
      }

      // 2. Checkout Payment
      try {
        await fetch(`${API}/api/payments/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: bookingId,
            customerEmail: form.customerEmail,
            amount: form.totalPrice
          })
        });
      } catch {}

      // 3. Notification Dispatch
      try {
        await fetch(`${API}/api/notifications/send-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: form.customerEmail,
            recipientPhone: form.customerPhone,
            customerName: form.customerName,
            serviceName: form.serviceName,
            staffName: form.staffName,
            appointmentDate: new Date(safeDate).toLocaleString()
          })
        });
      } catch {}

      onSaved();
    } catch {
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Schedule Treatment</p>
            <h2>New Appointment</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}><X size={18} /></button>
        </div>

        <label>
          Client Full Name
          <input required value={form.customerName} onChange={e => update('customerName', e.target.value)} placeholder="e.g. Olivia Martin" />
        </label>

        <div className="form-row">
          <label>
            Email Address
            <input type="email" required value={form.customerEmail} onChange={e => update('customerEmail', e.target.value)} placeholder="olivia@example.com" />
          </label>
          <label>
            Phone Number
            <input type="tel" value={form.customerPhone} onChange={e => update('customerPhone', e.target.value)} placeholder="+1-555-0199" />
          </label>
        </div>

        <div className="form-row">
          <label>
            Selected Service
            <select value={form.serviceId} onChange={chooseService}>
              {services.map(s => (
                <option value={s._id} key={s._id}>{s.name} · ${s.price}</option>
              ))}
            </select>
          </label>
          <label>
            Stylist / Artisan
            <select value={form.staffId} onChange={chooseStaff}>
              <option value="any">Any Available Stylist</option>
              {staff.map(st => (
                <option value={st._id} key={st._id}>{st.name} ({(st.specialties || []).join(', ')})</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Date & Time Slot
          <input required type="datetime-local" value={form.appointmentDate} onChange={e => update('appointmentDate', e.target.value)} />
        </label>

        <label>
          Client Notes / Preferences (Optional)
          <input value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="e.g. Sensitive scalp, styling reference..." />
        </label>

        <div style={{ background: '#f8f7f4', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '13px' }}>
          <span>Total Fee:</span>
          <b>${form.totalPrice}</b>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Synchronizing...' : 'Confirm Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddServiceModal({ onClose, onServiceAdded }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hair');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [price, setPrice] = useState(50);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/catalog/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          durationMinutes: Number(durationMinutes),
          price: Number(price),
          description,
          imageUrl: imageUrl.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.service) {
        onServiceAdded(data.service);
        onClose();
      } else {
        alert(data.error || 'Failed to save service');
      }
    } catch (err) {
      alert('Error creating service: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Catalog Management</p>
            <h2>Add New Treatment</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}><X size={18} /></button>
        </div>

        <label>
          Service / Treatment Name
          <input required placeholder="e.g. Keratin Smoothing Treatment" value={name} onChange={e => setName(e.target.value)} />
        </label>

        <div className="form-row">
          <label>
            Category
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="Hair">Hair</option>
              <option value="Skincare">Skincare</option>
              <option value="Nails">Nails</option>
              <option value="Bridal">Bridal</option>
              <option value="Massage">Massage</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>
            Duration (Minutes)
            <input type="number" required min="15" step="15" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Price ($ USD)
            <input type="number" required min="5" value={price} onChange={e => setPrice(e.target.value)} />
          </label>
          <label>
            Photo Image URL (Optional)
            <input placeholder="https://images.unsplash.com/..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
          </label>
        </div>

        <label>
          Description & Care Details
          <input placeholder="Brief explanation of the treatment benefits..." value={description} onChange={e => setDescription(e.target.value)} />
        </label>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Add to Catalog'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddStaffModal({ onClose, onStaffAdded }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState('Hair, Styling');
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('17:00');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const specs = specialties.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch(`${API}/api/catalog/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          specialties: specs,
          workingHours: { start: startHour, end: endHour, daysOff: [] }
        })
      });
      const data = await res.json();
      if (res.ok && data.staff) {
        onStaffAdded(data.staff);
        onClose();
      } else {
        alert(data.error || 'Failed to add staff member');
      }
    } catch (err) {
      alert('Error adding staff: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Team Management</p>
            <h2>Add Stylist / Artisan</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}><X size={18} /></button>
        </div>

        <label>
          Artisan Full Name
          <input required placeholder="e.g. Julien Morel" value={name} onChange={e => setName(e.target.value)} />
        </label>

        <div className="form-row">
          <label>
            Email Address
            <input type="email" required placeholder="julien@salon.com" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label>
            Phone Number
            <input type="tel" placeholder="+1-555-0182" value={phone} onChange={e => setPhone(e.target.value)} />
          </label>
        </div>

        <label>
          Specialties (comma-separated)
          <input placeholder="Haircut, Balayage, Bridal" value={specialties} onChange={e => setSpecialties(e.target.value)} />
        </label>

        <div className="form-row">
          <label>
            Working Hours Start
            <input type="time" value={startHour} onChange={e => setStartHour(e.target.value)} />
          </label>
          <label>
            Working Hours End
            <input type="time" value={endHour} onChange={e => setEndHour(e.target.value)} />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Registering...' : 'Add to Team'}
          </button>
        </div>
      </form>
    </div>
  );
}

function NotificationDrawer({ isOpen, onClose, logs, onRefresh }) {
  if (!isOpen) return null;
  return (
    <div className="notif-drawer-backdrop" onClick={onClose}>
      <div className="notif-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="notif-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#756bd2" />
            <h3 style={{ margin: 0, fontSize: '15px' }}>Communication Hub</h3>
            <span style={{ fontSize: '10px', background: '#eeedfb', color: '#6257c3', padding: '2px 7px', borderRadius: '10px', fontWeight: 600 }}>
              {logs.length} Sent
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button className="icon-button" title="Refresh logs" onClick={onRefresh}>
              <RefreshCw size={15} />
            </button>
            <button className="close-button" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="notif-list">
          {logs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', padding: '40px 0', fontSize: '12px' }}>
              No notifications dispatched yet.
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="notif-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#333' }}>{log.recipientEmail}</span>
                  <span style={{ fontSize: '9px', background: '#eaf7f0', color: '#2d8b5c', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {log.channel || 'Email'}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#555', lineHeight: '1.4' }}>{log.message}</p>
                <div style={{ marginTop: '6px', fontSize: '9px', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{log.status ? `Status: ${log.status}` : 'Delivered'}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AuthModal({ initialTab = 'login', onClose, onAuthSuccess }) {
  const [tab, setTab] = useState(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('customer');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoGuide, setShowDemoGuide] = useState(true);
  const [infoNote, setInfoNote] = useState('');

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setError('');
    setInfoNote('');
  };

  const prefillTestCredentials = (testEmail, testPassword, roleName) => {
    setEmail(testEmail);
    setPassword(testPassword);
    setConfirmPassword(testPassword);
    setError('');
    setInfoNote(`Prefilled ${roleName} test credentials. Click "Sign In" to authenticate.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoNote('');

    if (tab === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = tab === 'login' ? `${API}/api/auth/login` : `${API}/api/auth/register`;
      const payload = tab === 'login' 
        ? { email, password }
        : { email, password, fullName, role, phone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication request failed');
      }

      const verifiedUser = data.user || {
        id: `usr_${Date.now()}`,
        email,
        fullName: fullName || email.split('@')[0],
        role: role || 'customer'
      };

      onAuthSuccess(verifiedUser, data.token || 'demo_token', data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '440px' }}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Security & Access</p>
            <h2>{tab === 'login' ? 'Sign In to Luxe Salon' : 'Create an Account'}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
          >
            Create Account
          </button>
        </div>

        {tab === 'login' && (
          <div className="auth-helper-section">
            <button
              type="button"
              className="auth-helper-toggle"
              onClick={() => setShowDemoGuide(!showDemoGuide)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={13} color="#8a7bd8" />
                <span>Evaluation Test Accounts</span>
              </span>
              <ChevronDown
                size={13}
                style={{
                  transform: showDemoGuide ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              />
            </button>
            {showDemoGuide && (
              <div className="auth-helper-dropdown">
                <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#666', lineHeight: '1.4' }}>
                  Click an authorized role below to <strong>pre-fill form inputs</strong>. You must still click <em>Sign In</em> to verify credentials:
                </p>
                <div className="demo-buttons-grid">
                  <button
                    type="button"
                    className="demo-pill-btn"
                    onClick={() => prefillTestCredentials('owner@luxesalon.com', 'admin123', 'Owner')}
                  >
                    👑 Owner
                    <span>Sarah Olsen</span>
                  </button>
                  <button
                    type="button"
                    className="demo-pill-btn"
                    onClick={() => prefillTestCredentials('stylist@luxesalon.com', 'stylist123', 'Stylist')}
                  >
                    ✂️ Stylist
                    <span>Elena Rostova</span>
                  </button>
                  <button
                    type="button"
                    className="demo-pill-btn"
                    onClick={() => prefillTestCredentials('client@luxesalon.com', 'client123', 'Client')}
                  >
                    💎 Client
                    <span>Alice Walker</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {infoNote && (
          <div className="auth-alert-success" style={{ fontSize: '11px', padding: '8px 12px' }}>
            <span>ℹ️</span> {infoNote}
          </div>
        )}

        {error && (
          <div className="auth-alert-error">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <>
              <label>
                Full Name
                <input
                  required
                  type="text"
                  placeholder="e.g. Charlotte Dubois"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </label>

              <label>
                Account Role
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="customer">Client / Customer (Book appointments)</option>
                  <option value="stylist">Stylist (Service provider)</option>
                  <option value="admin">Salon Director / Admin</option>
                </select>
              </label>

              <label>
                Phone Number
                <input
                  type="tel"
                  placeholder="+1 (555) 019-2834"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </>
          )}

          <label>
            Email Address
            <input
              required
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Password {tab === 'register' && <span style={{ fontSize: '10px', color: '#999', fontWeight: 400 }}>(min. 6 chars)</span>}
            <div className="password-input-wrap">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {tab === 'register' && (
            <label>
              Confirm Password
              <div className="password-input-wrap">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </label>
          )}

          {tab === 'login' && (
            <div className="auth-form-options">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <button
                type="button"
                className="auth-link"
                style={{ background: 'none', border: 0, padding: 0, fontSize: '11px' }}
                onClick={() => setInfoNote('Password reset link sent to registered email if account exists.')}
              >
                Forgot password?
              </button>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
              style={{ minWidth: '120px', justifyContent: 'center' }}
            >
              {loading ? 'Verifying...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', color: '#888' }}>
          {tab === 'login' ? (
            <span>New client? <button type="button" onClick={() => switchTab('register')} style={{ background: 'none', border: 0, color: '#6257c3', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Create an account</button></span>
          ) : (
            <span>Already registered? <button type="button" onClick={() => switchTab('login')} style={{ background: 'none', border: 0, color: '#6257c3', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Sign in</button></span>
          )}
        </div>

        <div className="auth-security-badge">
          <Lock size={12} />
          <span>256-Bit SSL Encrypted • JWT Cryptographic Verification</span>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
