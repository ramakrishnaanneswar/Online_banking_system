import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      const data = await login(formData.email, formData.password);
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (email, password = 'password123') => {
    setFormData({ email, password });
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
          <h2>
            Banking made <span className="highlight">simple</span> & <span className="highlight">secure</span>
          </h2>
          <p>
            Manage your accounts, transfer funds, pay bills, and grow your savings — all from one secure platform.
          </p>
        </div>
        <div className="auth-features">
          <div className="auth-feature">
            <span className="auth-feature-icon">🔒</span>
            <span>Bank-grade 256-bit encryption</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">⚡</span>
            <span>Instant fund transfers 24/7</span>
          </div>
          <div className="auth-feature">
            <span className="auth-feature-icon">📊</span>
            <span>Smart analytics & spending insights</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Welcome back</h1>
            <p>Login to your SecureBank account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
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

            <div className="flex-between mb-2">
              <label style={{ fontSize: '13px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 14, height: 14 }} /> Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary" disabled={!formData.email || !formData.password || submitting}>
              {submitting ? 'Logging in...' : 'Login'} {submitting && <Spinner size={16} color="#fff" />}
            </button>
          </form>

          <div className="auth-links">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>

          <div className="demo-credentials">
            <p>🔑 Demo Credentials</p>
            <div className="demo-account" onClick={() => fillDemo('rahul@demo.com')}>
              👤 <strong>User:</strong> rahul@demo.com / password123
            </div>
            <div className="demo-account" onClick={() => fillDemo('priya@demo.com')}>
              👤 <strong>User:</strong> priya@demo.com / password123
            </div>
            <div className="demo-account" onClick={() => fillDemo('admin@demo.com', 'admin123')}>
              🛡️ <strong>Admin:</strong> admin@demo.com / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;