// src/pages/auth/Signup.jsx - CORRECTED IMPORT PATH
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  AlertCircle, 
  Building2, 
  Users, 
  FileText, 
  Shield, 
  Phone, 
  CheckCircle2,
  ArrowRight,
  Check
} from 'lucide-react';
import '../../styles/Signup.css';

// ✅ CORRECTED PATH: Go up two levels (../../) from pages/auth/ to src/
import logoImage from '../../assets/images/barangay_logo.jpg';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
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

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthLabel = (strength) => {
    if (strength < 25) return { label: 'Weak', color: '#ef4444' };
    if (strength < 50) return { label: 'Fair', color: '#f59e0b' };
    if (strength < 75) return { label: 'Good', color: '#eab308' };
    return { label: 'Strong', color: '#22c55e' };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(\+63|0)?[0-9]{10}$/;
    return !phone || phoneRegex.test(phone.replace(/\s|-/g, ''));
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

    const errors = { ...fieldErrors };

    if (field === 'firstName' && !formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (field === 'lastName' && !formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (field === 'email') {
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    if (field === 'phone' && formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (field === 'password') {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }

    if (field === 'confirmPassword') {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const allTouched = {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true
    };
    setTouched(allTouched);

    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      setError('Please agree to the Terms & Conditions to continue.');
      return;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the errors in the form before continuing.');
      return;
    }

    setLoading(true);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      await signup(formData.email, formData.password, {
        name: fullName,
        phone: formData.phone,
        role: 'staff'
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Account created successfully! Please login to continue.',
            email: formData.email 
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
        setFieldErrors({ email: 'Email already in use' });
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
        setFieldErrors({ email: 'Invalid email format' });
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
        setFieldErrors({ password: 'Password is too weak' });
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Account creation is currently disabled. Please contact support.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        
        {/* Left Side - Branding */}
        <div className="signup-branding">
          <div className="signup-logo-container">
            <div className="signup-logo">
              {USE_IMAGES && IMAGES.logo ? (
                <img src={IMAGES.logo} alt="Barangay Logo" />
              ) : (
                <Building2 size={64} strokeWidth={2} />
              )}
            </div>
          </div>
          
          <h1 className="signup-branding-title">
            Barangay Management System
          </h1>

          <p className="signup-branding-subtitle">
            Streamline your barangay operations with our comprehensive digital platform
          </p>

          <div className="signup-features">
            <div className="signup-feature">
              <div className="signup-feature-icon">
                {USE_IMAGES && IMAGES.residentManagement ? (
                  <img src={IMAGES.residentManagement} alt="Resident Management" />
                ) : (
                  <Users size={24} />
                )}
              </div>
              <div className="signup-feature-content">
                <h4>Resident Management</h4>
                <p>Organize and track resident data efficiently with advanced search and filtering</p>
              </div>
            </div>

            <div className="signup-feature">
              <div className="signup-feature-icon">
                {USE_IMAGES && IMAGES.documentProcessing ? (
                  <img src={IMAGES.documentProcessing} alt="Document Processing" />
                ) : (
                  <FileText size={24} />
                )}
              </div>
              <div className="signup-feature-content">
                <h4>Document Processing</h4>
                <p>Issue certificates and clearances digitally with automated workflows</p>
              </div>
            </div>

            <div className="signup-feature">
              <div className="signup-feature-icon">
                {USE_IMAGES && IMAGES.security ? (
                  <img src={IMAGES.security} alt="Security" />
                ) : (
                  <Shield size={24} />
                )}
              </div>
              <div className="signup-feature-content">
                <h4>Secure & Reliable</h4>
                <p>Enterprise-grade security with encrypted data storage and backup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="signup-form-section">
          <div className="signup-form-container">
            <div className="signup-header">
              <h2>Create Account</h2>
              <p>Join our barangay management system</p>
            </div>

            {/* Success Alert */}
            {success && (
              <div className="signup-alert success">
                <CheckCircle2 className="signup-alert-icon" size={20} />
                <div className="signup-alert-content">
                  <p>Account created successfully!</p>
                  <p>Redirecting to login page...</p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && !success && (
              <div className="signup-alert error">
                <AlertCircle className="signup-alert-icon" size={20} />
                <p>{error}</p>
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="signup-form" noValidate autoComplete="off">
              {/* Name Fields */}
              <div className="signup-form-row">
                <div className="signup-form-group">
                  <label htmlFor="firstName">First Name</label>
                  <div className="signup-input-wrapper">
                    <User className="signup-input-icon" size={20} />
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('firstName')}
                      required
                      placeholder="First name"
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      className={`signup-input ${
                        touched.firstName && fieldErrors.firstName ? 'error' : ''
                      } ${
                        touched.firstName && !fieldErrors.firstName && formData.firstName ? 'success' : ''
                      }`}
                    />
                    {touched.firstName && !fieldErrors.firstName && formData.firstName && (
                      <CheckCircle2 className="signup-input-success-icon" size={20} />
                    )}
                  </div>
                  {touched.firstName && fieldErrors.firstName && (
                    <div className="signup-field-error">
                      <AlertCircle size={16} />
                      <span>{fieldErrors.firstName}</span>
                    </div>
                  )}
                </div>

                <div className="signup-form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <div className="signup-input-wrapper">
                    <User className="signup-input-icon" size={20} />
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={() => handleBlur('lastName')}
                      required
                      placeholder="Last name"
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      className={`signup-input ${
                        touched.lastName && fieldErrors.lastName ? 'error' : ''
                      } ${
                        touched.lastName && !fieldErrors.lastName && formData.lastName ? 'success' : ''
                      }`}
                    />
                    {touched.lastName && !fieldErrors.lastName && formData.lastName && (
                      <CheckCircle2 className="signup-input-success-icon" size={20} />
                    )}
                  </div>
                  {touched.lastName && fieldErrors.lastName && (
                    <div className="signup-field-error">
                      <AlertCircle size={16} />
                      <span>{fieldErrors.lastName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="signup-form-group">
                <label htmlFor="email">Email Address</label>
                <div className="signup-input-wrapper">
                  <Mail className="signup-input-icon" size={20} />
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
                    className={`signup-input ${
                      touched.email && fieldErrors.email ? 'error' : ''
                    } ${
                      touched.email && !fieldErrors.email && formData.email ? 'success' : ''
                    }`}
                  />
                  {touched.email && !fieldErrors.email && formData.email && (
                    <CheckCircle2 className="signup-input-success-icon" size={20} />
                  )}
                </div>
                {touched.email && fieldErrors.email && (
                  <div className="signup-field-error">
                    <AlertCircle size={16} />
                    <span>{fieldErrors.email}</span>
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div className="signup-form-group">
                <label htmlFor="phone">Phone Number (Optional)</label>
                <div className="signup-input-wrapper">
                  <Phone className="signup-input-icon" size={20} />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => handleBlur('phone')}
                    placeholder="+63 912 345 6789"
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    className={`signup-input ${
                      touched.phone && fieldErrors.phone ? 'error' : ''
                    } ${
                      touched.phone && !fieldErrors.phone && formData.phone ? 'success' : ''
                    }`}
                  />
                  {touched.phone && !fieldErrors.phone && formData.phone && (
                    <CheckCircle2 className="signup-input-success-icon" size={20} />
                  )}
                </div>
                {touched.phone && fieldErrors.phone && (
                  <div className="signup-field-error">
                    <AlertCircle size={16} />
                    <span>{fieldErrors.phone}</span>
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="signup-form-group">
                <label htmlFor="password">Password</label>
                <div className="signup-input-wrapper">
                  <Lock className="signup-input-icon" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    required
                    placeholder="Create a password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    className={`signup-input ${
                      touched.password && fieldErrors.password ? 'error' : ''
                    } ${
                      touched.password && !fieldErrors.password && formData.password && formData.password.length >= 6 ? 'success' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="signup-password-toggle"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {touched.password && !fieldErrors.password && formData.password && formData.password.length >= 6 && (
                    <CheckCircle2 className="signup-input-success-icon password" size={20} />
                  )}
                </div>
                {formData.password && !fieldErrors.password && (
                  <div className="signup-password-strength">
                    <div className="signup-password-strength-bar">
                      <div 
                        className="signup-password-strength-fill"
                        style={{ 
                          width: `${passwordStrength}%`,
                          backgroundColor: strengthInfo.color 
                        }}
                      />
                    </div>
                    <span 
                      className="signup-password-strength-label"
                      style={{ color: strengthInfo.color }}
                    >
                      {strengthInfo.label}
                    </span>
                  </div>
                )}
                {touched.password && fieldErrors.password && (
                  <div className="signup-field-error">
                    <AlertCircle size={16} />
                    <span>{fieldErrors.password}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="signup-form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="signup-input-wrapper">
                  <Lock className="signup-input-icon" size={20} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    required
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    className={`signup-input ${
                      touched.confirmPassword && fieldErrors.confirmPassword ? 'error' : ''
                    } ${
                      touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword ? 'success' : ''
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="signup-password-toggle"
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {touched.confirmPassword && !fieldErrors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <CheckCircle2 className="signup-input-success-icon password" size={20} />
                  )}
                </div>
                {touched.confirmPassword && fieldErrors.confirmPassword && (
                  <div className="signup-field-error">
                    <AlertCircle size={16} />
                    <span>{fieldErrors.confirmPassword}</span>
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <label className="signup-terms">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="signup-checkbox"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" className="signup-terms-link">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="signup-terms-link">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="signup-submit"
              >
                {loading ? (
                  <span className="signup-submit-loading">
                    <div className="signup-spinner" />
                    Creating account...
                  </span>
                ) : success ? (
                  <span className="signup-submit-content">
                    <Check size={20} />
                    Redirecting...
                  </span>
                ) : (
                  <span className="signup-submit-content">
                    Create Account
                    <ArrowRight size={20} />
                  </span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="signup-divider">
              <div className="signup-divider-line" />
              <span>Or sign up with</span>
              <div className="signup-divider-line" />
            </div>

            {/* Social Signup */}
            <div className="signup-social">
              <button type="button" className="signup-social-button">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
                  <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
                  <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5818182 23.1818182,9.90909091 L12,9.90909091 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
                  <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
                </svg>
                <span>Google</span>
              </button>
              <button type="button" className="signup-social-button">
                <svg width="20" height="20" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            {/* Login Link */}
            <div className="signup-login-link">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}