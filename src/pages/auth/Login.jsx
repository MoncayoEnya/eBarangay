// src/pages/auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import logoImage from '../../assets/images/barangay_logo.jpg';

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND IMAGE — drop any photo into src/assets/images/ and update this:
// import bgImage from '../../assets/images/barangay_bg.jpg';
// Then replace   `backgroundImage: 'none'`  with  `backgroundImage: \`url(\${bgImage})\``
// For now it uses a solid dark fallback so the app doesn't break without a photo.
// ─────────────────────────────────────────────────────────────────────────────
import bgImage from '../../assets/images/barangay_bg.jpg';


export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const [form, setForm]           = useState({ email: '', password: '' });
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [errors, setErrors]       = useState({});

  const successMsg = location.state?.message || '';

  const set = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setError('');
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email)                                           e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email    = 'Enter a valid email address';
    if (!form.password)                                        e.password = 'Password is required';
    else if (form.password.length < 6)                        e.password = 'At least 6 characters required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const map = {
        'auth/user-not-found':     'No account found with this email address.',
        'auth/wrong-password':     'Incorrect password. Please try again.',
        'auth/invalid-email':      'Invalid email address format.',
        'auth/user-disabled':      'This account has been disabled. Contact your administrator.',
        'auth/too-many-requests':  'Too many failed attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      };
      setError(map[err.code] || 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Background ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundColor: bgImage ? 'transparent' : '#0f172a',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: bgImage ? 'blur(6px)' : 'none',
        transform: 'scale(1.05)', // prevents blur edge bleed
      }} />

      {/* ── Dark overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: bgImage
          ? 'rgba(10, 20, 40, 0.60)'
          : 'linear-gradient(145deg, rgba(30,64,175,0.9) 0%, rgba(15,23,42,0.95) 100%)',
      }} />

      {/* ── Card ── */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: 460,
        margin: '1.5rem',
        background: 'rgba(255, 255, 255, 0.97)',
        borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
        overflow: 'hidden',
      }}>

        {/* Top accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #6366f1)' }} />

        <div style={{ padding: '2.5rem 2.5rem 2rem' }}>

          {/* Logo + system name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '2rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, overflow: 'hidden',
              background: '#eff6ff', flexShrink: 0,
              border: '1px solid #dbeafe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={logoImage} alt="Barangay Logo"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', margin: 0, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                e-Barangay
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Management System
              </p>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              Sign in to access your dashboard
            </p>
          </div>

          {/* Success message */}
          {successMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', marginBottom: 18,
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>{successMsg}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', marginBottom: 18,
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            }}>
              <AlertCircle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type="email" name="email" value={form.email} onChange={set}
                  placeholder="yourname@email.com"
                  style={{
                    width: '100%', padding: '11px 13px 11px 40px',
                    border: `1.5px solid ${errors.email ? '#fca5a5' : '#e2e8f0'}`,
                    borderRadius: 10, fontSize: 14, color: '#0f172a',
                    background: errors.email ? '#fff5f5' : '#fff',
                    boxSizing: 'border-box', outline: 'none',
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = errors.email ? '#fca5a5' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={11} />{errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input
                  type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={set}
                  placeholder="Enter your password"
                  style={{
                    width: '100%', padding: '11px 42px 11px 40px',
                    border: `1.5px solid ${errors.password ? '#fca5a5' : '#e2e8f0'}`,
                    borderRadius: 10, fontSize: 14, color: '#0f172a',
                    background: errors.password ? '#fff5f5' : '#fff',
                    boxSizing: 'border-box', outline: 'none',
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = errors.password ? '#fca5a5' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 4 }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ fontSize: 12, color: '#dc2626', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={11} />{errors.password}
                </p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#475569', userSelect: 'none' }}>
                <input type="checkbox" style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#3b82f6' }} />
                Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 11, border: 'none',
                background: loading ? '#93c5fd' : '#1d4ed8',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(29,78,216,0.4)',
                transition: 'background .15s, transform .1s, box-shadow .15s',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#1e40af'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(0)'; }}}
            >
              {loading
                ? <><Loader size={17} style={{ animation: 'spin 1s linear infinite' }} />Signing in...</>
                : <>Sign In <ArrowRight size={17} /></>}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 18px' }}>
            <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>Don't have an account?</span>
            <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
          </div>

          <Link to="/signup" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '12px', borderRadius: 11,
            border: '1.5px solid #e2e8f0', background: '#fff',
            color: '#374151', fontSize: 14, fontWeight: 600,
            textDecoration: 'none', boxSizing: 'border-box',
            transition: 'border-color .15s, background .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
          >
            Create a new account
          </Link>

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
        input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}