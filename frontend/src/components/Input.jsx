export default function Input({
  label,
  id,
  iconLeft = null,
  iconRight = null,
  error = '',
  hint = '',
  className = '',
  wrapperClassName = '',
  fieldClassName = '',
  fieldStyle = {},
  ...props
}) {
  return (
    <div className={['cn-input-wrap', wrapperClassName].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={id} className="cn-input-label">
          {label}
        </label>
      )}
      <div 
        className={['cn-input-field', error ? 'cn-input-field--error' : '', fieldClassName].filter(Boolean).join(' ')}
        style={fieldStyle}
      >
        {iconLeft && <span className="cn-input-icon cn-input-icon--left">{iconLeft}</span>}
        <input
          id={id}
          className={['cn-input', iconLeft ? 'pl-10' : '', iconRight ? 'pr-10' : '', className].filter(Boolean).join(' ')}
          {...props}
        />
        {iconRight && <span className="cn-input-icon cn-input-icon--right">{iconRight}</span>}
      </div>
      {error && <p className="cn-input-error">{error}</p>}
      {!error && hint && <p className="cn-input-hint">{hint}</p>}
    </div>
  )
}
