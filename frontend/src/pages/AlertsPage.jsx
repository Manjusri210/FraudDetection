import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { useToast } from '../context/ToastContext';
import {
  Bell, AlertTriangle, CheckCircle2, RefreshCw, ArrowRight,
  ShieldAlert, Filter, AlertCircle, X, Clock, Eye
} from 'lucide-react';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const toast = useToast();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = filterStatus !== '' ? `?reviewed=${filterStatus}` : '';
      const res = await api.get(`/alerts${params}`);
      setAlerts(res.data.alerts || []);
      setUnresolvedCount(res.data.unresolvedCount || 0);
    } catch {
      setError('Failed to load alerts. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleMarkReviewed = async (alertId, currentStatus) => {
    try {
      setReviewingId(alertId);
      await api.patch(`/alerts/${alertId}/review`, { reviewed: !currentStatus });
      toast.success('Updated', `Alert marked as ${!currentStatus ? 'reviewed' : 'unreviewed'}.`);
      fetchAlerts();
    } catch {
      toast.error('Failed', 'Could not update alert status.');
    } finally {
      setReviewingId(null);
    }
  };

  const unresolved = alerts.filter(a => !a.reviewed);
  const resolved = alerts.filter(a => a.reviewed);

  const AlertRow = ({ alert }) => {
    const prob = Number(alert.fraudProbability ?? 0);
    const isHigh = alert.riskLevel === 'HIGH';
    const isReviewed = alert.reviewed;

    return (
      <div
        className="card card-hover"
        style={{
          padding: '0',
          opacity: isReviewed ? 0.75 : 1,
          borderLeft: isHigh ? '3px solid var(--danger)' : '3px solid var(--warning)',
          transition: 'opacity 0.2s',
        }}
      >
        <div style={{ padding: '16px 18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          {/* Icon */}
          <div style={{
            width: '38px', height: '38px', borderRadius: 'var(--radius-md)',
            background: isHigh ? 'var(--danger-bg)' : 'var(--warning-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {isHigh ? <ShieldAlert size={18} style={{ color: 'var(--danger)' }} /> : <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isHigh ? 'Fraud Alert' : 'Suspicious Activity'}
              </span>
              <RiskBadge level={alert.riskLevel} showIcon={false} size="sm" />
              {isReviewed && <span className="badge badge-neutral badge-sm">Reviewed</span>}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.5' }}>
              <strong>${Number(alert.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> {alert.transactionType}
              {' '}via {alert.paymentMethod} — {alert.location || 'Unknown location'} · {alert.deviceType}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {new Date(alert.createdAt).toLocaleString()}
              </span>
              <span>Score: <strong style={{ color: 'var(--danger)' }}>{prob.toFixed(1)}%</strong></span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link
              to={`/transactions/${alert._id}`}
              className="btn btn-ghost btn-sm"
              title="View transaction details"
              aria-label="View details"
            >
              <Eye size={13} /> Details
            </Link>
            <button
              onClick={() => handleMarkReviewed(alert._id, isReviewed)}
              disabled={reviewingId === alert._id}
              className={isReviewed ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
              title={isReviewed ? 'Mark as unreviewed' : 'Mark as reviewed'}
            >
              {reviewingId === alert._id ? (
                <><span className="btn-spinner" />Saving…</>
              ) : isReviewed ? (
                <><X size={13} />Unreview</>
              ) : (
                <><CheckCircle2 size={13} />Mark Reviewed</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">Fraud Alerts</h2>
            <p className="page-description">Security incidents requiring review and resolution.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unresolvedCount > 0 && (
              <span className="badge badge-high" style={{ fontSize: '12px', padding: '3px 10px' }}>
                {unresolvedCount} Unresolved
              </span>
            )}
            <button className="btn btn-secondary btn-sm" onClick={fetchAlerts} disabled={loading} aria-label="Refresh alerts">
              <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Total Alerts', value: alerts.length, color: 'var(--primary)', bg: 'var(--primary-muted)' },
          { label: 'Unresolved', value: unresolved.length, color: 'var(--danger)', bg: 'var(--danger-bg)' },
          { label: 'Reviewed', value: resolved.length, color: 'var(--success)', bg: 'var(--success-bg)' },
          { label: 'High Risk', value: alerts.filter(a => a.riskLevel === 'HIGH').length, color: 'var(--danger)', bg: 'var(--danger-bg)' },
        ].map((s, i) => (
          <div key={i} className="panel" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
        {['', 'false', 'true'].map(val => (
          <button
            key={val}
            onClick={() => { setFilterStatus(val); }}
            className={filterStatus === val ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            aria-pressed={filterStatus === val}
          >
            {val === '' ? 'All Alerts' : val === 'false' ? 'Unresolved' : 'Reviewed'}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <AlertCircle size={16} className="alert-icon" />
          {error}
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Bell size={40} className="empty-state-icon" />
            <div className="empty-state-title">No alerts found</div>
            <div className="empty-state-message">
              {filterStatus ? 'No alerts match the current filter.' : 'No fraud alerts have been generated yet. Alerts appear when transactions are flagged as suspicious or fraudulent.'}
            </div>
            {filterStatus && <button onClick={() => setFilterStatus('')} className="btn btn-secondary btn-sm">Show All Alerts</button>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Unresolved Section */}
          {filterStatus !== 'true' && unresolved.length > 0 && (
            <div>
              {filterStatus === '' && (
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  ● Unresolved ({unresolved.length})
                </div>
              )}
              {unresolved.map(alert => <AlertRow key={alert._id} alert={alert} />)}
            </div>
          )}

          {/* Resolved Section */}
          {filterStatus !== 'false' && resolved.length > 0 && (
            <div style={{ marginTop: filterStatus === '' && unresolved.length > 0 ? '16px' : 0 }}>
              {filterStatus === '' && (
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  ✓ Reviewed ({resolved.length})
                </div>
              )}
              {resolved.map(alert => <AlertRow key={alert._id} alert={alert} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
