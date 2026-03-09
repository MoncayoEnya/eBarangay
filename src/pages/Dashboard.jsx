import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';

import {
  Users,
  FileText,
  AlertCircle,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  UserPlus,
  FilePlus,
  Flag,
  Megaphone,
  Bell,
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    residents: 8547,
    pendingDocs: 24,
    activeIncidents: 7,
    upcomingEvents: 12
  });

  // Simulate data loading
  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  // Sample data
  const recentDocuments = [
    {
      id: 1,
      title: 'Barangay Clearance',
      requester: 'Juan Dela Cruz',
      time: '2 mins ago',
      status: 'pending',
      statusText: 'Pending'
    },
    {
      id: 2,
      title: 'Certificate of Residency',
      requester: 'Maria Santos',
      time: '15 mins ago',
      status: 'approved',
      statusText: 'Approved'
    },
    {
      id: 3,
      title: 'Business Clearance',
      requester: 'Pedro Reyes',
      time: '1 hour ago',
      status: 'pending',
      statusText: 'Pending'
    },
    {
      id: 4,
      title: 'Indigency Certificate',
      requester: 'Ana Garcia',
      time: '2 hours ago',
      status: 'processing',
      statusText: 'Processing'
    }
  ];

  const quickActions = [
    { label: 'Add New Resident', icon: UserPlus, color: 'primary', action: () => alert('Add Resident') },
    { label: 'Issue Document', icon: FilePlus, color: 'success', action: () => alert('Issue Document') },
    { label: 'Report Incident', icon: Flag, color: 'warning', action: () => alert('Report Incident') },
    { label: 'Create Announcement', icon: Megaphone, color: 'secondary', action: () => alert('Create Announcement') },
    { label: 'Send Alert', icon: Bell, color: 'error', action: () => alert('Send Alert') }
  ];

  const activeIncidents = [
    {
      title: 'Neighborhood Dispute',
      location: 'Purok 3',
      time: '3 hours ago',
      severity: 'urgent'
    },
    {
      title: 'Noise Complaint',
      location: 'Purok 1',
      time: '5 hours ago',
      severity: 'open'
    },
    {
      title: 'Property Boundary Issue',
      location: 'Purok 5',
      time: 'Under mediation',
      severity: 'mediation'
    }
  ];

  const upcomingEvents = [
    {
      date: { month: 'DEC', day: '15' },
      title: 'Community Clean-up Drive',
      location: 'All Puroks',
      time: '7:00 AM',
      participants: 234
    },
    {
      date: { month: 'DEC', day: '20' },
      title: 'Christmas Party',
      location: 'Barangay Hall',
      time: '5:30 PM',
      participants: 150
    }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">
            Welcome back! Here's what's happening in your barangay today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Residents"
          value={stats.residents.toLocaleString()}
          icon={Users}
          iconBg="icon-bg-primary"
          badge="+2.5% from last month"
          badgeColor="badge-success"
        />
        <StatCard
          title="Pending Documents"
          value={stats.pendingDocs}
          icon={FileText}
          iconBg="icon-bg-warning"
          badge="Needs attention"
          badgeColor="badge-warning"
        />
        <StatCard
          title="Active Incidents"
          value={stats.activeIncidents}
          icon={AlertCircle}
          iconBg="icon-bg-error"
          badge="2 urgent cases"
          badgeColor="badge-error"
        />
        <StatCard
          title="Upcoming Events"
          value={stats.upcomingEvents}
          icon={Calendar}
          iconBg="icon-bg-secondary"
          badge="This month"
          badgeColor="badge-gray"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid-2">
        {/* Recent Documents */}
        <div className="data-table-card">
          <div className="table-header">
            <h3 className="table-title">Recent Document Requests</h3>
            <button className="btn btn-ghost btn-sm">
              View All
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Requester</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.map(doc => (
                  <tr key={doc.id}>
                    <td>
                      <div className="d-flex align-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span className="fw-medium">{doc.title}</span>
                      </div>
                    </td>
                    <td className="text-secondary">{doc.requester}</td>
                    <td className="text-secondary">{doc.time}</td>
                    <td>
                      <span className={`status-badge status-${doc.status}`}>
                        {doc.statusText}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="table-title">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="d-flex flex-column gap-3">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    className={`btn btn-${action.color} w-full justify-start`}
                    onClick={action.action}
                  >
                    <Icon size={20} strokeWidth={2} />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid-2" style={{ marginTop: 'var(--space-6)' }}>
        {/* Active Incidents */}
        <div className="card">
          <div className="card-header">
            <h3 className="table-title">Active Incidents</h3>
            <button className="btn btn-ghost btn-sm">
              View All
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="card-body">
            <div className="list-container">
              {activeIncidents.map((incident, idx) => (
                <div
                  key={idx}
                  className={`list-card list-card-${incident.severity === 'urgent' ? 'error' : incident.severity === 'open' ? 'warning' : 'primary'}`}
                >
                  <div className="list-card-content">
                    <div className="list-card-body">
                      <div className="list-card-header">
                        <h4 className="list-card-title">{incident.title}</h4>
                        <span className={`status-badge status-${incident.severity}`}>
                          {incident.severity}
                        </span>
                      </div>
                      <div className="list-card-meta">
                        <span className="list-card-meta-item">
                          <Flag size={14} />
                          {incident.location}
                        </span>
                        <span className="list-card-meta-item">
                          <Clock size={14} />
                          {incident.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div className="card-header">
            <h3 className="table-title">Upcoming Events</h3>
            <button className="btn btn-ghost btn-sm">
              View Calendar
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="card-body">
            <div className="d-flex flex-column gap-4">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className="d-flex gap-4 align-start">
                  <div
                    className="d-flex flex-column align-center justify-center"
                    style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                      borderRadius: 'var(--radius-xl)',
                      color: 'white',
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: '10px', fontWeight: 700, opacity: 0.9 }}>
                      {event.date.month}
                    </span>
                    <span style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1 }}>
                      {event.date.day}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 className="fw-semibold text-primary mb-1">{event.title}</h4>
                    <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}>
                      {event.location} • {event.time}
                    </p>
                    <p className="text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                      {event.participants} registered participants
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;