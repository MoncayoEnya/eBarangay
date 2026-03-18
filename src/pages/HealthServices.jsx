// src/pages/HealthServices.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useHealth } from '../hooks/useHealth';
import { useBarangayConfig } from '../hooks/useBarangayConfig';
import OutbreakWarning from '../components/health/OutbreakWarning';
import {
  Users, Calendar, Syringe, Clipboard, Plus, Eye, Check,
  X, Edit, Trash2, Save, Search, AlertCircle, Package,
  Activity, Sparkles, Loader, FileText, Copy, CheckCheck,
  Heart, Pill, Baby, Megaphone, TrendingUp,
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

// ── MCH / Family Planning / Campaigns ────────────────────────
const FP_METHODS   = ['Pills','Condom','IUD','Injectable','Implant','Ligation','Vasectomy','Natural Family Planning','Other'];
const FP_STATUSES  = ['Current User','New Acceptor','Dropout','Completed'];
const CAMPAIGN_CATS = ['Vaccination','Anti-Dengue','Nutrition','Pre-natal','Deworming','Blood Pressure','Mental Health','General Health'];
const CAMPAIGN_STS  = ['Planned','Ongoing','Completed','Cancelled'];
const emptyMCH     = { motherName: '', childName: '', dateOfBirth: '', weight: '', height: '', purok: '', gestationalAge: '', lastVisit: '', nextVisit: '', notes: '', type: 'child' };
const emptyFP      = { clientName: '', age: '', purok: '', method: 'Pills', status: 'Current User', startDate: '', nextVisit: '', notes: '' };
const emptyCampaign = { title: '', category: 'Vaccination', targetDate: '', location: '', targetCount: '', description: '', status: 'Planned', responsible: '' };

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

  const { barangayName } = useBarangayConfig();
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

  // ── MCH state ──
  const [mchRecords,    setMchRecords]    = useState([]);
  const [mchLoading,    setMchLoading]    = useState(false);
  const [showMchModal,  setShowMchModal]  = useState(false);
  const [mchForm,       setMchForm]       = useState(emptyMCH);

  // ── Family Planning state ──
  const [fpRecords,     setFpRecords]     = useState([]);
  const [fpLoading,     setFpLoading]     = useState(false);
  const [showFpModal,   setShowFpModal]   = useState(false);
  const [fpForm,        setFpForm]        = useState(emptyFP);

  // ── Campaigns state ──
  const [campaigns,       setCampaigns]       = useState([]);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign,   setEditingCampaign]   = useState(null);
  const [campaignForm,      setCampaignForm]       = useState(emptyCampaign);

  // ── AI Report state ──
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading,   setReportLoading]   = useState(false);
  const [reportText,      setReportText]      = useState('');
  const [reportError,     setReportError]     = useState('');
  const [copied,          setCopied]          = useState(false);

  useEffect(() => { loadAll(); loadMch(); loadFp(); loadCampaigns(); }, []);

  // ── MCH helpers (Firestore direct) ──
  const loadMch = async () => {
    setMchLoading(true);
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      const snap = await getDocs(query(collection(db, 'health_mch'), orderBy('systemInfo.createdAt', 'desc')));
      setMchRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (_) {} finally { setMchLoading(false); }
  };
  const saveMch = async () => {
    if (!mchForm.motherName.trim()) { setFormErr('Mother/guardian name is required.'); return; }
    setSaving(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      await addDoc(collection(db, 'health_mch'), { ...mchForm, systemInfo: { createdAt: serverTimestamp() } });
      setShowMchModal(false); setMchForm(emptyMCH); setFormErr(''); loadMch();
    } catch (e) { setFormErr(e.message); } finally { setSaving(false); }
  };
  const deleteMch = async (id) => {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('../services/firebase');
    await deleteDoc(doc(db, 'health_mch', id));
    setMchRecords(p => p.filter(r => r.id !== id));
  };

  // ── Family Planning helpers ──
  const loadFp = async () => {
    setFpLoading(true);
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      const snap = await getDocs(query(collection(db, 'health_fp'), orderBy('systemInfo.createdAt', 'desc')));
      setFpRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (_) {} finally { setFpLoading(false); }
  };
  const saveFp = async () => {
    if (!fpForm.clientName.trim()) { setFormErr('Client name is required.'); return; }
    setSaving(true);
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      await addDoc(collection(db, 'health_fp'), { ...fpForm, systemInfo: { createdAt: serverTimestamp() } });
      setShowFpModal(false); setFpForm(emptyFP); setFormErr(''); loadFp();
    } catch (e) { setFormErr(e.message); } finally { setSaving(false); }
  };
  const deleteFp = async (id) => {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('../services/firebase');
    await deleteDoc(doc(db, 'health_fp', id));
    setFpRecords(p => p.filter(r => r.id !== id));
  };

  // ── Campaigns helpers ──
  const loadCampaigns = async () => {
    setCampaignLoading(true);
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      const snap = await getDocs(query(collection(db, 'health_campaigns'), orderBy('systemInfo.createdAt', 'desc')));
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (_) {} finally { setCampaignLoading(false); }
  };
  const saveCampaign = async () => {
    if (!campaignForm.title.trim()) { setFormErr('Campaign title is required.'); return; }
    setSaving(true);
    try {
      const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      if (editingCampaign) {
        await updateDoc(doc(db, 'health_campaigns', editingCampaign.id), { ...campaignForm, 'systemInfo.updatedAt': serverTimestamp() });
      } else {
        await addDoc(collection(db, 'health_campaigns'), { ...campaignForm, attendance: 0, systemInfo: { createdAt: serverTimestamp() } });
      }
      setShowCampaignModal(false); setEditingCampaign(null); setCampaignForm(emptyCampaign); setFormErr(''); loadCampaigns();
    } catch (e) { setFormErr(e.message); } finally { setSaving(false); }
  };
  const deleteCampaign = async (id) => {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const { db } = await import('../services/firebase');
    await deleteDoc(doc(db, 'health_campaigns', id));
    setCampaigns(p => p.filter(c => c.id !== id));
  };
  const updateCampaignStatus = async (id, status) => {
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../services/firebase');
    await updateDoc(doc(db, 'health_campaigns', id), { status });
    setCampaigns(p => p.map(c => c.id === id ? { ...c, status } : c));
  };

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
    { id: 'mch',           label: 'Maternal & Child',     icon: Baby      },
    { id: 'fp',            label: 'Family Planning',      icon: Heart     },
    { id: 'campaigns',     label: 'Campaigns',            icon: Megaphone },
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
          {activeTab === 'mch'           && <button className="btn btn-primary btn-md" onClick={() => { setFormErr(''); setMchForm(emptyMCH); setShowMchModal(true); }}><Plus size={18} /> Add MCH Record</button>}
          {activeTab === 'fp'            && <button className="btn btn-primary btn-md" onClick={() => { setFormErr(''); setFpForm(emptyFP); setShowFpModal(true); }}><Plus size={18} /> Add FP Client</button>}
          {activeTab === 'campaigns'     && <button className="btn btn-primary btn-md" onClick={() => { setFormErr(''); setEditingCampaign(null); setCampaignForm(emptyCampaign); setShowCampaignModal(true); }}><Plus size={18} /> New Campaign</button>}
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
        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Outbreak Early Warning System */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={16} color="#dc2626" />
                <h3 className="table-title" style={{ margin: 0 }}>Outbreak Early Warning System</h3>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f5f3ff', color: '#7c3aed' }}>CUSUM + EWMA Algorithms</span>
              </div>
            </div>
            <div className="card-body">
              <OutbreakWarning diseases={diseases} barangayName={barangayName} />
            </div>
          </div>

          {/* Disease cases table */}
          <div className="data-table-card">
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
        <div className="modal-overlay" onClick={() => !reportLoading && setShowReportModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.55)'}}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:22, width:'100%', maxWidth:660, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(15,23,42,0.22), 0 0 0 1.5px rgba(240,244,248,1)', overflow:'hidden', animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)' }}>

            {/* Gradient header */}
            <div style={{ background:'linear-gradient(135deg,#4C1D95,#7C3AED,#6366F1)', padding:'22px 26px 20px', flexShrink:0, position:'relative', overflow:'hidden' }}>
              <div style={{position:'absolute',right:-30,top:-30,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,0.07)',pointerEvents:'none'}}/>
              <div style={{position:'absolute',right:60,bottom:-40,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.05)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:46,height:46,borderRadius:13,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Sparkles size={22} color="#fff" style={{animation: reportLoading ? 'spin 2s linear infinite' : 'none'}}/>
                  </div>
                  <div>
                    <h2 style={{fontSize:18,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>AI Health Situation Report</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'4px 0 0',fontWeight:400}}>
                      {diseases.length} disease cases · {appointments.length} appointments · {medicines.length} medicines
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowReportModal(false)} disabled={reportLoading}
                  style={{width:32,height:32,borderRadius:9,background:'rgba(255,255,255,0.15)',border:'none',cursor:reportLoading?'not-allowed':'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',opacity:reportLoading?0.5:1,transition:'background 0.15s'}}
                  onMouseEnter={e=>!reportLoading&&(e.currentTarget.style.background='rgba(255,255,255,0.28)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.15)')}>
                  <X size={17}/>
                </button>
              </div>
              {/* Stats ribbon */}
              <div style={{display:'flex',gap:8,marginTop:16,position:'relative'}}>
                {[['Disease Cases',diseases.length,'#EDE9FE','#7C3AED'],['Appointments',appointments.length,'rgba(255,255,255,0.15)','rgba(255,255,255,0.9)'],['Medicines',medicines.length,'rgba(255,255,255,0.15)','rgba(255,255,255,0.9)']].map(([l,v,bg,c])=>(
                  <div key={l} style={{padding:'7px 13px',borderRadius:9,background:bg,display:'flex',alignItems:'center',gap:7}}>
                    <span style={{fontSize:16,fontWeight:800,color:c,lineHeight:1}}>{v}</span>
                    <span style={{fontSize:11,color:c,opacity:0.85,fontWeight:500}}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div style={{ flex:1, overflowY:'auto', padding:'22px 26px' }}>
              {reportLoading ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'56px 0', gap:16 }}>
                  <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#EDE9FE,#DDD6FE)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Sparkles size={26} color="#7C3AED" style={{ animation:'spin 1.5s linear infinite' }}/>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <p style={{ fontSize:15, fontWeight:700, color:'#4C1D95', margin:'0 0 6px', letterSpacing:'-0.01em' }}>Analyzing health data…</p>
                    <p style={{ fontSize:13, color:'#7C3AED', margin:0, fontWeight:400 }}>AI is composing your situation report</p>
                  </div>
                  <div style={{display:'flex',gap:6,marginTop:4}}>
                    {[0,1,2].map(i=>(
                      <div key={i} style={{width:8,height:8,borderRadius:'50%',background:'#7C3AED',opacity:0.6,animation:`dots-pulse 1.4s ${i*0.2}s ease-in-out infinite`}}/>
                    ))}
                  </div>
                </div>
              ) : reportError ? (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 18px', background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:14, fontSize:14, color:'#DC2626', fontWeight:500 }}>
                  <AlertCircle size={18} style={{flexShrink:0}}/>
                  {reportError}
                </div>
              ) : reportText ? (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:'#10B981'}}/>
                    <span style={{fontSize:12,fontWeight:600,color:'#059669'}}>Report generated successfully</span>
                    <span style={{fontSize:11,color:'#94A3B8',marginLeft:'auto'}}>{new Date().toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</span>
                  </div>
                  <div style={{
                    background:'#FAFBFE', border:'1.5px solid #E8EDF5',
                    borderRadius:14, padding:'22px 26px',
                    fontSize:13.5, lineHeight:1.85, color:'#1E293B',
                    whiteSpace:'pre-wrap', fontFamily:"'Georgia', 'Times New Roman', serif",
                    boxShadow:'inset 0 1px 3px rgba(15,23,42,0.04)',
                  }}>
                    {reportText}
                  </div>
                </div>
              ) : (
                <div style={{textAlign:'center',padding:'40px 0',color:'#94A3B8'}}>
                  <Sparkles size={36} style={{margin:'0 auto 12px',display:'block',opacity:0.3}}/>
                  <p style={{fontSize:14,fontWeight:500}}>Click "Generate Report" to create your AI health summary</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:'16px 26px', borderTop:'1.5px solid #F0F4F8', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#FAFBFE', flexShrink:0, gap:10 }}>
              <button className="btn btn-secondary btn-md" onClick={() => setShowReportModal(false)}>Close</button>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleGenerateReport} disabled={reportLoading}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:10, border:'1.5px solid #C4B5FD', background:'#FAFBFE', color:'#7C3AED', fontSize:13.5, fontWeight:600, cursor:reportLoading?'not-allowed':'pointer', transition:'all 0.15s', opacity:reportLoading?0.6:1 }}
                  onMouseEnter={e=>!reportLoading&&(e.currentTarget.style.background='#F5F3FF')}
                  onMouseLeave={e=>(e.currentTarget.style.background='#FAFBFE')}>
                  <Sparkles size={14}/> {reportLoading ? 'Generating…' : reportText ? 'Regenerate' : 'Generate Report'}
                </button>
                {reportText && (
                  <button onClick={handleCopyReport}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:10, border:'none', background: copied ? 'linear-gradient(135deg,#059669,#10B981)' : 'linear-gradient(135deg,#4C1D95,#7C3AED)', color:'#fff', fontSize:13.5, fontWeight:600, cursor:'pointer', transition:'all 0.2s', minWidth:140, justifyContent:'center' }}>
                    {copied ? <><CheckCheck size={14}/> Copied!</> : <><Copy size={14}/> Copy Report</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ APPOINTMENT MODAL ══ */}
      {showApptModal && (
        <div className="modal-overlay" onClick={()=>setShowApptModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:520,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#065F46,#10B981)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Calendar size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Book Appointment</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Schedule a patient health appointment</p>
                  </div>
                </div>
                <button onClick={()=>setShowApptModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {formErr&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div className="form-group"><label className="form-label">Patient Name <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={apptForm.patientName} onChange={e=>setApptForm(p=>({...p,patientName:e.target.value}))} placeholder="Full name" style={{fontSize:15,fontWeight:500}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Date <span style={{color:'#EF4444'}}>*</span></label><input type="date" className="form-input" value={apptForm.appointmentDate} onChange={e=>setApptForm(p=>({...p,appointmentDate:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Time</label><input type="time" className="form-input" value={apptForm.appointmentTime} onChange={e=>setApptForm(p=>({...p,appointmentTime:e.target.value}))}/></div>
              </div>
              <div className="form-group">
                <label className="form-label">Appointment Type</label>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {APPT_TYPES.map(t=>{const a=apptForm.appointmentType===t;return<button key={t} type="button" onClick={()=>setApptForm(p=>({...p,appointmentType:t}))} style={{padding:'6px 13px',borderRadius:100,fontSize:12,fontWeight:a?700:500,border:'1.5px solid '+(a?'#059669':'#E2E8F0'),background:a?'#ECFDF5':'#fff',color:a?'#065F46':'#64748B',cursor:'pointer',transition:'all 0.12s'}}>{t}</button>;})}
                </div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" rows={3} value={apptForm.notes} onChange={e=>setApptForm(p=>({...p,notes:e.target.value}))} placeholder="Reason for visit, symptoms, or special instructions..."/></div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowApptModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-md" onClick={handleApptSave} disabled={saving} style={{background:'linear-gradient(135deg,#065F46,#10B981)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:160}}>
                <Save size={15}/>{saving?'Saving…':'Book Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ IMMUNIZATION MODAL ══ */}
      {showImmModal && (
        <div className="modal-overlay" onClick={()=>setShowImmModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:520,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#0369A1,#0EA5E9)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Heart size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Add Immunization Record</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Record a vaccine dose for a resident</p>
                  </div>
                </div>
                <button onClick={()=>setShowImmModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {formErr&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div className="form-group"><label className="form-label">Patient Name <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={immForm.patientName} onChange={e=>setImmForm(p=>({...p,patientName:e.target.value}))} placeholder="Full name" style={{fontSize:15,fontWeight:500}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Vaccine <span style={{color:'#EF4444'}}>*</span></label><select className="form-select" value={immForm.vaccineName} onChange={e=>setImmForm(p=>({...p,vaccineName:e.target.value}))}><option value="">Select vaccine</option>{VACCINES.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Dose Number</label><input type="number" className="form-input" value={immForm.doseNumber} min="1" onChange={e=>setImmForm(p=>({...p,doseNumber:Number(e.target.value)}))} style={{fontWeight:700,fontSize:16,textAlign:'center'}}/></div>
              </div>
              <div className="form-group"><label className="form-label">Next Dose Date <span style={{fontSize:11.5,color:'#94A3B8',fontWeight:400}}>(leave blank if completed)</span></label><input type="date" className="form-input" value={immForm.nextDoseDate} onChange={e=>setImmForm(p=>({...p,nextDoseDate:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Remarks</label><input className="form-input" value={immForm.remarks} onChange={e=>setImmForm(p=>({...p,remarks:e.target.value}))} placeholder="Adverse reactions, batch number, etc."/></div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowImmModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-md" onClick={handleImmSave} disabled={saving} style={{background:'linear-gradient(135deg,#0369A1,#0EA5E9)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:140}}>
                <Save size={15}/>{saving?'Saving…':'Add Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DISEASE CASE MODAL ══ */}
      {showDiseaseModal && (
        <div className="modal-overlay" onClick={()=>setShowDiseaseModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:540,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><AlertCircle size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>{editingDisease?'Edit Case':'Report Disease Case'}</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Log a disease surveillance record</p>
                  </div>
                </div>
                <button onClick={()=>setShowDiseaseModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {formErr&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Disease <span style={{color:'#EF4444'}}>*</span></label><select className="form-select" value={diseaseForm.disease} onChange={e=>setDiseaseForm(p=>({...p,disease:e.target.value}))}>{DISEASES.map(d=><option key={d} value={d}>{d}</option>)}</select></div>
                <div>
                  <label className="form-label">Status</label>
                  <div style={{display:'flex',gap:6}}>
                    {['Active','Recovered','Deceased'].map(s=>{
                      const colors={Active:{bg:'#FEF2F2',color:'#991B1B',border:'#FECACA'},Recovered:{bg:'#ECFDF5',color:'#065F46',border:'#A7F3D0'},Deceased:{bg:'#F3F4F6',color:'#374151',border:'#D1D5DB'}}[s];
                      const a=diseaseForm.status===s;
                      return<button key={s} type="button" onClick={()=>setDiseaseForm(p=>({...p,status:s}))} style={{flex:1,padding:'7px 4px',borderRadius:9,border:'2px solid '+(a?colors.color:colors.border),background:a?colors.bg:'#fff',color:a?colors.color:'#64748B',fontSize:11.5,fontWeight:a?700:500,cursor:'pointer',transition:'all 0.12s'}}>{s}</button>;
                    })}
                  </div>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Patient Name <span style={{fontSize:11.5,color:'#94A3B8',fontWeight:400}}>(anonymous if unknown)</span></label><input className="form-input" value={diseaseForm.patientName} onChange={e=>setDiseaseForm(p=>({...p,patientName:e.target.value}))} placeholder="Juan Dela Cruz" style={{fontSize:14,fontWeight:500}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Purok / Sitio</label><input className="form-input" value={diseaseForm.purok} onChange={e=>setDiseaseForm(p=>({...p,purok:e.target.value}))} placeholder="e.g. Purok 3"/></div>
                <div className="form-group"><label className="form-label">Date of Onset</label><input type="date" className="form-input" value={diseaseForm.dateOnset} onChange={e=>setDiseaseForm(p=>({...p,dateOnset:e.target.value}))}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Age</label><input className="form-input" value={diseaseForm.age} onChange={e=>setDiseaseForm(p=>({...p,age:e.target.value}))} placeholder="e.g. 45" style={{fontWeight:600,fontSize:15}}/></div>
                <div className="form-group"><label className="form-label">Gender</label>
                  <div style={{display:'flex',gap:8,marginTop:2}}>
                    {['','Male','Female'].filter(Boolean).map(g=>{const a=diseaseForm.gender===g;return<button key={g} type="button" onClick={()=>setDiseaseForm(p=>({...p,gender:g}))} style={{flex:1,padding:'9px',borderRadius:9,border:'2px solid '+(a?'#2563EB':'#E2E8F0'),background:a?'#EFF6FF':'#fff',color:a?'#1D4ED8':'#64748B',fontSize:13,fontWeight:a?700:500,cursor:'pointer',transition:'all 0.12s'}}>{g}</button>;})}
                  </div>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Notes / Additional Info</label><textarea className="form-textarea" rows={2} value={diseaseForm.notes} onChange={e=>setDiseaseForm(p=>({...p,notes:e.target.value}))} placeholder="Symptoms, contacts, treatment given..."/></div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowDiseaseModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-md" onClick={handleDiseaseSave} disabled={saving} style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:150}}>
                <Save size={15}/>{saving?'Saving…':editingDisease?'Update Case':'Report Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MEDICINE MODAL ══ */}
      {showMedModal && (
        <div className="modal-overlay" onClick={()=>setShowMedModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:540,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#5B21B6,#8B5CF6)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Pill size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>{editingMed?'Edit Medicine':'Add Medicine'}</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Manage barangay health center inventory</p>
                  </div>
                </div>
                <button onClick={()=>setShowMedModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {formErr&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div className="form-group"><label className="form-label">Medicine Name <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={medForm.name} onChange={e=>setMedForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Amoxicillin 500mg" style={{fontSize:15,fontWeight:500}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={medForm.category} onChange={e=>setMedForm(p=>({...p,category:e.target.value}))}>{MED_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Unit of Measure</label><input className="form-input" value={medForm.unit} onChange={e=>setMedForm(p=>({...p,unit:e.target.value}))} placeholder="pcs / tablets / ml / bottles"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Quantity on Hand</label><input type="number" className="form-input" value={medForm.quantity} onChange={e=>setMedForm(p=>({...p,quantity:e.target.value}))} min="0" style={{fontWeight:700,fontSize:16}}/></div>
                <div className="form-group"><label className="form-label">Low Stock Alert At</label><input type="number" className="form-input" value={medForm.lowStockAt} onChange={e=>setMedForm(p=>({...p,lowStockAt:Number(e.target.value)}))} min="1" style={{fontWeight:600}}/><span style={{fontSize:11.5,color:'#94A3B8',display:'block',marginTop:4}}>Alert when stock drops below this</span></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Expiry Date</label><input type="date" className="form-input" value={medForm.expiryDate} onChange={e=>setMedForm(p=>({...p,expiryDate:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Supplier</label><input className="form-input" value={medForm.supplier} onChange={e=>setMedForm(p=>({...p,supplier:e.target.value}))} placeholder="Optional"/></div>
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowMedModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-md" onClick={handleMedSave} disabled={saving} style={{background:'linear-gradient(135deg,#5B21B6,#8B5CF6)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:150}}>
                <Save size={15}/>{saving?'Saving…':editingMed?'Update Medicine':'Add Medicine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MCH — MATERNAL & CHILD HEALTH ══ */}
      {activeTab === 'mch' && (
        <div className="mt-4">
          <div className="data-table-card">
            <div className="table-header">
              <h3 className="table-title">Maternal & Child Health Records</h3>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
                  {mchRecords.filter(r=>r.type==='prenatal').length} pre-natal &nbsp;·&nbsp;
                  {mchRecords.filter(r=>r.type==='child').length} child growth
                </span>
              </div>
            </div>
            {mchLoading ? <p className="p-4 text-secondary">Loading...</p>
            : mchRecords.filter(r => !search || r.motherName?.toLowerCase().includes(search.toLowerCase()) || r.childName?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="empty-state">
                <Baby className="empty-state-icon" />
                <h3 className="empty-state-title">No MCH records</h3>
                <p className="empty-state-description">Track pre-natal visits and child growth milestones</p>
                <button className="btn btn-primary btn-md mt-4" onClick={() => { setFormErr(''); setMchForm(emptyMCH); setShowMchModal(true); }}><Plus size={16}/> Add First Record</button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Type</th><th>Mother / Guardian</th><th>Child Name</th><th>DOB</th><th>Weight</th><th>Height</th><th>Next Visit</th><th>Purok</th><th></th></tr></thead>
                  <tbody>
                    {mchRecords.filter(r => !search || r.motherName?.toLowerCase().includes(search.toLowerCase()) || r.childName?.toLowerCase().includes(search.toLowerCase())).map(r => (
                      <tr key={r.id}>
                        <td><span className={`badge badge-${r.type==='prenatal'?'primary':'success'}`}>{r.type==='prenatal'?'Pre-natal':'Child Growth'}</span></td>
                        <td className="fw-medium">{r.motherName}</td>
                        <td className="text-secondary">{r.childName || '—'}</td>
                        <td className="text-secondary">{r.dateOfBirth || '—'}</td>
                        <td className="text-secondary">{r.weight ? r.weight+' kg' : '—'}</td>
                        <td className="text-secondary">{r.height ? r.height+' cm' : '—'}</td>
                        <td className="text-secondary">{r.nextVisit || '—'}</td>
                        <td className="text-secondary">{r.purok || '—'}</td>
                        <td><button className="btn-icon" style={{ color:'var(--color-error)' }} onClick={() => { if(window.confirm('Delete?')) deleteMch(r.id); }}><Trash2 size={15}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ FAMILY PLANNING ══ */}
      {activeTab === 'fp' && (
        <div className="mt-4">
          <div className="data-table-card">
            <div className="table-header">
              <h3 className="table-title">Family Planning Clients</h3>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                {['Current User','New Acceptor','Dropout'].map(s => (
                  <span key={s} style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20,
                    background: s==='Current User'?'#d1fae5':s==='New Acceptor'?'#dbeafe':'#fee2e2',
                    color:      s==='Current User'?'#065f46':s==='New Acceptor'?'#1e40af':'#991b1b' }}>
                    {fpRecords.filter(r=>r.status===s).length} {s}
                  </span>
                ))}
              </div>
            </div>
            {fpLoading ? <p className="p-4 text-secondary">Loading...</p>
            : fpRecords.filter(r => !search || r.clientName?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="empty-state">
                <Heart className="empty-state-icon" />
                <h3 className="empty-state-title">No family planning records</h3>
                <p className="empty-state-description">Register clients and track family planning methods</p>
                <button className="btn btn-primary btn-md mt-4" onClick={() => { setFormErr(''); setFpForm(emptyFP); setShowFpModal(true); }}><Plus size={16}/> Add FP Client</button>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>Client Name</th><th>Age</th><th>Purok</th><th>Method</th><th>Status</th><th>Start Date</th><th>Next Visit</th><th></th></tr></thead>
                  <tbody>
                    {fpRecords.filter(r => !search || r.clientName?.toLowerCase().includes(search.toLowerCase())).map(r => (
                      <tr key={r.id}>
                        <td className="fw-medium">{r.clientName}</td>
                        <td className="text-secondary">{r.age || '—'}</td>
                        <td className="text-secondary">{r.purok || '—'}</td>
                        <td><span className="badge badge-primary">{r.method}</span></td>
                        <td>
                          <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20,
                            background: r.status==='Current User'?'#d1fae5':r.status==='New Acceptor'?'#dbeafe':r.status==='Dropout'?'#fee2e2':'#f1f5f9',
                            color: r.status==='Current User'?'#065f46':r.status==='New Acceptor'?'#1e40af':r.status==='Dropout'?'#991b1b':'#475569' }}>
                            {r.status}
                          </span>
                        </td>
                        <td className="text-secondary">{r.startDate || '—'}</td>
                        <td className="text-secondary">{r.nextVisit || '—'}</td>
                        <td><button className="btn-icon" style={{ color:'var(--color-error)' }} onClick={() => { if(window.confirm('Delete?')) deleteFp(r.id); }}><Trash2 size={15}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ HEALTH CAMPAIGNS ══ */}
      {activeTab === 'campaigns' && (
        <div className="mt-4">
          {/* Summary row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[['Planned','#3b82f6','#dbeafe'],['Ongoing','#f59e0b','#fef3c7'],['Completed','#10b981','#d1fae5'],['Cancelled','#6b7280','#f1f5f9']].map(([s,c,bg]) => (
              <div key={s} style={{ background:bg, borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700, color:c }}>{campaigns.filter(camp=>camp.status===s).length}</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
            {campaignLoading ? (
              <div className="empty-state"><Loader className="empty-state-icon animate-spin" /><h3 className="empty-state-title">Loading...</h3></div>
            ) : campaigns.filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
              <div className="card" style={{ gridColumn:'1/-1' }}>
                <div className="empty-state">
                  <Megaphone className="empty-state-icon" />
                  <h3 className="empty-state-title">No health campaigns</h3>
                  <p className="empty-state-description">Plan and track vaccination drives, anti-dengue campaigns, and health outreaches</p>
                  <button className="btn btn-primary btn-md mt-4" onClick={() => { setFormErr(''); setEditingCampaign(null); setCampaignForm(emptyCampaign); setShowCampaignModal(true); }}><Plus size={16}/> Create Campaign</button>
                </div>
              </div>
            ) : campaigns.filter(c => !search || c.title?.toLowerCase().includes(search.toLowerCase())).map(camp => {
              const statusColors = { Planned:'#3b82f6', Ongoing:'#f59e0b', Completed:'#10b981', Cancelled:'#6b7280' };
              const statusBgs    = { Planned:'#dbeafe', Ongoing:'#fef3c7', Completed:'#d1fae5', Cancelled:'#f1f5f9' };
              const sc = statusColors[camp.status] || '#6b7280';
              const sb = statusBgs[camp.status] || '#f1f5f9';
              return (
                <div key={camp.id} className="card" style={{ borderTop:`3px solid ${sc}` }}>
                  <div className="card-body" style={{ padding:'16px 18px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <h4 style={{ fontSize:14, fontWeight:700, margin:'0 0 3px', color:'var(--color-text-primary)' }}>{camp.title}</h4>
                        <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20, background:'#f1f5f9', color:'#475569' }}>{camp.category}</span>
                      </div>
                      <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background:sb, color:sc, flexShrink:0, marginLeft:8 }}>{camp.status}</span>
                    </div>
                    {camp.description && <p style={{ fontSize:12.5, color:'var(--color-text-secondary)', margin:'6px 0', lineHeight:1.5 }}>{camp.description}</p>}
                    <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--color-text-tertiary)', flexWrap:'wrap', margin:'8px 0' }}>
                      {camp.targetDate  && <span>📅 {camp.targetDate}</span>}
                      {camp.location    && <span>📍 {camp.location}</span>}
                      {camp.targetCount && <span>👥 Target: {camp.targetCount}</span>}
                      {camp.responsible && <span>👤 {camp.responsible}</span>}
                    </div>
                    <div style={{ display:'flex', gap:6, marginTop:10 }}>
                      {camp.status === 'Planned' && (
                        <button className="btn btn-secondary btn-sm" style={{ flex:1 }} onClick={() => updateCampaignStatus(camp.id, 'Ongoing')}>
                          <TrendingUp size={13}/> Start
                        </button>
                      )}
                      {camp.status === 'Ongoing' && (
                        <button className="btn btn-secondary btn-sm" style={{ flex:1, color:'var(--color-success)' }} onClick={() => updateCampaignStatus(camp.id, 'Completed')}>
                          <Check size={13}/> Mark Done
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditingCampaign(camp); setCampaignForm({ title:camp.title, category:camp.category, targetDate:camp.targetDate||'', location:camp.location||'', targetCount:camp.targetCount||'', description:camp.description||'', status:camp.status, responsible:camp.responsible||'' }); setFormErr(''); setShowCampaignModal(true); }}>
                        <Edit size={13}/>
                      </button>
                      <button className="btn-icon" style={{ color:'var(--color-error)' }} onClick={() => { if(window.confirm('Delete campaign?')) deleteCampaign(camp.id); }}>
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ MCH MODAL ══ */}
      {showMchModal && (
        <div className="modal-overlay" onClick={()=>setShowMchModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:560,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#be185d,#ec4899)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Baby size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Add MCH Record</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Maternal & Child Health tracking</p>
                  </div>
                </div>
                <button onClick={()=>setShowMchModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:14}}>
              {formErr && <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div className="form-group">
                <label className="form-label">Record Type</label>
                <div style={{display:'flex',gap:8}}>
                  {[{val:'child',label:'Child Growth'},{ val:'prenatal',label:'Pre-natal'}].map(t=>{
                    const a=mchForm.type===t.val;
                    return <button key={t.val} type="button" onClick={()=>setMchForm(p=>({...p,type:t.val}))}
                      style={{flex:1,padding:'9px',borderRadius:10,border:`2px solid ${a?'#be185d':'#E2E8F0'}`,background:a?'#fdf2f8':'#fff',color:a?'#be185d':'#64748b',fontSize:13,fontWeight:a?700:500,cursor:'pointer',transition:'all .15s'}}>{t.label}</button>;
                  })}
                </div>
              </div>
              <div className="form-group"><label className="form-label">Mother / Guardian Name <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={mchForm.motherName} onChange={e=>setMchForm(p=>({...p,motherName:e.target.value}))} placeholder="Full name"/></div>
              {mchForm.type==='child' && <div className="form-group"><label className="form-label">Child Name</label><input className="form-input" value={mchForm.childName} onChange={e=>setMchForm(p=>({...p,childName:e.target.value}))} placeholder="Child's full name"/></div>}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">{mchForm.type==='prenatal'?'LMP / Est. Due Date':'Date of Birth'}</label><input type="date" className="form-input" value={mchForm.dateOfBirth} onChange={e=>setMchForm(p=>({...p,dateOfBirth:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Purok</label><input className="form-input" value={mchForm.purok} onChange={e=>setMchForm(p=>({...p,purok:e.target.value}))} placeholder="e.g. Purok 2"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Weight (kg)</label><input type="number" step="0.1" className="form-input" value={mchForm.weight} onChange={e=>setMchForm(p=>({...p,weight:e.target.value}))} placeholder="0.0"/></div>
                <div className="form-group"><label className="form-label">Height (cm)</label><input type="number" step="0.1" className="form-input" value={mchForm.height} onChange={e=>setMchForm(p=>({...p,height:e.target.value}))} placeholder="0.0"/></div>
                {mchForm.type==='prenatal' && <div className="form-group"><label className="form-label">AOG (weeks)</label><input type="number" className="form-input" value={mchForm.gestationalAge} onChange={e=>setMchForm(p=>({...p,gestationalAge:e.target.value}))} placeholder="0"/></div>}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Last Visit</label><input type="date" className="form-input" value={mchForm.lastVisit} onChange={e=>setMchForm(p=>({...p,lastVisit:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Next Visit</label><input type="date" className="form-input" value={mchForm.nextVisit} onChange={e=>setMchForm(p=>({...p,nextVisit:e.target.value}))}/></div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" rows={2} value={mchForm.notes} onChange={e=>setMchForm(p=>({...p,notes:e.target.value}))} placeholder="Observations, concerns, or reminders..."/></div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowMchModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-md" onClick={saveMch} disabled={saving} style={{background:'linear-gradient(135deg,#be185d,#ec4899)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:150}}>
                <Save size={15}/>{saving?'Saving…':'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ FAMILY PLANNING MODAL ══ */}
      {showFpModal && (
        <div className="modal-overlay" onClick={()=>setShowFpModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:520,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#0f766e,#14b8a6)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Heart size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0}}>Add FP Client</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Family planning client registration</p>
                  </div>
                </div>
                <button onClick={()=>setShowFpModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:14}}>
              {formErr && <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div className="form-group"><label className="form-label">Client Name <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={fpForm.clientName} onChange={e=>setFpForm(p=>({...p,clientName:e.target.value}))} placeholder="Full name" style={{fontSize:15,fontWeight:500}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Age</label><input type="number" className="form-input" value={fpForm.age} onChange={e=>setFpForm(p=>({...p,age:e.target.value}))} placeholder="e.g. 28"/></div>
                <div className="form-group"><label className="form-label">Purok</label><input className="form-input" value={fpForm.purok} onChange={e=>setFpForm(p=>({...p,purok:e.target.value}))} placeholder="e.g. Purok 1"/></div>
              </div>
              <div className="form-group">
                <label className="form-label">FP Method</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {FP_METHODS.map(m=>{const a=fpForm.method===m;return<button key={m} type="button" onClick={()=>setFpForm(p=>({...p,method:m}))}
                    style={{padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:a?700:500,border:`1.5px solid ${a?'#0f766e':'#E2E8F0'}`,background:a?'#ccfbf1':'#fff',color:a?'#0f766e':'#64748b',cursor:'pointer',transition:'all .12s'}}>{m}</button>;})}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <div style={{display:'flex',gap:8}}>
                  {FP_STATUSES.map(s=>{
                    const a=fpForm.status===s;
                    const c={Current:'#065f46','New A':'#1e40af',Drop:'#991b1b',Comp:'#475569'}[s.slice(0,4)]||'#475569';
                    const bg={'Curr':'#d1fae5','New ':'#dbeafe','Drop':'#fee2e2','Comp':'#f1f5f9'}[s.slice(0,4)]||'#f1f5f9';
                    return<button key={s} type="button" onClick={()=>setFpForm(p=>({...p,status:s}))}
                      style={{flex:1,padding:'7px 4px',borderRadius:9,border:`2px solid ${a?c:'#E2E8F0'}`,background:a?bg:'#fff',color:a?c:'#64748b',fontSize:11.5,fontWeight:a?700:500,cursor:'pointer',transition:'all .12s'}}>{s}</button>;
                  })}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Start Date</label><input type="date" className="form-input" value={fpForm.startDate} onChange={e=>setFpForm(p=>({...p,startDate:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Next Visit</label><input type="date" className="form-input" value={fpForm.nextVisit} onChange={e=>setFpForm(p=>({...p,nextVisit:e.target.value}))}/></div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" rows={2} value={fpForm.notes} onChange={e=>setFpForm(p=>({...p,notes:e.target.value}))} placeholder="Additional remarks..."/></div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowFpModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-md" onClick={saveFp} disabled={saving} style={{background:'linear-gradient(135deg,#0f766e,#14b8a6)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:140}}>
                <Save size={15}/>{saving?'Saving…':'Add Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CAMPAIGN MODAL ══ */}
      {showCampaignModal && (
        <div className="modal-overlay" onClick={()=>setShowCampaignModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:560,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Megaphone size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0}}>{editingCampaign?'Edit Campaign':'New Health Campaign'}</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Plan and track health outreaches & drives</p>
                  </div>
                </div>
                <button onClick={()=>setShowCampaignModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:14}}>
              {formErr && <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{formErr}</div>}
              <div className="form-group"><label className="form-label">Campaign Title <span style={{color:'#EF4444'}}>*</span></label><input className="form-input" value={campaignForm.title} onChange={e=>setCampaignForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Anti-Dengue Community Drive 2025" style={{fontSize:15,fontWeight:500}}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={campaignForm.category} onChange={e=>setCampaignForm(p=>({...p,category:e.target.value}))}>
                    {CAMPAIGN_CATS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={campaignForm.status} onChange={e=>setCampaignForm(p=>({...p,status:e.target.value}))}>
                    {CAMPAIGN_STS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Target Date</label><input type="date" className="form-input" value={campaignForm.targetDate} onChange={e=>setCampaignForm(p=>({...p,targetDate:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Target Participants</label><input type="number" className="form-input" value={campaignForm.targetCount} onChange={e=>setCampaignForm(p=>({...p,targetCount:e.target.value}))} placeholder="e.g. 200" min={0}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Location / Venue</label><input className="form-input" value={campaignForm.location} onChange={e=>setCampaignForm(p=>({...p,location:e.target.value}))} placeholder="e.g. Barangay Hall"/></div>
                <div className="form-group"><label className="form-label">Person Responsible</label><input className="form-input" value={campaignForm.responsible} onChange={e=>setCampaignForm(p=>({...p,responsible:e.target.value}))} placeholder="e.g. Nurse / Kagawad"/></div>
              </div>
              <div className="form-group"><label className="form-label">Description / Objectives</label><textarea className="form-textarea" rows={3} value={campaignForm.description} onChange={e=>setCampaignForm(p=>({...p,description:e.target.value}))} placeholder="What is this campaign about? What are the goals?"/></div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowCampaignModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-md" onClick={saveCampaign} disabled={saving} style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:160}}>
                <Save size={15}/>{saving?'Saving…':editingCampaign?'Update Campaign':'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DISPENSE MODAL ══ */}
      {showDispense && (
        <div className="modal-overlay" onClick={()=>setShowDispense(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:380,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#0369A1,#0EA5E9)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Pill size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Dispense Medicine</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>{dispensingMed?.name||'Selected medicine'}</p>
                  </div>
                </div>
                <button onClick={()=>setShowDispense(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {dispensingMed && (
                <div style={{background:'#F0F9FF',border:'1.5px solid #BAE6FD',borderRadius:12,padding:'12px 15px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:36,height:36,borderRadius:9,background:'#DBEAFE',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Pill size={16} color="#2563EB"/></div>
                  <div>
                    <p style={{fontSize:14,fontWeight:700,color:'#0F172A',margin:0}}>{dispensingMed.name}</p>
                    <p style={{fontSize:12,color:'#64748B',margin:'2px 0 0'}}>Available: <strong style={{color:'#0369A1'}}>{dispensingMed.quantity} {dispensingMed.unit||'pcs'}</strong></p>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Quantity to Dispense <span style={{color:'#EF4444'}}>*</span></label>
                <input type="number" className="form-input" value={dispenseQty} min="1" max={dispensingMed?.quantity} onChange={e=>setDispenseQty(Number(e.target.value))} style={{fontSize:22,fontWeight:800,textAlign:'center',letterSpacing:'-0.02em'}}/>
                {dispensingMed && dispenseQty > dispensingMed.quantity && <span style={{fontSize:12,color:'#DC2626',display:'block',marginTop:4,fontWeight:600}}>⚠ Exceeds available stock of {dispensingMed.quantity}</span>}
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowDispense(false)}>Cancel</button>
              <button className="btn btn-md" onClick={handleDispense} style={{background:'linear-gradient(135deg,#0369A1,#0EA5E9)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:130}}>
                <Save size={15}/> Dispense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}