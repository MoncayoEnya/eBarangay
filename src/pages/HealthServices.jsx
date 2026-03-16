// src/pages/HealthServices.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useHealth } from '../hooks/useHealth';
import {
  Users, Calendar, Syringe, Clipboard, Plus, Eye, Check,
  X, Edit, Trash2, Save, Search, AlertCircle, Package,
  Activity, Sparkles, Loader, FileText, Copy, CheckCheck,
} from 'lucide-react';

const APPT_TYPES    = ['consultation','prenatal','immunization','dental','general'];
const APPT_STATUSES = ['Scheduled','Completed','Cancelled','No Show'];
const VACCINES      = ['BCG','Hepatitis B','DPT','OPV','MMR','Varicella','Flu','COVID-19','Other'];
const DISEASES      = ['Dengue','Influenza','Diarrhea','Typhoid','Tuberculosis','Measles','Chickenpox','COVID-19','Other'];
const MED_CATS      = ['Antibiotic','Analgesic','Antihypertensive','Vitamins','Antacid','Antiseptic','General'];

const emptyAppt    = { patientName: '', residentId: '', appointmentDate: '', appointmentTime: '09:00', appointmentType: 'consultation', notes: '' };
const emptyImm     = { patientName: '', residentId: '', vaccineName: '', doseNumber: 1, nextDoseDate: '', remarks: '' };
const emptyDisease = { disease: 'Dengue', patientName: '', purok: '', age: '', gender: '', dateOnset: '', status: 'Active', notes: '' };
const emptyMed     = { name: '', category: 'General', unit: 'pcs', quantity: '', lowStockAt: 10, expiryDate: '', supplier: '', notes: '' };

// ── AI Health Report helper ───────────────────────────────────
const generateHealthReport = async ({ diseases, appointments, immunizations, medicines, stats }) => {
  // Summarise data for the prompt
  const diseaseSummary = diseases.reduce((acc, d) => {
    acc[d.disease] = (acc[d.disease] || 0) + 1;
    return acc;
  }, {});

  const activeCases   = diseases.filter(d => d.status === 'Active').length;
  const recovered     = diseases.filter(d => d.status === 'Recovered').length;
  const scheduled     = appointments.filter(a => a.status === 'Scheduled').length;
  const lowStock      = medicines.filter(m => (m.quantity || 0) <= (m.lowStockAt || 10)).map(m => m.name);
  const purokHotspots = diseases.reduce((acc, d) => {
    if (d.purok) acc[d.purok] = (acc[d.purok] || 0) + 1;
    return acc;
  }, {});

  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: 'You are a health officer writing official barangay health situation reports in the Philippines. Write clearly, professionally, and concisely. Use plain English.',
        },
        {
          role: 'user',
          content: `Write a Barangay Health Situation Report based on this data. Use proper report format with sections.

Date: ${today}
Total disease cases recorded: ${diseases.length}
Active cases: ${activeCases}
Recovered: ${recovered}
Disease breakdown: ${JSON.stringify(diseaseSummary)}
Purok hotspots: ${JSON.stringify(purokHotspots)}
Scheduled appointments: ${scheduled}
Total immunization records: ${immunizations.length}
Low stock medicines: ${lowStock.length > 0 ? lowStock.join(', ') : 'None'}

Write a report with these sections:
1. SITUATION OVERVIEW — 2-3 sentences on the current health status
2. DISEASE SURVEILLANCE — breakdown of cases, which diseases are most common, which puroks are affected
3. HEALTH SERVICES — appointments and immunization status
4. PHARMACY STATUS — medicine supply situation  
5. RECOMMENDATIONS — 3 specific action items for the barangay health team

Keep each section concise. Use bullet points where appropriate. Do not use markdown headers with #, use plain text headers in ALL CAPS instead.`,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Failed to generate report.';
};

