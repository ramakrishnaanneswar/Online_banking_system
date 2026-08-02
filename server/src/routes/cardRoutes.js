import express from 'express';
import Card from '../models/Card.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const router = express.Router();
router.use(protect);

// Generate card number (Luhn-like format)
const generateCardNumber = () => {
  let num = '4';
  for (let i = 0; i < 15; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return num;
};

// @route   GET /api/cards
// @desc    Get all cards for user
router.get('/', async (req, res) => {
  try {
    const cards = await Card.find({ user: req.user._id })
      .populate('account', 'accountNumber accountType')
      .sort({ createdAt: -1 });

    // Mask card numbers
    const maskedCards = cards.map((card) => card.toObject());
    maskedCards.forEach((c) => {
      c.cardNumber = `•••• •••• •••• ${c.cardNumber.slice(-4)}`;
    });

    res.json({ success: true, data: maskedCards });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/cards
// @desc    Create a new card
router.post('/', async (req, res) => {
  try {
    const { accountId, cardType, network = 'visa' } = req.body;

    if (!accountId || !cardType) {
      return res.status(400).json({ success: false, message: 'Please provide account and card type' });
    }

    if (!['debit', 'credit'].includes(cardType)) {
      return res.status(400).json({ success: false, message: 'Invalid card type' });
    }

    const account = await Account.findOne({ _id: accountId, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Check existing card of same type
    const existing = await Card.findOne({ user: req.user._id, cardType: cardType, status: { $ne: 'expired' } });
    if (existing) {
      return res.status(400).json({ success: false, message: `You already have an active ${cardType} card` });
    }

    const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const expiryYear = String(new Date().getFullYear() + 5);

    const card = await Card.create({
      user: req.user._id,
      account: account._id,
      cardNumber: generateCardNumber(),
      cardType,
      cardHolderName: req.user.name.toUpperCase(),
      expiryMonth,
      expiryYear,
      cvv: String(Math.floor(100 + Math.random() * 900)),
      dailyLimit: cardType === 'credit' ? 100000 : 50000,
      creditLimit: cardType === 'credit' ? Math.max(100000, account.balance * 2) : 0,
      network,
    });

    const cardObj = card.toObject();
    delete cardObj.cvv;
    cardObj.cardNumber = `•••• •••• •••• ${cardObj.cardNumber.slice(-4)}`;

    res.status(201).json({
      success: true,
      message: `${cardType} card created successfully`,
      data: cardObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/cards/:id/block
// @desc    Block a card
router.put('/:id/block', async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    card.status = 'blocked';
    card.blockedAt = new Date();
    await card.save();

    res.json({ success: true, message: 'Card blocked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/cards/:id/unblock
// @desc    Unblock a card
router.put('/:id/unblock', async (req, res) => {
  try {
    const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    card.status = 'active';
    card.blockedAt = null;
    await card.save();

    res.json({ success: true, message: 'Card unblocked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/cards/:id
// @desc    Get card details (with full number after verification)
router.get('/:id', async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)
      .populate('account', 'accountNumber accountType')
      .select('+cvv');

    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    if (card.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/cards/:id/pay
// @desc    Pay credit card bill
router.post('/:id/pay', async (req, res) => {
  try {
    const { amount, fromAccountId } = req.body;

    const card = await Card.findOne({ _id: req.params.id, user: req.user._id });
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    if (card.cardType !== 'credit') {
      return res.status(400).json({ success: false, message: 'This is not a credit card' });
    }

    const amountNum = Number(amount);
    if (amountNum <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid amount' });
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, user: req.user._id });
    if (!fromAccount) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (fromAccount.balance < amountNum) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    fromAccount.balance -= amountNum;
    card.outstandingBalance = Math.max(0, card.outstandingBalance - amountNum);
    await fromAccount.save();
    await card.save();

    await Transaction.create({
      user: req.user._id,
      fromAccount: fromAccount._id,
      type: 'debit',
      category: 'card_payment',
      amount: amountNum,
      description: `Credit card bill payment`,
      reference: `CRD-${nanoid(12).toUpperCase()}`,
      status: 'success',
      date: new Date(),
    });

    res.json({
      success: true,
      message: `₹${amountNum.toLocaleString('en-IN')} paid towards your credit card`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;