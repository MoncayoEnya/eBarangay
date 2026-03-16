// src/pages/WasteManagement.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useWaste } from '../hooks/useWaste';
import {
  Route, Truck, Flag, PieChart, Plus, Leaf, Trash2, Recycle,
  MapPin, User, Clock, Edit, CheckCircle, X, Save
} from 'lucide-react';

const WASTE_TYPES    = ['Biodegradable', 'Non-Biodegradable', 'Recyclable', 'Special Waste'];
const VEHICLE_STATUS = ['Active', 'Standby', 'Maintenance'];
const REPORT_TYPES   = ['Uncollected', 'IllegalDumping', 'OverflowingBin', 'Other'];
const DAYS_OF_WEEK   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const PUROKS         = ['All Puroks','Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7'];

const emptySchedule = { type: 'Biodegradable', description: '', days: [], purok: 'All Puroks', color: 'success' };
const emptyVehicle  = { name: '', plateNumber: '', driver: '', route: '', startTime: '6:00 AM', status: 'Standby' };
const emptyReport   = { title: '', description: '', location: '', reportType: 'Uncollected', reporter: '' };

const TYPE_COLORS = { 'Biodegradable': 'success', 'Non-Biodegradable': 'error', 'Recyclable': 'primary', 'Special Waste': 'warning' };
const TYPE_ICONS  = { 'Biodegradable': Leaf, 'Non-Biodegradable': Trash2, 'Recyclable': Recycle, 'Special Waste': Flag };

