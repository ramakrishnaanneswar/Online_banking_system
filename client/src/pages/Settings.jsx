import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FiMoon,
  FiBell,
  FiGlobe,
  FiShield,
  FiDollarSign,
  FiSmartphone,
  FiLock,
  FiEye,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    twoFactor: true,
    biometricLogin: false,
    biometricEnabled: false,
    sessionTimeout: '15',
    currency: 'INR',
    language: 'English',
  });

  useEffect(() => {
    // Apply dark mode on load
    document.body.classList.toggle('dark-mode', darkMode);
  }, []);

  const toggleSetting = (key) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: !prev[key] };
      return newSettings;
    });
  };

  const handleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.body.classList.toggle('dark-mode', newMode);
    toast.success(newMode ? 'Dark mode enabled' : 'Light mode enabled');
  };

  const handleSessionChange = (e) => {
    setSettings({ ...settings, sessionTimeout: e.target.value });
  };

  const handleCurrencyChange = (e) => {
    setSettings({ ...settings, currency: e.target.value });
    toast.success(`Currency set to ${e.target.value}`);
  };

  const handleLanguageChange = (e) => {
    setSettings({ ...settings, language: e.target.value });
  };

  const saveSettings = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Customize your SecureBank experience</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm" onClick={saveSettings}>
            Save Settings
          </button>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Appearance */}
        <div className="card">
          <h3 className="card-title mb-2">
            <FiMoon /> Appearance
          </h3>
          <p className="card-subtitle mb-3">Customize how SecureBank looks</p>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Dark Mode</h4>
              <p>Switch between light and dark theme</p>
            </div>
            <div className={`switch ${darkMode ? 'active' : ''}`} onClick={handleDarkMode}></div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Currency</h4>
              <p>Select your preferred display currency</p>
            </div>
            <select
              className="form-control"
              style={{ width: '110px', padding: '8px' }}
              value={settings.currency}
              onChange={handleCurrencyChange}
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
            </select>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Language</h4>
              <p>Choose your preferred language</p>
            </div>
            <select
              className="form-control"
              style={{ width: '140px', padding: '8px' }}
              value={settings.language}
              onChange={handleLanguageChange}
            >
              <option value="English">English</option>
              <option value="Hindi">हिन्दी</option>
              <option value="Bengali">বাংলা</option>
              <option value="Tamil">தமிழ்</option>
              <option value="Telugu">తెలుగు</option>
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h3 className="card-title mb-2">
            <FiBell /> Notifications
          </h3>
          <p className="card-subtitle mb-3">Choose how you want to be notified</p>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Push Notifications</h4>
              <p>Get notified about transactions and updates</p>
            </div>
            <div className={`switch ${settings.notifications ? 'active' : ''}`} onClick={() => toggleSetting('notifications')}></div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Email Alerts</h4>
              <p>Receive transaction summaries via email</p>
            </div>
            <div className={`switch ${settings.emailAlerts ? 'active' : ''}`} onClick={() => toggleSetting('emailAlerts')}></div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>SMS Alerts</h4>
              <p>Get important notifications via SMS</p>
            </div>
            <div className={`switch ${settings.smsAlerts ? 'active' : ''}`} onClick={() => toggleSetting('smsAlerts')}></div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <h3 className="card-title mb-2">
            <FiShield /> Security
          </h3>
          <p className="card-subtitle mb-3">Protect your account</p>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Two-Factor Authentication</h4>
              <p>Require OTP for account login</p>
            </div>
            <div className={`switch ${settings.twoFactor ? 'active' : ''}`} onClick={() => toggleSetting('twoFactor')}></div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Biometric Login</h4>
              <p>Use fingerprint or face ID to login</p>
            </div>
            <div className={`switch ${settings.biometricLogin ? 'active' : ''}`} onClick={() => toggleSetting('biometricLogin')}></div>
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <h4>Session Timeout</h4>
              <p>Auto logout after inactivity</p>
            </div>
            <select
              className="form-control"
              style={{ width: '110px', padding: '8px' }}
              value={settings.sessionTimeout}
              onChange={handleSessionChange}
            >
              <option value="5">5 min</option>
              <option value="10">10 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">60 min</option>
            </select>
          </div>
        </div>

        {/* Devices & Sessions */}
        <div>
          <div className="card mb-3">
            <h3 className="card-title mb-2">
              <FiSmartphone /> Devices & Sessions
            </h3>
            <p className="card-subtitle mb-3">Devices with access to your account</p>
            <div className="notification-item transaction">
              <div className="notification-icon">💻</div>
              <div className="notification-content">
                <h4>This Device</h4>
                <p>Windows 11 • Chrome • Bengaluru, India</p>
                <small className="text-muted">Active now</small>
              </div>
              <span className="badge badge-success">CURRENT</span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title mb-2">
              <FiLock /> Account
            </h3>
            <p className="card-subtitle mb-3">Account information</p>
            <div style={{ fontSize: '14px' }}>
              <div className="flex-between py-1">
                <span className="text-muted">Account Holder</span>
                <strong>{user?.name}</strong>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">Email</span>
                <strong>{user?.email}</strong>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">Phone</span>
                <strong>{user?.phone}</strong>
              </div>
              <div className="flex-between py-1">
                <span className="text-muted">Account Type</span>
                <strong>Premium</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;