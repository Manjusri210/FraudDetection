import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(form.password)) e.password = 'Password must include uppercase and a number';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setErrors({});

    try {
      setSubmitting(true);
      await register(form.name, form.email, form.password);
      toast.success('Account created!', 'Welcome to Digital Fraud Detection.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setErrors({ form: msg });
      toast.error('Registration Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Brand Panel */}
      <div className="auth-brand-panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' }}>
          <div style={{ width: '44px', height: '44px', background: 'var(--primary)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={22} color="white" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '8px' }}>
            Digital Fraud<br />Detection
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            Join fraud analysts who trust our AI-powered platform for real-time transaction risk assessment.
          </div>
        </div>

        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
            Free account includes
          </div>
          {['Unlimited transaction analysis', 'Full analytics dashboard', 'ML fraud probability scoring', 'Alert & audit trail management'].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', fontSize: '12.5px', color: '#cbd5e1' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box animate-fade-in">
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
              Create your account
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>

          {errors.form && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }} role="alert">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="form-input-wrapper">
                <User size={15} className="form-input-icon" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className={`form-input has-icon ${errors.name ? 'is-error' : ''}`}
                  placeholder="Jane Smith"
                  aria-invalid={!!errors.name}
                />
              </div>
              {errors.name && <div className="form-error" role="alert">{errors.name}</div>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <div className="form-input-wrapper">
                <Mail size={15} className="form-input-icon" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={`form-input has-icon ${errors.email ? 'is-error' : ''}`}
                  placeholder="jane@company.com"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && <div className="form-error" role="alert">{errors.email}</div>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="form-input-wrapper">
                <Lock size={15} className="form-input-icon" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className={`form-input has-icon has-icon-right ${errors.password ? 'is-error' : ''}`}
                  placeholder="Min. 8 characters"
                  aria-invalid={!!errors.password}
                />
                <button type="button" className="form-input-icon form-input-icon-right" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Hide' : 'Show'}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <div className="form-error" role="alert">{errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="form-input-wrapper">
                <Lock size={15} className="form-input-icon" />
                <input
                  id="confirmPassword"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  className={`form-input has-icon ${errors.confirmPassword ? 'is-error' : ''}`}
                  placeholder="Repeat password"
                  aria-invalid={!!errors.confirmPassword}
                />
              </div>
              {errors.confirmPassword && <div className="form-error" role="alert">{errors.confirmPassword}</div>}
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full" style={{ height: '42px', marginTop: '6px' }}>
              {submitting ? (
                <><span className="btn-spinner" />Creating account…</>
              ) : (
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ marginTop: '16px', fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5' }}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
