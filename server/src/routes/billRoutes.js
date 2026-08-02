import express from 'express';
import Bill from '../models/Bill.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = express.Router();
router.use(protect);

const PROVIDERS = {
  electricity: ['Tata Power', 'BSES Rajdhani', 'Adani Electricity', 'Airtel Electricity'],
  water: ['Delhi Jal Board', 'Bangalore Water Supply', 'Mumbai Municipal', 'Hyderabad Water Board'],
  gas: ['Indraprastha Gas Ltd', 'Mahanagar Gas', 'Adani Gas', 'Gujarat Gas'],
  internet: ['Jio Fiber', 'Airtel Xstream', 'ACT Fibernet', 'BSNL Broadband'],
};

// @route   GET /api/bills
// @desc    Get all bills for user
router.get('/', async (req, res) => {
  try {
    const { status, billType } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;
    if (billType) query.billType = billType;

    const bills = await Bill.find(query)
      .populate('account', 'accountNumber accountType')
      .sort({ dueDate: -1 });

    res.json({ success: true, data: bills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/bills/providers/:type
// @desc    Get providers for a bill type
router.get('/providers/:type', (req, res) => {
  const providers = PROVIDERS[req.params.type] || [];
  res.json({ success: true, data: providers });
});

// @route   POST /api/bills
// @desc    Create/fetch a bill
router.post('/', async (req, res) => {
  try {
    const { billType, provider, consumerNumber, amount, dueDate } = req.body;

    if (!billType || !provider || !consumerNumber || !amount) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    if (!PROVIDERS[billType]) {
      return res.status(400).json({ success: false, message: 'Invalid bill type' });
    }

    const bill = await Bill.create({
      user: req.user._id,
      billType,
      provider,
      consumerNumber,
      amount: Number(amount),
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Bill fetched successfully',
      data: bill,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/bills/:id/pay
// @desc    Pay a bill
router.post('/:id/pay', async (req, res) => {
  try {
    const { fromAccountId } = req.body;

    const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    if (bill.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Bill already paid' });
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, user: req.user._id });
    if (!fromAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (fromAccount.balance < bill.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${fromAccount.balance.toLocaleString('en-IN')}`,
      });
    }

    fromAccount.balance -= bill.amount;
    bill.status = 'paid';
    bill.paidDate = new Date();
    bill.reference = `BILL-${nanoid(12).toUpperCase()}`;
    bill.account = fromAccount._id;

    await fromAccount.save();
    await bill.save();

    await Transaction.create({
      user: req.user._id,
      fromAccount: fromAccount._id,
      type: 'debit',
      category: 'bill',
      amount: bill.amount,
      description: `${bill.provider} - ${bill.billType} bill payment`,
      reference: bill.reference,
      status: 'success',
      date: new Date(),
    });

    res.json({
      success: true,
      message: `₹${bill.amount.toLocaleString('en-IN')} paid to ${bill.provider}`,
      data: bill,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;