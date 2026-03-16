// src/pages/Residents.jsx
import React, { useState, useEffect, useRef } from 'react';
import StatCard from '../components/layout/common/StatCard';
import ResidentFormModal from '../components/residents/ResidentFormModal';
import ResidentViewModal from '../components/residents/ResidentViewModal';
import HouseholdModal from '../components/residents/HouseholdModal';
import { exportResidentsToCSV, parseResidentsCSV } from '../utils/csvExport';
import { addResident } from '../services/residentsService';
import { useAuth } from '../hooks/useAuth';
import {
  Users, UserCheck, Vote, Plus, Filter, Download, Upload,
  Search, ChevronRight, Loader, AlertCircle, X, Eye, Edit,
  Trash2, Home, CheckCircle, FileText
} from 'lucide-react';
import { useResidents } from '../hooks/useResidents';

const Residents = () => {
  const {
    residents, loading, error, stats, hasMore,
    loadResidents, loadMore, search, loadByCategory,
    loadStatistics, remove, clearError
  } = useResidents();

  const { currentUser } = useAuth();
  const fileInputRef = useRef();

  const [searchQuery, setSearchQuery]           = useState('');
  const [activeFilter, setActiveFilter]         = useState('all');
  const [showAddModal, setShowAddModal]         = useState(false);
  const [showViewModal, setShowViewModal]       = useState(false);
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [editingResident, setEditingResident]   = useState(null);
  const [viewingResident, setViewingResident]   = useState(null);

  // Import state
  const [importing, setImporting]     = useState(false);
  const [importResult, setImportResult] = useState(null); // { imported, errors }

  useEffect(() => {
    loadResidents(15, true);
    loadStatistics();
  }, []);

  const filterButtons = [
    { id: 'all',    label: 'All Residents',   icon: Users     },
    { id: 'senior', label: 'Senior Citizens', icon: UserCheck },
    { id: 'pwd',    label: 'PWD',             icon: Users     },
    { id: 'voters', label: 'Voters',          icon: Vote      },
  ];

  const handleFilterChange = async (filterId) => {
    setActiveFilter(filterId);
    if (filterId === 'all') await loadResidents(15, true);
    else await loadByCategory(filterId);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    clearTimeout(window.searchTimeout);
    if (value.trim() === '') loadResidents(15, true);
    else window.searchTimeout = setTimeout(() => search(value, { status: 'Active' }), 400);
  };

  const handleView = (resident) => { setViewingResident(resident); setShowViewModal(true); };
  const handleEdit = (resident) => { setEditingResident(resident); setShowAddModal(true); };

  const handleDelete = async (resident) => {
    const name = `${resident.personalInfo.firstName} ${resident.personalInfo.lastName}`;
    if (window.confirm(`Deactivate ${name}? They will be marked as Inactive.`)) {
      const result = await remove(resident.id);
      if (result.success) loadStatistics();
      else alert('Failed: ' + result.error);
    }
  };

  const handleModalClose   = () => { setShowAddModal(false); setEditingResident(null); };
  const handleModalSuccess = () => { handleModalClose(); loadResidents(15, true); loadStatistics(); };

  // ── CSV Export ──
  const handleExport = () => {
    if (residents.length === 0) { alert('No residents to export.'); return; }
    exportResidentsToCSV(residents);
  };

  // ── CSV Import ──
  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    const text = await file.text();
    const { data, errors } = parseResidentsCSV(text);

    let imported = 0;
    const userId = currentUser?.uid || null;

    for (const row of data) {
      const result = await addResident(row, userId);
      if (result.success) imported++;
      else errors.push(`Failed to save ${row.personalInfo?.firstName} ${row.personalInfo?.lastName}: ${result.error}`);
    }

    setImportResult({ imported, errors });
    setImporting(false);
    fileInputRef.current.value = '';
    loadResidents(15, true);
    loadStatistics();
  };

  const getFullName = (p) =>
    `${p.firstName}${p.middleName ? ' ' + p.middleName : ''} ${p.lastName}${p.suffix ? ' ' + p.suffix : ''}`.trim();

  const getAvatar = (resident) => {
    if (resident.documents?.profilePhoto) return resident.documents.profilePhoto;
    const n = `${resident.personalInfo.firstName[0]}${resident.personalInfo.lastName[0]}`;
    return `https://ui-avatars.com/api/?name=${n}&background=3b82f6&color=fff&size=80`;
  };

  const getStatusBadge = (status) => {
    const map = {
      Active:      { bg: '#d1fae5', color: '#065f46' },
      Inactive:    { bg: '#f3f4f6', color: '#374151' },
      Deceased:    { bg: '#fee2e2', color: '#991b1b' },
      'Moved Out': { bg: '#fef3c7', color: '#92400e' },
    };
    return map[status] || map.Active;
  };

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Residents Management</h1>
          <p className="page-subtitle">Manage and view all resident records</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-md" onClick={() => setShowHouseholdModal(true)}>
            <Home size={18} /> Households
          </button>
          <button className="btn btn-primary btn-md" onClick={() => { setEditingResident(null); setShowAddModal(true); }}>
            <Plus size={18} /> Add New Resident
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} color="#dc2626" />
            <span style={{ color: '#991b1b', fontWeight: 500 }}>{error}</span>
          </div>
          <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X size={18} /></button>
        </div>
      )}

      {/* Import result banner */}
      {importResult && (
        <div style={{
          background: importResult.errors.length > 0 ? '#fffbeb' : '#f0fdf4',
          border: `1px solid ${importResult.errors.length > 0 ? '#fde68a' : '#bbf7d0'}`,
          borderRadius: 12, padding: '14px 18px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: importResult.errors.length > 0 ? 8 : 0 }}>
            <CheckCircle size={16} color={importResult.errors.length > 0 ? '#d97706' : '#16a34a'} />
            <span style={{ fontWeight: 600, fontSize: 14, color: importResult.errors.length > 0 ? '#92400e' : '#166534' }}>
              Imported {importResult.imported} resident{importResult.imported !== 1 ? 's' : ''} successfully
              {importResult.errors.length > 0 ? `, ${importResult.errors.length} skipped` : ''}
            </span>
            <button onClick={() => setImportResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}><X size={15} /></button>
          </div>
          {importResult.errors.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#92400e' }}>
              {importResult.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
              {importResult.errors.length > 5 && <li>...and {importResult.errors.length - 5} more</li>}
            </ul>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Total Residents"   value={stats?.total?.toLocaleString()          || '0'} icon={Users}     iconBg="icon-bg-primary"
          badge={stats ? `${stats.male || 0} Male / ${stats.female || 0} Female` : 'Loading...'} badgeColor="badge-success" />
        <StatCard title="Senior Citizens"   value={stats?.seniorCitizens?.toLocaleString() || '0'} icon={UserCheck} iconBg="icon-bg-secondary"
          badge={stats?.total ? `${((stats.seniorCitizens/stats.total)*100).toFixed(1)}% of total` : '0%'} badgeColor="badge-gray" />
        <StatCard title="PWD Residents"     value={stats?.pwd?.toLocaleString()            || '0'} icon={Users}     iconBg="icon-bg-warning"
          badge={stats?.total ? `${((stats.pwd/stats.total)*100).toFixed(1)}% of total` : '0%'} badgeColor="badge-gray" />
        <StatCard title="Registered Voters" value={stats?.voters?.toLocaleString()         || '0'} icon={Vote}      iconBg="icon-bg-success"
          badge={stats?.total ? `${((stats.voters/stats.total)*100).toFixed(1)}% of total` : '0%'} badgeColor="badge-gray" />
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-buttons-group">
          {filterButtons.map(btn => {
            const Icon = btn.icon;
            return (
              <button key={btn.id} onClick={() => handleFilterChange(btn.id)} disabled={loading}
                className={`filter-btn ${activeFilter === btn.id ? 'active' : ''}`}>
                <Icon size={16} strokeWidth={1.5} />{btn.label}
              </button>
            );
          })}
        </div>
        <div className="action-buttons-group">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Search by name, address, contact..."
              value={searchQuery} onChange={handleSearch} disabled={loading}
              className="form-input" style={{ paddingLeft: 38, minWidth: 280 }} />
          </div>
          <button className="btn btn-secondary btn-md" disabled={loading}><Filter size={16} />Filter</button>

          {/* CSV Import */}
          <button className="btn btn-secondary btn-md" disabled={importing}
            onClick={() => fileInputRef.current?.click()}>
            {importing ? <><Loader size={15} className="animate-spin" />Importing...</> : <><Upload size={15} />Import CSV</>}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportFile} />

          {/* CSV Export */}
          <button className="btn btn-secondary btn-md" disabled={loading || residents.length === 0}
            onClick={handleExport}>
            <Download size={16} />Export CSV
          </button>
        </div>
      </div>

      {/* CSV template hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 12, color: '#94a3b8' }}>
        <FileText size={12} />
        <span>Import tip: Export a sample first to see the expected CSV format, then fill in your data.</span>
      </div>

      {/* Table */}
      <div className="data-table-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Resident</th>
                <th>Address</th>
                <th>Contact</th>
                <th>Age</th>
                <th>Status / Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && residents.length === 0 ? (
                <tr><td colSpan="6">
                  <div className="empty-state">
                    <Loader size={32} className="animate-spin" style={{ color: '#3b82f6' }} />
                    <p style={{ marginTop: 12, color: '#64748b' }}>Loading residents...</p>
                  </div>
                </td></tr>
              ) : residents.length > 0 ? residents.map(r => {
                const st = getStatusBadge(r.systemInfo.status);
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="user-info-cell">
                        <img src={getAvatar(r)} alt="" className="avatar" />
                        <div className="user-details">
                          <span className="user-name">{getFullName(r.personalInfo)}</span>
                          <span className="user-meta">{r.personalInfo.gender} • {r.personalInfo.civilStatus}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-secondary" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.address.fullAddress || r.address.purok || '—'}
                    </td>
                    <td className="text-secondary">{r.contactInfo.mobileNumber || '—'}</td>
                    <td className="text-secondary">{r.personalInfo.age || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                          {r.systemInfo.status}
                        </span>
                        {r.statusFlags.isSeniorCitizen && <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#ede9fe', color: '#6d28d9' }}>Senior</span>}
                        {r.statusFlags.isPWD           && <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#ffedd5', color: '#c2410c' }}>PWD</span>}
                        {r.statusFlags.isVoter         && <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#dbeafe', color: '#1d4ed8' }}>Voter</span>}
                        {r.statusFlags.is4Ps           && <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#dcfce7', color: '#166534' }}>4Ps</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon btn-icon-sm" onClick={() => handleView(r)} title="View Profile"><Eye size={15} /></button>
                        <button className="btn-icon btn-icon-sm" onClick={() => handleEdit(r)} title="Edit Resident"><Edit size={15} /></button>
                        <button className="btn-icon btn-icon-sm" onClick={() => handleDelete(r)} title="Deactivate"
                          style={{ color: '#ef4444' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="6">
                  <div className="empty-state">
                    <Users size={40} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 12px' }} />
                    <h3 className="empty-state-title">No residents found</h3>
                    <p className="empty-state-description">
                      {searchQuery ? 'Try a different search term' : 'Click "Add New Resident" or "Import CSV" to get started'}
                    </p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {residents.length > 0 && (
          <div className="pagination-container">
            <p className="pagination-info">
              Showing {residents.length}{stats?.total ? ` of ${stats.total} total` : ''} residents
            </p>
            {hasMore && (
              <button className="btn btn-secondary btn-sm" onClick={loadMore} disabled={loading}>
                {loading ? <><Loader size={14} className="animate-spin" />Loading...</> : <>Load More <ChevronRight size={14} /></>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ResidentFormModal isOpen={showAddModal} onClose={handleModalClose} resident={editingResident} onSuccess={handleModalSuccess} />
      <ResidentViewModal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setViewingResident(null); }} resident={viewingResident} onEdit={(r) => { setShowViewModal(false); handleEdit(r); }} />
      <HouseholdModal isOpen={showHouseholdModal} onClose={() => setShowHouseholdModal(false)} onSuccess={() => { setShowHouseholdModal(false); loadResidents(15, true); }} />
    </div>
  );
};

export default Residents;