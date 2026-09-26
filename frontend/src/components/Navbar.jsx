import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldAlert,
  LayoutDashboard,
  SearchCheck,
  History,
  BarChart3,
  Bell,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unresolvedAlerts, setUnresolvedAlerts] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await api.get('/alerts?reviewed=false');
        setUnresolvedAlerts(res.data.unresolvedCount || 0);
      } catch (err) {
        // silent fail
      }
    };

    if (user) {
      fetchAlertCount();
      const interval = setInterval(fetchAlertCount, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analyze', label: 'Analyze Transaction', icon: SearchCheck },
    { path: '/transactions', label: 'Transactions', icon: History },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    {
      path: '/alerts',
      label: 'Alerts',
      icon: Bell,
      badge: unresolvedAlerts > 0 ? unresolvedAlerts : null
    },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-100 tracking-tight block">
                DIGITAL<span className="text-blue-500">FRAUD</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest block uppercase -mt-1">
                Detection System
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {user ? (
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : null}

          {/* Right Action Menu */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-200 block">{user.name}</span>
                  <span className="text-[10px] text-slate-400 block">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary text-xs">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-xs">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-2 animate-fade-in">
          {user ? (
            <>
              <div className="p-3 mb-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-200 block">{user.name}</span>
                <span className="text-[11px] text-slate-400 block">{user.email}</span>
              </div>
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold ${
                      isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-rose-950/30 text-rose-400 border border-rose-900/50 rounded-lg text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 bg-slate-900 text-slate-200 rounded-lg font-semibold text-sm"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
