import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaHistory, FaExchangeAlt } from 'react-icons/fa'; // Safe Font Awesome options
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  formatINR,
  formatDate,
  categoryLabel,
  accountTypeLabel,
  downloadStatementPDF,
} from '../utils/format';
import Spinner from '../components/common/Spinner';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    search: '',
    accountId: '',
    from: '',
    to: '',
  });
  const [page, setPage] = useState(1);

  const fetchTransactions = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', pageNum);
      params.append('limit', 20);

      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data.data);
    } catch (error) {
      // Non-fatal
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransactions(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', category: '', search: '', accountId: '', from: '', to: '' });
    setPage(1);
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
        accountNumber: filters.accountId || 'All Accounts',
        accountType: 'Transaction Statement',
        period: `Filtered transactions (${pagination.total} total)`,
        transactions,
        totalCredits,
        totalDebits,
      },
      'transactions-statement'
    );
    toast.success('Statement generated! Check the print window.');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Search, filter and download your transaction history</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline btn-sm" onClick={handleDownloadPDF}>
            <FiDownload /> Download PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <form onSubmit={handleSearch} className="grid grid-4" style={{ gap: '12px', alignItems: 'end' }}>
          <div className="form-group mb-0">
            <label><FiSearch /> Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Description, reference, account..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="form-group mb-0">
            <label>Type</label>
            <select
              className="form-control"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label>Category</label>
            <select
              className="form-control"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="transfer">Transfer</option>
              <option value="bill">Bill Payment</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="interest">Interest</option>
              <option value="emi">EMI</option>
              <option value="card_payment">Card Payment</option>
              <option value="refund">Refund</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group mb-0">
            <label>Account</label>
            <select
              className="form-control"
              value={filters.accountId}
              onChange={(e) => handleFilterChange('accountId', e.target.value)}
            >
              <option value="">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {accountTypeLabel(acc.accountType)} •••• {acc.accountNumber.slice(-4)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group mb-0">
            <label>From Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
            />
          </div>
          <div className="form-group mb-0">
            <label>To Date</label>
            <input
              type="date"
              className="form-control"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
            />
          </div>
          <div className="flex" style={{ gap: '8px' }}>
            <button type="submit" className="btn btn-primary btn-sm">
              <FiFilter /> Apply
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Summary */}
      <div className="grid grid-3 mb-3">
        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-amount">{pagination.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Credits</div>
          <div className="stat-amount" style={{ color: 'var(--success)' }}>
            {formatINR(transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0))}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Debits</div>
          <div className="stat-amount" style={{ color: 'var(--danger)' }}>
            {formatINR(transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0))}
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="card">
        {loading ? (
          <div className="text-center py-4">
            <Spinner size={40} color="var(--primary)" />
            <p className="text-muted mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Reference</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn._id}>
                      <td>{formatDate(txn.date, true)}</td>
                      <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {txn.description}
                        {txn.beneficiaryName && (
                          <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                            To: {txn.beneficiaryName}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${txn.type === 'credit' ? 'badge-success' : 'badge-danger'}`}>
                          {txn.type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-primary">{categoryLabel(txn.category)}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{txn.reference}</td>
                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: txn.type === 'credit' ? 'var(--success)' : 'var(--danger)' }}>
                          {txn.type === 'credit' ? '+' : '-'} {formatINR(txn.amount)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex-between mt-3">
                <span className="text-muted" style={{ fontSize: '13px' }}>
                  Showing page {pagination.page} of {pagination.pages} ({pagination.total} transactions)
                </span>
                <div className="flex" style={{ gap: '8px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <FiChevronLeft /> Prev
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.pages}
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3>No transactions found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;