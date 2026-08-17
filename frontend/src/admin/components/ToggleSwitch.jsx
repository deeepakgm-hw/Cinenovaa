import React from 'react';

export default function ToggleSwitch({ checked, onChange, label, id }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => onChange(!checked)}>
      <div style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--brand-red)' : 'var(--bg-hover)',
        transition: '200ms',
        border: `1px solid ${checked ? 'rgba(232,54,74,0.4)' : 'var(--border-default)'}`
      }}>
        <div style={{
          position: 'absolute', width: 18, height: 18, borderRadius: 9,
          background: 'white', top: 2,
          left: checked ? 22 : 3,
          transition: '200ms',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
        }} />
      </div>
      {label && (
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
    </div>
  );
}