export default function WasteManagement() {
  const {
    schedules, vehicles, reports, loading, error, stats,
    loadAll,
    addSchedule, editSchedule, removeSchedule,
    addVehicle, editVehicle, removeVehicle,
    fileReport, markResolved, removeReport,
  } = useWaste();

  const [activeTab, setActiveTab] = useState('schedules');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showVehicleModal,  setShowVehicleModal]  = useState(false);
  const [showReportModal,   setShowReportModal]   = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingVehicle,  setEditingVehicle]  = useState(null);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [vehicleForm,  setVehicleForm]  = useState(emptyVehicle);
  const [reportForm,   setReportForm]   = useState(emptyReport);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  useEffect(() => { loadAll(); }, []);

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  // ── Schedule modal ──
  const openAddSchedule = () => { setScheduleForm(emptySchedule); setEditingSchedule(null); setFormErr(''); setShowScheduleModal(true); };
  const openEditSchedule = (s) => { setScheduleForm({ type: s.type, description: s.description || '', days: s.days || [], purok: s.purok || 'All Puroks', color: s.color || 'success' }); setEditingSchedule(s); setFormErr(''); setShowScheduleModal(true); };
  const toggleDay = (day) => setScheduleForm(p => ({ ...p, days: p.days.some(d => d.day === day) ? p.days.filter(d => d.day !== day) : [...p.days, { day, time: '6:00 AM' }] }));
  const handleScheduleSave = async () => {
    if (!scheduleForm.type || scheduleForm.days.length === 0) { setFormErr('Select type and at least one collection day.'); return; }
    setSaving(true);
    const payload = { ...scheduleForm, color: TYPE_COLORS[scheduleForm.type] || 'primary' };
    const result = editingSchedule ? await editSchedule(editingSchedule.id, payload) : await addSchedule(payload);
    setSaving(false);
    if (result.success) setShowScheduleModal(false);
    else setFormErr(result.error || 'Error saving.');
  };

  // ── Vehicle modal ──
  const openAddVehicle = () => { setVehicleForm(emptyVehicle); setEditingVehicle(null); setFormErr(''); setShowVehicleModal(true); };
  const openEditVehicle = (v) => { setVehicleForm({ name: v.name, plateNumber: v.plateNumber || '', driver: v.driver || '', route: v.route || '', startTime: v.startTime || '6:00 AM', status: v.status }); setEditingVehicle(v); setFormErr(''); setShowVehicleModal(true); };
  const handleVehicleSave = async () => {
    if (!vehicleForm.name.trim()) { setFormErr('Vehicle name required.'); return; }
    setSaving(true);
    const result = editingVehicle ? await editVehicle(editingVehicle.id, vehicleForm) : await addVehicle(vehicleForm);
    setSaving(false);
    if (result.success) setShowVehicleModal(false);
    else setFormErr(result.error || 'Error saving.');
  };

  // ── Report modal ──
  const handleReportSave = async () => {
    if (!reportForm.title.trim()) { setFormErr('Title required.'); return; }
    setSaving(true);
    const result = await fileReport({ ...reportForm, color: reportForm.reportType === 'IllegalDumping' ? 'warning' : 'error' });
    setSaving(false);
    if (result.success) { setShowReportModal(false); setReportForm(emptyReport); }
    else setFormErr(result.error || 'Error saving.');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Waste Management & Collection</h1>
          <p className="page-subtitle">Manage garbage collection and environmental services</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-secondary btn-md" onClick={() => { setFormErr(''); setShowReportModal(true); }}><Flag size={16} /> File Report</button>
          <button className="btn btn-primary btn-md" onClick={openAddSchedule}><Plus size={18} /> Add Schedule</button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Schedules"      value={stats?.schedules      || schedules.length} icon={Route}    iconBg="icon-bg-success"   badge="Active"        badgeColor="badge-success" />
        <StatCard title="Active Vehicles" value={stats?.activeVehicles || 0}               icon={Truck}    iconBg="icon-bg-primary"   badge="On duty"       badgeColor="badge-primary" />
        <StatCard title="Pending Reports" value={stats?.pendingReports || 0}               icon={Flag}     iconBg="icon-bg-warning"   badge="Need action"   badgeColor="badge-warning" />
        <StatCard title="Total Reports"   value={reports.length}                           icon={PieChart} iconBg="icon-bg-secondary" badge="All time"      badgeColor="badge-gray" />
      </div>

      {/* Tabs */}
      <div className="filters-section mb-0">
        <div className="filter-buttons-group">
          {[['schedules','Collection Schedules'],['vehicles','Fleet / Vehicles'],['reports','Reports']].map(([id, label]) => (
            <button key={id} className={`filter-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error mb-4 mt-4">{error}</div>}

      {/* ── SCHEDULES ── */}
      {activeTab === 'schedules' && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="table-title">Collection Schedules</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddSchedule}><Plus size={15} /> Add</button>
          </div>
          <div className="card-body">
            {loading ? <p className="text-secondary">Loading...</p> : schedules.length === 0 ? (
              <div className="empty-state"><Recycle className="empty-state-icon" /><h3 className="empty-state-title">No schedules yet</h3><button className="btn btn-primary btn-md mt-4" onClick={openAddSchedule}><Plus size={16} /> Add First Schedule</button></div>
            ) : (
              <div className="grid-auto">
                {schedules.map(s => {
                  const color = TYPE_COLORS[s.type] || 'primary';
                  const Icon  = TYPE_ICONS[s.type]  || Recycle;
                  return (
                    <div key={s.id} className="card" style={{ borderLeft: `4px solid var(--color-${color})` }}>
                      <div className="card-body">
                        <div className="d-flex justify-between align-start mb-3">
                          <div className={`icon-bg-${color}`} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)' }}><Icon size={22} /></div>
                          <div className="d-flex gap-2">
                            <button className="btn-icon" onClick={() => openEditSchedule(s)}><Edit size={15} /></button>
                            <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeSchedule(s.id); }}><Trash2 size={15} /></button>
                          </div>
                        </div>
                        <h4 className="fw-bold text-primary mb-1">{s.type}</h4>
                        <p className="text-secondary mb-3" style={{ fontSize: 'var(--font-size-sm)' }}>{s.description}</p>
                        <div className="mb-2">
                          {(s.days || []).map((d, i) => (
                            <div key={i} className="d-flex justify-between align-center mb-1">
                              <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>{d.day}</span>
                              <span className={`badge badge-${color}`}>{d.time}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-tertiary d-flex align-center gap-1" style={{ fontSize: 'var(--font-size-xs)' }}><MapPin size={12} />{s.purok}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VEHICLES ── */}
      {activeTab === 'vehicles' && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="table-title">Fleet Status</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddVehicle}><Plus size={15} /> Add Vehicle</button>
          </div>
          <div className="card-body">
            {loading ? <p className="text-secondary">Loading...</p> : vehicles.length === 0 ? (
              <div className="empty-state"><Truck className="empty-state-icon" /><h3 className="empty-state-title">No vehicles registered</h3><button className="btn btn-primary btn-md mt-4" onClick={openAddVehicle}><Plus size={16} /> Add Vehicle</button></div>
            ) : (
              <div className="grid-auto">
                {vehicles.map(v => (
                  <div key={v.id} className="card">
                    <div className="card-body">
                      <div className="d-flex justify-between align-start mb-3">
                        <div>
                          <h4 className="fw-bold mb-1">{v.name}</h4>
                          <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>{v.plateNumber}</p>
                        </div>
                        <span className={`status-badge status-${v.status?.toLowerCase()}`}>{v.status}</span>
                      </div>
                      <div className="d-flex flex-column gap-2 text-secondary mb-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                        <div className="d-flex align-center gap-2"><Route size={13} /> {v.route || 'Not assigned'}</div>
                        <div className="d-flex align-center gap-2"><User size={13} /> {v.driver || 'Unassigned'}</div>
                        <div className="d-flex align-center gap-2"><Clock size={13} /> {v.startTime}</div>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEditVehicle(v)}><Edit size={14} /> Edit</button>
                        <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeVehicle(v.id); }}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REPORTS ── */}
      {activeTab === 'reports' && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="table-title">Citizen Reports</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setFormErr(''); setShowReportModal(true); }}><Plus size={15} /> File Report</button>
          </div>
          <div className="card-body">
            {loading ? <p className="text-secondary">Loading...</p> : reports.length === 0 ? (
              <div className="empty-state"><Flag className="empty-state-icon" /><h3 className="empty-state-title">No reports filed</h3></div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reports.map(r => (
                  <div key={r.id} className="d-flex align-start gap-3 p-3" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <div className={`icon-bg-${r.color || 'error'}`} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', flexShrink: 0 }}><Flag size={18} /></div>
                    <div style={{ flex: 1 }}>
                      <div className="d-flex justify-between align-start mb-1">
                        <h4 className="fw-semibold text-primary">{r.title}</h4>
                        <span className={`status-badge status-${r.status?.toLowerCase()}`}>{r.status}</span>
                      </div>
                      <p className="text-secondary mb-2" style={{ fontSize: 'var(--font-size-sm)' }}>{r.description}</p>
                      <div className="d-flex gap-3 text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                        {r.location && <span className="d-flex align-center gap-1"><MapPin size={11} />{r.location}</span>}
                        {r.reporter && <span className="d-flex align-center gap-1"><User size={11} />{r.reporter}</span>}
                        <span className="d-flex align-center gap-1"><Clock size={11} />{formatTime(r.systemInfo?.createdAt)}</span>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      {r.status !== 'Resolved' && <button className="btn-icon" style={{ color: 'var(--color-success)' }} onClick={() => markResolved(r.id)} title="Mark Resolved"><CheckCircle size={17} /></button>}
                      <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeReport(r.id); }}><Trash2 size={17} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SCHEDULE MODAL ── */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingSchedule ? 'Edit Schedule' : 'Add Collection Schedule'}</h2>
              <button className="btn-icon" onClick={() => setShowScheduleModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formErr && <div className="alert alert-error mb-3">{formErr}</div>}
              <div className="form-group">
                <label className="form-label">Waste Type *</label>
                <select className="form-select" value={scheduleForm.type} onChange={e => setScheduleForm(p => ({ ...p, type: e.target.value }))}>
                  {WASTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={scheduleForm.description} onChange={e => setScheduleForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Kitchen & garden waste" />
              </div>
              <div className="form-group">
                <label className="form-label">Coverage Area</label>
                <select className="form-select" value={scheduleForm.purok} onChange={e => setScheduleForm(p => ({ ...p, purok: e.target.value }))}>
                  {PUROKS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Collection Days *</label>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {DAYS_OF_WEEK.map(day => {
                    const selected = scheduleForm.days.some(d => d.day === day);
                    return (
                      <button key={day} type="button"
                        className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => toggleDay(day)}
                        style={{ minWidth: 90 }}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowScheduleModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleScheduleSave} disabled={saving}>
                <Save size={16} />{saving ? 'Saving...' : editingSchedule ? 'Update' : 'Add Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VEHICLE MODAL ── */}
      {showVehicleModal && (
        <div className="modal-overlay" onClick={() => setShowVehicleModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button className="btn-icon" onClick={() => setShowVehicleModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formErr && <div className="alert alert-error mb-3">{formErr}</div>}
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Name *</label>
                  <input className="form-input" value={vehicleForm.name} onChange={e => setVehicleForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Truck #1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Plate Number</label>
                  <input className="form-input" value={vehicleForm.plateNumber} onChange={e => setVehicleForm(p => ({ ...p, plateNumber: e.target.value }))} placeholder="ABC-1234" />
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Driver</label>
                  <input className="form-input" value={vehicleForm.driver} onChange={e => setVehicleForm(p => ({ ...p, driver: e.target.value }))} placeholder="Driver name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={vehicleForm.status} onChange={e => setVehicleForm(p => ({ ...p, status: e.target.value }))}>
                    {VEHICLE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Route</label>
                  <input className="form-input" value={vehicleForm.route} onChange={e => setVehicleForm(p => ({ ...p, route: e.target.value }))} placeholder="e.g. Puroks 1-3" />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input className="form-input" value={vehicleForm.startTime} onChange={e => setVehicleForm(p => ({ ...p, startTime: e.target.value }))} placeholder="6:00 AM" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowVehicleModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleVehicleSave} disabled={saving}>
                <Save size={16} />{saving ? 'Saving...' : editingVehicle ? 'Update' : 'Add Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ── */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">File a Report</h2>
              <button className="btn-icon" onClick={() => setShowReportModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formErr && <div className="alert alert-error mb-3">{formErr}</div>}
              <div className="form-group">
                <label className="form-label">Report Type</label>
                <select className="form-select" value={reportForm.reportType} onChange={e => setReportForm(p => ({ ...p, reportType: e.target.value }))}>
                  {REPORT_TYPES.map(t => <option key={t} value={t}>{t.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={reportForm.title} onChange={e => setReportForm(p => ({ ...p, title: e.target.value }))} placeholder="Brief title of the issue" />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={reportForm.location} onChange={e => setReportForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Main Street, Purok 3" />
              </div>
              <div className="form-group">
                <label className="form-label">Reporter Name</label>
                <input className="form-input" value={reportForm.reporter} onChange={e => setReportForm(p => ({ ...p, reporter: e.target.value }))} placeholder="Your name (optional)" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={reportForm.description} onChange={e => setReportForm(p => ({ ...p, description: e.target.value }))} placeholder="Details about the issue..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowReportModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleReportSave} disabled={saving}>
                <Save size={16} />{saving ? 'Saving...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}