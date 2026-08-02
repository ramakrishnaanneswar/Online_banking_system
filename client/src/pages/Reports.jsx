import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../api';
import { formatINR, formatCompact, categoryLabel, getMonthName } from '../utils/format';
import Spinner from '../components/common/Spinner';

const PIE_COLORS = ['#1a2b4c', '#d4af37', '#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#64748b'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  useEffect(() => {
    fetchReport();
  }, [activeTab, year, month]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'monthly') {
        res = await api.get(`/reports/monthly?month=${month}&year=${year}`);
      } else {
        res = await api.get(`/reports/annual?year=${year}`);
      }
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load report');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // For demo, use print to generate PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>SecureBank Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a2b4c; }
          .header { text-align: center; border-bottom: 3px solid #1a2b4c; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 13px; }
          .summary { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .summary-box { flex: 1; text-align: center; padding: 15px; background: #f5f7fa; border-radius: 8px; margin: 0 10px; }
          .summary-box .amount { font-size: 22px; font-weight: 700; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1a2b4c; color: white; padding: 10px; text-align: left; font-size: 11px; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SecureBank</h1>
          <p>${activeTab === 'monthly' ? `Monthly Report - ${getMonthName(month)} ${year}` : `Annual Report - ${year}`}</p>
        </div>
        <div class="summary">
          <div class="summary-box">
            <div style="font-size:12px;color:#666;">Total Income</div>
            <div class="amount" style="color:#10b981;">${formatINR(data?.totalIncome || 0)}</div>
          </div>
          <div class="summary-box">
            <div style="font-size:12px;color:#666;">Total Expenses</div>
            <div class="amount" style="color:#ef4444;">${formatINR(data?.totalExpense || 0)}</div>
          </div>
          <div class="summary-box">
            <div style="font-size:12px;color:#666;">Net Savings</div>
            <div class="amount" style="color:#1a2b4c;">${formatINR(data?.netSavings || 0)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Count</th>
              <th>% of Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data?.categoryBreakdown || {})
              .map(([cat, val]) => `
                <tr>
                  <td>${categoryLabel(cat)}</td>
                  <td>₹${Number(val.amount).toLocaleString('en-IN')}</td>
                  <td>${val.count}</td>
                  <td>${((val.amount / (data?.totalExpense || 1)) * 100).toFixed(1)}%</td>
                </tr>
              `)
              .join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
          <p>SecureBank - Your Trusted Banking Partner</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
    toast.success('Report generated! Check the print window.');
  };

  const pieData = Object.entries(data?.categoryBreakdown || {}).map(([cat, val]) => ({
    name: categoryLabel(cat),
    value: val.amount,
  }));

  const chartData =
    activeTab === 'annual'
      ? data?.monthlyData || []
      : [
          { name: 'Income', value: data?.totalIncome || 0 },
          { name: 'Expenses', value: data?.totalExpense || 0 },
          { name: 'Savings', value: data?.netSavings || 0 },
        ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>View and download your financial reports</p>
        </div>
        <div className="page-header-actions">
          {data && (
            <button className="btn btn-outline btn-sm" onClick={handleDownload}>
              <FiDownload /> Download Report
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="card mb-3">
        <div className="flex" style={{ gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
            <button className={`tab ${activeTab === 'monthly' ? 'active' : ''}`} onClick={() => setActiveTab('monthly')}>
              Monthly Report
            </button>
            <button className={`tab ${activeTab === 'annual' ? 'active' : ''}`} onClick={() => setActiveTab('annual')}>
              Annual Report
            </button>
          </div>

          <div className="flex" style={{ gap: '12px' }}>
            {activeTab === 'monthly' && (
              <select className="form-control" value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ width: '140px' }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{getMonthName(m)}</option>
                ))}
              </select>
            )}
            <select className="form-control" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: '120px' }}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center mt-4">
          <Spinner size={40} color="var(--primary)" />
          <p className="text-muted mt-2">Loading report...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-4 mb-3">
            <div className="stat-card">
              <div className="stat-icon green"><FiTrendingUp /></div>
              <div className="stat-label">Total Income</div>
              <div className="stat-amount" style={{ color: 'var(--success)' }}>{formatINR(data.totalIncome)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><FiTrendingDown /></div>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-amount" style={{ color: 'var(--danger)' }}>{formatINR(data.totalExpense)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon dark">₹</div>
              <div className="stat-label">Net Savings</div>
              <div className="stat-amount">{formatINR(data.netSavings)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon gold">📊</div>
              <div className="stat-label">Transactions</div>
              <div className="stat-amount">{data.transactionCount}</div>
            </div>
          </div>

          <div className="grid grid-2">
            {/* Chart */}
            <div className="chart-container">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    {activeTab === 'annual' ? 'Monthly Trends' : 'Income vs Expense'}
                  </h3>
                  <p className="card-subtitle">
                    {activeTab === 'annual' ? `Monthly breakdown for ${year}` : `${getMonthName(month)} ${year}`}
                  </p>
                </div>
              </div>
              {activeTab === 'annual' ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                    <XAxis dataKey="month" stroke="var(--gray-500)" fontSize={11} />
                    <YAxis stroke="var(--gray-500)" fontSize={11} tickFormatter={(v) => formatCompact(v)} />
                    <Tooltip
                      formatter={(value) => formatINR(value)}
                      contentStyle={{ background: 'var(--white)', border: '1px solid var(--gray-100)', borderRadius: 8, fontSize: 13 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
                    <XAxis dataKey="name" stroke="var(--gray-500)" fontSize={12} />
                    <YAxis stroke="var(--gray-500)" fontSize={11} tickFormatter={(v) => formatCompact(v)} />
                    <Tooltip
                      formatter={(value) => formatINR(value)}
                      contentStyle={{ background: 'var(--white)', border: '1px solid var(--gray-100)', borderRadius: 8, fontSize: 13 }}
                    />
                    <Bar dataKey="value" name="Amount" fill="#1a2b4c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie chart */}
            <div className="chart-container">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Category Breakdown</h3>
                  <p className="card-subtitle">Expenses by category</p>
                </div>
              </div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatINR(value)}
                      contentStyle={{ background: 'var(--white)', border: '1px solid var(--gray-100)', borderRadius: 8, fontSize: 13 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <h3>No spending data</h3>
                </div>
              )}
            </div>
          </div>

          {/* Category table */}
          <div className="card mt-3">
            <div className="card-header">
              <div>
                <h3 className="card-title">Category Details</h3>
                <p className="card-subtitle">Breakdown of all expenses by category</p>
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Count</th>
                    <th style={{ textAlign: 'right' }}>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.categoryBreakdown || {}).map(([cat, val]) => (
                    <tr key={cat}>
                      <td>
                        <span className="badge badge-primary">{categoryLabel(cat)}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}><strong>{formatINR(val.amount)}</strong></td>
                      <td style={{ textAlign: 'right' }}>{val.count} txns</td>
                      <td style={{ textAlign: 'right' }}>
                        {((val.amount / (data.totalExpense || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state card">
          <div className="empty-state-icon">📄</div>
          <h3>No report data found</h3>
          <p>There are no transactions for this period.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;