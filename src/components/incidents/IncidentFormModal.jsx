// src/components/incidents/IncidentFormModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Loader, AlertTriangle, Users, MapPin, FileText } from 'lucide-react';
import { useIncidents } from '../../hooks/useIncidents';

const IncidentFormModal = ({ isOpen, onClose, incident = null, onSuccess }) => {
  const { create, update, loading } = useIncidents();
  const isEditMode = !!incident;

  // Incident categories
  const categories = [
    'Dispute',
    'Theft',
    'Noise Complaint',
    'Property Issue',
    'Others'
  ];

  // Avatar colors for complainants
  const avatarColors = ['primary', 'error', 'secondary', 'warning', 'success'];

  // Purok options (you can customize this based on your barangay)
  const purokOptions = [
    'Purok 1',
    'Purok 2', 
    'Purok 3',
    'Purok 4',
    'Purok 5',
    'Purok 6',
    'Purok 7',
    'Purok 8',
    'Purok 9',
    'Purok 10'
  ];

  // Form state
  const [formData, setFormData] = useState({
    // Incident Details
    category: '',
    location: '',
    description: '',
    
    // Complainant
    complainantName: '',
    complainantPurok: '',
    complainantResidentId: '',
    
    // Respondent
    respondentName: '',
    respondentPurok: '',
    respondentResidentId: '',
  });

  const [errors, setErrors] = useState({});

  // Load incident data if editing
  useEffect(() => {
    if (incident) {
      setFormData({
        category: incident.category || '',
        location: incident.location || '',
        description: incident.description || '',
        complainantName: incident.complainant.name || '',
        complainantPurok: incident.complainant.purok || '',
        complainantResidentId: incident.complainant.residentId || '',
        respondentName: incident.respondent.name || '',
        respondentPurok: incident.respondent.purok || '',
        respondentResidentId: incident.respondent.residentId || '',
      });
    }
  }, [incident]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.complainantName.trim()) {
      newErrors.complainantName = 'Complainant name is required';
    }

    if (!formData.complainantPurok) {
      newErrors.complainantPurok = 'Complainant purok is required';
    }

    if (!formData.respondentName.trim()) {
      newErrors.respondentName = 'Respondent name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Incident location is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please fix the errors in the form');
      return;
    }

    // Get random avatar color for complainant
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    // Prepare incident data
    const incidentData = {
      category: formData.category,
      location: formData.location,
      description: formData.description,
      complainantName: formData.complainantName,
      complainantPurok: formData.complainantPurok,
      complainantResidentId: formData.complainantResidentId || null,
      complainantColor: randomColor,
      respondentName: formData.respondentName,
      respondentPurok: formData.respondentPurok || '',
      respondentResidentId: formData.respondentResidentId || null,
    };

    let result;
    if (isEditMode) {
      result = await update(incident.id, incidentData);
    } else {
      result = await create(incidentData);
    }

    if (result.success) {
      alert(isEditMode ? 'Incident updated successfully!' : 'Incident reported successfully!');
      onSuccess?.();
      onClose();
      resetForm();
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      category: '',
      location: '',
      description: '',
      complainantName: '',
      complainantPurok: '',
      complainantResidentId: '',
      respondentName: '',
      respondentPurok: '',
      respondentResidentId: '',
    });
    setErrors({});
  };

  // Handle modal close
  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal" 
        style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            <AlertTriangle size={24} style={{ marginRight: '8px' }} />
            {isEditMode ? 'Edit Incident Report' : 'New Incident Report'}
          </h3>
          <button className="btn-icon" onClick={handleClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            
            {/* Incident Details Section */}
            <div style={{ 
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div className="d-flex align-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
                <FileText size={20} style={{ color: 'var(--color-primary)' }} />
                <h4 className="fw-semibold">Incident Details</h4>
              </div>

              <div className="d-flex flex-column gap-4">
                <div className="form-group">
                  <label className="form-label">
                    Incident Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`form-select ${errors.category ? 'error' : ''}`}
                    disabled={loading}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <span className="form-error">{errors.category}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Location of Incident *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`form-input ${errors.location ? 'error' : ''}`}
                    placeholder="E.g., Near basketball court, Purok 2, etc."
                    disabled={loading}
                  />
                  {errors.location && (
                    <span className="form-error">{errors.location}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Description of Incident *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`form-input ${errors.description ? 'error' : ''}`}
                    placeholder="Provide a detailed description of what happened..."
                    rows="4"
                    disabled={loading}
                    style={{ resize: 'vertical', minHeight: '100px' }}
                  />
                  {errors.description && (
                    <span className="form-error">{errors.description}</span>
                  )}
                  <small className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                    Minimum 20 characters. Be as detailed as possible.
                  </small>
                </div>
              </div>
            </div>

            {/* Complainant Section */}
            <div style={{ 
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div className="d-flex align-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
                <Users size={20} style={{ color: 'var(--color-primary)' }} />
                <h4 className="fw-semibold">Complainant Information</h4>
              </div>

              <div className="d-flex flex-column gap-4">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="complainantName"
                      value={formData.complainantName}
                      onChange={handleChange}
                      className={`form-input ${errors.complainantName ? 'error' : ''}`}
                      placeholder="Juan Dela Cruz"
                      disabled={loading}
                    />
                    {errors.complainantName && (
                      <span className="form-error">{errors.complainantName}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Purok *
                    </label>
                    <select
                      name="complainantPurok"
                      value={formData.complainantPurok}
                      onChange={handleChange}
                      className={`form-select ${errors.complainantPurok ? 'error' : ''}`}
                      disabled={loading}
                    >
                      <option value="">Select purok</option>
                      {purokOptions.map(purok => (
                        <option key={purok} value={purok}>{purok}</option>
                      ))}
                    </select>
                    {errors.complainantPurok && (
                      <span className="form-error">{errors.complainantPurok}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Resident ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="complainantResidentId"
                    value={formData.complainantResidentId}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Leave blank if not registered"
                    disabled={loading}
                  />
                  <small className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                    If registered in the system, enter their resident ID
                  </small>
                </div>
              </div>
            </div>

            {/* Respondent Section */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div className="d-flex align-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
                <Users size={20} style={{ color: 'var(--color-error)' }} />
                <h4 className="fw-semibold">Respondent Information</h4>
              </div>

              <div className="d-flex flex-column gap-4">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="respondentName"
                      value={formData.respondentName}
                      onChange={handleChange}
                      className={`form-input ${errors.respondentName ? 'error' : ''}`}
                      placeholder="Maria Santos"
                      disabled={loading}
                    />
                    {errors.respondentName && (
                      <span className="form-error">{errors.respondentName}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Purok
                    </label>
                    <select
                      name="respondentPurok"
                      value={formData.respondentPurok}
                      onChange={handleChange}
                      className="form-select"
                      disabled={loading}
                    >
                      <option value="">Select purok (optional)</option>
                      {purokOptions.map(purok => (
                        <option key={purok} value={purok}>{purok}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Resident ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="respondentResidentId"
                    value={formData.respondentResidentId}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Leave blank if not registered"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Information Box */}
            <div style={{
              padding: 'var(--space-4)',
              background: 'var(--color-bg-tertiary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
            }}>
              <p style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: 1.5
              }}>
                <strong>⚖️ Note:</strong> All incidents are logged and assigned a case number. 
                The Lupon Tagapamayapa will review the case and may schedule a mediation session. 
                Both parties will be notified and summoned accordingly.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClose} 
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditMode ? 'Update Report' : 'Submit Report'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentFormModal;