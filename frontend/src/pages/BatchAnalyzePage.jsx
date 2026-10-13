import React, { useState, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FileSpreadsheet, Upload, AlertTriangle, CheckCircle2, ShieldAlert,
  Download, Trash2, Info, X, Eye, BarChart3
} from 'lucide-react';

const REQUIRED_COLUMNS = [
  { name: 'amount', type: 'number', example: '1500.00', desc: 'Transaction amount in USD' },
  { name: 'transactionType', type: 'string', example: 'Transfer', desc: 'Purchase | Transfer | Withdrawal | Deposit | Payment' },
  { name: 'accountAge', type: 'number', example: '180', desc: 'Account age in days' },
  { name: 'transactionFrequency', type: 'number', example: '8', desc: 'Transactions in last 30 days' },
  { name: 'averageTransactionAmount', type: 'number', example: '350.00', desc: 'Historical average transaction amount' },
  { name: 'deviceType', type: 'string', example: 'Mobile', desc: 'Mobile | Desktop | Tablet' },
  { name: 'location', type: 'string', example: 'New York, USA', desc: 'Geographic location or Unknown/Proxy' },
  { name: 'ipAddress', type: 'string', example: '192.168.1.1', desc: 'IP address at transaction time' },
  { name: 'paymentMethod', type: 'string', example: 'Credit Card', desc: 'Credit Card | Debit Card | UPI | Net Banking | Wallet' },
  { name: 'previousFraudHistory', type: 'number', example: '0', desc: '0 = no prior fraud, 1 = has prior fraud history' },
  { name: 'failedAttempts', type: 'number', example: '0', desc: 'Recent failed login attempts (0–10)' },
];

const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [], errors: ['File is empty or has only a header row.'] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => { row[h] = vals[idx] ?? ''; });
    rows.push({ rowNum: i + 1, data: row, valid: true, error: null });
  }

  // Check missing required columns
  const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c.name));
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.map(c => c.name).join(', ')}`);
  }

  // Validate each row
  rows.forEach(row => {
    const rowErrors = [];
    REQUIRED_COLUMNS.forEach(col => {
      const val = row.data[col.name];
      if (val === undefined || val === '') {
        rowErrors.push(`${col.name} is missing`);
      } else if (col.type === 'number') {
        const num = parseFloat(val);
        if (isNaN(num)) rowErrors.push(`${col.name} must be a number (got "${val}")`);
        else if (col.name === 'amount' && num <= 0) rowErrors.push(`amount must be > 0`);
        else if (col.name === 'previousFraudHistory' && ![0, 1].includes(parseInt(val))) rowErrors.push(`previousFraudHistory must be 0 or 1`);
        else if (col.name === 'failedAttempts' && (parseInt(val) < 0 || parseInt(val) > 10)) rowErrors.push(`failedAttempts must be 0–10`);
      }
    });
    if (rowErrors.length > 0) {
      row.valid = false;
      row.error = rowErrors.join('; ');
    }
  });

  return { headers, rows, errors };
};

const exportToCSV = (results) => {
  const headers = ['Row', 'Amount', 'Type', 'Risk Level', 'Prediction', 'Score (%)', 'Recommended Action'];
  const rows = results.map((r, i) => [
    i + 1,
    r.input?.amount ?? '',
    r.input?.transactionType ?? '',
    r.result?.risk_level ?? r.error ?? 'ERROR',
    r.result?.prediction ?? '',
    r.result?.fraud_probability != null ? Number(r.result.fraud_probability).toFixed(1) : '',
    (r.result?.recommended_action ?? '').replace(/,/g, ';'),
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `fraud_batch_results_${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
};

