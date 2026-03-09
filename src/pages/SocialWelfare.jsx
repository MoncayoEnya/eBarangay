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
  MoreVertical
} from 'lucide-react';
import { useWelfare } from '../hooks/useWelfare';

const SocialWelfare = () => {
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
  }, []);

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

      {/* Program Modal */}
      {showProgramModal && (
        <div className="modal-overlay" onClick={() => setShowProgramModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Program</h3>
              <button className="btn-icon" onClick={() => setShowProgramModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleProgramSubmit}>
              <div className="modal-body">
                <div className="d-flex flex-column gap-4">
                  <div className="form-group">
                    <label className="form-label">Program Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={programForm.name}
                      onChange={handleProgramChange}
                      className="form-input"
                      placeholder="e.g., Senior Citizens Quarterly Cash Aid"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      value={programForm.description}
                      onChange={handleProgramChange}
                      className="form-input"
                      rows="3"
                      placeholder="Describe the program..."
                    />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select
                        name="category"
                        value={programForm.category}
                        onChange={handleProgramChange}
                        className="form-select"
                        required
                      >
                        <option value="senior_citizen">Senior Citizen</option>
                        <option value="pwd">PWD</option>
                        <option value="emergency">Emergency Ayuda</option>
                        <option value="medical">Medical Assistance</option>
                        <option value="educational">Educational</option>
                        <option value="livelihood">Livelihood</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Aid Type *</label>
                      <select
                        name="aidType"
                        value={programForm.aidType}
                        onChange={handleProgramChange}
                        className="form-select"
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="food">Food Packs</option>
                        <option value="medicine">Medicine</option>
                        <option value="supplies">Supplies</option>
                        <option value="voucher">Voucher</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Amount per Beneficiary (₱)</label>
                      <input
                        type="number"
                        name="amountPerBeneficiary"
                        value={programForm.amountPerBeneficiary}
                        onChange={handleProgramChange}
                        className="form-input"
                        placeholder="1500"
                        min="0"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Total Budget (₱) *</label>
                      <input
                        type="number"
                        name="totalBudget"
                        value={programForm.totalBudget}
                        onChange={handleProgramChange}
                        className="form-input"
                        placeholder="500000"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={programForm.startDate}
                        onChange={handleProgramChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={programForm.endDate}
                        onChange={handleProgramChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowProgramModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Gift size={16} />
                      Create Program
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Beneficiary Modal */}
      {showBeneficiaryModal && (
        <div className="modal-overlay" onClick={() => setShowBeneficiaryModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Beneficiary</h3>
              <button className="btn-icon" onClick={() => setShowBeneficiaryModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleBeneficiarySubmit}>
              <div className="modal-body">
                <div className="d-flex flex-column gap-4">
                  <div className="form-group">
                    <label className="form-label">Select Program *</label>
                    <select
                      name="programId"
                      value={beneficiaryForm.programId}
                      onChange={handleBeneficiaryChange}
                      className="form-select"
                      required
                    >
                      <option value="">Choose a program</option>
                      {programs.filter(p => p.status === 'Active').map(program => (
                        <option key={program.id} value={program.programId}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Beneficiary Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={beneficiaryForm.name}
                      onChange={handleBeneficiaryChange}
                      className="form-input"
                      placeholder="Enter name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Resident ID (Optional)</label>
                    <input
                      type="text"
                      name="residentId"
                      value={beneficiaryForm.residentId}
                      onChange={handleBeneficiaryChange}
                      className="form-input"
                      placeholder="RES-2024-0001"
                    />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select
                        name="category"
                        value={beneficiaryForm.category}
                        onChange={handleBeneficiaryChange}
                        className="form-select"
                        required
                      >
                        <option value="senior_citizen">Senior Citizen</option>
                        <option value="pwd">PWD</option>
                        <option value="4ps">4Ps</option>
                        <option value="indigent">Indigent</option>
                        <option value="solo_parent">Solo Parent</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Purok</label>
                      <input
                        type="text"
                        name="purok"
                        value={beneficiaryForm.purok}
                        onChange={handleBeneficiaryChange}
                        className="form-input"
                        placeholder="Purok 1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowBeneficiaryModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Users size={16} />
                      Add Beneficiary
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Distribution Modal */}
      {showDistributionModal && (
        <div className="modal-overlay" onClick={() => setShowDistributionModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Record Distribution</h3>
              <button className="btn-icon" onClick={() => setShowDistributionModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleDistributionSubmit}>
              <div className="modal-body">
                <div className="d-flex flex-column gap-4">
                  <div className="form-group">
                    <label className="form-label">Select Program *</label>
                    <select
                      name="programId"
                      value={distributionForm.programId}
                      onChange={handleDistributionChange}
                      className="form-select"
                      required
                    >
                      <option value="">Choose a program</option>
                      {programs.filter(p => p.status === 'Active').map(program => (
                        <option key={program.id} value={program.programId}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Recipient Name *</label>
                    <input
                      type="text"
                      name="residentName"
                      value={distributionForm.residentName}
                      onChange={handleDistributionChange}
                      className="form-input"
                      placeholder="Enter recipient name"
                      required
                    />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Amount (₱) *</label>
                      <input
                        type="number"
                        name="amount"
                        value={distributionForm.amount}
                        onChange={handleDistributionChange}
                        className="form-input"
                        placeholder="1500"
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Aid Type *</label>
                      <select
                        name="aidType"
                        value={distributionForm.aidType}
                        onChange={handleDistributionChange}
                        className="form-select"
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="food">Food Packs</option>
                        <option value="medicine">Medicine</option>
                        <option value="supplies">Supplies</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Verification Method</label>
                    <select
                      name="verificationMethod"
                      value={distributionForm.verificationMethod}
                      onChange={handleDistributionChange}
                      className="form-select"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Biometric">Biometric</option>
                      <option value="OTP">OTP</option>
                      <option value="Digital Signature">Digital Signature</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <textarea
                      name="remarks"
                      value={distributionForm.remarks}
                      onChange={handleDistributionChange}
                      className="form-input"
                      rows="3"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDistributionModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Record Distribution
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialWelfare;