import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X, ShieldAlert, CheckCircle2, MapPin, Repeat, Smartphone, Users } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'normal',
    label: 'Normal Transaction',
    icon: CheckCircle2,
    color: 'var(--success-text)',
    badge: 'LOW RISK',
    badgeClass: 'badge-low',
    desc: 'Trusted device, normal amount, established account',
    data: {
      amount: '75.50', transactionType: 'Purchase', accountAge: '520',
      transactionFrequency: '12', averageTransactionAmount: '80.00',
      deviceType: 'Mobile', location: 'New York, USA', ipAddress: '172.56.12.90',
      paymentMethod: 'Credit Card', previousFraudHistory: '0', failedAttempts: '0',
    }
  },
  {
    id: 'highAmount',
    label: 'High Amount Fraud',
    icon: ShieldAlert,
    color: 'var(--danger-text)',
    badge: 'HIGH RISK',
    badgeClass: 'badge-high',
    desc: '78× normal amount, new account, proxy IP',
    data: {
      amount: '94500.00', transactionType: 'Transfer', accountAge: '4',
      transactionFrequency: '48', averageTransactionAmount: '120.00',
      deviceType: 'Desktop', location: 'Unknown/Proxy', ipAddress: '185.220.101.5',
      paymentMethod: 'Net Banking', previousFraudHistory: '1', failedAttempts: '4',
    }
  },
  {
    id: 'accountTakeover',
    label: 'Account Takeover',
    icon: Repeat,
    color: 'var(--danger-text)',
    badge: 'HIGH RISK',
    badgeClass: 'badge-high',
    desc: 'Multiple failed logins, new device, unusual location',
    data: {
      amount: '12000.00', transactionType: 'Transfer', accountAge: '365',
      transactionFrequency: '40', averageTransactionAmount: '200.00',
      deviceType: 'Desktop', location: 'Unknown/Proxy', ipAddress: '91.108.4.1',
      paymentMethod: 'Net Banking', previousFraudHistory: '0', failedAttempts: '5',
    }
  },
  {
    id: 'suspiciousLocation',
    label: 'Suspicious Location',
    icon: MapPin,
    color: 'var(--warning-text)',
    badge: 'MEDIUM',
    badgeClass: 'badge-medium',
    desc: 'VPN/Proxy IP, unusual geographic location',
    data: {
      amount: '2200.00', transactionType: 'Purchase', accountAge: '90',
      transactionFrequency: '6', averageTransactionAmount: '250.00',
      deviceType: 'Mobile', location: 'Unknown/Proxy', ipAddress: '10.8.0.1',
      paymentMethod: 'Credit Card', previousFraudHistory: '0', failedAttempts: '2',
    }
  },
  {
    id: 'failedAttempts',
    label: 'Multiple Failed Attempts',
    icon: Smartphone,
    color: 'var(--danger-text)',
    badge: 'HIGH RISK',
    badgeClass: 'badge-high',
    desc: '5 failed logins, prior fraud history, large amount',
    data: {
      amount: '8750.00', transactionType: 'Withdrawal', accountAge: '30',
      transactionFrequency: '35', averageTransactionAmount: '150.00',
      deviceType: 'Desktop', location: 'Mumbai, India', ipAddress: '203.110.93.4',
      paymentMethod: 'Net Banking', previousFraudHistory: '1', failedAttempts: '5',
    }
  },
  {
    id: 'coordinatedFraud',
    label: 'Coordinated Fraud Ring',
    icon: Users,
    color: 'var(--danger-text)',
    badge: 'CRITICAL',
    badgeClass: 'badge-high',
    desc: 'Shared proxy IP, prior fraud, extreme frequency',
    data: {
      amount: '49800.00', transactionType: 'Transfer', accountAge: '7',
      transactionFrequency: '60', averageTransactionAmount: '80.00',
      deviceType: 'Desktop', location: 'Unknown/Proxy', ipAddress: '185.220.101.99',
      paymentMethod: 'Net Banking', previousFraudHistory: '1', failedAttempts: '4',
    }
  },
];

const DemoPanel = ({ onClose }) => {
  const navigate = useNavigate();

  const handleScenario = (scenario) => {
    // Store scenario data in sessionStorage for AnalyzePage to pick up
    sessionStorage.setItem('demoScenario', JSON.stringify(scenario.data));
    navigate('/analyze');
    onClose?.();
  };

  return (
    <div style={{
      background: 'var(--bg-surface)', borderBottom: '1px solid var(--warning-border)',
      padding: '12px 20px', position: 'relative',
      backgroundImage: 'linear-gradient(to right, rgba(245,158,11,0.04), transparent)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <Zap size={15} style={{ color: 'var(--warning-text)' }} />
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--warning-text)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          DEMO MODE — Select a Hackathon Scenario
        </span>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
        {SCENARIOS.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => handleScenario(s)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)', padding: '10px 12px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'all var(--t-fast)',
                display: 'flex', flexDirection: 'column', gap: '4px',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Icon size={13} style={{ color: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>{s.label}</span>
                <span className={`badge ${s.badgeClass} badge-sm`} style={{ marginLeft: 'auto' }}>{s.badge}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'left', lineHeight: '1.4' }}>{s.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DemoPanel;
export { SCENARIOS };
