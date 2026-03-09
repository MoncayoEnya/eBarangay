// src/pages/Unauthorized.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const userRole = currentUser?.profile?.role || 'unknown';
  
  const roleNames = {
    chairman: 'Barangay Chairman',
    secretary: 'Barangay Secretary',
    treasurer: 'Barangay Treasurer',
    health_worker: 'Health Worker',
    kagawad: 'Kagawad',
    resident: 'Resident',
    unknown: 'User'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 2rem',
          background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldX size={50} color="white" />
        </div>
        
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '800',
          color: '#2d3748',
          marginBottom: '1rem'
        }}>
          Access Denied
        </h1>
        
        <p style={{
          fontSize: '1rem',
          color: '#718096',
          marginBottom: '0.5rem',
          lineHeight: '1.6'
        }}>
          Sorry, you don't have permission to access this page.
        </p>
        
        <p style={{
          fontSize: '0.875rem',
          color: '#a0aec0',
          marginBottom: '2rem'
        }}>
          Your current role: <strong>{roleNames[userRole]}</strong>
        </p>
        
        <div style={{
          padding: '1rem',
          background: '#fff5f5',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '1px solid #feb2b2'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#c53030',
            margin: 0
          }}>
            If you believe this is an error, please contact your Barangay Chairman or system administrator.
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#e2e8f0',
              color: '#2d3748',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#cbd5e0'}
            onMouseOut={(e) => e.target.style.background = '#e2e8f0'}
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
          >
            <Home size={20} />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;