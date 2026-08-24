import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { randomInt } from 'node:crypto';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate a cryptographically secure random 6-digit OTP
const generateOTP = () => {
  return randomInt(100000, 1000000).toString();
};

// Nodemailer SMTP transporter (works with Gmail SMTP, and any SMTP provider)
const createTransporter = () => {
  const port = Number(process.env.SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: process.env.SMTP_SECURE === 'true' || port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send the real OTP to the user's email
const sendOTPEmail = async (to, otp) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are not configured (SMTP_USER / SMTP_PASS)');
  }

  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || `"SecureBank" <${process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to,
    subject: 'SecureBank - Your Password Reset OTP',
    text: `Hello,

We received a request to reset your SecureBank account password.

Your One-Time Password (OTP) is: ${otp}

This OTP is valid for 10 minutes. If you did not request this, please ignore this email and contact support.

Regards,
SecureBank Team`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 28px;">🏦</span>
          <h1 style="margin: 4px 0; font-size: 22px; color: #111827;">SecureBank</h1>
          <p style="margin: 0; color: #6b7280; font-size: 13px;">ONLINE BANKING SYSTEM</p>
        </div>
        <p style="color: #374151; font-size: 14px;">Hello,</p>
        <p style="color: #374151; font-size: 14px;">We received a request to reset your SecureBank account password.</p>
        <p style="color: #374151; font-size: 14px;">Your One-Time Password (OTP) is:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f766e; background: #f0fdfa; border: 1px dashed #0f766e; border-radius: 8px; padding: 12px 20px;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px;">This OTP is valid for <strong>10 minutes</strong>. For your security, please do not share this code with anyone.</p>
        <p style="color: #6b7280; font-size: 13px;">If you did not request this, please ignore this email or contact SecureBank support.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">Regards,<br/>SecureBank Team</p>
      </div>
    `,
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, address, dateOfBirth } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      address: address || '',
      dateOfBirth: dateOfBirth || null,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please login.',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user


// @route   POST /api/auth/forgot-password
// @desc    Send OTP for password reset via email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    const otp = generateOTP();
    user.otp = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };
    await user.save();

    // Send the real OTP to the user's registered email
    await sendOTPEmail(user.email, otp);

    res.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send OTP email. Please try again later.' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || !user.otp.code) {
      return res.status(400).json({ success: false, message: 'No OTP requested. Please request a new OTP.' });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password after OTP verification
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please verify first.' });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    user.password = newPassword;
    user.otp = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful! Please login with your new password.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address, dateOfBirth, profileImage } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address !== undefined ? address : user.address;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.profileImage = profileImage || user.profileImage;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        dateOfBirth: user.dateOfBirth,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth route is working!"
  });
});
export default router;