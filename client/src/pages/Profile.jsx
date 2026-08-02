import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiCamera, FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate, getInitials, accountTypeLabel } from '../utils/format';
import Spinner from '../components/common/Spinner';
import api from '../api';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const [accounts, setAccounts] = useState(null);
  const [cards, setCards] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [accRes, cardsRes] = await Promise.all([api.get('/accounts'), api.get('/cards')]);
      setAccounts(accRes.data.data);
      setCards(cardsRes.data.data);
    } catch (error) {
      // Non-fatal
    } finally {
      setLoadingStats(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfile({ ...formData, profileImage });
      toast.success(res.message || 'Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setProfileImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success(res.message || 'Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const totalBalance = accounts?.reduce((sum, a) => sum + a.balance, 0) || 0;
  const activeCards = cards?.filter((c) => c.status === 'active').length || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal information and account security</p>
        </div>
      </div>

      {/* Profile header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {profileImage ? (
            <img src={profileImage} alt={user?.name} />
          ) : (
            getInitials(user?.name)
          )}
          <label className="avatar-upload">
            <FiCamera />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <div className="profile-info">
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>
            <FiPhone style={{ verticalAlign: 'middle' }} /> {user?.phone || 'N/A'}
          </p>
        </div>
        <div className="profile-stats">
          <div className="profile-stat">
            <strong>{formatINR(totalBalance)}</strong>
            <span>Total Balance</span>
          </div>
          <div className="profile-stat">
            <strong>{accounts?.length || 0}</strong>
            <span>Accounts</span>
          </div>
          <div className="profile-stat">
            <strong>{activeCards}</strong>
            <span>Active Cards</span>
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Personal info */}
        <div className="card">
          <h3 className="card-title mb-3">
            <FiUser /> Personal Information
          </h3>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email (Not editable)</label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                disabled
                style={{ background: 'var(--gray-50)', cursor: 'not-allowed' }}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                className="form-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                maxLength={10}
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea
                className="form-control"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'} {saving && <Spinner size={16} color="#fff" />}
            </button>
          </form>
        </div>

        <div>
          {/* Change password */}
          <div className="card mb-3">
            <h3 className="card-title mb-3">
              <FiUser /> Change Password
            </h3>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                />
              </div>
              <button type="submit" className="btn btn-success" disabled={changingPassword}>
                {changingPassword ? 'Changing...' : 'Change Password'} {changingPassword && <Spinner size={16} color="#fff" />}
              </button>
            </form>
          </div>

          {/* Account overview */}
          <div className="card">
            <h3 className="card-title mb-3">My Accounts</h3>
            {loadingStats ? (
              <div className="text-center py-3">
                <Spinner size={24} color="var(--primary)" />
              </div>
            ) : accounts && accounts.length > 0 ? (
              <div className="transaction-list">
                {accounts.map((acc) => (
                  <div key={acc._id} className="transaction-item">
                    <div className="transaction-icon transfer">
                      <FiUser />
                    </div>
                    <div className="transaction-info">
                      <div className="transaction-title">{accountTypeLabel(acc.accountType)}</div>
                      <div className="transaction-meta">
                        A/C {acc.accountNumber} • {acc.branchName}
                      </div>
                    </div>
                    <div className="transaction-amount">{formatINR(acc.balance)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">No accounts found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;