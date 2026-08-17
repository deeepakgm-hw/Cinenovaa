import React from 'react';

export default function StatusBadge({ status }) {
  const s = String(status).toLowerCase();
  
  let styles = {
    bg: 'transparent',
    border: 'transparent',
    color: 'var(--text-secondary)'
  };
  
  if (['confirmed', 'active', 'available'].includes(s)) {
    styles = { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: '#22c55e' };
  } else if (['pending'].includes(s)) {
    styles = { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' };
  } else if (['cancelled', 'admin'].includes(s)) {
    styles = { bg: 'rgba(232,54,74,0.12)', border: 'rgba(232,54,74,0.3)', color: 'var(--brand-red)' };
  } else if (['completed'].includes(s)) {
    styles = { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6' };
  } else if (['inactive', 'sold_out'].includes(s)) {
    styles = { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'var(--text-tertiary)' };
  } else if (['user'].includes(s)) {
    styles = { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' };
  }

  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      fontSize: 10,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      border: `1px solid ${styles.border}`,
      background: styles.bg,
      color: styles.color
    }}>
      {status}
    </span>
  );
}
