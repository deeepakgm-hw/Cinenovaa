import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, delta, deltaType, icon: Icon, accentColor }) {
  return (
    <div style={{
      padding: 24,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        width: 48, height: 48,
        borderRadius: '50%',
        background: `${accentColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={22} color={accentColor} />
      </div>
      <div style={{
        fontSize: 11,
        textTransform: 'uppercase',
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: 'var(--text-tertiary)',
        marginTop: 16
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 28,
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginTop: 4
      }}>
        {value}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 8
      }}>
        {deltaType === 'positive' ? (
          <TrendingUp size={14} color="#22c55e" />
        ) : (
          <TrendingDown size={14} color="var(--brand-red)" />
        )}
        <span style={{ 
          color: deltaType === 'positive' ? '#22c55e' : 'var(--brand-red)',
          fontSize: 13,
          fontWeight: 600
        }}>
          {delta}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          vs last 7 days
        </span>
      </div>
    </div>
  );
}
