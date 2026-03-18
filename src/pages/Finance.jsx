// src/pages/Finance.jsx
import React, { useState, useEffect, useCallback } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useFinance } from '../hooks/useFinance';
import {
  DollarSign, Receipt, Wallet, Hourglass, Plus, Download,
  Trash2, Edit, X, Save, TrendingUp, AlertCircle, Users,
  FileText, ChevronDown, ChevronUp, Loader, CheckCircle,
  Printer, BarChart2, Eye, CreditCard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend
} from 'recharts';
import {
  createEmployee, getAllEmployees, updateEmployee, deleteEmployee,
  generatePayroll, getAllPayrollRuns, releasePayroll, deletePayrollRun,
  getPayrollStats,
} from '../services/payrollService';
import {
  generateOfficialReceipt, generatePayslip, generateFinancialStatement,
} from '../utils/financeUtils';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES   = ['Revenue', 'Expense', 'Payroll'];
const STATUSES     = ['Paid', 'Pending', 'Cancelled'];
const BUDGET_COLORS = ['success', 'warning', 'error', 'primary'];
const EMP_TYPES    = ['Regular', 'Casual', 'Job Order'];
const POSITIONS    = [
  'Punong Barangay', 'Barangay Kagawad', 'SK Chairperson',
  'Barangay Secretary', 'Barangay Treasurer', 'Barangay Health Worker',
  'Barangay Tanod', 'Administrative Aide', 'Other'
];
const DEPTS = ['Barangay Hall', 'Health Center', 'Tanod', 'SK', 'Other'];

const emptyTxn     = { description: '', category: 'Expense', amount: '', date: new Date().toISOString().split('T')[0], status: 'Paid', reference: '', notes: '', paidBy: '', paymentMethod: 'Cash' };
const emptyBudget  = { label: '', total: '', spent: '0', year: new Date().getFullYear(), color: 'primary' };
const emptyEmp     = { employeeId: '', fullName: '', position: 'Barangay Kagawad', department: 'Barangay Hall', employeeType: 'Regular', status: 'Active', basicSalary: '', bankAccount: '', contactNumber: '', address: '', dateHired: '', allowances: { rice: '', clothing: '', medical: '', other: '' }, deductions: { sss: '', philhealth: '', pagibig: '', tax: '', other: '' } };

const fmt    = (n) => '₱' + Math.abs(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 0 });
const fmtFull = (n) => '₱' + Math.abs(Number(n) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });

