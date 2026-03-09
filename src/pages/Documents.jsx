// src/pages/Documents_Updated.jsx - SAFE VERSION
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import {
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Check,
  X,
  Printer,
  Download,
  Filter,
  Plus,
  Timer,
  Search,
  Loader,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { DOCUMENT_TYPES } from '../services/documentsService';

const Documents = () => {
  const {
    documents,
    loading,
    error,
    stats,
    loadDocuments,
    search,
    updateStatus,
    approve,
    deny,
    loadStatistics,
    clearError
  } = useDocuments();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [controlNumber, setControlNumber] = useState('');
  const [denialReason, setDenialReason] = useState('');

  // Load data on mount
  useEffect(() => {
    loadDocuments();
    loadStatistics();
  }, []);

  const filterButtons = [
    { id: 'all', label: 'All Requests', icon: FileText },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'approved', label: 'Approved', icon: CheckCircle },
    { id: 'denied', label: 'Denied', icon: X }
  ];

  // Handle filter change
  const handleFilterChange = async (filterId) => {
    setActiveFilter(filterId);
    
    if (filterId === 'all') {
      await loadDocuments();
    } else {
      await loadDocuments({ status: filterId.charAt(0).toUpperCase() + filterId.slice(1) });
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim() === '') {
      await loadDocuments();
    } else {
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(async () => {
        await search(value);
      }, 500);
    }
  };

  // Handle actions
  const handleView = (doc) => {
    setSelectedDocument(doc);
    alert(`Viewing: ${doc.requestId}\nType: ${doc.documentType}\nStatus: ${doc.status}`);
  };

  const handleApproveClick = (doc) => {
    setSelectedDocument(doc);
    setControlNumber(`CTRL-${Date.now()}`);
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!controlNumber.trim()) {
      alert('Please enter a control number');
      return;
    }

    const result = await approve(selectedDocument.id, controlNumber, 12);
    if (result.success) {
      alert('Document approved successfully!');
      setShowApproveModal(false);
      setSelectedDocument(null);
      setControlNumber('');
      await loadStatistics();
    }
  };

  const handleDenyClick = (doc) => {
    setSelectedDocument(doc);
    setShowDenyModal(true);
  };

  const handleDenyConfirm = async () => {
    if (!denialReason.trim()) {
      alert('Please enter a reason for denial');
      return;
    }

    const result = await deny(selectedDocument.id, denialReason);
    if (result.success) {
      alert('Document request denied');
      setShowDenyModal(false);
      setSelectedDocument(null);
      setDenialReason('');
      await loadStatistics();
    }
  };

  const handlePrint = (doc) => {
    alert(`🖨 Printing document ${doc.requestId} for ${doc.requester?.name || 'Unknown'}`);
    // TODO: Implement PDF generation and print
  };

  const handleDownload = (doc) => {
    alert(`💾 Downloading document ${doc.requestId} for ${doc.requester?.name || 'Unknown'}`);
    // TODO: Implement PDF download
  };

  // Safe data accessors
  const getRequesterName = (doc) => {
    return doc.requester?.name || 'N/A';
  };

  const getRequesterContact = (doc) => {
    return doc.requester?.contactNumber || 'N/A';
  };

  const getFormattedDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    const statusLower = (status || 'pending').toLowerCase();
    switch (statusLower) {
      case 'approved': return 'success';
      case 'denied': return 'error';
      case 'processing': return 'warning';
      default: return 'pending';
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Document Management</h1>
          <p className="page-subtitle">Process and track document requests</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Plus size={18} strokeWidth={2} />
          Issue Document
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
                <XCircle size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Pending Requests"
          value={stats?.pending?.toString() || '0'}
          icon={Clock}
          iconBg="icon-bg-warning"
          badge="Requires action"
          badgeColor="badge-warning"
        />
        <StatCard
          title="Approved Today"
          value={stats?.approved?.toString() || '0'}
          icon={CheckCircle}
          iconBg="icon-bg-success"
          badge="This month"
          badgeColor="badge-success"
        />
        <StatCard
          title="This Month"
          value={stats?.total?.toString() || '0'}
          icon={FileText}
          iconBg="icon-bg-primary"
          badge="Documents issued"
          badgeColor="badge-gray"
        />
        <StatCard
          title="Avg. Processing"
          value={stats?.avgProcessingTime?.toString() || '0'}
          icon={Timer}
          iconBg="icon-bg-secondary"
          badge="Days per request"
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
              placeholder="Search documents..."
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
          <button className="btn btn-secondary btn-md" disabled={loading}>
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
                <th>Request ID</th>
                <th>Resident</th>
                <th>Document Type</th>
                <th>Date Requested</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && documents.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <Loader className="empty-state-icon animate-spin" />
                      <h3 className="empty-state-title">Loading documents...</h3>
                      <p className="empty-state-description">Please wait</p>
                    </div>
                  </td>
                </tr>
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="fw-semibold text-primary">
                        {doc.requestId}
                      </span>
                    </td>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-details">
                          <span className="user-name">{getRequesterName(doc)}</span>
                          <span className="user-meta">{getRequesterContact(doc)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-secondary">{doc.documentType || 'N/A'}</td>
                    <td className="text-secondary">
                      {getFormattedDate(doc.systemInfo?.requestDate)}
                    </td>
                    <td>
                      <span className={`status-badge status-${getStatusColor(doc.status)}`}>
                        {doc.status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-center gap-2">
                        <button
                          className="btn-icon btn-icon-sm"
                          onClick={() => handleView(doc)}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {doc.status === 'Pending' && (
                          <>
                            <button
                              className="btn-icon btn-icon-sm"
                              onClick={() => handleApproveClick(doc)}
                              title="Approve"
                              style={{ color: 'var(--color-success)' }}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="btn-icon btn-icon-sm"
                              onClick={() => handleDenyClick(doc)}
                              title="Deny"
                              style={{ color: 'var(--color-error)' }}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        
                        {doc.status === 'Approved' && (
                          <>
                            <button
                              className="btn-icon btn-icon-sm"
                              onClick={() => handlePrint(doc)}
                              title="Print"
                              style={{ color: 'var(--color-secondary)' }}
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              className="btn-icon btn-icon-sm"
                              onClick={() => handleDownload(doc)}
                              title="Download"
                              style={{ color: 'var(--color-primary)' }}
                            >
                              <Download size={16} />
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
                      <FileText className="empty-state-icon" />
                      <h3 className="empty-state-title">No documents found</h3>
                      <p className="empty-state-description">
                        {searchQuery ? 'Try adjusting your search criteria' : 'No document requests yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {documents.length > 0 && (
          <div className="pagination-container">
            <p className="pagination-info">
              Showing {documents.length} request{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Approve Document</h3>
              <button className="btn-icon" onClick={() => setShowApproveModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-secondary mb-4">
                Approving: <strong>{selectedDocument?.requestId}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Control Number</label>
                <input
                  type="text"
                  value={controlNumber}
                  onChange={(e) => setControlNumber(e.target.value)}
                  className="form-input"
                  placeholder="CTRL-XXXX"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowApproveModal(false)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleApproveConfirm} disabled={loading}>
                {loading ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                Approve Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="modal-overlay" onClick={() => setShowDenyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Deny Document Request</h3>
              <button className="btn-icon" onClick={() => setShowDenyModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-secondary mb-4">
                Denying: <strong>{selectedDocument?.requestId}</strong>
              </p>
              <div className="form-group">
                <label className="form-label">Reason for Denial</label>
                <textarea
                  value={denialReason}
                  onChange={(e) => setDenialReason(e.target.value)}
                  className="form-input"
                  rows="4"
                  placeholder="Enter reason..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDenyModal(false)}>
                Cancel
              </button>
              <button className="btn btn-error" onClick={handleDenyConfirm} disabled={loading}>
                {loading ? <Loader size={16} className="animate-spin" /> : <X size={16} />}
                Deny Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;