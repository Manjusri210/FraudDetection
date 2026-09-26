import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatsCard from '../components/StatsCard';
import { DonutChart, TrendChart } from '../components/CustomChart';
import api from '../services/api';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, BarChart3,
  ArrowRight, Clock, TrendingUp, Activity, RefreshCw
} from 'lucide-react';

const SkeletonStat = () => (
  <div className="stat-card">
    <div className="skeleton skeleton-stat" style={{ marginBottom: '12px', height: '14px', width: '60%' }} />
    <div className="skeleton skeleton-stat" style={{ height: '36px', width: '80%' }} />
  </div>
);

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
      setError(null);
      const [summaryRes, trendsRes, txnRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/trends?days=14'),
        api.get('/transactions?limit=5&sortBy=createdAt&order=desc'),
      ]);
      setSummary(summaryRes.data);
      setTrends(trendsRes.data || []);
      setRecentTxns(txnRes.data.transactions || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const donutData = summary ? [
    { label: 'Legitimate', value: summary.legitimate || 0, color: '#22c55e' },
    { label: 'Suspicious', value: summary.suspicious || 0, color: '#f59e0b' },
    { label: 'Fraudulent', value: summary.fraud || 0, color: '#ef4444' },
  ] : [];

  const riskClass = (level) => {
    if (!level) return 'badge badge-neutral';
    return level === 'HIGH' ? 'badge badge-high' : level === 'MEDIUM' ? 'badge badge-medium' : 'badge badge-low';
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">{greeting}, {user?.name?.split(' ')[0] || 'Analyst'} 👋</h2>
            <p className="page-description">Here's your fraud intelligence overview for today.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {lastUpdated && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading} aria-label="Refresh dashboard">
              <RefreshCw size={14} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
            </button>
            <Link to="/analyze" className="btn btn-primary btn-sm">
              <Activity size={14} /> Analyze Transaction
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <AlertTriangle size={16} className="alert-icon" />
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid-4 mb-6">
        {loading ? (
          [1, 2, 3, 4].map(i => <SkeletonStat key={i} />)
        ) : (
          <>
            <StatsCard
              title="Total Transactions"
              value={summary?.totalTransactions ?? '—'}
              icon={BarChart3}
              color="blue"
              subtitle="All analyzed transactions"
            />
            <StatsCard
              title="Fraud Detected"
              value={summary?.fraud ?? '—'}
              icon={ShieldAlert}
              color="red"
              subtitle={`${summary ? ((summary.fraud / Math.max(summary.totalTransactions, 1)) * 100).toFixed(1) : '0'}% fraud rate`}
            />
            <StatsCard
              title="Suspicious"
              value={summary?.suspicious ?? '—'}
              icon={AlertTriangle}
              color="amber"
              subtitle="Flagged for review"
            />
            <StatsCard
              title="Legitimate"
              value={summary?.legitimate ?? '—'}
              icon={CheckCircle2}
              color="green"
              subtitle="Clean transactions"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid-2 mb-6">
        {loading ? (
          <>
            <div className="skeleton skeleton-card" style={{ height: '280px' }} />
            <div className="skeleton skeleton-card" style={{ height: '280px' }} />
          </>
        ) : (
          <>
            <DonutChart
              data={donutData}
              title="Risk Distribution"
              subtitle="Transaction classification breakdown"
            />
            <TrendChart
              trends={trends}
              title="Transaction Trends"
              subtitle="Last 14 days — legitimate vs fraudulent"
            />
          </>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Transactions</div>
            <div className="card-subtitle">Latest 5 analyzed transactions</div>
          </div>
          <Link to="/transactions" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-row" />)}
          </div>
        ) : recentTxns.length === 0 ? (
          <div className="empty-state">
            <Activity size={40} className="empty-state-icon" />
            <div className="empty-state-title">No transactions yet</div>
            <div className="empty-state-message">Start by analyzing your first transaction.</div>
            <Link to="/analyze" className="btn btn-primary btn-sm">Analyze Now</Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: '0', border: 'none', boxShadow: 'none' }}>
            <table className="data-table" aria-label="Recent transactions">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Risk Level</th>
                  <th>Result</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map(txn => (
                  <tr key={txn._id}>
                    <td>
                      <span className="table-cell-mono">#{txn._id.slice(-8).toUpperCase()}</span>
                    </td>
                    <td className="table-cell-amount">\${Number(txn.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="table-cell-muted">{txn.transactionType || txn.transaction_type || '—'}</td>
                    <td>
                      <span className={riskClass(txn.riskLevel)}>
                        {txn.riskLevel || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={txn.prediction === 'FRAUD' ? 'badge badge-fraud' : txn.prediction === 'SUSPICIOUS' ? 'badge badge-suspicious' : 'badge badge-legitimate'}>
                        {txn.prediction || '—'}
                      </span>
                    </td>
                    <td className="table-cell-muted">
                      {new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td>
                      <Link to={`/transactions/${txn._id}`} className="btn btn-ghost btn-sm" aria-label="View transaction details">
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
