// src/pages/auth/Signup.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail, Lock, Eye, EyeOff, User, Phone,
  AlertCircle, CheckCircle2, ArrowRight, Loader, Check
} from 'lucide-react';
import logoImage from '../../assets/images/barangay_logo.jpg';
import bgImage from '../../assets/images/barangay_bg.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND IMAGE — same as Login.jsx

// ─────────────────────────────────────────────────────────────────────────────


const ROLES = [
  { value: 'staff',         label: 'Staff / Secretary'  },
  { value: 'treasurer',     label: 'Treasurer'          },
  { value: 'kagawad',       label: 'Kagawad'            },
  { value: 'health_worker', label: 'Health Worker'      },
  { value: 'admin',         label: 'Administrator'      },
];

const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw))   s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return [
    { label: '',       color: '#e2e8f0', pct: 0   },
    { label: 'Weak',   color: '#ef4444', pct: 25  },
    { label: 'Fair',   color: '#f59e0b', pct: 50  },
    { label: 'Good',   color: '#3b82f6', pct: 75  },
    { label: 'Strong', color: '#10b981', pct: 100 },
  ][Math.min(s, 4)];
};

export default function Signup() {
  const navigate   = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '', role: 'staff',
  });
  const [showPw, setShowPw]       = useState(false);
  const [showCPw, setShowCPw]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [errors, setErrors]       = useState({});
  const [agreed, setAgreed]       = useState(false);

  const pw = getStrength(form.password);

  const set = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setError('');
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim())  e.firstName       = 'First name is required';
    if (!form.lastName.trim())   e.lastName        = 'Last name is required';
    if (!form.email)             e.email           = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.phone && !/^(\+63|0)?[0-9]{10}$/.test(form.phone.replace(/\s|-/g, '')))
                                 e.phone           = 'Enter a valid Philippine phone number';
    if (!form.password)          e.password        = 'Password is required';
    else if (form.password.length < 6)  e.password = 'At least 6 characters required';
    if (!form.confirmPassword)   e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) { setError('You must agree to the Terms & Conditions to continue.'); return; }
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await signup(form.email, form.password, {
        name:  `${form.firstName.trim()} ${form.lastName.trim()}`,
        phone: form.phone,
        role:  form.role,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login', { state: { message: 'Account created successfully. Please sign in.' } }), 2000);
    } catch (err) {
      const map = {
        'auth/email-already-in-use':   'This email is already registered. Please sign in instead.',
        'auth/invalid-email':          'Invalid email address format.',
        'auth/weak-password':          'Password is too weak. Please choose a stronger password.',
        'auth/operation-not-allowed':  'Account creation is currently disabled. Contact the administrator.',
      };
      setError(map[err.code] || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (field) => ({
    width: '100%',
    padding: '11px 13px 11px 40px',
    border: `1.5px solid ${errors[field] ? '#fca5a5' : '#e2e8f0'}`,
    borderRadius: 10, fontSize: 14, color: '#0f172a',
    background: errors[field] ? '#fff5f5' : '#fff',
    boxSizing: 'border-box', outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
  });

  const iconSt = {
    position: 'absolute', left: 13, top: '50%',
    transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
  };

  const onFocus = (e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; };
  const onBlur  = (field) => (e) => { e.target.style.borderColor = errors[field] ? '#fca5a5' : '#e2e8f0'; e.target.style.boxShadow = 'none'; };

  const FieldError = ({ field }) => errors[field]
    ? <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{errors[field]}</p>
    : null;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative', overflow: 'hidden', padding: '1.5rem',
    }}>

      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundColor: bgImage ? 'transparent' : '#0f172a',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: bgImage ? 'blur(6px)' : 'none',
        transform: 'scale(1.05)',
      }} />

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: bgImage
          ? 'rgba(10, 20, 40, 0.60)'
          : 'linear-gradient(145deg, rgba(30,64,175,0.9) 0%, rgba(15,23,42,0.95) 100%)',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 520,
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
        overflow: 'hidden',
      }}>

        {/* Accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #6366f1)' }} />

        <div style={{ padding: '2.5rem 2.5rem 2rem' }}>

          {/* Logo + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, overflow: 'hidden', background: '#eff6ff', flexShrink: 0, border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logoImage} alt="Barangay Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', margin: 0, textTransform: 'uppercase', letterSpacing: '.1em' }}>e-Barangay</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Management System</p>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Create your account</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Fill in your details to get started</p>
          </div>

          {/* Success */}
          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, marginBottom: 20 }}>
              <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#166534', margin: 0 }}>Account created successfully</p>
                <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>Redirecting to sign in...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, marginBottom: 18 }}>
              <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* First + Last name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[['firstName', 'First Name', 'Juan'], ['lastName', 'Last Name', 'Dela Cruz']].map(([field, label, ph]) => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    {label} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={iconSt} />
                    <input type="text" name={field} value={form[field]} onChange={set}
                      placeholder={ph} style={fieldStyle(field)}
                      onFocus={onFocus} onBlur={onBlur(field)} />
                  </div>
                  <FieldError field={field} />
                </div>
              ))}
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={iconSt} />
                <input type="email" name="email" value={form.email} onChange={set}
                  placeholder="yourname@email.com" style={fieldStyle('email')}
                  onFocus={onFocus} onBlur={onBlur('email')} />
              </div>
              <FieldError field="email" />
            </div>

            {/* Phone + Role */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Phone Number <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={iconSt} />
                  <input type="tel" name="phone" value={form.phone} onChange={set}
                    placeholder="09XX XXX XXXX" style={fieldStyle('phone')}
                    onFocus={onFocus} onBlur={onBlur('phone')} />
                </div>
                <FieldError field="phone" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Role <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select name="role" value={form.role} onChange={set}
                  style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, color: '#0f172a', background: '#fff', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={iconSt} />
                <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={set}
                  placeholder="Create a strong password"
                  style={{ ...fieldStyle('password'), paddingRight: 42 }}
                  onFocus={onFocus} onBlur={onBlur('password')} />
                <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1, height: 3, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pw.pct}%`, background: pw.color, borderRadius: 2, transition: 'width .3s, background .3s' }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: pw.color, minWidth: 38, textAlign: 'right' }}>{pw.label}</span>
                </div>
              )}
              <FieldError field="password" />
            </div>

            {/* Confirm password */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Confirm Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={iconSt} />
                <input type={showCPw ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={set}
                  placeholder="Re-enter your password"
                  style={{ ...fieldStyle('confirmPassword'), paddingRight: 42 }}
                  onFocus={onFocus} onBlur={onBlur('confirmPassword')} />
                <button type="button" onClick={() => setShowCPw(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4 }}>
                  {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <CheckCircle2 size={15} color="#10b981" style={{ position: 'absolute', right: 38, top: '50%', transform: 'translateY(-50%)' }} />
                )}
              </div>
              <FieldError field="confirmPassword" />
            </div>

            {/* Terms */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 22, cursor: 'pointer' }}
              onClick={() => setAgreed(p => !p)}>
              <div style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                border: `2px solid ${agreed ? '#1d4ed8' : '#cbd5e1'}`,
                background: agreed ? '#1d4ed8' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s',
              }}>
                {agreed && <Check size={11} color="#fff" strokeWidth={3} />}
              </div>
              <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, userSelect: 'none' }}>
                I agree to the{' '}
                <Link to="/terms" onClick={e => e.stopPropagation()} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Terms & Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" onClick={e => e.stopPropagation()} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>Privacy Policy</Link>
              </span>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading || success}
              style={{
                width: '100%', padding: '13px', borderRadius: 11, border: 'none',
                background: loading || success ? '#93c5fd' : '#1d4ed8',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: loading || success ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading || success ? 'none' : '0 4px 14px rgba(29,78,216,0.4)',
                transition: 'background .15s, transform .1s',
              }}
              onMouseEnter={e => { if (!loading && !success) { e.currentTarget.style.background = '#1e40af'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
              onMouseLeave={e => { if (!loading && !success) { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(0)'; }}}
            >
              {loading  ? <><Loader size={17} style={{ animation: 'spin 1s linear infinite' }} />Creating account...</>
             : success  ? <><Check size={17} />Redirecting...</>
             :             <>Create Account <ArrowRight size={17} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 2.5rem', borderTop: '1px solid #f1f5f9', background: '#fafafa', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
            Barangay Management System &mdash; {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}