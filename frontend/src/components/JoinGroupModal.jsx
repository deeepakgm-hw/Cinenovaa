import { useState } from 'react'
import { createPortal } from 'react-dom'
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
      setError('Please enter the full 6-character session code.')
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

  // Use createPortal to mount directly to document.body, completely outside of navbar/header constraints
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(2, 3, 6, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#0d0f18',
          border: '1px solid rgba(155, 93, 229, 0.35)',
          borderRadius: '24px',
          padding: '36px 30px',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 50px rgba(155, 93, 229, 0.15)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          transform: 'translateY(0)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <X size={16} />
        </button>

        {/* Icon & Badge */}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(155, 93, 229, 0.12)',
            border: '1px solid rgba(155, 93, 229, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <Users size={28} color="var(--brand-purple)" />
        </div>

        <Badge variant="purple">Real-Time Multiplayer</Badge>

        <h3
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 900,
            fontSize: '24px',
            color: 'var(--text-primary)',
            margin: '14px 0 8px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Join Group Booking
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: '0 0 26px 0',
            lineHeight: 1.6,
            maxWidth: '360px',
          }}
        >
          Enter the 6-character code shared by your friend to join the live seat selection room together.
        </p>

        {error && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'var(--color-error-bg)',
              border: '1px solid var(--color-error-border)',
              color: 'var(--color-error)',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleJoin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
              Session Code
            </span>
            <input
              type="text"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => {
                setError('')
                setCode(e.target.value.toUpperCase())
              }}
              placeholder="XS48S6"
              style={{
                width: '100%',
                height: '60px',
                textAlign: 'center',
                fontSize: '26px',
                fontWeight: 900,
                letterSpacing: '0.25em',
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--text-primary)',
                background: 'var(--bg-elevated)',
                border: '2px solid rgba(155, 93, 229, 0.4)',
                borderRadius: '16px',
                outline: 'none',
                transition: 'all var(--transition-base)',
                textTransform: 'uppercase',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--brand-purple)'
                e.target.style.boxShadow = '0 0 0 4px rgba(155, 93, 229, 0.2)'
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
              height: '48px',
            }}
          >
            Enter Seating Map
          </Button>
        </form>
      </div>
    </div>,
    document.body
  )
}
