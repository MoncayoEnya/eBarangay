// src/pages/Documents.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import DocumentFormModal from '../components/documents/DocumentFormModal';
import DocumentViewModal from '../components/documents/DocumentViewModal';
import {
  FileText, Clock, CheckCircle, Eye, Check, X, Printer,
  Download, Filter, Plus, Timer, Search, Loader, AlertCircle,
  XCircle, ChevronRight, ClipboardList, Hash, User, Calendar
} from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { sendDocumentReadySMS } from '../services/smsService';

const Documents = () => {
  const {
    documents, loading, error, stats,
    loadDocuments, search, approve, deny, release,
    loadStatistics, clearError
  } = useDocuments();

  const [activeSection, setActiveSection]   = useState('requests'); // 'requests' | 'log'
  const [activeFilter, setActiveFilter]     = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedDoc, setSelectedDoc]       = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showViewModal, setShowViewModal]   = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDenyModal, setShowDenyModal]   = useState(false);
  const [controlNumber, setControlNumber]   = useState('');
  const [denialReason, setDenialReason]     = useState('');
  const [officialSignatory, setOfficialSignatory] = useState('');
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [actionLoading, setActionLoading]   = useState(false);

  useEffect(() => {
    loadDocuments();
    loadStatistics();
  }, []);

  const filterButtons = [
    { id: 'all',        label: 'All',        icon: FileText    },
    { id: 'Pending',    label: 'Pending',    icon: Clock       },
    { id: 'Processing', label: 'Processing', icon: Timer       },
    { id: 'Approved',   label: 'Approved',   icon: CheckCircle },
    { id: 'Denied',     label: 'Denied',     icon: X           },
  ];

  const handleFilterChange = async (filterId) => {
    setActiveFilter(filterId);
    if (filterId === 'all') await loadDocuments();
    else await loadDocuments({ status: filterId });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    clearTimeout(window.docSearchTimeout);
    if (value.trim() === '') loadDocuments();
    else window.docSearchTimeout = setTimeout(() => search(value), 400);
  };

  const handleApproveConfirm = async () => {
    if (!controlNumber.trim()) { alert('Please enter a control number'); return; }
    setActionLoading(true);
    const result = await approve(selectedDoc.id, controlNumber, officialSignatory, 12);
    setActionLoading(false);
    if (result.success) {
      setShowApproveModal(false); setSelectedDoc(null); setControlNumber(''); setOfficialSignatory('');
      loadStatistics();
    } else alert('Error: ' + result.error);
  };

  const handleReleaseConfirm = async () => {
    setActionLoading(true);
    const result = await release(selectedDoc.id, '');
    setActionLoading(false);
    if (result.success) {
      // Send SMS notification
      if (selectedDoc?.requester?.contactNumber) {
        await sendDocumentReadySMS(
          selectedDoc.requester.contactNumber,
          selectedDoc.documentType,
          selectedDoc.document?.controlNumber || selectedDoc.requestId
        );
      }
      setShowReleaseModal(false); setSelectedDoc(null);
      loadStatistics();
    } else alert('Error: ' + result.error);
  };

  const handleDenyConfirm = async () => {
    if (!denialReason.trim()) { alert('Please enter a reason'); return; }
    setActionLoading(true);
    const result = await deny(selectedDoc.id, denialReason);
    setActionLoading(false);
    if (result.success) {
      setShowDenyModal(false); setSelectedDoc(null); setDenialReason('');
      loadStatistics();
    } else alert('Error: ' + result.error);
  };

  const handlePrint = (doc) => {
    import('../utils/pdfGenerator').then(({ generateDocumentPDF }) => {
      generateDocumentPDF(doc);
    }).catch(() => {
      const win = window.open('', '_blank');
      win.document.write(`<html><body><h1>${doc.documentType}</h1><p>${doc.requester?.name}</p><script>window.print()<\/script></body></html>`);
      win.document.close();
    });
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    try { return ts.toDate ? ts.toDate().toLocaleDateString('en-PH') : '—'; }
    catch { return '—'; }
  };

  const formatDateTime = (ts) => {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) +
             ' ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  const statusStyle = (s) => {
    const map = {
      Approved:   { bg: '#d1fae5', color: '#065f46' },
      Denied:     { bg: '#fee2e2', color: '#991b1b' },
      Processing: { bg: '#dbeafe', color: '#1e40af' },
      Released:   { bg: '#f3e8ff', color: '#6b21a8' },
      Pending:    { bg: '#fef3c7', color: '#92400e' },
    };
    return map[s] || map.Pending;
  };

  const tabCount = (id) => id === 'all' ? documents.length : documents.filter(d => d.status === id).length;

  // Build flat audit trail from all document timelines
  const auditLog = documents
    .flatMap(doc => (doc.timeline || []).map(t => ({
      ...t,
      docType:    doc.documentType,
      requestId:  doc.requestId,
      requester:  doc.requester?.name,
      docId:      doc.id,
    })))
    .sort((a, b) => {
      const ta = a.timestamp?.seconds || 0;
      const tb = b.timestamp?.seconds || 0;
      return tb - ta;
    });

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Document Management</h1>
          <p className="page-subtitle">Process, track and issue barangay documents</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => setShowIssueModal(true)}>
          <Plus size={18} />Issue Document
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} color="#dc2626" />
            <span style={{ color: '#991b1b', fontWeight: 500 }}>{error}</span>
          </div>
          <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={18} color="#dc2626" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Pending Requests" value={stats?.pending?.toString() || documents.filter(d=>d.status==='Pending').length.toString()} icon={Clock} iconBg="icon-bg-warning" badge="Requires action" badgeColor="badge-warning" />
        <StatCard title="Approved"         value={stats?.approved?.toString() || documents.filter(d=>d.status==='Approved').length.toString()} icon={CheckCircle} iconBg="icon-bg-success" badge="Ready for pickup" badgeColor="badge-success" />
        <StatCard title="Total This Month" value={stats?.total?.toString() || documents.length.toString()} icon={FileText} iconBg="icon-bg-primary" badge="All requests" badgeColor="badge-gray" />
        <StatCard title="Avg. Processing"  value={`${stats?.avgProcessingTime || 0}d`} icon={Timer} iconBg="icon-bg-secondary" badge="Days per request" badgeColor="badge-gray" />
      </div>

      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f1f5f9', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[
          { id: 'requests', label: 'Document Requests', icon: FileText      },
          { id: 'log',      label: 'Transaction Log',   icon: ClipboardList },
        ].map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
                borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: activeSection === s.id ? '#fff' : 'transparent',
                color: activeSection === s.id ? '#0f172a' : '#64748b',
                boxShadow: activeSection === s.id ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                transition: 'all .15s',
              }}>
              <Icon size={15} />{s.label}
            </button>
          );
        })}
      </div>

      {/* REQUESTS SECTION */}
      {activeSection === 'requests' && (
        <>
          <div className="filters-section">
            <div className="filter-buttons-group">
              {filterButtons.map(btn => {
                const Icon = btn.icon;
                const count = tabCount(btn.id);
                return (
                  <button key={btn.id} onClick={() => handleFilterChange(btn.id)} disabled={loading}
                    className={`filter-btn ${activeFilter === btn.id ? 'active' : ''}`}>
                    <Icon size={15} strokeWidth={1.5} />
                    {btn.label}
                    {count > 0 && (
                      <span style={{ padding: '1px 7px', borderRadius: 10, fontSize: 11, background: activeFilter === btn.id ? 'rgba(255,255,255,0.3)' : '#e2e8f0', color: activeFilter === btn.id ? '#fff' : '#64748b', marginLeft: 2 }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="action-buttons-group">
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Search by name or request ID..."
                  value={searchQuery} onChange={handleSearch} disabled={loading}
                  className="form-input" style={{ paddingLeft: 38, minWidth: 260 }} />
              </div>
              <button className="btn btn-secondary btn-md" disabled={loading}><Filter size={16} />Filter</button>
              <button className="btn btn-secondary btn-md" disabled={loading}><Download size={16} />Export</button>
            </div>
          </div>

          <div className="data-table-card">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Resident</th>
                    <th>Document Type</th>
                    <th>Purpose</th>
                    <th>Date Requested</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && documents.length === 0 ? (
                    <tr><td colSpan="7">
                      <div className="empty-state"><Loader size={32} className="animate-spin" style={{ color: '#3b82f6' }} /><p style={{ marginTop: 12, color: '#64748b' }}>Loading documents...</p></div>
                    </td></tr>
                  ) : documents.length > 0 ? documents.map(doc => {
                    const st = statusStyle(doc.status);
                    return (
                      <tr key={doc.id}>
                        <td><span style={{ fontWeight: 700, color: '#2563eb', fontSize: 13 }}>{doc.requestId || '—'}</span></td>
                        <td>
                          <div className="user-info-cell">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(doc.requester?.name || 'U')}&background=3b82f6&color=fff&size=60`} alt="" className="avatar" />
                            <div className="user-details">
                              <span className="user-name">{doc.requester?.name || '—'}</span>
                              <span className="user-meta">{doc.requester?.contactNumber || '—'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary">{doc.documentType || '—'}</td>
                        <td className="text-secondary" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.purpose || '—'}</td>
                        <td className="text-secondary">{formatDate(doc.systemInfo?.requestDate)}</td>
                        <td><span style={{ padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: st.bg, color: st.color }}>{doc.status || 'Pending'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-icon btn-icon-sm" title="View Details" onClick={() => { setSelectedDoc(doc); setShowViewModal(true); }}><Eye size={15} /></button>
                            {doc.status === 'Pending' && <>
                              <button className="btn-icon btn-icon-sm" title="Approve" style={{ color: '#10b981' }}
                                onClick={() => { setSelectedDoc(doc); setControlNumber(`CTRL-${Date.now()}`); setShowApproveModal(true); }}><Check size={15} /></button>
                              <button className="btn-icon btn-icon-sm" title="Deny" style={{ color: '#ef4444' }}
                                onClick={() => { setSelectedDoc(doc); setShowDenyModal(true); }}><X size={15} /></button>
                            </>}
                            {(doc.status === 'Approved' || doc.status === 'Released') && <>
                              <button className="btn-icon btn-icon-sm" title="Print" style={{ color: '#8b5cf6' }} onClick={() => handlePrint(doc)}><Printer size={15} /></button>
                              <button className="btn-icon btn-icon-sm" title="Download" style={{ color: '#3b82f6' }} onClick={() => handlePrint(doc)}><Download size={15} /></button>
                            </>}
                            {doc.status === 'Approved' && (
                              <button className="btn-icon btn-icon-sm" title="Mark Released" style={{ color: '#10b981' }}
                                onClick={() => { setSelectedDoc(doc); setShowReleaseModal(true); }}>
                                <CheckCircle size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="7">
                      <div className="empty-state">
                        <FileText size={40} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 12px' }} />
                        <h3 className="empty-state-title">No documents found</h3>
                        <p className="empty-state-description">{searchQuery ? 'Try a different search' : 'Click "Issue Document" to create the first request'}</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {documents.length > 0 && (
              <div className="pagination-container">
                <p className="pagination-info">Showing {documents.length} request{documents.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* TRANSACTION LOG SECTION */}
      {activeSection === 'log' && (
        <div className="data-table-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={16} color="#3b82f6" />
              <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Audit Trail</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>— All document actions in chronological order</span>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>{auditLog.length} entries</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Request ID</th>
                  <th>Document</th>
                  <th>Requester</th>
                  <th>Action / Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">
                    <div className="empty-state"><Loader size={28} className="animate-spin" style={{ color: '#3b82f6' }} /></div>
                  </td></tr>
                ) : auditLog.length > 0 ? auditLog.map((entry, i) => {
                  const st = statusStyle(entry.status);
                  return (
                    <tr key={i}>
                      <td className="text-secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={12} color="#94a3b8" />
                          {formatDateTime(entry.timestamp)}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 12 }}>{entry.requestId || '—'}</span>
                      </td>
                      <td className="text-secondary" style={{ fontSize: 13 }}>{entry.docType || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} color="#94a3b8" />
                          <span style={{ fontSize: 13 }}>{entry.requester || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                          {entry.status || entry.action || '—'}
                        </span>
                      </td>
                      <td className="text-secondary" style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.notes || '—'}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6">
                    <div className="empty-state">
                      <ClipboardList size={36} style={{ color: '#cbd5e1', display: 'block', margin: '0 auto 10px' }} />
                      <h3 className="empty-state-title">No transaction log yet</h3>
                      <p className="empty-state-description">Actions will appear here as documents are processed</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <DocumentFormModal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)}
        onSuccess={() => { setShowIssueModal(false); loadDocuments(); loadStatistics(); }} />

      <DocumentViewModal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedDoc(null); }}
        document={selectedDoc} onPrint={handlePrint}
        onApprove={(doc) => { setShowViewModal(false); setSelectedDoc(doc); setControlNumber(`CTRL-${Date.now()}`); setShowApproveModal(true); }}
        onDeny={(doc) => { setShowViewModal(false); setSelectedDoc(doc); setShowDenyModal(true); }} />

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><Check size={20} style={{ marginRight: 8, color: '#10b981' }} />Approve Document</h3>
              <button className="btn-icon" onClick={() => setShowApproveModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#166534' }}>Approving <strong>{selectedDoc?.documentType}</strong> for <strong>{selectedDoc?.requester?.name}</strong></p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#15803d' }}>Request ID: {selectedDoc?.requestId}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Control Number <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" value={controlNumber} onChange={e => setControlNumber(e.target.value)} className="form-input" placeholder="CTRL-XXXXXX" />
                <small style={{ color: '#64748b', fontSize: 12 }}>This will appear on the official document</small>
              </div>
              <div className="form-group">
                <label className="form-label">Signed by (Official)</label>
                <input type="text" value={officialSignatory} onChange={e => setOfficialSignatory(e.target.value)} className="form-input" placeholder="e.g. Hon. Juan Dela Cruz, Punong Barangay" />
                <small style={{ color: '#64748b', fontSize: 12 }}>Overrides default signatory on the printed document</small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowApproveModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleApproveConfirm} disabled={actionLoading}>
                {actionLoading ? <><Loader size={15} className="animate-spin" />Processing...</> : <><Check size={15} />Approve</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="modal-overlay" onClick={() => setShowDenyModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><X size={20} style={{ marginRight: 8, color: '#ef4444' }} />Deny Request</h3>
              <button className="btn-icon" onClick={() => setShowDenyModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#991b1b' }}>Denying <strong>{selectedDoc?.documentType}</strong> for <strong>{selectedDoc?.requester?.name}</strong></p>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Denial <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea value={denialReason} onChange={e => setDenialReason(e.target.value)}
                  className="form-input" rows={4} placeholder="State the specific reason..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDenyModal(false)}>Cancel</button>
              <button className="btn btn-error" onClick={handleDenyConfirm} disabled={actionLoading}>
                {actionLoading ? <><Loader size={15} className="animate-spin" />Processing...</> : <><X size={15} />Deny Request</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Release Modal */}
      {showReleaseModal && (
        <div className="modal-overlay" onClick={() => setShowReleaseModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><CheckCircle size={20} style={{ marginRight: 8, color: '#10b981' }} />Mark as Released</h3>
              <button className="btn-icon" onClick={() => setShowReleaseModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 14, color: '#166534' }}>
                  Marking <strong>{selectedDoc?.documentType}</strong> as released to <strong>{selectedDoc?.requester?.name}</strong>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#15803d' }}>Ctrl No: {selectedDoc?.document?.controlNumber || selectedDoc?.requestId}</p>
              </div>
              {selectedDoc?.requester?.contactNumber && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 12, fontSize: 13, color: '#1d4ed8' }}>
                  📱 An SMS notification will be sent to <strong>{selectedDoc.requester.contactNumber}</strong> (if SMS gateway is enabled in Settings).
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowReleaseModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleReleaseConfirm} disabled={actionLoading}>
                {actionLoading ? <><Loader size={15} className="animate-spin" />Processing...</> : <><CheckCircle size={15} />Confirm Release</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;