import express from 'express';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = express.Router();
router.use(protect);

// Generate account number
const generateAccountNumber = () => {
  return '10' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

// @route   GET /api/accounts
// @desc    Get all accounts for user
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/accounts/:id
// @desc    Get single account
router.get('/:id', async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/accounts
// @desc    Create a new account
router.post('/', async (req, res) => {
  try {
    const { accountType, branchName, initialDeposit = 0 } = req.body;

    const validTypes = ['savings', 'current', 'fixed_deposit'];
    if (!validTypes.includes(accountType)) {
      return res.status(400).json({ success: false, message: 'Invalid account type' });
    }

    // Check if user already has this type of account
    const existing = await Account.findOne({ user: req.user._id, accountType });
    if (existing) {
      return res.status(400).json({ success: false, message: `You already have a ${accountType} account` });
    }

    const interestRates = {
      savings: 3.5,
      current: 0,
      fixed_deposit: 7.1,
    };

    const account = await Account.create({
      user: req.user._id,
      accountNumber: generateAccountNumber(),
      accountType,
      balance: initialDeposit,
      ifscCode: 'OBIB0001234',
      branchName: branchName || 'Main Branch',
      interestRate: interestRates[accountType] || 3.5,
    });

    // Create opening deposit transaction if initialDeposit > 0
    if (initialDeposit > 0) {
      await Transaction.create({
        user: req.user._id,
        fromAccount: account._id,
        type: 'credit',
        category: 'deposit',
        amount: initialDeposit,
        description: `Initial deposit for ${accountType} account opening`,
        reference: `DEP-${nanoid(10)}`,
        status: 'success',
        date: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: `${accountType.replace('_', ' ')} account created successfully`,
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/accounts/:id/statement
// @desc    Get mini statement for account
router.get('/:id/statement', async (req, res) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const transactions = await Transaction.find({
      $or: [{ fromAccount: account._id }, { toAccount: account._id }],
    })
      .sort({ date: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        account,
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;