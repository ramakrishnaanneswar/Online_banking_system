import express from 'express';
import Loan from '../models/Loan.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = express.Router();
router.use(protect);

// Interest rates by loan type
const LOAN_RATES = {
  personal: 10.5,
  home: 8.5,
  car: 9.5,
  education: 7.5,
  business: 12.0,
};

// @route   GET /api/loans
// @desc    Get all loans for user
router.get('/', async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user._id }).sort({ applicationDate: -1 });
    res.json({ success: true, data: loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/loans/calculate
// @desc    Calculate EMI
router.post('/calculate', async (req, res) => {
  try {
    const { amount, interestRate, tenureMonths } = req.body;

    const principal = Number(amount);
    const rate = Number(interestRate) / 100 / 12;
    const months = Number(tenureMonths);

    if (!principal || !rate || !months || principal <= 0 || months <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid loan parameters' });
    }

    const emi = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    res.json({
      success: true,
      data: {
        monthlyEMI: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayable: Math.round(totalPayment),
        principal,
        interestRate: Number(interestRate),
        tenureMonths: months,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/loans/apply
// @desc    Apply for a loan (auto-approved for demo)
router.post('/apply', async (req, res) => {
  try {
    const { loanType, amount, tenureMonths } = req.body;

    if (!loanType || !amount || !tenureMonths) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    if (!LOAN_RATES[loanType]) {
      return res.status(400).json({ success: false, message: 'Invalid loan type' });
    }

    const principal = Number(amount);
    const months = Number(tenureMonths);
    const rate = LOAN_RATES[loanType] / 100 / 12;

    if (principal <= 0 || months <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount or tenure' });
    }

    const emi = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    // Auto-approve for demo (90% approval)
    const autoApproved = Math.random() > 0.1;

    const loan = await Loan.create({
      user: req.user._id,
      loanType,
      amount: principal,
      interestRate: LOAN_RATES[loanType],
      tenureMonths: months,
      monthlyEMI: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayable: Math.round(totalPayment),
      status: autoApproved ? 'approved' : 'pending',
      approvedDate: autoApproved ? new Date() : null,
    });

    // If approved, credit the amount to savings account
    if (autoApproved) {
      const savingsAccount = await Account.findOne({ user: req.user._id, accountType: 'savings' });
      if (savingsAccount) {
        savingsAccount.balance += principal;
        await savingsAccount.save();

        await Transaction.create({
          user: req.user._id,
          fromAccount: savingsAccount._id,
          type: 'credit',
          category: 'deposit',
          amount: principal,
          description: `${loanType.charAt(0).toUpperCase() + loanType.slice(1)} loan disbursed`,
          reference: `LND-${nanoid(12).toUpperCase()}`,
          status: 'success',
          date: new Date(),
        });
      }
    }

    res.status(201).json({
      success: true,
      message: autoApproved
        ? `Your ${loanType} loan of ₹${principal.toLocaleString('en-IN')} has been approved and disbursed!`
        : 'Loan application submitted. It is under review.',
      data: loan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/loans/:id
// @desc    Get single loan
router.get('/:id', async (req, res) => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/loans/:id/pay-emi
// @desc    Pay EMI for an active loan
router.post('/:id/pay-emi', async (req, res) => {
  try {
    const { fromAccountId } = req.body;

    const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    if (loan.status !== 'active' && loan.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Loan is not active' });
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, user: req.user._id });
    if (!fromAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (fromAccount.balance < loan.monthlyEMI) {
      return res.status(400).json({ success: false, message: 'Insufficient balance for EMI payment' });
    }

    fromAccount.balance -= loan.monthlyEMI;
    await fromAccount.save();

    await Transaction.create({
      user: req.user._id,
      fromAccount: fromAccount._id,
      type: 'debit',
      category: 'emi',
      amount: loan.monthlyEMI,
      description: `${loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} loan EMI payment`,
      reference: `EMI-${nanoid(12).toUpperCase()}`,
      status: 'success',
      date: new Date(),
    });

    res.json({
      success: true,
      message: `EMI of ₹${loan.monthlyEMI.toLocaleString('en-IN')} paid successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;