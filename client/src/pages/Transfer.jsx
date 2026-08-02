import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaBuilding } from 'react-icons/fa';
import api from '../api';
import { formatINR, accountTypeLabel } from '../utils/format';
import Spinner from '../components/common/Spinner';

const Transfer = () => {
  const [activeTab, setActiveTab] = useState('self');
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Self transfer form
  const [selfForm, setSelfForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
  });

  // Beneficiary transfer form
  const [beneficiaryForm, setBeneficiaryForm] = useState({
    fromAccountId: '',
    beneficiaryId: '',
    amount: '',
    description: '',
  });

  // Other account transfer form
  const [otherForm, setOtherForm] = useState({
    fromAccountId: '',
    recipientName: '',
    recipientAccount: '',
    ifscCode: '',
    bankName: '',
    amount: '',
    description: '',
  });

  // Add beneficiary form
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [beneficiaryFormData, setBeneficiaryFormData] = useState({
    name: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    nickname: '',
  });

  // Receipt
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accRes, benRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/transfer/beneficiaries'),
      ]);
      setAccounts(accRes.data.data);
      setBeneficiaries(benRes.data.data);
    } catch (error) {
      toast.error('Failed to load transfer data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfTransfer = async (e) => {
    e.preventDefault();
    if (!selfForm.fromAccountId || !selfForm.toAccountId || !selfForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    if (selfForm.fromAccountId === selfForm.toAccountId) {
      toast.error('From and To accounts must be different');
      return;
    }
    if (Number(selfForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post('/transfer/self', selfForm);
      toast.success(res.data.message);
      setReceipt(res.data.data);
      setSelfForm({ ...selfForm, amount: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBeneficiaryTransfer = async (e) => {
    e.preventDefault();
    if (!beneficiaryForm.fromAccountId || !beneficiaryForm.beneficiaryId || !beneficiaryForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    if (Number(beneficiaryForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post('/transfer/beneficiary', beneficiaryForm);
      toast.success(res.data.message);
      setReceipt(res.data.data);
      setBeneficiaryForm({ ...beneficiaryForm, amount: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleOtherTransfer = async (e) => {
    e.preventDefault();
    if (!otherForm.fromAccountId || !otherForm.recipientName || !otherForm.recipientAccount || !otherForm.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    if (Number(otherForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post('/transfer/other', otherForm);
      toast.success(res.data.message);
      setReceipt(res.data.data);
      setOtherForm({ ...otherForm, amount: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transfer failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();
    if (!beneficiaryFormData.name || !beneficiaryFormData.accountNumber || !beneficiaryFormData.ifscCode || !beneficiaryFormData.bankName) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const res = await api.post('/transfer/beneficiaries', beneficiaryFormData);
      toast.success(res.data.message);
      setShowAddBeneficiary(false);
      setBeneficiaryFormData({ name: '', accountNumber: '', ifscCode: '', bankName: '', nickname: '' });
      const benRes = await api.get('/transfer/beneficiaries');
      setBeneficiaries(benRes.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add beneficiary');
    }
  };

  const handleDeleteBeneficiary = async (id) => {
    if (!window.confirm('Are you sure you want to delete this beneficiary?')) return;
    try {
      const res = await api.delete(`/transfer/beneficiaries/${id}`);
      toast.success(res.data.message);
      setBeneficiaries(beneficiaries.filter((b) => b._id !== id));
    } catch (error) {
      toast.error('Failed to delete beneficiary');
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner size={40} color="var(--primary)" />
        <p className="text-muted mt-2">Loading transfer options...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fund Transfer</h1>
          <p>Transfer money securely to your own or other accounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'self' ? 'active' : ''}`} onClick={() => setActiveTab('self')}>
          <FiUser /> Self Transfer
        </button>
        <button className={`tab ${activeTab === 'beneficiary' ? 'active' : ''}`} onClick={() => setActiveTab('beneficiary')}>
          <FiUsers /> Beneficiary Transfer
        </button>
        <button className={`tab ${activeTab === 'other' ? 'active' : ''}`} onClick={() => setActiveTab('other')}>
          <FiBuilding /> Other Account
        </button>
      </div>

      <div className="grid grid-2">
        {/* Transfer form */}
        <div className="card">
          {/* Self Transfer */}
          {activeTab === 'self' && (
            <>
              <h3 className="card-title mb-2">Transfer Between My Accounts</h3>
              <p className="card-subtitle mb-3">Instant transfer between your own accounts</p>
              <form onSubmit={handleSelfTransfer}>
                <div className="form-group">
                  <label>From Account</label>
                  <select
                    className="form-control"
                    value={selfForm.fromAccountId}
                    onChange={(e) => setSelfForm({ ...selfForm, fromAccountId: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {accountTypeLabel(acc.accountType)} - {acc.accountNumber} ({formatINR(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>To Account</label>
                  <select
                    className="form-control"
                    value={selfForm.toAccountId}
                    onChange={(e) => setSelfForm({ ...selfForm, toAccountId: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts
                      .filter((a) => a._id !== selfForm.fromAccountId)
                      .map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {accountTypeLabel(acc.accountType)} - {acc.accountNumber} ({formatINR(acc.balance)})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount"
                    value={selfForm.amount}
                    onChange={(e) => setSelfForm({ ...selfForm, amount: e.target.value })}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="What's this transfer for?"
                    value={selfForm.description}
                    onChange={(e) => setSelfForm({ ...selfForm, description: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={processing}>
                  {processing ? 'Transferring...' : 'Transfer'} {processing && <Spinner size={16} color="#fff" />}
                </button>
              </form>
            </>
          )}

          {/* Beneficiary Transfer */}
          {activeTab === 'beneficiary' && (
            <>
              <div className="card-header mb-2" style={{ padding: 0 }}>
                <div>
                  <h3 className="card-title">Transfer to Beneficiary</h3>
                  <p className="card-subtitle">Send money to saved beneficiaries</p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => setShowAddBeneficiary(!showAddBeneficiary)}>
                  <FiUserPlus /> {showAddBeneficiary ? 'Cancel' : 'Add Beneficiary'}
                </button>
              </div>

              {showAddBeneficiary && (
                <form onSubmit={handleAddBeneficiary} className="card mb-3" style={{ background: 'var(--gray-50)' }}>
                  <h4 className="mb-2">Add New Beneficiary</h4>
                  <div className="form-group">
                    <label>Beneficiary Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full name"
                      value={beneficiaryFormData.name}
                      onChange={(e) => setBeneficiaryFormData({ ...beneficiaryFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Account Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Account number"
                      value={beneficiaryFormData.accountNumber}
                      onChange={(e) => setBeneficiaryFormData({ ...beneficiaryFormData, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-2" style={{ gap: '12px' }}>
                    <div className="form-group">
                      <label>IFSC Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., OBIB0001234"
                        value={beneficiaryFormData.ifscCode}
                        onChange={(e) => setBeneficiaryFormData({ ...beneficiaryFormData, ifscCode: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Bank Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., HDFC Bank"
                        value={beneficiaryFormData.bankName}
                        onChange={(e) => setBeneficiaryFormData({ ...beneficiaryFormData, bankName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Nickname (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Mom, Friend"
                      value={beneficiaryFormData.nickname}
                      onChange={(e) => setBeneficiaryFormData({ ...beneficiaryFormData, nickname: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-success btn-sm">Add Beneficiary</button>
                </form>
              )}

              <form onSubmit={handleBeneficiaryTransfer}>
                <div className="form-group">
                  <label>From Account</label>
                  <select
                    className="form-control"
                    value={beneficiaryForm.fromAccountId}
                    onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, fromAccountId: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {accountTypeLabel(acc.accountType)} - {acc.accountNumber} ({formatINR(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Beneficiary</label>
                  <select
                    className="form-control"
                    value={beneficiaryForm.beneficiaryId}
                    onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, beneficiaryId: e.target.value })}
                  >
                    <option value="">Select beneficiary</option>
                    {beneficiaries.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.nickname || b.name} - {b.bankName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount"
                    value={beneficiaryForm.amount}
                    onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, amount: e.target.value })}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="What's this transfer for?"
                    value={beneficiaryForm.description}
                    onChange={(e) => setBeneficiaryForm({ ...beneficiaryForm, description: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={processing}>
                  {processing ? 'Transferring...' : 'Transfer'} {processing && <Spinner size={16} color="#fff" />}
                </button>
              </form>

              {/* Beneficiary list */}
              {beneficiaries.length > 0 && (
                <div className="mt-3">
                  <h4 className="mb-2">Your Beneficiaries</h4>
                  {beneficiaries.map((b) => (
                    <div key={b._id} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <div>
                        <strong style={{ fontSize: '14px' }}>{b.nickname || b.name}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                          {b.name} • {b.bankName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>A/C {b.accountNumber} • IFSC {b.ifscCode}</div>
                      </div>
                      <button className="icon-btn" onClick={() => handleDeleteBeneficiary(b._id)} title="Delete beneficiary">
                        <FiTrash2 style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Other Account */}
          {activeTab === 'other' && (
            <>
              <h3 className="card-title mb-2">Transfer to Other Bank Account</h3>
              <p className="card-subtitle mb-3">One-time transfer to any bank account (IMPS)</p>
              <form onSubmit={handleOtherTransfer}>
                <div className="form-group">
                  <label>From Account</label>
                  <select
                    className="form-control"
                    value={otherForm.fromAccountId}
                    onChange={(e) => setOtherForm({ ...otherForm, fromAccountId: e.target.value })}
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {accountTypeLabel(acc.accountType)} - {acc.accountNumber} ({formatINR(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-2" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label>Recipient Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full name"
                      value={otherForm.recipientName}
                      onChange={(e) => setOtherForm({ ...otherForm, recipientName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Recipient Account *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Account number"
                      value={otherForm.recipientAccount}
                      onChange={(e) => setOtherForm({ ...otherForm, recipientAccount: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>IFSC Code</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., HDFC0001234"
                      value={otherForm.ifscCode}
                      onChange={(e) => setOtherForm({ ...otherForm, ifscCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bank Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., HDFC Bank"
                      value={otherForm.bankName}
                      onChange={(e) => setOtherForm({ ...otherForm, bankName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount"
                    value={otherForm.amount}
                    onChange={(e) => setOtherForm({ ...otherForm, amount: e.target.value })}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="What's this transfer for?"
                    value={otherForm.description}
                    onChange={(e) => setOtherForm({ ...otherForm, description: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={processing}>
                  {processing ? 'Transferring...' : 'Transfer'} {processing && <Spinner size={16} color="#fff" />}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Receipt / Info */}
        <div>
          {receipt ? (
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="text-center mb-3">
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>✅</div>
                <h3 style={{ color: 'var(--success)' }}>Transfer Successful!</h3>
                <p className="text-muted">Money has been transferred successfully</p>
              </div>
              <div className="divider"></div>
              <div className="text-center mb-3">
                <div className="stat-label">Amount Transferred</div>
                <div className="stat-amount" style={{ fontSize: '28px' }}>{formatINR(receipt.amount)}</div>
              </div>
              <div className="divider"></div>
              <div style={{ fontSize: '13px' }}>
                <div className="flex-between py-1">
                  <span className="text-muted">Reference No.</span>
                  <strong>{receipt.reference}</strong>
                </div>
                <div className="flex-between py-1">
                  <span className="text-muted">From Account</span>
                  <strong>{receipt.fromAccount}</strong>
                </div>
                <div className="flex-between py-1">
                  <span className="text-muted">To Account</span>
                  <strong>{receipt.toAccount || receipt.account}</strong>
                </div>
                <div className="flex-between py-1">
                  <span className="text-muted">Date</span>
                  <strong>{new Date(receipt.date || Date.now()).toLocaleString('en-IN')}</strong>
                </div>
              </div>
              <button className="btn btn-outline btn-sm mt-3" onClick={() => setReceipt(null)}>
                Make Another Transfer
              </button>
            </div>
          ) : (
            <div className="card">
              <h3 className="card-title mb-2">Transfer Tips</h3>
              <div className="notification-list">
                <div className="notification-item transaction">
                  <div className="notification-icon">💰</div>
                  <div className="notification-content">
                    <h4>Check Balance First</h4>
                    <p>Always verify you have sufficient balance before initiating a transfer.</p>
                  </div>
                </div>
                <div className="notification-item loan">
                  <div className="notification-icon">🔒</div>
                  <div className="notification-content">
                    <h4>Secure Transfers</h4>
                    <p>All transfers are protected with 256-bit encryption.</p>
                  </div>
                </div>
                <div className="notification-item bill">
                  <div className="notification-icon">⚡</div>
                  <div className="notification-content">
                    <h4>Instant Processing</h4>
                    <p>Transfers are processed instantly, 24/7, all year round.</p>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon">📱</div>
                  <div className="notification-content">
                    <h4>Transaction Alerts</h4>
                    <p>You'll receive a notification for every transfer you make.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transfer;