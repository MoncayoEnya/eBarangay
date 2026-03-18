// src/pages/SocialWelfare.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { 
  Users, 
  Gift, 
  DollarSign, 
  Clock, 
  Plus,
  Eye,
  Check,
  X,
  Loader,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  MoreVertical,
  MessageSquare,
  Trash2,
  Save,
  UserX,
  RefreshCw,
} from 'lucide-react';
import { useWelfare } from '../hooks/useWelfare';
import { submitGrievance, getAllGrievances, updateGrievanceStatus, deleteGrievance } from '../services/grievanceService';

const SocialWelfare = () => {
  // ── Grievance state ──
  const [grievances, setGrievances]             = useState([]);
  const [grievanceLoading, setGrievanceLoading] = useState(false);
  const [showGrievanceModal, setShowGrievanceModal] = useState(false);
  const [showResolveModal,   setShowResolveModal]   = useState(false);
  const [selectedGrievance,  setSelectedGrievance]  = useState(null);
  const [resolution, setResolution] = useState('');
  const [grievanceForm, setGrievanceForm] = useState({ fullName: '', purok: '', contactNumber: '', category: 'Aid Distribution', programName: '', description: '' });
  const [grievanceSaving, setGrievanceSaving] = useState(false);
  const [grievanceErr, setGrievanceErr] = useState('');

  const loadGrievances = async () => {
    setGrievanceLoading(true);
    try { const r = await getAllGrievances(); if (r.success) setGrievances(r.data); }
    catch (_) {} finally { setGrievanceLoading(false); }
  };

  const handleGrievanceSave = async () => {
    if (!grievanceForm.fullName.trim() || !grievanceForm.description.trim()) { setGrievanceErr('Name and description required.'); return; }
    setGrievanceSaving(true);
    const r = await submitGrievance(grievanceForm, null);
    setGrievanceSaving(false);
    if (r.success) { setShowGrievanceModal(false); setGrievanceForm({ fullName: '', purok: '', contactNumber: '', category: 'Aid Distribution', programName: '', description: '' }); loadGrievances(); }
    else setGrievanceErr(r.error);
  };

  const handleResolve = async (status) => {
    if (!selectedGrievance) return;
    await updateGrievanceStatus(selectedGrievance.id, status, resolution, null);
    setShowResolveModal(false);
    setResolution('');
    loadGrievances();
  };
  const {
    programs,
    beneficiaries,
    distributions,
    loading,
    error,
    stats,
    loadPrograms,
    createProgram,
    loadBeneficiaries,
    addBeneficiary,
    recordDistribution,
    loadDistributions,
    loadStatistics,
    clearError
  } = useWelfare();

  const [activeTab, setActiveTab] = useState('programs');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);

  // ── Undistributed Aid state ──
  const [undistributed,      setUndistributed]      = useState([]);
  const [undistLoading,      setUndistLoading]       = useState(false);
  const [showReasonModal,    setShowReasonModal]     = useState(false);
  const [selectedUndist,     setSelectedUndist]      = useState(null);
  const [reasonForm,         setReasonForm]          = useState({ reason: '', remarks: '', redeliveryDate: '' });
  const [reasonSaving,       setReasonSaving]        = useState(false);
  const REASONS = ['Not at home','Refused to accept','Incorrect address','Already received elsewhere','Deceased','Other'];

  // Program form data
  const [programForm, setProgramForm] = useState({
    name: '',
    description: '',
    category: 'senior_citizen',
    aidType: 'cash',
    amountPerBeneficiary: '',
    totalBudget: '',
    startDate: '',
    endDate: '',
    eligibilityCriteria: []
  });

  // Beneficiary form data
  const [beneficiaryForm, setBeneficiaryForm] = useState({
    programId: '',
    residentId: '',
    name: '',
    category: 'senior_citizen',
    purok: ''
  });

  // Distribution form data
  const [distributionForm, setDistributionForm] = useState({
    programId: '',
    beneficiaryId: '',
    residentId: '',
    residentName: '',
    amount: '',
    aidType: 'cash',
    verificationMethod: 'Manual',
    remarks: ''
  });

  // Load data on mount
  useEffect(() => {
    loadPrograms();
    loadBeneficiaries();
    loadDistributions();
    loadStatistics();
    loadGrievances();
    loadUndistributed();
  }, []);

  // ── Undistributed Aid helpers ──
  const loadUndistributed = async () => {
    setUndistLoading(true);
    try {
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      // Get all beneficiaries not in the distributions list
      const [benSnap, distSnap] = await Promise.all([
        getDocs(collection(db, 'beneficiaries')),
        getDocs(query(collection(db, 'distributions'), orderBy('systemInfo.createdAt', 'desc'))),
      ]);
      const receivedIds = new Set(distSnap.docs.map(d => d.data().beneficiaryId).filter(Boolean));
      const pending = benSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(b => !receivedIds.has(b.id) && !receivedIds.has(b.beneficiaryId));
      setUndistributed(pending);
    } catch (_) {} finally { setUndistLoading(false); }
  };

  const saveReason = async () => {
    if (!selectedUndist || !reasonForm.reason) return;
    setReasonSaving(true);
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      await updateDoc(doc(db, 'beneficiaries', selectedUndist.id), {
        nonReceiptReason:  reasonForm.reason,
        nonReceiptRemarks: reasonForm.remarks,
        redeliveryDate:    reasonForm.redeliveryDate,
        'systemInfo.updatedAt': serverTimestamp(),
      });
      setUndistributed(p => p.map(u => u.id === selectedUndist.id
        ? { ...u, nonReceiptReason: reasonForm.reason, nonReceiptRemarks: reasonForm.remarks, redeliveryDate: reasonForm.redeliveryDate }
        : u));
      setShowReasonModal(false);
      setSelectedUndist(null);
      setReasonForm({ reason: '', remarks: '', redeliveryDate: '' });
    } catch (_) {} finally { setReasonSaving(false); }
  };

  // Handle program form change
  const handleProgramChange = (e) => {
    const { name, value } = e.target;
    setProgramForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle beneficiary form change
  const handleBeneficiaryChange = (e) => {
    const { name, value } = e.target;
    setBeneficiaryForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle distribution form change
  const handleDistributionChange = (e) => {
    const { name, value } = e.target;
    setDistributionForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit program
  const handleProgramSubmit = async (e) => {
    e.preventDefault();
    
    if (!programForm.name || !programForm.totalBudget) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await createProgram(programForm);
    
    if (result.success) {
      alert('Program created successfully!');
      setShowProgramModal(false);
      setProgramForm({
        name: '',
        description: '',
        category: 'senior_citizen',
        aidType: 'cash',
        amountPerBeneficiary: '',
        totalBudget: '',
        startDate: '',
        endDate: '',
        eligibilityCriteria: []
      });
      loadStatistics();
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Submit beneficiary
  const handleBeneficiarySubmit = async (e) => {
    e.preventDefault();
    
    if (!beneficiaryForm.programId || !beneficiaryForm.name) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await addBeneficiary(beneficiaryForm);
    
    if (result.success) {
      alert('Beneficiary added successfully!');
      setShowBeneficiaryModal(false);
      setBeneficiaryForm({
        programId: '',
        residentId: '',
        name: '',
        category: 'senior_citizen',
        purok: ''
      });
      loadStatistics();
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Submit distribution
  const handleDistributionSubmit = async (e) => {
    e.preventDefault();
    
    if (!distributionForm.programId || !distributionForm.residentName || !distributionForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await recordDistribution(distributionForm);
    
    if (result.success) {
      alert('Distribution recorded successfully!');
      setShowDistributionModal(false);
      setDistributionForm({
        programId: '',
        beneficiaryId: '',
        residentId: '',
        residentName: '',
        amount: '',
        aidType: 'cash',
        verificationMethod: 'Manual',
        remarks: ''
      });
      loadStatistics();
    } else {
      alert('Error: ' + result.error);
    }
  };

  // Filter programs
  const filteredPrograms = programs.filter(prog => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return prog.name?.toLowerCase().includes(searchLower) ||
           prog.description?.toLowerCase().includes(searchLower);
  });

  // Filter beneficiaries
  const filteredBeneficiaries = beneficiaries.filter(ben => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return ben.name?.toLowerCase().includes(searchLower);
  });

  // Filter distributions
  const filteredDistributions = distributions.filter(dist => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return dist.residentName?.toLowerCase().includes(searchLower);
  });

  // Format currency
  const formatCurrency = (amount) => {
    return '₱' + (amount || 0).toLocaleString();
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Social Welfare & Aid Distribution</h1>
          <p className="page-subtitle">Manage beneficiaries and aid programs</p>
        </div>
        <button 
          className="btn btn-primary btn-md"
          onClick={() => setShowProgramModal(true)}
        >
          <Plus size={18} />
          New Program
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
          title="Total Beneficiaries" 
          value={stats?.totalBeneficiaries?.toString() || '0'} 
          icon={Users}
          iconBg="icon-bg-primary"
          badge="Registered"
          badgeColor="badge-primary"
        />
        <StatCard 
          title="Active Programs" 
          value={stats?.activePrograms?.toString() || '0'} 
          icon={Gift}
          iconBg="icon-bg-success"
          badge={`${stats?.totalPrograms || 0} total`}
          badgeColor="badge-success"
        />
        <StatCard 
          title="Total Distributed" 
          value={formatCurrency(stats?.totalDistributed || 0)} 
          icon={DollarSign}
          iconBg="icon-bg-secondary"
          badge="All time"
          badgeColor="badge-gray"
        />
        <StatCard 
          title="This Month" 
          value={formatCurrency(stats?.thisMonth || 0)} 
          icon={Clock}
          iconBg="icon-bg-warning"
          badge="Distributed"
          badgeColor="badge-warning"
        />
      </div>

      {/* Tabs */}
      <div className="filters-section">
        <div className="filter-buttons-group">
          <button
            onClick={() => setActiveTab('programs')}
            className={`filter-btn ${activeTab === 'programs' ? 'active' : ''}`}
          >
            <Gift size={18} />
            Programs
          </button>
          <button
            onClick={() => setActiveTab('beneficiaries')}
            className={`filter-btn ${activeTab === 'beneficiaries' ? 'active' : ''}`}
          >
            <Users size={18} />
            Beneficiaries
          </button>
          <button
            onClick={() => setActiveTab('distributions')}
            className={`filter-btn ${activeTab === 'distributions' ? 'active' : ''}`}
          >
            <DollarSign size={18} />
            Distributions
          </button>
          <button
            onClick={() => setActiveTab('grievances')}
            className={`filter-btn ${activeTab === 'grievances' ? 'active' : ''}`}
          >
            <MessageSquare size={18} />
            Grievances
          </button>
          <button
            onClick={() => { setActiveTab('undistributed'); loadUndistributed(); }}
            className={`filter-btn ${activeTab === 'undistributed' ? 'active' : ''}`}
          >
            <UserX size={18} />
            Not Yet Received
            {undistributed.filter(u => !u.nonReceiptReason).length > 0 && (
              <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#fee2e2', color: '#991b1b' }}>
                {undistributed.filter(u => !u.nonReceiptReason).length}
              </span>
            )}
          </button>
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
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          
          {activeTab === 'beneficiaries' && (
            <button 
              className="btn btn-secondary btn-md"
              onClick={() => setShowBeneficiaryModal(true)}
            >
              <Plus size={18} />
              Add Beneficiary
            </button>
          )}
          
          {activeTab === 'distributions' && (
            <button 
              className="btn btn-secondary btn-md"
              onClick={() => setShowDistributionModal(true)}
            >
              <Plus size={18} />
              Record Distribution
            </button>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'programs' && (
        <div className="grid-auto">
          {loading && filteredPrograms.length === 0 ? (
            <div className="card">
              <div className="card-body text-center p-12">
                <Loader className="animate-spin mx-auto mb-4" size={48} style={{ color: 'var(--color-primary)' }} />
                <h3 className="fw-semibold mb-2">Loading programs...</h3>
              </div>
            </div>
          ) : filteredPrograms.length > 0 ? (
            filteredPrograms.map((program) => {
              const percentage = program.totalBudget > 0 
                ? Math.round((program.totalDistributed / program.totalBudget) * 100)
                : 0;
              
              return (
                <div key={program.id} className="card">
                  <div className="card-body">
                    <div className="d-flex justify-between align-start mb-3">
                      <div>
                        <h4 className="fw-bold text-primary mb-1">{program.name}</h4>
                        <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                          {program.description}
                        </p>
                      </div>
                      <span className={`badge badge-${program.status === 'Active' ? 'success' : 'gray'}`}>
                        {program.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="d-flex justify-between align-center mb-2">
                        <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                          Budget Utilization
                        </span>
                        <span className="fw-semibold">
                          {formatCurrency(program.totalDistributed)} / {formatCurrency(program.totalBudget)}
                        </span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        background: 'var(--color-bg-tertiary)', 
                        borderRadius: 'var(--radius-full)', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: `var(--color-${percentage > 80 ? 'error' : percentage > 50 ? 'warning' : 'success'})`, 
                          borderRadius: 'var(--radius-full)', 
                          transition: 'width 0.6s ease' 
                        }} />
                      </div>
                    </div>

                    <div className="d-flex justify-between text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                      <span className="d-flex align-center gap-1">
                        <Users size={14} />
                        {program.totalBeneficiaries || 0} beneficiaries
                      </span>
                      <span className="d-flex align-center gap-1">
                        <Gift size={14} />
                        {program.aidType}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card">
              <div className="card-body text-center p-12">
                <Gift className="mx-auto mb-4" size={48} style={{ color: 'var(--color-text-tertiary)' }} />
                <h3 className="fw-semibold mb-2">No programs found</h3>
                <p className="text-secondary">Click "New Program" to create one</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'beneficiaries' && (
        <div className="data-table-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Beneficiary ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Purok</th>
                  <th>Program</th>
                  <th>Total Received</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredBeneficiaries.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <Loader className="empty-state-icon animate-spin" />
                        <h3 className="empty-state-title">Loading beneficiaries...</h3>
                      </div>
                    </td>
                  </tr>
                ) : filteredBeneficiaries.length > 0 ? (
                  filteredBeneficiaries.map((beneficiary) => (
                    <tr key={beneficiary.id}>
                      <td className="fw-semibold text-primary">{beneficiary.beneficiaryId || 'N/A'}</td>
                      <td>{beneficiary.name || 'N/A'}</td>
                      <td className="text-secondary">{beneficiary.category || 'N/A'}</td>
                      <td className="text-secondary">{beneficiary.purok || 'N/A'}</td>
                      <td className="text-secondary">{beneficiary.programId || 'N/A'}</td>
                      <td className="fw-semibold">{formatCurrency(beneficiary.totalReceived || 0)}</td>
                      <td>
                        <button
                          className="btn-icon btn-icon-sm"
                          onClick={() => alert(`View beneficiary details`)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <Users className="empty-state-icon" />
                        <h3 className="empty-state-title">No beneficiaries found</h3>
                        <p className="empty-state-description">Click "Add Beneficiary" to register one</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'distributions' && (
        <div className="data-table-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Distribution ID</th>
                  <th>Resident</th>
                  <th>Program</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && filteredDistributions.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <Loader className="empty-state-icon animate-spin" />
                        <h3 className="empty-state-title">Loading distributions...</h3>
                      </div>
                    </td>
                  </tr>
                ) : filteredDistributions.length > 0 ? (
                  filteredDistributions.map((distribution) => (
                    <tr key={distribution.id}>
                      <td className="fw-semibold text-primary">{distribution.distributionId || 'N/A'}</td>
                      <td>{distribution.residentName || 'N/A'}</td>
                      <td className="text-secondary">{distribution.programId || 'N/A'}</td>
                      <td className="fw-semibold">{formatCurrency(distribution.amount || 0)}</td>
                      <td className="text-secondary">{formatDate(distribution.distributionDate)}</td>
                      <td>
                        <span className={`status-badge status-${distribution.status?.toLowerCase() || 'completed'}`}>
                          {distribution.status || 'Completed'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon btn-icon-sm"
                          onClick={() => alert(`View distribution details`)}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-state">
                        <DollarSign className="empty-state-icon" />
                        <h3 className="empty-state-title">No distributions found</h3>
                        <p className="empty-state-description">Click "Record Distribution" to add one</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ UNDISTRIBUTED AID TAB ══ */}
      {activeTab === 'undistributed' && (
        <div>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Pending Receipt',  value: undistributed.filter(u => !u.nonReceiptReason).length,  color: '#ef4444', bg: '#fee2e2' },
              { label: 'Reason Logged',    value: undistributed.filter(u =>  u.nonReceiptReason).length,  color: '#f59e0b', bg: '#fef3c7' },
              { label: 'Redelivery Set',   value: undistributed.filter(u =>  u.redeliveryDate).length,     color: '#10b981', bg: '#d1fae5' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="data-table-card">
            <div className="table-header">
              <h3 className="table-title">Beneficiaries Who Have Not Yet Received Aid</h3>
              <button className="btn btn-secondary btn-sm" onClick={loadUndistributed} style={{ gap: 6 }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Purok</th>
                    <th>Program</th>
                    <th>Non-Receipt Reason</th>
                    <th>Redelivery Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {undistLoading ? (
                    <tr><td colSpan={7}>
                      <div className="empty-state"><Loader className="empty-state-icon animate-spin" /><h3 className="empty-state-title">Loading...</h3></div>
                    </td></tr>
                  ) : undistributed.filter(u => !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <tr><td colSpan={7}>
                      <div className="empty-state">
                        <Check className="empty-state-icon" style={{ color: 'var(--color-success)' }} />
                        <h3 className="empty-state-title">All beneficiaries have received aid!</h3>
                        <p className="empty-state-description">No pending recipients found for active programs.</p>
                      </div>
                    </td></tr>
                  ) : undistributed.filter(u => !searchQuery || u.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                    <tr key={u.id}>
                      <td className="fw-semibold">{u.name || 'N/A'}</td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: '#f1f5f9', color: '#475569' }}>
                          {u.category || '—'}
                        </span>
                      </td>
                      <td className="text-secondary">{u.purok || '—'}</td>
                      <td className="text-secondary">{u.programId || '—'}</td>
                      <td>
                        {u.nonReceiptReason ? (
                          <span style={{ fontSize: 12, color: '#92400e', fontWeight: 500 }}>{u.nonReceiptReason}</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Not logged</span>
                        )}
                      </td>
                      <td className="text-secondary">{u.redeliveryDate || '—'}</td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setSelectedUndist(u); setReasonForm({ reason: u.nonReceiptReason || '', remarks: u.nonReceiptRemarks || '', redeliveryDate: u.redeliveryDate || '' }); setShowReasonModal(true); }}
                          style={{ fontSize: 12 }}
                        >
                          {u.nonReceiptReason ? 'Edit Reason' : 'Log Reason'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ REASON MODAL ══ */}
      {showReasonModal && selectedUndist && (
        <div className="modal-overlay" onClick={() => setShowReasonModal(false)} style={{ backdropFilter: 'blur(8px)', background: 'rgba(15,23,42,0.50)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth: 480, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(15,23,42,0.20)', overflow: 'hidden', animation: 'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)' }}>
            <div style={{ background: 'linear-gradient(135deg,#92400e,#f59e0b)', padding: '20px 24px 18px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserX size={20} color="#fff" /></div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>Log Non-Receipt Reason</h2>
                    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', margin: '2px 0 0' }}>{selectedUndist.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowReasonModal(false)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}><X size={16} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Beneficiary info card */}
              <div style={{ background: '#fafafa', border: '1.5px solid #f0f4f8', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[['Name', selectedUndist.name], ['Category', selectedUndist.category], ['Purok', selectedUndist.purok], ['Program', selectedUndist.programId]].map(([l, v]) => (
                    <div key={l}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</span>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Non-Receipt <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {REASONS.map(r => {
                    const a = reasonForm.reason === r;
                    return (
                      <button key={r} type="button" onClick={() => setReasonForm(p => ({ ...p, reason: r }))}
                        style={{ padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: a ? 700 : 500, border: `1.5px solid ${a ? '#f59e0b' : '#e2e8f0'}`, background: a ? '#fef3c7' : '#fff', color: a ? '#92400e' : '#64748b', cursor: 'pointer', transition: 'all .12s' }}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Remarks</label>
                <textarea className="form-textarea" rows={2} value={reasonForm.remarks}
                  onChange={e => setReasonForm(p => ({ ...p, remarks: e.target.value }))}
                  placeholder="Any additional notes about why aid was not received..." />
              </div>

              <div className="form-group">
                <label className="form-label">Redelivery / Follow-up Date</label>
                <input type="date" className="form-input" value={reasonForm.redeliveryDate}
                  onChange={e => setReasonForm(p => ({ ...p, redeliveryDate: e.target.value }))} />
                <span style={{ fontSize: 11.5, color: '#94a3b8', display: 'block', marginTop: 4 }}>
                  When will aid be re-attempted or follow-up be conducted?
                </span>
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1.5px solid #F0F4F8', display: 'flex', justifyContent: 'flex-end', background: '#FAFBFE', flexShrink: 0, gap: 10 }}>
              <button className="btn btn-secondary btn-md" onClick={() => setShowReasonModal(false)} disabled={reasonSaving}>Cancel</button>
              <button className="btn btn-md" onClick={saveReason} disabled={reasonSaving || !reasonForm.reason}
                style={{ background: 'linear-gradient(135deg,#92400e,#f59e0b)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', minWidth: 140, opacity: !reasonForm.reason ? 0.5 : 1 }}>
                <Save size={15} />{reasonSaving ? 'Saving…' : 'Save Reason'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ PROGRAM MODAL ══ */}
      {showProgramModal && (
        <div className="modal-overlay" onClick={()=>setShowProgramModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:680,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#065F46,#10B981)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Gift size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Create New Program</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Set up a new barangay welfare program</p>
                  </div>
                </div>
                <button onClick={()=>setShowProgramModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <form onSubmit={handleProgramSubmit} style={{display:'contents'}}>
              <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
                <div className="form-group">
                  <label className="form-label">Program Name <span style={{color:'#EF4444'}}>*</span></label>
                  <input type="text" name="name" value={programForm.name} onChange={handleProgramChange} className="form-input" placeholder="e.g., Senior Citizens Quarterly Cash Aid" required style={{fontSize:15,fontWeight:500}}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea name="description" value={programForm.description} onChange={handleProgramChange} className="form-textarea" rows="3" placeholder="Describe the program objectives, eligibility, and benefits..."/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div className="form-group">
                    <label className="form-label">Category <span style={{color:'#EF4444'}}>*</span></label>
                    <select name="category" value={programForm.category} onChange={handleProgramChange} className="form-select" required>
                      <option value="senior_citizen">Senior Citizen</option>
                      <option value="pwd">PWD</option>
                      <option value="emergency">Emergency Ayuda</option>
                      <option value="medical">Medical Assistance</option>
                      <option value="educational">Educational</option>
                      <option value="livelihood">Livelihood</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Aid Type <span style={{color:'#EF4444'}}>*</span></label>
                    <select name="aidType" value={programForm.aidType} onChange={handleProgramChange} className="form-select" required>
                      <option value="cash">Cash</option>
                      <option value="food">Food Packs</option>
                      <option value="medicine">Medicine</option>
                      <option value="supplies">Supplies</option>
                      <option value="voucher">Voucher</option>
                    </select>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div className="form-group">
                    <label className="form-label">Amount per Beneficiary (₱)</label>
                    <input type="number" name="amountPerBeneficiary" value={programForm.amountPerBeneficiary} onChange={handleProgramChange} className="form-input" placeholder="1500" min="0" style={{fontWeight:700,fontSize:15}}/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Budget (₱) <span style={{color:'#EF4444'}}>*</span></label>
                    <input type="number" name="totalBudget" value={programForm.totalBudget} onChange={handleProgramChange} className="form-input" placeholder="500000" min="0" required style={{fontWeight:700,fontSize:15}}/>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" name="startDate" value={programForm.startDate} onChange={handleProgramChange} className="form-input"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input type="date" name="endDate" value={programForm.endDate} onChange={handleProgramChange} className="form-input"/>
                  </div>
                </div>
              </div>
              <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
                <button type="button" className="btn btn-secondary btn-md" onClick={()=>setShowProgramModal(false)} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-md" disabled={loading}
                  style={{background:'linear-gradient(135deg,#065F46,#10B981)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:160}}>
                  {loading?<><Loader size={15} className="animate-spin"/>Creating…</>:<><Gift size={15}/>Create Program</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ BENEFICIARY MODAL ══ */}
      {showBeneficiaryModal && (
        <div className="modal-overlay" onClick={()=>setShowBeneficiaryModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:560,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            {/* Header */}
            <div style={{background:'linear-gradient(135deg,#1D4ED8,#3B82F6)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Users size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Add Beneficiary</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Register a resident to a welfare program</p>
                  </div>
                </div>
                <button onClick={()=>setShowBeneficiaryModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            {/* Body */}
            <form onSubmit={handleBeneficiarySubmit} style={{display:'contents'}}>
              <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
                <div className="form-group">
                  <label className="form-label">Select Program <span style={{color:'#EF4444'}}>*</span></label>
                  <select name="programId" value={beneficiaryForm.programId} onChange={handleBeneficiaryChange} className="form-select" required>
                    <option value="">Choose a program</option>
                    {programs.filter(p=>p.status==='Active').map(program=>(
                      <option key={program.id} value={program.programId}>{program.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Beneficiary Name <span style={{color:'#EF4444'}}>*</span></label>
                  <input type="text" name="name" value={beneficiaryForm.name} onChange={handleBeneficiaryChange} className="form-input" placeholder="Full name" required style={{fontSize:15,fontWeight:500}}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Resident ID <span style={{fontSize:11.5,color:'#94A3B8',fontWeight:400}}>(optional)</span></label>
                  <input type="text" name="residentId" value={beneficiaryForm.residentId} onChange={handleBeneficiaryChange} className="form-input" placeholder="RES-2024-0001"/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div className="form-group">
                    <label className="form-label">Category <span style={{color:'#EF4444'}}>*</span></label>
                    <select name="category" value={beneficiaryForm.category} onChange={handleBeneficiaryChange} className="form-select" required>
                      <option value="senior_citizen">Senior Citizen</option>
                      <option value="pwd">PWD</option>
                      <option value="4ps">4Ps</option>
                      <option value="indigent">Indigent</option>
                      <option value="solo_parent">Solo Parent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Purok / Sitio</label>
                    <input type="text" name="purok" value={beneficiaryForm.purok} onChange={handleBeneficiaryChange} className="form-input" placeholder="e.g. Purok 1"/>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
                <button type="button" className="btn btn-secondary btn-md" onClick={()=>setShowBeneficiaryModal(false)} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-md" disabled={loading}
                  style={{background:'linear-gradient(135deg,#1D4ED8,#3B82F6)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:160}}>
                  {loading?<><Loader size={15} className="animate-spin"/>Adding…</>:<><Users size={15}/>Add Beneficiary</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DISTRIBUTION MODAL ══ */}
      {showDistributionModal && (
        <div className="modal-overlay" onClick={()=>setShowDistributionModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:560,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            {/* Header */}
            <div style={{background:'linear-gradient(135deg,#5B21B6,#8B5CF6)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><Gift size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Record Distribution</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Log an aid distribution to a beneficiary</p>
                  </div>
                </div>
                <button onClick={()=>setShowDistributionModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            {/* Body */}
            <form onSubmit={handleDistributionSubmit} style={{display:'contents'}}>
              <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
                <div className="form-group">
                  <label className="form-label">Select Program <span style={{color:'#EF4444'}}>*</span></label>
                  <select name="programId" value={distributionForm.programId} onChange={handleDistributionChange} className="form-select" required>
                    <option value="">Choose a program</option>
                    {programs.filter(p=>p.status==='Active').map(program=>(
                      <option key={program.id} value={program.programId}>{program.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Recipient Name <span style={{color:'#EF4444'}}>*</span></label>
                  <input type="text" name="residentName" value={distributionForm.residentName} onChange={handleDistributionChange} className="form-input" placeholder="Enter recipient full name" required style={{fontSize:15,fontWeight:500}}/>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div className="form-group">
                    <label className="form-label">Amount (₱) <span style={{color:'#EF4444'}}>*</span></label>
                    <input type="number" name="amount" value={distributionForm.amount} onChange={handleDistributionChange} className="form-input" placeholder="1500" min="0" required style={{fontWeight:700,fontSize:16}}/>
                  </div>
                  <div>
                    <label className="form-label">Aid Type <span style={{color:'#EF4444'}}>*</span></label>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                      {[{v:'cash',l:'Cash'},{v:'food',l:'Food'},{v:'medicine',l:'Medicine'},{v:'supplies',l:'Supplies'}].map(t=>{
                        const a=distributionForm.aidType===t.v;
                        return<button key={t.v} type="button" onClick={()=>handleDistributionChange({target:{name:'aidType',value:t.v}})}
                          style={{flex:1,padding:'8px 6px',borderRadius:9,border:'2px solid '+(a?'#7C3AED':'#E2E8F0'),background:a?'#F5F3FF':'#fff',color:a?'#5B21B6':'#64748B',fontSize:12,fontWeight:a?700:500,cursor:'pointer',transition:'all 0.12s'}}>{t.l}</button>;
                      })}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Verification Method</label>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {['Manual','Biometric','OTP','Digital Signature'].map(v=>{
                      const a=distributionForm.verificationMethod===v;
                      return<button key={v} type="button" onClick={()=>handleDistributionChange({target:{name:'verificationMethod',value:v}})}
                        style={{padding:'7px 14px',borderRadius:100,fontSize:12.5,fontWeight:a?700:500,border:'1.5px solid '+(a?'#7C3AED':'#E2E8F0'),background:a?'#F5F3FF':'#fff',color:a?'#5B21B6':'#64748B',cursor:'pointer',transition:'all 0.12s'}}>{v}</button>;
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks <span style={{fontSize:11.5,color:'#94A3B8',fontWeight:400}}>(optional)</span></label>
                  <textarea name="remarks" value={distributionForm.remarks} onChange={handleDistributionChange} className="form-textarea" rows="3" placeholder="Additional notes about this distribution..."/>
                </div>
              </div>
              {/* Footer */}
              <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
                <button type="button" className="btn btn-secondary btn-md" onClick={()=>setShowDistributionModal(false)} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-md" disabled={loading}
                  style={{background:'linear-gradient(135deg,#5B21B6,#8B5CF6)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:170}}>
                  {loading?<><Loader size={15} className="animate-spin"/>Recording…</>:<><Check size={15}/>Record Distribution</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── GRIEVANCES TAB ── */}
      {activeTab === 'grievances' && (
        <div className="card">
          <div className="card-header">
            <h3 className="table-title">Grievances & Appeals</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setGrievanceErr(''); setShowGrievanceModal(true); }}>
              <Plus size={15} /> Submit Grievance
            </button>
          </div>
          <div className="card-body">
            {grievanceLoading ? <p className="text-secondary">Loading...</p> : grievances.length === 0 ? (
              <div className="empty-state">
                <MessageSquare className="empty-state-icon" />
                <h3 className="empty-state-title">No grievances filed</h3>
                <p className="empty-state-description">Residents can submit complaints or appeals about aid distribution</p>
                <button className="btn btn-primary btn-md mt-4" onClick={() => { setGrievanceErr(''); setShowGrievanceModal(true); }}><Plus size={16} /> Submit First Grievance</button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {grievances.map(g => (
                  <div key={g.id} className={`list-card list-card-${g.status === 'Pending' ? 'warning' : g.status === 'Resolved' ? 'success' : 'primary'}`}>
                    <div className="list-card-content">
                      <div className="list-card-body">
                        <div className="list-card-header">
                          <span className={`badge badge-${g.status === 'Pending' ? 'warning' : g.status === 'Resolved' ? 'success' : 'primary'}`}>{g.status}</span>
                          <span className="badge badge-gray">{g.category}</span>
                        </div>
                        <h4 className="list-card-title">{g.fullName}</h4>
                        <p className="list-card-description">{g.description}</p>
                        <div className="list-card-meta">
                          {g.purok && <span className="list-card-meta-item">{g.purok}</span>}
                          {g.programName && <span className="list-card-meta-item">Program: {g.programName}</span>}
                          {g.contactNumber && <span className="list-card-meta-item">{g.contactNumber}</span>}
                        </div>
                        {g.resolution && <p className="text-secondary mt-2" style={{ fontSize: 'var(--font-size-sm)' }}>Resolution: {g.resolution}</p>}
                      </div>
                      <div className="list-card-actions">
                        {g.status === 'Pending' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedGrievance(g); setResolution(''); setShowResolveModal(true); }}>
                            Review
                          </button>
                        )}
                        <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) { deleteGrievance(g.id); loadGrievances(); } }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ GRIEVANCE SUBMIT MODAL ══ */}
      {showGrievanceModal && (
        <div className="modal-overlay" onClick={()=>setShowGrievanceModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:540,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><MessageSquare size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Submit Grievance / Appeal</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>File a complaint or appeal regarding a welfare program</p>
                  </div>
                </div>
                <button onClick={()=>setShowGrievanceModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {grievanceErr&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'#FEF2F2',border:'1.5px solid #FECACA',borderRadius:10,fontSize:13,color:'#DC2626',fontWeight:500}}><AlertCircle size={14}/>{grievanceErr}</div>}
              <div className="form-group">
                <label className="form-label">Full Name <span style={{color:'#EF4444'}}>*</span></label>
                <input className="form-input" value={grievanceForm.fullName} onChange={e=>setGrievanceForm(p=>({...p,fullName:e.target.value}))} placeholder="Resident's full name" style={{fontSize:15,fontWeight:500}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group"><label className="form-label">Purok / Sitio</label><input className="form-input" value={grievanceForm.purok} onChange={e=>setGrievanceForm(p=>({...p,purok:e.target.value}))} placeholder="e.g. Purok 3"/></div>
                <div className="form-group"><label className="form-label">Contact Number</label><input className="form-input" value={grievanceForm.contactNumber} onChange={e=>setGrievanceForm(p=>({...p,contactNumber:e.target.value}))} placeholder="09xxxxxxxxx"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={grievanceForm.category} onChange={e=>setGrievanceForm(p=>({...p,category:e.target.value}))}>
                    <option>Aid Distribution</option><option>Eligibility</option><option>Program Complaint</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Related Program <span style={{fontSize:11.5,color:'#94A3B8',fontWeight:400}}>(optional)</span></label><input className="form-input" value={grievanceForm.programName} onChange={e=>setGrievanceForm(p=>({...p,programName:e.target.value}))} placeholder="e.g. 4Ps, Ayuda"/></div>
              </div>
              <div className="form-group">
                <label className="form-label">Description <span style={{color:'#EF4444'}}>*</span><span style={{fontSize:11.5,color:'#94A3B8',fontWeight:400,marginLeft:6}}>{grievanceForm.description.length}/500</span></label>
                <textarea className="form-textarea" rows={4} maxLength={500} value={grievanceForm.description} onChange={e=>setGrievanceForm(p=>({...p,description:e.target.value}))} placeholder="Describe your complaint, concern, or appeal in detail. Include dates and specific incidents if applicable..." style={{lineHeight:1.65}}/>
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowGrievanceModal(false)} disabled={grievanceSaving}>Cancel</button>
              <button className="btn btn-md" onClick={handleGrievanceSave} disabled={grievanceSaving} style={{background:'linear-gradient(135deg,#92400E,#F59E0B)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:160}}>
                <Send size={15}/>{grievanceSaving?'Submitting…':'Submit Grievance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ RESOLVE GRIEVANCE MODAL ══ */}
      {showResolveModal && selectedGrievance && (
        <div className="modal-overlay" onClick={()=>setShowResolveModal(false)} style={{backdropFilter:'blur(8px)',background:'rgba(15,23,42,0.50)'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:22,width:'100%',maxWidth:480,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 64px rgba(15,23,42,0.20)',overflow:'hidden',animation:'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)'}}>
            <div style={{background:'linear-gradient(135deg,#065F46,#10B981)',padding:'20px 24px 18px',flexShrink:0,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',right:-20,top:-20,width:90,height:90,borderRadius:'50%',background:'rgba(255,255,255,0.08)',pointerEvents:'none'}}/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}><CheckCircle size={20} color="#fff"/></div>
                  <div>
                    <h2 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0,letterSpacing:'-0.025em'}}>Review Grievance</h2>
                    <p style={{fontSize:12.5,color:'rgba(255,255,255,0.72)',margin:'2px 0 0'}}>Resolve or dismiss this grievance</p>
                  </div>
                </div>
                <button onClick={()=>setShowResolveModal(false)} style={{width:30,height:30,borderRadius:8,background:'rgba(255,255,255,0.15)',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.28)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}><X size={16}/></button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'22px 24px',display:'flex',flexDirection:'column',gap:16}}>
              {/* Grievance summary card */}
              <div style={{background:'#F8FAFC',border:'1.5px solid #F0F4F8',borderRadius:14,padding:'14px 16px'}}>
                <p style={{fontSize:10.5,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'.08em',margin:'0 0 8px'}}>Grievance Details</p>
                <p style={{fontSize:14,fontWeight:700,color:'#0F172A',margin:'0 0 4px'}}>{selectedGrievance.fullName}</p>
                <p style={{fontSize:12.5,color:'#64748B',margin:'0 0 8px',lineHeight:1.55}}>{selectedGrievance.description}</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {selectedGrievance.category&&<span style={{fontSize:11,padding:'2px 9px',borderRadius:100,background:'#FEF3C7',color:'#92400E',fontWeight:600}}>{selectedGrievance.category}</span>}
                  {selectedGrievance.purok&&<span style={{fontSize:11,padding:'2px 9px',borderRadius:100,background:'#F1F5F9',color:'#475569',fontWeight:500}}>{selectedGrievance.purok}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Resolution Notes</label>
                <textarea className="form-textarea" rows={3} value={resolution} onChange={e=>setResolution(e.target.value)} placeholder="Explain how this was resolved, what action was taken, or why it was dismissed..."/>
              </div>
            </div>
            <div style={{padding:'14px 24px',borderTop:'1.5px solid #F0F4F8',display:'flex',justifyContent:'flex-end',background:'#FAFBFE',flexShrink:0,gap:10}}>
              <button className="btn btn-secondary btn-md" onClick={()=>setShowResolveModal(false)}>Cancel</button>
              <button className="btn btn-md" onClick={()=>handleResolve('Dismissed')} style={{background:'#F1F5F9',color:'#475569',border:'1.5px solid #E2E8F0',display:'flex',alignItems:'center',gap:7,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>Dismiss</button>
              <button className="btn btn-md" onClick={()=>handleResolve('Resolved')} style={{background:'linear-gradient(135deg,#065F46,#10B981)',color:'#fff',border:'none',display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',minWidth:150}}>
                <Check size={15}/> Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SocialWelfare;