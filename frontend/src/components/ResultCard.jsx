import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Info, Zap } from 'lucide-react';

// SVG Arc Gauge
const RiskGauge = ({ probability }) => {
  const r = 70;
  const cx = 100;
  const cy = 100;
  const startAngle = -200;
  const totalAngle = 220;
  const angle = startAngle + (probability / 100) * totalAngle;
  const toRad = d => (d * Math.PI) / 180;

  const arcPath = (from, to, radius) => {
    const x1 = cx + radius * Math.cos(toRad(from));
    const y1 = cy + radius * Math.sin(toRad(from));
    const x2 = cx + radius * Math.cos(toRad(to));
    const y2 = cy + radius * Math.sin(toRad(to));
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M${x1} ${y1} A${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  const trackColor = 'rgba(148,163,184,0.1)';
  const valueColor = probability >= 65 ? '#ef4444' : probability >= 35 ? '#f59e0b' : '#22c55e';

  return (
    <svg width="200" height="160" viewBox="0 0 200 200" aria-hidden="true" style={{ display: 'block', margin: '0 auto' }}>
      {/* Track */}
      <path d={arcPath(startAngle, startAngle + totalAngle, r)} fill="none" stroke={trackColor} strokeWidth="12" strokeLinecap="round" />
      {/* Value arc */}
      {probability > 0 && (
        <path d={arcPath(startAngle, angle, r)} fill="none" stroke={valueColor} strokeWidth="12" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${valueColor}70)`, transition: 'stroke-dasharray 0.8s ease' }}
        />
      )}
      {/* Score */}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif">
        {Math.round(probability)}
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="Inter, sans-serif">
        / 100
      </text>
      {/* Labels */}
      <text x="22" y="165" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="600">LOW</text>
      <text x={cx} y="182" textAnchor="middle" fill="#64748b" fontSize="9">RISK SCORE</text>
      <text x="178" y="165" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="600">HIGH</text>
    </svg>
  );
};

const RISK_CONFIG = {
  HIGH: { color: 'var(--danger)', bg: 'var(--danger-bg)', border: 'var(--danger-border)', Icon: ShieldAlert, text: 'var(--danger-text)', label: 'FRAUD DETECTED' },
  MEDIUM: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'var(--warning-border)', Icon: AlertTriangle, text: 'var(--warning-text)', label: 'SUSPICIOUS' },
  LOW: { color: 'var(--success)', bg: 'var(--success-bg)', border: 'var(--success-border)', Icon: CheckCircle2, text: 'var(--success-text)', label: 'LEGITIMATE' },
};

const FACTOR_WEIGHTS = {
  'amount': 25, 'account': 20, 'failed': 15, 'fraud': 20, 'location': 11,
  'frequency': 9, 'default': 10,
};

const getWeight = (factor) => {
  const lower = factor.toLowerCase();
  for (const [key, w] of Object.entries(FACTOR_WEIGHTS)) {
    if (lower.includes(key)) return w;
  }
  return FACTOR_WEIGHTS.default;
};

const ResultCard = ({ result }) => {
  if (!result) return null;
  const prob = Number(result.fraud_probability ?? 0);
  const level = result.risk_level || (prob >= 65 ? 'HIGH' : prob >= 35 ? 'MEDIUM' : 'LOW');
  const cfg = RISK_CONFIG[level] || RISK_CONFIG.LOW;
  const { Icon } = cfg;
  const factors = result.risk_factors || [];
  const totalWeight = factors.reduce((s, f) => s + getWeight(f), 0);

  // Pattern detection
  const isAccountTakeover = factors.some(f => /failed|attempt/i.test(f)) &&
    factors.some(f => /location|proxy|suspicious/i.test(f)) && prob >= 50;
  const isLocationAnomaly = factors.some(f => /location|proxy|suspicious/i.test(f));

  return (
    <div className="animate-fade-in">
      {/* Main result card */}
      <div className="card" style={{ borderColor: cfg.border, borderTopWidth: '2px', borderTopColor: cfg.color }}>
        <div className="card-body" style={{ padding: '20px 16px' }}>
          {/* Header badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', borderRadius: 'var(--radius-md)',
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            marginBottom: '16px',
          }}>
            <Icon size={16} style={{ color: cfg.color }} aria-hidden="true" />
            <span style={{ fontWeight: 700, fontSize: '13px', color: cfg.text }}>{cfg.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: cfg.text, fontWeight: 600 }}>
              {result.prediction}
            </span>
          </div>

          {/* Gauge */}
          <RiskGauge probability={prob} />

          {/* Prob % */}
          <div style={{ textAlign: 'center', marginTop: '4px', marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '3px' }}>FRAUD PROBABILITY</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: cfg.color, letterSpacing: '-0.03em' }}>
              {prob.toFixed(1)}%
            </div>
          </div>

          {/* Recommended Action */}
          {result.recommended_action && (
            <div style={{
              padding: '9px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5,
              display: 'flex', gap: '7px', alignItems: 'flex-start',
            }}>
              <Zap size={13} style={{ color: cfg.color, flexShrink: 0, marginTop: '1px' }} />
              <span><strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended Action</strong>{result.recommended_action}</span>
            </div>
          )}
        </div>
      </div>

      {/* Explainable AI section */}
      {factors.length > 0 && (
        <div className="card" style={{ marginTop: '12px', borderColor: 'var(--border-card)' }}>
          <div className="card-header">
            <div className="card-title">
              <Info size={14} aria-hidden="true" /> WHY WAS THIS FLAGGED?
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>AI-generated explanation</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {factors.map((factor, i) => {
              const w = getWeight(factor);
              const pct = totalWeight > 0 ? (w / totalWeight) * 100 : 0;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4, flex: 1, paddingRight: '8px' }}>
                      {level === 'HIGH' ? '🔴' : level === 'MEDIUM' ? '🟠' : '🟢'} {factor}
                    </span>
                    <span style={{ fontSize: '11px', color: cfg.text, fontWeight: 700, flexShrink: 0 }}>+{w}</span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div
                      className={`progress-bar progress-bar-${level === 'HIGH' ? 'danger' : level === 'MEDIUM' ? 'warning' : 'success'}`}
                      style={{ width: `${pct.toFixed(0)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL RISK SCORE</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: cfg.color }}>{Math.round(prob)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Detection */}
      {(isAccountTakeover || isLocationAnomaly) && level !== 'LOW' && (
        <div className="card" style={{ marginTop: '12px', borderColor: 'var(--danger-border)', background: 'var(--danger-bg)' }}>
          <div className="card-body" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger-text)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
              ⚠ Fraud Pattern Detected
            </div>
            {isAccountTakeover && (
              <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                <strong>Possible Account Takeover</strong> — multiple failed logins + unusual location detected
              </div>
            )}
            {isLocationAnomaly && (
              <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                <strong>Location Anomaly</strong> — transaction originates from suspicious or proxy network
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
              AI-generated pattern indicator. Human review recommended.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
