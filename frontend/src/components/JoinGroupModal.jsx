import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, X, ArrowRight, AlertCircle } from 'lucide-react'
import { groupApi } from '../services/api'
import Badge from './Badge'
import Button from './Button'

export default function JoinGroupModal({ isOpen, onClose }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleJoin = async (e) => {
    e?.preventDefault()
    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter a valid 6-character session code.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await groupApi.get(cleanCode)
      if (res.data?.success && res.data?.session) {
        const session = res.data.session
        onClose()
        navigate(`/seats?showtimeId=${session.showtime_id}&session=${session.session_code}`)
      } else {
        setError('Session not found or has expired.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Session not found or has expired. Please verify the code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(4, 5, 8, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#0d0f17',
          border: '1px solid rgba(155, 93, 229, 0.3)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(155, 93, 229, 0.15)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
        >
          <X size={16} />
        </button>

        {/* Icon & Badge */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(155, 93, 229, 0.15)',
            border: '1px solid rgba(155, 93, 229, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
          }}
        >
          <Users size={26} color="var(--brand-purple)" />
        </div>

        <Badge variant="purple">Real-Time Multiplayer</Badge>

        <h3
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 900,
            fontSize: '22px',
            color: 'var(--text-primary)',
            margin: '12px 0 6px 0',
          }}
        >
          Join Group Booking
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: '0 0 24px 0',
            lineHeight: 1.5,
          }}
        >
          Enter the 6-character session code shared by your friend to choose seats and book together in real time.
        </p>

        {error && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)',
              color: 'var(--color-error)',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '18px',
              textAlign: 'left',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleJoin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => {
                setError('')
                setCode(e.target.value.toUpperCase())
              }}
              placeholder="e.g. XS48S6"
              style={{
                width: '100%',
                height: '56px',
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 900,
                letterSpacing: '0.25em',
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--text-primary)',
                background: 'var(--bg-elevated)',
                border: '2px solid rgba(155, 93, 229, 0.4)',
                borderRadius: 'var(--radius-lg)',
                outline: 'none',
                transition: 'all var(--transition-base)',
                textTransform: 'uppercase',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand-purple)'
                e.target.style.boxShadow = '0 0 0 4px rgba(155, 93, 229, 0.18)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(155, 93, 229, 0.4)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            iconRight={<ArrowRight size={16} />}
            style={{
              background: 'linear-gradient(135deg, var(--brand-red) 0%, var(--brand-purple) 100%)',
              fontWeight: 800,
            }}
          >
            Join Live Seating Map
          </Button>
        </form>
      </div>
    </div>
  )
}
