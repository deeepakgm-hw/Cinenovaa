const variantClasses = {
  red:    'cn-badge-red',
  gold:   'cn-badge-gold',
  green:  'cn-badge-green',
  purple: 'cn-badge-purple',
  blue:   'cn-badge-blue',
  ghost:  'cn-badge-ghost',
}

export default function Badge({ variant = 'ghost', icon = null, children, className = '' }) {
  return (
    <span className={['cn-badge', variantClasses[variant], className].filter(Boolean).join(' ')}>
      {icon && <span className="cn-badge-icon">{icon}</span>}
      {children}
    </span>
  )
}
