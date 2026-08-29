import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, ChevronDown, LogOut, Users } from 'lucide-react'
import JoinGroupModal from './JoinGroupModal'

export default function NavBar({
  search = '',
  onSearch,
  selectedCity,
  onCityClick,
  user,
  onLogout,
}) {
  const [showJoinModal, setShowJoinModal] = useState(false)
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 'var(--z-modal)',
      height: '64px',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      background: 'rgba(8,10,15,0.72)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 24px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>

        {/* ── Logo ── */}
        <Link to="/movies" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 900,
            fontSize: '22px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Cine<span style={{ color: 'var(--brand-red)' }}>Nova</span>
          </span>
        </Link>

        {/* ── Search Bar ── */}
        {onSearch !== undefined && (
          <div style={{
            flex: 1,
            maxWidth: '400px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '14px',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search title, genre, cast..."
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-pill)',
                padding: '9px 16px 9px 38px',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all var(--transition-base)',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--border-active)'
                e.target.style.boxShadow = '0 0 0 3px rgba(232,54,74,0.12)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--border-default)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        )}

        {/* ── Right Cluster ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          {/* Join Group Booking Button */}
          <button
            onClick={() => setShowJoinModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(155,93,229,0.35)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--brand-purple)'
              e.currentTarget.style.boxShadow = '0 0 10px rgba(155,93,229,0.2)'
              e.currentTarget.style.color = '#c084fc'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(155,93,229,0.35)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
          >
            <Users size={14} style={{ color: '#c084fc', flexShrink: 0 }} />
            <span>Join Group</span>
          </button>

          {/* Location Pill */}
          {selectedCity && (
            <button
              onClick={onCityClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
            >
              <MapPin size={14} style={{ color: 'var(--brand-red)', flexShrink: 0 }} />
              <span>{selectedCity.name}</span>
              <ChevronDown size={13} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          )}

          {/* Greeting */}
          {user && (
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hi, </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{user.username}</span>
            </span>
          )}

          {/* Sign Out */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="cn-btn cn-btn-secondary cn-btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--border-active)'
                e.currentTarget.style.color = 'var(--brand-red)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = ''
                e.currentTarget.style.color = ''
              }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Join Group Modal */}
      <JoinGroupModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </header>
  )
}
