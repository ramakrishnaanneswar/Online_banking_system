import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiZap, FiDroplet, FiWifi, FiPlus, FiCheckCircle } from 'react-icons/fi';
import api from '../api';
import { formatINR, formatDate, billTypeLabel } from '../utils/format';
import Spinner from '../components/common/Spinner';

const BILL_TYPES = [
  { type: 'electricity', icon: FiZap, color: '#f59e0b', bg: '#fffbeb' },
  { type: 'water', icon: FiDroplet, color: '#3b82f6', bg: '#eff6ff' },
  { type: 'gas', icon: null, color: '#ef4444', bg: '#fef2f2', emoji: '🔥' },
  { type: 'internet', icon: FiWifi, color: '#10b981', bg: '#ecfdf5' },
];

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBillType, setActiveBillType] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [paying, setPaying] = useState(null);

  const [formData, setFormData] = useState({
    billType: 'electricity',
    provider: '',
    consumerNumber: '',
    amount: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [billsRes, accRes] = await Promise.all([api.get('/bills'), api.get('/accounts')]);
      setBills(billsRes.data.data);
      setAccounts(accRes.data.data);
    } catch (error) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handleBillTypeSelect = async (type) => {
    setActiveBillType(type);
    setFormData({ ...formData, billType: type, provider: '' });
    try {
      const res = await api.get(`/bills/providers/${type}`);
      setProviders(res.data.data);
    } catch (error) {
      setProviders([]);
    }
  };

  const handleFetchBill = async (e) => {
    e.preventDefault();
    if (!formData.provider || !formData.consumerNumber || !formData.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    setFetching(true);
    try {
      const res = await api.post('/bills', formData);
      toast.success(res.data.message);
      setFormData({ billType: 'electricity', provider: '', consumerNumber: '', amount: '', dueDate: '' });
      setActiveBillType(null);
      setProviders([]);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch bill');
    } finally {
      setFetching(false);
    }
  };

  const handlePay = async (billId, fromAccountId) => {
    if (!fromAccountId) {
      toast.error('Please select an account');
      return;
    }
    try {
      const res = await api.post(`/bills/${billId}/pay`, { fromAccountId });
      toast.success(res.data.message);
      setPaying(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to pay bill');
    }
  };

  const getBillIcon = (type) => {
    const item = BILL_TYPES.find((b) => b.type === type);
    if (!item) return null;
    if (item.emoji) return <span style={{ fontSize: '20px' }}>{item.emoji}</span>;
    const Icon = item.icon;
    return <Icon style={{ color: item.color }} />;
  };

  const pendingBills = bills.filter((b) => b.status === 'pending');
  const paidBills = bills.filter((b) => b.status === 'paid');

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner size={40} color="var(--primary)" />
        <p className="text-muted mt-2">Loading bills...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bill Payments</h1>
          <p>Pay your electricity, water, gas and internet bills</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setActiveBillType('electricity')}>
            <FiPlus /> Fetch New Bill
          </button>
        </div>
      </div>

      {/* Bill type selector for fetching */}
      {activeBillType && (
        <div className="card mb-3">
          <h3 className="card-title mb-2">Fetch a New Bill</h3>
          <div className="grid grid-4 mb-2" style={{ gap: '12px' }}>
            {BILL_TYPES.map(({ type, icon: Icon, color, bg, emoji }) => (
              <button
                key={type}
                className="btn btn-outline btn-sm"
                style={{
                  background: activeBillType === type ? bg : 'transparent',
                  borderColor: activeBillType === type ? color : 'var(--gray-200)',
                  color: activeBillType === type ? color : 'var(--gray-700)',
                }}
                onClick={() => handleBillTypeSelect(type)}
              >
                {emoji ? <span style={{ fontSize: '16px' }}>{emoji}</span> : <Icon />} {billTypeLabel(type)}
              </button>
            ))}
          </div>

          <form onSubmit={handleFetchBill} className="grid grid-3" style={{ gap: '12px', alignItems: 'end' }}>
            <div className="form-group mb-0">
              <label>Provider</label>
              <select
                className="form-control"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              >
                <option value="">Select provider</option>
                {providers.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group mb-0">
              <label>Consumer Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="Enter consumer/account number"
                value={formData.consumerNumber}
                onChange={(e) => setFormData({ ...formData, consumerNumber: e.target.value })}
              />
            </div>
            <div className="form-group mb-0">
              <label>Amount (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="Enter bill amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="1"
              />
            </div>
            <div className="flex" style={{ gridColumn: 'span 3', gap: '8px' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={fetching}>
                {fetching ? 'Fetching...' : 'Fetch Bill'} {fetching && <Spinner size={14} color="#fff" />}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setActiveBillType(null); setProviders([]); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-3 mb-3">
        <div className="stat-card">
          <div className="stat-icon red">🧾</div>
          <div className="stat-label">Pending Bills</div>
          <div className="stat-amount">{pendingBills.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FiCheckCircle />
          </div>
          <div className="stat-label">Paid Bills</div>
          <div className="stat-amount">{paidBills.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">₹</div>
          <div className="stat-label">Total Pending Amount</div>
          <div className="stat-amount">{formatINR(pendingBills.reduce((s, b) => s + b.amount, 0))}</div>
        </div>
      </div>

      {/* Pending bills */}
      {pendingBills.length > 0 && (
        <div className="card mb-3">
          <h3 className="card-title mb-2">Pending Bills</h3>
          <div className="transaction-list">
            {pendingBills.map((bill) => (
              <div key={bill._id} className="transaction-item">
                <div className="transaction-icon bill" style={{ width: 44, height: 44 }}>
                  {getBillIcon(bill.billType)}
                </div>
                <div className="transaction-info">
                  <div className="transaction-title">{bill.provider}</div>
                  <div className="transaction-meta">
                    {billTypeLabel(bill.billType)} • {bill.consumerNumber} • Due: {formatDate(bill.dueDate)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="transaction-amount" style={{ color: 'var(--warning)' }}>
                    {formatINR(bill.amount)}
                  </div>
                  {paying?.id === bill._id ? (
                    <div className="flex mt-1" style={{ gap: '4px' }}>
                      <select
                        className="form-control"
                        style={{ padding: '6px 8px', fontSize: '12px', width: '140px' }}
                        value={paying.fromAccountId || ''}
                        onChange={(e) => setPaying({ id: bill._id, fromAccountId: e.target.value })}
                      >
                        <option value="">Select account</option>
                        {accounts.map((acc) => (
                          <option key={acc._id} value={acc._id}>{acc.accountType} •••• {acc.accountNumber.slice(-4)}</option>
                        ))}
                      </select>
                      <button
                        className="btn btn-success btn-sm"
                        style={{ padding: '6px 10px' }}
                        onClick={() => handlePay(bill._id, paying.fromAccountId)}
                      >
                        Pay
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-sm mt-1" onClick={() => setPaying({ id: bill._id, fromAccountId: '' })}>
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paid bills */}
      {paidBills.length > 0 && (
        <div className="card">
          <h3 className="card-title mb-2">Payment History</h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill Type</th>
                  <th>Provider</th>
                  <th>Consumer No.</th>
                  <th>Amount</th>
                  <th>Paid On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paidBills.map((bill) => (
                  <tr key={bill._id}>
                    <td>
                      <span className="flex" style={{ gap: '8px', alignItems: 'center' }}>
                        {getBillIcon(bill.billType)} {billTypeLabel(bill.billType)}
                      </span>
                    </td>
                    <td>{bill.provider}</td>
                    <td style={{ fontSize: '12px' }}>{bill.consumerNumber}</td>
                    <td><strong>{formatINR(bill.amount)}</strong></td>
                    <td>{formatDate(bill.paidDate)}</td>
                    <td>
                      <span className="badge badge-success">PAID</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No bills */}
      {bills.length === 0 && !activeBillType && (
        <div className="empty-state card">
          <div className="empty-state-icon">🧾</div>
          <h3>No bills yet</h3>
          <p>Fetch a bill to get started with bill payments.</p>
          <button className="btn btn-primary btn-sm mt-2" onClick={() => setActiveBillType('electricity')}>
            <FiPlus /> Fetch Bill
          </button>
        </div>
      )}
    </div>
  );
};

export default Bills;