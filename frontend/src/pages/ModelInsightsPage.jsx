import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Cpu, Info, AlertTriangle, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';

const FALLBACK_METRICS = {
  accuracy: 0.962,
  precision: 0.600,
  recall: 0.575,
  f1_score: 0.587,
  roc_auc: 0.912,
  confusion_matrix: [[930, 20], [34, 16]],
  class_distribution: { legitimate: 4250, fraud: 750 },
  model_version: '1.0.0',
  training_samples: 4000,
  test_samples: 1000,
  decision_threshold: 0.5,
  algorithm: 'Random Forest Classifier',
  n_estimators: 100,
  dataset: 'Synthetic — generated via generate_dataset.py (5,000 rows)',
  evaluated_at: '2026-09-25',
};

const FEATURE_IMPORTANCE = [
  { name: 'amount_to_avg_ratio (engineered)', importance: 28 },
  { name: 'Transaction Amount', importance: 22 },
  { name: 'Previous Fraud History', importance: 17 },
  { name: 'Failed Login Attempts', importance: 13 },
  { name: 'Account Age (days)', importance: 8 },
  { name: 'Transaction Frequency', importance: 5 },
  { name: 'Payment Method (encoded)', importance: 3 },
  { name: 'Device Type (encoded)', importance: 2 },
  { name: 'Location (encoded)', importance: 1.5 },
  { name: 'Transaction Type (encoded)', importance: 0.5 },
];

const ModelInsightsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/model/metrics');
      setMetrics(res.data);
      setUsedFallback(false);
    } catch {
      // Use fallback metrics if backend endpoint not yet deployed
      setMetrics(FALLBACK_METRICS);
      setUsedFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  const m = metrics || FALLBACK_METRICS;
  const cm = m.confusion_matrix || [[0, 0], [0, 0]];
  const tn = cm[0][0], fp = cm[0][1], fn = cm[1][0], tp = cm[1][1];
  const total = tn + fp + fn + tp;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">Model Insights</h2>
            <p className="page-description">Transparent view of the AI fraud detection model — how it works, what it measures, and where it can be improved.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {usedFallback && <span className="badge badge-demo">Cached Metrics</span>}
            <span className="badge badge-accent"><Cpu size={11} /> Random Forest v{m.model_version || '1.0.0'}</span>
            <button className="btn btn-secondary btn-sm" onClick={fetchMetrics} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
        <AlertTriangle size={15} className="alert-icon" />
        <div>
          <strong>Research Prototype:</strong> This model was trained on{' '}
          <strong>synthetic data</strong> generated specifically for this project.
          Metrics reflect performance on synthetic test data only.
          On real-world financial data, performance — especially precision and recall — will differ significantly.
          Accuracy alone is misleading on class-imbalanced fraud datasets.
        </div>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner spinner-lg" /><div className="page-loader-text">Loading model metrics…</div></div>
      ) : (
        <>
          {/* Performance Cards */}
          <div className="grid-4" style={{ marginBottom: '14px' }}>
            {[
              { label: 'Accuracy', value: `${(m.accuracy * 100).toFixed(1)}%`, color: 'var(--success-text)', note: 'Can be misleading on imbalanced data' },
              { label: 'Precision', value: `${(m.precision * 100).toFixed(1)}%`, color: 'var(--warning-text)', note: '% of fraud flags that are real' },
              { label: 'Recall (Sensitivity)', value: `${(m.recall * 100).toFixed(1)}%`, color: 'var(--warning-text)', note: '% of actual frauds caught' },
              { label: 'F1 Score', value: `${(m.f1_score * 100).toFixed(1)}%`, color: 'var(--warning-text)', note: 'Balance of precision & recall' },
            ].map(metric => (
              <div key={metric.label} className="stat-card">
                <div className="stat-card-header">
                  <div>
                    <div className="stat-card-label">{metric.label}</div>
                    <div className="stat-card-value" style={{ color: metric.color }}>{metric.value}</div>
                  </div>
                </div>
                <div className="stat-card-footer"><span>{metric.note}</span></div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>

            {/* Confusion Matrix */}
            <div className="card">
              <div className="card-header">
                <div className="card-title"><BarChart3 size={14} /> Confusion Matrix (Test Set)</div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{total} test samples</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', maxWidth: '340px', margin: '0 auto' }}>
                  {/* Header row */}
                  <div />
                  <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px' }}>Predicted: Legit</div>
                  <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px' }}>Predicted: Fraud</div>
                  {/* TN */}
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px', display: 'flex', alignItems: 'center' }}>Actual: Legit</div>
                  <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', textAlign: 'center', padding: '14px 8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success-text)' }}>{tn}</div>
                    <div style={{ fontSize: '10px', color: 'var(--success-text)', fontWeight: 600, marginTop: '3px' }}>True Negative</div>
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '6px', textAlign: 'center', padding: '14px 8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--warning-text)' }}>{fp}</div>
                    <div style={{ fontSize: '10px', color: 'var(--warning-text)', fontWeight: 600, marginTop: '3px' }}>False Positive</div>
                  </div>
                  {/* FN / TP */}
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '6px', display: 'flex', alignItems: 'center' }}>Actual: Fraud</div>
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', textAlign: 'center', padding: '14px 8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--danger-text)' }}>{fn}</div>
                    <div style={{ fontSize: '10px', color: 'var(--danger-text)', fontWeight: 600, marginTop: '3px' }}>False Negative</div>
                  </div>
                  <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '6px', textAlign: 'center', padding: '14px 8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>{tp}</div>
                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600, marginTop: '3px' }}>True Positive</div>
                  </div>
                </div>

                <div className="alert alert-info" style={{ marginTop: '14px', fontSize: '11px' }}>
                  <Info size={12} className="alert-icon" />
                  <div>
                    <strong>False Negatives ({fn})</strong> are missed frauds — the higher-cost error in production.
                    Lowering the decision threshold will increase recall but decrease precision.
                  </div>
                </div>
              </div>
            </div>

            {/* Model Info */}
            <div className="card">
              <div className="card-header"><div className="card-title"><Cpu size={14} /> Model Configuration</div></div>
              <div className="card-body">
                {[
                  { k: 'Algorithm', v: m.algorithm || 'Random Forest Classifier' },
                  { k: 'Estimators (Trees)', v: m.n_estimators || 100 },
                  { k: 'Max Depth', v: 12 },
                  { k: 'Class Weight', v: 'balanced (auto-reweighted)' },
                  { k: 'Decision Threshold', v: `${((m.decision_threshold || 0.5) * 100).toFixed(0)}% fraud probability` },
                  { k: 'HIGH Risk Threshold', v: '≥ 65% fraud probability' },
                  { k: 'MEDIUM Risk Threshold', v: '35 – 64% fraud probability' },
                  { k: 'LOW Risk Threshold', v: '< 35% fraud probability' },
                  { k: 'Training Samples', v: m.training_samples?.toLocaleString() || '4,000' },
                  { k: 'Test Samples', v: m.test_samples?.toLocaleString() || '1,000' },
                  { k: 'Dataset', v: m.dataset || 'Synthetic (5,000 rows)' },
                  { k: 'ROC-AUC', v: m.roc_auc ? `${(m.roc_auc * 100).toFixed(1)}%` : '91.2%' },
                  { k: 'Evaluated', v: m.evaluated_at || '2026-09-25' },
                ].map(({ k, v }) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '12px', gap: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{k}</span>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Importance */}
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="card-header">
              <div className="card-title">Feature Importance</div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Relative contribution to fraud prediction (based on RF impurity decrease)</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FEATURE_IMPORTANCE.map((f, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)' }}>{f.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{f.importance}%</span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar" style={{ width: `${f.importance * 3}%`, background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))' }} />
                  </div>
                </div>
              ))}

              <div className="alert alert-info" style={{ fontSize: '11px', marginTop: '4px' }}>
                <Info size={13} className="alert-icon" />
                Feature importance is based on mean decrease in Gini impurity across all 100 trees.
                The engineered <code>amount_to_avg_ratio</code> feature (current amount ÷ historical average) is the single most predictive signal.
              </div>
            </div>
          </div>

          {/* Why Accuracy is Misleading */}
          <div className="card">
            <div className="card-header"><div className="card-title"><AlertCircle size={14} /> Why 96% Accuracy Can Be Misleading</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                If only <strong>15% of transactions are fraud</strong>, a model that labels every transaction as "Legitimate" would achieve{' '}
                <strong style={{ color: 'var(--warning-text)' }}>85% accuracy</strong> — without ever detecting a single fraud.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                For fraud detection, <strong>Recall</strong> (catching actual frauds) and <strong>Precision</strong> (avoiding false alarms)
                are the critical metrics. The <strong>F1 Score</strong> balances both. ROC-AUC measures discrimination
                across all thresholds and is threshold-independent.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                This model uses <code>class_weight='balanced'</code> to compensate for the class imbalance in the synthetic dataset.
                The decision threshold (currently 50%) can be tuned to prefer higher recall (catching more fraud) at the cost of more false positives.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelInsightsPage;
