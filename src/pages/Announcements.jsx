// src/pages/Announcements.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useAnnouncements } from '../hooks/useAnnouncements';
import {
  Megaphone, AlertCircle, CheckCircle, Eye, List,
  Plus, Edit, Trash2, User, Clock, Search, Bell,
  TrendingUp, X, Save, MessageSquare, Send, ThumbsUp,
  Loader, ChevronDown, ChevronUp
} from 'lucide-react';
import { db } from '../services/firebase';
import {
  collection, addDoc, getDocs, updateDoc, doc,
  serverTimestamp, query, orderBy
} from 'firebase/firestore';

const TYPES   = ['GENERAL', 'IMPORTANT', 'URGENT', 'INFO'];
const emptyForm = { title: '', description: '', type: 'GENERAL', author: '', targetGroup: 'All Residents' };

const Announcements = () => {
  const { announcements, loading, error, stats, loadAnnouncements, create, update, remove, loadStats } = useAnnouncements();

  const [activeSection, setActiveSection] = useState('announcements'); // 'announcements' | 'feedback'
  const [activeFilter, setActiveFilter]   = useState('all');
  const [searchQuery, setSearchQuery]     = useState('');
  const [showModal, setShowModal]         = useState(false);
  const [editingItem, setEditingItem]     = useState(null);
  const [form, setForm]                   = useState(emptyForm);
  const [saving, setSaving]               = useState(false);
  const [formError, setFormError]         = useState('');

  // Feedback state
  const [feedbacks, setFeedbacks]         = useState([]);
  const [fbLoading, setFbLoading]         = useState(false);
  const [fbForm, setFbForm]               = useState({ name: '', category: 'Suggestion', message: '' });
  const [fbSaving, setFbSaving]           = useState(false);
  const [fbError, setFbError]             = useState('');
  const [fbSuccess, setFbSuccess]         = useState(false);
  const [expandedFb, setExpandedFb]       = useState(null);

  useEffect(() => { loadAnnouncements(); loadStats(); }, []);
  useEffect(() => { if (activeSection === 'feedback') loadFeedbacks(); }, [activeSection]);

  // ── Feedback Firebase ops ──
  const loadFeedbacks = async () => {
    setFbLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (_) {}
    setFbLoading(false);
  };

  const submitFeedback = async () => {
    if (!fbForm.message.trim()) { setFbError('Message is required.'); return; }
    setFbSaving(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        ...fbForm,
        status: 'New',
        createdAt: serverTimestamp(),
      });
      setFbForm({ name: '', category: 'Suggestion', message: '' });
      setFbSuccess(true);
      setFbError('');
      setTimeout(() => setFbSuccess(false), 3000);
      loadFeedbacks();
    } catch (e) { setFbError(e.message); }
    setFbSaving(false);
  };

  const markFeedbackRead = async (id) => {
    try {
      await updateDoc(doc(db, 'feedback', id), { status: 'Read' });
      setFeedbacks(p => p.map(f => f.id === id ? { ...f, status: 'Read' } : f));
    } catch (_) {}
  };

  // ── Announcement helpers ──
  const getTypeColor = (t) => ({
    urgent: 'error', important: 'warning', general: 'primary', info: 'success',
  })[t?.toLowerCase()] || 'primary';

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)   return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return `${Math.floor(mins/1440)}d ago`;
  };

  const filtered = announcements.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === 'all' || a.typeClass === activeFilter;
    return matchSearch && matchFilter;
  });

  const openCreate = () => { setForm(emptyForm); setEditingItem(null); setFormError(''); setShowModal(true); };
  const openEdit   = (item) => {
    setForm({ title: item.title, description: item.description, type: item.type, author: item.author || '', targetGroup: item.targetGroup || 'All Residents' });
    setEditingItem(item); setFormError(''); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingItem(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) { setFormError('Title and description are required.'); return; }
    setSaving(true);
    const payload = { ...form, typeClass: form.type.toLowerCase() };
    const result = editingItem ? await update(editingItem.id, payload) : await create(payload);
    setSaving(false);
    if (result.success) { closeModal(); loadStats(); }
    else setFormError(result.error || 'Something went wrong.');
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    await remove(item.id); loadStats();
  };

  const filterButtons = [
    { id: 'all',       label: 'All',       icon: List        },
    { id: 'urgent',    label: 'Urgent',    icon: AlertCircle },
    { id: 'important', label: 'Important', icon: Megaphone   },
    { id: 'general',   label: 'General',   icon: Bell        },
    { id: 'info',      label: 'Info',      icon: CheckCircle },
  ];

  const fbCategories = ['Suggestion', 'Complaint', 'Inquiry', 'Compliment', 'Other'];
  const newFbCount   = feedbacks.filter(f => f.status === 'New').length;

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Manage barangay announcements and resident feedback</p>
        </div>
        {activeSection === 'announcements' && (
          <button className="btn btn-primary btn-md" onClick={openCreate}>
            <Plus size={18} /> Create Announcement
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Total Posts"  value={stats?.total      || announcements.length} icon={Megaphone}   iconBg="icon-bg-primary"   badge="All time"    badgeColor="badge-primary" />
        <StatCard title="Total Views"  value={stats?.totalViews || 0}                    icon={Eye}         iconBg="icon-bg-success"   badge="Cumulative"  badgeColor="badge-success" />
        <StatCard title="Active"       value={stats?.active     || 0}                    icon={CheckCircle} iconBg="icon-bg-warning"   badge="Currently"   badgeColor="badge-gray" />
        <StatCard title="Feedback"     value={newFbCount}                                icon={MessageSquare} iconBg="icon-bg-secondary" badge="Unread" badgeColor={newFbCount > 0 ? "badge-warning" : "badge-gray"} />
      </div>

      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'announcements', label: 'Announcements', icon: Megaphone     },
          { id: 'feedback',      label: `Feedback${newFbCount > 0 ? ` (${newFbCount})` : ''}`, icon: MessageSquare },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: activeSection === s.id ? '#fff' : 'transparent',
                color: activeSection === s.id ? '#0f172a' : '#64748b',
                boxShadow: activeSection === s.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>
              <Icon size={15} />{s.label}
            </button>
          );
        })}
      </div>

      {/* ANNOUNCEMENTS SECTION */}
      {activeSection === 'announcements' && (
        <>
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
              <div style={{ position: 'relative', minWidth: 250 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Search announcements..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} className="form-input" style={{ paddingLeft: 38 }} />
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error mb-4">{error}</div>}

          {loading ? (
            <div className="empty-state"><Loader size={28} className="animate-spin" style={{ color: '#3b82f6' }} /></div>
          ) : filtered.length > 0 ? (
            <div className="list-container">
              {filtered.map(a => {
                const color = getTypeColor(a.typeClass);
                return (
                  <div key={a.id} className={`list-card list-card-${color}`}>
                    <div className="list-card-content">
                      <div style={{ width: 52, height: 52, background: `var(--color-${color}-light)`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: `var(--color-${color})` }}>
                        <Megaphone size={26} />
                      </div>
                      <div className="list-card-body">
                        <div className="list-card-header">
                          <span className={`badge badge-${color}`}>{a.type}</span>
                          <span className="list-card-meta-item"><Clock size={13} />{formatTime(a.systemInfo?.createdAt)}</span>
                        </div>
                        <h3 className="list-card-title">{a.title}</h3>
                        <p className="list-card-description">{a.description}</p>
                        <div className="list-card-meta">
                          <span className="list-card-meta-item"><User size={13} />{a.author || 'Admin'}</span>
                          <span className="list-card-meta-item"><Eye size={13} />{a.views || 0} views</span>
                          {a.targetGroup && <span className="list-card-meta-item">→ {a.targetGroup}</span>}
                        </div>
                      </div>
                      <div className="list-card-actions">
                        <button className="btn-icon" onClick={() => openEdit(a)} title="Edit"><Edit size={17} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(a)} title="Delete" style={{ color: 'var(--color-error)' }}><Trash2 size={17} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Megaphone className="empty-state-icon" />
              <h3 className="empty-state-title">No announcements found</h3>
              <p className="empty-state-description">Create a new announcement to get started</p>
              <button className="btn btn-primary btn-md" style={{ marginTop: 16 }} onClick={openCreate}><Plus size={16} /> Create First Announcement</button>
            </div>
          )}
        </>
      )}

      {/* FEEDBACK SECTION */}
      {activeSection === 'feedback' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20, alignItems: 'start' }}>

          {/* Submit form */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={16} color="#3b82f6" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Submit Feedback</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Residents can submit here</p>
              </div>
            </div>

            {fbSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThumbsUp size={14} color="#16a34a" />
                <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>Feedback submitted successfully!</span>
              </div>
            )}
            {fbError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#dc2626' }}>{fbError}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Your Name <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" value={fbForm.name}
                  onChange={e => setFbForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Juan Dela Cruz" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={fbForm.category}
                  onChange={e => setFbForm(p => ({ ...p, category: e.target.value }))}>
                  {fbCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea className="form-textarea" rows={4} value={fbForm.message}
                  onChange={e => { setFbForm(p => ({ ...p, message: e.target.value })); setFbError(''); }}
                  placeholder="Share your feedback, suggestion, or concern..." />
              </div>
              <button className="btn btn-primary btn-md" onClick={submitFeedback} disabled={fbSaving}>
                {fbSaving ? <><Loader size={14} className="animate-spin" />Submitting...</> : <><Send size={14} />Submit Feedback</>}
              </button>
            </div>
          </div>

          {/* Feedback list */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>
                Received Feedback
                {newFbCount > 0 && <span style={{ fontSize: 12, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 999, marginLeft: 8, fontWeight: 600 }}>{newFbCount} new</span>}
              </p>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{feedbacks.length} total</span>
            </div>

            {fbLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}><Loader size={24} className="animate-spin" style={{ color: '#3b82f6' }} /></div>
            ) : feedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                <MessageSquare size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 13, margin: 0 }}>No feedback received yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {feedbacks.map(fb => {
                  const isNew = fb.status === 'New';
                  const isExpanded = expandedFb === fb.id;
                  const catColor = { Suggestion: '#3b82f6', Complaint: '#ef4444', Inquiry: '#f59e0b', Compliment: '#10b981', Other: '#8b5cf6' }[fb.category] || '#64748b';
                  return (
                    <div key={fb.id} style={{ background: isNew ? '#fffbeb' : '#fff', border: `1px solid ${isNew ? '#fde68a' : '#f1f5f9'}`, borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: catColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MessageSquare size={15} color={catColor} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{fb.name || 'Anonymous'}</span>
                            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: catColor + '20', color: catColor, fontWeight: 600 }}>{fb.category}</span>
                            {isNew && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>NEW</span>}
                          </div>
                          <p style={{ fontSize: 13, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
                            {fb.message}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button className="btn-icon btn-icon-sm" onClick={() => setExpandedFb(isExpanded ? null : fb.id)} title="Expand">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {isNew && (
                            <button className="btn-icon btn-icon-sm" onClick={() => markFeedbackRead(fb.id)} title="Mark as read" style={{ color: '#10b981' }}>
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingItem ? 'Edit Announcement' : 'Create Announcement'}</h2>
              <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formError && <div className="alert alert-error mb-3">{formError}</div>}
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" />
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Group</label>
                <input className="form-input" value={form.targetGroup} onChange={e => setForm(p => ({ ...p, targetGroup: e.target.value }))} placeholder="e.g. All Residents, Senior Citizens, Purok 1" />
              </div>
              <div className="form-group">
                <label className="form-label">Author</label>
                <input className="form-input" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} placeholder="e.g. Barangay Captain" />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows={5} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Announcement details..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleSave} disabled={saving}>
                <Save size={16} />{saving ? 'Saving...' : editingItem ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;