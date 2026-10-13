import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ResultCard from '../components/ResultCard';
import { useToast } from '../context/ToastContext';
import {
  ScanSearch, Sparkles, ShieldAlert, AlertCircle, RotateCcw,
  DollarSign, Smartphone, MapPin, Clock, Zap, Info, FlaskConical, Sliders
} from 'lucide-react';

const INITIAL_FORM = {
  amount: '450.00',
  transactionType: 'Transfer',
  accountAge: '180',
  transactionFrequency: '8',
  averageTransactionAmount: '350.00',
  deviceType: 'Desktop',
  location: 'New York, USA',
  ipAddress: '192.168.1.100',
  paymentMethod: 'Credit Card',
  previousFraudHistory: '0',
  failedAttempts: '0',
};

const PRESETS = {
  legitimate: {
    amount: '75.50', transactionType: 'Purchase', accountAge: '520',
    transactionFrequency: '12', averageTransactionAmount: '80.00',
    deviceType: 'Mobile', location: 'New York, USA', ipAddress: '172.56.12.90',
    paymentMethod: 'Credit Card', previousFraudHistory: '0', failedAttempts: '0',
  },
  highRisk: {
    amount: '9450.00', transactionType: 'Transfer', accountAge: '4',
    transactionFrequency: '48', averageTransactionAmount: '120.00',
    deviceType: 'Desktop', location: 'Unknown/Proxy', ipAddress: '185.220.101.5',
    paymentMethod: 'Net Banking', previousFraudHistory: '1', failedAttempts: '4',
  },
};

const FormField = ({ label, hint, children }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {children}
    {hint && <div className="form-hint">{hint}</div>}
  </div>
);

