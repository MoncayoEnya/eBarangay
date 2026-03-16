// src/components/residents/HouseholdModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, Home, Save, Loader, Search, ChevronDown } from 'lucide-react';
import { useResidents } from '../../hooks/useResidents';

const RELATIONSHIPS = ['Spouse','Son','Daughter','Parent','Sibling','Grandchild','Grandparent','Relative','Other'];
const PUROKS = ['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7','Purok 8','Purok 9','Purok 10'];

const HouseholdModal = ({ isOpen, onClose, household = null, onSuccess }) => {
  const { residents, loadResidents, loading: resLoading } = useResidents();
  const [householdName, setHouseholdName] = useState('');
  const [address, setAddress]             = useState('');
  const [purok, setPurok]                 = useState('');
  const [headId, setHeadId]               = useState('');
  const [members, setMembers]             = useState([{ residentId: '', relationship: 'Spouse' }]);
  const [saving, setSaving]               = useState(false);
  const [errors, setErrors]               = useState({});
  const [headSearch, setHeadSearch]       = useState('');
  const [showHeadDrop, setShowHeadDrop]   = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadResidents(200, true);
      if (household) {
        setHouseholdName(household.name || '');
        setAddress(household.address || '');
        setPurok(household.purok || '');
        setHeadId(household.headId || '');
        setMembers(household.members?.length ? household.members : [{ residentId: '', relationship: 'Spouse' }]);
      } else {
        setHouseholdName(''); setAddress(''); setPurok('');
        setHeadId(''); setMembers([{ residentId: '', relationship: 'Spouse' }]);
      }
      setErrors({}); setHeadSearch('');
    }
  }, [isOpen, household]);

  if (!isOpen) return null;

  const getName = (id) => {
    const r = residents.find(r => r.id === id);
    return r ? `${r.personalInfo.firstName} ${r.personalInfo.lastName}` : '';
  };

  const filteredForHead = residents.filter(r => {
    const n = `${r.personalInfo.firstName} ${r.personalInfo.lastName}`.toLowerCase();
    return n.includes(headSearch.toLowerCase());
  }).slice(0, 8);

  const addMember    = () => setMembers(p => [...p, { residentId: '', relationship: 'Relative' }]);
  const removeMember = (i) => setMembers(p => p.filter((_, idx) => idx !== i));
  const setMember    = (i, field, val) =>
    setMembers(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const validate = () => {
    const e = {};
    if (!householdName.trim()) e.name   = 'Household name is required';
    if (!headId)               e.headId = 'Household head is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: householdName, address, purok,
      headId, headName: getName(headId),
      members: members.filter(m => m.residentId),
      memberCount: members.filter(m => m.residentId).length + 1,
    };
    console.log('Household payload (wire to householdService):', payload);
    // TODO: await householdService.save(payload)
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    onSuccess?.(payload);
    onClose();
  };

  const headName = getName(headId);
  const memberCount = members.filter(m => m.residentId).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580,
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(15,23,42,0.18)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Home size={20} color="#3b82f6" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {household ? 'Edit Household' : 'Create Household'}
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Map residents to a household unit</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Name + address */}
          <div className="form-group">
            <label className="form-label">Household Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input className={`form-input ${errors.name ? 'error' : ''}`} value={householdName}
              onChange={e => { setHouseholdName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
              placeholder="e.g. Santos Family Household" />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Address / Street</label>
              <input className="form-input" value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Rizal St." />
            </div>
            <div className="form-group">
              <label className="form-label">Purok</label>
              <select className="form-select" value={purok} onChange={e => setPurok(e.target.value)}>
                <option value="">Select purok</option>
                {PUROKS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Household head */}
          <div className="form-group">
            <label className="form-label">Household Head <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowHeadDrop(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', border: `1.5px solid ${errors.headId ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: 10, cursor: 'pointer', background: '#fff', fontSize: 14,
                  color: headId ? '#0f172a' : '#94a3b8',
                }}
              >
                {headId ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                      {headName.charAt(0)}
                    </div>
                    {headName}
                  </div>
                ) : 'Select household head'}
                <ChevronDown size={15} color="#94a3b8" />
              </div>

              {showHeadDrop && (
                <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 100 }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input className="form-input" value={headSearch}
                        onChange={e => setHeadSearch(e.target.value)}
                        placeholder="Search residents..."
                        style={{ paddingLeft: 32, fontSize: 13, padding: '7px 10px 7px 32px' }}
                        autoFocus />
                    </div>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {resLoading ? (
                      <p style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: 0 }}>Loading...</p>
                    ) : filteredForHead.length === 0 ? (
                      <p style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8', textAlign: 'center', margin: 0 }}>No residents found</p>
                    ) : filteredForHead.map(r => (
                      <button key={r.id} onClick={() => { setHeadId(r.id); setShowHeadDrop(false); setHeadSearch(''); if (errors.headId) setErrors(p => ({ ...p, headId: '' })); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '10px 16px', background: r.id === headId ? '#eff6ff' : 'none',
                          border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13,
                          color: '#374151',
                        }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                          {r.personalInfo.firstName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 500 }}>{r.personalInfo.firstName} {r.personalInfo.lastName}</p>
                          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{r.address?.purok || ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.headId && <span className="form-error">{errors.headId}</span>}
          </div>

          {/* Members */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label className="form-label" style={{ margin: 0 }}>Additional Members</label>
              <button className="btn btn-secondary btn-sm" onClick={addMember} type="button">
                <Plus size={13} /> Add Member
              </button>
            </div>

            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 10, border: '1px dashed #e2e8f0' }}>
                No additional members. Click "Add Member" above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <select className="form-select" style={{ flex: 2, fontSize: 13 }} value={m.residentId}
                      onChange={e => setMember(i, 'residentId', e.target.value)}>
                      <option value="">— Select resident —</option>
                      {residents.filter(r => r.id !== headId).map(r => (
                        <option key={r.id} value={r.id}>
                          {r.personalInfo.firstName} {r.personalInfo.lastName} ({r.address?.purok || 'No purok'})
                        </option>
                      ))}
                    </select>
                    <select className="form-select" style={{ flex: 1, fontSize: 13 }} value={m.relationship}
                      onChange={e => setMember(i, 'relationship', e.target.value)}>
                      {RELATIONSHIPS.map(rel => <option key={rel} value={rel}>{rel}</option>)}
                    </select>
                    <button className="btn-icon btn-icon-sm" onClick={() => removeMember(i)} style={{ color: '#ef4444', flexShrink: 0 }} type="button">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary card */}
          {headId && (
            <div style={{ padding: '14px 18px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Users size={14} color="#3b82f6" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>Household Summary</span>
              </div>
              <div style={{ fontSize: 13, color: '#374151', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <span><strong>Head:</strong> {headName}</span>
                <span><strong>Purok:</strong> {purok || '—'}</span>
                <span><strong>Members:</strong> {memberCount} additional</span>
                <span><strong>Total:</strong> {memberCount + 1} person(s)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', background: '#fafafa', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-md" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary btn-md" onClick={handleSave} disabled={saving || resLoading} type="button">
            {saving ? <><Loader size={15} className="animate-spin" />Saving...</> : <><Save size={16} />Save Household</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HouseholdModal;