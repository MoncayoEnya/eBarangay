import React, { useState } from 'react';
import StatCard from '../components/layout/common/StatCard';
import {
  DollarSign,
  Receipt,
  Wallet,
  Hourglass,
  TrendingUp,
  ArrowUp,
  Info,
  Clock,
  Plus,
  Download,
  Filter
} from 'lucide-react';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('transactions');

  const transactions = [
    {
      id: 1,
      date: 'Dec 10, 2024',
      description: 'Document Fees - Clearances',
      category: 'Revenue',
      amount: 15500,
      status: 'Paid',
      type: 'income'
    },
    {
      id: 2,
      date: 'Dec 9, 2024',
      description: 'Office Supplies Purchase',
      category: 'Expense',
      amount: -8200,
      status: 'Paid',
      type: 'expense'
    },
    {
      id: 3,
      date: 'Dec 9, 2024',
      description: 'Community Center Maintenance',
      category: 'Expense',
      amount: -25000,
      status: 'Pending',
      type: 'expense'
    },
    {
      id: 4,
      date: 'Dec 8, 2024',
      description: 'Business Permits',
      category: 'Revenue',
      amount: 45000,
      status: 'Paid',
      type: 'income'
    },
    {
      id: 5,
      date: 'Dec 7, 2024',
      description: 'Staff Salaries - December',
      category: 'Payroll',
      amount: -180000,
      status: 'Paid',
      type: 'expense'
    }
  ];

  const budgetItems = [
    {
      label: 'Personnel Services',
      spent: 540000,
      total: 720000,
      percentage: 75,
      color: 'success'
    },
    {
      label: 'Operations & Maintenance',
      spent: 340000,
      total: 400000,
      percentage: 85,
      color: 'warning'
    },
    {
      label: 'Social Services',
      spent: 280000,
      total: 300000,
      percentage: 93,
      color: 'error'
    },
    {
      label: 'Infrastructure Projects',
      spent: 420000,
      total: 600000,
      percentage: 70,
      color: 'success'
    }
  ];

  const formatCurrency = (amount) => {
    return '₱' + Math.abs(amount).toLocaleString();
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Financial Management</h1>
          <p className="page-subtitle">Track budgets, expenses, and revenue</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Plus size={18} />
          New Transaction
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value="₱2.4M"
          icon={DollarSign}
          iconBg="icon-bg-success"
          badge="+12.5% from last month"
          badgeColor="badge-success"
        />
        <StatCard
          title="Total Expenses"
          value="₱1.8M"
          icon={Receipt}
          iconBg="icon-bg-error"
          badge="+8.2% from last month"
          badgeColor="badge-error"
        />
        <StatCard
          title="Budget Balance"
          value="₱600K"
          icon={Wallet}
          iconBg="icon-bg-primary"
          badge="75% of budget used"
          badgeColor="badge-primary"
        />
        <StatCard
          title="Pending Payments"
          value="₱145K"
          icon={Hourglass}
          iconBg="icon-bg-warning"
          badge="18 transactions"
          badgeColor="badge-warning"
        />
      </div>

      {/* Content Grid */}
      <div className="grid-2">
        {/* Recent Transactions */}
        <div className="data-table-card">
          <div className="table-header">
            <h3 className="table-title">Recent Transactions</h3>
            <div className="d-flex gap-2">
              <button className="btn btn-ghost btn-sm">
                <Filter size={16} />
              </button>
              <button className="btn btn-ghost btn-sm">
                <Download size={16} />
              </button>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td className="text-secondary">{transaction.date}</td>
                    <td className="fw-medium">{transaction.description}</td>
                    <td className="text-secondary">{transaction.category}</td>
                    <td>
                      <span
                        className="fw-semibold"
                        style={{
                          color: transaction.type === 'income' 
                            ? 'var(--color-success)' 
                            : 'var(--color-error)'
                        }}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${transaction.status.toLowerCase()}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="table-title">Budget Overview</h3>
          </div>
          <div className="card-body">
            <div className="d-flex flex-column gap-4">
              {budgetItems.map((item, idx) => (
                <div key={idx}>
                  <div className="d-flex justify-between align-center mb-2">
                    <span className="fw-semibold text-primary">{item.label}</span>
                    <span className="fw-medium text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
                      {formatCurrency(item.spent)} <span className="text-tertiary">/ {formatCurrency(item.total)}</span>
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${item.percentage}%`,
                        height: '100%',
                        background: `var(--color-${item.color})`,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.6s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;