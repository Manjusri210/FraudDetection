import React, { useState } from 'react';
import { Settings, Bell, Shield, Info, CheckCircle2, Server, Database, Cpu } from 'lucide-react';

const Toggle = ({ value, onChange, label, desc }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
    <div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
      {desc && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>}
    </div>
    <button
      role="switch" aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: '42px', height: '24px', borderRadius: '12px', border: 'none',
        background: value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
        cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        boxShadow: value ? '0 0 8px rgba(14,165,233,0.3)' : 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: value ? '21px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%', background: 'white',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  </div>
);

const SettingsPage = () => {
  const [notifyFraud, setNotifyFraud] = useState(true);
  const [notifySuspicious, setNotifySuspicious] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [compactTable, setCompactTable] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-description">Configure your Fraud Shield AI workspace preferences and review system information.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Notifications */}
          <div className="card">
            <div className="card-header"><div className="card-title"><Bell size={14} /> Alert Notifications</div></div>
            <div className="card-body">
              <Toggle value={notifyFraud} onChange={setNotifyFraud} label="Fraud Alert Toasts" desc="Show toast notification when a HIGH risk transaction is detected" />
              <Toggle value={notifySuspicious} onChange={setNotifySuspicious} label="Suspicious Alert Toasts" desc="Show toast when a MEDIUM risk transaction is flagged" />
              <Toggle value={autoRefresh} onChange={setAutoRefresh} label="Auto Refresh Dashboard" desc="Poll dashboard stats and alert count every 30 seconds" />
              <Toggle value={compactTable} onChange={setCompactTable} label="Compact Table View" desc="Reduce row padding in transaction tables for dense data viewing" />
            </div>
          </div>

          {/* Security */}
          <div className="card">
            <div className="card-header"><div className="card-title"><Shield size={14} /> Security Configuration</div></div>
            <div className="card-body">
              {[
                { k: 'Authentication', v: 'JWT Bearer Token (HS256)' },
                { k: 'Token Expiry', v: '30 days (configurable via .env)' },
                { k: 'Token Storage', v: 'localStorage — session-bound' },
                { k: 'Password Hashing', v: 'bcrypt (salt rounds: 10)' },
                { k: 'Rate Limiting', v: '100 req / 15 min per IP (login)' },
                { k: 'CORS', v: 'Configured in Express middleware' },
                { k: 'Helmet.js', v: 'Enabled — HTTP security headers' },
              ].map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '12.5px', gap: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{k}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Services */}
          <div className="card">
            <div className="card-header"><div className="card-title"><Server size={14} /> Service Endpoints</div></div>
            <div className="card-body">
              {[
                { k: 'Frontend (Dev)', v: 'http://localhost:3000', Icon: Info },
                { k: 'Backend API', v: 'http://localhost:5000/api', Icon: Server },
                { k: 'ML Flask Service', v: 'http://localhost:5001', Icon: Cpu },
                { k: 'Database', v: 'MongoDB — localhost:27017', Icon: Database },
              ].map(({ k, v, Icon }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '12.5px', gap: '12px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                  </div>
                  <span style={{ fontWeight: 500, color: 'var(--accent)', textAlign: 'right', fontFamily: 'monospace', fontSize: '11.5px' }}>{v}</span>
                </div>
              ))}
              <div className="alert alert-info" style={{ marginTop: '10px', fontSize: '11px' }}>
                <Info size={12} className="alert-icon" />
                Configure ports via environment variables in each service's <code>.env</code> file.
              </div>
            </div>
          </div>

          {/* About */}
          <div className="card">
            <div className="card-header"><div className="card-title"><Info size={14} /> About Fraud Shield AI</div></div>
            <div className="card-body">
              {[
                { k: 'Product Name', v: 'Fraud Shield AI' },
                { k: 'Version', v: '2.0.0 — ZERO ORIGIN 2026' },
                { k: 'Slogan', v: 'Detect Risk. Explain Decisions. Prevent Fraud.' },
                { k: 'Frontend', v: 'React 18 + Vite 5 + Lucide Icons' },
                { k: 'Backend', v: 'Node.js + Express + Mongoose' },
                { k: 'Database', v: 'MongoDB (local)' },
                { k: 'ML Engine', v: 'Python Flask + Scikit-Learn' },
                { k: 'ML Model', v: 'Random Forest Classifier (100 trees)' },
                { k: 'Explainability', v: 'SHAP TreeExplainer' },
              ].map(({ k, v }) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '12.5px', gap: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{k}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary btn-lg w-full" onClick={handleSave}>
            {saved ? (
              <><CheckCircle2 size={16} /> Preferences Saved</>
            ) : (
              <><Settings size={16} /> Save Preferences</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
