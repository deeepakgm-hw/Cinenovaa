export default function Card({ hoverable = false, onClick, children, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={['cn-card', hoverable ? 'cn-card--hoverable' : '', onClick ? 'cursor-pointer' : '', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
