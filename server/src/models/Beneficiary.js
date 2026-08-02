import mongoose from 'mongoose';

const beneficiarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);
export default Beneficiary;