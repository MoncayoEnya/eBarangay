// src/components/incidents/IncidentFormModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Save, Loader, AlertTriangle, Users, MapPin,
  FileText, Camera, Plus, Trash2, ChevronRight, ChevronLeft,
  Scale, Sparkles, Wand2,
} from 'lucide-react';
import { useIncidents } from '../../hooks/useIncidents';

const PUROKS     = ['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5',
                   'Purok 6','Purok 7','Purok 8','Purok 9','Purok 10'];
const CATEGORIES = ['Dispute','Theft','Noise Complaint','Property Issue',
                    'Physical Assault','Trespassing','Domestic Violence',
                    'Vandalism','Drug-Related','Others'];

const emptyRespondent = { name: '', purok: '', residentId: '' };

const STEPS = [
  { id: 'details',  label: 'Incident', icon: FileText },
  { id: 'parties',  label: 'Parties',  icon: Users    },
  { id: 'evidence', label: 'Evidence', icon: Camera   },
];

const Field = ({ label, required, error, hint, children }) => (
  <div className="form-group">
    <label className="form-label">
      {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </label>
    {children}
    {hint  && !error && <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>{hint}</span>}
    {error && <span className="form-error">{error}</span>}
  </div>
);

// ── AI classify helper ────────────────────────────────────────
const classifyIncident = async (narrative) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: 'You are an assistant for a Philippine barangay management system. You only respond with valid JSON, no markdown, no explanation.',
        },
        {
          role: 'user',
          content: `Analyze this incident narrative and respond ONLY with a valid JSON object.

Narrative: "${narrative}"

Respond with exactly this JSON structure:
{
  "category": one of [Dispute, Theft, Noise Complaint, Property Issue, Physical Assault, Trespassing, Domestic Violence, Vandalism, Drug-Related, Others],
  "severity": one of [Low, Medium, High, Urgent],
  "recommendedAction": one of ["Barangay Mediation", "Summon both parties", "Refer to PNP", "Issue Warning", "Community Service Order"],
  "summary": "a 1-sentence plain English summary of the incident",
  "reasoning": "1 short sentence explaining why you chose this category and severity"
}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

// ── Main Component ────────────────────────────────────────────
const IncidentFormModal = ({ isOpen, onClose, incident = null, onSuccess }) => {
  const { create, update, loading } = useIncidents();
  const isEdit  = !!incident;
  const fileRef = useRef();

  const [step, setStep]         = useState(0);
  const [errors, setErrors]     = useState({});
  const [previews, setPreviews] = useState([]);

  // AI state
  const [aiLoading, setAiLoading]   = useState(false);
  const [aiResult,  setAiResult]    = useState(null);  // { category, severity, recommendedAction, summary, reasoning }
  const [aiError,   setAiError]     = useState('');
  const [aiApplied, setAiApplied]   = useState(false);

  const empty = {
    category: '', location: '', incidentDate: '', incidentTime: '',
    narrative: '', status: 'Open', severity: '',
    complainantName: '', complainantPurok: '', complainantContact: '', complainantResidentId: '',
    respondents: [{ ...emptyRespondent }],
    evidenceFiles: [],
    evidenceNotes: '',
  };

  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (isOpen) {
      if (incident) {
        setForm({
          category:            incident.category || '',
          location:            incident.location || '',
          incidentDate:        incident.incidentDate || '',
          incidentTime:        incident.incidentTime || '',
          narrative:           incident.narrative || incident.description || '',
          status:              incident.status || 'Open',
          severity:            incident.severity || '',
          complainantName:     incident.complainant?.name || '',
          complainantPurok:    incident.complainant?.purok || '',
          complainantContact:  incident.complainant?.contactNumber || '',
          complainantResidentId: incident.complainant?.residentId || '',
          respondents: incident.respondents?.length ? incident.respondents : [{ ...emptyRespondent }],
          evidenceFiles: [],
          evidenceNotes: incident.evidenceNotes || '',
        });
      } else {
        setForm(empty);
      }
      setStep(0);
      setErrors({});
      setPreviews([]);
      setAiResult(null);
      setAiError('');
      setAiApplied(false);
    }
  }, [isOpen, incident]);

  if (!isOpen) return null;

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  // ── AI classify ──
  const handleAiClassify = async () => {
    if (form.narrative.trim().length < 20) {
      setAiError('Please write at least 20 characters in the narrative first.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    setAiApplied(false);
    try {
      const result = await classifyIncident(form.narrative);
      setAiResult(result);
    } catch (e) {
      setAiError('AI classification failed. Please classify manually.');
      console.error('AI error:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    setForm(p => ({
      ...p,
      category: CATEGORIES.includes(aiResult.category) ? aiResult.category : p.category,
      severity: aiResult.severity || p.severity,
    }));
    setAiApplied(true);
    // clear category error if it was set
    setErrors(p => ({ ...p, category: '' }));
  };

  // ── Respondent helpers ──
  const addRespondent    = () => setForm(p => ({ ...p, respondents: [...p.respondents, { ...emptyRespondent }] }));
  const removeRespondent = (i) => setForm(p => ({ ...p, respondents: p.respondents.filter((_, idx) => idx !== i) }));
  const setRespondent    = (i, field, val) =>
    setForm(p => ({ ...p, respondents: p.respondents.map((r, idx) => idx === i ? { ...r, [field]: val } : r) }));

  // ── Evidence helpers ──
  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (valid.length !== files.length) alert('Only images and videos are allowed.');
    setPreviews(p => [...p, ...valid.map(f => ({ name: f.name, url: URL.createObjectURL(f), type: f.type }))]);
    setForm(p => ({ ...p, evidenceFiles: [...p.evidenceFiles, ...valid] }));
  };
  const removeEvidence = (i) => {
    URL.revokeObjectURL(previews[i].url);
    setPreviews(p => p.filter((_, idx) => idx !== i));
    setForm(p => ({ ...p, evidenceFiles: p.evidenceFiles.filter((_, idx) => idx !== i) }));
  };

  // ── Validation ──
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.category)                                    e.category  = 'Category is required';
      if (!form.location.trim())                             e.location  = 'Location is required';
      if (!form.narrative.trim() || form.narrative.trim().length < 20)
                                                             e.narrative = 'Narrative must be at least 20 characters';
    }
    if (s === 1) {
      if (!form.complainantName.trim())  e.complainantName  = 'Complainant name is required';
      if (!form.complainantPurok)        e.complainantPurok = 'Purok is required';
      if (form.respondents[0] && !form.respondents[0].name.trim())
                                         e.respondent0name  = 'At least one respondent name is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    const colors = ['primary', 'error', 'secondary', 'warning', 'success'];
    const payload = {
      category:              form.category,
      categoryType:          form.category.toLowerCase().replace(/\s+/g, '_'),
      location:              form.location,
      incidentDate:          form.incidentDate,
      incidentTime:          form.incidentTime,
      narrative:             form.narrative,
      description:           form.narrative,
      status:                form.status,
      severity:              form.severity || 'Medium',
      aiRecommendedAction:   aiApplied ? aiResult?.recommendedAction : null,
      complainantName:       form.complainantName,
      complainantPurok:      form.complainantPurok,
      complainantContact:    form.complainantContact,
      complainantResidentId: form.complainantResidentId || null,
      complainantColor:      colors[Math.floor(Math.random() * colors.length)],
      respondentName:        form.respondents[0]?.name  || '',
      respondentPurok:       form.respondents[0]?.purok || '',
      respondentResidentId:  form.respondents[0]?.residentId || null,
      respondents:           form.respondents.filter(r => r.name.trim()),
      evidenceNotes:         form.evidenceNotes,
    };

    const result = isEdit ? await update(incident.id, payload) : await create(payload);
    if (result.success) { onSuccess?.(); onClose(); }
    else setErrors({ submit: result.error });
  };

  // ── Severity badge colour ──
  const sevColor = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Urgent: '#7c3aed' };
  const actionColor = {
    'Barangay Mediation':    { bg: '#eff6ff', color: '#1d4ed8' },
    'Summon both parties':   { bg: '#fef9c3', color: '#a16207' },
    'Refer to PNP':          { bg: '#fef2f2', color: '#b91c1c' },
    'Issue Warning':         { bg: '#fff7ed', color: '#c2410c' },
    'Community Service Order':{ bg: '#f0fdf4', color: '#166534' },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(15,23,42,0.18)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#d97706" />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {isEdit ? 'Edit Incident Report' : 'New Incident Report'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  {isEdit ? 'Update the blotter record' : 'File a new blotter case'}
                </p>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose} disabled={loading}><X size={20} /></button>
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex' }}>
            {STEPS.map((s, i) => {
              const active = i === step;
              const done   = i < step;
              const Icon   = s.icon;
              return (
                <button key={s.id} onClick={() => done && setStep(i)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6, padding: '10px 8px', background: 'none', border: 'none',
                  cursor: done ? 'pointer' : 'default',
                  borderBottom: active ? '2.5px solid #3b82f6' : done ? '2.5px solid #10b981' : '2.5px solid #e2e8f0',
                  transition: 'all .2s',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? '#3b82f6' : done ? '#10b981' : '#e2e8f0',
                    color: active || done ? '#fff' : '#94a3b8',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#1e40af' : done ? '#065f46' : '#64748b' }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {errors.submit && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
              {errors.submit}
            </div>
          )}

          {/* ── STEP 0 — Incident Details ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Category" required error={errors.category}>
                  <select className={`form-select ${errors.category ? 'error' : ''}`} value={form.category}
                    onChange={e => set('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Incident Date" hint="Leave blank if unknown">
                  <input type="date" className="form-input" value={form.incidentDate}
                    onChange={e => set('incidentDate', e.target.value)} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                <Field label="Location" required error={errors.location}>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input className={`form-input ${errors.location ? 'error' : ''}`} value={form.location}
                      onChange={e => set('location', e.target.value)}
                      placeholder="e.g. Near basketball court, Purok 2"
                      style={{ paddingLeft: 36 }} />
                  </div>
                </Field>
                <Field label="Time of Incident">
                  <input type="time" className="form-input" value={form.incidentTime}
                    onChange={e => set('incidentTime', e.target.value)} />
                </Field>
              </div>

              {/* Narrative + AI button */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Narrative / Description <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAiClassify}
                    disabled={aiLoading || form.narrative.trim().length < 20}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 14px', borderRadius: 20, border: 'none',
                      background: aiLoading ? '#e0e7ff' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: aiLoading ? '#6366f1' : '#fff',
                      fontSize: 12, fontWeight: 600, cursor: form.narrative.trim().length < 20 ? 'not-allowed' : 'pointer',
                      opacity: form.narrative.trim().length < 20 ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {aiLoading
                      ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} />Analyzing...</>
                      : <><Wand2 size={13} />AI Classify</>
                    }
                  </button>
                </div>

                <textarea
                  className={`form-textarea ${errors.narrative ? 'error' : ''}`}
                  value={form.narrative}
                  onChange={e => { set('narrative', e.target.value); setAiResult(null); setAiApplied(false); setAiError(''); }}
                  placeholder="Describe what happened in detail — who was involved, what was said or done, and any other relevant information..."
                  rows={5}
                  style={{ resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  {errors.narrative
                    ? <span className="form-error">{errors.narrative}</span>
                    : <span style={{ fontSize: 12, color: '#94a3b8' }}>{form.narrative.length} chars (min 20)</span>
                  }
                  {form.narrative.trim().length < 20 && (
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Write more to enable AI Classify</span>
                  )}
                </div>
              </div>

              {/* AI error */}
              {aiError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                  {aiError}
                </div>
              )}

              {/* AI result card */}
              {aiResult && (
                <div style={{
                  background: 'linear-gradient(135deg, #faf5ff, #eff6ff)',
                  border: '1.5px solid #c4b5fd',
                  borderRadius: 14, padding: '16px 20px',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={14} color="#7c3aed" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#4c1d95' }}>AI Analysis</span>
                    <span style={{ fontSize: 11, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 20 }}>
                      Powered by Claude
                    </span>
                  </div>

                  {/* Results grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #e9d5ff' }}>
                      <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Category</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>{aiResult.category}</p>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #e9d5ff' }}>
                      <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Severity</p>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: sevColor[aiResult.severity] || '#374151' }}>
                        ● {aiResult.severity}
                      </p>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #e9d5ff' }}>
                      <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recommended</p>
                      <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: actionColor[aiResult.recommendedAction]?.color || '#374151' }}>
                        {aiResult.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 12, border: '1px solid #e9d5ff' }}>
                    <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Summary</p>
                    <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>{aiResult.summary}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0', fontStyle: 'italic' }}>{aiResult.reasoning}</p>
                  </div>

                  {/* Apply / Dismiss */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {aiApplied ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                        ✓ Applied to form
                      </div>
                    ) : (
                      <button type="button" onClick={applyAiResult} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', background: '#7c3aed', color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                      onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                        <Wand2 size={14} /> Apply to Form
                      </button>
                    )}
                    <button type="button" onClick={() => setAiResult(null)} style={{
                      padding: '8px 14px', background: 'none', border: '1px solid #c4b5fd',
                      borderRadius: 8, fontSize: 13, color: '#7c3aed', cursor: 'pointer',
                    }}>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {isEdit && (
                <Field label="Case Status">
                  <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="Open">Open</option>
                    <option value="Under Mediation">Under Mediation</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Referred to PNP">Referred to PNP</option>
                  </select>
                </Field>
              )}

              <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                <Scale size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#1e40af', margin: 0, lineHeight: 1.6 }}>
                  All cases are reviewed by the <strong>Lupon Tagapamayapa</strong>. A case number will be auto-assigned upon submission.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 1 — Parties ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Complainant */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={14} color="#16a34a" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Complainant</span>
                  <span style={{ fontSize: 12, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 999 }}>Person filing the complaint</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Full Name" required error={errors.complainantName}>
                    <input className={`form-input ${errors.complainantName ? 'error' : ''}`}
                      value={form.complainantName} onChange={e => set('complainantName', e.target.value)}
                      placeholder="Juan Dela Cruz" />
                  </Field>
                  <Field label="Purok" required error={errors.complainantPurok}>
                    <select className={`form-select ${errors.complainantPurok ? 'error' : ''}`}
                      value={form.complainantPurok} onChange={e => set('complainantPurok', e.target.value)}>
                      <option value="">Select purok</option>
                      {PUROKS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Contact Number" hint="Optional">
                    <input className="form-input" value={form.complainantContact}
                      onChange={e => set('complainantContact', e.target.value)} placeholder="09XX XXX XXXX" />
                  </Field>
                  <Field label="Resident ID" hint="If registered in system">
                    <input className="form-input" value={form.complainantResidentId}
                      onChange={e => set('complainantResidentId', e.target.value)} placeholder="Leave blank if unknown" />
                  </Field>
                </div>
              </div>

              {/* Respondents */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={14} color="#ea580c" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#9a3412' }}>Respondent(s)</span>
                    <span style={{ fontSize: 12, color: '#c2410c', background: '#ffedd5', padding: '2px 8px', borderRadius: 999 }}>Person(s) complained against</span>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={addRespondent} type="button">
                    <Plus size={13} /> Add Another
                  </button>
                </div>

                {form.respondents.map((r, i) => (
                  <div key={i} style={{ marginBottom: i < form.respondents.length - 1 ? 14 : 0 }}>
                    {i > 0 && <div style={{ height: 1, background: '#fed7aa', margin: '12px 0' }} />}
                    {form.respondents.length > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#9a3412' }}>Respondent {i + 1}</span>
                        <button className="btn-icon btn-icon-sm" onClick={() => removeRespondent(i)} style={{ color: '#ef4444' }} type="button">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Full Name" required={i === 0} error={i === 0 ? errors.respondent0name : ''}>
                        <input className={`form-input ${i === 0 && errors.respondent0name ? 'error' : ''}`}
                          value={r.name} onChange={e => setRespondent(i, 'name', e.target.value)} placeholder="Maria Santos" />
                      </Field>
                      <Field label="Purok">
                        <select className="form-select" value={r.purok} onChange={e => setRespondent(i, 'purok', e.target.value)}>
                          <option value="">Select purok (optional)</option>
                          {PUROKS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2 — Evidence ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="form-label">Photos / Videos <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ border: '2px dashed #cbd5e1', borderRadius: 14, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'all .2s' }}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; handleFiles({ target: { files: e.dataTransfer.files } }); }}
                >
                  <Camera size={28} color="#94a3b8" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Click to upload or drag & drop</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>JPG, PNG, MP4 · Max 10MB each</p>
                </div>
                <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFiles} />
              </div>

              {previews.length > 0 && (
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                    {previews.length} file{previews.length !== 1 ? 's' : ''} attached
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                    {previews.map((p, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0', aspectRatio: '1', background: '#f1f5f9' }}>
                        {p.type.startsWith('image/') ? (
                          <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                            <Camera size={20} color="#94a3b8" />
                            <span style={{ fontSize: 10, color: '#94a3b8' }}>Video</span>
                          </div>
                        )}
                        <button onClick={() => removeEvidence(i)} type="button"
                          style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Field label="Evidence Notes" hint="Describe the evidence or any additional context">
                <textarea className="form-textarea" value={form.evidenceNotes}
                  onChange={e => set('evidenceNotes', e.target.value)}
                  placeholder="e.g. CCTV footage available at corner store, witness present..."
                  rows={4} />
              </Field>

              {/* Summary */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Case Summary</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <div><span style={{ color: '#94a3b8' }}>Category:</span> <strong>{form.category || '—'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Severity:</span> <strong style={{ color: sevColor[form.severity] }}>{form.severity || 'Not set'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Location:</span> <strong>{form.location || '—'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Complainant:</span> <strong>{form.complainantName || '—'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Respondent(s):</span> <strong>{form.respondents.filter(r => r.name).map(r => r.name).join(', ') || '—'}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Evidence files:</span> <strong>{previews.length} attached</strong></div>
                  {aiApplied && aiResult?.recommendedAction && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#94a3b8' }}>AI Recommendation:</span>{' '}
                      <strong style={{ color: '#7c3aed' }}>{aiResult.recommendedAction}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', background: '#fafafa', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-md" onClick={step === 0 ? onClose : back} disabled={loading} type="button">
            {step === 0 ? 'Cancel' : <><ChevronLeft size={16} />Back</>}
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary btn-md" onClick={next} type="button">
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary btn-md" onClick={handleSubmit} disabled={loading} type="button">
              {loading
                ? <><Loader size={15} className="animate-spin" />Saving...</>
                : <><Save size={15} />{isEdit ? 'Update Report' : 'Submit Report'}</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentFormModal;