// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, HelpCircle } from 'lucide-react';
import { sidebarNav } from '../../data/sidebarNav.js';
import { useAuth } from '../../hooks/useAuth';
import logoImage from '../../assets/images/barangay_logo.jpg';
import '../../styles/Sidebar.css';

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const { currentUser } = useAuth();

  const userName = currentUser?.profile?.name || currentUser?.name || 'Barangay Staff';
  const userRole = currentUser?.profile?.role || currentUser?.role || 'staff';
  const userInitial = userName.charAt(0).toUpperCase();

  const roleLabel = {
    admin:         'Administrator',
    staff:         'Staff',
    treasurer:     'Treasurer',
    kagawad:       'Kagawad',
    health_worker: 'Health Worker',
  }[userRole] || 'Staff';

  // Group nav items into sections
  const sections = [
    {
      label: 'Main',
      items: sidebarNav.filter(n => ['/', '/dashboard', '/residents', '/documents'].includes(n.path)),
    },
    {
      label: 'Services',
      items: sidebarNav.filter(n => ['/incidents', '/announcements', '/events', '/social-welfare', '/health-services'].includes(n.path)),
    },
    {
      label: 'Operations',
      items: sidebarNav.filter(n => ['/drrm', '/waste-management', '/finance'].includes(n.path)),
    },
    {
      label: 'System',
      items: sidebarNav.filter(n => ['/settings'].includes(n.path)),
    },
  ].filter(s => s.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="sb-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sb-root ${isOpen ? 'sb-open' : ''}`}>

        {/* ── Brand ── */}
        <div className="sb-brand">
          <div className="sb-logo-wrap">
            <img src={logoImage} alt="Barangay Logo" className="sb-logo-img" />
          </div>
          <div className="sb-brand-text">
            <span className="sb-brand-name">e-Barangay</span>
            <span className="sb-brand-sub">Management System</span>
          </div>
          <button className="sb-close-btn" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* ── User card ── */}
        <div className="sb-user-card">
          <div className="sb-user-avatar">{userInitial}</div>
          <div className="sb-user-info">
            <span className="sb-user-name">{userName}</span>
            <span className="sb-user-role">{roleLabel}</span>
          </div>
          <div className="sb-user-dot" />
        </div>

        {/* ── Navigation ── */}
        <nav className="sb-nav">
          {sections.map(section => (
            <div key={section.label} className="sb-section">
              <span className="sb-section-label">{section.label}</span>
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sb-link ${isActive ? 'sb-link-active' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="sb-link-icon-wrap">
                      <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    </span>
                    <span className="sb-link-label">{item.label}</span>
                    {item.badge && (
                      <span className="sb-badge">{item.badge}</span>
                    )}
                    {isActive && <span className="sb-active-bar" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className="sb-footer">
          <div className="sb-help-card">
            <div className="sb-help-icon">
              <HelpCircle size={16} strokeWidth={1.8} />
            </div>
            <div className="sb-help-text">
              <span className="sb-help-title">Need help?</span>
              <span className="sb-help-sub">View documentation</span>
            </div>
          </div>
          <p className="sb-version">v1.0.0 &mdash; {new Date().getFullYear()}</p>
        </div>

      </aside>
    </>
  );
}