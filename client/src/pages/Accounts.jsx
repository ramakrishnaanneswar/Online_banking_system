import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiArrowRight, FiTrendingUp } from 'react-icons/fi';
import api from '../api';
import { formatINR, formatDate, accountTypeLabel, maskAccount } from '../utils/format';
import Spinner from '../components/common/Spinner';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    accountType: 'savings',
    branchName: 'Main Branch',
    initialDeposit: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data.data);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/accounts', formData);
      toast.success(res.data.message);
      setShowCreate(false);
      setFormData({ accountType: 'savings', branchName: 'Main Branch', initialDeposit: '' });
      fetchAccounts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner size={40} color="var(--primary)" />
        <p className="text-muted mt-2">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Accounts</h1>
          <p>Manage all your SecureBank accounts</p>
        </div>
        <div className="page-header-actions">
          <div className="stat-card" style={{ minWidth: '200px' }}>
            <div className="stat-label">Total Balance</div>
            <div className="stat-amount" style={{ fontSize: '20px' }}>{formatINR(totalBalance)}</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
            <FiPlus /> {showCreate ? 'Cancel' : 'Open New Account'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card mb-3">
          <h3 className="card-title mb-2">Open a New Account</h3>
          <form onSubmit={handleCreate} className="grid grid-3" style={{ alignItems: 'end' }}>
            <div className="form-group mb-0">
              <label>Account Type</label>
              <select
                className="form-control"
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
              >
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
                <option value="fixed_deposit">Fixed Deposit</option>
              </select>
            </div>
            <div className="form-group mb-0">
              <label>Branch</label>
              <input
                type="text"
                className="form-control"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                placeholder="Branch name"
              />
            </div>
            <div className="form-group mb-0">
              <label>Initial Deposit</label>
              <input
                type="number"
                className="form-control"
                value={formData.initialDeposit}
                onChange={(e) => setFormData({ ...formData, initialDeposit: e.target.value })}
                placeholder="₹ 0 (optional)"
                min="0"
              />
            </div>
            <div className="grid" style={{ gridColumn: 'span 3', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                {creating ? 'Creating...' : 'Create Account'} {creating && <Spinner size={14} color="#fff" />}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {accounts.length > 0 ? (
        <div className="grid grid-2">
          {accounts.map((account) => (
            <Link to={`/accounts/${account._id}`} key={account._id} className="account-card" style={{ cursor: 'pointer' }}>
              <div className="account-card-top">
                <div>
                  <div className="account-type-label">
                    {accountTypeLabel(account.accountType)}
                  </div>
                  <div className="account-number mt-1">A/C {maskAccount(account.accountNumber)}</div>
                </div>
                <span className="badge badge-success">
                  {account.status}
                </span>
              </div>
              <div className="flex-between">
                <div>
                  <div className="account-balance">{formatINR(account.balance)}</div>
                  <small>{account.branchName}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    <FiTrendingUp style={{ verticalAlign: 'middle' }} /> {account.interestRate}% p.a.
                  </div>
                  <small style={{ opacity: 0.7 }}>Opened {formatDate(account.openingDate)}</small>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', opacity: 0.9 }}>
                <FiArrowRight size={20} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <div className="empty-state-icon">🏦</div>
          <h3>No accounts yet</h3>
          <p>Open your first account to start banking with us.</p>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowCreate(true)}>
            <FiPlus /> Open Account
          </button>
        </div>
      )}
    </div>
  );
};

export default Accounts;