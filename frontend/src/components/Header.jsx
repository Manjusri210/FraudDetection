import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, Bell, ChevronRight, Zap } from 'lucide-react';

const PAGE_META = {
  '/dashboard': { title: 'Dashboard', breadcrumb: 'Intelligence Overview' },
  '/analyze': { title: 'Analyze Transaction', breadcrumb: 'AI Risk Analysis' },
  '/monitor': { title: 'Live Monitor', breadcrumb: 'Real-Time Transaction Stream' },
  '/alerts': { title: 'Fraud Alerts', breadcrumb: 'Security Incidents' },
  '/network': { title: 'Fraud Network', breadcrumb: 'Pattern Analysis' },
  '/investigate': { title: 'Investigation Center', breadcrumb: 'Case Management' },
  '/transactions': { title: 'Transaction History', breadcrumb: 'Audit Trail' },
  '/analytics': { title: 'Analytics', breadcrumb: 'Trends & Insights' },
  '/model': { title: 'Model Insights', breadcrumb: 'AI Transparency' },
  '/settings': { title: 'Settings', breadcrumb: 'Preferences' },
  '/profile': { title: 'Profile', breadcrumb: 'Account Settings' },
};

const Header = ({ onMenuClick, alertCount = 0, demoMode = false, onDemoToggle }) => {
  const { user } = useAuth();
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: 'Fraud Shield AI', breadcrumb: '' };
  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

  return (
    <header className="top-header" role="banner">
      <button className="header-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
        <Menu size={17} />
      </button>

      <div className="header-title-area">
        <div className="header-page-title">{meta.title}</div>
        {meta.breadcrumb && (
          <div className="header-breadcrumb">
            <span>Fraud Shield AI</span>
            <ChevronRight size={11} aria-hidden="true" />
            <span>{meta.breadcrumb}</span>
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Demo Mode Toggle */}
        <button
          className="demo-mode-badge"
          onClick={onDemoToggle}
          aria-pressed={demoMode}
          title="Toggle Demo Mode — preset hackathon scenarios"
        >
          <Zap size={11} />
          {demoMode ? 'EXIT DEMO' : 'DEMO MODE'}
        </button>

        {/* Alerts Bell */}
        <Link
          to="/alerts"
          className="header-icon-btn"
          aria-label={alertCount > 0 ? `${alertCount} unresolved alerts` : 'Alerts'}
          style={{ position: 'relative' }}
        >
          <Bell size={16} />
          {alertCount > 0 && <span className="header-notif-dot" aria-hidden="true" />}
        </Link>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 3px' }} aria-hidden="true" />

        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none' }}>
          <div className="header-avatar" title={user?.name}>{initials}</div>
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }} className="header-user-name">
            {user?.name?.split(' ')[0] || 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Header;
