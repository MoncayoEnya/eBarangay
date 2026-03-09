import React, { useState } from 'react';
import { Building2, UsersRound, Bell, CreditCard, Database, FileText, Save, Plus, Edit2, Trash2 } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const settingsTabs = [
    { id: 'profile', label: 'Barangay Profile', icon: Building2 },
    { id: 'users', label: 'User Management', icon: UsersRound },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Payment Gateway', icon: CreditCard },
    { id: 'backup', label: 'Backup & Security', icon: Database },
    { id: 'services', label: 'Services & Fees', icon: FileText }
  ];

  const users = [
    { id: 1, name: 'Juan Dela Cruz', email: 'juandelacruz@barangay.gov.ph', role: 'Administrator', color: 'primary' },
    { id: 2, name: 'Maria Santos', email: 'mariasantos@barangay.gov.ph', role: 'Secretary', color: 'secondary' },
    { id: 3, name: 'Pedro Reyes', email: 'pedroreyes@barangay.gov.ph', role: 'Treasurer', color: 'success' },
    { id: 4, name: 'Ana Garcia', email: 'anagarcia@barangay.gov.ph', role: 'Health Worker', color: 'warning' }
  ];

  const getAvatarBg = (color) => {
    const colors = {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b'
    };
    return colors[color] || colors.primary;
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your barangay information and configuration</p>
        </div>
      </div>

      <div className="d-flex gap-6" style={{ flexWrap: 'wrap' }}>
        {/* Settings Sidebar */}
        <div style={{ minWidth: '250px' }}>
          <div className="card">
            <div className="card-body p-3">
              {settingsTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`btn w-full justify-start mb-2 ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: 'var(--space-3) var(--space-4)' }}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div style={{ flex: 1, minWidth: '0' }}>
          {/* Barangay Profile Tab */}
          {activeTab === 'profile' && (
            <>
              {/* Basic Information */}
              <div className="card mb-6">
                <div className="card-header">
                  <div>
                    <h3 className="table-title">Basic Information</h3>
                    <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
                      General information about your barangay
                    </p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-4">
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Barangay Name</label>
                        <input type="text" className="form-input" defaultValue="Barangay San Roque" placeholder="Enter barangay name" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">City/Municipality</label>
                        <input type="text" className="form-input" defaultValue="Cebu City" placeholder="Enter city" />
                      </div>
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Province</label>
                        <input type="text" className="form-input" defaultValue="Cebu" placeholder="Enter province" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Region</label>
                        <input type="text" className="form-input" defaultValue="Central Visayas (Region VII)" placeholder="Enter region" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Complete Address</label>
                      <input type="text" className="form-input" defaultValue="Barangay Hall, San Roque, Cebu City, 6000" placeholder="Enter complete address" />
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Contact Number</label>
                        <input type="tel" className="form-input" defaultValue="+63 32 123 4567" placeholder="Enter contact number" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-input" defaultValue="barangay.sanroque@cebucity.gov.ph" placeholder="Enter email" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="d-flex gap-3">
                    <button className="btn btn-primary">
                      <Save size={16} />
                      Save Changes
                    </button>
                    <button className="btn btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>

              {/* Barangay Officials */}
              <div className="card mb-6">
                <div className="card-header">
                  <div>
                    <h3 className="table-title">Barangay Officials</h3>
                    <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
                      Manage barangay captain and council members
                    </p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-4">
                    <div className="form-group">
                      <label className="form-label">Barangay Captain</label>
                      <input type="text" className="form-input" defaultValue="Hon. Juan Dela Cruz" placeholder="Enter captain name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Barangay Secretary</label>
                      <input type="text" className="form-input" defaultValue="Maria Santos" placeholder="Enter secretary name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Barangay Treasurer</label>
                      <input type="text" className="form-input" defaultValue="Pedro Reyes" placeholder="Enter treasurer name" />
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <div className="d-flex gap-3">
                    <button className="btn btn-primary">Save Officials</button>
                    <button className="btn btn-secondary">Add Kagawad</button>
                  </div>
                </div>
              </div>

              {/* System Users */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="table-title">System Users</h3>
                    <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-1)' }}>
                      Manage system access and user roles
                    </p>
                  </div>
                  <button className="btn btn-primary btn-sm">
                    <Plus size={16} />
                    Add User
                  </button>
                </div>
                <div className="card-body">
                  <div className="d-flex flex-column gap-3">
                    {users.map(user => (
                      <div key={user.id} className="d-flex align-center gap-4 p-4" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-lg)',
                            background: getAvatarBg(user.color),
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: 'var(--font-size-base)'
                          }}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 className="fw-semibold mb-1">{user.name}</h4>
                          <p className="text-secondary mb-2" style={{ fontSize: 'var(--font-size-sm)' }}>{user.email}</p>
                          <span className={`badge badge-${user.color}`}>{user.role}</span>
                        </div>
                        <div className="d-flex gap-2">
                          <button className="btn-icon" style={{ color: 'var(--color-primary)' }}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon" style={{ color: 'var(--color-error)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Other Tabs Placeholder */}
          {activeTab !== 'profile' && (
            <div className="card">
              <div className="card-body text-center" style={{ padding: 'var(--space-12)' }}>
                <h3 className="fw-semibold mb-2">{settingsTabs.find(t => t.id === activeTab)?.label}</h3>
                <p className="text-secondary">This section is under development</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;