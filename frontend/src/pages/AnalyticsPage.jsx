import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { DonutChart, TrendChart, HorizontalBarChart } from '../components/CustomChart';
import StatsCard from '../components/StatsCard';
import {
  BarChart3, TrendingUp, AlertTriangle, ShieldAlert,
  CheckCircle2, RefreshCw, AlertCircle
} from 'lucide-react';

const AnalyticsPage = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumRes, trendRes, distRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get(`/analytics/trends?days=${days}`),
        api.get('/analytics/risk-distribution'),
      ]);
      setSummary(sumRes.data);
      setTrends(trendRes.data || []);
      setDistribution(distRes.data || {});
    } catch {
      setError('Failed to load analytics data. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [days]);

  const donutData = summary ? [
    { label: 'Legitimate', value: summary.legitimate || 0, color: '#22c55e' },
    { label: 'Suspicious', value: summary.suspicious || 0, color: '#f59e0b' },
    { label: 'Fraudulent', value: summary.fraud || 0, color: '#ef4444' },
  ] : [];

  const deviceData = (distribution.byDevice || []).map(d => ({
    _id: d._id,
    total: d.total,
    highRisk: d.highRisk || 0,
  }));

  const locationData = (distribution.byLocation || []).slice(0, 7).map(d => ({
    _id: d._id,
    total: d.total,
    highRisk: d.highRisk || 0,
  }));

  const paymentData = (distribution.byPaymentMethod || []).map(d => ({
    _id: d._id,
    total: d.total,
    highRisk: d.highRisk || 0,
  }));

  const fraudRate = summary ? ((summary.fraud / Math.max(summary.totalTransactions, 1)) * 100) : 0;
  const avgProb = summary?.avgFraudProbability ?? 0;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">Analytics</h2>
            <p className="page-description">Transaction patterns, fraud trends, and risk distribution analysis.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Time Range Selector */}
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {[7, 14, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 0, borderRight: '1px solid var(--border)', height: '32px', minWidth: '42px' }}
                  aria-pressed={days === d}
                >
                  {d}d
                </button>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading} aria-label="Refresh analytics">
              <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <AlertCircle size={16} className="alert-icon" />
          {error}
          <button onClick={fetchData} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid-4 mb-6">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ height: '14px', width: '70%', marginBottom: '10px' }} />
              <div className="skeleton" style={{ height: '36px', width: '60%' }} />
            </div>
          ))
        ) : (
          <>
            <StatsCard title="Total Analyzed" value={summary?.totalTransactions?.toLocaleString() ?? '—'} icon={BarChart3} color="blue" subtitle="All transactions evaluated" />
            <StatsCard title="Fraud Rate" value={`${fraudRate.toFixed(1)}%`} icon={ShieldAlert} color="red" subtitle={`${summary?.fraud || 0} fraudulent detected`} />
            <StatsCard title="Avg Fraud Score" value={`${Number(avgProb).toFixed(1)}%`} icon={TrendingUp} color="amber" subtitle="Mean probability across all" />
            <StatsCard title="Legitimate Rate" value={`${(100 - fraudRate).toFixed(1)}%`} icon={CheckCircle2} color="green" subtitle={`${summary?.legitimate || 0} cleared transactions`} />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2 mb-4">
        {loading ? (
          <>
            <div className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius-lg)' }} />
            <div className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius-lg)' }} />
          </>
        ) : (
          <>
            <DonutChart data={donutData} title="Risk Distribution" subtitle="Classification breakdown of all transactions" />
            <TrendChart trends={trends} title={`${days}-Day Transaction Trends`} subtitle="Daily volume: legitimate vs. fraudulent" />
          </>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid-3">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius-lg)' }} />)
        ) : (
          <>
            <HorizontalBarChart data={deviceData} title="Risk by Device Type" subtitle="Transaction volume and high-risk ratio" />
            <HorizontalBarChart data={paymentData} title="Risk by Payment Method" subtitle="Method-level fraud analysis" />
            <HorizontalBarChart data={locationData} title="Risk by Location" subtitle="Geographic fraud signal distribution" />
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
