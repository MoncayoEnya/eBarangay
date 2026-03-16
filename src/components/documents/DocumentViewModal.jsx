// src/components/documents/DocumentViewModal.jsx
import React, { useEffect, useRef } from 'react';
import { X, Printer, Check, FileText, User, Calendar, Hash, AlertCircle, Download, QrCode, CreditCard, Clock } from 'lucide-react';

const Field = ({ label, value }) => (
  <div>
    <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: 14, color: value ? '#0f172a' : '#cbd5e1', fontWeight: value ? 500 : 400 }}>{value || '—'}</p>
  </div>
);

// Simple QR-like visual (real QR needs qrcode npm package)
const QRDisplay = ({ value }) => {
  const canvasRef = useRef();

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    // Draw a placeholder QR pattern — replace with qrcode.js in production
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const size   = 120;
    canvas.width = size; canvas.height = size;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);

    // Simple deterministic pattern from value string
    const hash = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const cell = 8;
    const cols = Math.floor(size / cell);
    ctx.fillStyle = '#0f172a';
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r * cols + c + hash) % 3 === 0 || (r + c) % 2 === 0) {
          ctx.fillRect(c * cell, r * cell, cell - 1, cell - 1);
        }
      }
    }
    // Corner markers
    [[0,0],[size-24,0],[0,size-24]].forEach(([x,y]) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, 24, 24);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x+3, y+3, 18, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x+6, y+6, 12, 12);
    });
  }, [value]);

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} style={{ border: '4px solid #f1f5f9', borderRadius: 8, display: 'block', margin: '0 auto' }} />
      <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, fontFamily: 'monospace' }}>{value?.slice(0, 20)}...</p>
      <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>Scan to verify authenticity</p>
    </div>
  );
};

const DocumentViewModal = ({ isOpen, onClose, document: doc, onPrint, onApprove, onDeny }) => {
  if (!isOpen || !doc) return null;

  const STATUS = {
    Approved:   { bg: '#d1fae5', color: '#065f46', icon: Check       },
    Denied:     { bg: '#fee2e2', color: '#991b1b', icon: AlertCircle  },
    Processing: { bg: '#dbeafe', color: '#1e40af', icon: Clock        },
    Released:   { bg: '#f3e8ff', color: '#6b21a8', icon: Check        },
    Pending:    { bg: '#fef3c7', color: '#92400e', icon: Clock        },
  };

  const st = STATUS[doc.status] || STATUS.Pending;
  const StatusIcon = st.icon;

  const formatDate = (ts) => {
    if (!ts) return '—';
    try { return ts.toDate ? ts.toDate().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'; }
    catch { return '—'; }
  };

  const qrValue = doc.document?.controlNumber
    ? `BRGYDOC:${doc.requestId}:${doc.document.controlNumber}:${doc.documentType}`
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 640,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(15,23,42,0.18)', overflow: 'hidden',
        }}
      >
        {/* Status banner */}
        <div style={{ background: st.bg, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusIcon size={15} color={st.color} />
            <span style={{ fontSize: 13, fontWeight: 700, color: st.color }}>{doc.status || 'Pending'}</span>
            <span style={{ fontSize: 12, color: st.color, opacity: .6 }}>· {doc.requestId || '—'}</span>
          </div>
          {doc.document?.controlNumber && (
            <span style={{ fontSize: 12, fontWeight: 600, color: st.color }}>
              CTRL: {doc.document.controlNumber}
            </span>
          )}
        </div>

        {/* Header */}
        <div style={{ padding: '18px 28px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="#3b82f6" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>{doc.documentType}</h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{doc.requester?.name || '—'}</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: qrValue ? '1fr auto' : '1fr', gap: 24 }}>

            {/* Left: details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Document Info */}
              <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <FileText size={14} color="#3b82f6" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Document Details</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Document Type"   value={doc.documentType} />
                  <Field label="Purpose"          value={doc.purpose} />
                  <Field label="Date Requested"   value={formatDate(doc.systemInfo?.requestDate)} />
                  <Field label="Control Number"   value={doc.document?.controlNumber} />
                  {doc.document?.validUntil && <Field label="Valid Until" value={formatDate(doc.document.validUntil)} />}
                  {doc.additionalDetails && <Field label="Notes" value={doc.additionalDetails} />}
                </div>
              </div>

              {/* Requester */}
              <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <User size={14} color="#3b82f6" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Requester</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Full Name"       value={doc.requester?.name} />
                  <Field label="Contact Number"  value={doc.requester?.contactNumber} />
                  <Field label="Address"         value={doc.requester?.address} />
                  <Field label="Resident ID"     value={doc.requester?.residentId} />
                </div>
              </div>

              {/* Payment */}
              <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <CreditCard size={14} color="#3b82f6" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Payment</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Method"       value={doc.payment?.method} />
                  <Field label="Amount"       value={doc.payment?.fee != null ? `₱${Number(doc.payment.fee).toFixed(2)}` : null} />
                  <Field label="Status"       value={doc.payment?.paid ? 'Paid' : 'Unpaid'} />
                  {doc.payment?.reference && <Field label="Reference" value={doc.payment.reference} />}
                </div>
              </div>

              {/* Timeline */}
              {doc.timeline?.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Timeline</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {doc.timeline.map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 5 }} />
                        <div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.status || t.action}</span>
                          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{formatDate(t.date || t.timestamp)}</span>
                          {t.note && <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{t.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: QR code */}
            {qrValue && (
              <div style={{ width: 160, flexShrink: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>QR Code</p>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <QRDisplay value={qrValue} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa', flexShrink: 0, gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-md" onClick={onClose}>Close</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {doc.status === 'Pending' && (
              <>
                {onDeny && (
                  <button className="btn btn-error btn-md" onClick={() => onDeny(doc)}>
                    <AlertCircle size={15} /> Deny
                  </button>
                )}
                {onApprove && (
                  <button className="btn btn-success btn-md" onClick={() => onApprove(doc)}>
                    <Check size={15} /> Approve
                  </button>
                )}
              </>
            )}
            {(doc.status === 'Approved' || doc.status === 'Released') && (
              <>
                <button className="btn btn-secondary btn-md" onClick={() => onPrint?.(doc)}>
                  <Printer size={15} /> Print
                </button>
                <button className="btn btn-primary btn-md" onClick={() => onPrint?.(doc)}>
                  <Download size={15} /> Download PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewModal;