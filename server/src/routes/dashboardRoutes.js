import express from 'express';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Card from '../models/Card.js';
import Loan from '../models/Loan.js';
import Bill from '../models/Bill.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard summary data
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    // Accounts
    const accounts = await Account.find({ user: userId, status: 'active' });
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Recent transactions
    const recentTransactions = await Transaction.find({ user: userId })
      .populate('fromAccount', 'accountNumber accountType')
      .populate('toAccount', 'accountNumber accountType')
      .sort({ date: -1 })
      .limit(5);

    // Monthly stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTxns = await Transaction.find({
      user: userId,
      date: { $gte: startOfMonth },
    });

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    monthlyTxns.forEach((txn) => {
      if (txn.type === 'credit') monthlyIncome += txn.amount;
      else monthlyExpense += txn.amount;
    });

    // Monthly expense graph (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const txns = await Transaction.find({
        user: userId,
        date: { $gte: d, $lte: dEnd },
      });

      let income = 0;
      let expense = 0;
      txns.forEach((txn) => {
        if (txn.type === 'credit') income += txn.amount;
        else expense += txn.amount;
      });

      monthlyData.push({
        month: d.toLocaleString('en', { month: 'short' }),
        income: Math.round(income),
        expense: Math.round(expense),
      });
    }

    // Category breakdown (pie chart)
    const categoryAgg = await Transaction.aggregate([
      { $match: { user: userId, type: 'debit' } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Notifications
    const pendingBills = await Bill.countDocuments({ user: userId, status: 'pending' });
    const pendingLoans = await Loan.countDocuments({ user: userId, status: 'pending' });
    const recentTxnsCount = await Transaction.countDocuments({
      user: userId,
      date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const notifications = [];

    if (pendingBills > 0) {
      notifications.push({
        type: 'bill',
        title: 'Pending Bills',
        message: `You have ${pendingBills} pending bill(s) to pay`,
        date: new Date(),
        icon: '📄',
      });
    }

    if (pendingLoans > 0) {
      notifications.push({
        type: 'loan',
        title: 'Loan Application',
        message: `You have ${pendingLoans} loan application(s) under review`,
        date: new Date(),
        icon: '🏦',
      });
    }

    if (recentTxnsCount > 0) {
      notifications.push({
        type: 'transaction',
        title: 'Recent Activity',
        message: `${recentTxnsCount} transaction(s) in the last 24 hours`,
        date: new Date(),
        icon: '💳',
      });
    }

    // Account type breakdown
    const accountBreakdown = {
      savings: accounts.filter((a) => a.accountType === 'savings').reduce((s, a) => s + a.balance, 0),
      current: accounts.filter((a) => a.accountType === 'current').reduce((s, a) => s + a.balance, 0),
      fixed_deposit: accounts.filter((a) => a.accountType === 'fixed_deposit').reduce((s, a) => s + a.balance, 0),
    };

    // Cards count
    const activeCards = await Card.countDocuments({ user: userId, status: 'active' });

    res.json({
      success: true,
      data: {
        totalBalance,
        totalAccounts: accounts.length,
        recentTransactions,
        monthlyIncome,
        monthlyExpense,
        monthlyData,
        categoryBreakdown: categoryAgg,
        notifications,
        accountBreakdown,
        activeCards,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;