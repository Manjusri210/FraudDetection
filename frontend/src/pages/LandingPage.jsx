import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, ScanSearch, BarChart3, Bell, Lock, CheckCircle2, Cpu, BrainCircuit, FileText } from 'lucide-react';

const steps = [
  { icon: FileText, label: 'Transaction Input', desc: 'Submit transaction metadata and contextual signals' },
  { icon: Cpu, label: 'Data Processing', desc: 'Feature engineering and normalization pipeline' },
  { icon: BrainCircuit, label: 'ML Classification', desc: 'Random Forest Classifier evaluates fraud signals' },
  { icon: ShieldAlert, label: 'Risk Analysis', desc: 'Anomaly scoring and threshold evaluation' },
  { icon: BarChart3, label: 'Probability Score', desc: 'Fraud probability calculated from 0–100%' },
  { icon: CheckCircle2, label: 'Recommended Action', desc: 'Approve, flag for review, or block transaction' },
];

const features = [
  {
    icon: BrainCircuit,
    title: 'Machine Learning Engine',
    desc: 'Supervised Random Forest Classifier trained on transaction amount ratios, account age, device patterns, and behavioral anomalies.',
  },
  {
    icon: ShieldAlert,
    title: 'Explainable AI Alerts',
    desc: 'Every prediction includes clear, human-readable risk factors — not just a score.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Real-time visual breakdowns of fraud trends, risk distributions, and transaction volume.',
  },
  {
    icon: Bell,
    title: 'Alert Management',
    desc: 'Track, review and resolve high-risk alerts with an integrated security console.',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    desc: 'JWT authentication, bcrypt hashing, rate limiting, and Helmet security headers.',
  },
  {
    icon: ScanSearch,
    title: 'Transaction Audit Trail',
    desc: 'Full searchable and filterable history of every analyzed transaction with risk details.',
  },
];

const LandingPage = () => {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', color: 'var(--text-primary)' }}>

      {/* ── Nav Bar ── */}
      <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={17} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Digital Fraud Detection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ padding: '80px 24px 72px', textAlign: 'center', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: 'var(--radius-full)',
            background: 'var(--primary-muted)', color: 'var(--primary)',
            fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em',
            marginBottom: '28px', border: '1px solid var(--primary-light)',
          }}>
            AI-POWERED REAL-TIME FRAUD INTELLIGENCE
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: '1.15', color: 'var(--text-primary)', marginBottom: '20px' }}>
            Digital Fraud<br />
            <span style={{ color: 'var(--primary)' }}>Detection</span>
          </h1>

          <p style={{ fontSize: '17px', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '36px', maxWidth: '560px', margin: '0 auto 36px' }}>
            Analyze digital transactions in real-time. Detect suspicious patterns, quantify fraud risk, and receive explainable AI-driven alerts.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ gap: '8px' }}>
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Sign In to Console
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: '72px 24px', background: 'var(--background)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '8px' }}>
              How It Works
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              End-to-end ML fraud assessment pipeline
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--primary)' }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em', marginBottom: '4px' }}>
                    STEP {idx + 1}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{step.label}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '72px 24px', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Core Capabilities
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Built for financial fraud detection at enterprise scale
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="card card-hover" style={{ padding: '22px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '14px' }}>
                    <Icon size={19} />
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{f.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.55' }}>{f.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Start Detecting Fraud Today
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6' }}>
            Create a free account and analyze your first transaction in minutes. No setup required.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ gap: '8px' }}>
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface)' }}>
        Digital Fraud Detection System — AI-powered transaction risk intelligence. © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default LandingPage;
