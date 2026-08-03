import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaCalculator } from 'react-icons/fa';
import { FiPlus, FiPercent, FiArrowDownRight } from 'react-icons/fi';
import api from '../api';
import { formatINR, formatDate, loanTypeLabel } from '../utils/format';
import Spinner from '../components/common/Spinner';

const LOAN_RATES = {
  personal: 10.5,
  home: 8.5,
  car: 9.5,
  education: 7.5,
  business: 12.0,
};

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('myLoans');

  // Apply loan form
  const [showApply, setShowApply] = useState(false);
  const [applyForm, setApplyForm] = useState({
    loanType: 'personal',
    amount: '',
    tenureMonths: 12,
  });
  const [applying, setApplying] = useState(false);

  // EMI Calculator
  const [calcForm, setCalcForm] = useState({
    amount: 500000,
    interestRate: 10.5,
    tenureMonths: 24,
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [payingEmi, setPayingEmi] = useState(null); // {id, fromAccountId}

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [loansRes, accRes] = await Promise.all([api.get('/loans'), api.get('/accounts')]);
      setLoans(loansRes.data.data);
      setAccounts(accRes.data.data);
    } catch (error) {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!applyForm.amount || applyForm.amount <= 0 || !applyForm.tenureMonths || applyForm.tenureMonths <= 0) {
      toast.error('Please enter a valid amount and tenure');
      return;
    }
    setApplying(true);
    try {
      const res = await api.post('/loans/apply', applyForm);
      toast.success(res.data.message);
      setShowApply(false);
      setApplyForm({ loanType: 'personal', amount: '', tenureMonths: 12 });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply for loan');
    } finally {
      setApplying(false);
    }
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setCalculating(true);
    try {
      const res = await api.post('/loans/calculate', calcForm);
      setCalcResult(res.data.data);
    } catch (error) {
      toast.error('Failed to calculate EMI');
    } finally {
      setCalculating(false);
    }
  };

  const handlePayEMI = async (loanId, fromAccountId) => {
    if (!fromAccountId) {
      toast.error('Please select an account');
      return;
    }
    try {
      const res = await api.post(`/loans/${loanId}/pay-emi`, { fromAccountId });
      toast.success(res.data.message);
      setPayingEmi(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to pay EMI');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'badge-warning',
      approved: 'badge-info',
      rejected: 'badge-danger',
      active: 'badge-success',
      closed: 'badge-primary',
    };
    return map[status] || 'badge-primary';
  };

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner size={40} color="var(--primary)" />
        <p className="text-muted mt-2">Loading loans...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Loans</h1>
          <p>Apply for loans and manage your EMI payments</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setShowApply(!showApply)}>
            <FiPlus /> {showApply ? 'Cancel' : 'Apply for Loan'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'myLoans' ? 'active' : ''}`} onClick={() => setActiveTab('myLoans')}>
          My Loans
        </button>
        <button className={`tab ${activeTab === 'calculator' ? 'active' : ''}`} onClick={() => setActiveTab('calculator')}>
          <FiPercent /> EMI Calculator
        </button>
      </div>

      {activeTab === 'myLoans' && (
        <>
          {showApply && (
            <div className="card mb-3">
              <h3 className="card-title mb-2">Apply for a New Loan</h3>
              <form onSubmit={handleApply} className="grid grid-3" style={{ gap: '12px', alignItems: 'end' }}>
                <div className="form-group mb-0">
                  <label>Loan Type</label>
                  <select
                    className="form-control"
                    value={applyForm.loanType}
                    onChange={(e) => {
                      const lt = e.target.value;
                      setApplyForm({ ...applyForm, loanType: lt, interestRate: LOAN_RATES[lt] });
                    }}
                  >
                    {Object.entries(LOAN_RATES).map(([type, rate]) => (
                      <option key={type} value={type}>
                        {loanTypeLabel(type)} ({rate}% p.a.)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label>Loan Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount"
                    value={applyForm.amount}
                    onChange={(e) => setApplyForm({ ...applyForm, amount: e.target.value })}
                    min="1000"
                  />
                </div>
                <div className="form-group mb-0">
                  <label>Tenure (Months)</label>
                  <select
                    className="form-control"
                    value={applyForm.tenureMonths}
                    onChange={(e) => setApplyForm({ ...applyForm, tenureMonths: e.target.value })}
                  >
                    {[12, 24, 36, 48, 60, 84, 120].map((m) => (
                      <option key={m} value={m}>{m} months</option>
                    ))}
                  </select>
                </div>
                <div className="flex" style={{ gridColumn: 'span 3', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={applying}>
                    {applying ? 'Submitting...' : 'Submit Application'} {applying && <Spinner size={14} color="#fff" />}
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowApply(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loans.length > 0 ? (
            <div className="grid grid-2">
              {loans.map((loan) => (
                <div key={loan._id} className="loan-card">
                  <div className="flex-between mb-2">
                    <h3 className="card-title">{loanTypeLabel(loan.loanType)}</h3>
                    <span className={`badge ${getStatusBadge(loan.status)}`}>{loan.status.toUpperCase()}</span>
                  </div>
                  <div className="flex-between mb-2">
                    <span className="text-muted" style={{ fontSize: '13px' }}>Applied: {formatDate(loan.applicationDate)}</span>
                    <span className="text-muted" style={{ fontSize: '13px' }}>
                      Rate: <strong>{loan.interestRate}% p.a.</strong>
                    </span>
                  </div>
                  <div className="grid grid-2 mb-2" style={{ gap: '16px' }}>
                    <div>
                      <div className="stat-label">Loan Amount</div>
                      <div className="stat-amount" style={{ fontSize: '20px' }}>{formatINR(loan.amount)}</div>
                    </div>
                    <div>
                      <div className="stat-label">Monthly EMI</div>
                      <div className="stat-amount" style={{ fontSize: '20px', color: 'var(--primary)' }}>
                        {formatINR(loan.monthlyEMI)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-2 mb-2" style={{ gap: '16px' }}>
                    <div>
                      <div className="stat-label">Total Payable</div>
                      <div className="stat-amount" style={{ fontSize: '18px' }}>{formatINR(loan.totalPayable)}</div>
                    </div>
                    <div>
                      <div className="stat-label">Total Interest</div>
                      <div className="stat-amount" style={{ fontSize: '18px', color: 'var(--warning)' }}>
                        {formatINR(loan.totalInterest)}
                      </div>
                    </div>
                  </div>
                  <div className="divider"></div>
                  <div className="flex-between">
                    <span className="text-muted" style={{ fontSize: '13px' }}>Tenure: {loan.tenureMonths} months</span>
                    {(loan.status === 'active' || loan.status === 'approved') && (
                      <button className="btn btn-success btn-sm" onClick={() => setPayingEmi({ id: loan._id, fromAccountId: '' })}>
                        <FiArrowDownRight /> Pay EMI
                      </button>
                    )}
                  </div>

                  {payingEmi?.id === loan._id && (
                    <div className="card mt-2" style={{ background: 'var(--gray-50)', padding: '16px' }}>
                      <h4 className="mb-2">Pay EMI of {formatINR(loan.monthlyEMI)}</h4>
                      <div className="flex" style={{ gap: '8px' }}>
                        <select
                          className="form-control"
                          value={payingEmi.fromAccountId || ''}
                          onChange={(e) => setPayingEmi({ id: loan._id, fromAccountId: e.target.value })}
                        >
                          <option value="">Select account</option>
                          {accounts.map((acc) => (
                            <option key={acc._id} value={acc._id}>
                              {acc.accountType} - {acc.accountNumber}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handlePayEMI(loan._id, payingEmi.fromAccountId)}
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state card">
              <div className="empty-state-icon">🏠</div>
              <h3>No loans yet</h3>
              <p>Apply for your first loan to get started.</p>
              <button className="btn btn-primary btn-sm mt-2" onClick={() => setShowApply(true)}>
                <FiPlus /> Apply for Loan
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'calculator' && (
        <div className="grid grid-2">
          <div className="card">
            <h3 className="card-title mb-2"><FiPercent /> EMI Calculator</h3>
            <p className="card-subtitle mb-3">Calculate your monthly EMI before applying</p>
            <form onSubmit={handleCalculate}>
              <div className="form-group">
                <label>Loan Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={calcForm.amount}
                  onChange={(e) => setCalcForm({ ...calcForm, amount: e.target.value })}
                  min="1000"
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  className="form-control"
                  value={calcForm.interestRate}
                  onChange={(e) => setCalcForm({ ...calcForm, interestRate: e.target.value })}
                  min="1"
                  max="20"
                  step="0.5"
                />
              </div>
              <div className="form-group">
                <label>Tenure (Months)</label>
                <input
                  type="number"
                  className="form-control"
                  value={calcForm.tenureMonths}
                  onChange={(e) => setCalcForm({ ...calcForm, tenureMonths: e.target.value })}
                  min="1"
                  max="480"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={calculating}>
                {calculating ? 'Calculating...' : 'Calculate EMI'} {calculating && <Spinner size={16} color="#fff" />}
              </button>
            </form>
          </div>

          {calcResult && (
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <h3 className="card-title mb-3">Your EMI Breakdown</h3>
              <div className="text-center mb-3">
                <div className="stat-label">Monthly EMI</div>
                <div className="stat-amount" style={{ fontSize: '36px', color: 'var(--primary)' }}>
                  {formatINR(calcResult.monthlyEMI)}
                </div>
              </div>
              <div className="divider"></div>
              <div style={{ fontSize: '14px' }}>
                <div className="flex-between py-1">
                  <span className="text-muted">Loan Amount</span>
                  <strong>{formatINR(calcResult.principal)}</strong>
                </div>
                <div className="flex-between py-1">
                  <span className="text-muted">Interest Rate</span>
                  <strong>{calcResult.interestRate}% p.a.</strong>
                </div>
                <div className="flex-between py-1">
                  <span className="text-muted">Tenure</span>
                  <strong>{calcResult.tenureMonths} months</strong>
                </div>
                <div className="flex-between py-1">
                  <span className="text-muted">Total Interest</span>
                  <strong style={{ color: 'var(--warning)' }}>{formatINR(calcResult.totalInterest)}</strong>
                </div>
                <div className="flex-between py-1">
                  <span className="text-muted">Total Payable</span>
                  <strong>{formatINR(calcResult.totalPayable)}</strong>
                </div>
              </div>
              <button
                className="btn btn-success mt-3"
                onClick={() => {
                  setShowApply(true);
                  setActiveTab('myLoans');
                  setApplyForm({
                    loanType: 'personal',
                    amount: calcResult.principal,
                    tenureMonths: calcResult.tenureMonths,
                  });
                }}
              >
                Apply for This Loan
              </button>
            </div>
          )}

          {!calcResult && (
            <div className="card">
              <h3 className="card-title mb-2">Loan Interest Rates</h3>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Loan Type</th>
                      <th>Interest Rate</th>
                      <th>Max Tenure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(LOAN_RATES).map(([type, rate]) => (
                      <tr key={type}>
                        <td>{loanTypeLabel(type)}</td>
                        <td><strong>{rate}% p.a.</strong></td>
                        <td>{type === 'home' ? '240 months' : type === 'education' ? '120 months' : type === 'business' ? '84 months' : '60 months'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Loans;