const AnalyzePage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [savedTxn, setSavedTxn] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' | 'whatif'
  const toast = useToast();

  // Load demo scenario from sessionStorage (set by DemoPanel)
  useEffect(() => {
    const scenario = sessionStorage.getItem('demoScenario');
    if (scenario) {
      try {
        const data = JSON.parse(scenario);
        setFormData(prev => ({ ...prev, ...data }));
        sessionStorage.removeItem('demoScenario');
        toast.info('Demo Scenario Loaded', 'Form pre-filled with demo scenario data.');
      } catch { /* ignore */ }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setSavedTxn(null);

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        accountAge: parseFloat(formData.accountAge),
        transactionFrequency: parseFloat(formData.transactionFrequency),
        averageTransactionAmount: parseFloat(formData.averageTransactionAmount),
        previousFraudHistory: parseInt(formData.previousFraudHistory, 10),
        failedAttempts: parseInt(formData.failedAttempts, 10),
      };

      const res = await api.post('/transactions/analyze', payload);
      setResult(res.data.result);
      setSavedTxn(res.data.transaction);

      const r = res.data.result;
      if (r?.prediction === 'FRAUD') {
        toast.error('🚨 Fraud Detected', `Risk score: ${Number(r.fraud_probability).toFixed(1)}% — Transaction blocked`);
      } else if (r?.prediction === 'SUSPICIOUS') {
        toast.warning('⚠ Suspicious Activity', `Risk: ${Number(r.fraud_probability).toFixed(1)}% — Review recommended`);
      } else {
        toast.success('✓ Transaction Cleared', 'No significant fraud indicators detected.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to connect to ML Risk Engine. Ensure the ML service is running on port 5001.';
      setError(msg);
      toast.error('Analysis Failed', msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const applyPreset = (preset) => {
    setFormData(PRESETS[preset]);
    setResult(null);
    setSavedTxn(null);
    setError(null);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setResult(null);
    setSavedTxn(null);
    setError(null);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">Analyze Transaction</h2>
            <p className="page-description">
              Submit transaction metadata for real-time ML-powered fraud risk classification with explainable AI.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => applyPreset('legitimate')} className="btn btn-secondary btn-sm" style={{ color: 'var(--success-text)' }}>
              <Sparkles size={13} /> Legit Preset
            </button>
            <button type="button" onClick={() => applyPreset('highRisk')} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger-text)' }}>
              <ShieldAlert size={13} /> High-Risk Preset
            </button>
            <button type="button" onClick={resetForm} className="btn btn-ghost btn-sm">
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '3px', width: 'fit-content', border: '1px solid var(--border-card)' }}>
        {[{ id: 'analyze', label: 'Analyze', icon: ScanSearch }, { id: 'whatif', label: 'What-If Simulator', icon: Sliders }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
              transition: 'all var(--t-fast)',
            }}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'whatif' && (
        <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
          <Info size={15} className="alert-icon" />
          <div>
            <strong>What-If Simulator</strong> — Adjust parameters below and click Analyze to see how each change affects the risk score. Results are real ML predictions, not simulations.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '20px', alignItems: 'start' }}>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div className="alert alert-error animate-fade-in" role="alert">
              <AlertCircle size={15} className="alert-icon" />
              <div>{error}</div>
            </div>
          )}

          {savedTxn && (
            <div className="alert alert-success animate-fade-in">
              <FlaskConical size={15} className="alert-icon" />
              <div>Result saved as transaction <strong>#{savedTxn._id?.slice(-8).toUpperCase()}</strong></div>
            </div>
          )}

          <form onSubmit={handleAnalyze} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Transaction Details */}
              <div className="form-section">
                <div className="form-section-title">
                  <DollarSign size={14} aria-hidden="true" /> Transaction Details
                </div>
                <div className="form-grid-2">
                  <FormField label="Amount (USD)" hint="Total transaction value in US dollars">
                    <input type="number" step="0.01" min="0.01" name="amount"
                      value={formData.amount} onChange={handleChange}
                      className="form-input" required aria-required="true" placeholder="e.g. 450.00" />
                  </FormField>

                  <FormField label="Average Transaction Amount" hint="Account's historical average">
                    <input type="number" step="0.01" min="0.01" name="averageTransactionAmount"
                      value={formData.averageTransactionAmount} onChange={handleChange}
                      className="form-input" placeholder="e.g. 350.00" />
                  </FormField>

                  <FormField label="Transaction Type">
                    <select name="transactionType" value={formData.transactionType} onChange={handleChange} className="form-select">
                      {['Purchase', 'Transfer', 'Withdrawal', 'Deposit', 'Payment'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Payment Method">
                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="form-select">
                      {['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>

              {/* Account Signals */}
              <div className="form-section">
                <div className="form-section-title">
                  <Clock size={14} aria-hidden="true" /> Account &amp; Behavioral Signals
                </div>
                <div className="form-grid-2">
                  <FormField label="Account Age (days)" hint="Days since account creation">
                    <input type="number" min="0" name="accountAge"
                      value={formData.accountAge} onChange={handleChange}
                      className="form-input" placeholder="e.g. 180" />
                  </FormField>

                  <FormField label="Transaction Frequency" hint="Transactions in the last 30 days">
                    <input type="number" min="0" name="transactionFrequency"
                      value={formData.transactionFrequency} onChange={handleChange}
                      className="form-input" placeholder="e.g. 8" />
                  </FormField>

                  <FormField label="Previous Fraud History">
                    <select name="previousFraudHistory" value={formData.previousFraudHistory} onChange={handleChange} className="form-select">
                      <option value="0">No prior fraud (0)</option>
                      <option value="1">Has prior fraud history (1)</option>
                    </select>
                  </FormField>

                  <FormField label="Failed Login Attempts" hint="Recent failed authentication attempts">
                    <input type="number" min="0" max="10" name="failedAttempts"
                      value={formData.failedAttempts} onChange={handleChange}
                      className="form-input" placeholder="0–10" />
                  </FormField>
                </div>
              </div>

              {/* Device & Location */}
              <div className="form-section">
                <div className="form-section-title">
                  <Smartphone size={14} aria-hidden="true" /> Device &amp; Location Context
                </div>
                <div className="form-grid-2">
                  <FormField label="Device Type">
                    <select name="deviceType" value={formData.deviceType} onChange={handleChange} className="form-select">
                      {['Mobile', 'Desktop', 'Tablet'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Location">
                    <select name="location" value={formData.location} onChange={handleChange} className="form-select">
                      {['New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'London, UK', 'Singapore', 'Dubai, UAE', 'Mumbai, India', 'Unknown/Proxy', 'TOR Node'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="IP Address" hint="Client IP address at transaction time">
                    <input type="text" name="ipAddress"
                      value={formData.ipAddress} onChange={handleChange}
                      className="form-input" placeholder="e.g. 192.168.1.100" />
                  </FormField>
                </div>
              </div>

              <button type="submit" disabled={analyzing} className="btn btn-primary btn-lg w-full" style={{ marginTop: '4px' }}>
                {analyzing ? (
                  <><span className="btn-spinner" /> Analyzing with ML Engine…</>
                ) : (
                  <><Zap size={17} /> Run Fraud Analysis</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Result Panel */}
        <div style={{ position: 'sticky', top: 'calc(var(--header-height) + 16px)' }}>
          {analyzing && (
            <div className="panel animate-fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div className="spinner spinner-lg" aria-hidden="true" />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Evaluating transaction…
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Random Forest ML model running risk classification + SHAP explainability
              </div>
            </div>
          )}

          {!analyzing && result && (
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={12} /> Analysis complete — result saved to transaction history
              </div>
              <ResultCard result={result} />
            </div>
          )}

          {!analyzing && !result && !error && (
            <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', border: '1.5px dashed var(--border)' }}>
              <ScanSearch size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 14px', opacity: 0.4 }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Awaiting Analysis
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', maxWidth: '280px', margin: '0 auto' }}>
                Fill in the transaction form and click <strong>Run Fraud Analysis</strong> to receive a real-time risk assessment with AI explanation.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzePage;
