import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { RiMenuLine } from 'react-icons/ri';

interface Props {
  title: string;
  actions?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ title, actions, badge, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <RiMenuLine />
            </button>
            <div className="topbar-title-group">
              <h1 className="topbar-title">{title}</h1>
              {badge && <span className="topbar-badge">{badge}</span>}
            </div>
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

