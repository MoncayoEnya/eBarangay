// src/components/layout/common/StyledModal.jsx
// ─── Shared "premium" modal shell used by every page ────────────
import React from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * StyledModal
 * @param {boolean}        isOpen
 * @param {function}       onClose
 * @param {string}         title
 * @param {string}         subtitle
 * @param {ReactComponent} icon         — lucide icon
 * @param {string}         gradient     — CSS gradient for header
 * @param {number}         maxWidth     — default 560
 * @param {string}         errorMsg     — shows red error banner if set
 * @param {ReactNode}      footer       — replaces default footer
 * @param {boolean}        saving
 * @param {string}         saveLabel
 * @param {string}         saveIcon     — unused, pass icon as JSX in footer
 * @param {function}       onSave
 * @param {ReactNode}      children
 */
export default function StyledModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  gradient = 'linear-gradient(135deg,#1D4ED8 0%,#3B82F6 100%)',
  maxWidth = 560,
  errorMsg,
  footer,
  saving,
  saveLabel = 'Save',
  onSave,
  children,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ backdropFilter: 'blur(8px)', background: 'rgba(15,23,42,0.50)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 22,
          width: '100%',
          maxWidth,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(15,23,42,0.20), 0 0 0 1.5px rgba(240,244,248,1)',
          overflow: 'hidden',
          animation: 'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)',
        }}
      >
        {/* ── Gradient Header ── */}
        <div style={{
          background: gradient,
          padding: '20px 24px 18px',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* decorative circles */}
          <div style={{ position:'absolute', right:-24, top:-24, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.08)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', right:48, bottom:-30, width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.05)', pointerEvents:'none' }} />

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {Icon && (
                <div style={{ width:42, height:42, borderRadius:12, background:'rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={20} color="#fff" strokeWidth={2} />
                </div>
              )}
              <div>
                <h2 style={{ fontSize:17, fontWeight:800, color:'#fff', margin:0, letterSpacing:'-0.025em', lineHeight:1.2 }}>{title}</h2>
                {subtitle && <p style={{ fontSize:12.5, color:'rgba(255,255,255,0.72)', margin:'3px 0 0', fontWeight:400, lineHeight:1.4 }}>{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s', flexShrink:0 }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.15)'}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'22px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Error banner */}
          {errorMsg && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:11, fontSize:13, color:'#DC2626', fontWeight:500 }}>
              <AlertCircle size={15} style={{ flexShrink:0 }} />
              {errorMsg}
            </div>
          )}
          {children}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'14px 24px', borderTop:'1.5px solid #F0F4F8', display:'flex', alignItems:'center', justifyContent:'flex-end', background:'#FAFBFE', flexShrink:0, gap:10 }}>
          {footer || (
            <>
              <button className="btn btn-secondary btn-md" onClick={onClose} disabled={saving}>Cancel</button>
              {onSave && (
                <button className="btn btn-primary btn-md" onClick={onSave} disabled={saving}>
                  {saving ? 'Saving…' : saveLabel}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Inline form-group helper */
export function FG({ label, required, hint, children, half }) {
  return (
    <div className="form-group" style={{ marginBottom: 0, ...(half ? { flex:1, minWidth:0 } : {}) }}>
      <label className="form-label">
        {label}
        {required && <span style={{ color:'#EF4444', marginLeft:2 }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize:11.5, color:'#94A3B8', display:'block', marginTop:4, lineHeight:1.4 }}>{hint}</span>}
    </div>
  );
}

/** Two-column grid row */
export function Row({ children, gap = 14 }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap, alignItems:'start' }}>
      {children}
    </div>
  );
}
