import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { AlertTriangle, Users, Shield, UserCheck, Plus, Edit, CheckCircle, Droplet, Home, MapPin } from 'lucide-react';

const DRRM = () => {
  const [alerts] = useState([
    {
      id: 1,
      level: 'critical',
      title: 'Typhoon Warning - Signal #2',
      message: 'Typhoon approaching. Expected landfall in 6-12 hours. All residents in flood-prone areas advised to evacuate immediately.',
      time: '3 hours ago',
      audience: 'All Residents',
      location: 'Flood-prone Areas',
      smsSent: 1247
    },
    {
      id: 2,
      level: 'warning',
      title: 'Heavy Rainfall Advisory',
      message: 'Continuous heavy rainfall expected for the next 48 hours. Residents near waterways should be alert.',
      time: '1 day ago',
      audience: 'Riverside Areas',
      location: 'Puroks 1-5',
      smsSent: 534
    }
  ]);

  const evacuationCenters = [
    { id: 1, name: 'Barangay Hall', location: 'Main Road, Purok 1', status: 'Active', occupancy: 67, capacity: 100, percentage: 67 },
    { id: 2, name: 'Elementary School', location: 'School Road, Purok 3', status: 'Active', occupancy: 60, capacity: 150, percentage: 40 },
    { id: 3, name: 'Covered Court', location: 'Sports Complex, Purok 7', status: 'Standby', occupancy: 0, capacity: 200, percentage: 0 }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Disaster Risk Reduction & Management</h1>
          <p className="page-subtitle">Emergency response and disaster preparedness</p>
        </div>
        <button className="btn btn-primary btn-md">
          <AlertTriangle size={18} />
          Send Alert
        </button>
      </div>

      <div className="stats-grid">
        <StatCard title="Active Alerts" value="2" icon={AlertTriangle} iconBg="icon-bg-error" badge="Requires monitoring" badgeColor="badge-error" />
        <StatCard title="Evacuees" value="127" icon={Users} iconBg="icon-bg-warning" badge="In shelters" badgeColor="badge-warning" />
        <StatCard title="High Risk" value="43" icon={Shield} iconBg="icon-bg-warning" badge="Vulnerable residents" badgeColor="badge-gray" />
        <StatCard title="Response Team" value="18" icon={UserCheck} iconBg="icon-bg-success" badge="On standby" badgeColor="badge-success" />
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="table-title">Active Alerts</h3>
        </div>
        <div className="card-body">
          <div className="d-flex flex-column gap-4">
            {alerts.map(alert => (
              <div key={alert.id} className={`list-card list-card-${alert.level === 'critical' ? 'error' : 'warning'}`}>
                <div className="list-card-content">
                  <div className={`list-card-icon-wrapper icon-bg-${alert.level === 'critical' ? 'error' : 'warning'}`}>
                    <AlertTriangle size={24} />
                  </div>
                  <div className="list-card-body">
                    <div className="list-card-header">
                      <span className={`badge badge-${alert.level === 'critical' ? 'error' : 'warning'}`}>
                        {alert.level.toUpperCase()}
                      </span>
                      <span className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                        Issued {alert.time}
                      </span>
                    </div>
                    <h4 className="list-card-title">{alert.title}</h4>
                    <p className="list-card-description">{alert.message}</p>
                    <div className="list-card-meta">
                      <span className="list-card-meta-item">
                        <Users size={14} />
                        {alert.audience}
                      </span>
                      <span className="list-card-meta-item">
                        <MapPin size={14} />
                        {alert.location}
                      </span>
                      <span className="list-card-meta-item fw-semibold" style={{ color: 'var(--color-error)' }}>
                        <AlertTriangle size={14} />
                        SMS Sent to {alert.smsSent} residents
                      </span>
                    </div>
                  </div>
                  <div className="list-card-actions">
                    <button className="btn-icon"><Edit size={18} /></button>
                    <button className="btn-icon" style={{ color: 'var(--color-success)' }}><CheckCircle size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="table-title">Evacuation Centers</h3>
          <button className="btn btn-secondary btn-sm">
            <Plus size={16} />
            Add Center
          </button>
        </div>
        <div className="card-body">
          <div className="grid-auto">
            {evacuationCenters.map(center => (
              <div key={center.id} className="card" style={{ borderLeft: `4px solid var(--color-${center.status === 'Active' ? 'success' : 'gray-300'})` }}>
                <div className="card-body">
                  <div className="d-flex justify-between align-start mb-3">
                    <div>
                      <h4 className="fw-bold text-primary mb-1">{center.name}</h4>
                      <p className="text-secondary d-flex align-center gap-1" style={{ fontSize: 'var(--font-size-sm)' }}>
                        <MapPin size={14} />
                        {center.location}
                      </p>
                    </div>
                    <span className={`badge badge-${center.status === 'Active' ? 'success' : 'gray'}`}>
                      {center.status}
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-between align-center mb-2">
                      <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>Occupancy</span>
                      <span className="fw-semibold">{center.occupancy}/{center.capacity}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${center.percentage}%`, height: '100%', background: `var(--color-${center.percentage > 70 ? 'error' : center.percentage > 50 ? 'warning' : 'success'})`, borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                  <div className="d-flex justify-between align-center">
                    <span className="text-secondary d-flex align-center gap-1" style={{ fontSize: 'var(--font-size-sm)' }}>
                      <Users size={14} />
                      {center.occupancy === 0 ? 'Available' : `${center.occupancy} evacuees`}
                    </span>
                    <button className="btn btn-ghost btn-sm">View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DRRM;