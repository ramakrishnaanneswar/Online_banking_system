import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// @route   GET /api/reports/monthly
// @desc    Get monthly expense/income report
router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryBreakdown = {};

    transactions.forEach((txn) => {
      if (txn.type === 'credit') {
        totalIncome += txn.amount;
      } else {
        totalExpense += txn.amount;
      }
      const cat = txn.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { amount: 0, count: 0 };
      }
      categoryBreakdown[cat].amount += txn.amount;
      categoryBreakdown[cat].count += 1;
    });

    res.json({
      success: true,
      data: {
        month: targetMonth,
        monthName: MONTHS[targetMonth - 1],
        year: targetYear,
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        transactionCount: transactions.length,
        categoryBreakdown,
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/reports/annual
// @desc    Get annual report
router.get('/annual', async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    });

    const monthlyData = [];
    let totalIncome = 0;
    let totalExpense = 0;

    for (let i = 0; i < 12; i++) {
      const monthTxns = transactions.filter((t) => new Date(t.date).getMonth() === i);
      let income = 0;
      let expense = 0;
      monthTxns.forEach((txn) => {
        if (txn.type === 'credit') income += txn.amount;
        else expense += txn.amount;
      });
      monthlyData.push({
        month: MONTHS[i],
        monthNumber: i + 1,
        income,
        expense,
      });
      totalIncome += income;
      totalExpense += expense;
    }

    const categoryBreakdown = {};
    transactions.forEach((txn) => {
      const cat = txn.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { amount: 0, count: 0 };
      }
      categoryBreakdown[cat].amount += txn.amount;
      categoryBreakdown[cat].count += 1;
    });

    res.json({
      success: true,
      data: {
        year: targetYear,
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        transactionCount: transactions.length,
        monthlyData,
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;