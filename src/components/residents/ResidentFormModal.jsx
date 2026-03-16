import React, { useState, useEffect } from 'react';
import { X, Save, Loader, User, MapPin, Phone, Briefcase, Heart, Shield, ChevronRight, ChevronLeft } from 'lucide-react';
import { useResidents } from '../../hooks/useResidents';

const PUROKS = ['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7','Purok 8','Purok 9','Purok 10'];

const tabs = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'contact', label: 'Contact & Address', icon: MapPin },
  { id: 'status', label: 'Status & IDs', icon: Shield },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'emergency', label: 'Emergency', icon: Heart },
];

const Field = ({ label, required, error, hint, children }) => (
  <div className="form-group">
    <label className="form-label">{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
    {children}
    {hint && !error && <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'block' }}>{hint}</span>}
    {error && <span className="form-error">{error}</span>}
  </div>
);

const ResidentFormModal = ({ isOpen, onClose, resident = null, onSuccess }) => {
  const { create, update, loading } = useResidents();
  const isEdit = !!resident;
  const [activeTab, setActiveTab] = useState('personal');
  const [errors, setErrors] = useState({});

  const emptyForm = {
    firstName: '', middleName: '', lastName: '', suffix: '', nickname: '',
    birthDate: '', gender: '', civilStatus: '', nationality: 'Filipino', religion: '', bloodType: '',
    email: '', mobileNumber: '', landlineNumber: '',
    purok: '', block: '', lot: '', street: '', fullAddress: '',
    isVoter: false, voterIdNumber: '', isPWD: false, pwdIdNumber: '',
    isSeniorCitizen: false, seniorCitizenIdNumber: '', is4Ps: false, isIndigent: false, isOFW: false,
    employmentStatus: 'Unemployed', occupation: '', employer: '', monthlyIncome: '',
    emergencyContactName: '', emergencyContactRelationship: '', emergencyContactNumber: '',
    latitude: '', longitude: '',
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (resident) {
      const p = resident.personalInfo, c = resident.contactInfo, a = resident.address;
      const sf = resident.statusFlags, em = resident.employment, ec = resident.emergencyContact;
      setForm({
        firstName: p.firstName || '', middleName: p.middleName || '', lastName: p.lastName || '',
        suffix: p.suffix || '', nickname: p.nickname || '',
        birthDate: p.birthDate?.toDate?.()?.toISOString().split('T')[0] || '',
        gender: p.gender || '', civilStatus: p.civilStatus || '',
        nationality: p.nationality || 'Filipino', religion: p.religion || '', bloodType: p.bloodType || '',
        email: c.email || '', mobileNumber: c.mobileNumber || '', landlineNumber: c.landlineNumber || '',
        purok: a.purok || '', block: a.block || '', lot: a.lot || '', street: a.street || '', fullAddress: a.fullAddress || '',
        latitude:  a.coordinates?.latitude  || '',
        longitude: a.coordinates?.longitude || '',
        isVoter: sf.isVoter || false, voterIdNumber: sf.voterIdNumber || '',
        isPWD: sf.isPWD || false, pwdIdNumber: sf.pwdIdNumber || '',
        isSeniorCitizen: sf.isSeniorCitizen || false, seniorCitizenIdNumber: sf.seniorCitizenIdNumber || '',
        is4Ps: sf.is4Ps || false, isIndigent: sf.isIndigent || false, isOFW: sf.isOFW || false,
        employmentStatus: em.status || 'Unemployed', occupation: em.occupation || '',
        employer: em.employer || '', monthlyIncome: em.monthlyIncome || '',
        emergencyContactName: ec.name || '', emergencyContactRelationship: ec.relationship || '',
        emergencyContactNumber: ec.contactNumber || '',
      });
    } else {
      setForm(emptyForm);
    }
    setActiveTab('personal');
    setErrors({});
  }, [resident, isOpen]);

  // Auto-calc age & senior flag
  useEffect(() => {
    if (!form.birthDate) return;
    const bd = new Date(form.birthDate), today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--;
    if (age >= 60 && !form.isSeniorCitizen) setForm(p => ({ ...p, isSeniorCitizen: true }));
  }, [form.birthDate]);

  // Auto-build fullAddress
  useEffect(() => {
    const parts = [form.lot && `Lot ${form.lot}`, form.block && `Block ${form.block}`, form.street, form.purok].filter(Boolean);
    if (parts.length) setForm(p => ({ ...p, fullAddress: parts.join(', ') }));
  }, [form.purok, form.block, form.lot, form.street]);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const calcAge = () => {
    if (!form.birthDate) return 0;
    const bd = new Date(form.birthDate), today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    if (today.getMonth() < bd.getMonth() || (today.getMonth() === bd.getMonth() && today.getDate() < bd.getDate())) age--;
    return age;
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.birthDate) e.birthDate = 'Required';
    if (!form.gender) e.gender = 'Required';
    if (!form.civilStatus) e.civilStatus = 'Required';
    if (!form.purok) e.purok = 'Required';
    if (form.mobileNumber && !/^(09|\+639)\d{9}$/.test(form.mobileNumber.replace(/\s|-/g, '')))
      e.mobileNumber = 'Invalid format (09XX XXX XXXX)';
    setErrors(e);
    if (Object.keys(e).length) {
      const tabMap = { firstName: 'personal', lastName: 'personal', birthDate: 'personal', gender: 'personal', civilStatus: 'personal', purok: 'contact', mobileNumber: 'contact' };
      const firstErr = Object.keys(e)[0];
      if (tabMap[firstErr]) setActiveTab(tabMap[firstErr]);
    }
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form, age: calcAge() };
    const result = isEdit ? await update(resident.id, {
      'personalInfo.firstName': payload.firstName, 'personalInfo.middleName': payload.middleName,
      'personalInfo.lastName': payload.lastName, 'personalInfo.suffix': payload.suffix,
      'personalInfo.nickname': payload.nickname,
      'personalInfo.birthDate': payload.birthDate ? new Date(payload.birthDate) : null,
      'personalInfo.age': payload.age, 'personalInfo.gender': payload.gender,
      'personalInfo.civilStatus': payload.civilStatus, 'personalInfo.nationality': payload.nationality,
      'personalInfo.religion': payload.religion, 'personalInfo.bloodType': payload.bloodType,
      'contactInfo.email': payload.email, 'contactInfo.mobileNumber': payload.mobileNumber,
      'contactInfo.landlineNumber': payload.landlineNumber,
      'address.purok': payload.purok, 'address.block': payload.block, 'address.lot': payload.lot,
      'address.street': payload.street, 'address.fullAddress': payload.fullAddress,
      'address.coordinates.latitude':  payload.latitude  ? Number(payload.latitude)  : null,
      'address.coordinates.longitude': payload.longitude ? Number(payload.longitude) : null,
      'statusFlags.isVoter': payload.isVoter, 'statusFlags.voterIdNumber': payload.voterIdNumber,
      'statusFlags.isPWD': payload.isPWD, 'statusFlags.pwdIdNumber': payload.pwdIdNumber,
      'statusFlags.isSeniorCitizen': payload.isSeniorCitizen, 'statusFlags.seniorCitizenIdNumber': payload.seniorCitizenIdNumber,
      'statusFlags.is4Ps': payload.is4Ps, 'statusFlags.isIndigent': payload.isIndigent, 'statusFlags.isOFW': payload.isOFW,
      'employment.status': payload.employmentStatus, 'employment.occupation': payload.occupation,
      'employment.employer': payload.employer, 'employment.monthlyIncome': payload.monthlyIncome || 0,
      'emergencyContact.name': payload.emergencyContactName,
      'emergencyContact.relationship': payload.emergencyContactRelationship,
      'emergencyContact.contactNumber': payload.emergencyContactNumber,
    }) : await create(payload);

    if (result.success) { onSuccess?.(); onClose(); }
    else alert('Error: ' + result.error);
  };

  if (!isOpen) return null;

  const inp = (name, placeholder, type = 'text', extra = {}) => (
    <input type={type} name={name} value={form[name]} onChange={set} disabled={loading}
      className={`form-input ${errors[name] ? 'error' : ''}`} placeholder={placeholder} {...extra} />
  );

  const sel = (name, opts, placeholder = 'Select...') => (
    <select name={name} value={form[name]} onChange={set} disabled={loading}
      className={`form-select ${errors[name] ? 'error' : ''}`}>
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
    </select>
  );

  const chk = (name, label) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', borderRadius: '8px', background: form[name] ? '#eff6ff' : '#f8fafc', border: `1px solid ${form[name] ? '#bfdbfe' : '#e2e8f0'}`, transition: 'all 0.15s' }}>
      <input type="checkbox" name={name} checked={form[name]} onChange={set} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
      <span style={{ fontSize: '14px', fontWeight: 500, color: form[name] ? '#1d4ed8' : '#374151' }}>{label}</span>
    </label>
  );

  const tabContent = {
    personal: (
      <div className="d-flex flex-column gap-4">
        <div className="grid-2">
          <Field label="First Name" required error={errors.firstName}>{inp('firstName', 'Juan')}</Field>
          <Field label="Last Name" required error={errors.lastName}>{inp('lastName', 'Dela Cruz')}</Field>
        </div>
        <div className="grid-2">
          <Field label="Middle Name">{inp('middleName', 'Santos')}</Field>
          <Field label="Suffix">{sel('suffix', ['Jr.', 'Sr.', 'II', 'III', 'IV'])}</Field>
        </div>
        <div className="grid-2">
          <Field label="Nickname">{inp('nickname', 'Juan')}</Field>
          <Field label="Blood Type">{sel('bloodType', ['A+','A-','B+','B-','AB+','AB-','O+','O-'])}</Field>
        </div>
        <div className="grid-2">
          <Field label="Birth Date" required error={errors.birthDate}>
            {inp('birthDate', '', 'date')}
            {form.birthDate && <small style={{ color: '#64748b', fontSize: '12px' }}>Age: {calcAge()} years old {calcAge() >= 60 ? '• Auto-tagged as Senior Citizen' : ''}</small>}
          </Field>
          <Field label="Gender" required error={errors.gender}>
            {sel('gender', ['Male', 'Female'])}
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Civil Status" required error={errors.civilStatus}>
            {sel('civilStatus', ['Single','Married','Widowed','Separated','Annulled'])}
          </Field>
          <Field label="Nationality">{inp('nationality', 'Filipino')}</Field>
        </div>
        <div className="grid-2">
          <Field label="Religion">{inp('religion', 'Roman Catholic')}</Field>
        </div>
      </div>
    ),
    contact: (
      <div className="d-flex flex-column gap-4">
        <Field label="Mobile Number" error={errors.mobileNumber}>{inp('mobileNumber', '09XX XXX XXXX', 'tel')}</Field>
        <Field label="Landline Number">{inp('landlineNumber', '(032) XXX-XXXX', 'tel')}</Field>
        <Field label="Email Address">{inp('email', 'juan@email.com', 'email')}</Field>
        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
        <Field label="Purok" required error={errors.purok}>{sel('purok', PUROKS)}</Field>
        <div className="grid-2">
          <Field label="Street">{inp('street', 'Sampaguita St.')}</Field>
          <Field label="Block">{inp('block', '1')}</Field>
        </div>
        <div className="grid-2">
          <Field label="Lot">{inp('lot', '5')}</Field>
          <Field label="Full Address">
            <input type="text" name="fullAddress" value={form.fullAddress} onChange={set}
              className="form-input" placeholder="Auto-generated..." />
          </Field>
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={14} color="#3b82f6" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Geotagging</span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>(optional — for address mapping)</span>
        </div>
        <div className="grid-2">
          <Field label="Latitude" hint="e.g. 10.3157">
            <input type="number" name="latitude" value={form.latitude || ''} onChange={set}
              disabled={loading} className="form-input" placeholder="10.3157" step="0.000001" />
          </Field>
          <Field label="Longitude" hint="e.g. 123.8854">
            <input type="number" name="longitude" value={form.longitude || ''} onChange={set}
              disabled={loading} className="form-input" placeholder="123.8854" step="0.000001" />
          </Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
          <MapPin size={13} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 12, color: '#166534' }}>
            Get coordinates by right-clicking on <strong>Google Maps</strong> → "What's here?" then paste the numbers above.
          </span>
        </div>
      </div>
    ),
    status: (
      <div className="d-flex flex-column gap-4">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {chk('isVoter', 'Registered Voter')}
          {chk('isPWD', 'Person with Disability (PWD)')}
          {chk('isSeniorCitizen', 'Senior Citizen (60+)')}
          {chk('is4Ps', '4Ps Beneficiary')}
          {chk('isIndigent', 'Indigent')}
          {chk('isOFW', 'Overseas Filipino Worker')}
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9' }} />
        {form.isVoter && <Field label="Voter ID Number">{inp('voterIdNumber', 'VID-XXXXXX')}</Field>}
        {form.isPWD && <Field label="PWD ID Number">{inp('pwdIdNumber', 'PWD-XXXXXX')}</Field>}
        {form.isSeniorCitizen && <Field label="Senior Citizen ID Number">{inp('seniorCitizenIdNumber', 'SC-XXXXXX')}</Field>}
        {!form.isVoter && !form.isPWD && !form.isSeniorCitizen && (
          <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            Check any applicable status above to enter the corresponding ID number.
          </p>
        )}
      </div>
    ),
    employment: (
      <div className="d-flex flex-column gap-4">
        <Field label="Employment Status">
          {sel('employmentStatus', ['Employed','Unemployed','Self-employed','Student','Retired','OFW'])}
        </Field>
        {['Employed','Self-employed','OFW'].includes(form.employmentStatus) && <>
          <Field label="Occupation / Job Title">{inp('occupation', 'Teacher, Farmer, etc.')}</Field>
          <Field label="Employer / Company">{inp('employer', 'Company name')}</Field>
          <Field label="Monthly Income (₱)">{inp('monthlyIncome', '15000', 'number', { min: 0 })}</Field>
        </>}
        {form.employmentStatus === 'Student' && <Field label="School / Institution">{inp('employer', 'School name')}</Field>}
      </div>
    ),
    emergency: (
      <div className="d-flex flex-column gap-4">
        <p style={{ color: '#64748b', fontSize: '13px', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', margin: 0 }}>
          In case of emergency, who should we contact?
        </p>
        <Field label="Full Name">{inp('emergencyContactName', 'Maria Santos')}</Field>
        <Field label="Relationship">{sel('emergencyContactRelationship', ['Spouse','Parent','Child','Sibling','Relative','Friend','Guardian'])}</Field>
        <Field label="Contact Number">{inp('emergencyContactNumber', '09XX XXX XXXX', 'tel')}</Field>
      </div>
    ),
  };

  const tabIdx = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className="modal-overlay" onClick={() => !loading && onClose()}>
      <div className="modal" style={{ maxWidth: '680px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h3 className="modal-title"><User size={20} style={{ marginRight: '8px' }} />{isEdit ? 'Edit Resident' : 'Add New Resident'}</h3>
          <button className="btn-icon" onClick={onClose} disabled={loading}><X size={20} /></button>
        </div>

        {/* Tab Nav */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fafbfc', padding: '0 24px', overflowX: 'auto', flexShrink: 0 }}>
          {tabs.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', border: 'none', borderBottom: `2px solid ${isActive ? '#3b82f6' : 'transparent'}`, background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: isActive ? 600 : 500, color: isActive ? '#3b82f6' : '#64748b', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                <Icon size={15} />{tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {tabContent[activeTab]}
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {tabIdx > 0 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab(tabs[tabIdx - 1].id)}>
                  <ChevronLeft size={15} />Back
                </button>
              )}
              {tabIdx < tabs.length - 1 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab(tabs[tabIdx + 1].id)}>
                  Next<ChevronRight size={15} />
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><Loader size={15} className="animate-spin" />Saving...</> : <><Save size={15} />{isEdit ? 'Save Changes' : 'Add Resident'}</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResidentFormModal;