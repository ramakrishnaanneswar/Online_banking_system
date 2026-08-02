import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  FiLayout,
  FiCreditCard,
  FiSend,
  FiList,
  FiDollarSign,
  FiFileText,
  FiUser,
  FiLogOut,
  FiBell,
  FiSettings,
  FiMenu,
  FiX,
  FiMoon,
  FiSun,
  FiHome,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/format';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: FiLayout, end: true },
  { path: '/accounts', label: 'Accounts', icon: FiCreditCard },
  { path: '/transfer', label: 'Fund Transfer', icon: FiSend },
  { path: '/transactions', label: 'Transactions', icon: FiList },
  { path: '/cards', label: 'Cards', icon: FiDollarSign },
  { path: '/loans', label: 'Loans', icon: FiFileText },
  { path: '/bills', label: 'Bill Payments', icon: FiFileText },
  { path: '/reports', label: 'Reports', icon: FiFileText },
];

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    document.body.classList.toggle('dark-mode', newMode);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🏦</span>
            <div>
              <h2>SecureBank</h2>
              <p>Online Banking</p>
            </div>
          </div>
          <button className="icon-btn sidebar-close" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className={`nav-item ${({ isActive }) => (isActive ? 'active' : '')}`} onClick={() => setSidebarOpen(false)}>
            <FiUser />
            <span>Profile</span>
          </NavLink>
          <NavLink to="/settings" className={`nav-item ${({ isActive }) => (isActive ? 'active' : '')}`} onClick={() => setSidebarOpen(false)}>
            <FiSettings />
            <span>Settings</span>
          </NavLink>
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>

          <div className="topbar-search">
            <FiHome />
            <span>Welcome back, {user?.name?.split(' ')[0] || 'User'}!</span>
          </div>

          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            <button className="icon-btn notification-btn" title="Notifications">
              <FiBell />
              <span className="notification-dot"></span>
            </button>
            <div className="user-chip" onClick={() => navigate('/profile')}>
              <div className="avatar">{getInitials(user?.name)}</div>
              <div className="user-chip-info">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;