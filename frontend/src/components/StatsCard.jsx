import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const COLOR_MAP = {
  blue: 'stat-icon-blue',
  red: 'stat-icon-red',
  green: 'stat-icon-green',
  amber: 'stat-icon-amber',
  purple: 'stat-icon-purple',
  cyan: 'stat-icon-cyan',
};

const StatsCard = ({ title, value, icon: Icon, color = 'blue', subtitle, trend, trendLabel }) => {
  const iconClass = COLOR_MAP[color] || 'stat-icon-blue';
  const trendUp = trend > 0;
  const trendDown = trend < 0;

  return (
    <div className="stat-card animate-fade-in">
      <div className="stat-card-header">
        <div>
          <div className="stat-card-label">{title}</div>
          <div className="stat-card-value">{value ?? '—'}</div>
        </div>
        {Icon && (
          <div className={`stat-card-icon ${iconClass}`}>
            <Icon size={18} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="stat-card-footer">
        {trend !== undefined ? (
          <>
            {trendUp && <TrendingUp size={12} className="stat-trend-up" />}
            {trendDown && <TrendingDown size={12} className="stat-trend-down" />}
            {trend === 0 && <Minus size={12} style={{ color: 'var(--text-muted)' }} />}
            <span className={trendUp ? 'stat-trend-up' : trendDown ? 'stat-trend-down' : ''}>
              {trendUp ? '+' : ''}{trend}%
            </span>
            <span>{trendLabel || 'vs last period'}</span>
          </>
        ) : (
          <span>{subtitle || '\u00A0'}</span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
