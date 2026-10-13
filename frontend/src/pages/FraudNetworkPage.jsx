import React, { useState } from 'react';
import { Network, AlertTriangle, Info } from 'lucide-react';

const DEMO_NODES = [
  { id: 'acc_a', label: 'Account A', type: 'account', x: 160, y: 100, risk: 'HIGH' },
  { id: 'acc_b', label: 'Account B', type: 'account', x: 160, y: 260, risk: 'HIGH' },
  { id: 'acc_c', label: 'Account C', type: 'account', x: 160, y: 420, risk: 'MEDIUM' },
  { id: 'acc_x', label: 'Hub Account X', type: 'account', x: 420, y: 260, risk: 'HIGH' },
  { id: 'dev_1', label: 'Device #7A1B', type: 'device', x: 650, y: 140, risk: 'HIGH' },
  { id: 'dev_2', label: 'Device #3C9F', type: 'device', x: 650, y: 280, risk: 'MEDIUM' },
  { id: 'loc_proxy', label: 'Unknown/Proxy', type: 'location', x: 650, y: 420, risk: 'HIGH' },
  { id: 'txn_1', label: '₹50,000', type: 'transaction', x: 300, y: 80, risk: 'HIGH' },
  { id: 'txn_2', label: '₹48,000', type: 'transaction', x: 300, y: 310, risk: 'HIGH' },
  { id: 'txn_3', label: '₹12,000', type: 'transaction', x: 290, y: 450, risk: 'MEDIUM' },
];

const DEMO_EDGES = [
  { from: 'acc_a', to: 'txn_1', label: 'sent' },
  { from: 'txn_1', to: 'acc_x', label: 'received' },
  { from: 'acc_b', to: 'txn_2', label: 'sent' },
  { from: 'txn_2', to: 'acc_x', label: 'received' },
  { from: 'acc_c', to: 'txn_3', label: 'sent' },
  { from: 'txn_3', to: 'acc_x', label: 'received' },
  { from: 'acc_x', to: 'dev_1', label: 'used' },
  { from: 'acc_a', to: 'dev_1', label: 'used' },
  { from: 'acc_x', to: 'dev_2', label: 'used' },
  { from: 'acc_x', to: 'loc_proxy', label: 'origin' },
];

const NODE_CFG = {
  account: { bg: '#0f2748', border: '#3b82f6', icon: '👤' },
  device: { bg: '#0f2a1a', border: '#22c55e', icon: '💻' },
  location: { bg: '#2a0f0f', border: '#ef4444', icon: '📍' },
  transaction: { bg: '#2a1e00', border: '#f59e0b', icon: '💳' },
};

