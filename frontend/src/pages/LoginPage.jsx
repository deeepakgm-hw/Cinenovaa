import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'
import { authApi } from '../services/api'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Input from '../components/Input'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef([])

  useEffect(() => {
    let iv = null
    if (resendTimer > 0) {
      iv = setInterval(() => setResendTimer(p => p - 1), 1000)
    }
    return () => clearInterval(iv)
  }, [resendTimer])

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) { setError('Please enter a valid email address.'); return }
    setError(''); setSuccessMsg(''); setLoading(true)
    try {
      await authApi.sendOtp({ email })
      setSuccessMsg('Verification code sent to your email! Check your inbox (and spam folder).')
      setOtp(['', '', '', '', '', ''])
      setStep(2)
      setResendTimer(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 200)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code. Please try again.')
    } finally { setLoading(false) }
  }

  const handleContinueAsGuest = () => {
    const guestUser = {
      id: 999999,
      username: 'Guest User',
      email: 'guest@cinenova.app',
      role: 'USER',
      isGuest: true
    }
    localStorage.setItem('user', JSON.stringify(guestUser))
    localStorage.setItem('sessionId', 'guest_' + Date.now())
    navigate('/movies')
  }

  const handleGoogleSuccess = async (googleResponse) => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.googleAuth({ credential: googleResponse.credential })
      if (res.data.success) {
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('sessionId', res.data.sessionId)
        setSuccessMsg(`Welcome, ${res.data.user.username}! Redirecting...`)
        setTimeout(() => navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/movies'), 800)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleClick = async () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (window.google?.accounts?.oauth2 && googleClientId) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setError('Google sign in was cancelled.')
              return
            }
            if (tokenResponse.access_token) {
              setLoading(true)
              setError('')
              try {
                const userRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                })
                if (userRes.data?.email) {
                  const res = await authApi.googleAuth({
                    email: userRes.data.email,
                    name: userRes.data.name || userRes.data.email.split('@')[0]
                  })
                  if (res.data.success) {
                    localStorage.setItem('user', JSON.stringify(res.data.user))
                    localStorage.setItem('sessionId', res.data.sessionId)
                    setSuccessMsg(`Welcome, ${res.data.user.username}! Redirecting...`)
                    setTimeout(() => navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/movies'), 800)
                  }
                }
              } catch (err) {
                setError('Failed to retrieve Google profile.')
              } finally {
                setLoading(false)
              }
            }
          }
        })
        tokenClient.requestAccessToken()
        return
      } catch (err) {
        console.warn('OAuth2 client init failed, trying prompt:', err)
      }
    }

    if (window.google?.accounts?.id && googleClientId) {
      window.google.accounts.id.prompt()
      return
    }

    const promptEmail = prompt('Enter your Google email address:', email || 'deeepakgm@gmail.com')
    if (promptEmail && promptEmail.includes('@')) {
      setLoading(true)
      setError('')
      try {
        const res = await authApi.googleAuth({ email: promptEmail })
        if (res.data.success) {
          localStorage.setItem('user', JSON.stringify(res.data.user))
          localStorage.setItem('sessionId', res.data.sessionId)
          navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/movies')
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to sign in with Google.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleVerifyOtp = async () => {
    const code = otp.join('')
    if (code.length !== 6) { setError('Please enter the complete 6-digit code.'); return }
    setError(''); setLoading(true)
    try {
      const res = await authApi.verifyOtp({ email, otp: code })
      if (res.data.success) {
        localStorage.setItem('user', JSON.stringify(res.data.user))
        localStorage.setItem('sessionId', res.data.sessionId)
        setTimeout(() => navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/movies'), 800)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!googleClientId) return

    const loadGoogleScript = () => {
      if (document.getElementById('google-client-script')) return
      const script = document.createElement('script')
      script.id = 'google-client-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleSuccess
          })
        }
      }
      document.body.appendChild(script)
    }

    loadGoogleScript()
  }, [])

  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    paste.split('').forEach((d, i) => { if (i < 6) next[i] = d })
    setOtp(next)
    const lastFilled = Math.min(paste.length, 5)
    otpRefs.current[lastFilled]?.focus()
  }

  const allFilled = otp.every(d => d !== '')

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Ambient gradients */}
      <div style={{
        position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(155,93,229,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '0', right: '0',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(232,54,74,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          padding: '40px 36px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ── STEP 1: Email ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Badge variant="red">Premium Portal</Badge>
              <h1 style={{ fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: '32px', letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1 }}>
                Cine<span style={{ color: 'var(--brand-red)' }}>Nova</span>
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                Sign in to book tickets and track your orders
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', color: 'var(--color-error)', fontSize: '12px', fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Email Input */}
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="name@domain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              iconLeft={<Mail size={15} />}
              onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
              autoFocus
            />

            {/* CTA */}
            <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleSendOtp}>
              Send Verification Code
            </Button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            </div>

            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleClick}
              style={{
                width: '100%',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f3f4f6'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(255,255,255,0.18)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Guest */}
            <Button variant="ghost" size="md" fullWidth onClick={handleContinueAsGuest}>
              Continue as Guest
            </Button>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Back link */}
            <button
              onClick={() => { setStep(1); setError(''); setSuccessMsg(''); setOtp(['','','','','','']) }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', padding: 0 }}
            >
              <ArrowLeft size={15} /> Back
            </button>

            {/* Heading */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: '24px', color: 'var(--text-primary)', margin: 0 }}>
                Check your inbox
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                We sent a code to{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{email}</span>
              </p>
            </div>

            {/* Success banner */}
            {successMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', color: 'var(--color-success)', fontSize: '12px', fontWeight: 600 }}>
                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                {successMsg}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--color-error-bg)', border: '1px solid var(--color-error-border)', color: 'var(--color-error)', fontSize: '12px', fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* 6-box OTP */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => otpRefs.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  onPaste={idx === 0 ? handleOtpPaste : undefined}
                  style={{
                    width: '48px',
                    height: '58px',
                    textAlign: 'center',
                    fontSize: '22px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-elevated)',
                    border: `2px solid ${digit ? 'rgba(232,54,74,0.5)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-md)',
                    outline: 'none',
                    transition: 'all var(--transition-base)',
                    caretColor: 'var(--brand-red)',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--border-active)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(232,54,74,0.15)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = digit ? 'rgba(232,54,74,0.5)' : 'var(--border-default)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              ))}
            </div>

            {/* Verify */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={!allFilled}
              onClick={handleVerifyOtp}
            >
              Verify &amp; Sign In
            </Button>

            {/* Resend row */}
            <div style={{ textAlign: 'center' }}>
              {resendTimer > 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                  Resend in {resendTimer}s
                </span>
              ) : (
                <button
                  onClick={handleSendOtp}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--brand-red)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                  <RefreshCw size={13} /> Resend Code
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
