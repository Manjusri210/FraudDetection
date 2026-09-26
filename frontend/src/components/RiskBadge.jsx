import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

const RiskBadge = ({ level, prediction, size = 'md', showIcon = true }) => {
  const val = (level || prediction || '').toUpperCase();

  let cls = 'badge ';
  let Icon = null;
  let label = val;

  if (val === 'HIGH' || val === 'FRAUD') {
    cls += 'badge-high'; Icon = ShieldAlert; label = val === 'HIGH' ? 'HIGH' : 'FRAUD';
  } else if (val === 'MEDIUM' || val === 'SUSPICIOUS') {
    cls += 'badge-medium'; Icon = AlertTriangle; label = val === 'MEDIUM' ? 'MEDIUM' : 'SUSPICIOUS';
  } else if (val === 'LOW' || val === 'LEGITIMATE') {
    cls += 'badge-low'; Icon = CheckCircle2; label = val === 'LOW' ? 'LOW' : 'LEGITIMATE';
  } else {
    cls += 'badge-neutral'; label = val || '—';
  }

  if (size === 'sm') cls += ' badge-sm';
  if (size === 'lg') cls += ' badge-lg';

  return (
    <span className={cls}>
      {showIcon && Icon && <Icon size={size === 'sm' ? 9 : 10} aria-hidden="true" />}
      {label}
    </span>
  );
};

export default RiskBadge;
