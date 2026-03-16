// src/pages/Finance.jsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/layout/common/StatCard';
import { useFinance } from '../hooks/useFinance';
import {
  DollarSign, Receipt, Wallet, Hourglass,
  Plus, Download, Filter, Trash2, Edit, X, Save, TrendingUp
} from 'lucide-react';

const CATEGORIES = ['Revenue', 'Expense', 'Payroll'];
const STATUSES   = ['Paid', 'Pending', 'Cancelled'];
const BUDGET_COLORS = ['success', 'warning', 'error', 'primary'];

const emptyTxn    = { description: '', category: 'Expense', amount: '', date: new Date().toISOString().split('T')[0], status: 'Paid', reference: '', notes: '' };
const emptyBudget = { label: '', total: '', spent: '0', year: new Date().getFullYear(), color: 'primary' };

const fmt = (n) => '₱' + Math.abs(Number(n) || 0).toLocaleString();

export default function Finance() {
  const {
    transactions, budgetItems, loading, error, stats,
    loadAll, addTransaction, editTransaction, removeTransaction,
    addBudgetItem, editBudgetItem, removeBudgetItem,
  } = useFinance();

  const [activeTab, setActiveTab] = useState('transactions');
  const [showTxnModal,    setShowTxnModal]    = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingTxn,    setEditingTxn]    = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [txnForm,    setTxnForm]    = useState(emptyTxn);
  const [budgetForm, setBudgetForm] = useState(emptyBudget);
  const [saving, setSaving]   = useState(false);
  const [formErr, setFormErr] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => { loadAll(); }, []);

  // ── Transaction modal ──
  const openAddTxn  = () => { setTxnForm(emptyTxn); setEditingTxn(null); setFormErr(''); setShowTxnModal(true); };
  const openEditTxn = (t) => { setTxnForm({ description: t.description, category: t.category, amount: Math.abs(t.amount), date: t.date, status: t.status, reference: t.reference || '', notes: t.notes || '' }); setEditingTxn(t); setFormErr(''); setShowTxnModal(true); };
  const handleTxnSave = async () => {
    if (!txnForm.description.trim() || !txnForm.amount) { setFormErr('Description and amount required.'); return; }
    setSaving(true);
    const amt = txnForm.category === 'Expense' || txnForm.category === 'Payroll' ? -Math.abs(Number(txnForm.amount)) : Math.abs(Number(txnForm.amount));
    const payload = { ...txnForm, amount: amt };
    const result = editingTxn ? await editTransaction(editingTxn.id, payload) : await addTransaction(payload);
    setSaving(false);
    if (result.success) setShowTxnModal(false);
    else setFormErr(result.error || 'Error saving.');
  };

  // ── Budget modal ──
  const openAddBudget  = () => { setBudgetForm(emptyBudget); setEditingBudget(null); setFormErr(''); setShowBudgetModal(true); };
  const openEditBudget = (b) => { setBudgetForm({ label: b.label, total: b.total, spent: b.spent, year: b.year, color: b.color }); setEditingBudget(b); setFormErr(''); setShowBudgetModal(true); };
  const handleBudgetSave = async () => {
    if (!budgetForm.label.trim() || !budgetForm.total) { setFormErr('Label and total budget required.'); return; }
    setSaving(true);
    const result = editingBudget ? await editBudgetItem(editingBudget.id, budgetForm) : await addBudgetItem(budgetForm);
    setSaving(false);
    if (result.success) setShowBudgetModal(false);
    else setFormErr(result.error || 'Error saving.');
  };

  const filteredTxns = filterCat === 'All' ? transactions : transactions.filter(t => t.category === filterCat);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Financial Management</h1>
          <p className="page-subtitle">Track budgets, expenses, and revenue</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={openAddTxn}><Plus size={18} /> New Transaction</button>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Revenue"    value={fmt(stats?.totalRevenue)}  icon={DollarSign} iconBg="icon-bg-success"   badge="All time"          badgeColor="badge-success" />
        <StatCard title="Total Expenses"   value={fmt(stats?.totalExpenses)} icon={Receipt}    iconBg="icon-bg-error"     badge="All time"          badgeColor="badge-error" />
        <StatCard title="Balance"          value={fmt(stats?.balance)}       icon={Wallet}     iconBg="icon-bg-primary"   badge="Revenue - Expenses" badgeColor="badge-primary" />
        <StatCard title="Pending"          value={stats?.pendingCount || 0}  icon={Hourglass}  iconBg="icon-bg-warning"   badge="Transactions"      badgeColor="badge-warning" />
      </div>

      {/* Tabs */}
      <div className="filters-section mb-0">
        <div className="filter-buttons-group">
          {[['transactions','Transactions'],['budget','Budget Overview']].map(([id, label]) => (
            <button key={id} className={`filter-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error mb-4 mt-4">{error}</div>}

      {/* ── TRANSACTIONS ── */}
      {activeTab === 'transactions' && (
        <div className="data-table-card mt-4">
          <div className="table-header">
            <h3 className="table-title">Transactions</h3>
            <div className="d-flex gap-2 align-center">
              <select className="form-select" style={{ minWidth: 130 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" onClick={openAddTxn}><Plus size={15} /> Add</button>
            </div>
          </div>
          {loading ? <p className="text-secondary p-4">Loading...</p> : filteredTxns.length === 0 ? (
            <div className="empty-state"><Receipt className="empty-state-icon" /><h3 className="empty-state-title">No transactions yet</h3><button className="btn btn-primary btn-md mt-4" onClick={openAddTxn}><Plus size={16} /> Add First Transaction</button></div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredTxns.map(t => (
                    <tr key={t.id}>
                      <td className="text-secondary">{t.date}</td>
                      <td className="fw-medium">{t.description}</td>
                      <td className="text-secondary">{t.category}</td>
                      <td>
                        <span className="fw-semibold" style={{ color: t.type === 'income' ? 'var(--color-success)' : 'var(--color-error)' }}>
                          {t.amount >= 0 ? '+' : ''}{fmt(t.amount)}
                        </span>
                      </td>
                      <td><span className={`status-badge status-${t.status?.toLowerCase()}`}>{t.status}</span></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn-icon" onClick={() => openEditTxn(t)}><Edit size={15} /></button>
                          <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeTransaction(t.id); }}><Trash2 size={15} /></button>
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

      {/* ── BUDGET ── */}
      {activeTab === 'budget' && (
        <div className="card mt-4">
          <div className="card-header">
            <h3 className="table-title">Budget Overview</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddBudget}><Plus size={15} /> Add Budget Item</button>
          </div>
          <div className="card-body">
            {loading ? <p className="text-secondary">Loading...</p> : budgetItems.length === 0 ? (
              <div className="empty-state"><TrendingUp className="empty-state-icon" /><h3 className="empty-state-title">No budget items yet</h3><button className="btn btn-primary btn-md mt-4" onClick={openAddBudget}><Plus size={16} /> Add Budget Item</button></div>
            ) : (
              <div className="d-flex flex-column gap-4">
                {budgetItems.map(b => {
                  const pct = b.total > 0 ? Math.min(100, Math.round((b.spent / b.total) * 100)) : 0;
                  const color = pct >= 90 ? 'error' : pct >= 75 ? 'warning' : 'success';
                  return (
                    <div key={b.id}>
                      <div className="d-flex justify-between align-center mb-1">
                        <span className="fw-semibold text-primary">{b.label}</span>
                        <div className="d-flex align-center gap-3">
                          <span className="fw-medium text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>{fmt(b.spent)} <span className="text-tertiary">/ {fmt(b.total)}</span></span>
                          <button className="btn-icon" onClick={() => openEditBudget(b)}><Edit size={14} /></button>
                          <button className="btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => { if (window.confirm('Delete?')) removeBudgetItem(b.id); }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div style={{ width: '100%', height: 8, background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: `var(--color-${color})`, borderRadius: 'var(--radius-full)', transition: 'width .6s ease' }} />
                      </div>
                      <p className="text-tertiary mt-1" style={{ fontSize: 'var(--font-size-xs)' }}>{pct}% used · Year {b.year}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSACTION MODAL ── */}
      {showTxnModal && (
        <div className="modal-overlay" onClick={() => setShowTxnModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTxn ? 'Edit Transaction' : 'New Transaction'}</h2>
              <button className="btn-icon" onClick={() => setShowTxnModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formErr && <div className="alert alert-error mb-3">{formErr}</div>}
              <div className="form-group">
                <label className="form-label">Description *</label>
                <input className="form-input" value={txnForm.description} onChange={e => setTxnForm(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Document Fees - Clearances" />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={txnForm.category} onChange={e => setTxnForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₱) *</label>
                  <input type="number" className="form-input" value={txnForm.amount} onChange={e => setTxnForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" min="0" />
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={txnForm.date} onChange={e => setTxnForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={txnForm.status} onChange={e => setTxnForm(p => ({ ...p, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reference / OR Number</label>
                <input className="form-input" value={txnForm.reference} onChange={e => setTxnForm(p => ({ ...p, reference: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={txnForm.notes} onChange={e => setTxnForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowTxnModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleTxnSave} disabled={saving}>
                <Save size={16} />{saving ? 'Saving...' : editingTxn ? 'Update' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BUDGET MODAL ── */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingBudget ? 'Edit Budget Item' : 'Add Budget Item'}</h2>
              <button className="btn-icon" onClick={() => setShowBudgetModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              {formErr && <div className="alert alert-error mb-3">{formErr}</div>}
              <div className="form-group">
                <label className="form-label">Budget Label *</label>
                <input className="form-input" value={budgetForm.label} onChange={e => setBudgetForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Personnel Services" />
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Total Budget (₱) *</label>
                  <input type="number" className="form-input" value={budgetForm.total} onChange={e => setBudgetForm(p => ({ ...p, total: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount Spent (₱)</label>
                  <input type="number" className="form-input" value={budgetForm.spent} onChange={e => setBudgetForm(p => ({ ...p, spent: e.target.value }))} placeholder="0.00" />
                </div>
              </div>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input type="number" className="form-input" value={budgetForm.year} onChange={e => setBudgetForm(p => ({ ...p, year: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Bar Color</label>
                  <select className="form-select" value={budgetForm.color} onChange={e => setBudgetForm(p => ({ ...p, color: e.target.value }))}>
                    {BUDGET_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-md" onClick={() => setShowBudgetModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary btn-md" onClick={handleBudgetSave} disabled={saving}>
                <Save size={16} />{saving ? 'Saving...' : editingBudget ? 'Update' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}