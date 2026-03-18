// src/components/documents/DocumentFormModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Save, Loader, FileText, User, CreditCard,
  ChevronRight, ChevronLeft, CheckCircle, Wand2, Sparkles, Search, UserCheck, AlertTriangle,
} from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';
import { DOCUMENT_TYPES } from '../../services/documentsService';
import { searchResidents } from '../../services/residentsService';

const PAYMENT_METHODS = ['Cash', 'GCash', 'PayMaya', 'Online Banking', 'Free of Charge'];

const STEPS = [
  { id: 'requester', label: 'Requester', icon: User       },
  { id: 'document',  label: 'Document',  icon: FileText   },
  { id: 'payment',   label: 'Payment',   icon: CreditCard },
];

// All document type keys + names for the AI prompt
const DOC_TYPE_LIST = Object.entries(DOCUMENT_TYPES || {}).map(([key, val]) => ({
  key, name: val.name, fee: val.fee || 0,
}));

const Field = ({ label, required, error, hint, children }) => (
  <div className="form-group">
    <label className="form-label">
      {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </label>
    {children}
    {hint && !error && <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>{hint}</span>}
    {error && <span className="form-error">{error}</span>}
  </div>
);

// ── AI assistant helper ───────────────────────────────────────
const assistDocument = async (description) => {
  const docTypeNames = DOC_TYPE_LIST.map(d => d.name).join(', ');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: 'You are an assistant for a Philippine barangay document request system. You only respond with valid JSON, no markdown, no explanation.',
        },
        {
          role: 'user',
          content: `A barangay staff member described a resident's request in plain text. Extract the details and respond ONLY with valid JSON.

Description: "${description}"

Available document types: ${docTypeNames}

Respond with exactly this JSON:
{
  "requesterName": "full name of the resident if mentioned, otherwise empty string",
  "contactNumber": "phone number if mentioned, otherwise empty string",
  "requesterAddress": "address or purok if mentioned, otherwise empty string",
  "documentType": "the best matching document type from the available list, or empty string if unclear",
  "purpose": "the purpose of the request in 1 clear English sentence",
  "confidence": "high, medium, or low"
}`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text  = data.choices?.[0]?.message?.content || '';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

// ── Main Component ────────────────────────────────────────────
const DocumentFormModal = ({ isOpen, onClose, document: docProp = null, onSuccess }) => {
  const { create, update, loading } = useDocuments();
  const isEdit = !!docProp;

  const [step, setStep]     = useState(0);
  const [errors, setErrors] = useState({});

  // AI state
  const [aiInput,   setAiInput]   = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState(null);
  const [aiError,   setAiError]   = useState('');
  const [aiApplied, setAiApplied] = useState(false);

  // Resident verification state
  const [verifying,      setVerifying]      = useState(false);
  const [verifiedResident, setVerifiedResident] = useState(null); // resident data if found
  const [verifyStatus,   setVerifyStatus]   = useState(null); // 'found' | 'not_found' | null

  const empty = {
    requesterName: '', contactNumber: '', requesterAddress: '',
    residentId: '', documentTypeId: '', purpose: '',
    additionalDetails: '', paymentMethod: 'Cash', paymentReference: '',
  };

  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (isOpen) {
      if (docProp) {
        const matchedKey = Object.keys(DOCUMENT_TYPES || {}).find(
          k => DOCUMENT_TYPES[k].name === docProp.documentType
        ) || '';
        setForm({
          requesterName:     docProp.requester?.name || '',
          contactNumber:     docProp.requester?.contactNumber || '',
          requesterAddress:  docProp.requester?.address || '',
          residentId:        docProp.requester?.residentId || '',
          documentTypeId:    matchedKey,
          purpose:           docProp.purpose || '',
          additionalDetails: docProp.additionalDetails || '',
          paymentMethod:     docProp.payment?.method || 'Cash',
          paymentReference:  docProp.payment?.reference || '',
        });
      } else {
        setForm(empty);
      }
      setStep(0);
      setErrors({});
      setAiInput('');
      setAiResult(null);
      setAiError('');
      setAiApplied(false);
      setVerifiedResident(null);
      setVerifyStatus(null);
    }
  }, [isOpen, docProp]);

  // NOTE: early return moved to AFTER all hooks — Rules of Hooks requirement
  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const selectedDocType = DOC_TYPE_LIST.find(d => d.key === form.documentTypeId);
  const fee    = selectedDocType?.fee || 0;
  const isFree = form.paymentMethod === 'Free of Charge' || fee === 0;

  // ── AI assist ──
  const handleAiAssist = async () => {
    if (aiInput.trim().length < 5) return;
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    setAiApplied(false);
    try {
      const result = await assistDocument(aiInput);
      setAiResult(result);
    } catch (e) {
      setAiError('AI assistant failed. Please fill the form manually.');
      console.error('AI error:', e);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    const matchedType = DOC_TYPE_LIST.find(
      d => d.name.toLowerCase() === aiResult.documentType?.toLowerCase()
    );
    setForm(p => ({
      ...p,
      requesterName:    aiResult.requesterName    || p.requesterName,
      contactNumber:    aiResult.contactNumber    || p.contactNumber,
      requesterAddress: aiResult.requesterAddress || p.requesterAddress,
      documentTypeId:   matchedType?.key          || p.documentTypeId,
      purpose:          aiResult.purpose          || p.purpose,
    }));
    setAiApplied(true);
    setErrors({});
  };

  // Auto-verify resident against database
  const verifyResident = useCallback(async () => {
    const name = form.requesterName.trim();
    if (name.length < 2) return;
    setVerifying(true);
    setVerifyStatus(null);
    setVerifiedResident(null);
    try {
      const result = await searchResidents(name);
      if (result.success && result.data?.length > 0) {
        // Find closest match by name
        const found = result.data.find(r =>
          (r.firstName + ' ' + r.lastName).toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes((r.firstName || '').toLowerCase())
        ) || result.data[0];
        setVerifiedResident(found);
        setVerifyStatus('found');
        // Auto-fill address and contact if empty
        setForm(p => ({
          ...p,
          residentId:       found.id || p.residentId,
          requesterAddress: p.requesterAddress || [found.address?.houseNumber, found.address?.street, found.address?.sitio].filter(Boolean).join(', '),
          contactNumber:    p.contactNumber    || found.contactNumber || '',
        }));
      } else {
        setVerifyStatus('not_found');
      }
    } catch (_) {
      setVerifyStatus('not_found');
    }
    setVerifying(false);
  }, [form.requesterName]);

  // ── Validation ──
  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.requesterName.trim()) e.requesterName = 'Name is required';
      if (!form.contactNumber.trim()) {
        e.contactNumber = 'Contact number is required';
      } else if (!/^(09|\+639)\d{9}$/.test(form.contactNumber.replace(/\s|-/g, ''))) {
        e.contactNumber = 'Invalid format — use 09XX XXX XXXX';
      }
    }
    if (s === 1) {
      if (!form.documentTypeId) e.documentTypeId = 'Document type is required';
      if (!form.purpose.trim())  e.purpose        = 'Purpose is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    const payload = {
      documentTypeId:    form.documentTypeId,
      requesterName:     form.requesterName,
      contactNumber:     form.contactNumber,
      requesterAddress:  form.requesterAddress,
      residentId:        form.residentId || null,
      purpose:           form.purpose,
      additionalDetails: form.additionalDetails,
      paymentMethod:     form.paymentMethod,
      paymentReference:  form.paymentReference,
      fee,
    };
    const result = isEdit ? await update(docProp.id, payload) : await create(payload);
    if (result.success) { onSuccess?.(); onClose(); }
    else setErrors({ submit: result.error });
  };

  // Confidence badge colour
  const confColor = { high: '#16a34a', medium: '#d97706', low: '#dc2626' };

  // Early return AFTER all hooks — safe per Rules of Hooks
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(15,23,42,0.18)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={20} color="#3b82f6" />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {isEdit ? 'Edit Document Request' : 'New Document Request'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Issue a barangay document</p>
              </div>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex' }}>
            {STEPS.map((s, i) => {
              const active = i === step;
              const done   = i < step;
              return (
                <button key={s.id} onClick={() => done && setStep(i)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 8px', background: 'none', border: 'none',
                  cursor: done ? 'pointer' : 'default',
                  borderBottom: active ? '2.5px solid #3b82f6' : done ? '2.5px solid #10b981' : '2.5px solid #e2e8f0',
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

          {/* ── STEP 0 — Requester + AI Assistant ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* AI Assistant Box */}
              <div style={{
                background: 'linear-gradient(135deg, #faf5ff, #eff6ff)',
                border: '1.5px solid #c4b5fd',
                borderRadius: 14, padding: '16px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={13} color="#7c3aed" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4c1d95' }}>AI Document Assistant</span>
                  <span style={{ fontSize: 11, color: '#7c3aed', background: '#ede9fe', padding: '2px 8px', borderRadius: 20 }}>
                    Powered by Groq
                  </span>
                </div>

                <p style={{ fontSize: 12, color: '#6d28d9', margin: '0 0 10px', lineHeight: 1.5 }}>
                  Describe the request in plain Filipino or English — AI will fill the form for you.
                </p>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={aiInput}
                    onChange={e => { setAiInput(e.target.value); setAiResult(null); setAiApplied(false); setAiError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleAiAssist()}
                    placeholder='e.g. "Si Maria Reyes, gusto ng clearance para sa trabaho, 09171234567"'
                    style={{
                      flex: 1, padding: '9px 14px', borderRadius: 10,
                      border: '1.5px solid #c4b5fd', background: '#fff',
                      fontSize: 13, color: '#0f172a', outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={aiLoading || aiInput.trim().length < 5}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '9px 16px', borderRadius: 10, border: 'none',
                      background: aiLoading ? '#e0e7ff' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: aiLoading ? '#6366f1' : '#fff',
                      fontSize: 13, fontWeight: 600,
                      cursor: aiInput.trim().length < 5 ? 'not-allowed' : 'pointer',
                      opacity: aiInput.trim().length < 5 ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {aiLoading
                      ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} />Thinking...</>
                      : <><Wand2 size={13} />Fill Form</>
                    }
                  </button>
                </div>

                {/* AI error */}
                {aiError && (
                  <p style={{ fontSize: 12, color: '#dc2626', margin: '8px 0 0' }}>{aiError}</p>
                )}

                {/* AI result */}
                {aiResult && (
                  <div style={{ marginTop: 12, background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #e9d5ff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#4c1d95' }}>AI found these details:</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: confColor[aiResult.confidence] || '#64748b' }}>
                        {aiResult.confidence?.toUpperCase()} confidence
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, marginBottom: 12 }}>
                      {aiResult.requesterName && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ color: '#7c3aed', fontWeight: 600, minWidth: 100 }}>Name:</span>
                          <span style={{ color: '#0f172a' }}>{aiResult.requesterName}</span>
                        </div>
                      )}
                      {aiResult.contactNumber && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ color: '#7c3aed', fontWeight: 600, minWidth: 100 }}>Contact:</span>
                          <span style={{ color: '#0f172a' }}>{aiResult.contactNumber}</span>
                        </div>
                      )}
                      {aiResult.requesterAddress && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ color: '#7c3aed', fontWeight: 600, minWidth: 100 }}>Address:</span>
                          <span style={{ color: '#0f172a' }}>{aiResult.requesterAddress}</span>
                        </div>
                      )}
                      {aiResult.documentType && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ color: '#7c3aed', fontWeight: 600, minWidth: 100 }}>Document:</span>
                          <span style={{ color: '#0f172a' }}>{aiResult.documentType}</span>
                        </div>
                      )}
                      {aiResult.purpose && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ color: '#7c3aed', fontWeight: 600, minWidth: 100 }}>Purpose:</span>
                          <span style={{ color: '#0f172a' }}>{aiResult.purpose}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {aiApplied ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                          ✓ Applied to form
                        </div>
                      ) : (
                        <button type="button" onClick={applyAiResult} style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '7px 16px', background: '#7c3aed', color: '#fff',
                          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
                        onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}>
                          <Wand2 size={13} /> Apply to Form
                        </button>
                      )}
                      <button type="button" onClick={() => { setAiResult(null); setAiApplied(false); }} style={{
                        padding: '7px 12px', background: 'none', border: '1px solid #c4b5fd',
                        borderRadius: 8, fontSize: 13, color: '#7c3aed', cursor: 'pointer',
                      }}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual fields */}
              <Field label="Full Name" required error={errors.requesterName}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className={`form-input ${errors.requesterName ? 'error' : ''}`}
                    value={form.requesterName} onChange={e => { set('requesterName', e.target.value); setVerifyStatus(null); setVerifiedResident(null); }}
                    placeholder="Juan Dela Cruz" style={{ flex: 1 }} />
                  <button type="button" onClick={verifyResident} disabled={verifying || form.requesterName.trim().length < 2}
                    title="Verify against resident database"
                    style={{ padding: '0 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: verifyStatus === 'found' ? '#f0fdf4' : verifyStatus === 'not_found' ? '#fff7ed' : '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: verifyStatus === 'found' ? '#16a34a' : verifyStatus === 'not_found' ? '#d97706' : '#64748b', whiteSpace: 'nowrap' }}>
                    {verifying ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : verifyStatus === 'found' ? <UserCheck size={14} /> : <Search size={14} />}
                    {verifying ? 'Checking…' : verifyStatus === 'found' ? 'Verified' : verifyStatus === 'not_found' ? 'Not found' : 'Verify'}
                  </button>
                </div>
                {/* Verification result banner */}
                {verifyStatus === 'found' && verifiedResident && (
                  <div style={{ marginTop: 8, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <UserCheck size={14} color="#16a34a" />
                      <span style={{ fontWeight: 600, color: '#166534' }}>Resident found in database</span>
                    </div>
                    <div style={{ color: '#374151', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span><strong>Status:</strong> {verifiedResident.status || 'Active'}</span>
                      {verifiedResident.address?.sitio && <span><strong>Purok/Sitio:</strong> {verifiedResident.address.sitio}</span>}
                      {verifiedResident.voterStatus && <span><strong>Voter:</strong> {verifiedResident.voterStatus}</span>}
                    </div>
                  </div>
                )}
                {verifyStatus === 'not_found' && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, fontSize: 12, color: '#c2410c', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={13} />
                    Name not found in resident database. You may still proceed.
                  </div>
                )}
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Contact Number" required error={errors.contactNumber}>
                  <input className={`form-input ${errors.contactNumber ? 'error' : ''}`}
                    value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)}
                    placeholder="09XX XXX XXXX" />
                </Field>
                <Field label="Resident ID" hint="Auto-filled if verified">
                  <input className="form-input" value={form.residentId}
                    onChange={e => set('residentId', e.target.value)}
                    placeholder="Leave blank if unknown" readOnly={!!verifiedResident}
                    style={{ background: verifiedResident ? '#f0fdf4' : undefined }} />
                </Field>
              </div>
              <Field label="Address" hint="Street / Purok / Barangay">
                <input className="form-input" value={form.requesterAddress}
                  onChange={e => set('requesterAddress', e.target.value)}
                  placeholder="e.g. Purok 3, Brgy. San Isidro" />
              </Field>
            </div>
          )}

          {/* ── STEP 1 — Document ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Document Type" required error={errors.documentTypeId}>
                <select className={`form-select ${errors.documentTypeId ? 'error' : ''}`}
                  value={form.documentTypeId} onChange={e => set('documentTypeId', e.target.value)}>
                  <option value="">— Select document type —</option>
                  {DOC_TYPE_LIST.map(d => (
                    <option key={d.key} value={d.key}>
                      {d.name}{d.fee > 0 ? ` (₱${d.fee})` : ' (Free)'}
                    </option>
                  ))}
                </select>
              </Field>

              {selectedDocType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <FileText size={16} color="#3b82f6" />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#1e40af' }}>{selectedDocType.name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#3b82f6' }}>
                      Fee: {fee > 0 ? `₱${fee.toFixed(2)}` : 'Free'}
                    </p>
                  </div>
                </div>
              )}

              <Field label="Purpose" required error={errors.purpose}>
                <input className={`form-input ${errors.purpose ? 'error' : ''}`}
                  value={form.purpose} onChange={e => set('purpose', e.target.value)}
                  placeholder="e.g. Employment, Loan Application, School Requirement" />
              </Field>

              <Field label="Additional Details / Notes" hint="Optional">
                <textarea className="form-textarea" rows={3} value={form.additionalDetails}
                  onChange={e => set('additionalDetails', e.target.value)}
                  placeholder="Any special instructions or details to include on the document..." />
              </Field>
            </div>
          )}

          {/* ── STEP 2 — Payment ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 12px' }}>Order Summary</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #e2e8f0', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, color: '#374151' }}>{selectedDocType?.name || 'Document'}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>₱{fee.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Total Due</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: fee > 0 ? '#1e40af' : '#065f46' }}>
                    {fee > 0 ? `₱${fee.toFixed(2)}` : 'FREE'}
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label">Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {PAYMENT_METHODS.map(m => (
                    <button key={m} onClick={() => set('paymentMethod', m)} type="button" style={{
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      border: form.paymentMethod === m ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                      background: form.paymentMethod === m ? '#eff6ff' : '#fff',
                      color: form.paymentMethod === m ? '#1e40af' : '#374151',
                      fontWeight: form.paymentMethod === m ? 600 : 400,
                      fontSize: 13, textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {form.paymentMethod === m && <CheckCircle size={14} color="#3b82f6" />}
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {!isFree && form.paymentMethod !== 'Cash' && (
                <Field label="Reference / Transaction Number" hint="For GCash/PayMaya/Online Banking payments">
                  <input className="form-input" value={form.paymentReference}
                    onChange={e => set('paymentReference', e.target.value)}
                    placeholder="e.g. GC-123456789" />
                </Field>
              )}

              <div style={{ padding: '14px 18px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', margin: '0 0 8px' }}>Request Summary</p>
                <div style={{ fontSize: 13, color: '#374151', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span><strong>Requester:</strong> {form.requesterName}</span>
                  <span><strong>Document:</strong> {selectedDocType?.name || '—'}</span>
                  <span><strong>Purpose:</strong> {form.purpose}</span>
                  <span><strong>Payment:</strong> {form.paymentMethod}{form.paymentReference ? ` (Ref: ${form.paymentReference})` : ''}</span>
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
                ? <><Loader size={15} className="animate-spin" />Submitting...</>
                : <><Save size={15} />{isEdit ? 'Update Request' : 'Submit Request'}</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentFormModal;