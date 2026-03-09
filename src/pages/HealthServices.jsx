// src/pages/HealthServices.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { 
  Users, 
  Calendar, 
  Syringe, 
  Clipboard, 
  Plus, 
  Eye,
  Check,
  X,
  Edit,
  Loader,
  AlertCircle,
  XCircle,
  Search,
  Filter
} from 'lucide-react';
import { useHealth } from '../hooks/useHealth';

const HealthServices = () => {
  const {
    patients,
    appointments,
    immunizations,
    loading,
    error,
    stats,
    loadPatients,
    loadAppointments,
    createAppointment,
    updateAppointment,
    loadImmunizations,
    createImmunization,
    loadStatistics,
    clearError
  } = useHealth();

  const [activeTab, setActiveTab] = useState('appointments');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showImmunizationModal, setShowImmunizationModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Appointment form data
  const [appointmentForm, setAppointmentForm] = useState({
    patientName: '',
    residentId: '',
    appointmentDate: '',
    appointmentTime: '09:00',
    appointmentType: 'consultation',
    notes: ''
  });

  // Immunization form data
  const [immunizationForm, setImmunizationForm] = useState({
    patientName: '',
    residentId: '',
    vaccineName: '',
    doseNumber: 1,
    nextDoseDate: '',
    remarks: ''
  });

  // Load data on mount
  useEffect(() => {
    loadAppointments();
    loadPatients();
    loadImmunizations();
    loadStatistics();
  }, []);

  // Handle appointment form change
  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle immunization form change
  const handleImmunizationChange = (e) => {
    const { name, value } = e.target;
    setImmunizationForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit appointment
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    
    if (!appointmentForm.patientName || !appointmentForm.appointmentDate) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await createAppointment(appointmentForm);
    
    if (result.success) {
      alert('Appointment booked successfully!');
      setShowAppointmentModal(false);
      setAppointmentForm({
        patientName: '',
        residentId: '',
        appointmentDate: '',
        appointmentTime: '09:00',
        appointmentType: 'consultation',
        notes: ''
      });
      loadStatistics();
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Submit immunization
  const handleImmunizationSubmit = async (e) => {
    e.preventDefault();
    
    if (!immunizationForm.patientName || !immunizationForm.vaccineName) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await createImmunization(immunizationForm);
    
    if (result.success) {
      alert('Immunization record added successfully!');
      setShowImmunizationModal(false);
      setImmunizationForm({
        patientName: '',
        residentId: '',
        vaccineName: '',
        doseNumber: 1,
        nextDoseDate: '',
        remarks: ''
      });
      loadStatistics();
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Update appointment status
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    const result = await updateAppointment(appointmentId, newStatus);
    
    if (result.success) {
      alert(`Appointment ${newStatus.toLowerCase()}!`);
      loadStatistics();
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return apt.patientName?.toLowerCase().includes(searchLower);
  });

  // Filter immunizations
  const filteredImmunizations = immunizations.filter(imm => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return imm.patientName?.toLowerCase().includes(searchLower) ||
           imm.vaccineName?.toLowerCase().includes(searchLower);
  });

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Health Services</h1>
          <p className="page-subtitle">Manage health programs and patient records</p>
        </div>
        <div className="d-flex gap-3">
          <button 
            className="btn btn-secondary btn-md"
            onClick={() => setShowImmunizationModal(true)}
          >
            <Syringe size={18} />
            Add Immunization
          </button>
          <button 
            className="btn btn-primary btn-md"
            onClick={() => setShowAppointmentModal(true)}
          >
            <Plus size={18} />
            New Appointment
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="card" style={{
          background: 'var(--color-error-light)',
          border: '1px solid var(--color-error)',
          marginBottom: 'var(--space-6)'
        }}>
          <div className="card-body">
            <div className="d-flex align-center justify-between">
              <div className="d-flex align-center gap-3">
                <AlertCircle size={24} style={{ color: 'var(--color-error)' }} />
                <div>
                  <h4 className="fw-semibold" style={{ color: 'var(--color-error)' }}>Error</h4>
                  <p className="text-secondary">{error}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={clearError}>
                <XCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard 
          title="Total Patients" 
          value={stats?.totalPatients?.toString() || '0'} 
          icon={Users}
          iconBg="icon-bg-primary"
          badge="Registered"
          badgeColor="badge-primary"
        />
        <StatCard 
          title="Appointments Today" 
          value={stats?.todayAppointments?.toString() || '0'} 
          icon={Calendar}
          iconBg="icon-bg-secondary"
          badge="Scheduled"
          badgeColor="badge-secondary"
        />
        <StatCard 
          title="Immunizations" 
          value={stats?.totalImmunizations?.toString() || '0'} 
          icon={Syringe}
          iconBg="icon-bg-success"
          badge="Total given"
          badgeColor="badge-success"
        />
        <StatCard 
          title="Consultations" 
          value={stats?.consultationsThisMonth?.toString() || '0'} 
          icon={Clipboard}
          iconBg="icon-bg-warning"
          badge="This month"
          badgeColor="badge-warning"
        />
      </div>

      {/* Tabs */}
      <div className="filters-section">
        <div className="filter-buttons-group">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`filter-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          >
            <Calendar size={18} />
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('immunizations')}
            className={`filter-btn ${activeTab === 'immunizations' ? 'active' : ''}`}
          >
            <Syringe size={18} />
            Immunizations
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`filter-btn ${activeTab === 'patients' ? 'active' : ''}`}
          >
            <Users size={18} />
            Patients
          </button>
        </div>

        <div className="action-buttons-group">
          <div style={{ position: 'relative', minWidth: '250px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-tertiary)'
              }}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button className="btn btn-secondary btn-md">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'appointments' && (
        <div className="data-table-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <Loader className="empty-state-icon animate-spin" />
                        <h3 className="empty-state-title">Loading appointments...</h3>
                      </div>
                    </td>
                  </tr>
                ) : filteredAppointments.length > 0 ? (
                  filteredAppointments.map((apt) => (
                    <tr key={apt.id}>
                      <td className="fw-semibold">{apt.appointmentTime || 'N/A'}</td>
                      <td>{apt.patientName || 'N/A'}</td>
                      <td className="text-secondary">{apt.appointmentType || 'N/A'}</td>
                      <td className="text-secondary">{formatDate(apt.appointmentDate)}</td>
                      <td>
                        <span className={`status-badge status-${apt.status?.toLowerCase() || 'pending'}`}>
                          {apt.status || 'Scheduled'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-center gap-2">
                          <button
                            className="btn-icon btn-icon-sm"
                            onClick={() => alert(`View appointment details for ${apt.patientName}`)}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          {apt.status === 'Scheduled' && (
                            <>
                              <button
                                className="btn-icon btn-icon-sm"
                                onClick={() => handleStatusUpdate(apt.appointmentId, 'Confirmed')}
                                title="Confirm"
                                style={{ color: 'var(--color-success)' }}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className="btn-icon btn-icon-sm"
                                onClick={() => handleStatusUpdate(apt.appointmentId, 'Cancelled')}
                                title="Cancel"
                                style={{ color: 'var(--color-error)' }}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <Calendar className="empty-state-icon" />
                        <h3 className="empty-state-title">No appointments found</h3>
                        <p className="empty-state-description">Click "New Appointment" to schedule one</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'immunizations' && (
        <div className="data-table-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Vaccine</th>
                  <th>Dose</th>
                  <th>Date Given</th>
                  <th>Next Dose</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredImmunizations.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <Loader className="empty-state-icon animate-spin" />
                        <h3 className="empty-state-title">Loading immunizations...</h3>
                      </div>
                    </td>
                  </tr>
                ) : filteredImmunizations.length > 0 ? (
                  filteredImmunizations.map((imm) => (
                    <tr key={imm.id}>
                      <td className="fw-semibold">{imm.patientName || 'N/A'}</td>
                      <td>{imm.vaccineName || 'N/A'}</td>
                      <td className="text-secondary">Dose {imm.doseNumber || 1}</td>
                      <td className="text-secondary">{formatDate(imm.dateAdministered)}</td>
                      <td className="text-secondary">{formatDate(imm.nextDoseDate)}</td>
                      <td>
                        <button
                          className="btn-icon btn-icon-sm"
                          onClick={() => alert(`View immunization details`)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <Syringe className="empty-state-icon" />
                        <h3 className="empty-state-title">No immunizations found</h3>
                        <p className="empty-state-description">Click "Add Immunization" to record one</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="data-table-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Patient Name</th>
                  <th>Age</th>
                  <th>Blood Type</th>
                  <th>Last Visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && patients.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <Loader className="empty-state-icon animate-spin" />
                        <h3 className="empty-state-title">Loading patients...</h3>
                      </div>
                    </td>
                  </tr>
                ) : patients.length > 0 ? (
                  patients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="fw-semibold text-primary">{patient.recordId || 'N/A'}</td>
                      <td>{patient.patientInfo?.name || 'N/A'}</td>
                      <td className="text-secondary">{patient.patientInfo?.age || 'N/A'}</td>
                      <td className="text-secondary">{patient.patientInfo?.bloodType || 'N/A'}</td>
                      <td className="text-secondary">
                        {patient.consultations?.length > 0 
                          ? formatDate(patient.consultations[patient.consultations.length - 1].date)
                          : 'No visits'}
                      </td>
                      <td>
                        <button
                          className="btn-icon btn-icon-sm"
                          onClick={() => alert(`View patient details`)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <Users className="empty-state-icon" />
                        <h3 className="empty-state-title">No patients found</h3>
                        <p className="empty-state-description">Patient records will appear here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Appointment</h3>
              <button className="btn-icon" onClick={() => setShowAppointmentModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleAppointmentSubmit}>
              <div className="modal-body">
                <div className="d-flex flex-column gap-4">
                  <div className="form-group">
                    <label className="form-label">Patient Name *</label>
                    <input
                      type="text"
                      name="patientName"
                      value={appointmentForm.patientName}
                      onChange={handleAppointmentChange}
                      className="form-input"
                      placeholder="Enter patient name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Resident ID (Optional)</label>
                    <input
                      type="text"
                      name="residentId"
                      value={appointmentForm.residentId}
                      onChange={handleAppointmentChange}
                      className="form-input"
                      placeholder="RES-2024-0001"
                    />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Appointment Date *</label>
                      <input
                        type="date"
                        name="appointmentDate"
                        value={appointmentForm.appointmentDate}
                        onChange={handleAppointmentChange}
                        className="form-input"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Time *</label>
                      <input
                        type="time"
                        name="appointmentTime"
                        value={appointmentForm.appointmentTime}
                        onChange={handleAppointmentChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Appointment Type *</label>
                    <select
                      name="appointmentType"
                      value={appointmentForm.appointmentType}
                      onChange={handleAppointmentChange}
                      className="form-select"
                      required
                    >
                      <option value="consultation">General Consultation</option>
                      <option value="prenatal">Pre-natal Check-up</option>
                      <option value="immunization">Immunization</option>
                      <option value="followup">Follow-up</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      name="notes"
                      value={appointmentForm.notes}
                      onChange={handleAppointmentChange}
                      className="form-input"
                      rows="3"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAppointmentModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar size={16} />
                      Book Appointment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immunization Modal */}
      {showImmunizationModal && (
        <div className="modal-overlay" onClick={() => setShowImmunizationModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Immunization Record</h3>
              <button className="btn-icon" onClick={() => setShowImmunizationModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleImmunizationSubmit}>
              <div className="modal-body">
                <div className="d-flex flex-column gap-4">
                  <div className="form-group">
                    <label className="form-label">Patient Name *</label>
                    <input
                      type="text"
                      name="patientName"
                      value={immunizationForm.patientName}
                      onChange={handleImmunizationChange}
                      className="form-input"
                      placeholder="Enter patient name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Resident ID (Optional)</label>
                    <input
                      type="text"
                      name="residentId"
                      value={immunizationForm.residentId}
                      onChange={handleImmunizationChange}
                      className="form-input"
                      placeholder="RES-2024-0001"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vaccine Name *</label>
                    <select
                      name="vaccineName"
                      value={immunizationForm.vaccineName}
                      onChange={handleImmunizationChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select vaccine</option>
                      <option value="BCG">BCG</option>
                      <option value="Hepatitis B">Hepatitis B</option>
                      <option value="DPT">DPT</option>
                      <option value="OPV">OPV (Oral Polio)</option>
                      <option value="MMR">MMR (Measles, Mumps, Rubella)</option>
                      <option value="Influenza">Influenza</option>
                      <option value="COVID-19">COVID-19</option>
                    </select>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Dose Number *</label>
                      <input
                        type="number"
                        name="doseNumber"
                        value={immunizationForm.doseNumber}
                        onChange={handleImmunizationChange}
                        className="form-input"
                        min="1"
                        max="5"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Next Dose Date</label>
                      <input
                        type="date"
                        name="nextDoseDate"
                        value={immunizationForm.nextDoseDate}
                        onChange={handleImmunizationChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <textarea
                      name="remarks"
                      value={immunizationForm.remarks}
                      onChange={handleImmunizationChange}
                      className="form-input"
                      rows="3"
                      placeholder="Additional remarks..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowImmunizationModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Syringe size={16} />
                      Add Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthServices;