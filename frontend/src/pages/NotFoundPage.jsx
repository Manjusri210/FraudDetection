import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

const NotFoundPage = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'var(--background)',
    padding: '24px', textAlign: 'center',
  }}>
    <div style={{ marginBottom: '24px', color: 'var(--text-muted)', opacity: 0.4 }}>
      <ShieldAlert size={64} />
    </div>
    <div style={{ fontSize: '72px', fontWeight: 800, color: 'var(--border-strong)', lineHeight: 1, marginBottom: '12px', letterSpacing: '-0.04em' }}>
      404
    </div>
    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
      Page Not Found
    </div>
    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '340px', lineHeight: 1.6 }}>
      The page you're looking for doesn't exist or may have been moved.
    </div>
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <Link to="/" className="btn btn-secondary btn-sm">
        <Home size={14} /> Home
      </Link>
      <Link to="/dashboard" className="btn btn-primary btn-sm">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
