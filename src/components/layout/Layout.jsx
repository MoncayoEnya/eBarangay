import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Megaphone,
  Calendar,
  Heart,
  HandHeart,
  Recycle,
  DollarSign,
  Shield as ShieldIcon,
  Settings,
  LogOut,
  User,
  Bell,
  Search,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

import '../../styles/Layout.css';
import logoImage from '../../assets/images/barangay_logo.jpg';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/residents', icon: Users, label: 'Residents' },
    { path: '/documents', icon: FileText, label: 'Documents' },
    { path: '/incidents', icon: AlertTriangle, label: 'Incidents' },
    { path: '/announcements', icon: Megaphone, label: 'Announcements' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/health', icon: Heart, label: 'Health Services' },
    { path: '/welfare', icon: HandHeart, label: 'Social Welfare' },
    { path: '/waste', icon: Recycle, label: 'Waste Management' },
    { path: '/finance', icon: DollarSign, label: 'Finance' },
    { path: '/drrm', icon: ShieldIcon, label: 'DRRM' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (currentUser?.profile?.name) {
      const names = currentUser.profile.name.split(' ');
      return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }
    return 'AU';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout-wrapper">
      {/* Sidebar with Auto-Expand on Hover */}
      <aside
        className={`modern-sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo Section */}
        <div className="sidebar-logo">
          <div className="logo-container">
            <img src={logoImage} alt="Barangay Logo" className="logo-image" />
          </div>
          {sidebarExpanded && (
            <div className="logo-text">
              <h1>Barangay</h1>
              <p>Management System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                title={!sidebarExpanded ? item.label : ''}
              >
                {active && <div className="active-indicator" />}
                <Icon className="nav-icon" />
                {sidebarExpanded && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          {sidebarExpanded ? (
            <>
              <div className="help-card">
                <div className="help-icon">
                  <HelpCircle size={20} />
                </div>
                <div className="help-text">
                  <p className="help-title">Need Help?</p>
                  <p className="help-subtitle">Contact support</p>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button onClick={handleLogout} className="logout-btn-icon" title="Logout">
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`main-content ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
        {/* Modern Topbar */}
        <header className="modern-topbar">
          <div className="topbar-left">
            {/* Clean Modern Search */}
            <div className="search-box">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search residents, documents, incidents..."
                className="search-input"
              />
              <kbd className="search-kbd">⌘K</kbd>
            </div>
          </div>

          <div className="topbar-right">
            {/* Help Button */}
            <button className="icon-btn" title="Help & Support">
              <HelpCircle size={20} />
            </button>

            {/* Settings Button */}
            <button className="icon-btn" onClick={() => navigate('/settings')} title="Settings">
              <Settings size={20} />
            </button>

            {/* Notifications */}
            <button className="icon-btn notification-btn">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>

            {/* Divider */}
            <div className="topbar-divider" />

            {/* User Menu */}
            <div className="user-menu-wrapper">
              <button className="user-menu-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">{getUserInitials()}</div>
                <div className="user-info">
                  <p className="user-name">{currentUser?.profile?.name || 'Admin User'}</p>
                  <p className="user-role">{currentUser?.profile?.role || 'Barangay Secretary'}</p>
                </div>
                <ChevronDown className={`chevron ${showUserMenu ? 'rotated' : ''}`} size={16} />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setShowUserMenu(false)} />
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <p className="dropdown-name">{currentUser?.profile?.name || 'Admin User'}</p>
                      <p className="dropdown-email">{currentUser?.email || 'admin@barangay.com'}</p>
                    </div>
                    <div className="dropdown-items">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/settings');
                        }}
                        className="dropdown-item"
                      >
                        <User size={18} />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/settings');
                        }}
                        className="dropdown-item"
                      >
                        <Settings size={18} />
                        <span>Account Settings</span>
                      </button>
                    </div>
                    <div className="dropdown-divider" />
                    <button onClick={handleLogout} className="dropdown-item logout-item">
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}