const FraudNetworkPage = () => {
  const [selected, setSelected] = useState(null);

  const getNode = (id) => DEMO_NODES.find(n => n.id === id);
  const selectedNode = selected ? DEMO_NODES.find(n => n.id === selected) : null;
  const connectedEdges = selected ? DEMO_EDGES.filter(e => e.from === selected || e.to === selected) : [];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2 className="page-title">Fraud Network</h2>
            <p className="page-description">Visualize relationships between accounts, devices, and locations to detect coordinated fraud rings.</p>
          </div>
          <span className="badge badge-demo">⚡ DEMO DATA</span>
        </div>
      </div>

      {/* Pattern Alert */}
      <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <AlertTriangle size={18} style={{ color: 'var(--danger-text)', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger-text)', marginBottom: '3px' }}>
            Coordinated Fraud Pattern Detected
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Multiple accounts (A, B, C) are funneling large transfers to a hub account (X) via shared devices and a proxy IP — a classic fraud ring pattern.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>

        {/* Graph */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Network size={14} /> Network Graph</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click a node to inspect connections</span>
          </div>
          <div className="card-body" style={{ padding: '8px', overflowX: 'auto' }}>
            <svg width="820" height="560" viewBox="0 0 820 560" style={{ display: 'block', minWidth: '600px' }}>
              <defs>
                <marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <path d="M0,0 L7,3.5 L0,7 z" fill="#475569" />
                </marker>
              </defs>

              {/* Edges */}
              {DEMO_EDGES.map((edge, i) => {
                const from = getNode(edge.from);
                const to = getNode(edge.to);
                if (!from || !to) return null;
                const highlighted = selected && (edge.from === selected || edge.to === selected);
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                return (
                  <g key={i}>
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={highlighted ? '#38bdf8' : '#1e3a5f'}
                      strokeWidth={highlighted ? 2.5 : 1.2}
                      markerEnd="url(#arrow)"
                      opacity={highlighted ? 1 : 0.5}
                    />
                    <text x={midX} y={midY - 5} textAnchor="middle" fill="#475569" fontSize="9" fontFamily="Inter, sans-serif">
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {DEMO_NODES.map(node => {
                const cfg = NODE_CFG[node.type];
                const isSelected = selected === node.id;
                const isConn = connectedEdges.some(e => e.from === node.id || e.to === node.id);
                return (
                  <g key={node.id} onClick={() => setSelected(isSelected ? null : node.id)} style={{ cursor: 'pointer' }}>
                    <circle
                      cx={node.x} cy={node.y} r={isSelected ? 30 : 24}
                      fill={cfg.bg}
                      stroke={isSelected ? '#38bdf8' : isConn && selected ? '#38bdf860' : cfg.border}
                      strokeWidth={isSelected ? 3 : 1.5}
                      style={{
                        transition: 'all 0.18s',
                        filter: node.risk === 'HIGH' && !isSelected ? 'drop-shadow(0 0 6px rgba(239,68,68,0.3))' : 'none',
                      }}
                    />
                    <text x={node.x} y={node.y + 5} textAnchor="middle" fontSize="14" style={{ userSelect: 'none', pointerEvents: 'none' }}>{cfg.icon}</text>
                    <text x={node.x} y={node.y + 42} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif" style={{ userSelect: 'none' }}>
                      {node.label.length > 14 ? node.label.slice(0, 14) + '…' : node.label}
                    </text>
                    {node.risk === 'HIGH' && (
                      <circle cx={node.x + 18} cy={node.y - 18} r="7" fill="#ef4444" stroke="#060b14" strokeWidth="2" />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <div className="card">
            <div className="card-header"><div className="card-title">Node Legend</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(NODE_CFG).map(([type, cfg]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: cfg.bg, border: `2px solid ${cfg.border}`, flexShrink: 0 }} />
                  <span style={{ textTransform: 'capitalize' }}>{type}</span>
                </div>
              ))}
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--danger-text)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                High-risk node
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Pattern Summary</div></div>
            <div className="card-body">
              {[
                { label: 'Accounts in Ring', value: '4', color: 'var(--primary)' },
                { label: 'Shared Devices', value: '2', color: 'var(--success-text)' },
                { label: 'Shared Proxy IP', value: '1', color: 'var(--danger-text)' },
                { label: 'Total Suspicious Txns', value: '7', color: 'var(--warning-text)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedNode && (
            <div className="card animate-scale-in">
              <div className="card-header"><div className="card-title">Selected Node</div></div>
              <div className="card-body">
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{selectedNode.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'capitalize' }}>Type: {selectedNode.type}</div>
                <span className={`badge ${selectedNode.risk === 'HIGH' ? 'badge-high' : selectedNode.risk === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
                  {selectedNode.risk} RISK
                </span>
                {connectedEdges.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Connections</div>
                    {connectedEdges.slice(0, 5).map((e, i) => {
                      const other = getNode(e.from === selectedNode.id ? e.to : e.from);
                      return (
                        <div key={i} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', padding: '3px 0' }}>
                          → {other?.label || '?'} <span style={{ color: 'var(--text-muted)' }}>({e.label})</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="alert alert-info" style={{ marginTop: '12px', fontSize: '11.5px' }}>
        <Info size={14} className="alert-icon" />
        <span>This graph uses <strong>demo data</strong> for visualization. In production, nodes represent real account relationships extracted from transaction records via graph analysis.</span>
      </div>
    </div>
  );
};

export default FraudNetworkPage;
