import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  RiUserLine,
  RiKeyLine,
  RiBookOpenLine,
  RiLogoutBoxLine,
  RiCloseLine,
} from 'react-icons/ri';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const initials = user?.email ? user.email[0].toUpperCase() : 'A';
  const email = user?.email ?? '';

  const handleLogout = async () => {
    onClose?.();
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <aside className={`sidebar${isOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="ConceptsToClinics Logo" style={{ width: 26, height: 26, objectFit: 'contain' }} />
          ConceptsToClinics
        </div>
        <div className="sidebar-logo-sub">Admin Dashboard</div>
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <RiCloseLine />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Management</div>

        <NavLink
          to="/students"
          onClick={handleNavClick}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <RiUserLine className="icon" />
          Students
        </NavLink>

        <NavLink
          to="/codes"
          onClick={handleNavClick}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <RiKeyLine className="icon" />
          Signup Codes
        </NavLink>

        <NavLink
          to="/courses"
          onClick={handleNavClick}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <RiBookOpenLine className="icon" />
          Courses
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Sign out">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{email}</div>
            <div className="sidebar-user-role">Administrator</div>
          </div>
          <RiLogoutBoxLine style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

