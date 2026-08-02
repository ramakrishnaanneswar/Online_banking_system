import express from 'express';
import mongoose from 'mongoose';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Beneficiary from '../models/Beneficiary.js';
import { protect } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = express.Router();
router.use(protect);

// Helper to create reference
const makeRef = (prefix) => `${prefix}-${nanoid(12).toUpperCase()}`;

// @route   POST /api/transfer/self
// @desc    Transfer between own accounts
router.post('/self', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { fromAccountId, toAccountId, amount, description } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ success: false, message: 'Cannot transfer to the same account' });
    }

    const amountNum = Number(amount);
    if (amountNum <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, user: req.user._id }).session(session);
    const toAccount = await Account.findOne({ _id: toAccountId, user: req.user._id }).session(session);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (fromAccount.balance < amountNum) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${fromAccount.balance.toLocaleString('en-IN')}` });
    }

    fromAccount.balance -= amountNum;
    toAccount.balance += amountNum;
    await fromAccount.save({ session });
    await toAccount.save({ session });

    const ref = makeRef('SELF');
    const now = new Date();

    await Transaction.create(
      [
        {
          user: req.user._id,
          fromAccount: fromAccount._id,
          toAccount: toAccount._id,
          type: 'debit',
          category: 'transfer',
          amount: amountNum,
          description: description || 'Self transfer',
          reference: ref,
          status: 'success',
          date: now,
        },
        {
          user: req.user._id,
          fromAccount: fromAccount._id,
          toAccount: toAccount._id,
          type: 'credit',
          category: 'transfer',
          amount: amountNum,
          description: description || 'Self transfer',
          reference: ref,
          status: 'success',
          date: now,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: `₹${amountNum.toLocaleString('en-IN')} transferred successfully`,
      data: {
        reference: ref,
        fromAccount: fromAccount.accountNumber,
        toAccount: toAccount.accountNumber,
        amount: amountNum,
        date: now,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

// @route   POST /api/transfer/beneficiary
// @desc    Transfer to a saved beneficiary
router.post('/beneficiary', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { fromAccountId, beneficiaryId, amount, description } = req.body;

    if (!fromAccountId || !beneficiaryId || !amount) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const amountNum = Number(amount);
    if (amountNum <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, user: req.user._id }).session(session);
    const beneficiary = await Beneficiary.findOne({ _id: beneficiaryId, user: req.user._id }).session(session);

    if (!fromAccount || !beneficiary) {
      return res.status(404).json({ success: false, message: 'Account or beneficiary not found' });
    }

    if (fromAccount.balance < amountNum) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${fromAccount.balance.toLocaleString('en-IN')}` });
    }

    fromAccount.balance -= amountNum;
    await fromAccount.save({ session });

    const ref = makeRef('NEFT');
    await Transaction.create(
      [
        {
          user: req.user._id,
          fromAccount: fromAccount._id,
          type: 'debit',
          category: 'transfer',
          amount: amountNum,
          description: description || `Transfer to ${beneficiary.name}`,
          reference: ref,
          status: 'success',
          beneficiaryName: beneficiary.name,
          recipientAccount: beneficiary.accountNumber,
          date: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: `₹${amountNum.toLocaleString('en-IN')} transferred to ${beneficiary.name}`,
      data: {
        reference: ref,
        beneficiary: beneficiary.name,
        account: beneficiary.accountNumber,
        amount: amountNum,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
});

// @route   POST /api/transfer/other
// @desc    Transfer to other bank account (one-time, not saved)
router.post('/other', async (req, res) => {
  try {
    const { fromAccountId, recipientName, recipientAccount, ifscCode, bankName, amount, description } = req.body;

    if (!fromAccountId || !recipientName || !recipientAccount || !amount) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const amountNum = Number(amount);
    if (amountNum <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, user: req.user._id });
    if (!fromAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (fromAccount.balance < amountNum) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${fromAccount.balance.toLocaleString('en-IN')}` });
    }

    fromAccount.balance -= amountNum;
    await fromAccount.save();

    const ref = makeRef('IMPS');
    await Transaction.create({
      user: req.user._id,
      fromAccount: fromAccount._id,
      type: 'debit',
      category: 'transfer',
      amount: amountNum,
      description: description || `Transfer to ${recipientName}`,
      reference: ref,
      status: 'success',
      beneficiaryName: recipientName,
      recipientAccount,
      date: new Date(),
    });

    res.json({
      success: true,
      message: `₹${amountNum.toLocaleString('en-IN')} transferred to ${recipientName}`,
      data: {
        reference: ref,
        recipientName,
        recipientAccount,
        amount: amountNum,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/transfer/beneficiaries
// @desc    Get all beneficiaries
router.get('/beneficiaries', async (req, res) => {
  try {
    const beneficiaries = await Beneficiary.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: beneficiaries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/transfer/beneficiaries
// @desc    Add a new beneficiary
router.post('/beneficiaries', async (req, res) => {
  try {
    const { name, accountNumber, ifscCode, bankName, nickname } = req.body;

    if (!name || !accountNumber || !ifscCode || !bankName) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields' });
    }

    const beneficiary = await Beneficiary.create({
      user: req.user._id,
      name,
      accountNumber,
      ifscCode,
      bankName,
      nickname: nickname || '',
    });

    res.status(201).json({
      success: true,
      message: 'Beneficiary added successfully',
      data: beneficiary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/transfer/beneficiaries/:id
// @desc    Update a beneficiary
router.put('/beneficiaries/:id', async (req, res) => {
  try {
    const { name, accountNumber, ifscCode, bankName, nickname } = req.body;

    const beneficiary = await Beneficiary.findOne({ _id: req.params.id, user: req.user._id });
    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    beneficiary.name = name || beneficiary.name;
    beneficiary.accountNumber = accountNumber || beneficiary.accountNumber;
    beneficiary.ifscCode = ifscCode || beneficiary.ifscCode;
    beneficiary.bankName = bankName || beneficiary.bankName;
    beneficiary.nickname = nickname !== undefined ? nickname : beneficiary.nickname;

    await beneficiary.save();

    res.json({ success: true, message: 'Beneficiary updated successfully', data: beneficiary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/transfer/beneficiaries/:id
// @desc    Delete a beneficiary
router.delete('/beneficiaries/:id', async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    res.json({ success: true, message: 'Beneficiary deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;