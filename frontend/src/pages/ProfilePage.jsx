import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  User, Mail, Calendar, Key, ShieldCheck, Save,
  AlertCircle, CheckCircle2, Eye, EyeOff, Lock
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const toast = useToast();

  const [profileData, setProfileData] = useState(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setProfileData(res.data);
        setName(res.data.user?.name || '');
      } catch {
        toast.error('Error', 'Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (newPassword) {
      if (!currentPassword) e.currentPassword = 'Current password required to set a new one';
      if (newPassword.length < 6) e.newPassword = 'New password must be at least 6 characters';
      if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setErrors({});

    try {
      setUpdating(true);
      const res = await api.put('/profile', {
        name,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      toast.success('Profile Updated', 'Your changes have been saved successfully.');
      if (updateUserProfile) updateUserProfile(res.data.user);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      toast.error('Update Failed', msg);
      setErrors({ form: msg });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" aria-hidden="true" />
        <div className="page-loader-text">Loading profile…</div>
      </div>
    );
  }

  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const joinDate = profileData?.user?.createdAt
    ? new Date(profileData.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Profile</h2>
          <p className="page-description">Manage your account details and security settings.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Profile Card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: 700, color: 'white',
                margin: '0 auto 16px',
              }}>
                {initials}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {name || 'Analyst'}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {profileData?.user?.email}
              </div>
              <span className="badge badge-info">Fraud Analyst</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Account Summary</div>
            </div>
            <div className="card-body" style={{ paddingTop: '4px' }}>
              {[
                { icon: Calendar, label: 'Member since', value: joinDate },
                { icon: ShieldCheck, label: 'Transactions analyzed', value: profileData?.stats?.totalTransactions?.toLocaleString() ?? '0' },
                { icon: AlertCircle, label: 'Fraud detected', value: profileData?.stats?.fraud?.toLocaleString() ?? '0' },
                { icon: CheckCircle2, label: 'Legitimate', value: profileData?.stats?.legitimate?.toLocaleString() ?? '0' },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Settings Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {errors.form && (
              <div className="alert alert-error animate-fade-in" role="alert">
                <AlertCircle size={16} className="alert-icon" />
                {errors.form}
              </div>
            )}

            {/* Personal Info */}
            <div className="form-section">
              <div className="form-section-title">
                <User size={14} /> Personal Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-name">Full Name</label>
                  <div className="form-input-wrapper">
                    <User size={14} className="form-input-icon" />
                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                      className={`form-input has-icon ${errors.name ? 'is-error' : ''}`}
                      placeholder="Your full name"
                    />
                  </div>
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="form-input-wrapper">
                    <Mail size={14} className="form-input-icon" />
                    <input
                      type="email"
                      value={profileData?.user?.email || ''}
                      className="form-input has-icon"
                      disabled
                      title="Email cannot be changed"
                    />
                  </div>
                  <div className="form-hint">Email address cannot be changed.</div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="form-section">
              <div className="form-section-title" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={14} /> Change Password
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswords(v => !v)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '11px' }}
                >
                  {showPasswords ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showPasswords ? 'Hide' : 'Show'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="current-pass">Current Password</label>
                  <div className="form-input-wrapper">
                    <Key size={14} className="form-input-icon" />
                    <input
                      id="current-pass"
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => { setCurrentPassword(e.target.value); setErrors(p => ({ ...p, currentPassword: undefined })); }}
                      className={`form-input has-icon ${errors.currentPassword ? 'is-error' : ''}`}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                    />
                  </div>
                  {errors.currentPassword && <div className="form-error">{errors.currentPassword}</div>}
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-pass">New Password</label>
                    <input
                      id="new-pass"
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: undefined })); }}
                      className={`form-input ${errors.newPassword ? 'is-error' : ''}`}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                    />
                    {errors.newPassword && <div className="form-error">{errors.newPassword}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-pass">Confirm Password</label>
                    <input
                      id="confirm-pass"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: undefined })); }}
                      className={`form-input ${errors.confirmPassword ? 'is-error' : ''}`}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                  </div>
                </div>

                <div className="alert alert-info" style={{ fontSize: '12px' }}>
                  <ShieldCheck size={14} className="alert-icon" />
                  Leave password fields empty if you only want to update your name.
                </div>
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => {
                setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setErrors({});
              }}>
                Cancel
              </button>
              <button type="submit" disabled={updating} className="btn btn-primary">
                {updating ? <><span className="btn-spinner" />Saving…</> : <><Save size={15} />Save Changes</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
