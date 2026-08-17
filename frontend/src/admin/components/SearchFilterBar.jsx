import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function SearchFilterBar({ searchValue, onSearch, filters = [], activeFilters = {}, onFilterChange, actions }) {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (key) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      marginBottom: 20
    }}>
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input 
          type="text"
          value={searchValue}
          onChange={(e) => onSearch && onSearch(e.target.value)}
          placeholder="Search..."
          style={{
            width: '100%',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-pill)',
            padding: '9px 14px 9px 38px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'all 200ms'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--border-active)';
            e.target.style.boxShadow = '0 0 0 3px rgba(232,54,74,0.12)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-default)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {filters.map((filter) => {
          const isActive = activeFilters[filter.key];
          return (
            <div key={filter.key} style={{ position: 'relative' }}>
              <button
                onClick={() => toggleDropdown(filter.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: isActive ? 'rgba(232,54,74,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${isActive ? 'var(--border-active)' : 'var(--border-default)'}`,
                  color: isActive ? 'var(--brand-red)' : 'var(--text-secondary)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 200ms'
                }}
              >
                {filter.label} {isActive && `: ${isActive}`}
                <ChevronDown size={14} />
              </button>
              
              {openDropdown === filter.key && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: 160,
                  zIndex: 200,
                  padding: 4
                }}>
                  <div
                    onClick={() => { onFilterChange && onFilterChange(filter.key, null); setOpenDropdown(null); }}
                    style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                    onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    All {filter.label}
                  </div>
                  {filter.options.map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => { onFilterChange && onFilterChange(filter.key, opt.value); setOpenDropdown(null); }}
                      style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
                      onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {actions && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
