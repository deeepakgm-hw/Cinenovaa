import React from 'react';
import { Inbox } from 'lucide-react';

export default function DataTable({ columns, data, loading, emptyMessage, onRowClick, page, onPageChange }) {
  return (
    <div>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
      `}</style>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
              <tr>
                {columns.map((col, i) => (
                  <th key={i} style={{
                    width: col.width,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-tertiary)',
                    padding: '12px 16px',
                    textAlign: 'left',
                    whiteSpace: 'nowrap'
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {columns.map((col, colIndex) => (
                      <td key={`skeleton-col-${colIndex}`} style={{ padding: '14px 16px' }}>
                        <div style={{
                          height: 14,
                          background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-hover) 50%, var(--bg-elevated) 75%)',
                          backgroundSize: '200% 100%',
                          borderRadius: 'var(--radius-sm)',
                          animation: 'shimmer 1.5s infinite'
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data && data.length > 0 ? (
                data.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{
                      borderBottom: rowIndex < data.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      cursor: onRowClick ? 'pointer' : 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-primary)' }}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
                      <Inbox size={32} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {emptyMessage || 'No results found'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {page !== undefined && onPageChange && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '0 8px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing page {page}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1
              }}
            >
              Prev
            </button>
            <button 
              onClick={() => onPageChange(page + 1)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
