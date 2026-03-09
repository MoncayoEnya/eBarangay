// src/pages/Residents.jsx - UPDATED WITH FIREBASE
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import {
  Users,
  UserCheck,
  Eye,
  Edit,
  Filter,
  Download,
  Plus,
  Vote,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader,
  AlertCircle,
  X
} from 'lucide-react';
import { useResidents } from '../hooks/useResidents';

const Residents = () => {
  const {
    residents,
    loading,
    error,
    stats,
    hasMore,
    loadResidents,
    loadMore,
    search,
    loadByCategory,
    loadStatistics,
    remove,
    clearError
  } = useResidents();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);

  // Load residents and stats on mount
  useEffect(() => {
    loadResidents(10, true);
    loadStatistics();
  }, []);

  const filterButtons = [
    { id: 'all', label: 'All Residents', icon: Users },
    { id: 'senior', label: 'Senior Citizens', icon: UserCheck },
    { id: 'pwd', label: 'PWD', icon: Users },
    { id: 'voters', label: 'Voters', icon: Vote }
  ];

  // Handle filter change
  const handleFilterChange = async (filterId) => {
    setActiveFilter(filterId);
    
    if (filterId === 'all') {
      await loadResidents(10, true);
    } else {
      await loadByCategory(filterId);
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === '') {
      await loadResidents(10, true);
    } else {
      // Debounce search
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(async () => {
        await search(value, {
          status: 'Active'
        });
      }, 500);
    }
  };

  // Handle view resident
  const handleView = (resident) => {
    setSelectedResident(resident);
    // TODO: Open view modal
    alert(`Viewing: ${resident.personalInfo.firstName} ${resident.personalInfo.lastName}`);
  };

  // Handle edit resident
  const handleEdit = (resident) => {
    setSelectedResident(resident);
    // TODO: Open edit modal
    alert(`Editing: ${resident.personalInfo.firstName} ${resident.personalInfo.lastName}`);
  };

  // Handle delete resident
  const handleDelete = async (resident) => {
    if (window.confirm(`Are you sure you want to deactivate ${resident.personalInfo.firstName} ${resident.personalInfo.lastName}?`)) {
      const result = await remove(resident.id);
      if (result.success) {
        alert('Resident deactivated successfully');
      } else {
        alert('Failed to deactivate resident: ' + result.error);
      }
    }
  };

  const handleExport = () => {
    alert('Exporting residents data...');
    // TODO: Implement export functionality
  };

  // Helper function to format full name
  const getFullName = (personalInfo) => {
    const { firstName, middleName, lastName, suffix } = personalInfo;
    return `${firstName} ${middleName} ${lastName}${suffix ? ' ' + suffix : ''}`.trim();
  };

  // Helper function to get avatar URL or initials
  const getAvatarDisplay = (resident) => {
    if (resident.documents?.profilePhoto) {
      return resident.documents.profilePhoto;
    }
    // Return initials as fallback
    const initials = `${resident.personalInfo.firstName[0]}${resident.personalInfo.lastName[0]}`;
    return `https://ui-avatars.com/api/?name=${initials}&background=3b82f6&color=fff`;
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Residents Management</h1>
          <p className="page-subtitle">Manage and view all resident information</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowAddModal(true)}>
          <Plus size={18} strokeWidth={2} />
          Add New Resident
        </button>
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
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Residents"
          value={stats?.total?.toLocaleString() || '0'}
          icon={Users}
          iconBg="icon-bg-primary"
          badge={loading ? 'Loading...' : `${stats?.male || 0} M / ${stats?.female || 0} F`}
          badgeColor="badge-success"
        />
        <StatCard
          title="Senior Citizens"
          value={stats?.seniorCitizens?.toLocaleString() || '0'}
          icon={UserCheck}
          iconBg="icon-bg-secondary"
          badge={stats?.total ? `${((stats.seniorCitizens / stats.total) * 100).toFixed(1)}% of total` : '0%'}
          badgeColor="badge-gray"
        />
        <StatCard
          title="PWD Residents"
          value={stats?.pwd?.toLocaleString() || '0'}
          icon={Users}
          iconBg="icon-bg-warning"
          badge={stats?.total ? `${((stats.pwd / stats.total) * 100).toFixed(1)}% of total` : '0%'}
          badgeColor="badge-gray"
        />
        <StatCard
          title="Registered Voters"
          value={stats?.voters?.toLocaleString() || '0'}
          icon={Vote}
          iconBg="icon-bg-success"
          badge={stats?.total ? `${((stats.voters / stats.total) * 100).toFixed(1)}% of total` : '0%'}
          badgeColor="badge-gray"
        />
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="filter-buttons-group">
          {filterButtons.map(btn => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.id}
                onClick={() => handleFilterChange(btn.id)}
                disabled={loading}
                className={`filter-btn ${activeFilter === btn.id ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={1.5} />
                {btn.label}
              </button>
            );
          })}
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
              placeholder="Search residents..."
              value={searchQuery}
              onChange={handleSearch}
              disabled={loading}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button className="btn btn-secondary btn-md" disabled={loading}>
            <Filter size={18} strokeWidth={1.5} />
            Filter
          </button>
          <button className="btn btn-secondary btn-md" onClick={handleExport} disabled={loading}>
            <Download size={18} strokeWidth={1.5} />
            Export
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="data-table-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Resident Name</th>
                <th>Address</th>
                <th>Contact</th>
                <th>Age</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && residents.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <Loader className="empty-state-icon animate-spin" />
                      <h3 className="empty-state-title">Loading residents...</h3>
                      <p className="empty-state-description">Please wait</p>
                    </div>
                  </td>
                </tr>
              ) : residents.length > 0 ? (
                residents.map((resident) => (
                  <tr key={resident.id}>
                    <td>
                      <div className="user-info-cell">
                        <img
                          src={getAvatarDisplay(resident)}
                          alt={getFullName(resident.personalInfo)}
                          className="avatar"
                        />
                        <div className="user-details">
                          <span className="user-name">
                            {getFullName(resident.personalInfo)}
                          </span>
                          <span className="user-meta">
                            {resident.personalInfo.gender}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-secondary">{resident.address.fullAddress}</td>
                    <td className="text-secondary">{resident.contactInfo.mobileNumber || 'N/A'}</td>
                    <td className="text-secondary">{resident.personalInfo.age}</td>
                    <td>
                      <div className="d-flex align-center gap-2">
                        <span className={`status-badge status-${resident.systemInfo.status.toLowerCase()}`}>
                          {resident.systemInfo.status}
                        </span>
                        {resident.statusFlags.isSeniorCitizen && (
                          <span className="badge badge-secondary">Senior</span>
                        )}
                        {resident.statusFlags.isPWD && (
                          <span className="badge badge-warning">PWD</span>
                        )}
                        {resident.statusFlags.isVoter && (
                          <span className="badge badge-primary">Voter</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-center gap-2">
                        <button
                          className="btn-icon btn-icon-sm"
                          onClick={() => handleView(resident)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-sm"
                          onClick={() => handleEdit(resident)}
                          title="Edit Resident"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <Users className="empty-state-icon" />
                      <h3 className="empty-state-title">No residents found</h3>
                      <p className="empty-state-description">
                        {searchQuery ? 'Try adjusting your search criteria' : 'Click "Add New Resident" to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {residents.length > 0 && (
          <div className="pagination-container">
            <p className="pagination-info">
              Showing {residents.length} resident{residents.length !== 1 ? 's' : ''}
              {stats?.total ? ` of ${stats.total} total` : ''}
            </p>
            {hasMore && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add Resident Modal (placeholder) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Resident</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-secondary">
                Add resident form will be implemented in the next step...
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary">
                Add Resident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Residents;