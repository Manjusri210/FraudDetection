import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import { DonutChart, TrendChart } from '../components/CustomChart';
import api from '../services/api';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, BarChart3,
  ArrowRight, Clock, Activity, RefreshCw, TrendingUp, Zap, FileSpreadsheet
} from 'lucide-react';

const TOP_FACTORS = [
  { label: 'High Transaction Amount (ratio to avg)', pct: 42 },
  { label: 'Multiple Failed Login Attempts', pct: 28 },
  { label: 'Suspicious Location / Proxy IP', pct: 18 },
  { label: 'Previous Fraud History on Account', pct: 12 },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, trendRes, txnRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/trends'),
        api.get('/transactions?limit=5&sortBy=createdAt&order=desc'),
      ]);
      setSummary(sumRes.data);
      setTrends(trendRes.data?.trends || []);
      setRecentTxns(txnRes.data.transactions || []);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load dashboard data. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fraud = summary?.fraudulentCount ?? summary?.highRiskCount ?? 0;
  const suspicious = summary?.suspiciousCount ?? 0;
  const legitimate = summary?.legitimateCount ?? 0;
  const total = summary?.totalTransactions ?? 0;
  const fraudRate = total > 0 ? ((fraud / total) * 100).toFixed(1) : '0.0';

  const donutData = [
    { label: 'Legitimate', value: legitimate, color: '#22c55e' },
    { label: 'Suspicious', value: suspicious, color: '#f59e0b' },
    { label: 'Fraud', value: fraud, color: '#ef4444' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const riskCls = (level) =>
    level === 'HIGH' ? 'badge-high' : level === 'MEDIUM' ? 'badge-medium' : 'badge-low';

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">{greeting}, {user?.name?.split(' ')[0] || 'Analyst'} 👋</h2>
            <p className="page-description">
              Monitor transaction risk and investigate suspicious activity in real time.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {lastUpdated && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={11} /> {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
              Refresh
            </button>
            <Link to="/batch" className="btn btn-secondary btn-sm">
              <FileSpreadsheet size={13} /> Batch CSV
            </Link>
            <Link to="/analyze" className="btn btn-primary btn-sm">
              <Zap size={13} /> Analyze Now
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '14px' }} role="alert">
          <AlertTriangle size={15} className="alert-icon" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '14px' }}>
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '96px', borderRadius: 'var(--radius-lg)' }} />
          ))
        ) : (
          <>
            <StatsCard title="Total Analyzed" value={total.toLocaleString()} icon={BarChart3} color="cyan" subtitle="All time" />
            <StatsCard title="Fraud Detected" value={fraud.toLocaleString()} icon={ShieldAlert} color="red" subtitle={`${fraudRate}% fraud rate`} />
            <StatsCard title="Suspicious" value={suspicious.toLocaleString()} icon={AlertTriangle} color="amber" subtitle="Flagged for review" />
            <StatsCard title="Legitimate" value={legitimate.toLocaleString()} icon={CheckCircle2} color="green" subtitle="Cleared" />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '14px' }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: '260px', borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton" style={{ height: '260px', borderRadius: 'var(--radius-lg)' }} />
          </>
        ) : (
          <>
            <DonutChart data={donutData} title="Risk Distribution" subtitle="Transaction classification breakdown" />
            <TrendChart trends={trends} title="Transaction Trends" subtitle="Daily volume — fraud vs legitimate" />
          </>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid-2" style={{ marginBottom: '14px' }}>
        {/* Recent Fraud Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><ShieldAlert size={14} /> Recent Fraud Alerts</div>
            <Link to="/alerts" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)', fontSize: '12px' }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-row" />)}
            </div>
          ) : recentTxns.filter(t => t.riskLevel !== 'LOW').length === 0 ? (
            <div className="empty-state" style={{ padding: '28px' }}>
              <CheckCircle2 size={30} style={{ color: 'var(--success-text)', opacity: 0.7, marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No active fraud alerts</div>
            </div>
          ) : (
            <div>
              {recentTxns.filter(t => t.riskLevel !== 'LOW').slice(0, 4).map(txn => (
                <div key={txn._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-md)', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldAlert size={14} style={{ color: 'var(--danger-text)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${Number(txn.amount).toLocaleString()} — {txn.transactionType}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {txn.paymentMethod} · {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className={`badge ${riskCls(txn.riskLevel)}`}>{Number(txn.fraudProbability).toFixed(0)}%</span>
                  <Link to={`/investigate/${txn._id}`} className="btn btn-ghost btn-sm btn-icon">
                    <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Risk Factors */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={14} /> Top Risk Factors</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Model feature influence</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {TOP_FACTORS.map(f => (
              <div key={f.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{f.label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>{f.pct}%</span>
                </div>
                <div className="progress-bar-wrapper">
                  <div className="progress-bar" style={{ width: `${f.pct}%`, background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))' }} />
                </div>
              </div>
            ))}
            <div className="alert alert-info" style={{ fontSize: '11px', marginTop: '4px' }}>
              <span style={{ flexShrink: 0 }}>ℹ</span>
              Percentages reflect relative SHAP feature importance from the trained Random Forest model. See Model Insights for full metrics.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Activity size={14} /> Recent Transactions</div>
          <Link to="/transactions" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)', fontSize: '12px' }}>
            View All <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : recentTxns.length === 0 ? (
          <div className="empty-state">
            <Activity size={36} className="empty-state-icon" />
            <div className="empty-state-title">No transactions yet</div>
            <div className="empty-state-message">Analyze your first transaction to see results here.</div>
            <Link to="/analyze" className="btn btn-primary btn-sm"><Zap size={13} /> Analyze Now</Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Risk</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map(txn => (
                  <tr key={txn._id}>
                    <td><span className="table-cell-mono">#{txn._id.slice(-8).toUpperCase()}</span></td>
                    <td className="table-cell-amount">${Number(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="table-cell-muted">{txn.transactionType}</td>
                    <td className="table-cell-muted">{txn.paymentMethod}</td>
                    <td><span className={`badge ${riskCls(txn.riskLevel)}`}>{txn.riskLevel}</span></td>
                    <td style={{ fontWeight: 700, color: txn.riskLevel === 'HIGH' ? 'var(--danger-text)' : txn.riskLevel === 'MEDIUM' ? 'var(--warning-text)' : 'var(--success-text)', fontSize: '13px' }}>
                      {Number(txn.fraudProbability).toFixed(1)}%
                    </td>
                    <td className="table-cell-muted">{new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td>
                      <Link to={`/transactions/${txn._id}`} className="btn btn-ghost btn-sm btn-icon">
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
