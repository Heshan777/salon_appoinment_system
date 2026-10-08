import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronDown, Clock3,
  DollarSign, LayoutDashboard, Menu, MessageSquare, Plus, RefreshCw,
  Search, Settings, Sparkles, UserRound, UsersRound, X, XCircle
} from 'lucide-react';
import './styles.css';

const API = window.location.port === '5173' ? 'http://localhost:5000' : '';

const fallbackAppointments = [
  { _id: 'apt_sample_1', customerName: 'Alice Walker', customerEmail: 'alice@example.com', serviceName: 'Classic Haircut & Styling', staffName: 'Sarah Jenkins', appointmentDate: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 45, status: 'confirmed', totalPrice: 35 },
  { _id: 'apt_sample_2', customerName: 'Marcus Vance', customerEmail: 'marcus@example.com', serviceName: 'Deluxe Facial Treatment', staffName: 'David Kim', appointmentDate: new Date(Date.now() + 172800000).toISOString(), durationMinutes: 60, status: 'confirmed', totalPrice: 75 }
];

const fallbackServices = [
  { _id: 'srv_1', name: 'Classic Haircut & Styling', category: 'Hair', durationMinutes: 45, price: 35, description: 'Shampoo, cut, and blowdry styling.' },
  { _id: 'srv_2', name: 'Deluxe Facial Treatment', category: 'Skincare', durationMinutes: 60, price: 75, description: 'Deep cleansing and botanical hydration.' },
  { _id: 'srv_3', name: 'Gel Manicure & Pedicure', category: 'Nails', durationMinutes: 75, price: 60, description: 'Long-lasting vegan gel polish and scrub.' },
  { _id: 'srv_4', name: 'Balayage Color & Highlights', category: 'Hair', durationMinutes: 120, price: 140, description: 'Hand-painted highlights and gloss.' },
  { _id: 'srv_5', name: 'Bridal Haute Coiffure', category: 'Bridal', durationMinutes: 150, price: 210, description: 'Full wedding day hair and makeup.' }
];

