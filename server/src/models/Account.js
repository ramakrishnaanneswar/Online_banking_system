import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true,
    },
    accountType: {
      type: String,
      enum: ['savings', 'current', 'fixed_deposit'],
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    branchName: {
      type: String,
      default: 'Main Branch',
    },
    interestRate: {
      type: Number,
      default: 3.5,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'closed'],
      default: 'active',
    },
    openingDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model('Account', accountSchema);
export default Account;