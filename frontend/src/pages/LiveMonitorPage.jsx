import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, Pause, Play, Trash2, Info } from 'lucide-react';

const LOCATIONS = ['New York, USA', 'London, UK', 'Mumbai, India', 'Singapore', 'Chicago, USA', 'Dubai, UAE', 'Unknown/Proxy'];
const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'];
const TX_TYPES = ['Purchase', 'Transfer', 'Payment', 'Withdrawal'];
const DEVICES = ['Mobile', 'Desktop', 'Tablet'];

let txCounter = 1000;

const generateTransaction = () => {
  const rand = Math.random();
  let riskLevel, fraudProb, prediction;
  if (rand < 0.10) {
    riskLevel = 'HIGH'; fraudProb = 70 + Math.random() * 28; prediction = 'FRAUD';
  } else if (rand < 0.25) {
    riskLevel = 'MEDIUM'; fraudProb = 35 + Math.random() * 28; prediction = 'SUSPICIOUS';
  } else {
    riskLevel = 'LOW'; fraudProb = 5 + Math.random() * 28; prediction = 'LEGITIMATE';
  }
  const avgAmount = 100 + Math.random() * 1000;
  const mult = riskLevel === 'HIGH' ? 8 + Math.random() * 20 : 0.5 + Math.random() * 2;
  const amount = Math.round(avgAmount * mult);
  txCounter++;
  return {
    id: `TXN-${Date.now()}-${txCounter}`,
    amount,
    paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
    transactionType: TX_TYPES[Math.floor(Math.random() * TX_TYPES.length)],
    location: riskLevel === 'HIGH' ? 'Unknown/Proxy' : LOCATIONS[Math.floor(Math.random() * (LOCATIONS.length - 1))],
    device: DEVICES[Math.floor(Math.random() * DEVICES.length)],
    riskLevel,
    fraudProb: Math.round(fraudProb * 10) / 10,
    prediction,
    time: new Date(),
  };
};

const LiveMonitorPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ total: 0, fraud: 0, suspicious: 0, legitimate: 0 });
  const [lastAlert, setLastAlert] = useState(null);
  const intervalRef = useRef(null);

  const addTransaction = () => {
    const tx = generateTransaction();
    setTransactions(prev => [tx, ...prev].slice(0, 60));
    setStats(prev => ({
      total: prev.total + 1,
      fraud: prev.fraud + (tx.riskLevel === 'HIGH' ? 1 : 0),
      suspicious: prev.suspicious + (tx.riskLevel === 'MEDIUM' ? 1 : 0),
      legitimate: prev.legitimate + (tx.riskLevel === 'LOW' ? 1 : 0),
    }));
    if (tx.riskLevel === 'HIGH') setLastAlert(tx);
  };

  useEffect(() => {
    if (running) {
      addTransaction();
      intervalRef.current = setInterval(addTransaction, 2500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (lastAlert) {
      const t = setTimeout(() => setLastAlert(null), 4500);
      return () => clearTimeout(t);
    }
  }, [lastAlert]);

  const riskCls = (level) => level === 'HIGH' ? 'badge-high' : level === 'MEDIUM' ? 'badge-medium' : 'badge-low';
  const riskColor = (level) => level === 'HIGH' ? 'var(--danger-text)' : level === 'MEDIUM' ? 'var(--warning-text)' : 'var(--success-text)';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">Live Transaction Monitor</h2>
            <p className="page-description">Real-time transaction stream with automatic fraud detection alerts.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge badge-demo">⚡ DEMO MODE — Simulated Stream</span>
            <button className="btn btn-secondary btn-sm" onClick={() => { setTransactions([]); setStats({ total: 0, fraud: 0, suspicious: 0, legitimate: 0 }); }}>
              <Trash2 size={13} /> Clear
            </button>
            <button
              className={running ? 'btn btn-danger btn-sm' : 'btn btn-accent btn-sm'}
              onClick={() => setRunning(v => !v)}
            >
              {running ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
            </button>
          </div>
        </div>
      </div>

      {/* High-Risk Alert Banner */}
      {lastAlert && (
        <div className="high-risk-flash animate-fade-in-down" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert size={20} style={{ color: 'var(--danger-text)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger-text)' }}>🚨 HIGH-RISK TRANSACTION DETECTED</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {lastAlert.id.slice(-14)} — ${lastAlert.amount.toLocaleString()} via {lastAlert.paymentMethod} from {lastAlert.location}
                {' '}— Risk Score: <strong>{lastAlert.fraudProb}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '16px' }}>
        {[
          { label: 'Total Monitored', value: stats.total, color: 'cyan', Icon: Activity },
          { label: 'Fraud Flagged', value: stats.fraud, color: 'red', Icon: ShieldAlert },
          { label: 'Suspicious', value: stats.suspicious, color: 'amber', Icon: AlertTriangle },
          { label: 'Legitimate', value: stats.legitimate, color: 'green', Icon: CheckCircle2 },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-value">{s.value}</div>
              </div>
              <div className={`stat-card-icon stat-icon-${s.color}`}><s.Icon size={18} /></div>
            </div>
            <div className="stat-card-footer">
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: running ? 'var(--success-text)' : 'var(--text-muted)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: running ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block' }} />
                {running ? 'Live monitoring' : 'Paused'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stream */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Activity size={14} /> Transaction Stream</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {running && (
              <span style={{ fontSize: '11px', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse-green 1.5s ease-in-out infinite', display: 'inline-block' }} />
                LIVE
              </span>
            )}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last {transactions.length} transactions</span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <Activity size={36} className="empty-state-icon" />
            <div className="empty-state-title">Stream Starting…</div>
            <div className="empty-state-message">Demo transactions will appear here in real time.</div>
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Location</th>
                  <th>Risk</th>
                  <th>Score</th>
                  <th>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => (
                  <tr key={tx.id} className={i === 0 ? 'animate-fade-in-down' : ''}
                    style={tx.riskLevel === 'HIGH' ? { background: 'rgba(239,68,68,0.04)' } : undefined}>
                    <td className="table-cell-muted" style={{ fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                      {tx.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td><span className="table-cell-mono">{tx.id.slice(-12)}</span></td>
                    <td className="table-cell-amount">${tx.amount.toLocaleString()}</td>
                    <td className="table-cell-muted">{tx.paymentMethod}</td>
                    <td className="table-cell-muted" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.location}</td>
                    <td><span className={`badge ${riskCls(tx.riskLevel)}`}>{tx.riskLevel}</span></td>
                    <td style={{ fontWeight: 700, color: riskColor(tx.riskLevel), fontVariantNumeric: 'tabular-nums' }}>
                      {tx.fraudProb}%
                    </td>
                    <td><span className={`badge ${riskCls(tx.riskLevel)} badge-sm`}>{tx.prediction}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="alert alert-info" style={{ marginTop: '12px', fontSize: '11.5px' }}>
        <Info size={14} className="alert-icon" />
        <span>This is a <strong>frontend-only demo simulation</strong>. Transactions shown are algorithmically generated and do not represent real banking activity. Use the <strong>Analyze Transaction</strong> page to run real ML predictions.</span>
      </div>
    </div>
  );
};

export default LiveMonitorPage;
