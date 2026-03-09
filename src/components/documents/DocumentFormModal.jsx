// src/components/documents/DocumentFormModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Loader, FileText, User, ClipboardList } from 'lucide-react';
import { useDocuments } from '../../hooks/useDocuments';

const DocumentFormModal = ({ isOpen, onClose, document = null, onSuccess }) => {
  const { create, update, loading } = useDocuments();
  const isEditMode = !!document;

  // Document types available
  const documentTypes = [
    'Barangay Clearance',
    'Certificate of Residency',
    'Certificate of Indigency',
    'Business Permit',
    'Building Permit',
    'Community Tax Certificate',
    'Barangay ID',
    'Certificate of Good Moral',
    'Travel Permit',
    'Certificate of No Income',
    'Other'
  ];

  // Form state
  const [formData, setFormData] = useState({
    // Resident Information
    residentName: '',
    residentContact: '',
    residentId: '',
    
    // Document Details
    type: '',
    purpose: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [showOtherType, setShowOtherType] = useState(false);
  const [customType, setCustomType] = useState('');

  // Load document data if editing
  useEffect(() => {
    if (document) {
      setFormData({
        residentName: document.resident.name || '',
        residentContact: document.resident.contact || '',
        residentId: document.resident.residentId || '',
        type: document.type || '',
        purpose: document.purpose || '',
        notes: document.notes || '',
      });

      // Check if it's a custom type
      if (!documentTypes.includes(document.type)) {
        setShowOtherType(true);
        setCustomType(document.type);
      }
    }
  }, [document]);

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

    // Handle document type selection
    if (name === 'type') {
      if (value === 'Other') {
        setShowOtherType(true);
      } else {
        setShowOtherType(false);
        setCustomType('');
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.residentName.trim()) {
      newErrors.residentName = 'Resident name is required';
    }

    if (!formData.residentContact.trim()) {
      newErrors.residentContact = 'Contact number is required';
    } else {
      // Validate Philippine mobile number format
      const mobileRegex = /^(09|\+639)\d{9}$/;
      if (!mobileRegex.test(formData.residentContact.replace(/\s|-/g, ''))) {
        newErrors.residentContact = 'Invalid mobile number format (e.g., 09XX XXX XXXX)';
      }
    }

    if (!formData.type) {
      newErrors.type = 'Document type is required';
    }

    if (showOtherType && !customType.trim()) {
      newErrors.customType = 'Please specify the document type';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
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

    // Prepare document data
    const documentData = {
      residentName: formData.residentName,
      residentContact: formData.residentContact,
      residentId: formData.residentId || null,
      residentAvatar: `https://ui-avatars.com/api/?name=${formData.residentName}&background=3b82f6&color=fff`,
      type: showOtherType ? customType : formData.type,
      purpose: formData.purpose,
      notes: formData.notes,
    };

    let result;
    if (isEditMode) {
      result = await update(document.id, documentData);
    } else {
      result = await create(documentData);
    }

    if (result.success) {
      alert(isEditMode ? 'Document updated successfully!' : 'Document request created successfully!');
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
      residentName: '',
      residentContact: '',
      residentId: '',
      type: '',
      purpose: '',
      notes: '',
    });
    setErrors({});
    setShowOtherType(false);
    setCustomType('');
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
        style={{ maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            <FileText size={24} style={{ marginRight: '8px' }} />
            {isEditMode ? 'Edit Document Request' : 'New Document Request'}
          </h3>
          <button className="btn-icon" onClick={handleClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            
            {/* Resident Information Section */}
            <div style={{ 
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-4)',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <div className="d-flex align-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
                <User size={20} style={{ color: 'var(--color-primary)' }} />
                <h4 className="fw-semibold">Resident Information</h4>
              </div>

              <div className="d-flex flex-column gap-4">
                <div className="form-group">
                  <label className="form-label">
                    Resident Name *
                  </label>
                  <input
                    type="text"
                    name="residentName"
                    value={formData.residentName}
                    onChange={handleChange}
                    className={`form-input ${errors.residentName ? 'error' : ''}`}
                    placeholder="Juan Dela Cruz"
                    disabled={loading}
                  />
                  {errors.residentName && (
                    <span className="form-error">{errors.residentName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="residentContact"
                    value={formData.residentContact}
                    onChange={handleChange}
                    className={`form-input ${errors.residentContact ? 'error' : ''}`}
                    placeholder="09XX XXX XXXX"
                    disabled={loading}
                  />
                  {errors.residentContact && (
                    <span className="form-error">{errors.residentContact}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Resident ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="residentId"
                    value={formData.residentId}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Leave blank if not registered"
                    disabled={loading}
                  />
                  <small className="text-secondary" style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-1)' }}>
                    If the resident is already registered in the system, enter their ID here
                  </small>
                </div>
              </div>
            </div>

            {/* Document Details Section */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div className="d-flex align-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
                <ClipboardList size={20} style={{ color: 'var(--color-primary)' }} />
                <h4 className="fw-semibold">Document Details</h4>
              </div>

              <div className="d-flex flex-column gap-4">
                <div className="form-group">
                  <label className="form-label">
                    Document Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={`form-select ${errors.type ? 'error' : ''}`}
                    disabled={loading}
                  >
                    <option value="">Select document type</option>
                    {documentTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <span className="form-error">{errors.type}</span>
                  )}
                </div>

                {/* Custom Document Type Input */}
                {showOtherType && (
                  <div className="form-group">
                    <label className="form-label">
                      Specify Document Type *
                    </label>
                    <input
                      type="text"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      className={`form-input ${errors.customType ? 'error' : ''}`}
                      placeholder="Enter custom document type"
                      disabled={loading}
                    />
                    {errors.customType && (
                      <span className="form-error">{errors.customType}</span>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Purpose *
                  </label>
                  <textarea
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    className={`form-input ${errors.purpose ? 'error' : ''}`}
                    placeholder="E.g., For employment, For scholarship, For travel, etc."
                    rows="3"
                    disabled={loading}
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                  {errors.purpose && (
                    <span className="form-error">{errors.purpose}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Any special requirements or additional information..."
                    rows="3"
                    disabled={loading}
                    style={{ resize: 'vertical', minHeight: '80px' }}
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
                <strong>📋 Note:</strong> Document requests are initially marked as "Pending" and require approval. 
                Processing typically takes 1-3 business days. The resident will be notified once the document is ready for pickup.
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
                  {isEditMode ? 'Update Request' : 'Submit Request'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentFormModal;