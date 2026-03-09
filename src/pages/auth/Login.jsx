// src/pages/auth/Login.jsx - FIXED VERSION with Logo Image
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  Building2,
  Users,
  FileText,
  Shield,
  ArrowRight
} from 'lucide-react';
import '../../styles/Login.css';

// ✅ CORRECTED PATH: Go up two levels (../../) from pages/auth/ to src/
import logoImage from '../../assets/images/barangay_logo.jpg';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Configuration: Set to true to use images, false to use icons
  const USE_IMAGES = true;

  // Image paths - using imported logo
  const IMAGES = {
    logo: logoImage,
    residentManagement: null,
    documentProcessing: null,
    security: null
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  const handleBlur = (field) => {
    setTouched({
      ...touched,
      [field]: true
    });

    if (field === 'email' && formData.email && !validateEmail(formData.email)) {
      setFieldErrors({
        ...fieldErrors,
        email: 'Please enter a valid email address'
      });
    }

    if (field === 'password' && formData.password && formData.password.length < 6) {
      setFieldErrors({
        ...fieldErrors,
        password: 'Password must be at least 6 characters'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const errors = {};
    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (error.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="login-logo-container">
            <div className="login-logo">
              {USE_IMAGES && IMAGES.logo ? (
                <img src={IMAGES.logo} alt="Barangay Logo" />
              ) : (
                <Building2 size={64} strokeWidth={2} />
              )}
            </div>
          </div>
          
          <h1 className="login-branding-title">
            Barangay Management System
          </h1>

          <p className="login-branding-subtitle">
            Streamline your barangay operations with our comprehensive digital platform
          </p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">
                {USE_IMAGES && IMAGES.residentManagement ? (
                  <img src={IMAGES.residentManagement} alt="Resident Management" />
                ) : (
                  <Users size={24} />
                )}
              </div>
              <div className="login-feature-content">
                <h4>Resident Management</h4>
                <p>Organize and track resident data efficiently with advanced search and filtering</p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon">
                {USE_IMAGES && IMAGES.documentProcessing ? (
                  <img src={IMAGES.documentProcessing} alt="Document Processing" />
                ) : (
                  <FileText size={24} />
                )}
              </div>
              <div className="login-feature-content">
                <h4>Document Processing</h4>
                <p>Issue certificates and clearances digitally with automated workflows</p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon">
                {USE_IMAGES && IMAGES.security ? (
                  <img src={IMAGES.security} alt="Security" />
                ) : (
                  <Shield size={24} />
                )}
              </div>
              <div className="login-feature-content">
                <h4>Secure & Reliable</h4>
                <p>Enterprise-grade security with encrypted data storage and backup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          <div className="login-form-container">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access your dashboard</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="login-alert error">
                <AlertCircle className="login-alert-icon" size={20} />
                <p>{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="login-form" noValidate autoComplete="off">
              {/* Email Field */}
              <div className="login-form-group">
                <label htmlFor="email">Email Address</label>
                <div className="login-input-wrapper">
                  <Mail className="login-input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    required
                    placeholder="Enter your email"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    className={`login-input ${
                      touched.email && fieldErrors.email ? 'error' : ''
                    } ${
                      touched.email && !fieldErrors.email && formData.email ? 'success' : ''
                    }`}
                  />
                  {touched.email && !fieldErrors.email && formData.email && (
                    <CheckCircle2 className="login-input-success-icon" size={20} />
                  )}
                </div>
                {touched.email && fieldErrors.email && (
                  <div className="login-field-error">
                    <AlertCircle size={16} />
                    <span>{fieldErrors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="login-form-group">
                <label htmlFor="password">Password</label>
                <div className="login-input-wrapper">
                  <Lock className="login-input-icon" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    data-lpignore="true"
                    data-form-type="other"
                    className={`login-input ${
                      touched.password && fieldErrors.password ? 'error' : ''
                    } ${
                      touched.password && !fieldErrors.password && formData.password ? 'success' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-password-toggle"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {touched.password && !fieldErrors.password && formData.password && formData.password.length >= 6 && (
                    <CheckCircle2 className="login-input-success-icon password" size={20} />
                  )}
                </div>
                {touched.password && fieldErrors.password && (
                  <div className="login-field-error">
                    <AlertCircle size={16} />
                    <span>{fieldErrors.password}</span>
                  </div>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="login-options">
                <label className="login-remember">
                  <input
                    type="checkbox"
                    className="login-checkbox"
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="login-forgot-link">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="login-submit"
              >
                {loading ? (
                  <span className="login-submit-loading">
                    <div className="login-spinner" />
                    Signing in...
                  </span>
                ) : (
                  <span className="login-submit-content">
                    Sign In
                    <ArrowRight size={20} />
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="login-divider">
              <div className="login-divider-line" />
              <span>Or continue with</span>
              <div className="login-divider-line" />
            </div>

            {/* Social Login */}
            <div className="login-social">
              <button type="button" className="login-social-button">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                  <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                  <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1818182,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                  <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                </svg>
                <span>Google</span>
              </button>
              <button type="button" className="login-social-button">
                <svg width="20" height="20" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="login-signup-link">
              Don't have an account?{' '}
              <Link to="/signup">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}