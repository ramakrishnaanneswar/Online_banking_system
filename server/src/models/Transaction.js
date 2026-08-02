import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    category: {
      type: String,
      enum: ['transfer', 'bill', 'deposit', 'withdrawal', 'interest', 'emi', 'card_payment', 'refund', 'other'],
      default: 'other',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    reference: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      default: 'success',
    },
    beneficiaryName: {
      type: String,
      default: '',
    },
    recipientAccount: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;