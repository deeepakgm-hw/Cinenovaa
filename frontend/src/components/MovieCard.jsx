import { Star, Clock } from 'lucide-react'
import Button from './Button'
import Badge from './Badge'
import { API_ORIGIN } from '../config/apiConfig'

const getMovieImageUrl = (movie) => {
  if (!movie) return `${API_ORIGIN}/resources/images/posters/default_poster.png`
  const apiId = movie.movieApiId || movie.movie_api_id
  if (apiId && !apiId.startsWith('fb_')) {
    return `${API_ORIGIN}/resources/cache/posters/${apiId}.jpg`
  }
  const url = movie.poster_url || movie.posterUrl
  if (!url) return `${API_ORIGIN}/resources/images/posters/default_poster.png`
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_ORIGIN}/${url}`
}

export default function MovieCard({ movie, onBook, onDetail }) {
  const isUpcoming = movie.status === 'COMING_SOON'

  return (
    <div
      onClick={onDetail}
      className="cn-card cn-card--hoverable"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.borderColor = 'var(--border-default)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.borderColor = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {/* Poster */}
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
        <img
          src={getMovieImageUrl(movie)}
          alt={movie.title}
          onError={e => {
            if (e.target.src !== movie.poster_url && movie.poster_url) {
              e.target.src = movie.poster_url
            } else {
              e.target.src = `${API_ORIGIN}/resources/images/posters/default_poster.png`
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform var(--transition-slow)',
            display: 'block',
          }}
          className="movie-card-img"
        />

        {/* Rating Badge — top right */}
        {movie.rating && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-pill)',
            padding: '2px 7px',
            fontSize: '10px',
            fontWeight: 800,
            color: '#f59e0b',
          }}>
            <Star size={9} fill="#f59e0b" color="#f59e0b" />
            {isNaN(parseFloat(movie.rating)) ? movie.rating : parseFloat(movie.rating).toFixed(1)}
          </div>
        )}

        {/* Language Badge — bottom left */}
        {movie.language && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
          }}>
            <Badge variant="red">{movie.language}</Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <h3
          title={movie.title}
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.25,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color var(--transition-base)',
          }}
        >
          {movie.title}
        </h3>

        <p style={{
          fontSize: '10px',
          color: 'var(--text-secondary)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          margin: '0 0 6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(movie.genre || 'Cinema').split(',')[0].trim()}
          </span>
          <span style={{ color: 'var(--border-default)', flexShrink: 0 }}>•</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <Clock size={9} />
            {movie.duration || 120}m
          </span>
        </p>

        <div style={{ marginTop: 'auto' }}>
          {isUpcoming ? (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={e => { e.stopPropagation(); onDetail() }}
              style={{ padding: '7px 0', fontSize: '11px' }}
            >
              View Details
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={e => { e.stopPropagation(); onBook() }}
              style={{ padding: '7px 0', fontSize: '11px' }}
            >
              Book Tickets
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
