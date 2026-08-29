import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, ChevronDown, LogOut, Users } from 'lucide-react'
import JoinGroupModal from './JoinGroupModal'
import HalfwaveBadge from './HalfwaveBadge'

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
      <div
        className="px-3 sm:px-6"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: '100%',
        }}
      >

        {/* ── Logo ── */}
        <Link to="/movies" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 900,
            fontSize: '19px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Cine<span style={{ color: 'var(--brand-red)' }}>Nova</span>
          </span>
          <HalfwaveBadge size="xs" prefix="by" style={{ marginTop: '2px' }} />
        </Link>

        {/* ── Search Bar ── */}
        {onSearch !== undefined && (
          <div
            className="hidden md:flex"
            style={{
              flex: 1,
              maxWidth: '400px',
              position: 'relative',
              alignItems: 'center',
            }}
          >
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>

          {/* Join Group Booking Button */}
          <button
            onClick={() => setShowJoinModal(true)}
            title="Join Group Booking"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              background: 'var(--bg-elevated)',
              border: '1px solid rgba(155,93,229,0.35)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--text-primary)',
              fontSize: '11px',
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
            <Users size={13} style={{ color: '#c084fc', flexShrink: 0 }} />
            <span className="hidden sm:inline">Join Group</span>
            <span className="sm:hidden">Join</span>
          </button>

          {/* Location Pill */}
          {selectedCity && (
            <button
              onClick={onCityClick}
              title={`Selected City: ${selectedCity.name}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 9px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-primary)',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                whiteSpace: 'nowrap',
                maxWidth: '110px',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-active)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
            >
              <MapPin size={12} style={{ color: 'var(--brand-red)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCity.name}</span>
              <ChevronDown size={11} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
            </button>
          )}

          {/* Greeting - only on larger screens */}
          {user && (
            <span className="hidden md:inline" style={{ fontSize: '12px', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hi, </span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{user.username}</span>
            </span>
          )}

          {/* Sign Out */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="cn-btn cn-btn-secondary"
              title="Sign Out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 9px',
                height: '30px',
                fontSize: '11px',
              }}
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
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Join Group Modal */}
      <JoinGroupModal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} />
    </header>
  )
}