// ── Main Component ────────────────────────────────────────────
export default function HealthServices() {
  const {
    patients, appointments, immunizations, diseases, medicines,
    loading, error, stats,
    loadAll, loadAppointments, loadImmunizations, loadDiseases, loadMedicines,
    createAppointment, updateAppointment, removeAppointment,
    createImmunization, removeImmunization,
    reportDisease, updateDisease, removeDisease,
    createMedicine, editMedicine, dispense, removeMedicine,
    loadStatistics, clearError,
  } = useHealth();

  const [activeTab, setActiveTab] = useState('appointments');
  const [search,    setSearch]    = useState('');

  // Appointment
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptForm,      setApptForm]      = useState(emptyAppt);
  // Immunization
  const [showImmModal, setShowImmModal] = useState(false);
  const [immForm,      setImmForm]      = useState(emptyImm);
  // Disease
  const [showDiseaseModal, setShowDiseaseModal] = useState(false);
  const [editingDisease,   setEditingDisease]   = useState(null);
  const [diseaseForm,      setDiseaseForm]      = useState(emptyDisease);
  // Medicine
  const [showMedModal, setShowMedModal] = useState(false);
  const [editingMed,   setEditingMed]   = useState(null);
  const [medForm,      setMedForm]      = useState(emptyMed);
  const [showDispense, setShowDispense] = useState(false);
  const [dispenseId,   setDispenseId]   = useState(null);
  const [dispenseQty,  setDispenseQty]  = useState(1);

  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState('');

  // ── AI Report state ──
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading,   setReportLoading]   = useState(false);
  const [reportText,      setReportText]      = useState('');
  const [reportError,     setReportError]     = useState('');
  const [copied,          setCopied]          = useState(false);

  useEffect(() => { loadAll(); }, []);

  const fmtDate = (ts) => {
    if (!ts) return 'N/A';
    try { return ts.toDate ? ts.toDate().toLocaleDateString() : new Date(ts).toLocaleDateString(); }
    catch { return 'N/A'; }
  };

  // ── AI Report ──
  const handleGenerateReport = async () => {
    setShowReportModal(true);
    setReportLoading(true);
    setReportText('');
    setReportError('');
    setCopied(false);
    try {
      const report = await generateHealthReport({ diseases, appointments, immunizations, medicines, stats });
      setReportText(report);
    } catch (e) {
      setReportError('Failed to generate report. Please try again.');
      console.error('AI report error:', e);
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Appointment handlers ──
  const handleApptSave = async () => {
    if (!apptForm.patientName || !apptForm.appointmentDate) { setFormErr('Patient name and date required.'); return; }
    setSaving(true);
    const r = await createAppointment(apptForm);
    setSaving(false);
    if (r.success) { setShowApptModal(false); setApptForm(emptyAppt); loadStatistics(); }
    else setFormErr(r.error);
  };

  // ── Immunization handlers ──
  const handleImmSave = async () => {
    if (!immForm.patientName || !immForm.vaccineName) { setFormErr('Patient and vaccine required.'); return; }
    setSaving(true);
    const r = await createImmunization(immForm);
    setSaving(false);
    if (r.success) { setShowImmModal(false); setImmForm(emptyImm); loadStatistics(); }
    else setFormErr(r.error);
  };

  // ── Disease handlers ──
  const openAddDisease  = () => { setDiseaseForm(emptyDisease); setEditingDisease(null); setFormErr(''); setShowDiseaseModal(true); };
  const openEditDisease = (d) => { setDiseaseForm({ disease: d.disease, patientName: d.patientName, purok: d.purok, age: d.age, gender: d.gender, dateOnset: d.dateOnset, status: d.status, notes: d.notes || '' }); setEditingDisease(d); setFormErr(''); setShowDiseaseModal(true); };
  const handleDiseaseSave = async () => {
    if (!diseaseForm.disease) { setFormErr('Disease type required.'); return; }
    setSaving(true);
    const r = editingDisease ? await updateDisease(editingDisease.id, diseaseForm) : await reportDisease(diseaseForm);
    setSaving(false);
    if (r.success) { setShowDiseaseModal(false); loadStatistics(); }
    else setFormErr(r.error);
  };

  // ── Medicine handlers ──
  const openAddMed  = () => { setMedForm(emptyMed); setEditingMed(null); setFormErr(''); setShowMedModal(true); };
  const openEditMed = (m) => { setMedForm({ name: m.name, category: m.category, unit: m.unit, quantity: m.quantity, lowStockAt: m.lowStockAt, expiryDate: m.expiryDate || '', supplier: m.supplier || '', notes: m.notes || '' }); setEditingMed(m); setFormErr(''); setShowMedModal(true); };
  const handleMedSave = async () => {
    if (!medForm.name.trim()) { setFormErr('Medicine name required.'); return; }
    setSaving(true);
    const r = editingMed ? await editMedicine(editingMed.id, medForm) : await createMedicine(medForm);
    setSaving(false);
    if (r.success) setShowMedModal(false);
    else setFormErr(r.error);
  };
  const openDispense   = (m) => { setDispenseId(m.id); setDispenseQty(1); setShowDispense(true); };
  const handleDispense = async () => { await dispense(dispenseId, dispenseQty); setShowDispense(false); };

  const tabs = [
    { id: 'appointments',  label: 'Appointments',        icon: Calendar  },
    { id: 'immunizations', label: 'Immunizations',        icon: Syringe   },
    { id: 'patients',      label: 'Patient Records',      icon: Clipboard },
    { id: 'disease',       label: 'Disease Surveillance', icon: Activity  },
    { id: 'pharmacy',      label: 'Pharmacy',             icon: Package   },
  ];

  const filteredAppts    = appointments.filter(a => !search || a.patientName?.toLowerCase().includes(search.toLowerCase()));
  const filteredImms     = immunizations.filter(i => !search || i.patientName?.toLowerCase().includes(search.toLowerCase()) || i.vaccineName?.toLowerCase().includes(search.toLowerCase()));
  const filteredDiseases = diseases.filter(d => !search || d.disease?.toLowerCase().includes(search.toLowerCase()) || d.patientName?.toLowerCase().includes(search.toLowerCase()));
  const filteredMeds     = medicines.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()));
  const lowStockMeds     = medicines.filter(m => (m.quantity || 0) <= (m.lowStockAt || 10));

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Health Services</h1>
          <p className="page-subtitle">Manage health programs and patient records</p>
        </div>

        {/* Action buttons */}
        <div className="d-flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>

          {/* ── AI Health Report button ── */}
          <button
            onClick={handleGenerateReport}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Sparkles size={15} />
            AI Health Report
          </button>

          {activeTab === 'appointments'  && <button className="btn btn-primary btn-md" onClick={() => { setFormErr(''); setShowApptModal(true); }}><Plus size={18} /> New Appointment</button>}
          {activeTab === 'immunizations' && <button className="btn btn-primary btn-md" onClick={() => { setFormErr(''); setShowImmModal(true); }}><Plus size={18} /> Add Immunization</button>}
          {activeTab === 'disease'       && <button className="btn btn-primary btn-md" onClick={openAddDisease}><Plus size={18} /> Report Case</button>}
          {activeTab === 'pharmacy'      && <button className="btn btn-primary btn-md" onClick={openAddMed}><Plus size={18} /> Add Medicine</button>}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="Patients"        value={stats?.totalPatients         || patients.length}     icon={Users}    iconBg="icon-bg-primary"  badge="Records"        badgeColor="badge-primary" />
        <StatCard title="Appointments"    value={stats?.scheduledAppointments || 0}                   icon={Calendar} iconBg="icon-bg-success"  badge="Scheduled"      badgeColor="badge-success" />
        <StatCard title="Active Diseases" value={stats?.activeDiseases        || 0}                   icon={Activity} iconBg="icon-bg-error"    badge="Cases"          badgeColor="badge-error" />
        <StatCard title="Low Stock"       value={stats?.lowStockMedicines     || lowStockMeds.length} icon={Package}  iconBg="icon-bg-warning"  badge="Need restocking" badgeColor="badge-warning" />
      </div>

      {/* Tabs + Search */}
      <div className="filters-section mb-0">
        <div className="filter-buttons-group" style={{ flexWrap: 'wrap' }}>
          {tabs.map(t => { const Icon = t.icon; return (
            <button key={t.id} className={`filter-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <Icon size={15} /> {t.label}
            </button>
          ); })}
        </div>
        <div style={{ position: 'relative', minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert alert-error mt-4">{error}<button className="btn-icon ml-2" onClick={clearError}><X size={14} /></button></div>}

      {/* ── APPOINTMENTS ── */}
      {activeTab === 'appointments' && (
        <div className="data-table-card mt-4">
          <div className="table-header"><h3 className="table-title">Appointments</h3></div>
          {loading ? <p className="p-4 text-secondary">Loading...</p> : filteredAppts.length === 0 ? (
            <div className="empty-state"><Calendar className="empty-state-icon" /><h3 className="empty-state-title">No appointments</h3><button className="btn btn-primary btn-md mt-4" onClick={() => { setFormErr(''); setShowApptModal(true); }}><Plus size={16} /> Book Appointment</button></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredAppts.map(a => (
                    <tr key={a.id}>
                      <td className="fw-medium">{a.patientName}</td>
                      <td className="text-secondary">{a.appointmentDate}</td>
                      <td className="text-secondary">{a.appointmentTime}</td>
                      <td><span className="badge badge-primary">{a.appointmentType}</span></td>
                      <td><span className={`status-badge status-${a.status?.toLowerCase().replace(' ', '-')}`}>{a.status}</span></td>
                      <td>
                        <div className="d-flex gap-1">
                          {a.status === 'Scheduled' && <>
                            <button className="btn-icon" style={{ color: 'var(--color-success)' }} onClick={() => updateAppointment(a.id, 'Completed')} title="Complete"><Check size={16} /></button>
                            <button className="btn-icon" style={{ color: 'var(--color-error)' }}   onClick={() => updateAppointment(a.id, 'Cancelled')} title="Cancel"><X size={16} /></button>
                          </>}
                          <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeAppointment(a.id); }}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── IMMUNIZATIONS ── */}
      {activeTab === 'immunizations' && (
        <div className="data-table-card mt-4">
          <div className="table-header"><h3 className="table-title">Immunization Records</h3></div>
          {loading ? <p className="p-4 text-secondary">Loading...</p> : filteredImms.length === 0 ? (
            <div className="empty-state"><Syringe className="empty-state-icon" /><h3 className="empty-state-title">No immunization records</h3><button className="btn btn-primary btn-md mt-4" onClick={() => { setFormErr(''); setShowImmModal(true); }}><Plus size={16} /> Add Record</button></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Patient</th><th>Vaccine</th><th>Dose</th><th>Next Dose</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredImms.map(i => (
                    <tr key={i.id}>
                      <td className="fw-medium">{i.patientName}</td>
                      <td>{i.vaccineName}</td>
                      <td><span className="badge badge-primary">Dose {i.doseNumber}</span></td>
                      <td className="text-secondary">{i.nextDoseDate || '—'}</td>
                      <td className="text-secondary">{fmtDate(i.systemInfo?.createdAt)}</td>
                      <td><button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeImmunization(i.id); }}><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PATIENTS ── */}
      {activeTab === 'patients' && (
        <div className="data-table-card mt-4">
          <div className="table-header"><h3 className="table-title">Patient Records</h3></div>
          {loading ? <p className="p-4 text-secondary">Loading...</p> : patients.length === 0 ? (
            <div className="empty-state"><Clipboard className="empty-state-icon" /><h3 className="empty-state-title">No patient records</h3><p className="empty-state-description">Patient records are created when appointments are booked</p></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Record ID</th><th>Name</th><th>Gender</th><th>Blood Type</th><th>Conditions</th><th>Consultations</th></tr></thead>
                <tbody>
                  {patients.filter(p => !search || p.patientName?.toLowerCase().includes(search.toLowerCase())).map(p => (
                    <tr key={p.id}>
                      <td className="text-secondary" style={{ fontFamily: 'monospace' }}>{p.recordId}</td>
                      <td className="fw-medium">{p.patientName}</td>
                      <td>{p.gender || '—'}</td>
                      <td>{p.bloodType || '—'}</td>
                      <td className="text-secondary">{p.conditions || '—'}</td>
                      <td><span className="badge badge-primary">{(p.consultations || []).length}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── DISEASE SURVEILLANCE ── */}
      {activeTab === 'disease' && (
        <div className="data-table-card mt-4">
          <div className="table-header">
            <h3 className="table-title">Disease Surveillance</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddDisease}><Plus size={15} /> Report Case</button>
          </div>
          {loading ? <p className="p-4 text-secondary">Loading...</p> : filteredDiseases.length === 0 ? (
            <div className="empty-state"><Activity className="empty-state-icon" /><h3 className="empty-state-title">No disease cases reported</h3><button className="btn btn-primary btn-md mt-4" onClick={openAddDisease}><Plus size={16} /> Report First Case</button></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Disease</th><th>Patient</th><th>Purok</th><th>Age</th><th>Date Onset</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredDiseases.map(d => (
                    <tr key={d.id}>
                      <td><span className="badge badge-error">{d.disease}</span></td>
                      <td className="fw-medium">{d.patientName}</td>
                      <td className="text-secondary">{d.purok || '—'}</td>
                      <td className="text-secondary">{d.age || '—'}</td>
                      <td className="text-secondary">{d.dateOnset || '—'}</td>
                      <td><span className={`status-badge status-${d.status?.toLowerCase()}`}>{d.status}</span></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn-icon" onClick={() => openEditDisease(d)}><Edit size={15} /></button>
                          <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeDisease(d.id); }}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PHARMACY ── */}
      {activeTab === 'pharmacy' && (
        <div className="data-table-card mt-4">
          <div className="table-header">
            <h3 className="table-title">Medicine Inventory</h3>
            <div className="d-flex gap-2 align-center">
              {lowStockMeds.length > 0 && <span className="badge badge-warning">{lowStockMeds.length} low stock</span>}
              <button className="btn btn-primary btn-sm" onClick={openAddMed}><Plus size={15} /> Add Medicine</button>
            </div>
          </div>
          {loading ? <p className="p-4 text-secondary">Loading...</p> : filteredMeds.length === 0 ? (
            <div className="empty-state"><Package className="empty-state-icon" /><h3 className="empty-state-title">No medicines in inventory</h3><button className="btn btn-primary btn-md mt-4" onClick={openAddMed}><Plus size={16} /> Add First Medicine</button></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Unit</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredMeds.map(m => {
                    const isLow = (m.quantity || 0) <= (m.lowStockAt || 10);
                    return (
                      <tr key={m.id}>
                        <td className="fw-medium">{m.name}</td>
                        <td className="text-secondary">{m.category}</td>
                        <td><span className={`fw-semibold ${isLow ? 'text-error' : ''}`}>{m.quantity}</span></td>
                        <td className="text-secondary">{m.unit}</td>
                        <td className="text-secondary">{m.expiryDate || '—'}</td>
                        <td><span className={`badge badge-${isLow ? 'error' : 'success'}`}>{isLow ? 'Low Stock' : 'OK'}</span></td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-ghost btn-sm" onClick={() => openDispense(m)}>Dispense</button>
                            <button className="btn-icon" onClick={() => openEditMed(m)}><Edit size={15} /></button>
                            <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeMedicine(m.id); }}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── AI HEALTH REPORT MODAL ── */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => !reportLoading && setShowReportModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #faf5ff, #eff6ff)', borderBottom: '1px solid #e9d5ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={16} color="#7c3aed" />
                </div>
                <div>
                  <h2 className="modal-title" style={{ color: '#4c1d95' }}>AI Health Situation Report</h2>
                  <p style={{ fontSize: 12, color: '#7c3aed', margin: 0 }}>
                    Generated from {diseases.length} disease cases · {appointments.length} appointments · {medicines.length} medicines
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowReportModal(false)} disabled={reportLoading}><X size={20} /></button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {reportLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={22} color="#7c3aed" style={{ animation: 'spin 2s linear infinite' }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#4c1d95', margin: 0 }}>Analyzing health data...</p>
                  <p style={{ fontSize: 13, color: '#7c3aed', margin: 0 }}>AI is writing your report</p>
                </div>
              ) : reportError ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '16px', color: '#dc2626', fontSize: 14 }}>
                  {reportError}
                </div>
              ) : (
                <div style={{
                  background: '#fafafa', border: '1px solid #e2e8f0',
                  borderRadius: 12, padding: '20px 24px',
                  fontSize: 13, lineHeight: 1.8, color: '#1e293b',
                  whiteSpace: 'pre-wrap', fontFamily: "'Georgia', serif",
                }}>
                  {reportText}
                </div>
              )}
            </div>

            {/* Footer */}
            {!reportLoading && reportText && (
              <div className="modal-footer" style={{ borderTop: '1px solid #e9d5ff', background: '#faf5ff' }}>
                <button className="btn btn-secondary btn-md" onClick={() => setShowReportModal(false)}>Close</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleGenerateReport} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                    borderRadius: 8, border: '1px solid #c4b5fd', background: '#fff',
                    color: '#7c3aed', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}>
                    <Sparkles size={14} /> Regenerate
                  </button>
                  <button onClick={handleCopyReport} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                    borderRadius: 8, border: 'none',
                    background: copied ? '#10b981' : '#7c3aed',
                    color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}>
                    {copied ? <><CheckCheck size={14} /> Copied!</> : <><Copy size={14} /> Copy Report</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── APPOINTMENT MODAL ── */}
      {showApptModal && (
        <div className="modal-overlay" onClick={() => setShowApptModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2 className="modal-title">Book Appointment</h2><button className="btn-icon" onClick={() => setShowApptModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              {formErr && <div className="alert alert-error mb-3">{formErr}</div>}
              <div className="form-group"><label className="form-label">Patient Name *</label><input className="form-input" value={apptForm.patientName} onChange={e => setApptForm(p => ({ ...p, patientName: e.target.value }))} placeholder="Full name" /></div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">Date *</label><input type="date" className="form-input" value={apptForm.appointmentDate} onChange={e => setApptForm(p => ({ ...p, appointmentDate: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-input" value={apptForm.appointmentTime} onChange={e => setApptForm(p => ({ ...p, appointmentTime: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={apptForm.appointmentType} onChange={e => setApptForm(p => ({ ...p, appointmentType: e.target.value }))}>{APPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={3} value={apptForm.notes} onChange={e => setApptForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowApptModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleApptSave} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Book Appointment'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMMUNIZATION MODAL ── */}
      {showImmModal && (
        <div className="modal-overlay" onClick={() => setShowImmModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2 className="modal-title">Add Immunization Record</h2><button className="btn-icon" onClick={() => setShowImmModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              {formErr && <div className="alert alert-error mb-3">{formErr}</div>}
              <div className="form-group"><label className="form-label">Patient Name *</label><input className="form-input" value={immForm.patientName} onChange={e => setImmForm(p => ({ ...p, patientName: e.target.value }))} placeholder="Full name" /></div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">Vaccine *</label><select className="form-select" value={immForm.vaccineName} onChange={e => setImmForm(p => ({ ...p, vaccineName: e.target.value }))}><option value="">Select vaccine</option>{VACCINES.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Dose #</label><input type="number" className="form-input" value={immForm.doseNumber} min="1" onChange={e => setImmForm(p => ({ ...p, doseNumber: Number(e.target.value) }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Next Dose Date</label><input type="date" className="form-input" value={immForm.nextDoseDate} onChange={e => setImmForm(p => ({ ...p, nextDoseDate: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Remarks</label><input className="form-input" value={immForm.remarks} onChange={e => setImmForm(p => ({ ...p, remarks: e.target.value }))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowImmModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleImmSave} disabled={saving}><Save size={16} />{saving ? 'Saving...' : 'Add Record'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISEASE MODAL ── */}
      {showDiseaseModal && (
        <div className="modal-overlay" onClick={() => setShowDiseaseModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2 className="modal-title">{editingDisease ? 'Edit Case' : 'Report Disease Case'}</h2><button className="btn-icon" onClick={() => setShowDiseaseModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              {formErr && <div className="alert alert-error mb-3">{formErr}</div>}
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">Disease *</label><select className="form-select" value={diseaseForm.disease} onChange={e => setDiseaseForm(p => ({ ...p, disease: e.target.value }))}>{DISEASES.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={diseaseForm.status} onChange={e => setDiseaseForm(p => ({ ...p, status: e.target.value }))}>{['Active','Recovered','Deceased'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="form-group"><label className="form-label">Patient Name</label><input className="form-input" value={diseaseForm.patientName} onChange={e => setDiseaseForm(p => ({ ...p, patientName: e.target.value }))} placeholder="Anonymous if unknown" /></div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">Purok</label><input className="form-input" value={diseaseForm.purok} onChange={e => setDiseaseForm(p => ({ ...p, purok: e.target.value }))} placeholder="e.g. Purok 3" /></div>
                <div className="form-group"><label className="form-label">Date Onset</label><input type="date" className="form-input" value={diseaseForm.dateOnset} onChange={e => setDiseaseForm(p => ({ ...p, dateOnset: e.target.value }))} /></div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">Age</label><input className="form-input" value={diseaseForm.age} onChange={e => setDiseaseForm(p => ({ ...p, age: e.target.value }))} placeholder="Age" /></div>
                <div className="form-group"><label className="form-label">Gender</label><select className="form-select" value={diseaseForm.gender} onChange={e => setDiseaseForm(p => ({ ...p, gender: e.target.value }))}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" rows={2} value={diseaseForm.notes} onChange={e => setDiseaseForm(p => ({ ...p, notes: e.target.value }))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowDiseaseModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleDiseaseSave} disabled={saving}><Save size={16} />{saving ? 'Saving...' : editingDisease ? 'Update' : 'Report Case'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MEDICINE MODAL ── */}
      {showMedModal && (
        <div className="modal-overlay" onClick={() => setShowMedModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header"><h2 className="modal-title">{editingMed ? 'Edit Medicine' : 'Add Medicine'}</h2><button className="btn-icon" onClick={() => setShowMedModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              {formErr && <div className="alert alert-error mb-3">{formErr}</div>}
              <div className="form-group"><label className="form-label">Medicine Name *</label><input className="form-input" value={medForm.name} onChange={e => setMedForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Amoxicillin 500mg" /></div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={medForm.category} onChange={e => setMedForm(p => ({ ...p, category: e.target.value }))}>{MED_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Unit</label><input className="form-input" value={medForm.unit} onChange={e => setMedForm(p => ({ ...p, unit: e.target.value }))} placeholder="pcs / tablets / ml" /></div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">Quantity</label><input type="number" className="form-input" value={medForm.quantity} onChange={e => setMedForm(p => ({ ...p, quantity: e.target.value }))} min="0" /></div>
                <div className="form-group"><label className="form-label">Low Stock Alert At</label><input type="number" className="form-input" value={medForm.lowStockAt} onChange={e => setMedForm(p => ({ ...p, lowStockAt: Number(e.target.value) }))} min="1" /></div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group"><label className="form-label">Expiry Date</label><input type="date" className="form-input" value={medForm.expiryDate} onChange={e => setMedForm(p => ({ ...p, expiryDate: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Supplier</label><input className="form-input" value={medForm.supplier} onChange={e => setMedForm(p => ({ ...p, supplier: e.target.value }))} placeholder="Optional" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowMedModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleMedSave} disabled={saving}><Save size={16} />{saving ? 'Saving...' : editingMed ? 'Update' : 'Add Medicine'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISPENSE MODAL ── */}
      {showDispense && (
        <div className="modal-overlay" onClick={() => setShowDispense(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-header"><h2 className="modal-title">Dispense Medicine</h2><button className="btn-icon" onClick={() => setShowDispense(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Quantity to Dispense</label><input type="number" className="form-input" value={dispenseQty} min="1" onChange={e => setDispenseQty(Number(e.target.value))} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowDispense(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleDispense}><Save size={16} /> Dispense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}