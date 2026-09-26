import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft, Trash2, ShieldAlert, DollarSign, Smartphone,
  MapPin, CreditCard, Clock, AlertCircle, ExternalLink,
  Activity, Info
} from 'lucide-react';

const DetailRow = ({ label, value, mono }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: '16px' }}>
    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0, minWidth: '160px' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', fontFamily: mono ? 'Consolas, monospace' : undefined }}>
      {value ?? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
    </span>
  </div>
);

const TransactionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [txn, setTxn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/transactions/${id}`);
        setTxn(res.data.transaction || res.data);
      } catch (err) {
        setError(err.response?.status === 404 ? 'Transaction not found.' : 'Failed to load transaction details.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this transaction? This cannot be undone.')) return;
    try {
      setDeleting(true);
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted', 'Transaction record removed.');
      navigate('/transactions');
    } catch {
      toast.error('Delete Failed', 'Could not delete this transaction.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" aria-hidden="true" />
        <div className="page-loader-text">Loading transaction details…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <AlertCircle size={48} className="error-state-icon" />
        <div className="error-state-title">Error Loading Transaction</div>
        <div className="error-state-message">{error}</div>
        <Link to="/transactions" className="btn btn-primary btn-sm">
          <ArrowLeft size={14} /> Back to Transactions
        </Link>
      </div>
    );
  }

  if (!txn) return null;

  const prob = Number(txn.fraudProbability ?? 0);
  const isHigh = txn.riskLevel === 'HIGH';
  const isMed = txn.riskLevel === 'MEDIUM';

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/transactions" className="btn btn-secondary btn-sm btn-icon" aria-label="Back to transactions">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h2 className="page-title" style={{ fontSize: '18px' }}>Transaction Details</h2>
              <p className="page-description">
                ID: <code style={{ fontFamily: 'Consolas, monospace', fontSize: '12px', background: 'var(--surface-muted)', padding: '1px 6px', borderRadius: '4px' }}>
                  {txn._id}
                </code>
              </p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-danger btn-sm"
            aria-label="Delete transaction"
          >
            {deleting ? <><span className="btn-spinner" />Deleting…</> : <><Trash2 size={13} />Delete Record</>}
          </button>
        </div>
      </div>

      {/* Risk Banner */}
      <div
        className="panel mb-4"
        style={{
          borderColor: isHigh ? 'var(--danger-border)' : isMed ? 'var(--warning-border)' : 'var(--success-border)',
          background: isHigh ? 'var(--danger-bg)' : isMed ? 'var(--warning-bg)' : 'var(--success-bg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Analysis Result
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {txn.prediction || 'Unknown'}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '2px' }}>Fraud Score</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: isHigh ? 'var(--danger)' : isMed ? 'var(--warning)' : 'var(--success)', letterSpacing: '-0.03em' }}>
              {prob.toFixed(1)}%
            </div>
          </div>

          <div>
            <RiskBadge level={txn.riskLevel} size="lg" />
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '2px' }}>Amount</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              ${Number(txn.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Transaction Info */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <DollarSign size={15} aria-hidden="true" /> Transaction Info
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: '4px' }}>
            <DetailRow label="Transaction ID" value={txn._id} mono />
            <DetailRow label="Amount" value={`$${Number(txn.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
            <DetailRow label="Type" value={txn.transactionType} />
            <DetailRow label="Payment Method" value={txn.paymentMethod} />
            <DetailRow label="Average Amount" value={txn.averageTransactionAmount != null ? `$${Number(txn.averageTransactionAmount).toLocaleString()}` : null} />
            <DetailRow label="Date Analyzed" value={new Date(txn.createdAt).toLocaleString()} />
          </div>
        </div>

        {/* Device & Location */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Smartphone size={15} aria-hidden="true" /> Device & Location
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: '4px' }}>
            <DetailRow label="Device Type" value={txn.deviceType} />
            <DetailRow label="Location" value={txn.location} />
            <DetailRow label="IP Address" value={txn.ipAddress} mono />
            <DetailRow label="Account Age" value={txn.accountAge != null ? `${txn.accountAge} days` : null} />
            <DetailRow label="Transaction Frequency" value={txn.transactionFrequency != null ? `${txn.transactionFrequency} / 24h` : null} />
            <DetailRow label="Failed Attempts" value={txn.failedAttempts ?? '0'} />
          </div>
        </div>

        {/* ML Analysis */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Activity size={15} aria-hidden="true" /> ML Analysis
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: '4px' }}>
            <DetailRow label="Prediction" value={txn.prediction} />
            <DetailRow label="Risk Level" value={txn.riskLevel} />
            <DetailRow label="Fraud Probability" value={`${prob.toFixed(2)}%`} />
            <DetailRow label="Previous Fraud History" value={txn.previousFraudHistory === 1 ? 'Yes' : 'No'} />
          </div>
        </div>

        {/* Risk Factors */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Info size={15} aria-hidden="true" /> Risk Factors
            </div>
          </div>
          <div className="card-body">
            {txn.riskFactors && txn.riskFactors.length > 0 ? (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {txn.riskFactors.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isHigh ? 'var(--danger)' : isMed ? 'var(--warning)' : 'var(--success)', flexShrink: 0, marginTop: '6px' }} aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No specific anomalies identified.
              </div>
            )}

            {txn.recommendedAction && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Recommended Action
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  {txn.recommendedAction}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailPage;