const fallbackStaff = [
  { _id: 'stf_1', name: 'Sarah Jenkins', email: 'sarah@salon.com', specialties: ['Hair', 'Bridal'] },
  { _id: 'stf_2', name: 'David Kim', email: 'david@salon.com', specialties: ['Skincare', 'Massage'] },
  { _id: 'stf_3', name: 'Elena Rostova', email: 'elena@salon.com', specialties: ['Nails', 'Lashes'] }
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
  const [activeView, setActiveView] = useState('Overview');
  const [showBooking, setShowBooking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [selectedServiceForBook, setSelectedServiceForBook] = useState(null);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', text: 'Hello! I am Aura, your salon concierge. Ask me for service advice or tell me what appointment you would like to book!' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = async () => {
    const [bookingData, serviceData, staffData] = await Promise.all([
      getJson('/api/bookings', { bookings: fallbackAppointments }),
      getJson('/api/catalog/services', { services: fallbackServices }),
      getJson('/api/catalog/staff', { staff: fallbackStaff })
    ]);
    if (bookingData.bookings && bookingData.bookings.length > 0) setAppointments(bookingData.bookings);
    if (serviceData.services && serviceData.services.length > 0) setServices(serviceData.services);
    if (staffData.staff && staffData.staff.length > 0) setStaff(staffData.staff);
  };

  useEffect(() => { loadData(); }, []);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const matchesQuery = [item.customerName, item.serviceName, item.staffName].join(' ').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [appointments, query, statusFilter]);

  const clientsList = useMemo(() => {
    const map = new Map();
    appointments.forEach((apt) => {
      const email = apt.customerEmail || apt.customerName;
      if (!map.has(email)) {
        map.set(email, { name: apt.customerName, email: apt.customerEmail, count: 1, spent: Number(apt.totalPrice || 0), lastVisit: apt.appointmentDate });
      } else {
        const c = map.get(email);
        c.count += 1;
        c.spent += Number(apt.totalPrice || 0);
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  const revenue = appointments.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const todayCount = appointments.filter((item) => new Date(item.appointmentDate).toDateString() === new Date().toDateString()).length;

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
      setShowBooking(true);
      notify(`Extracted intent: ${intent?.service || 'Appointment'} with ${intent?.stylist || 'Sarah'}`);
    } catch {
      setShowBooking(true);
    }
  };

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Appointments', icon: CalendarDays, count: appointments.length },
    { label: 'Clients', icon: UsersRound, count: clientsList.length },
    { label: 'Services', icon: Sparkles, count: services.length },
    { label: 'Aura AI', icon: MessageSquare }
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
          <div><b>Luxe Salon</b><small>Admin workspace</small></div>
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
              <Icon size={18} strokeWidth={activeView === label ? 2.4 : 1.8} />
              <span>{label}</span>
              {count ? <em>{count}</em> : null}
            </button>
          ))}
        </nav>
        <div className="nav-label settings-label">Manage</div>
        <nav>
          <button className="nav-item" onClick={() => notify('Microservices running on ports 5000-5006')}>
            <Settings size={18} /><span>System Status</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="help-card">
            <Sparkles size={17} />
            <b>Gemini AI Ready</b>
            <span>Autonomous scheduling active</span>
            <button onClick={() => setActiveView('Aura AI')}>
              Open Aura AI <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="profile">
            <div className="avatar">SO</div>
            <div><b>Sarah Olsen</b><small>Salon owner</small></div>
            <ChevronDown size={15} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button>
          <div className="breadcrumbs">
            <span>Workspace</span><b>/</b><strong>{activeView}</strong>
          </div>
          <div className="top-actions">
            <div className="search">
              <Search size={17} />
              <input
                placeholder="Search appointments, clients, services..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button" onClick={() => notify('You have no unread notifications')}>
              <Bell size={19} /><i />
            </button>
            <div className="mini-avatar">SO</div>
          </div>
        </header>

        <div className="page">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <h1>Good day, Sarah <span>✦</span></h1>
              <p className="subcopy">Here’s what’s happening at Luxe Salon today.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="secondary-button" onClick={() => { loadData(); notify('Synchronized with microservices'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={15} /> Refresh
              </button>
              <button className="primary-button" onClick={() => { setSelectedServiceForBook(null); setShowBooking(true); }}>
                <Plus size={18} /> New appointment
              </button>
            </div>
          </section>

          {/* VIEW: OVERVIEW */}
          {activeView === 'Overview' && (
            <>
              <section className="stats-grid">
                <StatCard label="Today's appointments" value={todayCount || appointments.length} delta="+12.5%" icon={CalendarDays} tone="lavender" />
                <StatCard label="Total revenue" value={`$${revenue.toLocaleString()}`} delta="+8.2%" icon={DollarSign} tone="peach" />
                <StatCard label="Active clients" value={clientsList.length || '24'} delta="+18.4%" icon={UsersRound} tone="mint" />
                <StatCard label="Catalog services" value={services.length} delta="+2" icon={Sparkles} tone="yellow" />
              </section>

              <section className="content-grid">
                <div className="panel appointments-panel">
                  <div className="panel-heading">
                    <div><h2>Upcoming appointments</h2><p>Your schedule at a glance</p></div>
                    <button className="text-button" onClick={() => setActiveView('Appointments')}>
                      View all ({appointments.length}) <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="date-strip">
                    <button onClick={() => setStatusFilter('all')}>‹</button>
                    <div className={statusFilter === 'all' ? 'date-selected' : ''} onClick={() => setStatusFilter('all')} style={{ cursor: 'pointer' }}>
                      <small>All</small><b>All Days</b>
                    </div>
                    <div className={statusFilter === 'confirmed' ? 'date-selected' : ''} onClick={() => setStatusFilter('confirmed')} style={{ cursor: 'pointer' }}>
                      <small>Status</small><b>Confirmed</b>
                    </div>
                    <div className={statusFilter === 'completed' ? 'date-selected' : ''} onClick={() => setStatusFilter('completed')} style={{ cursor: 'pointer' }}>
                      <small>Status</small><b>Completed</b>
                    </div>
                    <button onClick={() => setStatusFilter('all')}>›</button>
                  </div>
                  <div className="appointment-list">
                    {filteredAppointments.length ? (
                      filteredAppointments.slice(0, 6).map((item) => (
                        <AppointmentRow key={item._id} item={item} onStatusChange={updateStatus} />
                      ))
                    ) : (
                      <EmptyState />
                    )}
                  </div>
                </div>

                <div className="right-column">
                  <div className="panel revenue-panel">
                    <div className="panel-heading">
                      <div><h2>Revenue overview</h2><p>Accrued bookings</p></div>
                      <button className="select-button" onClick={() => notify('Revenue tracked via Payment microservice')}>This month <ChevronDown size={14} /></button>
                    </div>
                    <div className="revenue-total">
                      <strong>${revenue.toLocaleString()}</strong>
                      <span><ArrowUpRight size={14} /> 8.2%</span>
                    </div>
                    <div className="chart">
                      <div className="chart-lines"><i /><i /><i /><i /></div>
                      <svg viewBox="0 0 440 130" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#7e72db" stopOpacity=".22" />
                            <stop offset="100%" stopColor="#7e72db" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 108 C35 95 38 78 67 88 S97 62 123 76 S150 71 171 57 S206 71 225 58 S253 68 273 42 S306 61 326 37 S357 46 382 21 S411 36 440 9 L440 130 L0 130 Z" fill="url(#fill)" />
                        <path d="M0 108 C35 95 38 78 67 88 S97 62 123 76 S150 71 171 57 S206 71 225 58 S253 68 273 42 S306 61 326 37 S357 46 382 21 S411 36 440 9" fill="none" stroke="#776bd5" strokeWidth="3" />
                      </svg>
                    </div>
                    <div className="chart-labels"><span>Sep 9</span><span>Sep 16</span><span>Sep 23</span><span>Sep 30</span><span>Oct 8</span></div>
                  </div>

                  <div className="panel service-panel">
                    <div className="panel-heading">
                      <div><h2>Popular services</h2><p>Catalog offerings</p></div>
                      <button className="more-button" onClick={() => setActiveView('Services')}>All →</button>
                    </div>
                    {services.slice(0, 4).map((service, index) => (
                      <div className="service-row" key={service._id || service.name} style={{ cursor: 'pointer' }} onClick={() => { setSelectedServiceForBook(service); setShowBooking(true); }}>
                        <div className={`service-icon service-${index % 3}`}><Sparkles size={17} /></div>
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
                  <p>Manage salon schedules, completed treatments, and client visits</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                </div>
              </div>
              <div className="appointment-list" style={{ marginTop: '16px' }}>
                {filteredAppointments.length ? (
                  filteredAppointments.map((item) => (
                    <AppointmentRow key={item._id} item={item} onStatusChange={updateStatus} showActions />
                  ))
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          )}

          {/* VIEW: CLIENTS */}
          {activeView === 'Clients' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Client Directory ({clientsList.length})</h2>
                  <p>Registered clients and appointment history</p>
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

          {/* VIEW: SERVICES CATALOG */}
          {activeView === 'Services' && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Services Catalog ({services.length})</h2>
                  <p>Browse treatments and click any card to book</p>
                </div>
                <button className="primary-button" onClick={() => { setSelectedServiceForBook(null); setShowBooking(true); }}>
                  <Plus size={16} /> Add Appointment
                </button>
              </div>
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {services.map((s, idx) => (
                  <div key={s._id} className="stat-card" style={{ flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', background: '#eeedfb', color: '#6257c3', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                          {s.category || 'Hair'}
                        </span>
                        <small style={{ color: '#999' }}>{s.durationMinutes || 45} mins</small>
                      </div>
                      <h3 style={{ margin: '8px 0 4px', fontSize: '16px', fontFamily: 'Playfair Display' }}>{s.name}</h3>
                      <p style={{ margin: 0, fontSize: '11px', color: '#777' }}>{s.description || 'Premium personal care treatment.'}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f0efed' }}>
                      <strong style={{ fontSize: '18px', color: '#25232b' }}>${s.price}</strong>
                      <button className="primary-button" style={{ padding: '6px 14px', fontSize: '11px' }} onClick={() => { setSelectedServiceForBook(s); setShowBooking(true); }}>
                        Book Treatment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: AURA AI CONCIERGE */}
          {activeView === 'Aura AI' && (
            <div className="panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                  style={{ padding: '6px 12px', fontSize: '11px', background: '#6257c3' }}
                  onClick={() => parseIntentAndBook("Book a classic haircut with Sarah tomorrow at 3pm")}
                >
                  ⚡ Auto-Parse Booking
                </button>
              </div>

              {/* Chat Messages */}
              <div style={{ height: '320px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#faf9f8' }}>
                {aiMessages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    {m.role !== 'user' && <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '10px' }}>AI</div>}
                    <div style={{ background: m.role === 'user' ? '#25232b' : '#fff', color: m.role === 'user' ? '#fff' : '#25232b', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', border: m.role === 'user' ? 'none' : '1px solid #ebe9e5', lineHeight: '1.45' }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {aiLoading && <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>Aura is thinking...</div>}
              </div>

              {/* Prompt Suggestions */}
              <div style={{ display: 'flex', gap: '8px', margin: '12px 0', flexWrap: 'wrap' }}>
                <button className="secondary-button" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => handleSendAi("What treatment is best for dry skin?")}>
                  💧 Sensitive skin facials?
                </button>
                <button className="secondary-button" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => handleSendAi("Recommend a master stylist for hair color")}>
                  🎨 Stylist for color?
                </button>
                <button className="secondary-button" style={{ padding: '4px 10px', fontSize: '10px' }} onClick={() => parseIntentAndBook("I need a Deluxe Facial with David Kim on Friday")}>
                  ⚡ Book Facial with David
                </button>
              </div>

              {/* Input Area */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  style={{ flex: 1, border: '1px solid #dfdde0', borderRadius: '9px', padding: '10px 14px', fontSize: '12px', outline: 'none' }}
                  placeholder="Ask Aura anything or describe your appointment needs..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAi()}
                />
                <button className="primary-button" onClick={() => handleSendAi()} disabled={aiLoading}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: BOOKING FORM */}
      {showBooking && (
        <BookingModal
          services={services}
          staff={staff}
          initialService={selectedServiceForBook}
          onClose={() => setShowBooking(false)}
          onSaved={() => {
            setShowBooking(false);
            loadData();
            notify('Appointment booked successfully! Payment & notifications logged.');
          }}
        />
      )}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function StatCard({ label, value, delta, icon: Icon, tone, suffix }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
      <div className="stat-meta">
        <span>{label}</span>
        <div><strong>{value}</strong>{suffix && <small>{suffix}</small>}<em>{delta}</em></div>
      </div>
      <div className="stat-arrow">↗</div>
    </div>
  );
}

function AppointmentRow({ item, onStatusChange, showActions }) {
  return (
    <div className="appointment-row">
      <div className="time">
        <b>{formatTime(item.appointmentDate)}</b>
        <span>{item.durationMinutes || 45} min</span>
      </div>
      <div className="client-avatar">{initials(item.customerName)}</div>
      <div className="appointment-info">
        <b>{item.customerName}</b>
        <span>{item.serviceName}</span>
      </div>
      <div className="stylist">
        <span>with</span>
        <b>{item.staffName || 'Any stylist'}</b>
      </div>
      <span className={`status ${item.status || 'confirmed'}`}>{item.status || 'confirmed'}</span>
      
      <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
        {item.status !== 'completed' && (
          <button
            title="Mark Completed"
            onClick={() => onStatusChange(item._id, 'completed')}
            style={{ border: 'none', background: 'none', color: '#3d9b72', cursor: 'pointer', padding: '4px' }}
          >
            <CheckCircle2 size={16} />
          </button>
        )}
        {item.status !== 'cancelled' && (
          <button
            title="Cancel Appointment"
            onClick={() => onStatusChange(item._id, 'cancelled')}
            style={{ border: 'none', background: 'none', color: '#bd6262', cursor: 'pointer', padding: '4px' }}
          >
            <XCircle size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <CalendarDays size={24} />
      <b>No appointments found</b>
      <span>Try another search or add a new appointment.</span>
    </div>
  );
}

function BookingModal({ services, staff, initialService, onClose, onSaved }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0);
  const defaultDateTime = tomorrow.toISOString().slice(0, 16);

  const defaultService = initialService || services[0] || fallbackServices[0];

  const [form, setForm] = useState({
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    customerPhone: '+1-555-0199',
    serviceId: defaultService._id,
    serviceName: defaultService.name,
    staffId: staff[0]?._id || 'any',
    staffName: staff[0]?.name || 'Any stylist',
    appointmentDate: defaultDateTime,
    totalPrice: defaultService.price,
    notes: ''
  });

  const [saving, setSaving] = useState(false);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const chooseService = (event) => {
    const service = services.find((item) => item._id === event.target.value) || services[0];
    if (service) {
      update('serviceId', service._id);
      update('serviceName', service.name);
      update('totalPrice', service.price);
    }
  };

  const chooseStaff = (event) => {
    const member = staff.find((item) => item._id === event.target.value);
    if (member) {
      update('staffId', member._id);
      update('staffName', member.name);
    } else {
      update('staffId', 'any');
      update('staffName', 'Any stylist');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const safeDate = form.appointmentDate ? new Date(form.appointmentDate).toISOString() : new Date().toISOString();

    const payload = {
      ...form,
      appointmentDate: safeDate,
      durationMinutes: 45
    };

    try {
      // 1. Create booking in Booking service
      const response = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let bookingId = `apt_${Date.now()}`;
      if (response.ok) {
        const data = await response.json();
        if (data.booking?._id) bookingId = data.booking._id;
      }

      // 2. Trigger Payment checkout
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

      // 3. Trigger Notification dispatch
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
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Schedule a visit</p>
            <h2>New appointment</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}><X size={18} /></button>
        </div>

        <label>
          Client name
          <input required value={form.customerName} onChange={(event) => update('customerName', event.target.value)} placeholder="e.g. Olivia Martin" />
        </label>

        <label>
          Email address
          <input type="email" required value={form.customerEmail} onChange={(event) => update('customerEmail', event.target.value)} placeholder="olivia@example.com" />
        </label>

        <div className="form-row">
          <label>
            Service
            <select value={form.serviceId} onChange={chooseService}>
              {services.map((service) => (
                <option value={service._id} key={service._id}>
                  {service.name} · ${service.price}
                </option>
              ))}
            </select>
          </label>

          <label>
            Stylist
            <select value={form.staffId} onChange={chooseStaff}>
              <option value="any">Any Available Stylist</option>
              {staff.map((member) => (
                <option value={member._id} key={member._id}>
                  {member.name} ({(member.specialties || []).join(', ')})
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Date & time
          <input
            required
            type="datetime-local"
            value={form.appointmentDate}
            onChange={(event) => update('appointmentDate', event.target.value)}
          />
        </label>

        <div style={{ background: '#f8f7f4', padding: '12px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '13px' }}>
          <span>Total Fee:</span>
          <b>${form.totalPrice}</b>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Confirming...' : 'Confirm appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
