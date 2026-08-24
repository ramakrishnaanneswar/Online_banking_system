import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import Beneficiary from '../models/Beneficiary.js';
import Loan from '../models/Loan.js';
import Card from '../models/Card.js';
import Bill from '../models/Bill.js';

dotenv.config();

const MONTHS_AGO = (months, day = 15, hour = 10) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(day);
  d.setHours(hour, 30, 0, 0);
  return d;
};

const DAYS_AGO = (days, hour = 14) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d;
};

const seedDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online_banking');

    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Account.deleteMany({}),
      Transaction.deleteMany({}),
      Beneficiary.deleteMany({}),
      Loan.deleteMany({}),
      Card.deleteMany({}),
      Bill.deleteMany({}),
    ]);

    console.log('👤 Creating demo users...');

    // Demo User 1 - Rahul Sharma
    const rahul = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@demo.com',
      phone: '9876543210',
      password: 'password123',
      address: '12, MG Road, Bengaluru, Karnataka - 560001',
      dateOfBirth: new Date('1992-05-15'),
      role: 'user',
    });

    // Demo User 2 - Priya Patel
    const priya = await User.create({
      name: 'Priya Patel',
      email: 'priya@demo.com',
      phone: '9876501234',
      password: 'password123',
      address: '45, Marine Drive, Mumbai, Maharashtra - 400002',
      dateOfBirth: new Date('1995-11-22'),
      role: 'user',
    });

    // Demo User 3 - Admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      phone: '9812345678',
      password: 'admin123',
      address: 'Bank HQ, Connaught Place, New Delhi - 110001',
      dateOfBirth: new Date('1988-03-10'),
      role: 'admin',
    });

    console.log('🏦 Creating accounts...');

    // Rahul's accounts
    const rahulSavings = await Account.create({
      user: rahul._id,
      accountNumber: '1001234567890',
      accountType: 'savings',
      balance: 542500,
      ifscCode: 'OBIB0001234',
      branchName: 'MG Road Branch',
      interestRate: 3.5,
      openingDate: MONTHS_AGO(24, 10),
    });

    const rahulCurrent = await Account.create({
      user: rahul._id,
      accountNumber: '1009876543210',
      accountType: 'current',
      balance: 185000,
      ifscCode: 'OBIB0001234',
      branchName: 'MG Road Branch',
      interestRate: 0,
      openingDate: MONTHS_AGO(18, 5),
    });

    const rahulFD = await Account.create({
      user: rahul._id,
      accountNumber: '1002468135790',
      accountType: 'fixed_deposit',
      balance: 500000,
      ifscCode: 'OBIB0001234',
      branchName: 'MG Road Branch',
      interestRate: 7.1,
      openingDate: MONTHS_AGO(12, 1),
    });

    // Priya's accounts
    const priyaSavings = await Account.create({
      user: priya._id,
      accountNumber: '1005551234567',
      accountType: 'savings',
      balance: 325000,
      ifscCode: 'OBIB0005678',
      branchName: 'Marine Drive Branch',
      interestRate: 3.5,
      openingDate: MONTHS_AGO(14, 20),
    });

    const priyaCurrent = await Account.create({
      user: priya._id,
      accountNumber: '1006669876543',
      accountType: 'current',
      balance: 87500,
      ifscCode: 'OBIB0005678',
      branchName: 'Marine Drive Branch',
      interestRate: 0,
      openingDate: MONTHS_AGO(9, 8),
    });

    console.log('💳 Creating cards...');

    const rahulDebitCard = await Card.create({
      user: rahul._id,
      account: rahulSavings._id,
      cardNumber: '4111111111111111',
      cardType: 'debit',
      cardHolderName: 'RAHUL SHARMA',
      expiryMonth: '08',
      expiryYear: '2029',
      cvv: '453',
      network: 'visa',
      dailyLimit: 50000,
      status: 'active',
    });

    const rahulCreditCard = await Card.create({
      user: rahul._id,
      account: rahulSavings._id,
      cardNumber: '5500000000000004',
      cardType: 'credit',
      cardHolderName: 'RAHUL SHARMA',
      expiryMonth: '11',
      expiryYear: '2028',
      cvv: '782',
      network: 'mastercard',
      dailyLimit: 100000,
      creditLimit: 300000,
      outstandingBalance: 42500,
      status: 'active',
    });

    const priyaDebitCard = await Card.create({
      user: priya._id,
      account: priyaSavings._id,
      cardNumber: '4222222222222222',
      cardType: 'debit',
      cardHolderName: 'PRIYA PATEL',
      expiryMonth: '03',
      expiryYear: '2030',
      cvv: '321',
      network: 'visa',
      dailyLimit: 50000,
      status: 'active',
    });

    console.log('💰 Creating transactions...');

    const makeTxn = async (user, account, type, category, amount, description, ref, daysAgo, beneficiaryName = '', recipientAccount = '') => {
      return Transaction.create({
        user,
        fromAccount: account._id,
        type,
        category,
        amount,
        description,
        reference: ref,
        status: 'success',
        beneficiaryName,
        recipientAccount,
        date: daysAgo,
      });
    };

    // Rahul's transactions - credits
    await makeTxn(rahul._id, rahulSavings, 'credit', 'deposit', 75000, 'Salary - TechCorp India', 'SAL-2024-001', DAYS_AGO(26, 9));
    await makeTxn(rahul._id, rahulSavings, 'credit', 'deposit', 75000, 'Salary - TechCorp India', 'SAL-2024-002', DAYS_AGO(58, 9));
    await makeTxn(rahul._id, rahulSavings, 'credit', 'deposit', 75000, 'Salary - TechCorp India', 'SAL-2024-003', DAYS_AGO(88, 9));
    await makeTxn(rahul._id, rahulSavings, 'credit', 'interest', 1582.67, 'Interest credited', 'INT-2024-001', DAYS_AGO(30, 2));
    await makeTxn(rahul._id, rahulSavings, 'credit', 'refund', 2499, 'Refund - Flipkart order #FLPK12345', 'REF-2024-112', DAYS_AGO(12, 16));
    await makeTxn(rahul._id, rahulSavings, 'credit', 'transfer', 10000, 'Received from Priya Patel', 'NEFT-2024-889', DAYS_AGO(5, 11));
    await makeTxn(rahul._id, rahulSavings, 'credit', 'deposit', 25000, 'Freelance project payment', 'DEP-2024-567', DAYS_AGO(19, 15));
    await makeTxn(rahul._id, rahulSavings, 'credit', 'other', 5000, 'Gift from family', 'DEP-2024-568', DAYS_AGO(7, 18));

    // Rahul's transactions - debits
    await makeTxn(rahul._id, rahulSavings, 'debit', 'bill', 3500, 'Tata Power - Electricity bill', 'BILL-2024-789', DAYS_AGO(6, 10));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'bill', 2299, 'Jio Fiber - Internet bill', 'BILL-2024-790', DAYS_AGO(8, 12));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'bill', 850, 'Mahanagar Gas - Gas bill', 'BILL-2024-791', DAYS_AGO(14, 9));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'transfer', 15000, 'Transfer to Priya Patel', 'NEFT-2024-556', DAYS_AGO(10, 13), 'Priya Patel', '1005551234567');
    await makeTxn(rahul._id, rahulSavings, 'debit', 'card_payment', 12500, 'Credit card bill payment', 'CRD-2024-334', DAYS_AGO(9, 10));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'emi', 18500, 'Car loan EMI payment', 'EMI-2024-221', DAYS_AGO(11, 8));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'bill', 1450, 'Delhi Jal Board - Water bill', 'BILL-2024-792', DAYS_AGO(3, 10));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'transfer', 6000, 'Swiggy Instamart', 'POS-2024-445', DAYS_AGO(2, 19));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'transfer', 4500, 'BigBasket groceries', 'POS-2024-446', DAYS_AGO(4, 17));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'transfer', 12000, 'Zomato - Restaurant week', 'POS-2024-447', DAYS_AGO(16, 20));

    // Self transfers Rahul
    await makeTxn(rahul._id, rahulSavings, 'debit', 'transfer', 30000, 'Transfer to current account', 'SELF-2024-101', DAYS_AGO(22, 11));
    await makeTxn(rahul._id, rahulCurrent, 'credit', 'transfer', 30000, 'Received from savings account', 'SELF-2024-101', DAYS_AGO(22, 11));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'transfer', 50000, 'Fixed deposit investment', 'SELF-2024-102', DAYS_AGO(32, 12));
    await makeTxn(rahul._id, rahulFD, 'credit', 'transfer', 50000, 'Fixed deposit investment', 'SELF-2024-102', DAYS_AGO(32, 12));

    // Recent week transactions for nice dashboard
    await makeTxn(rahul._id, rahulSavings, 'credit', 'transfer', 2500, 'Received from Vikram', 'IMPS-2024-910', DAYS_AGO(1, 16));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'transfer', 800, 'Swiggy order', 'POS-2024-450', DAYS_AGO(0, 20, 0));
    await makeTxn(rahul._id, rahulSavings, 'debit', 'transfer', 750, 'Uber ride', 'POS-2024-451', DAYS_AGO(1, 8));

    // Priya's transactions
    await makeTxn(priya._id, priyaSavings, 'credit', 'deposit', 55000, 'Salary - Design Studio', 'SAL-2024-101', DAYS_AGO(27, 9));
    await makeTxn(priya._id, priyaSavings, 'credit', 'deposit', 55000, 'Salary - Design Studio', 'SAL-2024-102', DAYS_AGO(57, 9));
    await makeTxn(priya._id, priyaSavings, 'credit', 'interest', 912.35, 'Interest credited', 'INT-2024-021', DAYS_AGO(30, 2));
    await makeTxn(priya._id, priyaSavings, 'credit', 'transfer', 15000, 'Received from Rahul Sharma', 'NEFT-2024-556', DAYS_AGO(10, 13), 'Rahul Sharma', '1001234567890');
    await makeTxn(priya._id, priyaSavings, 'debit', 'bill', 2200, 'BSES Rajdhani - Electricity', 'BILL-2024-450', DAYS_AGO(5, 11));
    await makeTxn(priya._id, priyaSavings, 'debit', 'transfer', 8000, 'Transfer to Rahul Sharma', 'NEFT-2024-889', DAYS_AGO(5, 12), 'Rahul Sharma', '1001234567890');
    await makeTxn(priya._id, priyaSavings, 'debit', 'bill', 1800, 'ACT Fibernet - Internet', 'BILL-2024-451', DAYS_AGO(7, 15));
    await makeTxn(priya._id, priyaSavings, 'debit', 'card_payment', 7500, 'Credit card bill payment', 'CRD-2024-512', DAYS_AGO(6, 14));
    await makeTxn(priya._id, priyaSavings, 'debit', 'transfer', 4200, 'Myntra shopping', 'POS-2024-890', DAYS_AGO(3, 18));
    await makeTxn(priya._id, priyaSavings, 'debit', 'transfer', 950, 'Netflix subscription', 'POS-2024-891', DAYS_AGO(9, 21));

    // Fixed deposit interest
    await makeTxn(rahul._id, rahulFD, 'credit', 'interest', 2958.33, 'FD interest credited', 'INT-2024-055', DAYS_AGO(28, 2));

    console.log('👥 Creating beneficiaries...');

    const ben1 = await Beneficiary.create({
      user: rahul._id,
      name: 'Priya Patel',
      accountNumber: '1005551234567',
      ifscCode: 'OBIB0005678',
      bankName: 'Online Banking India',
      nickname: 'Priya',
    });

    const ben2 = await Beneficiary.create({
      user: rahul._id,
      name: 'Amit Verma',
      accountNumber: '3021884455667',
      ifscCode: 'HDFC0001234',
      bankName: 'HDFC Bank',
      nickname: 'Amit',
    });

    const ben3 = await Beneficiary.create({
      user: rahul._id,
      name: 'Sneha Reddy',
      accountNumber: '5010033778899',
      ifscCode: 'ICIC0005678',
      bankName: 'ICICI Bank',
      nickname: 'Sneha',
    });

    const ben4 = await Beneficiary.create({
      user: priya._id,
      name: 'Rahul Sharma',
      accountNumber: '1001234567890',
      ifscCode: 'OBIB0001234',
      bankName: 'Online Banking India',
      nickname: 'Rahul',
    });

    console.log('🏠 Creating loans...');

    // Rahul's active car loan
    await Loan.create({
      user: rahul._id,
      loanType: 'car',
      amount: 500000,
      interestRate: 9.5,
      tenureMonths: 36,
      monthlyEMI: 16013,
      totalInterest: 76113,
      totalPayable: 576113,
      status: 'active',
      applicationDate: MONTHS_AGO(24, 12),
      approvedDate: MONTHS_AGO(24, 14),
    });

    // Rahul's home loan
    await Loan.create({
      user: rahul._id,
      loanType: 'home',
      amount: 2500000,
      interestRate: 8.5,
      tenureMonths: 120,
      monthlyEMI: 30975,
      totalInterest: 1217002,
      totalPayable: 3717002,
      status: 'active',
      applicationDate: MONTHS_AGO(36, 3),
      approvedDate: MONTHS_AGO(36, 5),
    });

    // A pending personal loan
    await Loan.create({
      user: rahul._id,
      loanType: 'personal',
      amount: 200000,
      interestRate: 10.5,
      tenureMonths: 24,
      monthlyEMI: 9279,
      totalInterest: 22709,
      totalPayable: 222709,
      status: 'pending',
      applicationDate: DAYS_AGO(2, 12),
    });

    // Priya's education loan
    await Loan.create({
      user: priya._id,
      loanType: 'education',
      amount: 800000,
      interestRate: 7.5,
      tenureMonths: 60,
      monthlyEMI: 16031,
      totalInterest: 161846,
      totalPayable: 961846,
      status: 'approved',
      applicationDate: MONTHS_AGO(8, 16),
      approvedDate: MONTHS_AGO(8, 18),
    });

    console.log('🧾 Creating bills...');

    // Rahul's pending bills
    await Bill.create({
      user: rahul._id,
      billType: 'electricity',
      provider: 'Tata Power',
      consumerNumber: 'TP-8899-2233',
      amount: 3850,
      status: 'pending',
      dueDate: DAYS_AGO(-5, 10), // 5 days from now
    });

    await Bill.create({
      user: rahul._id,
      billType: 'internet',
      provider: 'Jio Fiber',
      consumerNumber: 'JF-77881-2345',
      amount: 2299,
      status: 'paid',
      dueDate: DAYS_AGO(8, 10),
      paidDate: DAYS_AGO(8, 12),
      reference: 'BILL-2024-790',
    });

    await Bill.create({
      user: rahul._id,
      billType: 'electricity',
      provider: 'Tata Power',
      consumerNumber: 'TP-8899-2233',
      amount: 3500,
      status: 'paid',
      dueDate: DAYS_AGO(6, 10),
      paidDate: DAYS_AGO(6, 10),
      reference: 'BILL-2024-789',
    });

    await Bill.create({
      user: rahul._id,
      billType: 'gas',
      provider: 'Mahanagar Gas',
      consumerNumber: 'MGL-33445-678',
      amount: 850,
      status: 'paid',
      dueDate: DAYS_AGO(14, 9),
      paidDate: DAYS_AGO(14, 9),
      reference: 'BILL-2024-791',
    });

    await Bill.create({
      user: rahul._id,
      billType: 'water',
      provider: 'Delhi Jal Board',
      consumerNumber: 'DJB-112233-001',
      amount: 1450,
      status: 'paid',
      dueDate: DAYS_AGO(3, 10),
      paidDate: DAYS_AGO(3, 10),
      reference: 'BILL-2024-792',
    });

    // Priya's bills
    await Bill.create({
      user: priya._id,
      billType: 'electricity',
      provider: 'BSES Rajdhani',
      consumerNumber: 'BR-4412-5566',
      amount: 2400,
      status: 'pending',
      dueDate: DAYS_AGO(-8, 9),
    });

    await Bill.create({
      user: priya._id,
      billType: 'internet',
      provider: 'ACT Fibernet',
      consumerNumber: 'ACT-90909-787',
      amount: 1800,
      status: 'paid',
      dueDate: DAYS_AGO(7, 15),
      paidDate: DAYS_AGO(7, 15),
      reference: 'BILL-2024-451',
    });

    console.log('✅ Seed data created successfully!');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('        DEMO LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('   👤 User 1 (Rahul):');
    console.log('      Email:    rahul@demo.com');
    console.log('      Password: password123');
    console.log('');
    console.log('   👤 User 2 (Priya):');
    console.log('      Email:    priya@demo.com');
    console.log('      Password: password123');
    console.log('');
    console.log('   👤 Admin:');
    console.log('      Email:    admin@demo.com');
    console.log('      Password: admin123');
    console.log('');
    console.log('═══════════════════════════════════════════');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();