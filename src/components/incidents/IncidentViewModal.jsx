// src/components/incidents/IncidentViewModal.jsx
import React, { useState } from 'react';
import {
  X, Scale, CheckCircle, MapPin, Clock,
  ChevronDown, FileText, AlertTriangle,
  Send, MessageSquare, Shield, Calendar, Users, Loader
} from 'lucide-react';
import { useIncidents } from '../../hooks/useIncidents';

const STATUS_FLOW = [
  { key: 'Open',            label: 'Open',            color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  { key: 'Under Mediation', label: 'Under Mediation', color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
  { key: 'Resolved',        label: 'Resolved',        color: '#065f46', bg: '#d1fae5', dot: '#10b981' },
  { key: 'Referred to PNP', label: 'Referred to PNP', color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
];

const InfoRow = ({ label, value, icon: Icon }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
    <span style={{ fontSize: 14, color: value ? '#0f172a' : '#cbd5e1', fontWeight: value ? 500 : 400, display: 'flex', alignItems: 'center', gap: 5 }}>
      {Icon && <Icon size={13} color="#94a3b8" />}{value || '—'}
    </span>
  </div>
);

const IncidentViewModal = ({ isOpen, onClose, incident, onEdit, onSuccess }) => {
  // ✅ FIXED: using correct hook method names (changeStatus, createNote)
  const { changeStatus, createNote } = useIncidents();

  const [note, setNote]                     = useState('');
  const [savingNote, setSavingNote]         = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [activeTab, setActiveTab]           = useState('details');

  // Schedule Mediation state
  const [showMediationForm, setShowMediationForm] = useState(false);
  const [mediationDate, setMediationDate]         = useState('');
  const [mediationNotes, setMediationNotes]       = useState('');
  const [mediationMembers, setMediationMembers]   = useState('');
  const [savingMediation, setSavingMediation]     = useState(false);

  if (!isOpen || !incident) return null;

  const currentStatus = STATUS_FLOW.find(s => s.key === incident.status) || STATUS_FLOW[0];

  const formatDate = (ts) => {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return '—'; }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const handleStatusChange = async (newStatus) => {
    setShowStatusDrop(false);
    if (newStatus === incident.status) return;
    setChangingStatus(true);
    await changeStatus(incident.id, newStatus); // ✅ was updateStatus
    setChangingStatus(false);
    onSuccess?.();
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    await createNote(incident.id, note); // ✅ was addNote
    setNote('');
    setSavingNote(false);
    onSuccess?.();
  };

  const handleScheduleMediation = async () => {
    if (!mediationDate) return;
    setSavingMediation(true);
    // Call scheduleMediation via changeStatus to Under Mediation + store date via createNote
    await changeStatus(incident.id, 'Under Mediation');
    await createNote(incident.id,
      `Mediation scheduled for ${mediationDate}.${mediationMembers ? ' Lupon members: ' + mediationMembers + '.' : ''}${mediationNotes ? ' Notes: ' + mediationNotes : ''}`
    );
    setSavingMediation(false);
    setShowMediationForm(false);
    setMediationDate(''); setMediationNotes(''); setMediationMembers('');
    onSuccess?.();
  };

  const TABS = [
    { id: 'details', label: 'Details',  icon: FileText      },
    { id: 'parties', label: 'Parties',  icon: Users         },
    { id: 'notes',   label: 'Timeline', icon: MessageSquare, count: incident.notes?.length },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 660,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(15,23,42,0.18)', overflow: 'hidden',
      }}>

        {/* Status banner */}
        <div style={{ background: currentStatus.bg, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: currentStatus.dot }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: currentStatus.color }}>{incident.status}</span>
            <span style={{ fontSize: 12, color: currentStatus.color, opacity: .6 }}>· {incident.caseNumber}</span>
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
            <button onClick={() => setShowStatusDrop(p => !p)} disabled={changingStatus}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: currentStatus.color, color: '#fff', border: 'none', cursor: 'pointer' }}>
              {changingStatus ? 'Updating...' : 'Change Status'} <ChevronDown size={13} />
            </button>
            {showStatusDrop && (
              <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 200, minWidth: 200, overflow: 'hidden' }}>
                {STATUS_FLOW.map(s => (
                  <button key={s.key} onClick={() => handleStatusChange(s.key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 16px', background: s.key === incident.status ? s.bg : 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: s.key === incident.status ? s.color : '#374151', fontWeight: s.key === incident.status ? 600 : 400 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                    {s.label}
                    {s.key === incident.status && <CheckCircle size={13} style={{ marginLeft: 'auto' }} color={s.color} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div style={{ padding: '18px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={20} color="#d97706" />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>{incident.category}</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={12} />{incident.location || 'No location'}
                  {incident.incidentDate && <> · <Clock size={12} />{incident.incidentDate}</>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { onClose(); onEdit?.(incident); }}>Edit</button>
              <button className="btn-icon" onClick={onClose}><X size={20} /></button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, color: activeTab === t.id ? '#1e40af' : '#64748b', borderBottom: activeTab === t.id ? '2px solid #3b82f6' : '2px solid transparent', marginBottom: -1 }}>
                  <Icon size={14} />{t.label}
                  {t.count > 0 && <span style={{ fontSize: 11, background: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>{t.count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                <InfoRow label="Category"     value={incident.category} />
                <InfoRow label="Date Filed"   value={formatDate(incident.systemInfo?.dateFiled)} />
                <InfoRow label="Location"     value={incident.location}      icon={MapPin} />
                <InfoRow label="Incident Date" value={incident.incidentDate || formatDate(incident.systemInfo?.dateFiled)} />
                {incident.incidentTime && <InfoRow label="Time" value={incident.incidentTime} icon={Clock} />}
              </div>

              {incident.narrative && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Narrative</p>
                  <div style={{ padding: '14px 18px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 14, lineHeight: 1.75, color: '#374151', whiteSpace: 'pre-wrap' }}>
                    {incident.narrative}
                  </div>
                </div>
              )}

              {/* Lupon / Mediation section */}
              <div style={{ padding: '16px 20px', background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showMediationForm ? 16 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Scale size={15} color="#3b82f6" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>Lupon Tagapamayapa</span>
                  </div>
                  {incident.status !== 'Resolved' && incident.status !== 'Referred to PNP' && (
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => setShowMediationForm(p => !p)}>
                      <Calendar size={13} />
                      {showMediationForm ? 'Cancel' : 'Schedule Mediation'}
                    </button>
                  )}
                </div>

                {/* Existing mediation info */}
                {!showMediationForm && incident.status === 'Under Mediation' && (
                  <div style={{ marginTop: 10 }}>
                    {incident.mediation?.scheduledDate && (
                      <p style={{ fontSize: 13, color: '#1e40af', margin: '0 0 4px' }}>
                        <strong>Scheduled:</strong> {incident.mediation.scheduledDate}
                      </p>
                    )}
                    {incident.mediation?.lupongMembers?.length > 0 && (
                      <p style={{ fontSize: 13, color: '#1e40af', margin: '0 0 4px' }}>
                        <strong>Lupon Members:</strong> {incident.mediation.lupongMembers.join(', ')}
                      </p>
                    )}
                    {incident.mediation?.notes && (
                      <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{incident.mediation.notes}</p>
                    )}
                    {!incident.mediation?.scheduledDate && (
                      <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0 0' }}>Case is under mediation. Click "Schedule Mediation" to set a date.</p>
                    )}
                  </div>
                )}

                {!showMediationForm && incident.status !== 'Under Mediation' && incident.status !== 'Resolved' && incident.status !== 'Referred to PNP' && (
                  <p style={{ fontSize: 13, color: '#64748b', margin: '8px 0 0' }}>Schedule a mediation session between the parties.</p>
                )}

                {incident.status === 'Referred to PNP' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <Shield size={14} color="#dc2626" />
                    <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>This case has been referred to PNP for further action.</span>
                  </div>
                )}

                {/* Schedule Mediation form */}
                {showMediationForm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Mediation Date <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" className="form-input" value={mediationDate}
                          onChange={e => setMediationDate(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Lupon Members</label>
                        <input className="form-input" value={mediationMembers}
                          onChange={e => setMediationMembers(e.target.value)}
                          placeholder="e.g. Kagawad Santos, Kagawad Cruz" />
                      </div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Notes</label>
                      <textarea className="form-textarea" rows={2} value={mediationNotes}
                        onChange={e => setMediationNotes(e.target.value)}
                        placeholder="Additional mediation notes..." style={{ minHeight: 60 }} />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleScheduleMediation}
                      disabled={savingMediation || !mediationDate}>
                      {savingMediation
                        ? <><Loader size={13} className="animate-spin" />Scheduling...</>
                        : <><Calendar size={13} />Confirm Mediation Schedule</>}
                    </button>
                  </div>
                )}
              </div>

              {incident.evidenceNotes && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Evidence Notes</p>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: 13, color: '#374151' }}>
                    {incident.evidenceNotes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARTIES TAB */}
          {activeTab === 'parties' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 12px' }}>Complainant</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                    {incident.complainant?.initial || '?'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{incident.complainant?.name || '—'}</p>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                      {incident.complainant?.purok || ''}
                      {incident.complainant?.contactNumber ? ' · ' + incident.complainant.contactNumber : ''}
                    </p>
                  </div>
                </div>
              </div>

              {(incident.respondents?.length > 0 || incident.respondent?.name) && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '16px 20px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 12px' }}>
                    Respondent{incident.respondents?.length > 1 ? 's' : ''}
                  </p>
                  {(incident.respondents?.length ? incident.respondents : [incident.respondent]).filter(r => r?.name).map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < (incident.respondents?.length || 1) - 1 ? 12 : 0 }}>
                      <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#fed7aa', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {r.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{r.name}</p>
                        <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{r.purok || 'Purok unknown'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 18px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>Add Case Note</p>
                <textarea className="form-textarea" rows={3} value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a case update, remark, or mediation note..."
                  style={{ marginBottom: 10 }} />
                <button className="btn btn-primary btn-sm" onClick={handleAddNote}
                  disabled={savingNote || !note.trim()}>
                  {savingNote ? <><Loader size={13} className="animate-spin" />Saving...</> : <><Send size={13} />Add Note</>}
                </button>
              </div>

              {incident.notes?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...incident.notes].reverse().map((n, i) => (
                    <div key={i} style={{ padding: '12px 16px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#3730a3' }}>
                            {(n.addedBy || 'O').charAt(0)}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>{n.addedBy || 'Official'}</span>
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{formatDate(n.addedAt)} {formatTime(n.addedAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{n.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                  <MessageSquare size={28} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontSize: 13, margin: 0 }}>No notes yet. Add the first case update above.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentViewModal;