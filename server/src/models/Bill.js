import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    billType: {
      type: String,
      enum: ['electricity', 'water', 'gas', 'internet'],
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    consumerNumber: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    reference: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Bill = mongoose.model('Bill', billSchema);
export default Bill;