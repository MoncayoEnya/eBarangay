// src/pages/Incidents.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import IncidentFormModal from '../components/incidents/IncidentFormModal';
import IncidentViewModal from '../components/incidents/IncidentViewModal';
import {
  AlertCircle,
  Scale,
  CheckCircle,
  Timer,
  Eye,
  Send,
  MoreVertical,
  Download,
  Plus,
  FileText,
  List,
  Lock,
  Volume2,
  Home,
  AlertTriangle,
  Search,
  MapPin,
  Loader,
  X,
  Edit
} from 'lucide-react';
import { useIncidents } from '../hooks/useIncidents';

const Incidents = () => {
  const {
    incidents,
    loading,
    error,
    stats,
    hasMore,
    loadIncidents,
    loadMore,
    search,
    loadByStatus,
    loadStatistics,
    clearError
  } = useIncidents();

  const [activeFilter, setActiveFilter]       = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [searchQuery, setSearchQuery]         = useState('');
  const [showFormModal, setShowFormModal]     = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [showViewModal, setShowViewModal]     = useState(false);
  const [viewingIncident, setViewingIncident] = useState(null);

  useEffect(() => {
    loadIncidents(50, true);
    loadStatistics();
  }, []);

  const filterButtons = [
    { id: 'all',              label: 'All Cases',  icon: List        },
    { id: 'Open',             label: 'Open',       icon: FileText    },
    { id: 'Under Mediation',  label: 'Mediation',  icon: Scale       },
    { id: 'Resolved',         label: 'Resolved',   icon: CheckCircle },
  ];

  const handleFilterChange = async (filterId) => {
    setActiveFilter(filterId);
    if (filterId === 'all') await loadIncidents(50, true);
    else await loadByStatus(filterId);
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim() === '') {
      await loadIncidents(50, true);
    } else {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(async () => {
        await search(value, {
          status:   activeFilter !== 'all'            ? activeFilter      : undefined,
          category: selectedCategory !== 'All categories' ? selectedCategory : undefined,
        });
      }, 500);
    }
  };

  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    if (searchQuery.trim() !== '') {
      await search(searchQuery, {
        status:   activeFilter !== 'all'      ? activeFilter : undefined,
        category: category !== 'All categories' ? category   : undefined,
      });
    } else if (activeFilter !== 'all') {
      await loadByStatus(activeFilter);
    } else {
      await loadIncidents(50, true);
    }
  };

  const handleView = (incident) => {
    setViewingIncident(incident);
    setShowViewModal(true);
  };

  const handleEdit = (incident) => {
    setEditingIncident(incident);
    setShowFormModal(true);
  };

  const handleSendSummon = (incident) => {
    alert(`Sending summon for case ${incident.caseNumber} to ${incident.complainant.name}`);
  };

  const handleMore = (incident) => {
    alert(`More options for case ${incident.caseNumber}`);
  };

  const handleNewIncident = () => {
    setEditingIncident(null);
    setShowFormModal(true);
  };

  const handleFormSuccess = () => {
    loadIncidents(50, true);
    loadStatistics();
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setEditingIncident(null);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setViewingIncident(null);
  };

  const handleViewSuccess = () => {
    loadIncidents(50, true);
    loadStatistics();
  };

  const getCategoryIcon = (categoryType) => {
    switch (categoryType) {
      case 'dispute':  return Scale;
      case 'theft':    return Lock;
      case 'noise':    return Volume2;
      case 'property': return Home;
      default:         return AlertTriangle;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getAvatarBg = (color) => {
    const colors = {
      primary:   '#3b82f6',
      error:     '#ef4444',
      secondary: '#8b5cf6',
      warning:   '#f59e0b',
      success:   '#10b981',
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Incident & Blotter Management</h1>
          <p className="page-subtitle">Track and manage barangay incidents and disputes</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={handleNewIncident}>
          <Plus size={18} strokeWidth={2} />
          New Incident Report
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{ background: 'var(--color-error-light)', border: '1px solid var(--color-error)', marginBottom: 'var(--space-6)' }}>
          <div className="card-body">
            <div className="d-flex align-center justify-between">
              <div className="d-flex align-center gap-3">
                <AlertCircle size={24} style={{ color: 'var(--color-error)' }} />
                <div>
                  <h4 className="fw-semibold" style={{ color: 'var(--color-error)' }}>Error</h4>
                  <p className="text-secondary">{error}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={clearError}><X size={20} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Open Cases"        value={stats?.open?.toLocaleString()          || '0'} icon={AlertCircle} iconBg="icon-bg-error"     badge="Requires attention" badgeColor="badge-error"   />
        <StatCard title="Under Mediation"   value={stats?.underMediation?.toLocaleString() || '0'} icon={Scale}       iconBg="icon-bg-primary"   badge="Lupon processing"   badgeColor="badge-primary" />
        <StatCard title="Resolved (Month)"  value={stats?.resolved?.toLocaleString()       || '0'} icon={CheckCircle} iconBg="icon-bg-success"   badge="↑ This month"       badgeColor="badge-success" />
        <StatCard title="Total Cases"       value={stats?.total?.toLocaleString()          || '0'} icon={Timer}       iconBg="icon-bg-secondary" badge="All time"            badgeColor="badge-gray"    />
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-buttons-group">
          {filterButtons.map(btn => {
            const Icon = btn.icon;
            return (
              <button key={btn.id} onClick={() => handleFilterChange(btn.id)} disabled={loading}
                className={`filter-btn ${activeFilter === btn.id ? 'active' : ''}`}>
                <Icon size={18} strokeWidth={1.5} />
                {btn.label}
              </button>
            );
          })}
        </div>
        <div className="action-buttons-group">
          <div style={{ position: 'relative', minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
            <input type="text" placeholder="Search cases..." value={searchQuery}
              onChange={handleSearch} disabled={loading}
              className="form-input" style={{ paddingLeft: '40px' }} />
          </div>
          <select value={selectedCategory} onChange={handleCategoryChange}
            disabled={loading} className="form-select" style={{ minWidth: '150px' }}>
            <option>All categories</option>
            <option>Dispute</option>
            <option>Theft</option>
            <option>Noise Complaint</option>
            <option>Property Issue</option>
            <option>Others</option>
          </select>
          <button className="btn btn-secondary btn-md" disabled={loading}>
            <Download size={18} strokeWidth={1.5} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case #</th>
                <th>Category</th>
                <th>Complainant</th>
                <th>Location</th>
                <th>Date Filed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && incidents.length === 0 ? (
                <tr><td colSpan="7">
                  <div className="empty-state">
                    <Loader className="empty-state-icon animate-spin" />
                    <h3 className="empty-state-title">Loading incidents...</h3>
                    <p className="empty-state-description">Please wait</p>
                  </div>
                </td></tr>
              ) : incidents.length > 0 ? (
                incidents.map((incident) => {
                  const CategoryIcon = getCategoryIcon(incident.categoryType);
                  return (
                    <tr key={incident.id}>
                      <td>
                        <span className="fw-semibold text-primary">{incident.caseNumber}</span>
                      </td>
                      <td>
                        <div className="d-flex align-center gap-2">
                          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                            <CategoryIcon size={16} />
                          </div>
                          <span className="badge badge-gray">{incident.category}</span>
                        </div>
                      </td>
                      <td>
                        <div className="user-info-cell">
                          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-full)', background: getAvatarBg(incident.complainant.color), color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                            {incident.complainant.initial}
                          </div>
                          <div className="user-details">
                            <span className="user-name">{incident.complainant.name}</span>
                            <span className="user-meta">{incident.complainant.purok}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-center gap-1 text-secondary">
                          <MapPin size={14} />
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>{incident.location}</span>
                        </div>
                      </td>
                      <td className="text-secondary">{formatDate(incident.systemInfo?.dateFiled)}</td>
                      <td>
                        <span className={`status-badge status-${incident.status.toLowerCase().replace(' ', '-')}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-center gap-2">
                          <button className="btn-icon btn-icon-sm" onClick={() => handleView(incident)} title="View Details">
                            <Eye size={16} />
                          </button>
                          <button className="btn-icon btn-icon-sm" onClick={() => handleEdit(incident)} title="Edit Incident">
                            <Edit size={16} />
                          </button>
                          <button className="btn-icon btn-icon-sm" onClick={() => handleSendSummon(incident)} title="Send Summon" style={{ color: 'var(--color-secondary)' }}>
                            <Send size={16} />
                          </button>
                          <button className="btn-icon btn-icon-sm" onClick={() => handleMore(incident)} title="More Options">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="7">
                  <div className="empty-state">
                    <AlertCircle className="empty-state-icon" />
                    <h3 className="empty-state-title">No incidents found</h3>
                    <p className="empty-state-description">
                      {searchQuery ? 'Try adjusting your search criteria' : 'Click "New Incident Report" to get started'}
                    </p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {incidents.length > 0 && (
          <div className="pagination-container">
            <p className="pagination-info">
              Showing {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
              {stats?.total ? ` of ${stats.total} total` : ''}
            </p>
            {hasMore && (
              <button className="btn btn-secondary btn-sm" onClick={loadMore} disabled={loading}>
                {loading ? <><Loader size={16} className="animate-spin" />Loading...</> : 'Load More'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <IncidentFormModal
        isOpen={showFormModal}
        onClose={handleFormClose}
        incident={editingIncident}
        onSuccess={handleFormSuccess}
      />

      <IncidentViewModal
        isOpen={showViewModal}
        onClose={handleViewClose}
        incident={viewingIncident}
        onEdit={(inc) => { handleViewClose(); handleEdit(inc); }}
        onSuccess={handleViewSuccess}
      />

    </div>
  );
};

export default Incidents;