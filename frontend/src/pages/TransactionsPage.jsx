import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { useToast } from '../context/ToastContext';
import {
  Search, Filter, ChevronLeft, ChevronRight, ArrowRight,
  History, Trash2, RefreshCw, AlertCircle, X
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [predFilter, setPredFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const toast = useToast();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page, limit: ITEMS_PER_PAGE, sortBy, order,
        ...(search && { search }),
        ...(riskFilter && { riskLevel: riskFilter }),
        ...(predFilter && { prediction: predFilter }),
      });
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions || []);
      setTotal(res.data.total || 0);
    } catch {
      setError('Failed to load transactions. Please retry.');
    } finally {
      setLoading(false);
    }
  }, [page, search, riskFilter, predFilter, sortBy, order]);

  useEffect(() => {
    const timer = setTimeout(fetchTransactions, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction record? This cannot be undone.')) return;
    try {
      setDeleting(id);
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted', 'Transaction record removed successfully.');
      fetchTransactions();
    } catch {
      toast.error('Delete Failed', 'Could not delete the transaction.');
    } finally {
      setDeleting(null);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) setOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setOrder('desc'); }
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(''); setRiskFilter(''); setPredFilter('');
    setSortBy('createdAt'); setOrder('desc'); setPage(1);
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const hasFilters = search || riskFilter || predFilter;

  const SortArrow = ({ field }) => (
    <span aria-hidden="true" style={{ opacity: sortBy === field ? 1 : 0.3, marginLeft: '4px', fontSize: '10px' }}>
      {sortBy === field ? (order === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">Transaction History</h2>
            <p className="page-description">Full audit trail of all analyzed transactions.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchTransactions} disabled={loading} aria-label="Refresh">
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <AlertCircle size={16} className="alert-icon" />
          {error}
          <button onClick={fetchTransactions} className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }}>Retry</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="table-search-wrapper">
          <Search size={14} className="table-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search transactions…"
            className="table-search"
            aria-label="Search transactions"
          />
        </div>

        <select
          value={riskFilter}
          onChange={e => { setRiskFilter(e.target.value); setPage(1); }}
          className="table-filter"
          aria-label="Filter by risk level"
        >
          <option value="">All Risk Levels</option>
          <option value="LOW">Low Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="HIGH">High Risk</option>
        </select>

        <select
          value={predFilter}
          onChange={e => { setPredFilter(e.target.value); setPage(1); }}
          className="table-filter"
          aria-label="Filter by prediction"
        >
          <option value="">All Predictions</option>
          <option value="LEGITIMATE">Legitimate</option>
          <option value="SUSPICIOUS">Suspicious</option>
          <option value="FRAUD">Fraud</option>
        </select>

        {hasFilters && (
          <button onClick={clearFilters} className="btn btn-ghost btn-sm" aria-label="Clear all filters">
            <X size={13} /> Clear
          </button>
        )}

        <div className="table-toolbar-right">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {total.toLocaleString()} transaction{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table" aria-label="Transaction history">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('createdAt')} aria-sort={sortBy === 'createdAt' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Date <SortArrow field="createdAt" />
              </th>
              <th className="sortable" onClick={() => handleSort('amount')} aria-sort={sortBy === 'amount' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
                Amount <SortArrow field="amount" />
              </th>
              <th>Type</th>
              <th>Device</th>
              <th>Location</th>
              <th className="sortable" onClick={() => handleSort('riskLevel')}>
                Risk <SortArrow field="riskLevel" />
              </th>
              <th className="sortable" onClick={() => handleSort('prediction')}>
                Prediction <SortArrow field="prediction" />
              </th>
              <th className="sortable" onClick={() => handleSort('fraudProbability')}>
                Score <SortArrow field="fraudProbability" />
              </th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}><div className="skeleton skeleton-text" style={{ width: j === 0 ? '80px' : j === 1 ? '90px' : '60px' }} /></td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">
                    <History size={40} className="empty-state-icon" />
                    <div className="empty-state-title">{hasFilters ? 'No matching transactions' : 'No transactions yet'}</div>
                    <div className="empty-state-message">
                      {hasFilters ? 'Try adjusting your filters or search terms.' : 'Start by analyzing your first transaction.'}
                    </div>
                    {hasFilters && <button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear Filters</button>}
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map(txn => (
                <tr key={txn._id}>
                  <td className="table-cell-muted" style={{ whiteSpace: 'nowrap' }}>
                    {new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="table-cell-amount">
                    ${Number(txn.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="table-cell-muted">{txn.transactionType || '—'}</td>
                  <td className="table-cell-muted">{txn.deviceType || '—'}</td>
                  <td className="table-cell-muted" style={{ maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {txn.location || '—'}
                  </td>
                  <td><RiskBadge level={txn.riskLevel} showIcon={false} /></td>
                  <td><RiskBadge prediction={txn.prediction} showIcon={false} /></td>
                  <td>
                    <span style={{
                      fontWeight: 700, fontSize: '13px', fontVariantNumeric: 'tabular-nums',
                      color: txn.riskLevel === 'HIGH' ? 'var(--danger-text)'
                           : txn.riskLevel === 'MEDIUM' ? 'var(--warning-text)'
                           : 'var(--success-text)'
                    }}>
                      {txn.fraudProbability != null ? `${Number(txn.fraudProbability).toFixed(1)}%` : '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <Link
                        to={`/transactions/${txn._id}`}
                        className="btn btn-ghost btn-sm btn-icon"
                        title="View details"
                        aria-label="View transaction details"
                      >
                        <ArrowRight size={14} />
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => handleDelete(txn._id)}
                        disabled={deleting === txn._id}
                        title="Delete record"
                        aria-label="Delete transaction"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        {deleting === txn._id ? <span className="spinner spinner-sm" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total.toLocaleString()}
            </span>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setPage(1)}
                disabled={page === 1}
                aria-label="First page"
              >«</button>
              <button
                className="pagination-btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              ><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                return Math.min(pg, totalPages);
              }).filter((v, i, a) => a.indexOf(v) === i).map(pg => (
                <button
                  key={pg}
                  className="pagination-btn"
                  onClick={() => setPage(pg)}
                  aria-current={pg === page ? 'page' : undefined}
                  style={pg === page ? { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' } : {}}
                >
                  {pg}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
              ><ChevronRight size={14} /></button>
              <button
                className="pagination-btn"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                aria-label="Last page"
              >»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
