// src/pages/Events.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useEvents } from '../hooks/useEvents';
import {
  Calendar, UserCheck, CheckCircle, TrendingUp, List, CalendarCheck,
  Users, Plus, Edit, Trash2, MapPin, User, Clock, Search, X, Save, Loader
} from 'lucide-react';

const CATEGORIES = ['MEETING', 'COMMUNITY', 'FESTIVAL', 'TRAINING', 'GENERAL'];

const emptyForm = {
  title: '', description: '', category: 'GENERAL',
  date: '', time: '', location: '', organizer: '',
};

const Events = () => {
  const { events, loading, error, stats, loadEvents, loadStats, create, update, rsvp, remove, clearError } = useEvents();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery]   = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editingItem, setEditingItem]   = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [saving, setSaving]             = useState(false);
  const [formError, setFormError]       = useState('');

  useEffect(() => { loadEvents(); loadStats(); }, []);

  const getCategoryColor = (cat) => ({
    meeting: 'primary', community: 'success', festival: 'warning',
    training: 'secondary', general: 'primary',
  })[cat?.toLowerCase()] || 'primary';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  const getDayMonth = (dateStr) => {
    if (!dateStr) return { day: '—', month: '—' };
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return {
        day: d.getDate().toString().padStart(2, '0'),
        month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
      };
    } catch { return { day: '—', month: '—' }; }
  };

  const filtered = events.filter(e => {
    const matchSearch =
      e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === 'all' || e.categoryType === activeFilter;
    return matchSearch && matchFilter;
  });

  // ── Modal ──
  const openCreate = () => { setForm(emptyForm); setEditingItem(null); setFormError(''); setShowModal(true); };
  const openEdit   = (item) => {
    setForm({
      title: item.title, description: item.description || '',
      category: item.category, date: item.date, time: item.time || '',
      location: item.location || '', organizer: item.organizer || '',
    });
    setEditingItem(item); setFormError(''); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) {
      setFormError('Title and date are required.'); return;
    }
    setSaving(true);
    const payload = { ...form, categoryType: form.category.toLowerCase() };
    const result = editingItem
      ? await update(editingItem.id, payload)
      : await create(payload);
    setSaving(false);
    if (result.success) { closeModal(); loadStats(); }
    else setFormError(result.error || 'Something went wrong.');
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete event "${item.title}"?`)) return;
    await remove(item.id);
  };

  const handleRSVP = async (item) => {
    await rsvp(item.id);
  };

  const filterButtons = [
    { id: 'all',       label: 'All Events',  icon: List         },
    { id: 'meeting',   label: 'Meetings',    icon: Users        },
    { id: 'community', label: 'Community',   icon: UserCheck    },
    { id: 'festival',  label: 'Festivals',   icon: CalendarCheck},
    { id: 'training',  label: 'Training',    icon: TrendingUp   },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Events Calendar</h1>
          <p className="page-subtitle">Manage barangay events and track attendance</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openCreate}>
          <Plus size={18} /> Create Event
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#991b1b', fontWeight: 500 }}>{error}</span>
          <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#dc2626" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Total Events"    value={stats?.total      || events.length} icon={Calendar}     iconBg="icon-bg-primary"   badge="All time"      badgeColor="badge-primary" />
        <StatCard title="Upcoming"        value={stats?.upcoming   || 0}             icon={CalendarCheck} iconBg="icon-bg-warning"   badge="Scheduled"     badgeColor="badge-warning" />
        <StatCard title="Total RSVPs"     value={stats?.totalRsvps || 0}             icon={UserCheck}     iconBg="icon-bg-success"   badge="Confirmed"     badgeColor="badge-success" />
        <StatCard title="This Month"      value={filtered.length}                    icon={TrendingUp}    iconBg="icon-bg-secondary" badge="Showing now"   badgeColor="badge-gray" />
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-buttons-group">
          {filterButtons.map(btn => {
            const Icon = btn.icon;
            return (
              <button key={btn.id} onClick={() => setActiveFilter(btn.id)}
                className={`filter-btn ${activeFilter === btn.id ? 'active' : ''}`}>
                <Icon size={16} /> {btn.label}
              </button>
            );
          })}
        </div>
        <div className="action-buttons-group">
          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Search events..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input" style={{ paddingLeft: 38 }} />
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="empty-state"><Loader size={32} className="animate-spin" style={{ color: '#3b82f6' }} /><p style={{ marginTop: 12, color: '#64748b' }}>Loading events...</p></div>
      ) : filtered.length > 0 ? (
        <div className="list-container">
          {filtered.map(evt => {
            const { day, month } = getDayMonth(evt.date);
            const color = getCategoryColor(evt.categoryType);
            return (
              <div key={evt.id} className={`list-card list-card-${color}`}>
                <div className="list-card-content">
                  {/* Date badge */}
                  <div style={{ width: 56, flexShrink: 0, textAlign: 'center', background: `var(--color-${color}-light, #eff6ff)`, borderRadius: 10, padding: '8px 4px' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: `var(--color-${color}, #2563eb)` }}>{day}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: `var(--color-${color}, #2563eb)`, marginTop: 2 }}>{month}</div>
                  </div>
                  <div className="list-card-body">
                    <div className="list-card-header">
                      <span className={`badge badge-${color}`}>{evt.category}</span>
                      {evt.status && <span style={{ fontSize: 11, color: '#64748b' }}>{evt.status}</span>}
                    </div>
                    <h3 className="list-card-title">{evt.title}</h3>
                    {evt.description && <p className="list-card-description">{evt.description}</p>}
                    <div className="list-card-meta">
                      {evt.time     && <span className="list-card-meta-item"><Clock   size={13} />{evt.time}</span>}
                      {evt.location && <span className="list-card-meta-item"><MapPin  size={13} />{evt.location}</span>}
                      {evt.organizer&& <span className="list-card-meta-item"><User    size={13} />{evt.organizer}</span>}
                      <span className="list-card-meta-item"><UserCheck size={13} />{evt.rsvps || 0} RSVPs</span>
                    </div>
                  </div>
                  <div className="list-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRSVP(evt)} title="RSVP">
                      <UserCheck size={14} /> RSVP
                    </button>
                    <button className="btn-icon" onClick={() => openEdit(evt)} title="Edit"><Edit size={17} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(evt)} title="Delete" style={{ color: 'var(--color-error)' }}><Trash2 size={17} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Calendar size={40} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 12px' }} />
          <h3 className="empty-state-title">No events found</h3>
          <p className="empty-state-description">
            {searchQuery ? 'Try a different search' : 'Click "Create Event" to add the first event'}
          </p>
          <button className="btn btn-primary btn-md" style={{ marginTop: 16 }} onClick={openCreate}>
            <Plus size={16} /> Create First Event
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingItem ? 'Edit Event' : 'Create Event'}</h2>
              <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error mb-3">{formError}</div>}
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Barangay Assembly Meeting" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" value={form.time}
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    placeholder="e.g. 9:00 AM - 12:00 PM" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Barangay Hall" />
              </div>
              <div className="form-group">
                <label className="form-label">Organizer</label>
                <input className="form-input" value={form.organizer}
                  onChange={e => setForm(p => ({ ...p, organizer: e.target.value }))}
                  placeholder="e.g. Barangay Captain" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={4} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Event details..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader size={15} className="animate-spin" />Saving...</> : <><Save size={16} />{editingItem ? 'Update' : 'Create'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;