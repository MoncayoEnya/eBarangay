import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { Route, Truck, Flag, PieChart, Plus, Leaf, Trash2, Recycle, MapPin, User, Clock, ChevronRight, Map } from 'lucide-react';

const WasteManagement = () => {
  const schedules = [
    { id: 1, type: 'Biodegradable', description: 'Kitchen & garden waste', icon: Leaf, color: 'success', days: [{ day: 'Monday', time: '6:00 AM' }, { day: 'Thursday', time: '6:00 AM' }] },
    { id: 2, type: 'Non-Biodegradable', description: 'Plastic, foam & others', icon: Trash2, color: 'error', days: [{ day: 'Tuesday', time: '6:00 AM' }, { day: 'Friday', time: '6:00 AM' }] },
    { id: 3, type: 'Recyclable', description: 'Paper, bottles & cans', icon: Recycle, color: 'primary', days: [{ day: 'Wednesday', time: '6:00 AM' }, { day: 'Saturday', time: '6:00 AM' }] }
  ];

  const vehicles = [
    { id: 1, name: 'Truck #1', plateNumber: 'ABC-1234', status: 'Active', route: 'Puroks 1-3', driver: 'Juan Santos', startTime: '6:00 AM' },
    { id: 2, name: 'Truck #2', plateNumber: 'XYZ-5678', status: 'Active', route: 'Puroks 4-7', driver: 'Pedro Reyes', startTime: '6:15 AM' },
    { id: 3, name: 'Truck #3', plateNumber: 'DEF-9012', status: 'Standby', route: 'Not assigned', driver: 'Available', startTime: 'Ready' }
  ];

  const reports = [
    { id: 1, title: 'Uncollected Garbage - Purok 5', description: 'Multiple households reporting missed collection', location: 'Main Street, Purok 5', time: '2 hours ago', reporter: 'Maria Santos', status: 'Pending', icon: Trash2, color: 'error' },
    { id: 2, title: 'Illegal Dumping Site', description: 'Construction waste dumped near river area', location: 'Riverside, Purok 2', time: '5 hours ago', reporter: 'Roberto Cruz', status: 'Pending', icon: Flag, color: 'warning' },
    { id: 3, title: 'Overflowing Bin Request', description: 'Community bin needs immediate pickup', location: 'Market Area, Purok 1', time: '1 day ago', reporter: 'Ana Garcia', status: 'Resolved', icon: Recycle, color: 'primary' }
  ];

  const getIconBg = (color) => {
    const colors = {
      primary: 'icon-bg-primary',
      success: 'icon-bg-success',
      error: 'icon-bg-error',
      warning: 'icon-bg-warning'
    };
    return colors[color] || 'icon-bg-primary';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Waste Management & Collection</h1>
          <p className="page-subtitle">Manage garbage collection and environmental services</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Plus size={18} />
          Add Schedule
        </button>
      </div>

      <div className="stats-grid">
        <StatCard title="Today's Routes" value="8" icon={Route} iconBg="icon-bg-success" badge="5 completed" badgeColor="badge-success" />
        <StatCard title="Active Vehicles" value="5" icon={Truck} iconBg="icon-bg-primary" badge="On duty" badgeColor="badge-primary" />
        <StatCard title="Reports" value="12" icon={Flag} iconBg="icon-bg-warning" badge="Pending action" badgeColor="badge-warning" />
        <StatCard title="Compliance" value="87%" icon={PieChart} iconBg="icon-bg-secondary" badge="Segregation rate" badgeColor="badge-gray" />
      </div>

      <div className="card mb-6">
        <div className="card-header">
          <h3 className="table-title">This Week's Collection Schedule</h3>
        </div>
        <div className="card-body">
          <div className="grid-auto">
            {schedules.map(schedule => {
              const Icon = schedule.icon;
              return (
                <div key={schedule.id} className="card" style={{ borderLeft: `4px solid var(--color-${schedule.color})` }}>
                  <div className="card-body">
                    <div className={getIconBg(schedule.color)} style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-3)' }}>
                      <Icon size={24} />
                    </div>
                    <h4 className="fw-bold text-primary mb-1">{schedule.type}</h4>
                    <p className="text-secondary mb-3" style={{ fontSize: 'var(--font-size-sm)' }}>{schedule.description}</p>
                    <div className="mb-3">
                      {schedule.days.map((day, idx) => (
                        <div key={idx} className="d-flex justify-between align-center mb-2">
                          <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>{day.day}</span>
                          <span className={`badge badge-${schedule.color}`}>{day.time}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-tertiary d-flex align-center gap-1" style={{ fontSize: 'var(--font-size-xs)' }}>
                      <MapPin size={12} />
                      All Puroks
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="table-title">Fleet Status</h3>
            <button className="btn btn-secondary btn-sm">
              <Map size={16} />
              Track Vehicles
            </button>
          </div>
          <div className="card-body">
            <div className="d-flex flex-column gap-3">
              {vehicles.map(vehicle => (
                <div key={vehicle.id} className="card">
                  <div className="card-body">
                    <div className="d-flex justify-between align-start mb-3">
                      <div>
                        <h4 className="fw-bold mb-1">{vehicle.name}</h4>
                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>{vehicle.plateNumber}</p>
                      </div>
                      <span className={`status-badge status-${vehicle.status.toLowerCase()}`}>{vehicle.status}</span>
                    </div>
                    <div className="d-flex flex-column gap-2 text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                      <div className="d-flex align-center gap-2">
                        <Route size={14} />
                        Route: {vehicle.route}
                      </div>
                      <div className="d-flex align-center gap-2">
                        <User size={14} />
                        Driver: {vehicle.driver}
                      </div>
                      <div className="d-flex align-center gap-2">
                        <Clock size={14} />
                        {vehicle.status === 'Active' ? `Started: ${vehicle.startTime}` : `Status: ${vehicle.startTime}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="table-title">Recent Reports</h3>
            <button className="btn btn-ghost btn-sm">View All</button>
          </div>
          <div className="card-body">
            <div className="d-flex flex-column gap-3">
              {reports.map(report => {
                const Icon = report.icon;
                return (
                  <div key={report.id} className="d-flex align-start gap-3 p-3" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                    <div className={getIconBg(report.color)} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                      <Icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="d-flex justify-between align-start mb-2">
                        <h4 className="fw-semibold text-primary">{report.title}</h4>
                        <span className={`status-badge status-${report.status.toLowerCase()}`}>{report.status}</span>
                      </div>
                      <p className="text-secondary mb-2" style={{ fontSize: 'var(--font-size-sm)' }}>{report.description}</p>
                      <div className="d-flex gap-3 text-tertiary" style={{ fontSize: 'var(--font-size-xs)' }}>
                        <span className="d-flex align-center gap-1"><MapPin size={12} />{report.location}</span>
                        <span className="d-flex align-center gap-1"><Clock size={12} />{report.time}</span>
                        <span className="d-flex align-center gap-1"><User size={12} />{report.reporter}</span>
                      </div>
                    </div>
                    <button className="btn-icon"><ChevronRight size={16} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WasteManagement;