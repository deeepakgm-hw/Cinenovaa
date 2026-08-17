
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { CheckCircle, Download } from 'lucide-react'

// Deterministic 21x21 QR Code visual matrix generator
function QRCodeSVG({ value }) {
  const size = 21
  const matrix = Array.from({ length: size }, () => Array(size).fill(0))
  
  // Draw Finder Patterns (7x7 boxes in three corners)
  const drawFinder = (row, col) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = (r === 0 || r === 6 || c === 0 || c === 6)
        const isCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        if (isBorder || isCenter) {
          matrix[row + r][col + c] = 1
        }
      }
    }
  }
  
  drawFinder(0, 0)
  drawFinder(0, size - 7)
  drawFinder(size - 7, 0)

  // Deterministic hash fill
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = (r < 8 && c < 8)
      const inTopRight = (r < 8 && c >= size - 8)
      const inBottomLeft = (r >= size - 8 && c < 8)
      if (inTopLeft || inTopRight || inBottomLeft) continue

      const bitIndex = (r * size + c) % 32
      const mask = 1 << bitIndex
      const isBlack = (hash & mask) !== 0
      matrix[r][c] = isBlack ? 1 : 0
    }
  }

  const cellSize = 8
  const pad = 10
  const svgSize = size * cellSize + pad * 2

  return (
    <svg width={svgSize} height={svgSize} className="bg-white p-2.5 rounded-2xl shadow-2xl border border-slate-200">
      <g transform={`translate(${pad}, ${pad})`}>
        {matrix.map((row, r) =>
          row.map((cell, c) => {
            if (cell === 0) return null
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0f172a"
              />
            )
          })
        )}
      </g>
    </svg>
  )
}

function BarcodeSVG({ value }) {
  // Simple deterministic barcode generator using SVG lines
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const linesCount = 42;
  const lines = [];
  for (let i = 0; i < linesCount; i++) {
    const isWide = ((hash >> (i % 32)) & 1) !== 0;
    const isExtraWide = ((hash >> ((i + 3) % 32)) & 1) !== 0 && isWide;
    const width = isExtraWide ? 4.5 : (isWide ? 2.5 : 1);
    lines.push(width);
  }
  return (
    <svg width="220" height="40" className="opacity-90">
      <g>
        {lines.map((w, index) => {
          const x = lines.slice(0, index).reduce((acc, curr) => acc + curr + 2, 0);
          return (
            <rect
              key={index}
              x={x}
              y="0"
              width={w}
              height="40"
              fill="#94a3b8"
            />
          )
        })}
      </g>
    </svg>
  )
}

// Helper to get structured poster URL
const getMovieImageUrl = (movie) => {
  if (!movie) return 'http://localhost:8080/resources/images/posters/default_poster.png';
  const url = movie.poster_url || movie.posterUrl;
  if (!url) return 'http://localhost:8080/resources/images/posters/default_poster.png';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `http://localhost:8080/${url}`;
};

// Helper to get structured backdrop URL
const getMovieBackdropUrl = (movie) => {
  if (!movie) return '';
  const url = movie.backdrop_url || movie.backdropUrl || movie.poster_url || movie.posterUrl;
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `http://localhost:8080/${url}`;
};

