import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Search, ArrowLeft, CheckCircle2, AlertTriangle, ShieldAlert,
  FileText, AlertCircle, Clock, Zap, Eye
} from 'lucide-react';

const INVESTIGATION_STEPS = [
  'Place a temporary hold on this transaction pending further review.',
  'Request additional identity verification from the account holder via registered contact.',
  'Cross-reference with recent transactions from this account for patterns.',
  'Notify the compliance team if fraud is confirmed and escalate per policy.',
  'Document investigation notes and update the case status accordingly.',
];

const InvestigationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [markingReviewed, setMarkingReviewed] = useState(false);

  const [recentAlerts, setRecentAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(!id);

  useEffect(() => {
    if (id) {
      const fetchTxn = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/transactions/${id}`);
          setTxn(res.data.transaction || res.data);
        } catch (e) {
          setError(e.response?.status === 404 ? 'Transaction not found.' : 'Failed to load transaction details.');
        } finally { setLoading(false); }
      };
      fetchTxn();
    } else {
      const fetchAlerts = async () => {
        try {
          const res = await api.get('/alerts?reviewed=false');
          setRecentAlerts(res.data.alerts || []);
        } catch { setRecentAlerts([]); }
        finally { setAlertsLoading(false); }
      };
      fetchAlerts();
    }
  }, [id]);

  const handleMarkReviewed = async () => {
    if (!txn) return;
    try {
      setMarkingReviewed(true);
      await api.patch(`/alerts/${txn._id}/review`, { reviewed: true });
      setTxn(prev => ({ ...prev, reviewed: true }));
      toast.success('Case Closed', 'Transaction marked as reviewed successfully.');
    } catch {
      toast.error('Failed', 'Could not update review status. Try again.');
    } finally { setMarkingReviewed(false); }
  };

  const riskCls = (level) => level === 'HIGH' ? 'badge-high' : level === 'MEDIUM' ? 'badge-medium' : 'badge-low';

  // === LIST MODE ===
  if (!id) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h2 className="page-title">Investigation Center</h2>
            <p className="page-description">Open cases requiring analyst review and investigation. Each entry is a high or medium risk transaction awaiting review.</p>
          </div>
        </div>

        {alertsLoading ? (
          <div className="page-loader">
            <div className="spinner spinner-lg" />
            <div className="page-loader-text">Loading open cases…</div>
          </div>
        ) : recentAlerts.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <CheckCircle2 size={44} style={{ color: 'var(--success-text)', opacity: 0.9, marginBottom: '14px' }} />
              <div className="empty-state-title">No Open Cases</div>
              <div className="empty-state-message">All fraud alerts have been reviewed. No pending investigations at this time.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {recentAlerts.length} open case{recentAlerts.length !== 1 ? 's' : ''} awaiting review
            </div>
            {recentAlerts.map(alert => (
              <div key={alert._id} className="card" style={{ transition: 'border-color var(--t-fast)' }}>
                <div style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                    background: alert.riskLevel === 'HIGH' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {alert.riskLevel === 'HIGH'
                      ? <ShieldAlert size={18} style={{ color: 'var(--danger-text)' }} />
                      : <AlertTriangle size={18} style={{ color: 'var(--warning-text)' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      ${Number(alert.amount).toLocaleString()} — {alert.transactionType}
                      <span className={`badge ${riskCls(alert.riskLevel)}`}>{alert.riskLevel}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {alert.paymentMethod} · {alert.location} · Score: <strong style={{ color: alert.riskLevel === 'HIGH' ? 'var(--danger-text)' : 'var(--warning-text)' }}>{Number(alert.fraudProbability).toFixed(1)}%</strong>
                      · {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Link to={`/investigate/${alert._id}`} className="btn btn-primary btn-sm">
                    <Eye size={13} /> Investigate
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // === DETAIL MODE ===
  if (loading) return (
    <div className="page-loader">
      <div className="spinner spinner-lg" />
      <div className="page-loader-text">Loading investigation…</div>
    </div>
  );

  if (error) return (
    <div className="error-state">
      <AlertCircle size={44} className="error-state-icon" />
      <div className="error-state-title">Error</div>
      <div className="error-state-message">{error}</div>
      <Link to="/investigate" className="btn btn-primary btn-sm"><ArrowLeft size={13} /> Back to Cases</Link>
    </div>
  );

  if (!txn) return null;

  const prob = Number(txn.fraudProbability ?? 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/investigate" className="btn btn-secondary btn-sm btn-icon"><ArrowLeft size={15} /></Link>
            <div>
              <h2 className="page-title" style={{ fontSize: '17px' }}>Investigation: {txn.transactionId}</h2>
              <p className="page-description">AI-assisted investigation report — analyst review and decision required.</p>
            </div>
          </div>
          {txn.reviewed ? (
            <span className="badge badge-neutral badge-lg"><CheckCircle2 size={12} /> Reviewed</span>
          ) : (
            <button className="btn btn-accent btn-sm" onClick={handleMarkReviewed} disabled={markingReviewed}>
              {markingReviewed ? <><span className="btn-spinner" />Saving…</> : <><CheckCircle2 size={13} />Mark Reviewed</>}
            </button>
          )}
        </div>
      </div>

      {/* Risk Banner */}
      <div style={{
        background: txn.riskLevel === 'HIGH' ? 'var(--danger-bg)' : 'var(--warning-bg)',
        border: `1px solid ${txn.riskLevel === 'HIGH' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
        borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: '16px',
        display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Risk Level', content: <span className={`badge ${riskCls(txn.riskLevel)} badge-lg`}>{txn.riskLevel}</span> },
          { label: 'Fraud Score', content: <span style={{ fontSize: '28px', fontWeight: 800, color: txn.riskLevel === 'HIGH' ? 'var(--danger-text)' : 'var(--warning-text)' }}>{prob.toFixed(1)}%</span> },
          { label: 'Amount', content: <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>${Number(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
          { label: 'Prediction', content: <span className={`badge ${riskCls(txn.riskLevel)} badge-lg`}>{txn.prediction}</span> },
        ].map(({ label, content }) => (
          <div key={label}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
            {content}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Evidence */}
        <div className="card">
          <div className="card-header"><div className="card-title"><ShieldAlert size={14} /> AI-Identified Risk Factors</div></div>
          <div className="card-body">
            {txn.riskFactors?.length > 0 ? (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
                {txn.riskFactors.map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', flexShrink: 0, marginTop: '6px' }} />
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>No specific risk factors recorded for this transaction.</div>
            )}
            <div className="alert alert-info" style={{ marginTop: '12px', fontSize: '11px' }}>
              <span>ℹ</span> These are AI-generated signals, not confirmed evidence of fraud. Human review required.
            </div>
          </div>
        </div>

        {/* Investigation Steps */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Zap size={14} /> Recommended Investigation Steps</div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AI-suggested — not conclusions</span>
          </div>
          <div className="card-body">
            {INVESTIGATION_STEPS.map((step, i) => (
              <div key={i} style={{ fontSize: '12.5px', color: 'var(--text-secondary)', padding: '6px 0', borderBottom: i < INVESTIGATION_STEPS.length - 1 ? '1px solid var(--border)' : 'none', lineHeight: 1.5, display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--text-dim)', flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="card">
          <div className="card-header"><div className="card-title"><Clock size={14} /> Transaction Details</div></div>
          <div className="card-body">
            {[
              { k: 'Transaction ID', v: txn.transactionId },
              { k: 'Date / Time', v: new Date(txn.createdAt).toLocaleString() },
              { k: 'Type', v: txn.transactionType },
              { k: 'Payment Method', v: txn.paymentMethod },
              { k: 'Device Type', v: txn.deviceType },
              { k: 'Location', v: txn.location },
              { k: 'IP Address', v: txn.ipAddress || '—' },
              { k: 'Account Age', v: `${txn.accountAge} days` },
              { k: 'Transaction Frequency', v: `${txn.transactionFrequency} / month` },
              { k: 'Failed Attempts', v: txn.failedAttempts ?? 0 },
              { k: 'Fraud History', v: txn.previousFraudHistory === 1 ? 'Yes — prior incident' : 'No' },
            ].map(({ k, v }) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '12.5px', gap: '12px' }}>
                <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{k}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-header"><div className="card-title"><FileText size={14} /> Analyst Notes</div></div>
          <div className="card-body">
            <textarea
              className="notes-textarea"
              placeholder="Add your investigation notes here. These are session-only — they are not persisted to the database in this demo."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={7}
            />
            {txn.recommendedAction && (
              <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
                  ML System Recommendation
                </span>
                {txn.recommendedAction}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestigationPage;
