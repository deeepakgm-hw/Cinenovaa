import React from 'react'

export default function HalfwaveBadge({ size = 'md', prefix = 'by', className = '', style = {} }) {
  const iconDimensions = {
    xs: 12,
    sm: 15,
    md: 18,
    lg: 24,
  }[size] || 16

  const fontSizes = {
    xs: '10px',
    sm: '12px',
    md: '13.5px',
    lg: '16px',
  }[size] || '13px'

  const prefixSizes = {
    xs: '9px',
    sm: '11px',
    md: '12px',
    lg: '14px',
  }[size] || '12px'

  return (
    <div
      className={`halfwave-branding ${className || ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'xs' ? '4px' : '6px',
        userSelect: 'none',
        ...style,
      }}
    >
      {prefix && (
        <span
          style={{
            fontSize: prefixSizes,
            color: 'var(--text-tertiary, #94a3b8)',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          {prefix}
        </span>
      )}
      <img
        src="/halfwave_logo.png"
        alt="Halfwave Platforms"
        style={{
          width: iconDimensions,
          height: iconDimensions,
          borderRadius: size === 'xs' ? '3px' : '4px',
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: '0 1px 4px rgba(0, 82, 255, 0.25)',
        }}
      />
      <span
        style={{
          fontSize: fontSizes,
          fontWeight: 800,
          color: 'var(--text-primary, #ffffff)',
          letterSpacing: '-0.02em',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        Half<span style={{ color: '#0052FF' }}>wave</span>
        <span style={{ marginLeft: '3.5px', fontWeight: 700 }}>Platforms</span>
      </span>
    </div>
  )
}
