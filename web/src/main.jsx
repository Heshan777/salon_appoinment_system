import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight, Bell, CalendarDays, ChevronDown, Clock3, DollarSign,
  LayoutDashboard, Menu, Plus, Search, Settings, Sparkles, UserRound,
  UsersRound, X
} from 'lucide-react';
import './styles.css';

const API = 'http://localhost:5000';

const fallbackAppointments = [
  { _id: 'apt_sample_1', customerName: 'Alice Walker', serviceName: 'Classic Haircut & Styling', staffName: 'Sarah Jenkins', appointmentDate: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 45, status: 'confirmed', totalPrice: 35 }
];
const fallbackServices = [
  { _id: 'srv_1', name: 'Classic Haircut & Styling', category: 'Hair', durationMinutes: 45, price: 35 },
  { _id: 'srv_2', name: 'Deluxe Facial Treatment', category: 'Skincare', durationMinutes: 60, price: 75 },
  { _id: 'srv_3', name: 'Gel Manicure & Pedicure', category: 'Nails', durationMinutes: 75, price: 60 }
];

const formatTime = (date) => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
const formatDate = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(date));
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
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [activeView, setActiveView] = useState('Overview');
  const [showBooking, setShowBooking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');

  const loadData = async () => {
    const [bookingData, serviceData] = await Promise.all([
      getJson('/api/bookings', { bookings: fallbackAppointments }),
      getJson('/api/catalog/services', { services: fallbackServices })
    ]);
    setAppointments(bookingData.bookings || fallbackAppointments);
    setServices(serviceData.services || fallbackServices);
  };

  useEffect(() => { loadData(); }, []);

  const filteredAppointments = useMemo(() => appointments.filter((item) =>
    [item.customerName, item.serviceName, item.staffName].join(' ').toLowerCase().includes(query.toLowerCase())
  ), [appointments, query]);

  const revenue = appointments.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const todayCount = appointments.filter((item) => new Date(item.appointmentDate).toDateString() === new Date().toDateString()).length;

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Appointments', icon: CalendarDays, count: appointments.length },
    { label: 'Clients', icon: UsersRound },
    { label: 'Services', icon: Sparkles }
  ];

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="brand"><div className="brand-mark">M</div><div><strong>maison</strong><span>salon & spa</span></div></div>
        <div className="workspace-switcher"><span className="workspace-avatar">L</span><div><b>Luxe Salon</b><small>Admin workspace</small></div><ChevronDown size={15} /></div>
        <div className="nav-label">Workspace</div>
        <nav>
          {navItems.map(({ label, icon: Icon, count }) => (
            <button className={`nav-item ${activeView === label ? 'active' : ''}`} key={label} onClick={() => { setActiveView(label); setMenuOpen(false); }}>
              <Icon size={18} strokeWidth={activeView === label ? 2.4 : 1.8} /><span>{label}</span>{count ? <em>{count}</em> : null}
            </button>
          ))}
        </nav>
        <div className="nav-label settings-label">Manage</div>
        <nav><button className="nav-item" onClick={() => notify('Settings are ready for customization')}><Settings size={18} /><span>Settings</span></button></nav>
        <div className="sidebar-footer"><div className="help-card"><Sparkles size={17} /><b>Need a hand?</b><span>Explore Maison help center</span><button onClick={() => notify('Help center opened')}>Visit help center <ArrowUpRight size={14} /></button></div><div className="profile"><div className="avatar">SO</div><div><b>Sarah Olsen</b><small>Salon owner</small></div><ChevronDown size={15} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button><div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{activeView}</strong></div><div className="top-actions"><div className="search"><Search size={17} /><input placeholder="Search anything..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></div><button className="icon-button" onClick={() => notify('You are all caught up')}><Bell size={19} /><i /></button><div className="mini-avatar">SO</div></div></header>
        <div className="page">
          <section className="welcome-row"><div><p className="eyebrow">Wednesday, October 8, 2026</p><h1>Good morning, Sarah <span>✦</span></h1><p className="subcopy">Here’s what’s happening at Luxe Salon today.</p></div><button className="primary-button" onClick={() => setShowBooking(true)}><Plus size={18} /> New appointment</button></section>

          <section className="stats-grid">
            <StatCard label="Today's appointments" value={todayCount || 0} delta="+12.5%" icon={CalendarDays} tone="lavender" />
            <StatCard label="Monthly revenue" value={`$${(revenue * 18.4 + 3240).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} delta="+8.2%" icon={DollarSign} tone="peach" />
            <StatCard label="New clients" value="24" delta="+18.4%" icon={UsersRound} tone="mint" />
            <StatCard label="Avg. service rating" value="4.9" delta="+0.3" icon={Sparkles} tone="yellow" suffix="/ 5.0" />
          </section>

          <section className="content-grid">
            <div className="panel appointments-panel"><div className="panel-heading"><div><h2>Upcoming appointments</h2><p>Your schedule at a glance</p></div><button className="text-button" onClick={() => setActiveView('Appointments')}>View calendar <ArrowUpRight size={15} /></button></div><div className="date-strip"><button>‹</button><div><small>Today</small><b>Wed, Oct 8</b></div><div className="date-selected"><small>Tomorrow</small><b>Thu, Oct 9</b></div><div><small>Friday</small><b>Oct 10</b></div><button>›</button></div><div className="appointment-list">{filteredAppointments.length ? filteredAppointments.slice(0, 5).map((item) => <AppointmentRow key={item._id} item={item} />) : <EmptyState />}</div></div>
            <div className="right-column"><div className="panel revenue-panel"><div className="panel-heading"><div><h2>Revenue overview</h2><p>Last 30 days</p></div><button className="select-button">This month <ChevronDown size={14} /></button></div><div className="revenue-total"><strong>${(revenue * 18.4 + 3240).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong><span><ArrowUpRight size={14} /> 8.2%</span></div><div className="chart"><div className="chart-lines"><i /><i /><i /><i /></div><svg viewBox="0 0 440 130" preserveAspectRatio="none"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7e72db" stopOpacity=".22" /><stop offset="100%" stopColor="#7e72db" stopOpacity="0" /></linearGradient></defs><path d="M0 108 C35 95 38 78 67 88 S97 62 123 76 S150 71 171 57 S206 71 225 58 S253 68 273 42 S306 61 326 37 S357 46 382 21 S411 36 440 9 L440 130 L0 130 Z" fill="url(#fill)" /><path d="M0 108 C35 95 38 78 67 88 S97 62 123 76 S150 71 171 57 S206 71 225 58 S253 68 273 42 S306 61 326 37 S357 46 382 21 S411 36 440 9" fill="none" stroke="#776bd5" strokeWidth="3" /></svg></div><div className="chart-labels"><span>Sep 9</span><span>Sep 16</span><span>Sep 23</span><span>Sep 30</span><span>Oct 8</span></div></div><div className="panel service-panel"><div className="panel-heading"><div><h2>Popular services</h2><p>Based on bookings this month</p></div><button className="more-button">•••</button></div>{services.slice(0, 3).map((service, index) => <div className="service-row" key={service._id || service.name}><div className={`service-icon service-${index}`}><Sparkles size={17} /></div><div className="service-info"><b>{service.name}</b><small>{service.durationMinutes || 45} min <span>·</span> {service.category || 'Beauty'}</small></div><strong>${service.price}</strong></div>)}</div></div>
          </section>
        </div>
      </main>
      {showBooking && <BookingModal services={services} onClose={() => setShowBooking(false)} onSaved={() => { setShowBooking(false); loadData(); notify('Appointment created successfully'); }} />}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}

function StatCard({ label, value, delta, icon: Icon, tone, suffix }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-meta"><span>{label}</span><div><strong>{value}</strong>{suffix && <small>{suffix}</small>}<em>{delta}</em></div></div><div className="stat-arrow">↗</div></div>;
}
function AppointmentRow({ item }) {
  return <div className="appointment-row"><div className="time"><b>{formatTime(item.appointmentDate)}</b><span>{item.durationMinutes || 45} min</span></div><div className="client-avatar">{initials(item.customerName)}</div><div className="appointment-info"><b>{item.customerName}</b><span>{item.serviceName}</span></div><div className="stylist"><span>with</span><b>{item.staffName || 'Any stylist'}</b></div><span className={`status ${item.status}`}>{item.status}</span><button className="row-more">•••</button></div>;
}
function EmptyState() { return <div className="empty-state"><CalendarDays size={24} /><b>No appointments found</b><span>Try another search or add a new appointment.</span></div>; }
function BookingModal({ services, onClose, onSaved }) {
  const [form, setForm] = useState({ customerName: '', customerEmail: '', serviceId: services[0]?._id || '', serviceName: services[0]?.name || '', appointmentDate: '', totalPrice: services[0]?.price || 0 });
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const chooseService = (event) => { const service = services.find((item) => item._id === event.target.value); update('serviceId', service._id); update('serviceName', service.name); update('totalPrice', service.price); };
  const submit = async (event) => { event.preventDefault(); setSaving(true); try { const response = await fetch(`${API}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, appointmentDate: new Date(form.appointmentDate).toISOString(), customerPhone: '', durationMinutes: 45 }) }); if (!response.ok) throw new Error(); onSaved(); } catch { setSaving(false); alert('Could not create the appointment. Please check that the API services are running.'); } };
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal" onSubmit={submit}><div className="modal-heading"><div><p className="eyebrow">Schedule a visit</p><h2>New appointment</h2></div><button type="button" className="close-button" onClick={onClose}><X size={18} /></button></div><label>Client name<input required value={form.customerName} onChange={(event) => update('customerName', event.target.value)} placeholder="e.g. Olivia Martin" /></label><label>Email address<input type="email" required value={form.customerEmail} onChange={(event) => update('customerEmail', event.target.value)} placeholder="olivia@example.com" /></label><div className="form-row"><label>Service<select value={form.serviceId} onChange={chooseService}>{services.map((service) => <option value={service._id} key={service._id}>{service.name} · ${service.price}</option>)}</select></label><label>Date & time<input required type="datetime-local" value={form.appointmentDate} onChange={(event) => update('appointmentDate', event.target.value)} /></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Booking...' : 'Confirm appointment'}</button></div></form></div>;
}

createRoot(document.getElementById('root')).render(<App />);
