import express from 'express';
import Transaction from '../models/Transaction.js';
import Account from '../models/Account.js';
import { protect } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = express.Router();
router.use(protect);

// @route   GET /api/transactions
// @desc    Get all transactions for user with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, category, search, from, to, accountId, page = 1, limit = 20 } = req.query;

    const query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (accountId) {
      query.$or = [{ fromAccount: accountId }, { toAccount: accountId }];
    }

    // Date range
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    // Search in description or reference or recipient
    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { description: { $regex: search, $options: 'i' } },
            { reference: { $regex: search, $options: 'i' } },
            { beneficiaryName: { $regex: search, $options: 'i' } },
            { recipientAccount: { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete query.$or;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('fromAccount', 'accountNumber accountType')
      .populate('toAccount', 'accountNumber accountType')
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/transactions/mini-statement
// @desc    Get mini statement (last 10 transactions)
router.get('/mini-statement', async (req, res) => {
  try {
    const { accountId } = req.query;

    let query = { user: req.user._id };
    if (accountId) {
      query = {
        user: req.user._id,
        $or: [{ fromAccount: accountId }, { toAccount: accountId }],
      };
    }

    const transactions = await Transaction.find(query)
      .populate('fromAccount', 'accountNumber accountType')
      .populate('toAccount', 'accountNumber accountType')
      .sort({ date: -1 })
      .limit(10);

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/transactions/credit
// @desc    Add money to an account (deposit/credit)
router.post('/credit', async (req, res) => {
  try {
    const { accountId, amount, description } = req.body;

    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide account and valid amount' });
    }

    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const amountNum = Number(amount);
    account.balance += amountNum;
    await account.save();

    const transaction = await Transaction.create({
      user: req.user._id,
      fromAccount: account._id,
      type: 'credit',
      category: 'deposit',
      amount: amountNum,
      description: description || 'Cash deposit',
      reference: `DEP-${nanoid(12).toUpperCase()}`,
      status: 'success',
      date: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `₹${amountNum.toLocaleString('en-IN')} credited to your account`,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/transactions/debit
// @desc    Withdraw money from account (debit)
router.post('/debit', async (req, res) => {
  try {
    const { accountId, amount, description } = req.body;

    if (!accountId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide account and valid amount' });
    }

    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const amountNum = Number(amount);
    if (account.balance < amountNum) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${account.balance.toLocaleString('en-IN')}` });
    }

    account.balance -= amountNum;
    await account.save();

    const transaction = await Transaction.create({
      user: req.user._id,
      fromAccount: account._id,
      type: 'debit',
      category: 'withdrawal',
      amount: amountNum,
      description: description || 'Cash withdrawal',
      reference: `WDL-${nanoid(12).toUpperCase()}`,
      status: 'success',
      date: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `₹${amountNum.toLocaleString('en-IN')} debited from your account`,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id })
      .populate('fromAccount', 'accountNumber accountType')
      .populate('toAccount', 'accountNumber accountType');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;