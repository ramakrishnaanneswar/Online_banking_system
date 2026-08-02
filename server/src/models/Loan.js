import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    loanType: {
      type: String,
      enum: ['personal', 'home', 'car', 'education', 'business'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1000,
    },
    interestRate: {
      type: Number,
      required: true,
    },
    tenureMonths: {
      type: Number,
      required: true,
    },
    monthlyEMI: {
      type: Number,
      required: true,
    },
    totalInterest: {
      type: Number,
      required: true,
    },
    totalPayable: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'active', 'closed'],
      default: 'pending',
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;