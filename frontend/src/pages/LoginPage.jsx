import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    setErrors({});

    try {
      setSubmitting(true);
      await login(email, password);
      toast.success('Welcome back!', 'You have been signed in successfully.');
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setErrors({ form: msg });
      toast.error('Authentication Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@frauddetection.com');
    setPassword('Password123!');
    setErrors({});
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
            AI-powered transaction risk intelligence for modern financial platforms.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            'Real-time ML risk scoring',
            'Explainable fraud alerts',
            'Transaction audit trail',
            'Enterprise-grade security',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
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
              Sign in to your account
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create account</Link>
            </p>
          </div>

          {errors.form && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }} role="alert">
              <div>{errors.form}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <div className="form-input-wrapper">
                <Mail size={15} className="form-input-icon" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                  className={`form-input has-icon ${errors.email ? 'is-error' : ''}`}
                  placeholder="you@company.com"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && <div id="email-error" className="form-error" role="alert">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="form-input-wrapper">
                <Lock size={15} className="form-input-icon" aria-hidden="true" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                  className={`form-input has-icon has-icon-right ${errors.password ? 'is-error' : ''}`}
                  placeholder="••••••••"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="form-input-icon form-input-icon-right"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <div id="password-error" className="form-error" role="alert">{errors.password}</div>}
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full" style={{ height: '42px', marginTop: '4px' }}>
              {submitting ? (
                <><span className="btn-spinner" aria-hidden="true" />Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="separator" style={{ margin: '20px 0' }}>or</div>

          <button
            type="button"
            onClick={fillDemo}
            className="btn btn-secondary w-full"
            style={{ height: '38px', fontSize: '13px' }}
          >
            <Sparkles size={15} style={{ color: 'var(--warning)' }} />
            Use Demo Credentials
          </button>

          <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-md)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <strong>Demo:</strong> demo@frauddetection.com / Password123!
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
