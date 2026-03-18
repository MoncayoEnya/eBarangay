// src/pages/Events.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useEvents } from '../hooks/useEvents';
import { sendEventReminderSMS } from '../services/smsService';
import {
  Calendar, UserCheck, CheckCircle, TrendingUp, List, CalendarCheck,
  Users, Plus, Edit, Trash2, MapPin, User, Clock, Search, X, Save, Loader,
  Bell, Link, AlertCircle
} from 'lucide-react';

const CATEGORIES  = ['MEETING', 'COMMUNITY', 'FESTIVAL', 'TRAINING', 'DRRM', 'GENERAL'];
const MODULE_LINKS = ['None', 'DRRM', 'Health Services', 'Social Welfare', 'Waste Management', 'Documents'];

const emptyForm = {
  title: '', description: '', category: 'GENERAL',
  date: '', time: '', location: '', organizer: '',
  reminderDays: 1, linkedModule: 'None',
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
    training: 'secondary', drrm: 'error', general: 'primary',
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

  const openCreate = () => { setForm(emptyForm); setEditingItem(null); setFormError(''); setShowModal(true); };
  const openEdit   = (item) => {
    setForm({
      title:        item.title,
      description:  item.description || '',
      category:     item.category,
      date:         item.date,
      time:         item.time || '',
      location:     item.location || '',
      organizer:    item.organizer || '',
      reminderDays: item.reminderDays ?? 1,
      linkedModule: item.linkedModule || 'None',
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

  const handleRSVP = async (item) => { await rsvp(item.id); };

  const filterButtons = [
    { id: 'all',       label: 'All Events',  icon: List         },
    { id: 'meeting',   label: 'Meetings',    icon: Users        },
    { id: 'community', label: 'Community',   icon: UserCheck    },
    { id: 'festival',  label: 'Festivals',   icon: CalendarCheck},
    { id: 'training',  label: 'Training',    icon: TrendingUp   },
    { id: 'drrm',      label: 'DRRM',        icon: CheckCircle  },
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

      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#991b1b', fontWeight: 500 }}>{error}</span>
          <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} color="#dc2626" /></button>
        </div>
      )}

      <div className="stats-grid">
        <StatCard title="Total Events"  value={stats?.total      || events.length} icon={Calendar}     iconBg="icon-bg-primary"   badge="All time"    badgeColor="badge-primary" />
        <StatCard title="Upcoming"      value={stats?.upcoming   || 0}             icon={CalendarCheck} iconBg="icon-bg-warning"   badge="Scheduled"   badgeColor="badge-warning" />
        <StatCard title="Total RSVPs"   value={stats?.totalRsvps || 0}             icon={UserCheck}     iconBg="icon-bg-success"   badge="Confirmed"   badgeColor="badge-success" />
        <StatCard title="This Month"    value={filtered.length}                    icon={TrendingUp}    iconBg="icon-bg-secondary" badge="Showing now" badgeColor="badge-gray" />
      </div>

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
                  <div style={{ width: 56, flexShrink: 0, textAlign: 'center', background: `var(--color-${color}-light, #eff6ff)`, borderRadius: 10, padding: '8px 4px' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: `var(--color-${color}, #2563eb)` }}>{day}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: `var(--color-${color}, #2563eb)`, marginTop: 2 }}>{month}</div>
                  </div>
                  <div className="list-card-body">
                    <div className="list-card-header">
                      <span className={`badge badge-${color}`}>{evt.category}</span>
                      {evt.linkedModule && evt.linkedModule !== 'None' && (
                        <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Link size={10} />{evt.linkedModule}
                        </span>
                      )}
                    </div>
                    <h3 className="list-card-title">{evt.title}</h3>
                    {evt.description && <p className="list-card-description">{evt.description}</p>}
                    <div className="list-card-meta">
                      {evt.time      && <span className="list-card-meta-item"><Clock    size={13} />{evt.time}</span>}
                      {evt.location  && <span className="list-card-meta-item"><MapPin   size={13} />{evt.location}</span>}
                      {evt.organizer && <span className="list-card-meta-item"><User     size={13} />{evt.organizer}</span>}
                      <span className="list-card-meta-item"><UserCheck size={13} />{evt.rsvps || 0} RSVPs</span>
                      {evt.reminderDays > 0 && (
                        <span className="list-card-meta-item"><Bell size={13} />{evt.reminderDays}d reminder</span>
                      )}
                    </div>
                  </div>
                  <div className="list-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRSVP(evt)}>
                      <UserCheck size={14} /> RSVP
                    </button>
                    <button className="btn-icon" onClick={() => openEdit(evt)}><Edit size={17} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(evt)} style={{ color: 'var(--color-error)' }}><Trash2 size={17} /></button>
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

      {/* ══ CREATE / EDIT EVENT MODAL ══ */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal} style={{ backdropFilter:'blur(8px)', background:'rgba(15,23,42,0.50)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:22, width:'100%', maxWidth:580, maxHeight:'92vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(15,23,42,0.20), 0 0 0 1.5px rgba(240,244,248,1)', overflow:'hidden', animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)' }}>

            {/* Header */}
            <div style={{ background: form.category === 'DRRM' ? 'linear-gradient(135deg,#DC2626,#EF4444)' : form.category === 'FESTIVAL' ? 'linear-gradient(135deg,#D97706,#F59E0B)' : form.category === 'TRAINING' ? 'linear-gradient(135deg,#5B21B6,#8B5CF6)' : form.category === 'COMMUNITY' ? 'linear-gradient(135deg,#065F46,#10B981)' : 'linear-gradient(135deg,#1D4ED8,#3B82F6)', padding:'20px 24px 0', flexShrink:0, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:-20, top:-20, width:90, height:90, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Calendar size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize:17, fontWeight:800, color:'#fff', margin:0, letterSpacing:'-0.025em' }}>{editingItem ? 'Edit Event' : 'Create Event'}</h2>
                    <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.72)', margin:'2px 0 0' }}>Schedule a barangay event</p>
                  </div>
                </div>
                <button onClick={closeModal} style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}>
                  <X size={16}/>
                </button>
              </div>
              {/* Category pills */}
              <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:16, msOverflowStyle:'none', scrollbarWidth:'none' }}>
                {CATEGORIES.map(c => {
                  const active = form.category === c;
                  return (
                    <button key={c} type="button" onClick={() => setForm(p=>({...p, category:c}))}
                      style={{ padding:'5px 13px', borderRadius:100, fontSize:11.5, fontWeight:700, border:'none', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', background: active ? '#fff' : 'rgba(255,255,255,0.15)', color: active ? '#1D4ED8' : 'rgba(255,255,255,0.9)', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.15)' : 'none', letterSpacing:'0.04em' }}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div style={{ flex:1, overflowY:'auto', padding:'22px 24px', display:'flex', flexDirection:'column', gap:16 }}>
              {formError && <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:10, fontSize:13, color:'#DC2626', fontWeight:500 }}><AlertCircle size={14}/>{formError}</div>}

              <div className="form-group">
                <label className="form-label">Event Title <span style={{color:'#EF4444'}}>*</span></label>
                <input className="form-input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Barangay Assembly Meeting" style={{fontSize:15,fontWeight:500}}/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div className="form-group">
                  <label className="form-label">Date <span style={{color:'#EF4444'}}>*</span></label>
                  <input type="date" className="form-input" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input className="form-input" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} placeholder="e.g. 9:00 AM – 12:00 PM"/>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div className="form-group">
                  <label className="form-label"><MapPin size={12} style={{verticalAlign:'middle',marginRight:4}}/>Location</label>
                  <input className="form-input" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} placeholder="e.g. Barangay Hall"/>
                </div>
                <div className="form-group">
                  <label className="form-label"><User size={12} style={{verticalAlign:'middle',marginRight:4}}/>Organizer</label>
                  <input className="form-input" value={form.organizer} onChange={e=>setForm(p=>({...p,organizer:e.target.value}))} placeholder="e.g. Barangay Captain"/>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Event details, agenda, or what residents should bring..."/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div className="form-group">
                  <label className="form-label"><Bell size={12} style={{verticalAlign:'middle',marginRight:4}}/>SMS Reminder (days before)</label>
                  <input type="number" className="form-input" min={0} max={30} value={form.reminderDays} onChange={e=>setForm(p=>({...p,reminderDays:Number(e.target.value)}))}/>
                  <span style={{fontSize:11.5,color:'#94A3B8',display:'block',marginTop:4}}>Set 0 to disable SMS reminder</span>
                </div>
                <div className="form-group">
                  <label className="form-label"><Link size={12} style={{verticalAlign:'middle',marginRight:4}}/>Linked Module</label>
                  <select className="form-select" value={form.linkedModule} onChange={e=>setForm(p=>({...p,linkedModule:e.target.value}))}>
                    {MODULE_LINKS.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Preview */}
              {form.title && form.date && (
                <div style={{ background:'#F8FAFC', border:'1.5px solid #F0F4F8', borderRadius:14, padding:'13px 15px' }}>
                  <p style={{ fontSize:10.5, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 8px' }}>Preview</p>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    {(() => { const d = new Date(form.date+'T00:00:00'); return (
                      <div style={{ width:48, height:54, borderRadius:11, background:'linear-gradient(135deg,#1D4ED8,#3B82F6)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 3px 10px rgba(37,99,235,0.28)' }}>
                        <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'.08em' }}>{d.toLocaleString('en',{month:'short'})}</span>
                        <span style={{ fontSize:20, fontWeight:800, color:'#fff', lineHeight:1.1 }}>{d.getDate()}</span>
                      </div>
                    ); })()}
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:'#0F172A', margin:'0 0 3px' }}>{form.title}</p>
                      <p style={{ fontSize:12, color:'#64748B', margin:0 }}>
                        {form.time && <span><Clock size={11} style={{verticalAlign:'middle',marginRight:3}}/>{form.time} · </span>}
                        {form.location && <span><MapPin size={11} style={{verticalAlign:'middle',marginRight:3}}/>{form.location}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:'14px 24px', borderTop:'1.5px solid #F0F4F8', display:'flex', justifyContent:'flex-end', background:'#FAFBFE', flexShrink:0, gap:10 }}>
              <button className="btn btn-secondary btn-md" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleSave} disabled={saving} style={{ minWidth:130 }}>
                {saving ? <><Loader size={15} className="animate-spin"/>Saving…</> : <><Save size={15}/>{editingItem ? 'Update Event' : 'Create Event'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;