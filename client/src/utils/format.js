// Format amount in Indian Rupee style: ₹5,000 / ₹2,50,000
export const formatINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
};

// Format compact amount for charts: ₹2.5L, ₹50K
export const formatCompact = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

// Format date
export const formatDate = (date, withTime = false) => {
  if (!date) return '-';
  const d = new Date(date);
  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return d.toLocaleDateString('en-IN', options);
};

// Format time ago (e.g., "2 hours ago")
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return '1 year ago';

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return '1 month ago';

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return 'yesterday';

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return '1 hour ago';

  interval = Math.floor(seconds / 60);
  if (interval > 1) return `${interval} minutes ago`;
  if (interval === 1) return '1 minute ago';

  return 'just now';
};

// Mask account number (show last 4)
export const maskAccount = (accNo) => {
  if (!accNo) return '-';
  return `XXXX XXXX ${accNo.slice(-4)}`;
};

// Mask card number
export const maskCard = (cardNo) => {
  if (!cardNo) return '-';
  const digits = cardNo.replace(/\D/g, '');
  return `•••• •••• •••• ${digits.slice(-4)}`;
};

// Format card number with spaces (for display)
export const formatCardNumber = (cardNo) => {
  if (!cardNo) return '';
  return cardNo.replace(/(\d{4})(?=\d)/g, '$1 ');
};

// Get account type label
export const accountTypeLabel = (type) => {
  const labels = {
    savings: 'Savings Account',
    current: 'Current Account',
    fixed_deposit: 'Fixed Deposit',
  };
  return labels[type] || type;
};

// Get loan type label
export const loanTypeLabel = (type) => {
  const labels = {
    personal: 'Personal Loan',
    home: 'Home Loan',
    car: 'Car Loan',
    education: 'Education Loan',
    business: 'Business Loan',
  };
  return labels[type] || type;
};

// Get bill type label
export const billTypeLabel = (type) => {
  const labels = {
    electricity: 'Electricity',
    water: 'Water',
    gas: 'Gas',
    internet: 'Internet',
  };
  return labels[type] || type;
};

// Get category label for transactions
export const categoryLabel = (cat) => {
  const labels = {
    transfer: 'Transfer',
    bill: 'Bill Payment',
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    interest: 'Interest',
    emi: 'EMI Payment',
    card_payment: 'Card Payment',
    refund: 'Refund',
    other: 'Other',
  };
  return labels[cat] || cat;
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

// Get month name
export const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || month;
};

// Download PDF (using window.print approach or data URI)
export const downloadStatementPDF = (data, filename = 'statement') => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a2b4c; }
        .header { text-align: center; border-bottom: 3px solid #1a2b4c; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #1a2b4c; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; font-size: 12px; }
        .account-info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f5f7fa; border-radius: 8px; }
        .account-info div { font-size: 13px; }
        .account-info .label { color: #666; font-size: 11px; text-transform: uppercase; }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: #1a2b4c; color: #fff; padding: 12px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
        .table td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        .table tr:nth-child(even) { background: #f9fafb; }
        .credit { color: #10b981; font-weight: 600; }
        .debit { color: #ef4444; font-weight: 600; }
        .summary { margin-top: 30px; display: flex; gap: 20px; }
        .summary-box { flex: 1; padding: 15px; border-radius: 8px; text-align: center; }
        .summary-box .amount { font-size: 20px; font-weight: 700; margin-top: 5px; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SecureBank</h1>
        <p>Online Banking Statement</p>
      </div>
      <div class="account-info">
        <div>
          <div class="label">Account Holder</div>
          <div>${data.accountHolder || ''}</div>
        </div>
        <div>
          <div class="label">Account Number</div>
          <div>${data.accountNumber || ''}</div>
        </div>
        <div>
          <div class="label">Account Type</div>
          <div>${data.accountType || ''}</div>
        </div>
        <div>
          <div class="label">Period</div>
          <div>${data.period || ''}</div>
        </div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Reference</th>
            <th style="text-align:right;">Debit (₹)</th>
            <th style="text-align:right;">Credit (₹)</th>
            <th style="text-align:right;">Balance (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${(data.transactions || [])
            .map(
              (t) => `
            <tr>
              <td>${t.date ? new Date(t.date).toLocaleDateString('en-IN') : '-'}</td>
              <td>${t.description || ''}</td>
              <td>${t.reference || ''}</td>
              <td class="debit" style="text-align:right;">${t.type === 'debit' ? Number(t.amount).toLocaleString('en-IN') : ''}</td>
              <td class="credit" style="text-align:right;">${t.type === 'credit' ? Number(t.amount).toLocaleString('en-IN') : ''}</td>
              <td style="text-align:right;">${t.balanceAfter ? Number(t.balanceAfter).toLocaleString('en-IN') : ''}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <div class="summary">
        <div class="summary-box" style="background:#ecfdf5;">
          <div style="font-size:12px;color:#666;">Total Credits</div>
          <div class="amount" style="color:#10b981;">₹${Number(data.totalCredits || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="summary-box" style="background:#fef2f2;">
          <div style="font-size:12px;color:#666;">Total Debits</div>
          <div class="amount" style="color:#ef4444;">₹${Number(data.totalDebits || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="summary-box" style="background:#eff6ff;">
          <div style="font-size:12px;color:#666;">Net Balance</div>
          <div class="amount" style="color:#1a2b4c;">₹${Number(data.totalCredits - data.totalDebits || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div class="footer">
        <p>This is a computer-generated statement. For any queries, contact SecureBank support at 1800-123-4567.</p>
        <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
      </div>
    </body>
    </html>
  `;

  // Open printable window
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
  return html;
};