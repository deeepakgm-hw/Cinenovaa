import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function SlideOver({ open, onClose, title, subtitle, width = 480, children, footer }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 300
        }} 
      />
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width, height: '100vh',
        background: 'var(--bg-elevated)',
        borderLeft: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
        zIndex: 301,
        animation: 'slideOverIn 300ms ease forwards',
        transform: 'translateX(100%)'
      }}>
        <style>{`
          @keyframes slideOverIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
        
        <div style={{ padding: 24, borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{subtitle}</div>}
          </div>
          <button 
            onClick={onClose}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'var(--bg-hover)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-primary)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-modal)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          >
            <X size={18} />
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {children}
        </div>
        
        {footer && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
