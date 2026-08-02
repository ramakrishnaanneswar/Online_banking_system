import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaWallet } from 'react-icons/fa';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatCompact, timeAgo, formatDate, categoryLabel, getInitials } from '../utils/format';
import Spinner from '../components/common/Spinner';

const PIE_COLORS = ['#1a2b4c', '#d4af37', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner size={40} color="var(--primary)" />
        <p className="text-muted mt-2">Loading your dashboard...</p>
      </div>
    );
  }

  const pieData = (data?.categoryBreakdown || []).map((item) => ({
    name: categoryLabel(item._id),
    value: item.total,
  }));

  const totalExpenses = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name}! Here's your financial summary.</p>
        </div>
        <div className="page-header-actions">
          <Link to="/transfer" className="btn btn-primary btn-sm">
            <FiArrowUpRight /> Transfer
          </Link>
          <Link to="/accounts" className="btn btn-gold btn-sm">
            <FiCreditCard /> Accounts
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-4 mb-3">
        <div className="stat-card">
          <div className="stat-icon dark">₹</div>
          <div className="stat-label">Total Balance</div>
          <div className="stat-amount">{formatINR(data?.totalBalance)}</div>
          <div className="stat-trend up">
            <FiTrendingUp /> Across {data?.totalAccounts} accounts
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <FiArrowDownRight />
          </div>
          <div className="stat-label">Income (This Month)</div>
          <div className="stat-amount">{formatINR(data?.monthlyIncome)}</div>
          <div className="stat-trend up">
            <FiArrowDownRight /> Total credit
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <FiArrowUpRight />
          </div>
          <div className="stat-label">Expenses (This Month)</div>
          <div className="stat-amount">{formatINR(data?.monthlyExpense)}</div>
          <div className="stat-trend down">
            <FiArrowUpRight /> Total debit
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon gold">
            <FiWallet />
          </div>
          <div className="stat-label">Active Cards</div>
          <div className="stat-amount">{data?.activeCards || 0}</div>
          <div className="stat-trend">
            <span className="badge badge-gold">Premium</span>
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        {/* Recent transactions */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Transactions</h3>
              <p className="card-subtitle">Your latest account activity</p>
            </div>
            <Link to="/transactions" className="btn btn-outline btn-sm">
              View All <FiArrowRight />
            </Link>
          </div>

          {data?.recentTransactions?.length > 0 ? (
            <div className="transaction-list">
              {data.recentTransactions.map((txn) => (
                <div key={txn._id} className="transaction-item">
                  <div className={`transaction-icon ${txn.type}`}>
                    {txn.type === 'credit' ? '↓' : '↑'}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-title">{txn.description}</div>
                    <div className="transaction-meta">
                      {formatDate(txn.date, true)} • {categoryLabel(txn.category)}
                    </div>
                  </div>
                  <div className={`transaction-amount ${txn.type}`}>
                    {txn.type === 'credit' ? '+' : '-'}
                    {formatINR(txn.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <h3>No transactions yet</h3>
              <p>Your recent transactions will appear here.</p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Notifications</h3>
              <p className="card-subtitle">Updates & alerts</p>
            </div>
          </div>

          {data?.notifications?.length > 0 ? (
            <div className="notification-list">
              {data.notifications.map((notif, idx) => (
                <div key={idx} className={`notification-item ${notif.type}`}>
                  <div className="notification-icon">{notif.icon}</div>
                  <div className="notification-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <small className="text-muted">{timeAgo(notif.date)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔔</div>
              <h3>No notifications</h3>
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2 mt-3">
        {/* Monthly expense graph */}
        <div className="chart-container">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <FiTrendingDown /> Monthly Expenses
              </h3>
              <p className="card-subtitle">Income vs Expenses (Last 6 months)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
              <XAxis dataKey="month" stroke="var(--gray-500)" fontSize={12} />
              <YAxis stroke="var(--gray-500)" fontSize={11} tickFormatter={(v) => formatCompact(v)} />
              <Tooltip
                formatter={(value) => formatINR(value)}
                contentStyle={{
                  background: 'var(--white)',
                  border: '1px solid var(--gray-100)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown pie chart */}
        <div className="chart-container">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <FiTrendingUp /> Spending Breakdown
              </h3>
              <p className="card-subtitle">Where your money goes</p>
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatINR(value)}
                  contentStyle={{
                    background: 'var(--white)',
                    border: '1px solid var(--gray-100)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No spending data</h3>
              <p>Your expense breakdown will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Account breakdown */}
      <div className="card mt-3">
        <div className="card-header">
          <div>
            <h3 className="card-title">Account Distribution</h3>
            <p className="card-subtitle">Balance across your accounts</p>
          </div>
          <Link to="/accounts" className="btn btn-outline btn-sm">
            Manage Accounts
          </Link>
        </div>
        <div className="grid grid-3">
          <div className="account-card savings">
            <div className="account-card-top">
              <div className="account-type-label">Savings</div>
            </div>
            <div className="account-balance">{formatINR(data?.accountBreakdown?.savings)}</div>
            <div className="account-card-footer">
              <small>3.5% p.a. interest</small>
              <small>💼</small>
            </div>
          </div>
          <div className="account-card current">
            <div className="account-card-top">
              <div className="account-type-label">Current</div>
            </div>
            <div className="account-balance">{formatINR(data?.accountBreakdown?.current)}</div>
            <div className="account-card-footer">
              <small>For business</small>
              <small>🏢</small>
            </div>
          </div>
          <div className="account-card fixed_deposit">
            <div className="account-card-top">
              <div className="account-type-label">Fixed Deposit</div>
            </div>
            <div className="account-balance">{formatINR(data?.accountBreakdown?.fixed_deposit)}</div>
            <div className="account-card-footer">
              <small>7.1% p.a. interest</small>
              <small>📈</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;