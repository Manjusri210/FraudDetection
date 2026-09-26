import React from 'react';

// Donut Chart
export const DonutChart = ({ data = [], title, subtitle }) => {
  const total = data.reduce((acc, d) => acc + (d.value || 0), 0) || 1;

  let cumulative = 0;
  const slices = data.map(d => {
    const pct = d.value / total;
    const angle = pct * 360;
    const start = cumulative;
    cumulative += angle;
    return { ...d, pct, start, angle };
  });

  const r = 42;
  const circ = 2 * Math.PI * r;

  let dashOffset = 0;

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 100 100" aria-hidden="true">
            {total === 1 && data.length === 0 ? (
              <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
            ) : (
              slices.map((s, i) => {
                const d = s.angle / 360 * circ;
                const offset = -dashOffset;
                dashOffset += d;
                return (
                  <circle
                    key={i}
                    cx="50" cy="50" r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="12"
                    strokeDasharray={`${d} ${circ}`}
                    strokeDashoffset={offset}
                    strokeLinecap="butt"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                );
              })
            )}
            <text x="50" y="46" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '16px', fontWeight: 800, fill: 'var(--text-primary)' }}>
              {total}
            </text>
            <text x="50" y="60" textAnchor="middle" style={{ fontSize: '8px', fill: 'var(--text-muted)', fontWeight: 500 }}>
              TOTAL
            </text>
          </svg>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} aria-hidden="true" />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</span>
                <span style={{ color: 'var(--text-muted)' }}>({(s.pct * 100).toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Trend Bar Chart
export const TrendChart = ({ trends = [], title, subtitle }) => {
  if (!trends.length) {
    return (
      <div className="card" style={{ height: '100%' }}>
        <div className="card-header">
          <div className="card-title">{title}</div>
        </div>
        <div className="empty-state">
          <div className="empty-state-message">No trend data available yet.</div>
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...trends.map(t => t.total || 0), 5);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          {[
            { label: 'Legitimate', color: '#22c55e' },
            { label: 'Fraudulent', color: '#ef4444' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color, flexShrink: 0 }} aria-hidden="true" />
              {l.label}
            </div>
          ))}
        </div>
      </div>
      <div className="card-body" style={{ paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', overflowX: 'auto', paddingBottom: '4px' }}>
          {trends.map((item, idx) => {
            const totalH = ((item.total || 0) / maxVal) * 100;
            const fraudH = ((item.fraudulent || 0) / maxVal) * 100;
            const legitH = Math.max(totalH - fraudH, 0);

            return (
              <div
                key={idx}
                style={{ flex: '0 0 max(28px, calc(100% / ' + Math.max(trends.length, 1) + '))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                title={`${item._id}: ${item.total} total, ${item.fraudulent} fraud`}
              >
                <div style={{ width: '100%', height: '148px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', borderRadius: '3px', overflow: 'hidden', background: 'var(--surface-muted)' }}>
                  <div style={{ width: '100%', height: `${fraudH}%`, background: '#ef4444', transition: 'height 0.5s' }} />
                  <div style={{ width: '100%', height: `${legitH}%`, background: '#22c55e', transition: 'height 0.5s' }} />
                </div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', transform: 'rotate(-45deg)', transformOrigin: 'center', whiteSpace: 'nowrap', display: 'block', width: '24px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item._id ? item._id.slice(5) : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Horizontal Bar Breakdown
export const HorizontalBarChart = ({ data = [], title, subtitle }) => {
  const maxTotal = Math.max(...data.map(d => d.total || 0), 1);

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No data available</div>
        ) : (
          data.map((item, idx) => {
            const totalPct = (item.total / maxTotal) * 100;
            const highPct = item.highRisk ? (item.highRisk / maxTotal) * 100 : 0;

            return (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12.5px' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item._id || 'Unknown'}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                    {item.total} txns {item.highRisk > 0 && <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>({item.highRisk} high risk)</span>}
                  </span>
                </div>
                <div className="progress-bar-wrapper" style={{ height: '7px' }}>
                  <div style={{ display: 'flex', height: '100%', width: `${totalPct}%` }}>
                    {highPct > 0 && (
                      <div style={{ width: `${(highPct / totalPct) * 100}%`, background: 'var(--danger)', borderRadius: 'var(--radius-full) 0 0 var(--radius-full)', transition: 'width 0.5s' }} />
                    )}
                    <div style={{ flex: 1, background: 'var(--primary)', borderRadius: highPct > 0 ? '0 var(--radius-full) var(--radius-full) 0' : 'var(--radius-full)', transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