// ─── Shared Modal Shell ───────────────────────────────────────────────────────
function Modal({ open, onClose, maxWidth = 560, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(8px)', background: 'rgba(15,23,42,0.50)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 22, width: '100%', maxWidth, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(15,23,42,0.20)', overflow: 'hidden', animation: 'slideInUp 0.22s cubic-bezier(0.34,1.15,0.64,1)' }}>
        {children}
      </div>
    </div>
  );
}
function ModalHeader({ gradient, icon: Icon, title, subtitle, onClose, pills, pillValue, setPillValue }) {
  return (
    <div style={{ background: gradient, padding: '20px 24px 0', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -20, top: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pills ? 0 : 18, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color="#fff" /></div>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.025em' }}>{title}</h2>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', margin: '2px 0 0' }}>{subtitle}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}><X size={16} /></button>
      </div>
      {pills && (
        <div style={{ display: 'flex', gap: 6, paddingBottom: 16, paddingTop: 12 }}>
          {pills.map(p => {
            const a = pillValue === p;
            return <button key={p} type="button" onClick={() => setPillValue(p)} style={{ padding: '5px 13px', borderRadius: 100, fontSize: 11.5, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s', background: a ? '#fff' : 'rgba(255,255,255,0.15)', color: a ? '#1D4ED8' : 'rgba(255,255,255,0.9)', boxShadow: a ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' }}>{p}</button>;
          })}
        </div>
      )}
    </div>
  );
}
function ModalBody({ children }) {
  return <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>;
}
function ModalFooter({ onCancel, onSave, saving, saveLabel, saveGradient }) {
  return (
    <div style={{ padding: '14px 24px', borderTop: '1.5px solid #F0F4F8', display: 'flex', justifyContent: 'flex-end', background: '#FAFBFE', flexShrink: 0, gap: 10 }}>
      <button className="btn btn-secondary btn-md" onClick={onCancel} disabled={saving}>Cancel</button>
      <button className="btn btn-md" onClick={onSave} disabled={saving} style={{ background: saveGradient || 'linear-gradient(135deg,#1D4ED8,#3B82F6)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', minWidth: 150 }}>
        <Save size={15} />{saving ? 'Saving…' : saveLabel}
      </button>
    </div>
  );
}
function FG({ label, required, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>
      {children}
    </div>
  );
}
function G2({ children, gap = 14 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap }}>{children}</div>;
}
function ErrBanner({ msg }) {
  if (!msg) return null;
  return <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626', fontWeight: 500 }}><AlertCircle size={14} />{msg}</div>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Finance() {
  const {
    transactions, budgetItems, loading, error, stats,
    loadAll, addTransaction, editTransaction, removeTransaction,
    addBudgetItem, editBudgetItem, removeBudgetItem, loadStats,
  } = useFinance();

  const [activeTab, setActiveTab] = useState('transactions');

  // Transaction modal
  const [showTxnModal, setShowTxnModal]   = useState(false);
  const [editingTxn, setEditingTxn]       = useState(null);
  const [txnForm, setTxnForm]             = useState(emptyTxn);
  const [txnSaving, setTxnSaving]         = useState(false);
  const [txnErr, setTxnErr]               = useState('');
  const [filterCat, setFilterCat]         = useState('All');

  // Budget modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget]     = useState(null);
  const [budgetForm, setBudgetForm]           = useState(emptyBudget);
  const [budgetSaving, setBudgetSaving]       = useState(false);
  const [budgetErr, setBudgetErr]             = useState('');

  // Payroll state
  const [employees, setEmployees]           = useState([]);
  const [payrollRuns, setPayrollRuns]       = useState([]);
  const [payrollStats, setPayrollStats]     = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [showEmpModal, setShowEmpModal]     = useState(false);
  const [editingEmp, setEditingEmp]         = useState(null);
  const [empForm, setEmpForm]               = useState(emptyEmp);
  const [empSaving, setEmpSaving]           = useState(false);
  const [empErr, setEmpErr]                 = useState('');
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payPeriodFrom, setPayPeriodFrom]   = useState('');
  const [payPeriodTo, setPayPeriodTo]       = useState('');
  const [payrollSaving, setPayrollSaving]   = useState(false);
  const [payrollErr, setPayrollErr]         = useState('');
  const [expandedRun, setExpandedRun]       = useState(null);
  const [payrollSubTab, setPayrollSubTab]   = useState('employees');

  // Report state
  const [reportPeriod, setReportPeriod]     = useState('Annual');

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (activeTab === 'payroll') loadPayrollData(); }, [activeTab]);

  const loadPayrollData = async () => {
    setPayrollLoading(true);
    const [empRes, runRes, statRes] = await Promise.all([
      getAllEmployees(), getAllPayrollRuns(), getPayrollStats()
    ]);
    if (empRes.success)  setEmployees(empRes.data);
    if (runRes.success)  setPayrollRuns(runRes.data);
    if (statRes.success) setPayrollStats(statRes.data);
    setPayrollLoading(false);
  };

  // ── Transactions ──
  const openAddTxn  = () => { setTxnForm(emptyTxn); setEditingTxn(null); setTxnErr(''); setShowTxnModal(true); };
  const openEditTxn = (t) => {
    setTxnForm({ description: t.description, category: t.category, amount: Math.abs(t.amount), date: t.date, status: t.status, reference: t.reference || '', notes: t.notes || '', paidBy: t.paidBy || '', paymentMethod: t.paymentMethod || 'Cash' });
    setEditingTxn(t); setTxnErr(''); setShowTxnModal(true);
  };
  const handleTxnSave = async () => {
    if (!txnForm.description.trim() || !txnForm.amount) { setTxnErr('Description and amount required.'); return; }
    setTxnSaving(true);
    const amt = txnForm.category === 'Expense' || txnForm.category === 'Payroll' ? -Math.abs(Number(txnForm.amount)) : Math.abs(Number(txnForm.amount));
    const result = editingTxn ? await editTransaction(editingTxn.id, { ...txnForm, amount: amt }) : await addTransaction({ ...txnForm, amount: amt });
    setTxnSaving(false);
    if (result.success) { setShowTxnModal(false); loadStats(); }
    else setTxnErr(result.error || 'Error saving.');
  };

  // ── Budget ──
  const openAddBudget  = () => { setBudgetForm(emptyBudget); setEditingBudget(null); setBudgetErr(''); setShowBudgetModal(true); };
  const openEditBudget = (b) => { setBudgetForm({ label: b.label, total: b.total, spent: b.spent, year: b.year, color: b.color }); setEditingBudget(b); setBudgetErr(''); setShowBudgetModal(true); };
  const handleBudgetSave = async () => {
    if (!budgetForm.label.trim() || !budgetForm.total) { setBudgetErr('Label and total required.'); return; }
    setBudgetSaving(true);
    const result = editingBudget ? await editBudgetItem(editingBudget.id, budgetForm) : await addBudgetItem(budgetForm);
    setBudgetSaving(false);
    if (result.success) setShowBudgetModal(false);
    else setBudgetErr(result.error || 'Error saving.');
  };

  // ── Employee ──
  const openAddEmp  = () => { setEmpForm(emptyEmp); setEditingEmp(null); setEmpErr(''); setShowEmpModal(true); };
  const openEditEmp = (e) => { setEmpForm({ ...e, basicSalary: e.basicSalary || '', allowances: e.allowances || emptyEmp.allowances, deductions: e.deductions || emptyEmp.deductions }); setEditingEmp(e); setEmpErr(''); setShowEmpModal(true); };
  const handleEmpSave = async () => {
    if (!empForm.fullName.trim()) { setEmpErr('Full name required.'); return; }
    setEmpSaving(true);
    const payload = { ...empForm, basicSalary: Number(empForm.basicSalary || 0), allowances: { rice: Number(empForm.allowances?.rice || 0), clothing: Number(empForm.allowances?.clothing || 0), medical: Number(empForm.allowances?.medical || 0), other: Number(empForm.allowances?.other || 0) }, deductions: { sss: Number(empForm.deductions?.sss || 0), philhealth: Number(empForm.deductions?.philhealth || 0), pagibig: Number(empForm.deductions?.pagibig || 0), tax: Number(empForm.deductions?.tax || 0), other: Number(empForm.deductions?.other || 0) } };
    const result = editingEmp ? await updateEmployee(editingEmp.id, payload, null) : await createEmployee(payload, null);
    setEmpSaving(false);
    if (result.success) { setShowEmpModal(false); loadPayrollData(); }
    else setEmpErr(result.error || 'Error saving.');
  };

  // ── Payroll Run ──
  const handleGeneratePayroll = async () => {
    if (!payPeriodFrom || !payPeriodTo) { setPayrollErr('Both period dates required.'); return; }
    const active = employees.filter(e => e.status === 'Active');
    if (!active.length) { setPayrollErr('No active employees found.'); return; }
    setPayrollSaving(true);
    const result = await generatePayroll(payPeriodFrom, payPeriodTo, active, null);
    setPayrollSaving(false);
    if (result.success) { setShowPayrollModal(false); loadPayrollData(); }
    else setPayrollErr(result.error || 'Error generating payroll.');
  };

  const handleReleasePayroll = async (id) => {
    if (!window.confirm('Release this payroll? This marks all records as released.')) return;
    await releasePayroll(id, null);
    loadPayrollData();
  };

  // ── Derived ──
  const filteredTxns = filterCat === 'All' ? transactions : transactions.filter(t => t.category === filterCat);

  // Chart data — monthly revenue vs expense
  const monthlyData = (() => {
    const months = {};
    transactions.forEach(t => {
      const m = (t.date || '').slice(0, 7); // YYYY-MM
      if (!m) return;
      if (!months[m]) months[m] = { month: m, revenue: 0, expense: 0 };
      if (t.type === 'income') months[m].revenue += Math.abs(t.amount || 0);
      else months[m].expense += Math.abs(t.amount || 0);
    });
    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6).map(m => ({
      ...m,
      month: new Date(m.month + '-01').toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
    }));
  })();

  const txnGradient = txnForm.category === 'Revenue' ? 'linear-gradient(135deg,#065F46,#10B981)' : txnForm.category === 'Payroll' ? 'linear-gradient(135deg,#5B21B6,#8B5CF6)' : 'linear-gradient(135deg,#991B1B,#EF4444)';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Financial Management</h1>
          <p className="page-subtitle">Transactions, payroll, budgets, and financial reports</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-md" onClick={() => generateFinancialStatement(transactions, budgetItems, reportPeriod)}>
            <FileText size={16} /> Financial Statement
          </button>
          <button className="btn btn-primary btn-md" onClick={openAddTxn}><Plus size={18} /> New Transaction</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard title="Total Revenue"   value={fmt(stats?.totalRevenue)}  icon={DollarSign} iconBg="icon-bg-success" badge="All time"       badgeColor="badge-success" />
        <StatCard title="Total Expenses"  value={fmt(stats?.totalExpenses)} icon={Receipt}    iconBg="icon-bg-error"   badge="All time"       badgeColor="badge-error" />
        <StatCard title="Balance"         value={fmt(stats?.balance)}       icon={Wallet}     iconBg="icon-bg-primary" badge="Net"            badgeColor="badge-primary" />
        <StatCard title="Active Staff"    value={payrollStats?.activeEmployees || employees.filter(e => e.status === 'Active').length} icon={Users} iconBg="icon-bg-warning" badge="Employees" badgeColor="badge-warning" />
      </div>

      {/* Tabs */}
      <div className="filters-section mb-0">
        <div className="filter-buttons-group">
          {[['transactions','Transactions'],['budget','Budget'],['payroll','Payroll'],['receipts','Receipts'],['reports','Reports']].map(([id, label]) => (
            <button key={id} className={`filter-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error mb-4 mt-4">{error}</div>}

      {/* ══════════════════════════════════════════════
          TAB: TRANSACTIONS
      ══════════════════════════════════════════════ */}
      {activeTab === 'transactions' && (
        <div className="data-table-card mt-4">
          <div className="table-header">
            <h3 className="table-title">Transactions</h3>
            <div className="d-flex gap-2 align-center">
              <select className="form-select" style={{ minWidth: 140 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={openAddTxn}><Plus size={15} /> Add</button>
            </div>
          </div>
          {loading ? <p className="text-secondary p-4">Loading…</p> : filteredTxns.length === 0 ? (
            <div className="empty-state"><Receipt className="empty-state-icon" /><h3 className="empty-state-title">No transactions yet</h3><button className="btn btn-primary btn-md mt-4" onClick={openAddTxn}><Plus size={16} /> Add First Transaction</button></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Status</th><th>Ref / OR</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredTxns.map(t => (
                    <tr key={t.id}>
                      <td className="text-secondary">{t.date}</td>
                      <td className="fw-medium">{t.description}</td>
                      <td><span className={`badge badge-${t.category === 'Revenue' ? 'success' : t.category === 'Payroll' ? 'primary' : 'error'}`}>{t.category}</span></td>
                      <td><span className="fw-semibold" style={{ color: t.type === 'income' ? 'var(--color-success)' : 'var(--color-error)' }}>{t.amount >= 0 ? '+' : ''}{fmt(t.amount)}</span></td>
                      <td><span className={`status-badge status-${t.status?.toLowerCase()}`}>{t.status}</span></td>
                      <td className="text-secondary">{t.reference || '—'}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn-icon" title="Print Receipt" onClick={() => generateOfficialReceipt(t)}><Printer size={14} /></button>
                          <button className="btn-icon" onClick={() => openEditTxn(t)}><Edit size={14} /></button>
                          <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete this transaction?')) removeTransaction(t.id); }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: BUDGET
      ══════════════════════════════════════════════ */}
      {activeTab === 'budget' && (
        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Budget vs Actual Chart */}
          {budgetItems.length > 0 && (
            <div className="card">
              <div className="card-header"><h3 className="table-title">Budget vs Actual Spending</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={budgetItems.map(b => ({ name: b.label.length > 14 ? b.label.slice(0, 14) + '…' : b.label, Budget: b.total, Spent: b.spent }))} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => '₱' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val) => fmt(val)} />
                    <Legend />
                    <Bar dataKey="Budget" fill="#BFDBFE" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
                      {budgetItems.map((b, i) => {
                        const pct = b.total > 0 ? (b.spent / b.total) * 100 : 0;
                        return <Cell key={i} fill={pct >= 90 ? '#EF4444' : pct >= 75 ? '#F59E0B' : '#10B981'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Budget Items */}
          <div className="card">
            <div className="card-header">
              <h3 className="table-title">Budget Items</h3>
              <button className="btn btn-primary btn-sm" onClick={openAddBudget}><Plus size={15} /> Add Item</button>
            </div>
            <div className="card-body">
              {loading ? <p className="text-secondary">Loading…</p> : budgetItems.length === 0 ? (
                <div className="empty-state"><TrendingUp className="empty-state-icon" /><h3 className="empty-state-title">No budget items yet</h3><button className="btn btn-primary btn-md mt-4" onClick={openAddBudget}><Plus size={16} /> Add Budget Item</button></div>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {budgetItems.map(b => {
                    const pct = b.total > 0 ? Math.min(100, Math.round((b.spent / b.total) * 100)) : 0;
                    const color = pct >= 90 ? 'error' : pct >= 75 ? 'warning' : 'success';
                    const remaining = (b.total || 0) - (b.spent || 0);
                    return (
                      <div key={b.id}>
                        <div className="d-flex justify-between align-center mb-1">
                          <div>
                            <span className="fw-semibold text-primary">{b.label}</span>
                            <span className="text-secondary" style={{ fontSize: 11, marginLeft: 8 }}>FY {b.year}</span>
                          </div>
                          <div className="d-flex align-center gap-3">
                            <span style={{ fontSize: 12, color: remaining >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
                              {remaining >= 0 ? `${fmt(remaining)} left` : `${fmt(Math.abs(remaining))} over`}
                            </span>
                            <span className="fw-medium text-secondary" style={{ fontSize: 12 }}>{fmt(b.spent)} <span className="text-tertiary">/ {fmt(b.total)}</span></span>
                            <button className="btn-icon" onClick={() => openEditBudget(b)}><Edit size={14} /></button>
                            <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeBudgetItem(b.id); }}><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <div style={{ width: '100%', height: 10, background: 'var(--color-bg-tertiary)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: `var(--color-${color})`, borderRadius: 100, transition: 'width .6s ease' }} />
                        </div>
                        <p className="text-tertiary mt-1" style={{ fontSize: 11 }}>{pct}% utilized</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: PAYROLL
      ══════════════════════════════════════════════ */}
      {activeTab === 'payroll' && (
        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Payroll stats */}
          {payrollStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
              {[
                { label: 'Total Employees', value: payrollStats.totalEmployees, color: '#2563EB', bg: '#EFF6FF' },
                { label: 'Active Staff', value: payrollStats.activeEmployees, color: '#059669', bg: '#ECFDF5' },
                { label: 'Last Payroll', value: fmt(payrollStats.lastPayrollAmount), color: '#7C3AED', bg: '#F5F3FF' },
                { label: 'Total Disbursed', value: fmt(payrollStats.totalDisbursed), color: '#D97706', bg: '#FFFBEB' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', border: `1px solid ${s.color}22` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Sub tabs */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1.5px solid #F0F4F8', paddingBottom: 0 }}>
            {[['employees', 'Employees'], ['runs', 'Payroll Runs']].map(([id, label]) => (
              <button key={id} onClick={() => setPayrollSubTab(id)}
                style={{ padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: payrollSubTab === id ? 700 : 500, color: payrollSubTab === id ? '#2563EB' : '#64748B', borderBottom: payrollSubTab === id ? '2.5px solid #2563EB' : '2.5px solid transparent', marginBottom: -1.5 }}>
                {label}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, paddingBottom: 6 }}>
              {payrollSubTab === 'employees' && <button className="btn btn-primary btn-sm" onClick={openAddEmp}><Plus size={14} /> Add Employee</button>}
              {payrollSubTab === 'runs' && <button className="btn btn-primary btn-sm" onClick={() => { setPayPeriodFrom(''); setPayPeriodTo(''); setPayrollErr(''); setShowPayrollModal(true); }}><Plus size={14} /> Generate Payroll</button>}
            </div>
          </div>

          {/* Employees table */}
          {payrollSubTab === 'employees' && (
            <div className="data-table-card">
              {payrollLoading ? <p className="text-secondary p-4">Loading…</p> : employees.length === 0 ? (
                <div className="empty-state"><Users className="empty-state-icon" /><h3 className="empty-state-title">No employees yet</h3><p className="empty-state-description">Add barangay officials and staff to manage payroll</p><button className="btn btn-primary btn-md mt-4" onClick={openAddEmp}><Plus size={16} /> Add First Employee</button></div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead><tr><th>Emp. No.</th><th>Name</th><th>Position</th><th>Type</th><th>Basic Salary</th><th>Gross Pay</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {employees.map(e => {
                        const totalAllow = (e.allowances?.rice || 0) + (e.allowances?.clothing || 0) + (e.allowances?.medical || 0) + (e.allowances?.other || 0);
                        const totalDeduct = (e.deductions?.sss || 0) + (e.deductions?.philhealth || 0) + (e.deductions?.pagibig || 0) + (e.deductions?.tax || 0) + (e.deductions?.other || 0);
                        const gross = (e.basicSalary || 0) + totalAllow;
                        const net   = gross - totalDeduct;
                        return (
                          <tr key={e.id}>
                            <td className="text-secondary">{e.employeeId || '—'}</td>
                            <td className="fw-medium">{e.fullName}</td>
                            <td className="text-secondary">{e.position}</td>
                            <td><span className="badge badge-primary">{e.employeeType}</span></td>
                            <td className="fw-medium">{fmt(e.basicSalary)}</td>
                            <td style={{ color: '#059669', fontWeight: 600 }}>{fmt(gross)}</td>
                            <td style={{ color: '#2563EB', fontWeight: 700 }}>{fmt(net)}</td>
                            <td><span className={`status-badge status-${e.status?.toLowerCase()}`}>{e.status}</span></td>
                            <td>
                              <div className="d-flex gap-1">
                                <button className="btn-icon" onClick={() => openEditEmp(e)}><Edit size={14} /></button>
                                <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete employee?')) { deleteEmployee(e.id); loadPayrollData(); } }}><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payroll runs */}
          {payrollSubTab === 'runs' && (
            <div className="d-flex flex-column gap-3">
              {payrollLoading ? <p className="text-secondary">Loading…</p> : payrollRuns.length === 0 ? (
                <div className="empty-state"><FileText className="empty-state-icon" /><h3 className="empty-state-title">No payroll runs yet</h3><p className="empty-state-description">Generate a payroll run to calculate salaries for all active employees</p></div>
              ) : payrollRuns.map(run => (
                <div key={run.id} className="card" style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: run.status === 'Released' ? '#ECFDF5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {run.status === 'Released' ? <CheckCircle size={20} color="#059669" /> : <Hourglass size={20} color="#D97706" />}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{run.payrollNumber}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{run.periodFrom} — {run.periodTo} &nbsp;·&nbsp; {run.headCount} employees</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#2563EB' }}>{fmt(run.totalNet)}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>Net Pay</div>
                      </div>
                      <span className={`status-badge status-${run.status?.toLowerCase()}`}>{run.status}</span>
                      <div className="d-flex gap-1">
                        <button className="btn-icon" title="Expand" onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}>{expandedRun === run.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                        {run.status === 'Pending' && <button className="btn-icon" style={{ color: '#059669' }} title="Release Payroll" onClick={() => handleReleasePayroll(run.id)}><CheckCircle size={16} /></button>}
                        <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete this payroll run?')) { deletePayrollRun(run.id); loadPayrollData(); } }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded payslip list */}
                  {expandedRun === run.id && (
                    <div style={{ borderTop: '1.5px solid #F0F4F8' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC' }}>
                            <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B' }}>Name</th>
                            <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: '#64748B' }}>Position</th>
                            <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#64748B' }}>Basic</th>
                            <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#64748B' }}>Gross</th>
                            <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#64748B' }}>Deductions</th>
                            <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>Net Pay</th>
                            <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>Payslip</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(run.records || []).map((r, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #F0F4F8' }}>
                              <td style={{ padding: '8px 16px', fontWeight: 600 }}>{r.fullName}</td>
                              <td style={{ padding: '8px 16px', color: '#64748B' }}>{r.position}</td>
                              <td style={{ padding: '8px 16px', textAlign: 'right' }}>{fmt(r.basicSalary)}</td>
                              <td style={{ padding: '8px 16px', textAlign: 'right' }}>{fmt(r.grossPay)}</td>
                              <td style={{ padding: '8px 16px', textAlign: 'right', color: '#EF4444' }}>−{fmt(r.deductions?.total)}</td>
                              <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{fmt(r.netPay)}</td>
                              <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => generatePayslip(r, run)}><Printer size={13} /> Print</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#F1F5F9', borderTop: '2px solid #E2E8F0' }}>
                            <td colSpan={3} style={{ padding: '8px 16px', fontWeight: 700 }}>TOTAL ({run.headCount} employees)</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700 }}>{fmt(run.totalGross)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 700, color: '#EF4444' }}>−{fmt(run.totalDeductions)}</td>
                            <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: 14 }}>{fmt(run.totalNet)}</td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: RECEIPTS
      ══════════════════════════════════════════════ */}
      {activeTab === 'receipts' && (
        <div className="data-table-card mt-4">
          <div className="table-header">
            <h3 className="table-title">Official Receipts</h3>
            <span className="text-secondary" style={{ fontSize: 12 }}>Click the printer icon on any Revenue transaction to generate an OR</span>
          </div>
          {transactions.filter(t => t.type === 'income').length === 0 ? (
            <div className="empty-state"><CreditCard className="empty-state-icon" /><h3 className="empty-state-title">No revenue transactions</h3><p className="empty-state-description">Add revenue transactions first, then print official receipts from here</p><button className="btn btn-primary btn-md mt-4" onClick={() => { setActiveTab('transactions'); openAddTxn(); }}><Plus size={16} /> Add Revenue Transaction</button></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Description</th><th>Paid By</th><th>Amount</th><th>Status</th><th>OR Number</th><th>Actions</th></tr></thead>
                <tbody>
                  {transactions.filter(t => t.type === 'income').map(t => (
                    <tr key={t.id}>
                      <td className="text-secondary">{t.date}</td>
                      <td className="fw-medium">{t.description}</td>
                      <td className="text-secondary">{t.paidBy || '—'}</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: 700 }}>+{fmt(t.amount)}</td>
                      <td><span className={`status-badge status-${t.status?.toLowerCase()}`}>{t.status}</span></td>
                      <td className="text-secondary">{t.reference || `OR-${t.id?.slice(-6).toUpperCase()}`}</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => generateOfficialReceipt({ ...t, reference: t.reference || `OR-${t.id?.slice(-6).toUpperCase()}` })}>
                          <Printer size={13} /> Print OR
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: REPORTS
      ══════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Revenue vs Expense Chart */}
          {monthlyData.length > 0 && (
            <div className="card">
              <div className="card-header"><h3 className="table-title">Revenue vs Expenses — Last 6 Months</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={v => '₱' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val) => fmt(val)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Financial Statement Generator */}
          <div className="card">
            <div className="card-header"><h3 className="table-title">Financial Statement Generator</h3></div>
            <div className="card-body">
              <p className="text-secondary mb-4" style={{ fontSize: 13 }}>Generate an official Statement of Income & Expenditure with budget utilization. Includes all transactions and budget items currently in the system.</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0, minWidth: 180 }}>
                  <label className="form-label">Report Period</label>
                  <select className="form-select" value={reportPeriod} onChange={e => setReportPeriod(e.target.value)}>
                    {['Annual', 'Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)', '1st Semester', '2nd Semester'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary btn-md" style={{ marginTop: 20 }} onClick={() => generateFinancialStatement(transactions, budgetItems, reportPeriod)}>
                  <FileText size={16} /> Generate Statement
                </button>
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #F0F4F8', fontSize: 13, color: '#64748B' }}>
                <strong>Includes:</strong> All {transactions.filter(t => t.type === 'income').length} revenue transactions &nbsp;·&nbsp; {transactions.filter(t => t.type === 'expense').length} expense items &nbsp;·&nbsp; {budgetItems.length} budget lines &nbsp;·&nbsp; Barangay signatories from Settings
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
            {[
              { label: 'Total Transactions', value: transactions.length, color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Total Revenue', value: fmt(stats?.totalRevenue || 0), color: '#059669', bg: '#ECFDF5' },
              { label: 'Total Expenses', value: fmt(stats?.totalExpenses || 0), color: '#DC2626', bg: '#FEF2F2' },
              { label: 'Net Balance', value: fmt(stats?.balance || 0), color: stats?.balance >= 0 ? '#059669' : '#DC2626', bg: '#F8FAFC' },
              { label: 'Budget Items', value: budgetItems.length, color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Payroll Runs', value: payrollRuns.length, color: '#D97706', bg: '#FFFBEB' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', border: `1px solid ${s.color}22` }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════ */}

      {/* Transaction Modal */}
      <Modal open={showTxnModal} onClose={() => setShowTxnModal(false)}>
        <ModalHeader gradient={txnGradient} icon={DollarSign} title={editingTxn ? 'Edit Transaction' : 'New Transaction'} subtitle="Record a barangay financial transaction" onClose={() => setShowTxnModal(false)} pills={CATEGORIES} pillValue={txnForm.category} setPillValue={v => setTxnForm(p => ({ ...p, category: v }))} />
        <ModalBody>
          <ErrBanner msg={txnErr} />
          <FG label="Description" required><input className="form-input" value={txnForm.description} onChange={e => setTxnForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Document Fees — Barangay Clearances" style={{ fontSize: 14, fontWeight: 500 }} /></FG>
          <FG label="Paid By / Received From"><input className="form-input" value={txnForm.paidBy} onChange={e => setTxnForm(p => ({ ...p, paidBy: e.target.value }))} placeholder="Name of person / agency" /></FG>
          <G2>
            <FG label="Amount (₱)" required>
              <input type="number" className="form-input" value={txnForm.amount} onChange={e => setTxnForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" min="0" style={{ fontSize: 16, fontWeight: 700 }} />
              <span style={{ fontSize: 11.5, color: txnForm.category === 'Revenue' ? '#059669' : '#DC2626', display: 'block', marginTop: 4, fontWeight: 600 }}>{txnForm.category === 'Revenue' ? '+ Income (positive)' : '− Expense (negative)'}</span>
            </FG>
            <FG label="Date"><input type="date" className="form-input" value={txnForm.date} onChange={e => setTxnForm(p => ({ ...p, date: e.target.value }))} /></FG>
          </G2>
          <G2>
            <div>
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {STATUSES.map(s => { const c = { Paid: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' }, Pending: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' }, Cancelled: { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' } }[s]; const a = txnForm.status === s; return <button key={s} type="button" onClick={() => setTxnForm(p => ({ ...p, status: s }))} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: '2px solid ' + (a ? c.color : c.border), background: a ? c.bg : '#fff', color: a ? c.color : '#64748B', fontSize: 12, fontWeight: a ? 700 : 500, cursor: 'pointer' }}>{s}</button>; })}
              </div>
            </div>
            <FG label="Payment Method">
              <select className="form-select" value={txnForm.paymentMethod} onChange={e => setTxnForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                {['Cash', 'Check', 'GCash', 'PayMaya', 'Bank Transfer', 'Other'].map(m => <option key={m}>{m}</option>)}
              </select>
            </FG>
          </G2>
          <FG label="Reference / OR Number"><input className="form-input" value={txnForm.reference} onChange={e => setTxnForm(p => ({ ...p, reference: e.target.value }))} placeholder="e.g. OR-2024-001 (optional)" /></FG>
          <FG label="Notes"><textarea className="form-textarea" rows={2} value={txnForm.notes} onChange={e => setTxnForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes…" /></FG>
        </ModalBody>
        <ModalFooter onCancel={() => setShowTxnModal(false)} onSave={handleTxnSave} saving={txnSaving} saveLabel={editingTxn ? 'Update' : 'Add Transaction'} saveGradient={txnGradient} />
      </Modal>

      {/* Budget Modal */}
      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} maxWidth={480}>
        <ModalHeader gradient="linear-gradient(135deg,#1E3A8A,#3B82F6)" icon={TrendingUp} title={editingBudget ? 'Edit Budget Item' : 'Add Budget Item'} subtitle="Track spending against allocated budget" onClose={() => setShowBudgetModal(false)} />
        <ModalBody>
          <ErrBanner msg={budgetErr} />
          <FG label="Budget Label" required><input className="form-input" value={budgetForm.label} onChange={e => setBudgetForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Personnel Services" style={{ fontSize: 14, fontWeight: 500 }} /></FG>
          <G2>
            <FG label="Total Budget (₱)" required><input type="number" className="form-input" value={budgetForm.total} onChange={e => setBudgetForm(p => ({ ...p, total: e.target.value }))} placeholder="0.00" style={{ fontSize: 15, fontWeight: 700 }} /></FG>
            <FG label="Amount Spent (₱)"><input type="number" className="form-input" value={budgetForm.spent} onChange={e => setBudgetForm(p => ({ ...p, spent: e.target.value }))} placeholder="0.00" style={{ fontSize: 15, fontWeight: 700 }} /></FG>
          </G2>
          {budgetForm.total > 0 && (() => {
            const pct = Math.min(100, Math.round((Number(budgetForm.spent) || 0) / Number(budgetForm.total) * 100));
            const clr = pct >= 90 ? '#EF4444' : pct >= 75 ? '#F59E0B' : '#10B981';
            return (
              <div style={{ background: '#F8FAFC', border: '1.5px solid #F0F4F8', borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 8px' }}>Preview</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}><span style={{ fontWeight: 600 }}>{budgetForm.label || 'Budget Item'}</span><span style={{ fontWeight: 700 }}>{pct}%</span></div>
                <div style={{ height: 9, background: '#E2E8F0', borderRadius: 100, overflow: 'hidden' }}><div style={{ height: '100%', width: pct + '%', background: clr, borderRadius: 100, transition: 'width 0.4s' }} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94A3B8', marginTop: 5 }}><span>₱{Number(budgetForm.spent || 0).toLocaleString()} spent</span><span>₱{Number(budgetForm.total || 0).toLocaleString()} total</span></div>
              </div>
            );
          })()}
          <G2>
            <FG label="Fiscal Year"><input type="number" className="form-input" value={budgetForm.year} onChange={e => setBudgetForm(p => ({ ...p, year: Number(e.target.value) }))} /></FG>
            <div className="form-group">
              <label className="form-label">Bar Color</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                {BUDGET_COLORS.map(c => { const clrs = { success: '#10B981', warning: '#F59E0B', error: '#EF4444', primary: '#3B82F6' }[c]; return <button key={c} type="button" onClick={() => setBudgetForm(p => ({ ...p, color: c }))} style={{ flex: 1, height: 32, borderRadius: 9, border: '2.5px solid ' + (budgetForm.color === c ? clrs : '#E2E8F0'), background: clrs, cursor: 'pointer', boxShadow: budgetForm.color === c ? `0 0 0 3px ${clrs}44` : 'none' }} />; })}
              </div>
            </div>
          </G2>
        </ModalBody>
        <ModalFooter onCancel={() => setShowBudgetModal(false)} onSave={handleBudgetSave} saving={budgetSaving} saveLabel={editingBudget ? 'Update Item' : 'Add Budget Item'} />
      </Modal>

      {/* Employee Modal */}
      <Modal open={showEmpModal} onClose={() => setShowEmpModal(false)} maxWidth={620}>
        <ModalHeader gradient="linear-gradient(135deg,#0F766E,#14B8A6)" icon={Users} title={editingEmp ? 'Edit Employee' : 'Add Employee'} subtitle="Barangay official or staff member" onClose={() => setShowEmpModal(false)} />
        <ModalBody>
          <ErrBanner msg={empErr} />
          <G2>
            <FG label="Employee ID"><input className="form-input" value={empForm.employeeId} onChange={e => setEmpForm(p => ({ ...p, employeeId: e.target.value }))} placeholder="e.g. EMP-001" /></FG>
            <FG label="Full Name" required><input className="form-input" value={empForm.fullName} onChange={e => setEmpForm(p => ({ ...p, fullName: e.target.value }))} placeholder="Last, First Middle" style={{ fontWeight: 500 }} /></FG>
          </G2>
          <G2>
            <FG label="Position">
              <select className="form-select" value={empForm.position} onChange={e => setEmpForm(p => ({ ...p, position: e.target.value }))}>
                {POSITIONS.map(pos => <option key={pos}>{pos}</option>)}
              </select>
            </FG>
            <FG label="Department">
              <select className="form-select" value={empForm.department} onChange={e => setEmpForm(p => ({ ...p, department: e.target.value }))}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </FG>
          </G2>
          <G2>
            <div>
              <label className="form-label">Employee Type</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {EMP_TYPES.map(t => { const a = empForm.employeeType === t; return <button key={t} type="button" onClick={() => setEmpForm(p => ({ ...p, employeeType: t }))} style={{ flex: 1, padding: '7px 4px', borderRadius: 9, border: '2px solid ' + (a ? '#0F766E' : '#E2E8F0'), background: a ? '#F0FDFA' : '#fff', color: a ? '#0F766E' : '#64748B', fontSize: 12, fontWeight: a ? 700 : 500, cursor: 'pointer' }}>{t}</button>; })}
              </div>
            </div>
            <div>
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {['Active', 'Inactive'].map(s => { const a = empForm.status === s; return <button key={s} type="button" onClick={() => setEmpForm(p => ({ ...p, status: s }))} style={{ flex: 1, padding: '7px 4px', borderRadius: 9, border: '2px solid ' + (a ? (s === 'Active' ? '#059669' : '#DC2626') : '#E2E8F0'), background: a ? (s === 'Active' ? '#ECFDF5' : '#FEF2F2') : '#fff', color: a ? (s === 'Active' ? '#065F46' : '#991B1B') : '#64748B', fontSize: 12, fontWeight: a ? 700 : 500, cursor: 'pointer' }}>{s}</button>; })}
              </div>
            </div>
          </G2>
          <G2>
            <FG label="Basic Salary (₱)" required><input type="number" className="form-input" value={empForm.basicSalary} onChange={e => setEmpForm(p => ({ ...p, basicSalary: e.target.value }))} placeholder="0.00" style={{ fontSize: 15, fontWeight: 700 }} /></FG>
            <FG label="Date Hired"><input type="date" className="form-input" value={empForm.dateHired} onChange={e => setEmpForm(p => ({ ...p, dateHired: e.target.value }))} /></FG>
          </G2>
          {/* Allowances */}
          <div style={{ background: '#F0FDFA', border: '1.5px solid #99F6E4', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 10px' }}>Allowances</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['rice', 'Rice Subsidy'], ['clothing', 'Clothing Allowance'], ['medical', 'Medical Allowance'], ['other', 'Other Allowances']].map(([k, lbl]) => (
                <FG key={k} label={lbl}><input type="number" className="form-input" value={empForm.allowances?.[k] || ''} onChange={e => setEmpForm(p => ({ ...p, allowances: { ...p.allowances, [k]: e.target.value } }))} placeholder="0.00" /></FG>
              ))}
            </div>
          </div>
          {/* Deductions */}
          <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 10px' }}>Mandatory Deductions</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['sss', 'SSS'], ['philhealth', 'PhilHealth'], ['pagibig', 'Pag-IBIG'], ['tax', 'Withholding Tax'], ['other', 'Other']].map(([k, lbl]) => (
                <FG key={k} label={lbl}><input type="number" className="form-input" value={empForm.deductions?.[k] || ''} onChange={e => setEmpForm(p => ({ ...p, deductions: { ...p.deductions, [k]: e.target.value } }))} placeholder="0.00" /></FG>
              ))}
            </div>
          </div>
          <G2>
            <FG label="Bank Account"><input className="form-input" value={empForm.bankAccount} onChange={e => setEmpForm(p => ({ ...p, bankAccount: e.target.value }))} placeholder="Account number" /></FG>
            <FG label="Contact Number"><input className="form-input" value={empForm.contactNumber} onChange={e => setEmpForm(p => ({ ...p, contactNumber: e.target.value }))} placeholder="09xxxxxxxxx" /></FG>
          </G2>
        </ModalBody>
        <ModalFooter onCancel={() => setShowEmpModal(false)} onSave={handleEmpSave} saving={empSaving} saveLabel={editingEmp ? 'Update Employee' : 'Add Employee'} saveGradient="linear-gradient(135deg,#0F766E,#14B8A6)" />
      </Modal>

      {/* Generate Payroll Modal */}
      <Modal open={showPayrollModal} onClose={() => setShowPayrollModal(false)} maxWidth={460}>
        <ModalHeader gradient="linear-gradient(135deg,#5B21B6,#8B5CF6)" icon={FileText} title="Generate Payroll" subtitle={`${employees.filter(e => e.status === 'Active').length} active employees will be included`} onClose={() => setShowPayrollModal(false)} />
        <ModalBody>
          <ErrBanner msg={payrollErr} />
          <div style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#5B21B6' }}>
            This will calculate gross pay, allowances, and mandatory deductions (SSS, PhilHealth, Pag-IBIG, withholding tax) for all <strong>{employees.filter(e => e.status === 'Active').length} active employees</strong> based on their registered salary and deduction profiles.
          </div>
          <G2>
            <FG label="Pay Period From" required><input type="date" className="form-input" value={payPeriodFrom} onChange={e => setPayPeriodFrom(e.target.value)} /></FG>
            <FG label="Pay Period To" required><input type="date" className="form-input" value={payPeriodTo} onChange={e => setPayPeriodTo(e.target.value)} /></FG>
          </G2>
          {employees.filter(e => e.status === 'Active').length > 0 && (
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#64748B' }}>
              <strong style={{ color: '#0F172A' }}>Estimated payroll total:</strong>{' '}
              <span style={{ color: '#5B21B6', fontWeight: 700, fontSize: 15 }}>
                {fmt(employees.filter(e => e.status === 'Active').reduce((s, e) => {
                  const allow = (e.allowances?.rice || 0) + (e.allowances?.clothing || 0) + (e.allowances?.medical || 0) + (e.allowances?.other || 0);
                  const deduct = (e.deductions?.sss || 0) + (e.deductions?.philhealth || 0) + (e.deductions?.pagibig || 0) + (e.deductions?.tax || 0) + (e.deductions?.other || 0);
                  return s + (e.basicSalary || 0) + allow - deduct;
                }, 0))}
              </span>
              {' '}net pay
            </div>
          )}
        </ModalBody>
        <ModalFooter onCancel={() => setShowPayrollModal(false)} onSave={handleGeneratePayroll} saving={payrollSaving} saveLabel="Generate Payroll" saveGradient="linear-gradient(135deg,#5B21B6,#8B5CF6)" />
      </Modal>
    </div>
  );
}