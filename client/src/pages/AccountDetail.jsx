import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiArrowLeft,
  FiDownload,
  FiCreditCard,
  FiArrowDownRight,
  FiArrowUpRight,
  FiPrinter,
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  formatINR,
  formatDate,
  accountTypeLabel,
  categoryLabel,
  downloadStatementPDF,
} from '../utils/format';
import Spinner from '../components/common/Spinner';

const AccountDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [creditAmount, setCreditAmount] = useState('');
  const [debitAmount, setDebitAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [accRes, stmtRes] = await Promise.all([
        api.get(`/accounts/${id}`),
        api.get(`/accounts/${id}/statement`),
      ]);
      setAccount(accRes.data.data);
      setTransactions(stmtRes.data.data.transactions);
    } catch (error) {
      toast.error('Failed to load account details');
      navigate('/accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCredit = async (e) => {
    e.preventDefault();
    if (!creditAmount || creditAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post('/transactions/credit', {
        accountId: id,
        amount: creditAmount,
      });
      toast.success(res.data.message);
      setCreditAmount('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to credit amount');
    } finally {
      setProcessing(false);
    }
  };

  const handleDebit = async (e) => {
    e.preventDefault();
    if (!debitAmount || debitAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post('/transactions/debit', {
        accountId: id,
        amount: debitAmount,
      });
      toast.success(res.data.message);
      setDebitAmount('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to debit amount');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = () => {
    const totalCredits = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    downloadStatementPDF(
      {
        accountHolder: user?.name || '',
        accountNumber: account?.accountNumber || '',
        accountType: accountTypeLabel(account?.accountType),
        period: `Mini Statement (Last ${transactions.length} transactions)`,
        transactions,
        totalCredits,
        totalDebits,
      },
      `${account?.accountNumber || 'account'}-statement`
    );
    toast.success('Statement generated! Check the print window.');
  };

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner size={40} color="var(--primary)" />
        <p className="text-muted mt-2">Loading account details...</p>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div>
      <div className="page-header">
        <div className="flex" style={{ gap: '16px', alignItems: 'center' }}>
          <Link to="/accounts" className="icon-btn">
            <FiArrowLeft />
          </Link>
          <div>
            <h1>{accountTypeLabel(account.accountType)}</h1>
            <p>
              A/C {account.accountNumber} • {account.branchName}
            </p>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline btn-sm" onClick={handleDownloadPDF}>
            <FiDownload /> Download Statement
          </button>
          <Link to="/transfer" className="btn btn-primary btn-sm">
            <FiArrowUpRight /> Transfer
          </Link>
        </div>
      </div>

      <div className="grid grid-4 mb-3">
        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
          <div className="stat-label">Available Balance</div>
          <div className="stat-amount">{formatINR(account.balance)}</div>
          <div className="stat-trend up">
            {account.interestRate > 0 ? `${account.interestRate}% p.a. interest` : 'No interest applicable'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <FiCreditCard />
          </div>
          <div className="stat-label">IFSC Code</div>
          <div className="stat-amount" style={{ fontSize: '20px' }}>{account.ifscCode}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon gold">
            <FiPrinter />
          </div>
          <div className="stat-label">Opened On</div>
          <div className="stat-amount" style={{ fontSize: '18px' }}>{formatDate(account.openingDate)}</div>
        </div>
      </div>

      <div className="grid grid-3 mb-3">
        {/* Credit */}
        <div className="card">
          <h3 className="card-title mb-2">
            <FiArrowDownRight style={{ color: 'var(--success)' }} /> Credit Money
          </h3>
          <p className="card-subtitle mb-2">Add money to this account</p>
          <form onSubmit={handleCredit} className="flex" style={{ gap: '12px' }}>
            <input
              type="number"
              className="form-control"
              placeholder="Enter amount"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              min="1"
            />
            <button type="submit" className="btn btn-success btn-sm" disabled={processing || !creditAmount}>
              Add
            </button>
          </form>
        </div>

        {/* Debit */}
        <div className="card">
          <h3 className="card-title mb-2">
            <FiArrowUpRight style={{ color: 'var(--danger)' }} /> Withdraw Money
          </h3>
          <p className="card-subtitle mb-2">Withdraw from this account</p>
          <form onSubmit={handleDebit} className="flex" style={{ gap: '12px' }}>
            <input
              type="number"
              className="form-control"
              placeholder="Enter amount"
              value={debitAmount}
              onChange={(e) => setDebitAmount(e.target.value)}
              min="1"
            />
            <button type="submit" className="btn btn-danger btn-sm" disabled={processing || !debitAmount}>
              Withdraw
            </button>
          </form>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="card-title mb-2">Quick Actions</h3>
          <div className="flex" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/transfer" className="btn btn-outline btn-sm">
              <FiArrowUpRight /> Fund Transfer
            </Link>
            <Link to="/bills" className="btn btn-outline btn-sm">
              <FiCreditCard /> Pay Bills
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Mini Statement</h3>
            <p className="card-subtitle">Last {transactions.length} transactions for this account</p>
          </div>
        </div>

        {transactions.length > 0 ? (
          <div className="transaction-list">
            {transactions.map((txn) => (
              <div key={txn._id} className="transaction-item">
                <div className={`transaction-icon ${txn.type}`}>
                  {txn.type === 'credit' ? '↓' : '↑'}
                </div>
                <div className="transaction-info">
                  <div className="transaction-title">{txn.description}</div>
                  <div className="transaction-meta">
                    {formatDate(txn.date, true)} • {categoryLabel(txn.category)} • {txn.reference}
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
            <div className="empty-state-icon">📋</div>
            <h3>No transactions for this account</h3>
            <p>Transactions will appear here as you use your account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountDetail;