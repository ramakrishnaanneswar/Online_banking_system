import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    cardNumber: {
      type: String,
      required: true,
      unique: true,
    },
    cardType: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    cardHolderName: {
      type: String,
      required: true,
    },
    expiryMonth: {
      type: String,
      required: true,
    },
    expiryYear: {
      type: String,
      required: true,
    },
    cvv: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'expired'],
      default: 'active',
    },
    dailyLimit: {
      type: Number,
      default: 50000,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    network: {
      type: String,
      enum: ['visa', 'mastercard', 'rupay'],
      default: 'visa',
    },
    blockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Card = mongoose.model('Card', cardSchema);
export default Card;