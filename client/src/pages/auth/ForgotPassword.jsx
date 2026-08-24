import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const otpRefs = useRef([]);
  const { forgotPassword, verifyOTP, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setSubmitting(true);
    try {
      await forgotPassword(email);
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '');
    if (!digit && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = digit.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length) {
      const newOtp = [];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const lastFilled = Math.min(pasted.length, 5);
      otpRefs.current[lastFilled]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setSubmitting(true);
    try {
      await verifyOTP(email, otpString);
      toast.success('OTP verified successfully!');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setResendTimer(30);
    try {
      await forgotPassword(email);
      toast.success('New OTP sent!');
    } catch (error) {
      toast.error('Failed to resend OTP');
      setResendTimer(0);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email, otp.join(''), newPassword);
      toast.success('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-brand-icon">🏦</span>
          <div>
            <h1>SecureBank</h1>
            <span>ONLINE BANKING SYSTEM</span>
          </div>
        </div>
        <div className="auth-hero">
          <h2>Reset your <span className="highlight">password</span></h2>
          <p>We'll send a One-Time Password (OTP) to your registered email to verify your identity.</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-feature-icon">🔐</span>
            <span>Secure OTP verification</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">⚡</span>
            <span>Quick account recovery</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">🛡️</span>
            <span>Your data stays protected</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>{step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Set New Password'}</h1>
            <p>
              {step === 1
                ? 'Enter your registered email to receive an OTP'
                : step === 2
                ? `Enter the 6-digit code sent to ${email}`
                : 'Choose a strong new password for your account'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex-between mb-3" style={{ maxWidth: '240px' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: s <= step ? 'var(--primary)' : 'var(--gray-100)',
                    color: s <= step ? '#fff' : 'var(--gray-500)',
                  }}
                >
                  {s}
                </div>
                {s < 3 && <div style={{ width: 28, height: 2, background: s < step ? 'var(--primary)' : 'var(--gray-200)' }} />}
              </div>
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label>Registered Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={!email || submitting}>
                {submitting ? 'Sending OTP...' : 'Send OTP'} {submitting && <Spinner size={16} color="#fff" />}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit}>
              <div className="otp-inputs" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    className="otp-box"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    maxLength={1}
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              <button type="submit" className="btn btn-primary" disabled={otp.join('').length !== 6 || submitting}>
                {submitting ? 'Verifying...' : 'Verify OTP'} {submitting && <Spinner size={16} color="#fff" />}
              </button>

              <div className="auth-links">
                {resendTimer > 0 ? (
                  <span>Resend OTP in {resendTimer}s</span>
                ) : (
                  <button type="button" onClick={handleResendOTP} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--gray-500)',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-success" disabled={!newPassword || !confirmPassword || submitting}>
                {submitting ? 'Resetting...' : 'Reset Password'} {submitting && <Spinner size={16} color="#fff" />}
              </button>
            </form>
          )}

          <div className="auth-links">
            Remembered your password? <Link to="/login">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;