const BatchAnalyzePage = () => {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [parseErrors, setParseErrors] = useState([]);
  const [preview, setPreview] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileRef = useRef(null);
  const toast = useToast();

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setUploadError('Only CSV files are accepted.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5 MB limit.');
      return;
    }
    setFile(f);
    setUploadError(null);
    setResults(null);
    setSummary(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers, rows, errors } = parseCSV(ev.target.result);
      setParsed({ headers, rows });
      setParseErrors(errors);
    };
    reader.readAsText(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect({ target: { files: [f] } });
  };

  const validRows = parsed?.rows.filter(r => r.valid) || [];
  const invalidRows = parsed?.rows.filter(r => !r.valid) || [];

  const handleAnalyze = async () => {
    if (validRows.length === 0) {
      toast.error('No Valid Rows', 'Fix validation errors before analyzing.');
      return;
    }
    if (validRows.length > 500) {
      toast.error('Too Many Rows', 'Maximum 500 rows per batch. Please split your file.');
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setResults(null);
    setSummary(null);
    setUploadError(null);

    try {
      // Process in chunks of 50
      const CHUNK = 50;
      const allResults = [];
      for (let start = 0; start < validRows.length; start += CHUNK) {
        const chunk = validRows.slice(start, start + CHUNK).map(r => ({
          amount: parseFloat(r.data.amount),
          transactionType: r.data.transactionType,
          accountAge: parseFloat(r.data.accountAge),
          transactionFrequency: parseFloat(r.data.transactionFrequency),
          averageTransactionAmount: parseFloat(r.data.averageTransactionAmount),
          deviceType: r.data.deviceType,
          location: r.data.location,
          ipAddress: r.data.ipAddress,
          paymentMethod: r.data.paymentMethod,
          previousFraudHistory: parseInt(r.data.previousFraudHistory, 10),
          failedAttempts: parseInt(r.data.failedAttempts, 10),
        }));

        const res = await api.post('/transactions/batch-analyze', { transactions: chunk });
        const chunkResults = res.data.results || [];
        chunkResults.forEach((r, i) => {
          allResults.push({ input: chunk[i], result: r.result, error: r.error || null });
        });
        setProgress(Math.round(((start + CHUNK) / validRows.length) * 100));
      }

      setResults(allResults);
      const fraud = allResults.filter(r => r.result?.risk_level === 'HIGH').length;
      const suspicious = allResults.filter(r => r.result?.risk_level === 'MEDIUM').length;
      const legit = allResults.filter(r => r.result?.risk_level === 'LOW').length;
      const failed = allResults.filter(r => r.error).length;
      setSummary({ total: allResults.length, fraud, suspicious, legit, failed });
      toast.success('Batch Complete', `Analyzed ${allResults.length} transactions.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Batch analysis failed. Ensure backend and ML service are running.';
      setUploadError(msg);
      toast.error('Batch Failed', msg);
    } finally {
      setAnalyzing(false);
      setProgress(100);
    }
  };

  const reset = () => {
    setFile(null); setParsed(null); setParseErrors([]); setPreview(false);
    setResults(null); setSummary(null); setUploadError(null); setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const riskCls = (level) => level === 'HIGH' ? 'badge-high' : level === 'MEDIUM' ? 'badge-medium' : 'badge-low';

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">Batch CSV Analysis</h2>
            <p className="page-description">Upload a CSV file to analyze multiple transactions simultaneously through the ML fraud detection engine.</p>
          </div>
          {(file || results) && (
            <button className="btn btn-secondary btn-sm" onClick={reset}><Trash2 size={13} /> Reset</button>
          )}
        </div>
      </div>

      {/* Schema Reference */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <div className="card-title"><Info size={14} /> Required CSV Schema ({REQUIRED_COLUMNS.length} columns)</div>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const header = REQUIRED_COLUMNS.map(c => c.name).join(',');
            const example = REQUIRED_COLUMNS.map(c => c.example).join(',');
            const blob = new Blob([header + '\n' + example], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'fraud_detection_template.csv';
            a.click(); URL.revokeObjectURL(url);
          }}>
            <Download size={13} /> Download Template
          </button>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
          <table className="data-table">
            <thead>
              <tr><th>Column Name</th><th>Type</th><th>Example</th><th>Description</th></tr>
            </thead>
            <tbody>
              {REQUIRED_COLUMNS.map(col => (
                <tr key={col.name}>
                  <td><code style={{ fontSize: '11.5px', color: 'var(--accent)' }}>{col.name}</code></td>
                  <td className="table-cell-muted">{col.type}</td>
                  <td className="table-cell-muted">{col.example}</td>
                  <td className="table-cell-muted" style={{ fontSize: '11.5px' }}>{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Zone */}
      {!results && (
        <div
          className="card"
          style={{ marginBottom: '16px' }}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <div className="card-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} style={{ display: 'none' }} id="csv-upload" />
            <label htmlFor="csv-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-xl)', background: 'var(--accent-muted)', border: '1.5px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <FileSpreadsheet size={24} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {file ? file.name : 'Drop your CSV here, or click to browse'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Max 500 rows · Max 5 MB · CSV format only
              </div>
            </label>

            {uploadError && (
              <div className="alert alert-error animate-fade-in" style={{ marginTop: '14px', textAlign: 'left' }}>
                <AlertTriangle size={14} className="alert-icon" /> {uploadError}
              </div>
            )}

            {parsed && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {parseErrors.length > 0 && (
                  <div className="alert alert-error" style={{ textAlign: 'left' }}>
                    <AlertTriangle size={14} className="alert-icon" />
                    <div>
                      {parseErrors.map((e, i) => <div key={i}>{e}</div>)}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{parsed.rows.length}</strong> rows total
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--success-text)' }}>
                    <strong>{validRows.length}</strong> valid
                  </span>
                  {invalidRows.length > 0 && (
                    <span style={{ fontSize: '12.5px', color: 'var(--danger-text)' }}>
                      <strong>{invalidRows.length}</strong> invalid
                    </span>
                  )}
                </div>

                {invalidRows.length > 0 && (
                  <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', textAlign: 'left', maxHeight: '140px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--danger-text)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Validation Errors</div>
                    {invalidRows.map(r => (
                      <div key={r.rowNum} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        Row {r.rowNum}: <span style={{ color: 'var(--danger-text)' }}>{r.error}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPreview(v => !v)}>
                    <Eye size={13} /> {preview ? 'Hide' : 'Preview'} (first 5 rows)
                  </button>
                  {validRows.length > 0 && parseErrors.length === 0 && (
                    <button className="btn btn-primary btn-sm" onClick={handleAnalyze} disabled={analyzing}>
                      {analyzing ? <><span className="btn-spinner" />Analyzing…</> : <><Upload size={13} />Analyze {validRows.length} Transactions</>}
                    </button>
                  )}
                </div>

                {/* Preview Table */}
                {preview && (
                  <div className="table-wrapper" style={{ border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', marginTop: '4px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>{parsed.headers.slice(0, 6).map(h => <th key={h}>{h}</th>)}<th>…</th></tr>
                      </thead>
                      <tbody>
                        {parsed.rows.slice(0, 5).map(r => (
                          <tr key={r.rowNum} style={!r.valid ? { background: 'rgba(239,68,68,0.06)' } : undefined}>
                            {parsed.headers.slice(0, 6).map(h => (
                              <td key={h} className="table-cell-muted" style={{ fontSize: '11.5px' }}>{r.data[h]}</td>
                            ))}
                            <td>{!r.valid && <span title={r.error}><AlertTriangle size={12} style={{ color: 'var(--danger-text)' }} /></span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {analyzing && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Analyzing batch through ML engine… {progress}%
            </div>
            <div className="progress-bar-wrapper" style={{ height: '10px' }}>
              <div className="progress-bar" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))', transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>Processing in chunks of 50 — do not close this tab</div>
          </div>
        </div>
      )}

      {/* Summary + Results */}
      {summary && results && (
        <>
          {/* Summary Cards */}
          <div className="grid-4" style={{ marginBottom: '14px' }}>
            {[
              { label: 'Total Analyzed', value: summary.total, color: 'cyan', Icon: BarChart3 },
              { label: 'Fraud (HIGH)', value: summary.fraud, color: 'red', Icon: ShieldAlert },
              { label: 'Suspicious', value: summary.suspicious, color: 'amber', Icon: AlertTriangle },
              { label: 'Legitimate', value: summary.legit, color: 'green', Icon: CheckCircle2 },
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
                  <span>{summary.total > 0 ? `${((s.value / summary.total) * 100).toFixed(0)}% of batch` : ''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Results Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Batch Results ({results.length} transactions)</div>
              <button className="btn btn-secondary btn-sm" onClick={() => exportToCSV(results)}>
                <Download size={13} /> Export CSV
              </button>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Location</th>
                    <th>Risk</th>
                    <th>Score</th>
                    <th>Prediction</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} style={r.result?.risk_level === 'HIGH' ? { background: 'rgba(239,68,68,0.04)' } : undefined}>
                      <td className="table-cell-muted">{i + 1}</td>
                      <td className="table-cell-amount">${Number(r.input?.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="table-cell-muted">{r.input?.transactionType}</td>
                      <td className="table-cell-muted">{r.input?.paymentMethod}</td>
                      <td className="table-cell-muted" style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.input?.location}</td>
                      <td>
                        {r.result?.risk_level
                          ? <span className={`badge ${riskCls(r.result.risk_level)}`}>{r.result.risk_level}</span>
                          : <span className="badge badge-neutral">ERROR</span>}
                      </td>
                      <td style={{ fontWeight: 700, color: r.result?.risk_level === 'HIGH' ? 'var(--danger-text)' : r.result?.risk_level === 'MEDIUM' ? 'var(--warning-text)' : 'var(--success-text)', fontVariantNumeric: 'tabular-nums' }}>
                        {r.result?.fraud_probability != null ? `${Number(r.result.fraud_probability).toFixed(1)}%` : '—'}
                      </td>
                      <td>
                        {r.result?.prediction
                          ? <span className={`badge ${riskCls(r.result.risk_level)} badge-sm`}>{r.result.prediction}</span>
                          : <span style={{ fontSize: '11px', color: 'var(--danger-text)' }}>{r.error}</span>}
                      </td>
                      <td>
                        {r.error
                          ? <AlertTriangle size={14} style={{ color: 'var(--danger-text)' }} title={r.error} />
                          : <CheckCircle2 size={14} style={{ color: 'var(--success-text)' }} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {summary.failed > 0 && (
            <div className="alert alert-warning" style={{ marginTop: '12px', fontSize: '12px' }}>
              <AlertTriangle size={14} className="alert-icon" />
              {summary.failed} row(s) failed to process. They are shown with ERROR status in the table. Check ML service availability.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BatchAnalyzePage;
