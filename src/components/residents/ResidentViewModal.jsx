import React from 'react';
import { X, Edit, User, MapPin, Phone, Briefcase, Heart, FileText, Shield, Download } from 'lucide-react';

const Section = ({ icon: Icon, title, children }) => (
  <div style={{ marginBottom: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
      <Icon size={17} color="#3b82f6" />
      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{title}</h4>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
      {children}
    </div>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: '14px', color: value ? '#0f172a' : '#cbd5e1', fontWeight: value ? 500 : 400 }}>{value || '—'}</p>
  </div>
);

const Tag = ({ label, bg, color }) => (
  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: bg, color }}>{label}</span>
);

const ResidentViewModal = ({ isOpen, onClose, resident, onEdit }) => {
  if (!isOpen || !resident) return null;
  const p = resident.personalInfo;
  const c = resident.contactInfo;
  const a = resident.address;
  const sf = resident.statusFlags;
  const em = resident.employment;
  const ec = resident.emergencyContact;

  const getFullName = () =>
    `${p.firstName}${p.middleName ? ' ' + p.middleName : ''} ${p.lastName}${p.suffix ? ' ' + p.suffix : ''}`.trim();

  const getAvatar = () => {
    if (resident.documents?.profilePhoto) return resident.documents.profilePhoto;
    return `https://ui-avatars.com/api/?name=${p.firstName[0]}${p.lastName[0]}&background=3b82f6&color=fff&size=120`;
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    try { return ts.toDate ? ts.toDate().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'; }
    catch { return '—'; }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '760px', maxHeight: '90vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <h3 className="modal-title"><User size={20} style={{ marginRight: '8px' }} />Resident Profile</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(resident)}><Edit size={15} />Edit</button>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: 'calc(90vh - 130px)', overflowY: 'auto', padding: '24px' }}>
          {/* Profile Header */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '28px', padding: '20px', background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', borderRadius: '16px', border: '1px solid #dbeafe' }}>
            <img src={getAvatar()} alt={getFullName()} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{getFullName()}</h2>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>
                {resident.residentNumber || 'No ID'} • {p.gender} • {p.age} years old
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Tag label={resident.systemInfo.status} bg={resident.systemInfo.status === 'Active' ? '#d1fae5' : '#fee2e2'} color={resident.systemInfo.status === 'Active' ? '#065f46' : '#991b1b'} />
                {sf.isSeniorCitizen && <Tag label="Senior Citizen" bg="#ede9fe" color="#6d28d9" />}
                {sf.isPWD && <Tag label="PWD" bg="#ffedd5" color="#c2410c" />}
                {sf.isVoter && <Tag label="Registered Voter" bg="#dbeafe" color="#1d4ed8" />}
                {sf.is4Ps && <Tag label="4Ps Beneficiary" bg="#dcfce7" color="#166534" />}
                {sf.isIndigent && <Tag label="Indigent" bg="#fef3c7" color="#92400e" />}
                {sf.isOFW && <Tag label="OFW" bg="#f0fdf4" color="#15803d" />}
              </div>
            </div>
          </div>

          <Section icon={User} title="Personal Information">
            <Field label="First Name" value={p.firstName} />
            <Field label="Last Name" value={p.lastName} />
            <Field label="Middle Name" value={p.middleName} />
            <Field label="Suffix" value={p.suffix} />
            <Field label="Nickname" value={p.nickname} />
            <Field label="Birth Date" value={formatDate(p.birthDate)} />
            <Field label="Age" value={p.age ? `${p.age} years old` : null} />
            <Field label="Gender" value={p.gender} />
            <Field label="Civil Status" value={p.civilStatus} />
            <Field label="Nationality" value={p.nationality} />
            <Field label="Religion" value={p.religion} />
            <Field label="Blood Type" value={p.bloodType} />
          </Section>

          <Section icon={Phone} title="Contact Information">
            <Field label="Mobile Number" value={c.mobileNumber} />
            <Field label="Landline" value={c.landlineNumber} />
            <Field label="Email Address" value={c.email} />
          </Section>

          <Section icon={MapPin} title="Address">
            <Field label="Full Address" value={a.fullAddress} />
            <Field label="Purok" value={a.purok} />
            <Field label="Street" value={a.street} />
            <Field label="Block / Lot" value={[a.block && `Block ${a.block}`, a.lot && `Lot ${a.lot}`].filter(Boolean).join(', ')} />
          </Section>

          <Section icon={Briefcase} title="Employment">
            <Field label="Employment Status" value={em.status} />
            <Field label="Occupation" value={em.occupation} />
            <Field label="Employer" value={em.employer} />
            <Field label="Monthly Income" value={em.monthlyIncome ? `₱${Number(em.monthlyIncome).toLocaleString()}` : null} />
          </Section>

          <Section icon={Shield} title="Special Status / IDs">
            {sf.isVoter && <Field label="Voter ID Number" value={sf.voterIdNumber} />}
            {sf.isPWD && <Field label="PWD ID Number" value={sf.pwdIdNumber} />}
            {sf.isSeniorCitizen && <Field label="Senior Citizen ID" value={sf.seniorCitizenIdNumber} />}
          </Section>

          <Section icon={Heart} title="Emergency Contact">
            <Field label="Name" value={ec.name} />
            <Field label="Relationship" value={ec.relationship} />
            <Field label="Contact Number" value={ec.contactNumber} />
          </Section>
        </div>
      </div>
    </div>
  );
};

export default ResidentViewModal;
