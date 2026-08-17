import { Loader2 } from 'lucide-react'

const variants = {
  primary:   'cn-btn-primary',
  secondary: 'cn-btn-secondary',
  ghost:     'cn-btn-ghost',
  danger:    'cn-btn-danger',
}

const sizes = {
  sm: 'cn-btn-sm',
  md: 'cn-btn-md',
  lg: 'cn-btn-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  children,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'cn-btn',
        variants[variant],
        sizes[size],
        fullWidth ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 className="cn-btn-spinner" />
      ) : iconLeft ? (
        <span className="cn-btn-icon">{iconLeft}</span>
      ) : null}
      {children}
      {!loading && iconRight && <span className="cn-btn-icon">{iconRight}</span>}
    </button>
  )
}
