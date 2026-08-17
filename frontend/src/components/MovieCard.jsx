import { Star, Clock } from 'lucide-react'
import Button from './Button'
import Badge from './Badge'

const getMovieImageUrl = (movie) => {
  if (!movie) return 'http://localhost:8080/resources/images/posters/default_poster.png'
  const apiId = movie.movieApiId || movie.movie_api_id
  if (apiId && !apiId.startsWith('fb_')) {
    return `http://localhost:8080/resources/cache/posters/${apiId}.jpg`
  }
  const url = movie.poster_url || movie.posterUrl
  if (!url) return 'http://localhost:8080/resources/images/posters/default_poster.png'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `http://localhost:8080/${url}`
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
              e.target.src = 'http://localhost:8080/resources/images/posters/default_poster.png'
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
            top: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px 9px',
            fontSize: '10px',
            fontWeight: 800,
            color: '#f59e0b',
          }}>
            <Star size={10} fill="#f59e0b" color="#f59e0b" />
            {isNaN(parseFloat(movie.rating)) ? movie.rating : parseFloat(movie.rating).toFixed(1)}
          </div>
        )}

        {/* Language Badge — bottom left */}
        {movie.language && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
          }}>
            <Badge variant="red">{movie.language}</Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          margin: 0,
          transition: 'color var(--transition-base)',
        }}>
          {movie.title}
        </h3>

        <p style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          margin: 0,
        }}>
          {movie.genre || 'Cinema'}
          <span style={{ color: 'var(--border-default)' }}>•</span>
          <Clock size={10} style={{ flexShrink: 0 }} />
          {movie.duration || 120}m
        </p>

        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          {isUpcoming ? (
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={e => { e.stopPropagation(); onDetail() }}
            >
              View Details
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={e => { e.stopPropagation(); onBook() }}
            >
              Book Tickets
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
