import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, phone, password, confirmPassword, address } = formData;

    if (!name || !email || !phone || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register({ name, email, phone, password, address });
      toast.success(res.message || 'Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
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
          <h2>Open your account in <span className="highlight">minutes</span></h2>
          <p>Join thousands of satisfied customers banking with SecureBank.</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-feature-icon">🛡️</span>
            <span>Zero account maintenance fees</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">💳</span>
            <span>Free debit card with every account</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">📈</span>
            <span>Highest interest rates on savings</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Create Account</h1>
            <p>Join SecureBank today - it's free!</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                className="form-control"
                placeholder="Enter your address (optional)"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating your account...' : 'Create Account'} {submitting && <Spinner size={16} color="#fff" />}
            </button>
          </form>

          <div className="auth-links">
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;