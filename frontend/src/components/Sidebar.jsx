import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, LayoutDashboard, ScanSearch, Activity, Bell,
  Network, Search, BarChart3, History, Cpu, Settings, LogOut, Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'INTELLIGENCE', type: 'section' },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analyze', label: 'Analyze Transaction', icon: ScanSearch },
  { path: '/monitor', label: 'Live Monitor', icon: Activity },
  { path: '/alerts', label: 'Fraud Alerts', icon: Bell, badge: true },
  { label: 'INVESTIGATION', type: 'section' },
  { path: '/network', label: 'Fraud Network', icon: Network },
  { path: '/investigate', label: 'Investigation Center', icon: Search },
  { path: '/transactions', label: 'Transaction History', icon: History },
  { label: 'ANALYTICS', type: 'section' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/model', label: 'Model Insights', icon: Cpu },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = ({ open, onClose, alertCount = 0, systemStatus = {} }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); onClose?.(); };
  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'visible' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'open' : ''}`} role="navigation" aria-label="Main navigation">

        {/* Brand */}
        <NavLink to="/dashboard" className="sidebar-logo" onClick={onClose} aria-label="Fraud Shield AI">
          <div className="sidebar-logo-icon" aria-hidden="true">
            <ShieldCheck size={17} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="sidebar-logo-title">FRAUD SHIELD AI</div>
            <div className="sidebar-logo-sub">AI Fraud Intelligence Platform</div>
          </div>
        </NavLink>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            if (item.type === 'section') {
              return <span key={i} className="sidebar-section-label">{item.label}</span>;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon className="sidebar-nav-icon" size={15} aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge && alertCount > 0 && (
                  <span className="sidebar-nav-badge" aria-label={`${alertCount} unresolved`}>
                    {alertCount > 99 ? '99+' : alertCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* System Status */}
        <div className="sidebar-status">
          <div className="sidebar-status-title">System Status</div>
          {[
            { label: 'Backend API', key: 'backend' },
            { label: 'ML Engine', key: 'ml' },
            { label: 'Database', key: 'database' },
          ].map(({ label, key }) => {
            const ok = systemStatus[key] === true || systemStatus[key] === 'CONNECTED' || systemStatus[key] === 'ONLINE' || systemStatus[key] === 'HEALTHY';
            const unknown = systemStatus[key] === undefined;
            return (
              <div key={key} className="status-indicator">
                <span className={`status-dot ${unknown ? 'status-dot-unknown' : ok ? 'status-dot-online' : 'status-dot-offline'}`} />
                <span>{label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: ok ? 'var(--success-text)' : unknown ? 'var(--text-dim)' : 'var(--danger-text)' }}>
                  {unknown ? 'Checking…' : ok ? 'Online' : 'Offline'}
                </span>
              </div>
            );
          })}
        </div>

        {/* User */}
        <div className="sidebar-user" onClick={() => { navigate('/profile'); onClose?.(); }} role="button" tabIndex={0}>
          <div className="sidebar-user-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">{user?.name || 'Analyst'}</div>
            <div className="sidebar-user-role">Fraud Analyst</div>
          </div>
          <button onClick={e => { e.stopPropagation(); handleLogout(); }} className="sidebar-logout-btn" title="Logout" aria-label="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
