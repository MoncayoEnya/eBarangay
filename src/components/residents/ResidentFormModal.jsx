// src/components/residents/ResidentFormModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, Loader, User, MapPin, Phone, Briefcase, Heart, FileText } from 'lucide-react';
import { useResidents } from '../../hooks/useResidents';

const ResidentFormModal = ({ isOpen, onClose, resident = null, onSuccess }) => {
  const { create, update, loading } = useResidents();
  const isEditMode = !!resident;

  // Form state
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    nickname: '',
    birthDate: '',
    gender: '',
    civilStatus: '',
    nationality: 'Filipino',
    religion: '',
    bloodType: '',
    
    // Contact Info
    email: '',
    mobileNumber: '',
    landlineNumber: '',
    
    // Address
    purok: '',
    block: '',
    lot: '',
    street: '',
    fullAddress: '',
    
    // Status Flags
    isVoter: false,
    voterIdNumber: '',
    isPWD: false,
    pwdIdNumber: '',
    isSeniorCitizen: false,
    seniorCitizenIdNumber: '',
    is4Ps: false,
    isIndigent: false,
    isOFW: false,
    
    // Employment
    employmentStatus: 'Unemployed',
    occupation: '',
    employer: '',
    monthlyIncome: '',
    
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactNumber: '',
  });

  const [activeTab, setActiveTab] = useState('personal');
  const [errors, setErrors] = useState({});

  // Load resident data if editing
  useEffect(() => {
    if (resident) {
      setFormData({
        firstName: resident.personalInfo.firstName || '',
        middleName: resident.personalInfo.middleName || '',
        lastName: resident.personalInfo.lastName || '',
        suffix: resident.personalInfo.suffix || '',
        nickname: resident.personalInfo.nickname || '',
        birthDate: resident.personalInfo.birthDate?.toDate?.()?.toISOString().split('T')[0] || '',
        gender: resident.personalInfo.gender || '',
        civilStatus: resident.personalInfo.civilStatus || '',
        nationality: resident.personalInfo.nationality || 'Filipino',
        religion: resident.personalInfo.religion || '',
        bloodType: resident.personalInfo.bloodType || '',
        
        email: resident.contactInfo.email || '',
        mobileNumber: resident.contactInfo.mobileNumber || '',
        landlineNumber: resident.contactInfo.landlineNumber || '',
        
        purok: resident.address.purok || '',
        block: resident.address.block || '',
        lot: resident.address.lot || '',
        street: resident.address.street || '',
        fullAddress: resident.address.fullAddress || '',
        
        isVoter: resident.statusFlags.isVoter || false,
        voterIdNumber: resident.statusFlags.voterIdNumber || '',
        isPWD: resident.statusFlags.isPWD || false,
        pwdIdNumber: resident.statusFlags.pwdIdNumber || '',
        isSeniorCitizen: resident.statusFlags.isSeniorCitizen || false,
        seniorCitizenIdNumber: resident.statusFlags.seniorCitizenIdNumber || '',
        is4Ps: resident.statusFlags.is4Ps || false,
        isIndigent: resident.statusFlags.isIndigent || false,
        isOFW: resident.statusFlags.isOFW || false,
        
        employmentStatus: resident.employment.status || 'Unemployed',
        occupation: resident.employment.occupation || '',
        employer: resident.employment.employer || '',
        monthlyIncome: resident.employment.monthlyIncome || '',
        
        emergencyContactName: resident.emergencyContact.name || '',
        emergencyContactRelationship: resident.emergencyContact.relationship || '',
        emergencyContactNumber: resident.emergencyContact.contactNumber || '',
      });
    }
  }, [resident]);

  // Calculate age from birthdate
  useEffect(() => {
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Auto-check senior citizen if 60+
      if (age >= 60 && !formData.isSeniorCitizen) {
        setFormData(prev => ({ ...prev, isSeniorCitizen: true }));
      }
    }
  }, [formData.birthDate]);

  // Auto-generate full address
  useEffect(() => {
    const parts = [
      formData.lot && `Lot ${formData.lot}`,
      formData.block && `Block ${formData.block}`,
      formData.street,
      formData.purok
    ].filter(Boolean);
    
    if (parts.length > 0) {
      setFormData(prev => ({ ...prev, fullAddress: parts.join(', ') }));
    }
  }, [formData.purok, formData.block, formData.lot, formData.street]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.birthDate) newErrors.birthDate = 'Birth date is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.civilStatus) newErrors.civilStatus = 'Civil status is required';
    if (!formData.purok) newErrors.purok = 'Purok is required';
    
    // Mobile number format validation (Philippine format)
    if (formData.mobileNumber) {
      const mobileRegex = /^(09|\+639)\d{9}$/;
      if (!mobileRegex.test(formData.mobileNumber.replace(/\s|-/g, ''))) {
        newErrors.mobileNumber = 'Invalid mobile number format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Please fix the errors in the form');
      return;
    }

    // Calculate age
    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const residentData = {
      ...formData,
      age
    };

    let result;
    if (isEditMode) {
      result = await update(resident.id, residentData);
    } else {
      result = await create(residentData);
    }

    if (result.success) {
      alert(isEditMode ? 'Resident updated successfully!' : 'Resident added successfully!');
      onSuccess?.();
      onClose();
    } else {
      alert('Error: ' + result.error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'contact', label: 'Contact & Address', icon: MapPin },
    { id: 'status', label: 'Status & IDs', icon: FileText },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'emergency', label: 'Emergency Contact', icon: Heart },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isEditMode ? 'Edit Resident' : 'Add New Resident'}
          </h3>
          <button className="btn-icon" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div style={{ borderBottom: '1px solid var(--color-border)', padding: '0 var(--space-6)' }}>
            <div className="d-flex gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`btn btn-ghost btn-sm ${activeTab === tab.id ? 'active' : ''}`}
                    style={{
                      borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : 'none',
                      borderRadius: 0,
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-body" style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="d-flex flex-column gap-4">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`form-input ${errors.firstName ? 'error' : ''}`}
                      placeholder="Juan"
                    />
                    {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Middle Name</label>
                    <input
                      type="text"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Santos"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`form-input ${errors.lastName ? 'error' : ''}`}
                      placeholder="Dela Cruz"
                    />
                    {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Suffix</label>
                    <input
                      type="text"
                      name="suffix"
                      value={formData.suffix}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Jr., Sr., III"
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nickname</label>
                    <input
                      type="text"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Birth Date *</label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className={`form-input ${errors.birthDate ? 'error' : ''}`}
                    />
                    {errors.birthDate && <span className="form-error">{errors.birthDate}</span>}
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`form-select ${errors.gender ? 'error' : ''}`}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {errors.gender && <span className="form-error">{errors.gender}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Civil Status *</label>
                    <select
                      name="civilStatus"
                      value={formData.civilStatus}
                      onChange={handleChange}
                      className={`form-select ${errors.civilStatus ? 'error' : ''}`}
                    >
                      <option value="">Select status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                    {errors.civilStatus && <span className="form-error">{errors.civilStatus}</span>}
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Nationality</label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Religion</label>
                    <input
                      type="text"
                      name="religion"
                      value={formData.religion}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Roman Catholic, INC, etc."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Blood Type</label>
                  <select
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            )}

            {/* Contact & Address Tab */}
            {activeTab === 'contact' && (
              <div className="d-flex flex-column gap-4">
                <h4 className="fw-semibold">Contact Information</h4>
                
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="juan@example.com"
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      className={`form-input ${errors.mobileNumber ? 'error' : ''}`}
                      placeholder="09XX XXX XXXX"
                    />
                    {errors.mobileNumber && <span className="form-error">{errors.mobileNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Landline Number</label>
                    <input
                      type="tel"
                      name="landlineNumber"
                      value={formData.landlineNumber}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="(032) XXX XXXX"
                    />
                  </div>
                </div>

                <h4 className="fw-semibold" style={{ marginTop: 'var(--space-4)' }}>Address</h4>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Purok *</label>
                    <input
                      type="text"
                      name="purok"
                      value={formData.purok}
                      onChange={handleChange}
                      className={`form-input ${errors.purok ? 'error' : ''}`}
                      placeholder="Purok 1, Purok 2, etc."
                    />
                    {errors.purok && <span className="form-error">{errors.purok}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Block</label>
                    <input
                      type="text"
                      name="block"
                      value={formData.block}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Block 1, Block 2, etc."
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Lot</label>
                    <input
                      type="text"
                      name="lot"
                      value={formData.lot}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Lot 12, Lot 34, etc."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Street</label>
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Main Street, etc."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Address (Auto-generated)</label>
                  <input
                    type="text"
                    name="fullAddress"
                    value={formData.fullAddress}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Complete address"
                  />
                </div>
              </div>
            )}

            {/* Status & IDs Tab */}
            {activeTab === 'status' && (
              <div className="d-flex flex-column gap-4">
                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="isVoter"
                      checked={formData.isVoter}
                      onChange={handleChange}
                    />
                    <span>Registered Voter</span>
                  </label>
                  {formData.isVoter && (
                    <input
                      type="text"
                      name="voterIdNumber"
                      value={formData.voterIdNumber}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Voter ID Number"
                      style={{ marginTop: 'var(--space-2)' }}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="isPWD"
                      checked={formData.isPWD}
                      onChange={handleChange}
                    />
                    <span>Person with Disability (PWD)</span>
                  </label>
                  {formData.isPWD && (
                    <input
                      type="text"
                      name="pwdIdNumber"
                      value={formData.pwdIdNumber}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="PWD ID Number"
                      style={{ marginTop: 'var(--space-2)' }}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="isSeniorCitizen"
                      checked={formData.isSeniorCitizen}
                      onChange={handleChange}
                    />
                    <span>Senior Citizen (60+ years old)</span>
                  </label>
                  {formData.isSeniorCitizen && (
                    <input
                      type="text"
                      name="seniorCitizenIdNumber"
                      value={formData.seniorCitizenIdNumber}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Senior Citizen ID Number"
                      style={{ marginTop: 'var(--space-2)' }}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="is4Ps"
                      checked={formData.is4Ps}
                      onChange={handleChange}
                    />
                    <span>4Ps Beneficiary</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="isIndigent"
                      checked={formData.isIndigent}
                      onChange={handleChange}
                    />
                    <span>Indigent</span>
                  </label>
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="isOFW"
                      checked={formData.isOFW}
                      onChange={handleChange}
                    />
                    <span>Overseas Filipino Worker (OFW)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Employment Tab */}
            {activeTab === 'employment' && (
              <div className="d-flex flex-column gap-4">
                <div className="form-group">
                  <label className="form-label">Employment Status</label>
                  <select
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="Employed">Employed</option>
                    <option value="Unemployed">Unemployed</option>
                    <option value="Self-employed">Self-employed</option>
                    <option value="Student">Student</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                {(formData.employmentStatus === 'Employed' || formData.employmentStatus === 'Self-employed') && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Occupation</label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="e.g., Teacher, Driver, Vendor"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Employer/Business Name</label>
                      <input
                        type="text"
                        name="employer"
                        value={formData.employer}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Company or business name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Monthly Income (₱)</label>
                      <input
                        type="number"
                        name="monthlyIncome"
                        value={formData.monthlyIncome}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Emergency Contact Tab */}
            {activeTab === 'emergency' && (
              <div className="d-flex flex-column gap-4">
                <div className="form-group">
                  <label className="form-label">Emergency Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Full name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Relationship</label>
                  <input
                    type="text"
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Spouse, Parent, Sibling"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="tel"
                    name="emergencyContactNumber"
                    value={formData.emergencyContactNumber}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
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
                  <Save size={16} />
                  {isEditMode ? 'Update Resident' : 'Add Resident'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResidentFormModal;