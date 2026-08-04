import React from 'react';
import Sidebar from './Sidebar';

interface Props {
  title: string;
  actions?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ title, actions, badge, children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          {badge && <span className="topbar-badge">{badge}</span>}
          {actions}
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
