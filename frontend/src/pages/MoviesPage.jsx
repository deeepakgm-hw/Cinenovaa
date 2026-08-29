import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame, Sparkles, Star, Film, X, ArrowLeft, Clock, MapPin,
  Users, Ticket, BadgeCheck, ChevronRight, Copy, CheckCircle, Phone
} from 'lucide-react'
import { movieApi } from '../services/api'
import { API_ORIGIN, API_BASE_URL } from '../config/apiConfig'
import NavBar from '../components/NavBar'
import MovieCard from '../components/MovieCard'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Input from '../components/Input'
import ShowtimeChip from '../components/ShowtimeChip'
import HalfwaveBadge from '../components/HalfwaveBadge'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'

/* ── Helpers ── */
const getMovieImageUrl = (movie, isBackdrop = false) => {
  if (!movie) return `${API_ORIGIN}/resources/images/posters/default_poster.png`
  if (isBackdrop) {
    const bd = movie.backdrop_url || movie.backdropUrl
    if (!bd) {
      const apiId = movie.movieApiId || movie.movie_api_id
      if (apiId) return `${API_ORIGIN}/resources/cache/posters/${apiId}.jpg`
      const pu = movie.poster_url || movie.posterUrl
      return pu ? (pu.startsWith('http') ? pu : `${API_ORIGIN}/${pu}`) : `${API_ORIGIN}/resources/images/posters/default_poster.png`
    }
    return bd.startsWith('http') ? bd : `${API_ORIGIN}/${bd}`
  }
  const apiId = movie.movieApiId || movie.movie_api_id
  if (apiId) return `${API_ORIGIN}/resources/cache/posters/${apiId}.jpg`
  const url = movie.poster_url || movie.posterUrl
  if (!url) return `${API_ORIGIN}/resources/images/posters/default_poster.png`
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_ORIGIN}/${url}`
}

const fmtTime = (s) => {
  try { return new Date(s).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) } catch { return s }
}
const fmtDate = (s) => {
  try { return new Date(s).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) } catch { return '' }
}
const isPast = (s) => new Date(s) < new Date()

/* ── Styles ── */
const S = {
  page: { minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-body)', color: 'var(--text-primary)', paddingBottom: '64px' },
  sectionHead: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  sectionSub: { fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' },
  modalBackdrop: { position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(4,5,10,0.80)', backdropFilter: 'blur(12px)' },
  label: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' },
  formInput: { width: '100%', height: '42px', padding: '0 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none' },
  formSelect: { width: '100%', height: '42px', padding: '0 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' },
}

export default function MoviesPage() {
  const navigate = useNavigate()
  const [nowShowing, setNowShowing]   = useState([])
  const [upcoming, setUpcoming]       = useState([])
  const [popular, setPopular]         = useState([])
  const [recommended, setRecommended] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [search, setSearch]           = useState('')
  const [cities, setCities]           = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [showCityModal, setShowCityModal] = useState(false)
  const [spotlightMovie, setSpotlightMovie] = useState(null)
  const [selectedDetailMovie, setSelectedDetailMovie] = useState(null)
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [theatres, setTheatres]       = useState([])
  const [selectedTheatre, setSelectedTheatre] = useState(null)
  const [showtimes, setShowtimes]     = useState([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const [expandedTheatreId, setExpandedTheatreId] = useState(null)
  const [allMovieShowtimes, setAllMovieShowtimes] = useState([])
  const [showGroupBooking, setShowGroupBooking]   = useState(false)
  const [groupBookingSubmitted, setGroupBookingSubmitted] = useState(false)
  const [groupSize, setGroupSize]     = useState(15)
  const [groupDate, setGroupDate]     = useState('')
  const [groupFormat, setGroupFormat] = useState('2D')
  const [groupContact, setGroupContact] = useState('')
  const [groupSessionData, setGroupSessionData] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [bookingModeShowtime, setBookingModeShowtime] = useState(null)
  const [bookingMode, setBookingMode] = useState(null) // 'solo' | 'group'
  const [user, setUser]               = useState(null)
  const [gpsCoords, setGpsCoords]     = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    setUser(JSON.parse(stored))
    fetchCities()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setGpsCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {}
      )
    }
  }, [])

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      try { const r = await movieApi.search(search); setSearchResults(r.data) } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchCities = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/cities`)
      setCities(r.data)
      const stored = localStorage.getItem('selectedCity')
      if (stored) { const c = JSON.parse(stored); setSelectedCity(c); fetchDashboard(c.id) }
      else if (r.data.length > 0) setShowCityModal(true)
    } catch {}
  }

  const fetchDashboard = async (cityId) => {
    try {
      const [rNow, rUp, rPop] = await Promise.all([
        movieApi.list(cityId), movieApi.upcoming(), movieApi.popular()
      ])
      setNowShowing(rNow.data); setUpcoming(rUp.data); setPopular(rPop.data)
      if (rPop.data.length > 0) setSpotlightMovie(rPop.data[0])
      else if (rNow.data.length > 0) setSpotlightMovie(rNow.data[0])
      const merged = {}
      ;[...rNow.data, ...rPop.data, ...rUp.data].forEach(m => { merged[m.id] = m })
      setRecommended(Object.values(merged).filter(m => m.rating && parseFloat(m.rating) >= 7.8).slice(0, 8))
    } catch {}
  }

  const handleCitySelect = (city) => {
    localStorage.setItem('selectedCity', JSON.stringify(city))
    setSelectedCity(city); setShowCityModal(false); fetchDashboard(city.id)
  }

  const handleBookClick = async (movie) => {
    setSelectedMovie(movie); setSelectedTheatre(null); setBookingStep(1)
    setExpandedTheatreId(null); setShowGroupBooking(false); setGroupBookingSubmitted(false)
    setBookingModeShowtime(null); setBookingMode(null)
    setGroupSize(15); setGroupDate(''); setGroupFormat('2D'); setGroupContact('')
    try {
      const cityId = selectedCity?.id
      if (!cityId) { setShowCityModal(true); return }
      let url = `${API_BASE_URL}/theatres?cityId=${cityId}&movieId=${movie.id}`
      if (gpsCoords) url += `&lat=${gpsCoords.lat}&lng=${gpsCoords.lng}`
      const [rT, rSt] = await Promise.all([
        axios.get(url),
        axios.get(`${API_BASE_URL}/showtimes?movieId=${movie.id}`)
      ])
      setTheatres(rT.data); setAllMovieShowtimes(rSt.data); setShowBookingModal(true)
    } catch { alert('Error loading theatres for ' + movie.title) }
  }

  const handleTheatreSelect = async (theatre) => {
    setSelectedTheatre(theatre)
    try {
      const r = await axios.get(`${API_BASE_URL}/showtimes?movieId=${selectedMovie.id}&theatreId=${theatre.id}`)
      setShowtimes(r.data); setBookingStep(2)
    } catch {}
  }

  const selectShowtime = (st) => {
    sessionStorage.setItem('selectedShowtime', JSON.stringify(st))
    sessionStorage.setItem('selectedMovie', JSON.stringify(selectedMovie))
    setShowBookingModal(false)
    navigate(`/seats?showtimeId=${st.id}`)
  }

  const handleCreateGroupSession = async (st) => {
    if (!user) { alert('Please log in to create a group session.'); return }
    try {
      const r = await axios.post(`${API_BASE_URL}/group-sessions`, { showtimeId: st.id, organiserUserId: user.id })
      if (r.data.success) {
        sessionStorage.setItem(`created_session_${r.data.sessionCode}`, 'true')
        setGroupSessionData(r.data);
        setShowBookingModal(false);
        setShowShareModal(true);
      }
    } catch (err) { alert(err.response?.data?.message || 'Failed to create group session.') }
  }

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate('/') }

  const isSearching = search.trim().length > 0

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div style={S.page}>
      <NavBar
        search={search}
        onSearch={setSearch}
        selectedCity={selectedCity}
        onCityClick={() => setShowCityModal(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* ── Hero ── */}
      {!isSearching && spotlightMovie && (
        <div className="cn-hero">
          <img
            src={getMovieImageUrl(spotlightMovie, true)}
            alt={spotlightMovie.title}
            onError={e => { const fb = spotlightMovie.backdrop_url || spotlightMovie.poster_url; if (e.target.src !== fb && fb) e.target.src = fb }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
          />
          {/* Left-heavy gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(8,10,15,0.98) 0%, rgba(8,10,15,0.88) 40%, rgba(8,10,15,0.3) 75%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,10,15,1) 0%, rgba(8,10,15,0.6) 35%, transparent 70%)' }} />

          {/* Content */}
          <div className="cn-hero-content">
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <Badge variant="red">Spotlight</Badge>
              {spotlightMovie.rating && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', borderRadius: 'var(--radius-sm)', padding: '2px 8px', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <Star size={10} fill="#f59e0b" color="#f59e0b" /> {parseFloat(spotlightMovie.rating).toFixed(1)}
                </span>
              )}
              {spotlightMovie.duration && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <Clock size={11} /> {spotlightMovie.duration} mins
                </span>
              )}
              {spotlightMovie.language && (
                <Badge variant="purple">{spotlightMovie.language}</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="cn-hero-title">
              {spotlightMovie.title}
            </h1>

            {/* Description */}
            <p className="cn-hero-desc">
              {spotlightMovie.description}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Button variant="primary" size="md" iconLeft={<Ticket size={15} />} onClick={() => handleBookClick(spotlightMovie)}>
                Book Tickets
              </Button>
              <Button variant="secondary" size="md" onClick={() => setSelectedDetailMovie(spotlightMovie)}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="cn-main-content">
        {isSearching ? (
          <section className="animate-fade-in">
            <div style={S.sectionHead}>
              <div>
                <p style={S.sectionTitle}>Search Results</p>
                <p style={S.sectionSub}>Showing matches for "{search}"</p>
              </div>
            </div>
            {searchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-tertiary)' }}>
                No movies matching "{search}"
              </div>
            ) : (
              <div className="cn-movies-grid">
                {searchResults.map(m => <MovieCard key={m.id} movie={m} onBook={() => handleBookClick(m)} onDetail={() => setSelectedDetailMovie(m)} />)}
              </div>
            )}
          </section>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

            {/* Now Showing */}
            <section>
              <div style={S.sectionHead}>
                <div>
                  <div style={S.sectionTitle}>
                    <Flame size={20} color="var(--brand-red)" />
                    Now Showing {selectedCity && `in ${selectedCity.name}`}
                  </div>
                  <p style={S.sectionSub}>Top selections currently in theatres</p>
                </div>
              </div>
              {nowShowing.length === 0 ? (
                <EmptyState text={`No movies showing in ${selectedCity?.name || 'your city'}`} />
              ) : (
                <div className="cn-movies-grid">{nowShowing.map(m => <MovieCard key={m.id} movie={m} onBook={() => handleBookClick(m)} onDetail={() => setSelectedDetailMovie(m)} />)}</div>
              )}
            </section>

            {/* Coming Soon */}
            <section>
              <div style={S.sectionHead}>
                <div>
                  <div style={S.sectionTitle}><Sparkles size={18} color="var(--brand-purple)" /> Coming Soon</div>
                  <p style={S.sectionSub}>Highly anticipated upcoming releases</p>
                </div>
              </div>
              {upcoming.length === 0 ? <EmptyState text="No upcoming releases" /> : (
                <div className="cn-movies-grid">{upcoming.slice(0, 8).map(m => <MovieCard key={m.id} movie={m} onBook={() => handleBookClick(m)} onDetail={() => setSelectedDetailMovie(m)} />)}</div>
              )}
            </section>

            {/* Popular */}
            <section>
              <div style={S.sectionHead}>
                <div>
                  <div style={S.sectionTitle}><Star size={18} color="#f59e0b" fill="#f59e0b" /> Popular Movies</div>
                  <p style={S.sectionSub}>Most watched blockbusters</p>
                </div>
              </div>
              {popular.length === 0 ? <EmptyState text="No popular movies" /> : (
                <div className="cn-movies-grid">{popular.slice(0, 8).map(m => <MovieCard key={m.id} movie={m} onBook={() => handleBookClick(m)} onDetail={() => setSelectedDetailMovie(m)} />)}</div>
              )}
            </section>

            {/* Recommended */}
            <section>
              <div style={S.sectionHead}>
                <div>
                  <div style={S.sectionTitle}><Film size={18} color="var(--brand-red)" /> Recommended</div>
                  <p style={S.sectionSub}>Curated picks rated above 7.8</p>
                </div>
              </div>
              {recommended.length === 0 ? <EmptyState text="No recommendations available" /> : (
                <div className="cn-movies-grid">{recommended.map(m => <MovieCard key={m.id} movie={m} onBook={() => handleBookClick(m)} onDetail={() => setSelectedDetailMovie(m)} />)}</div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(8,10,15,0.6)',
        padding: '36px 16px 40px',
        marginTop: '64px',
        textAlign: 'center',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 900,
              fontSize: '20px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              Cine<span style={{ color: 'var(--brand-red)' }}>Nova</span>
            </span>
            <span style={{ color: 'var(--border-default)' }}>•</span>
            <HalfwaveBadge size="md" prefix="by" />
          </div>

          <p style={{
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            margin: 0,
            maxWidth: '520px',
            lineHeight: 1.5,
          }}>
            Next-generation multiplex ticketing & group booking synchronization experience. Powered by Halfwave Platforms.
          </p>

          <div style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            marginTop: '4px',
          }}>
            © {new Date().getFullYear()} CineNova. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ═══════════════ CITY MODAL ═══════════════ */}
      {showCityModal && (
        <div style={S.modalBackdrop}>
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-modal)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '28px 20px', position: 'relative', boxShadow: 'var(--shadow-lg)' }}>
            {selectedCity && (
              <button onClick={() => setShowCityModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', width: '34px', height: '34px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all var(--transition-base)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.querySelector('svg').style.color = 'var(--brand-red)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.querySelector('svg').style.color = '' }}
              ><X size={16} /></button>
            )}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Badge variant="red" icon={<MapPin size={11} />}>Location Selection</Badge>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: '24px', color: 'var(--text-primary)', margin: '14px 0 6px' }}>Select Your City</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Browse theatres and showtimes for your city</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
              {cities.map(c => (
                <div key={c.id} onClick={() => handleCitySelect(c)} style={{ padding: '16px 8px', borderRadius: 'var(--radius-lg)', border: `1px solid ${selectedCity?.id === c.id ? 'var(--border-active)' : 'var(--border-subtle)'}`, background: selectedCity?.id === c.id ? 'rgba(232,54,74,0.08)' : 'var(--bg-elevated)', cursor: 'pointer', textAlign: 'center', transition: 'all var(--transition-base)', color: selectedCity?.id === c.id ? 'var(--brand-red)' : 'var(--text-secondary)', fontWeight: 700, fontSize: '12px' }}
                  onMouseEnter={e => { if (selectedCity?.id !== c.id) { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-primary)' }}}
                  onMouseLeave={e => { if (selectedCity?.id !== c.id) { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}}
                >
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ DETAIL MODAL ═══════════════ */}
      {selectedDetailMovie && (
        <div style={{ ...S.modalBackdrop, alignItems: 'flex-start', overflowY: 'auto' }}>
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '860px', background: 'var(--bg-modal)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', margin: '16px auto', position: 'relative' }}>
            <button onClick={() => setSelectedDetailMovie(null)} style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={17} />
            </button>
            {/* Hero image */}
            <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
              <img src={getMovieImageUrl(selectedDetailMovie, true)} alt={selectedDetailMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-modal) 0%, transparent 60%)' }} />
            </div>
            <div style={{ display: 'flex', gap: '20px', padding: '16px 20px 24px', flexWrap: 'wrap' }}>
              {/* Poster */}
              <div style={{ width: '110px', marginTop: '-60px', flexShrink: 0 }}>
                <img src={getMovieImageUrl(selectedDetailMovie, false)} alt={selectedDetailMovie.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }} />
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' }}>
                  <Badge variant={selectedDetailMovie.status === 'COMING_SOON' ? 'purple' : 'red'}>
                    {selectedDetailMovie.status === 'COMING_SOON' ? 'Upcoming' : 'Now Showing'}
                  </Badge>
                  {selectedDetailMovie.rating && <Badge variant="gold" icon={<Star size={9} fill="#f59e0b" />}>{parseFloat(selectedDetailMovie.rating).toFixed(1)}</Badge>}
                  {selectedDetailMovie.language && <Badge variant="blue">{selectedDetailMovie.language}</Badge>}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '0.02em', lineHeight: 1 }}>{selectedDetailMovie.title}</h2>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>Genre: <span style={{ color: 'var(--text-secondary)' }}>{selectedDetailMovie.genre || 'Cinema'}</span></span>
                  {selectedDetailMovie.duration && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} /> {selectedDetailMovie.duration} Mins</span>}
                  <span>Released: <span style={{ color: 'var(--text-secondary)' }}>{selectedDetailMovie.release_date || 'N/A'}</span></span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>{selectedDetailMovie.description}</p>
                {selectedDetailMovie.cast_members && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>Starring</span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{selectedDetailMovie.cast_members}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedDetailMovie.status === 'COMING_SOON' ? (
                    <Button variant="primary" size="sm" onClick={() => alert(`We'll notify you on release of ${selectedDetailMovie.title}!`)}>Notify Me</Button>
                  ) : (
                    <Button variant="primary" size="sm" iconLeft={<Ticket size={14} />} onClick={() => { setSelectedDetailMovie(null); handleBookClick(selectedDetailMovie) }}>Book Tickets</Button>
                  )}
                  {selectedDetailMovie.trailer_url && (
                    <a href={selectedDetailMovie.trailer_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" size="sm">Watch Trailer <ChevronRight size={13} /></Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ BOOKING MODAL ═══════════════ */}
      {showBookingModal && selectedMovie && (
        <div style={{ ...S.modalBackdrop, alignItems: 'flex-start', overflowY: 'auto' }}>
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '700px', background: 'var(--bg-modal)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '22px 18px', position: 'relative', boxShadow: 'var(--shadow-lg)', margin: '16px auto', maxHeight: '92vh', overflowY: 'auto' }}>

            {/* Close */}
            <button onClick={() => setShowBookingModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', width: '34px', height: '34px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all var(--transition-base)', zIndex: 10 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.querySelector('svg').style.color = 'var(--brand-red)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.querySelector('svg').style.color = '' }}
            ><X size={16} /></button>

            {/* Movie header */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px', paddingRight: '40px' }}>
              <div style={{ width: '56px', height: '76px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                <img src={getMovieImageUrl(selectedMovie, false)} alt={selectedMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px', alignItems: 'center' }}>
                  <Badge variant={selectedMovie.status === 'COMING_SOON' ? 'purple' : 'red'}>{selectedMovie.status === 'COMING_SOON' ? 'Upcoming' : 'Now Showing'}</Badge>
                  {selectedMovie.rating && <Badge variant="gold" icon={<Star size={9} fill="#f59e0b" />}>{parseFloat(selectedMovie.rating) > 0 ? parseFloat(selectedMovie.rating).toFixed(1) : '9.0'}</Badge>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}><Clock size={11} /> {selectedMovie.duration}m</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedMovie.title}</h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                  {selectedMovie.genre && selectedMovie.genre.split(',').slice(0, 2).map((g, i) => <Badge key={i} variant="ghost">{g.trim()}</Badge>)}
                  {selectedMovie.language && <Badge variant="purple">{selectedMovie.language}</Badge>}
                </div>
              </div>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '8px' }}>
              <Badge variant="red">{bookingModeShowtime ? 'Select Booking Mode' : bookingStep === 1 ? 'Select Theatre' : 'Select Showtime'}</Badge>
              {bookingStep === 2 && !bookingModeShowtime && (
                <button onClick={() => setBookingStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: '5px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all var(--transition-base)' }}>
                  <ArrowLeft size={12} /> Back to Theatres
                </button>
              )}
            </div>

            {/* ── BOOKING MODE SELECTOR ── */}
            {bookingModeShowtime ? (
              <div className="animate-fade-in">
                <button onClick={() => setBookingModeShowtime(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: '5px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: '16px', transition: 'all var(--transition-base)' }}>
                  <ArrowLeft size={12} /> Back to Showtimes
                </button>

                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                    Booking for <strong style={{ color: 'var(--text-primary)' }}>{bookingModeShowtime.screenName}</strong> at <strong style={{ color: 'var(--text-primary)' }}>{fmtTime(bookingModeShowtime.showTime)}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Standard */}
                  <ModeCard
                    selected={bookingMode === 'solo'}
                    onClick={() => { setBookingMode('solo'); const st = bookingModeShowtime; setBookingModeShowtime(null); selectShowtime(st) }}
                    icon={<Ticket size={20} />}
                    title="Standard Booking"
                    desc="Direct checkout. Select seats for yourself or buy multiple tickets at once."
                  />
                  {/* Group Sync */}
                  <ModeCard
                    selected={bookingMode === 'group'}
                    onClick={() => { setBookingMode('group'); const st = bookingModeShowtime; setBookingModeShowtime(null); handleCreateGroupSession(st) }}
                    icon={<Users size={20} />}
                    title="Group Seat Sync"
                    desc="Real-time multiplayer. Invite up to 6 friends to pick seats together live!"
                    accent="purple"
                  />
                </div>
              </div>

            ) : bookingStep === 1 ? (
              /* ── THEATRE LIST ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>

                {/* Corporate Banner */}
                {!showGroupBooking && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(155,93,229,0.12)', border: '1px solid rgba(155,93,229,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={18} color="var(--brand-purple)" />
                    </div>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>Corporate &amp; Group Bookings</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>Planning a party or private screening? Custom pricing for 10+ guests.</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => { setShowGroupBooking(true); setGroupBookingSubmitted(false) }}>Enquire</Button>
                  </div>
                )}

                {showGroupBooking ? (
                  <GroupBookingForm
                    submitted={groupBookingSubmitted}
                    onSubmit={() => setGroupBookingSubmitted(true)}
                    onBack={() => setShowGroupBooking(false)}
                    groupSize={groupSize} setGroupSize={setGroupSize}
                    groupDate={groupDate} setGroupDate={setGroupDate}
                    groupFormat={groupFormat} setGroupFormat={setGroupFormat}
                    groupContact={groupContact} setGroupContact={setGroupContact}
                  />
                ) : theatres.length === 0 ? (
                  <EmptyState text="No theatres currently hosting this movie in your city." />
                ) : (
                  theatres.map(th => {
                    const thSt = allMovieShowtimes.filter(s => s.theatreId === th.id)
                    const sorted = [...thSt].sort((a, b) => new Date(a.showTime) - new Date(b.showTime))
                    const minPrice = sorted.length > 0 ? Math.min(...sorted.map(s => s.price)) : 220
                    const isExp = expandedTheatreId === th.id
                    const imgUrl = th.image_url ? (th.image_url.startsWith('http') ? th.image_url : `${API_ORIGIN}${th.image_url}`) : `${API_ORIGIN}/resources/images/posters/default_poster.png`
                    const amenities = th.amenities ? th.amenities.split(',').map(a => a.trim()) : []

                    return (
                      <div key={th.id} style={{ borderRadius: 'var(--radius-lg)', border: `1px solid ${isExp ? 'var(--border-active)' : 'var(--border-subtle)'}`, background: isExp ? 'rgba(232,54,74,0.04)' : 'var(--bg-surface)', overflow: 'hidden', transition: 'all var(--transition-base)' }}>
                        {/* Header */}
                        <div onClick={() => setExpandedTheatreId(isExp ? null : th.id)} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 14px', cursor: 'pointer' }}>
                          <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                            <img src={imgUrl} alt={th.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '3px', alignItems: 'center' }}>
                              <Badge variant="purple">{th.theatre_type || 'Multiplex'}</Badge>
                              {th.rating && <Badge variant="gold" icon={<Star size={8} fill="#f59e0b" />}>{parseFloat(th.rating).toFixed(1)}</Badge>}
                              {th.distance != null && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {th.distance} km</span>}
                            </div>
                            <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{th.name}</h4>
                            <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{th.location}</p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{ fontSize: '9px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>Starts From</p>
                            <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand-red)', margin: 0 }}>₹{parseFloat(minPrice).toFixed(0)}</p>
                          </div>
                        </div>

                        {/* Quick showtimes row (collapsed) */}
                        {!isExp && sorted.length > 0 && (
                          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {sorted.slice(0, 4).map(st => (
                                <ShowtimeChip key={st.id} time={fmtTime(st.showTime)} state={isPast(st.showTime) ? 'past' : 'available'} onClick={e => { e?.stopPropagation(); setBookingModeShowtime(st) }} />
                              ))}
                              {sorted.length > 4 && (
                                <button onClick={e => { e.stopPropagation(); setExpandedTheatreId(th.id) }} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', fontSize: '11px', fontWeight: 700, color: 'var(--brand-red)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>+{sorted.length - 4} More</button>
                              )}
                            </div>
                            {sorted[0] && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Next: {fmtTime(sorted[0].showTime)}</span>}
                          </div>
                        )}

                        {/* Expanded */}
                        {isExp && (
                          <div style={{ padding: '20px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Amenities */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {amenities.includes('Parking') && <Badge variant="ghost">Parking</Badge>}
                              {amenities.includes('Food Court') && <Badge variant="ghost">Food Court</Badge>}
                              {amenities.includes('Recliners') && <Badge variant="gold">Recliners</Badge>}
                              {amenities.includes('IMAX Laser') && <Badge variant="purple">IMAX Laser</Badge>}
                              <Badge variant="ghost">Accessible</Badge>
                            </div>
                            {/* All showtimes */}
                            <div>
                              <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>All Available Showtimes</p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {sorted.map(st => (
                                  <ShowtimeChip key={st.id} time={`${fmtTime(st.showTime)} · ₹${parseFloat(st.price).toFixed(0)}`} state={isPast(st.showTime) ? 'past' : 'available'} onClick={() => setBookingModeShowtime(st)} />
                                ))}
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                              <Button variant="secondary" size="sm" onClick={() => setExpandedTheatreId(null)}>Collapse</Button>
                              <Button variant="primary" size="sm" onClick={() => handleTheatreSelect(th)}>Select Theatre</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              /* ── SHOWTIME FALLBACK ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                {showtimes.length === 0 ? (
                  <EmptyState text={`No showtimes at ${selectedTheatre?.name}`} />
                ) : showtimes.map(st => (
                  <div key={st.id} onClick={() => setBookingModeShowtime(st)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all var(--transition-base)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.background = 'rgba(232,54,74,0.04)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-surface)' }}
                  >
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <Badge variant="purple">{st.screenType || 'Regular'}</Badge>
                        <Badge variant="ghost">{st.showType || '2D'}</Badge>
                      </div>
                      <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 3px' }}>{fmtTime(st.showTime)} <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>({fmtDate(st.showTime)})</span></p>
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, margin: 0 }}>{st.screenName}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b', margin: '0 0 4px' }}>₹{parseFloat(st.price).toFixed(0)}</p>
                      <ChevronRight size={16} color="var(--brand-red)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ GROUP SHARE MODAL ═══════════════ */}
      {showShareModal && groupSessionData && (
        <div style={S.modalBackdrop}>
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-modal)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '24px 18px', position: 'relative', boxShadow: 'var(--shadow-lg)', maxHeight: '92vh', overflowY: 'auto' }}>
            <button onClick={() => setShowShareModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', width: '34px', height: '34px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <X size={16} />
            </button>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(155,93,229,0.12)', border: '1px solid rgba(155,93,229,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="var(--brand-purple)" />
              </div>
              <Badge variant="purple">Real-Time Multiplayer</Badge>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: '22px', color: 'var(--text-primary)', margin: 0 }}>Group Session Created</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Share the code or link with your friends to select seats together.</p>

              {/* Code box */}
              <div style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Session Code</span>
                <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--brand-purple)', letterSpacing: '0.2em', fontFamily: 'var(--font-body)' }}>{groupSessionData.sessionCode}</span>
              </div>

              {/* Link + Copy */}
              {(() => {
                const sId = groupSessionData.showtimeId || groupSessionData.joinUrl?.split('showtimeId=')[1]?.split('&')[0];
                const effectiveJoinUrl = `${window.location.origin}/seats?showtimeId=${sId}&session=${groupSessionData.sessionCode}`;
                return (
                  <>
                    <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                      <input readOnly value={effectiveJoinUrl} style={{ flex: 1, height: '42px', padding: '0 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', outline: 'none' }} />
                      <Button variant="primary" size="sm" iconLeft={<Copy size={13} />} onClick={() => navigator.clipboard.writeText(effectiveJoinUrl)}>Copy</Button>
                    </div>

                    {/* Real Scannable QR Code */}
                    <div style={{ padding: '16px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '136px', height: '136px', background: '#fff', padding: '8px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <QRCodeSVG
                          value={effectiveJoinUrl}
                          size={120}
                          bgColor="#ffffff"
                          fgColor="#080a0f"
                          level="M"
                        />
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scan with Phone Camera to Join</span>
                    </div>

                    <Button variant="primary" size="lg" fullWidth iconLeft={<Ticket size={15} />} onClick={() => { setShowShareModal(false); navigate(`/seats?showtimeId=${sId}&session=${groupSessionData.sessionCode}`); }}>
                      Enter Seating Map
                    </Button>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Sub-components ── */
function EmptyState({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--text-tertiary)', fontSize: '13px', fontWeight: 600 }}>
      {text}
    </div>
  )
}

function ModeCard({ selected, onClick, icon, title, desc, accent = 'red' }) {
  const borderColor = selected ? 'var(--border-active)' : 'var(--border-subtle)'
  const bgColor = selected ? (accent === 'red' ? 'rgba(232,54,74,0.08)' : 'rgba(155,93,229,0.08)') : 'var(--bg-elevated)'
  const iconColor = selected ? (accent === 'red' ? 'var(--brand-red)' : 'var(--brand-purple)') : 'var(--text-tertiary)'

  return (
    <div onClick={onClick} style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: `1px solid ${borderColor}`, background: bgColor, cursor: 'pointer', transition: 'all var(--transition-base)', display: 'flex', alignItems: 'center', gap: '14px' }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-hover)' }}}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}}
    >
      <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: selected ? (accent === 'red' ? 'rgba(232,54,74,0.15)' : 'rgba(155,93,229,0.15)') : 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0, transition: 'all var(--transition-base)' }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 2px' }}>{title}</p>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{desc}</p>
      </div>
      <ChevronRight size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
    </div>
  )
}

function GroupBookingForm({ submitted, onSubmit, onBack, groupSize, setGroupSize, groupDate, setGroupDate, groupFormat, setGroupFormat, groupContact, setGroupContact }) {
  const labelStyle = { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px' }
  const inputStyle = { width: '100%', height: '42px', padding: '0 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', transition: 'all var(--transition-base)' }

  if (submitted) return (
    <div style={{ textAlign: 'center', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle size={24} color="var(--color-success)" />
      </div>
      <Badge variant="green">Enquiry Received</Badge>
      <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: '20px', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase' }}>Request Submitted!</h4>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
        Your enquiry for <strong style={{ color: 'var(--text-primary)' }}>{groupSize} guests</strong> on <strong style={{ color: 'var(--text-primary)' }}>{groupDate}</strong> has been logged. Our concierge will contact you at <strong style={{ color: 'var(--text-primary)' }}>{groupContact}</strong> within 2 hours.
      </p>
      <Button variant="secondary" onClick={onBack}>Back to Theatres</Button>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--bg-hover)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-pill)', padding: '5px 12px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
        <ArrowLeft size={11} /> Back
      </button>
      <Badge variant="purple" style={{ marginBottom: '12px' }}>Group Booking Request</Badge>
      <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)', textTransform: 'uppercase', margin: '12px 0 20px' }}>Custom Group Rate Enquiry</h4>

      <form onSubmit={e => { e.preventDefault(); if (!groupDate || !groupContact) { alert('Please fill date and contact.'); return } onSubmit() }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Group size */}
          <div>
            <label style={labelStyle}>Group Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" onClick={() => setGroupSize(p => Math.max(10, p - 5))} style={{ width: '40px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <input type="number" value={groupSize} onChange={e => setGroupSize(Math.max(10, parseInt(e.target.value) || 10))} min="10" required style={{ ...inputStyle, textAlign: 'center', fontWeight: 800 }} />
              <button type="button" onClick={() => setGroupSize(p => p + 5)} style={{ width: '40px', height: '42px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 700, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>
          {/* Format */}
          <div>
            <label style={labelStyle}>Preferred Format</label>
            <div style={{ position: 'relative' }}>
              <select value={groupFormat} onChange={e => setGroupFormat(e.target.value)} style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', paddingRight: '36px' }}>
                <option value="2D">Regular 2D</option>
                <option value="3D">Regular 3D</option>
                <option value="IMAX 3D">IMAX 3D</option>
                <option value="Dolby Atmos">Dolby Atmos</option>
                <option value="Luxe Recliner">Luxe Recliner / VIP</option>
              </select>
              <ChevronRight size={13} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Preferred Date</label>
            <input type="date" value={groupDate} onChange={e => setGroupDate(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Contact Phone / Email</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Phone size={14} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
              <input type="text" placeholder="+91 98765 43210" value={groupContact} onChange={e => setGroupContact(e.target.value)} required style={{ ...inputStyle, paddingLeft: '36px' }} />
            </div>
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth>Submit Group Request</Button>
        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', margin: 0 }}>
          Group rates apply for minimum 10 seats. Urgent: concierge@cinenova.com
        </p>
      </form>
    </div>
  )
}