export default function TicketPage() {
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [movie, setMovie] = useState(null)
  const [showtime, setShowtime] = useState(null)

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      navigate('/')
      return
    }

    const storedBooking = sessionStorage.getItem('confirmedBooking')
    const storedMovie = sessionStorage.getItem('selectedMovie')
    const storedShowtime = sessionStorage.getItem('selectedShowtime')

    if (!storedBooking) {
      navigate('/movies')
      return
    }
    setBooking(JSON.parse(storedBooking))
    if (storedMovie) setMovie(JSON.parse(storedMovie))
    if (storedShowtime) setShowtime(JSON.parse(storedShowtime))
  }, [])

  const handleReturn = () => {
    sessionStorage.removeItem('selectedSeats')
    sessionStorage.removeItem('ticketsCost')
    sessionStorage.removeItem('selectedMovie')
    sessionStorage.removeItem('selectedShowtime')
    sessionStorage.removeItem('confirmedBooking')
    sessionStorage.removeItem('lockExpiresAt')
    navigate('/movies')
  }

  const [downloading, setDownloading] = useState(false);

  const loadHtml2Pdf = () => {
    return new Promise((resolve) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      document.body.appendChild(script);
    });
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const html2pdf = await loadHtml2Pdf();
      const element = document.getElementById('ticket-card');
      const opt = {
        margin: 10,
        filename: `Ticket_${booking.bookingId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#07070a' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setDownloading(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen text-slate-100 bg-[#07070a] grid place-items-center">
        <p className="text-slate-500 text-xs font-semibold">Generating your E-Ticket stub...</p>
      </div>
    )
  }

  const backdropUrl = getMovieBackdropUrl(movie);

  return (
    <div className="min-h-screen text-slate-100 bg-[#07070a] relative overflow-hidden pb-16">
      {/* Ambient Movie Backdrop Glow */}
      {backdropUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-[0.12] -z-10 pointer-events-none scale-110"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#07070a] -z-10 pointer-events-none" />

      <NavBar />

      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center relative z-10">
        {/* Success badge */}
        <div className="flex flex-col items-center mb-10 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400 mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Booking Confirmed!</h2>
          <p className="text-slate-400 text-xs mt-1.5 font-bold uppercase tracking-widest text-yellow-500">
            Show code at entry door • Digital ticket saved
          </p>
        </div>

        {/* E-Ticket Luxury Wallet Card Layout */}
        <div id="ticket-card" className="w-full max-w-3xl bg-[#11131c]/80 border border-slate-800/80 rounded-[36px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_60px_rgba(244,63,94,0.15)] transition-all duration-500 backdrop-blur-3xl grid grid-cols-1 md:grid-cols-12 relative animate-fade-in border-t border-rose-500/30">
          
          {/* Neon Glow Highlights */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/15 blur-[45px] pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-500/15 blur-[55px] pointer-events-none"></div>

          {/* Ticket circular tear stub punch cutouts with realistic depth shadow */}
          <div className="hidden md:block absolute top-0 left-[41.666%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#07070a] border border-slate-800/80 shadow-[inset_0_-6px_10px_rgba(0,0,0,0.8)] z-20"></div>
          <div className="hidden md:block absolute bottom-0 left-[41.666%] -translate-x-1/2 translate-y-1/2 w-8 h-8 rounded-full bg-[#07070a] border border-slate-800/80 shadow-[inset_0_6px_10px_rgba(0,0,0,0.8)] z-20"></div>
          
          {/* Real-looking dashed vertical separator line */}
          <div className="hidden md:block absolute top-8 bottom-8 left-[41.666%] border-l-2 border-dashed border-slate-850/50 -translate-x-1/2 pointer-events-none z-10"></div>

          {/* Left Stub Column: Movie Poster & Details (5 cols) */}
          <div className="md:col-span-5 bg-gradient-to-b from-[#181d2f] to-[#0c0e18] p-8 border-b md:border-b-0 md:border-r border-slate-850/50 flex flex-col justify-between relative">
            <div>
              {movie && (
                <div className="w-full aspect-[2/3] rounded-2xl overflow-hidden border border-slate-800/80 shadow-xl relative mb-6">
                  <img 
                    src={getMovieImageUrl(movie)} 
                    alt={movie.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'http://localhost:8080/resources/images/posters/default_poster.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                  <span className="absolute bottom-4 left-4 text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-rose-500 to-amber-500 text-white px-3 py-1 rounded-full border border-rose-500/30 shadow-md">
                    {showtime?.screenType || 'IMAX'}
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-black text-white leading-tight mt-1 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">{booking.movieName}</h3>
              <p className="text-rose-450 text-xs mt-1.5 font-bold uppercase tracking-wider">{movie?.genre || 'Cinema'}</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800/40 text-xs">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Screening Room</span>
              <span className="font-extrabold text-white mt-1 block text-sm">{showtime?.screenName || 'Screen 1'}</span>
            </div>
          </div>

          {/* Right Ticket Body: Details & QR code (7 cols) */}
          <div className="md:col-span-7 p-8 flex flex-col justify-between bg-gradient-to-b from-[#131622] to-[#0e1017]">
            <div className="space-y-6">
              
              {/* Stub header */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cinema Theatre</h4>
                  <p className="font-black text-white text-sm mt-1">{booking.theatreName}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Paid</h4>
                  <p className="text-xl font-black text-yellow-500 mt-1">₹{booking.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              {/* Grid Metadata details */}
              <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-xs border-y border-slate-800/60 py-6">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Booking Reference</span>
                  <span className="font-black text-white tracking-widest uppercase mt-1 block select-all font-mono">{booking.bookingId}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Seats Reserved</span>
                  <span className="font-black text-rose-400 tracking-wide mt-1 block text-sm">{booking.seats}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Showtime Date</span>
                  <span className="font-bold text-white mt-1 block">
                    {showtime ? new Date(showtime.showTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Showtime Time</span>
                  <span className="font-bold text-white mt-1 block">
                    {showtime ? new Date(showtime.showTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Gateway details */}
              {(booking.paymentGatewayId || booking.transactionId) && (
                <div className="bg-black/35 rounded-2xl p-4 border border-slate-800/80 text-[10px] space-y-1 font-semibold text-slate-400">
                  <div className="flex justify-between">
                    <span>Gateway ID:</span>
                    <span className="text-white font-bold">{booking.paymentGatewayId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="text-white font-bold font-mono">{booking.transactionId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-black">SUCCESS</span>
                  </div>
                </div>
              )}

            </div>

            {/* Tear stub divider and QR block */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 mt-4 border-t border-dashed border-slate-800">
              <div className="text-center sm:text-left space-y-4">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Entry Pass Code</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block">Scan at doors to verify entry.</span>
                </div>
                <div className="hidden sm:block">
                  <BarcodeSVG value={booking.bookingId} />
                </div>
              </div>
              
              <div className="flex-shrink-0 relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                <div className="relative">
                  <QRCodeSVG value={booking.bookingId} />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full max-w-xs sm:max-w-md justify-center">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-6 py-3.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:border-slate-700 text-slate-300 rounded-full font-bold shadow-lg active:scale-[0.98] transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download size={14} />
            {downloading ? 'Generating PDF...' : 'Download Ticket'}
          </button>
          <button
            onClick={handleReturn}
            className="px-8 py-3.5 bg-gradient-to-r from-rose-600 to-purple-650 hover:from-rose-500 hover:to-purple-550 text-white rounded-full font-bold shadow-lg active:scale-[0.98] transition-all text-xs tracking-wider uppercase flex items-center justify-center"
          >
            Return to Movies
          </button>
        </div>
      </main>
    </div>
  )
}
