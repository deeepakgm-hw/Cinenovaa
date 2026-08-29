import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import NavBar from '../components/NavBar'
import { io } from 'socket.io-client'
import { API_BASE_URL, API_ORIGIN } from '../config/apiConfig'

const Icons = {
  Close: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Users: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75" />
    </svg>
  ),
  Star: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  Parking: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7h4a3 3 0 010 6H9" />
    </svg>
  ),
  Food: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Accessibility: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="5" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 13v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2m4-2h6m-3 2v4a3 3 0 003 3h1m-10-3h1a3 3 0 003-3v-4" />
    </svg>
  ),
  Recliner: ({ className = "w-3.5 h-3.5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11h10M4 7h16v4H4V7zm1 8h14v3a2 2 0 01-2 2H7a2 2 0 01-2-2v-3zm-2-4h2v5H3v-5zm16 0h2v5h-2v-5z" />
    </svg>
  )
};

const colorClasses = {
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    solidBg: 'bg-amber-500 text-slate-950 font-black border border-amber-400',
    dashedBorder: 'border-dashed border-2 border-amber-500 text-amber-500'
  },
  teal: {
    text: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    solidBg: 'bg-teal-500 text-slate-950 font-black border border-teal-400',
    dashedBorder: 'border-dashed border-2 border-teal-500 text-teal-400'
  },
  coral: {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    solidBg: 'bg-rose-500 text-white font-black border border-rose-455',
    dashedBorder: 'border-dashed border-2 border-rose-500 text-rose-400'
  },
  purple: {
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    solidBg: 'bg-purple-500 text-white font-black border border-purple-400',
    dashedBorder: 'border-dashed border-2 border-purple-500 text-purple-400'
  },
  green: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    solidBg: 'bg-emerald-500 text-slate-950 font-black border border-emerald-400',
    dashedBorder: 'border-dashed border-2 border-emerald-500 text-emerald-400'
  },
  blue: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    solidBg: 'bg-blue-500 text-white font-black border border-blue-400',
    dashedBorder: 'border-dashed border-2 border-blue-500 text-blue-450'
  }
};

export default function SeatPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const showtimeId = searchParams.get('showtimeId')

  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [movie, setMovie] = useState(null)
  const [showtime, setShowtime] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)

  // Group Booking States
  const sessionCode = searchParams.get('session')
  const [guestName, setGuestName] = useState(() => sessionStorage.getItem('groupGuestName') || '')
  const [guestNameInput, setGuestNameInput] = useState('')
  const [socket, setSocket] = useState(null)
  
  // Real-Time Group state
  const [participants, setParticipants] = useState([])
  const [activeSelections, setActiveSelections] = useState([]) // Array of { seatId, userId, color }
  const [activeHovers, setActiveHovers] = useState({}) // seatId -> { userId, displayName, color }
  const [isReady, setIsReady] = useState(false)
  const [countdown, setCountdown] = useState(null)
  const [waitingForPayment, setWaitingForPayment] = useState(false)
  const [bookingConfirmed, setBookingConfirmed] = useState(false)
  const [assignedColor, setAssignedColor] = useState('amber')

  // Keep latest state references to bypass React hook stale closures in socket events
  const seatsRef = useRef(seats);
  const movieRef = useRef(movie);
  const showtimeRef = useRef(showtime);
  useEffect(() => {
    seatsRef.current = seats;
    movieRef.current = movie;
    showtimeRef.current = showtime;
  }, [seats, movie, showtime]);

  // Auth & Page configuration setup
  useEffect(() => {
    const initAuthAndDetails = async () => {
      const storedUser = localStorage.getItem('user')
      let currentUser = null
      
      if (storedUser) {
        currentUser = JSON.parse(storedUser)
        setUser(currentUser)
      } else if (sessionCode && guestName) {
        const guestId = sessionStorage.getItem('groupGuestId') || ('guest-' + Math.floor(100000 + Math.random() * 900000));
        sessionStorage.setItem('groupGuestId', guestId);
        currentUser = {
          id: guestId,
          username: guestName,
          isGuest: true
        };
        setUser(currentUser);
      } else if (sessionCode) {
        return;
      } else {
        navigate('/')
        return
      }

      try {
        setLoading(true);
        const showtimeRes = await axios.get(`${API_BASE_URL}/showtimes/${showtimeId}`);
        const stData = showtimeRes.data;
        
        setMovie({
          id: stData.movieId,
          title: stData.title,
          genre: stData.genre,
          duration: stData.duration,
          poster_url: stData.poster_url,
          backdrop_url: stData.backdrop_url
        });
        
        setShowtime({
          id: stData.id,
          showTime: stData.show_time,
          price: stData.price,
          showType: stData.show_type,
          screenName: stData.screen_name,
          screenType: stData.screen_type,
          theatreName: stData.theatreName,
          theatreId: stData.theatreId
        });
        
        const seatsRes = await axios.get(`${API_BASE_URL}/showtimes/${showtimeId}/seats`);
        setSeats(seatsRes.data);
      } catch (err) {
        console.error('Failed to load page config details:', err);
        setError('Failed to configure seating hall layout.');
      } finally {
        setLoading(false);
      }
    };

    initAuthAndDetails();
  }, [showtimeId, sessionCode, guestName]);

  // Sockets Effect for Multiplayer seat sync
  useEffect(() => {
    if (!sessionCode || !user || !showtimeId) return;

    const newSocket = io(`${API_ORIGIN}/group-seats`, {
      transports: ['websocket']
    });

    setSocket(newSocket);

    newSocket.emit('join_session', {
      sessionCode,
      userId: user.id,
      displayName: user.username
    });

    newSocket.on('participant_joined', ({ userId: joinedId, color: joinedColor, participants: roomUsers }) => {
      setParticipants(roomUsers);
      if (joinedId === user.id) {
        setAssignedColor(joinedColor);
      }
    });

    newSocket.on('participant_left', ({ userId: leftId, participants: roomUsers }) => {
      setParticipants(roomUsers);
      setActiveSelections(prev => prev.filter(sel => sel.userId !== leftId));
      setActiveHovers(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          if (next[k].userId === leftId) {
            delete next[k];
          }
        });
        return next;
      });
    });

    newSocket.on('initial_state', ({ selectedSeats: currentSels }) => {
      setActiveSelections(currentSels);
    });

    newSocket.on('seat_state_update', ({ seatId, userId: actorId, action, color: actorColor, displayName: actorName }) => {
      if (action === 'hover') {
        setActiveHovers(prev => ({
          ...prev,
          [seatId]: { userId: actorId, displayName: actorName, color: actorColor }
        }));
      } else if (action === 'unhover') {
        setActiveHovers(prev => {
          const next = { ...prev };
          delete next[seatId];
          return next;
        });
      } else if (action === 'select') {
        setActiveSelections(prev => {
          if (prev.some(s => s.seatId === seatId)) return prev;
          return [...prev, { seatId, userId: actorId, color: actorColor }];
        });
        setActiveHovers(prev => {
          const next = { ...prev };
          delete next[seatId];
          return next;
        });
      } else if (action === 'deselect') {
        setActiveSelections(prev => prev.filter(s => s.seatId !== seatId));
      }
    });

    newSocket.on('selection_failed', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 4000);
    });

    newSocket.on('ready_state_update', ({ participants: roomUsers }) => {
      setParticipants(roomUsers);
    });

    newSocket.on('all_ready', ({ countdown: seconds }) => {
      setCountdown(seconds);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    });

    newSocket.on('start_checkout', ({ seats: finalSeats, organiserUserId }) => {
      const isCreator = sessionStorage.getItem(`created_session_${sessionCode}`) === 'true';
      const isOrganiser = isCreator ||
                          (organiserUserId && String(user.id) === String(organiserUserId)) ||
                          (participants.length <= 1);

      if (isOrganiser) {
        const organiserSeats = finalSeats.map(fs => fs.seatId);
        const effectiveUserId = (user.isGuest || !user.id || isNaN(user.id)) ? 999999 : user.id;
        
        // Call backend API to lock all selected group seats under the organiser
        axios.post(`${API_BASE_URL}/seats/lock`, {
          showtimeId: parseInt(showtimeId),
          userId: effectiveUserId,
          seats: organiserSeats
        }).then(() => {
          let finalCost = 0;
          organiserSeats.forEach(sNum => {
            const seat = seatsRef.current.find(s => s.seatNumber === sNum);
            if (seat) finalCost += seat.price;
          });

          // Save to sessionStorage to satisfy PaymentPage state parameters
          sessionStorage.setItem('selectedSeats', JSON.stringify(organiserSeats));
          sessionStorage.setItem('ticketsCost', finalCost.toString());
          sessionStorage.setItem('selectedMovie', JSON.stringify(movieRef.current));
          sessionStorage.setItem('selectedShowtime', JSON.stringify(showtimeRef.current));
          sessionStorage.setItem('lockExpiresAt', (Date.now() + 300 * 1000).toString());
          
          navigate(`/payment?session=${sessionCode}`);
        }).catch(err => {
          console.warn('Failed to lock group seats via API, proceeding with fallback to payment:', err);
          let finalCost = 0;
          organiserSeats.forEach(sNum => {
            const seat = seatsRef.current.find(s => s.seatNumber === sNum);
            if (seat) finalCost += seat.price;
          });
          sessionStorage.setItem('selectedSeats', JSON.stringify(organiserSeats));
          sessionStorage.setItem('ticketsCost', finalCost.toString());
          sessionStorage.setItem('selectedMovie', JSON.stringify(movieRef.current));
          sessionStorage.setItem('selectedShowtime', JSON.stringify(showtimeRef.current));
          sessionStorage.setItem('lockExpiresAt', (Date.now() + 300 * 1000).toString());

          navigate(`/payment?session=${sessionCode}`);
        });
      } else {
        setWaitingForPayment(true);
      }
    });

    newSocket.on('booking_completed', () => {
      setBookingConfirmed(true);
      setWaitingForPayment(false);
    });

    newSocket.on('session_expired', () => {
      alert('The group session has expired or the organiser disconnected.');
      navigate('/movies');
    });

    newSocket.on('error_message', ({ message }) => {
      alert(message);
      navigate('/movies');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionCode, user, showtimeId]);

  // Solo Timer Effect
  useEffect(() => {
    if (sessionCode || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleLockTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, sessionCode])

  const handleLockTimeout = async () => {
    if (selectedSeats.length > 0) {
      try {
        await axios.post(`${API_BASE_URL}/seats/release`, {
          showtimeId: parseInt(showtimeId),
          userId: user.id,
          seats: selectedSeats
        });
      } catch (err) {
        console.error('Failed to release expired locks:', err);
      }
    }
    setSelectedSeats([])
    setError('Your temporary seat hold has expired. Please select seats again.')
    fetchSeats()
  }

  const fetchSeats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get(`${API_BASE_URL}/showtimes/${showtimeId}/seats`)
      setSeats(res.data)
    } catch (err) {
      console.error('Failed to fetch seats:', err)
      setError('Failed to load seating Hall configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleSeatClick = async (seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'LOCKED' || seat.status === 'MAINTENANCE') return
    setError('')
    
    let seatsToProcess = [];
    if (seat.couplePairId) {
      seatsToProcess = seat.couplePairId.split('-');
    } else {
      seatsToProcess = [seat.seatNumber];
    }

    const isSelected = selectedSeats.includes(seatsToProcess[0]);

    if (isSelected) {
      try {
        await axios.post(`${API_BASE_URL}/seats/release`, {
          showtimeId: parseInt(showtimeId),
          userId: user.id,
          seats: seatsToProcess
        });
        
        setSelectedSeats(prev => {
          const updated = prev.filter(s => !seatsToProcess.includes(s));
          if (updated.length === 0) {
            setTimeLeft(0);
          }
          return updated;
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to release seat lock.');
      }
    } else {
      try {
        await axios.post(`${API_BASE_URL}/seats/lock`, {
          showtimeId: parseInt(showtimeId),
          userId: user.id,
          seats: seatsToProcess
        });
        
        setSelectedSeats(prev => {
          const updated = [...prev, ...seatsToProcess];
          if (timeLeft === 0) {
            setTimeLeft(300);
          }
          return updated;
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to lock seat.');
      }
    }
  }

  const handleSeatClickGroup = (seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'LOCKED' || seat.status === 'MAINTENANCE') return;
    if (!socket) return;

    const isSelectedByMe = activeSelections.some(s => s.seatId === seat.seatNumber && s.userId === user.id);
    
    if (isSelectedByMe) {
      socket.emit('cursor_move', {
        sessionCode,
        userId: user.id,
        seatId: seat.seatNumber,
        action: 'deselect'
      });
    } else {
      socket.emit('cursor_move', {
        sessionCode,
        userId: user.id,
        seatId: seat.seatNumber,
        action: 'select'
      });
    }
  }

  const handleSeatMouseEnter = (seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'LOCKED' || seat.status === 'MAINTENANCE') return;
    if (socket && sessionCode) {
      socket.emit('cursor_move', {
        sessionCode,
        userId: user.id,
        seatId: seat.seatNumber,
        action: 'hover'
      });
    }
  }

  const handleSeatMouseLeave = (seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'LOCKED' || seat.status === 'MAINTENANCE') return;
    if (socket && sessionCode) {
      socket.emit('cursor_move', {
        sessionCode,
        userId: user.id,
        seatId: seat.seatNumber,
        action: 'unhover'
      });
    }
  }

  const getSeatClass = (seat) => {
    if (seat.status === 'BOOKED') {
      return 'bg-slate-900 text-slate-700 cursor-not-allowed border border-slate-950/80 pointer-events-none'
    }
    if (seat.status === 'LOCKED') {
      return 'bg-amber-600/20 text-amber-500 cursor-not-allowed border border-amber-600/30 pointer-events-none'
    }
    if (seat.status === 'MAINTENANCE') {
      return 'bg-red-950/20 text-red-500 border border-red-900/30 cursor-not-allowed pointer-events-none'
    }

    if (sessionCode) {
      const selection = activeSelections.find(s => s.seatId === seat.seatNumber);
      if (selection) {
        const cls = colorClasses[selection.color] || colorClasses.amber;
        return `${cls.solidBg} scale-105 shadow-md`;
      }

      const hover = activeHovers[seat.seatNumber];
      if (hover) {
        const cls = colorClasses[hover.color] || colorClasses.amber;
        return `${cls.dashedBorder} scale-102`;
      }
    } else {
      const isSelected = selectedSeats.includes(seat.seatNumber)
      if (isSelected) {
        return 'bg-rose-500 text-white font-extrabold border border-rose-400 shadow-glow shadow-rose-950/40 scale-105'
      }
    }

    if (seat.type === 'VIP' || seat.type === 'Gold Class') {
      return 'bg-yellow-500/10 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30'
    }
    if (seat.type === 'Premium' || seat.type === 'Executive') {
      return 'bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
    }
    return 'bg-slate-900/50 hover:bg-slate-800 text-slate-400 border border-slate-850'
  }

  const calculateTotal = () => {
    return selectedSeats.reduce((sum, sNum) => {
      const seat = seats.find(s => s.seatNumber === sNum)
      return sum + (seat ? seat.price : 0)
    }, 0)
  }

  const calculateTotalGroup = () => {
    return activeSelections.reduce((sum, sel) => {
      const seat = seats.find(s => s.seatNumber === sel.seatId);
      return sum + (seat ? seat.price : 0);
    }, 0);
  }

  const handleProceed = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat to continue.')
      return
    }
    setError('')
    try {
      const payload = {
        showtimeId: parseInt(showtimeId),
        userId: user.id,
        seats: selectedSeats
      }
      await axios.post(`${API_BASE_URL}/seats/lock`, payload)
      
      sessionStorage.setItem('selectedSeats', JSON.stringify(selectedSeats))
      sessionStorage.setItem('ticketsCost', calculateTotal().toString())
      sessionStorage.setItem('lockExpiresAt', (Date.now() + timeLeft * 1000).toString())
      
      navigate('/payment')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reserve seats.')
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  // Display Name Join Form for Guest Link Entry
  if (sessionCode && !user) {
    return (
      <div className="min-h-screen text-slate-100 bg-[#07070a] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md p-8 rounded-[32px] bg-[#0c0d14]/80 border border-purple-500/20 shadow-2xl relative animate-fade-in shadow-glow-purple">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center mx-auto mb-5">
              <Icons.Users className="w-6 h-6" />
            </div>

            <span className="px-2.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[9px] font-black text-purple-400 uppercase tracking-widest">
              Live Session
            </span>

            <h3 className="text-2xl font-black text-white mt-4 uppercase tracking-tight">Join Seating Group</h3>
            <p className="text-slate-400 text-xs mt-2 font-medium max-w-xs mx-auto leading-relaxed">
              You've been invited to choose seats together in real time! Enter a display name to join.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = guestNameInput.trim();
                if (!trimmed) return;
                sessionStorage.setItem('groupGuestName', trimmed);
                setGuestName(trimmed);
              }}
              className="mt-8 space-y-4 text-left"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Your Display Name</label>
                <input 
                  type="text"
                  placeholder="e.g. John Smith"
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-slate-850 text-sm font-semibold text-white focus:border-purple-500 outline-none placeholder:text-slate-750"
                  required
                  maxLength={18}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-purple-650 hover:from-rose-500 hover:to-purple-550 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg"
              >
                Join Seating Map
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100 bg-[#07070a]">
      <NavBar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {movie && showtime && (
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900/60 pb-5">
            <div>
              <div className="flex gap-2.5 items-center">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                  Choose Seats
                </span>
                <span className="text-[10px] font-bold text-yellow-450 uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1 rounded-full">
                  {showtime.screenType} Premium Format
                </span>
              </div>
              <h2 className="text-3xl font-black text-white mt-3.5 leading-none">{movie.title}</h2>
              <p className="text-slate-500 text-xs mt-2 font-semibold tracking-wide">
                {showtime.theatreName} ({showtime.screenType}) | {showtime.screenName} | {showtime.showTime}
              </p>
            </div>
            <button
              onClick={() => navigate('/movies')}
              className="text-[10px] uppercase tracking-wider px-5 py-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-full font-bold transition-all w-max"
            >
              ← Back to Movies
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs font-semibold leading-relaxed animate-pulse">
            {error}
          </div>
        )}

        {timeLeft > 0 && !sessionCode && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs font-extrabold flex justify-between items-center tracking-wider uppercase animate-fade-in">
            <span className="inline-flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Seating hold active: Complete checkout before timer expires.</span>
            </span>
            <span className="text-sm font-black bg-amber-500/25 px-3 py-1 rounded-lg text-yellow-400 animate-pulse">
              {formatTime(timeLeft)}
            </span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 text-xs font-semibold">Configuring seating hall layout...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Visual seat selector */}
            <div className="lg:col-span-2 rounded-3xl bg-slate-900/20 border border-slate-900 p-8 flex flex-col items-center overflow-hidden">
              
              {/* Participant Panel */}
              {sessionCode && (
                <div className="w-full max-w-xl mb-10 p-4.5 rounded-3xl bg-[#0c0d14]/75 border border-purple-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                  <div className="flex flex-col gap-1 text-left">
                    <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest w-max font-mono">
                      Session Code: {sessionCode}
                    </span>
                    <h4 className="text-xs font-black text-white uppercase mt-1">Multiplayer Room connected</h4>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {participants.map(p => {
                      const dotColors = {
                        amber: 'bg-amber-500 shadow-amber-500/40',
                        teal: 'bg-teal-500 shadow-teal-500/40',
                        coral: 'bg-rose-500 shadow-rose-500/40',
                        purple: 'bg-purple-500 shadow-purple-500/40',
                        green: 'bg-emerald-500 shadow-emerald-500/40',
                        blue: 'bg-blue-500 shadow-blue-500/40'
                      };
                      const dotColor = dotColors[p.color] || dotColors.amber;
                      
                      return (
                        <div key={p.userId} className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-xl shadow-md">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-glow shrink-0`}></span>
                          <span className="text-[10px] font-bold text-white max-w-[80px] truncate">{p.displayName}</span>
                          {p.ready ? (
                            <span className="text-[7px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 font-black uppercase px-1 rounded ml-1 tracking-wider">Ready</span>
                          ) : (
                            <span className="text-[7px] bg-slate-900 text-slate-500 border border-slate-850 font-black uppercase px-1 rounded ml-1 tracking-wider">Wait</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Screen Curved Indicator */}
              <div className="w-full max-w-lg text-center mb-16 relative">
                <svg viewBox="0 0 400 30" className="w-full drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                  <path 
                    d="M 20 25 Q 200 5 380 25" 
                    fill="none" 
                    stroke="url(#screenGrad)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#f43f5e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2">
                  {showtime?.screenType} Curved Projection Screen
                </div>
              </div>

              {/* Grid of Seats */}
              <div className="space-y-4 w-full max-w-xl overflow-x-auto pb-4 px-2">
                {Array.from({ length: Math.ceil(seats.length / (showtime?.screenType === 'IMAX' ? 15 : 10)) }).map((_, rIndex) => {
                  const cols = showtime?.screenType === 'IMAX' ? 15 : 10
                  const rowSeats = seats.slice(rIndex * cols, (rIndex + 1) * cols)
                  const rowChar = String.fromCharCode('A'.charCodeAt(0) + rIndex)
                  return (
                    <div key={rIndex} className="flex gap-2.5 items-center justify-center min-w-[500px]">
                      <span className="w-6 text-center text-xs font-bold text-slate-600 mr-2">{rowChar}</span>
                      {rowSeats.map(seat => {
                        const isCouple = seat.type === 'Couple Seats'
                        const selection = sessionCode ? activeSelections.find(s => s.seatId === seat.seatNumber) : null
                        const hover = sessionCode ? activeHovers[seat.seatNumber] : null
                        
                        return (
                          <button
                            key={seat.seatNumber}
                            onClick={() => sessionCode ? handleSeatClickGroup(seat) : handleSeatClick(seat)}
                            onMouseEnter={() => handleSeatMouseEnter(seat)}
                            onMouseLeave={() => handleSeatMouseLeave(seat)}
                            disabled={seat.status === 'BOOKED' || seat.status === 'LOCKED' || seat.status === 'MAINTENANCE'}
                            className={`h-9 rounded-xl flex items-center justify-center text-[10px] font-extrabold transition-all outline-none relative group ${getSeatClass(seat)} ${isCouple ? 'w-20' : 'w-9'}`}
                            title={`${seat.seatNumber} - ${seat.type} (INR ${seat.price})`}
                          >
                            {/* Initials bubble on hover/select */}
                            {hover && (
                              <span className={`absolute -top-3.5 -right-3 px-1.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider shadow-md bg-slate-950 border border-${hover.color}-500/30 text-${hover.color}-400 animate-bounce z-10`}>
                                {getInitials(hover.displayName)}
                              </span>
                            )}
                            {selection && (
                              <span className="absolute -top-3 -right-2 px-1 py-0.5 rounded-full text-[6.5px] font-extrabold uppercase bg-slate-950 border border-slate-800 text-white font-mono scale-95 shadow z-10">
                                {getInitials(participants.find(p => p.userId === selection.userId)?.displayName || '??')}
                              </span>
                            )}
                            
                            {isCouple ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-pink-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M19 14V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v8" />
                                  <path d="M3 14h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4Z" />
                                </svg>
                                <span>{seat.seatNumber}</span>
                              </span>
                            ) : (
                              <span>
                                {seat.status === 'MAINTENANCE' ? (
                                  <svg className="w-3.5 h-3.5 text-red-500 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                  </svg>
                                ) : seat.seatNumber.slice(1)}
                              </span>
                            )}
                          </button>
                        )
                      })}
                      <span className="w-6 text-center text-xs font-bold text-slate-600 ml-2">{rowChar}</span>
                    </div>
                  )
                })}
              </div>

              {/* Legend bar */}
              <div className="mt-12 grid grid-cols-3 md:grid-cols-4 gap-4 border-t border-slate-900/60 pt-6 w-full text-[9px] font-bold uppercase tracking-wider text-slate-500 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-blue-500/10 border border-blue-500/25"></div>
                  <span>Regular</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/25"></div>
                  <span>Premium</span>
                </div>
                {seats.some(s => s.type === 'Balcony') && (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-cyan-500/10 border border-cyan-500/25"></div>
                    <span>Balcony</span>
                  </div>
                )}
                {seats.some(s => s.type === 'Executive') && (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/25"></div>
                    <span>Executive</span>
                  </div>
                )}
                {seats.some(s => s.type === 'VIP') && (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-yellow-500/10 border border-yellow-500/25"></div>
                    <span>VIP</span>
                  </div>
                )}
                {seats.some(s => s.type === 'Gold Class') && (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-yellow-500/10 border border-yellow-500/25"></div>
                    <span>Gold Class</span>
                  </div>
                )}
                {seats.some(s => s.type === 'Recliner') && (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-purple-500/10 border border-purple-500/25"></div>
                    <span>Recliner</span>
                  </div>
                )}
                {seats.some(s => s.type === 'Couple Seats') && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-3.5 rounded bg-pink-500/10 border border-pink-500/25"></div>
                    <span>Couple Sofa</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-rose-500"></div>
                  <span className="text-rose-400 font-extrabold">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-950"></div>
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-amber-600/25 border border-amber-600/30"></div>
                  <span>Locked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded bg-red-950/20 border border-red-900/30"></div>
                  <span>Blocked</span>
                </div>
              </div>
            </div>

            {/* Sidebar Invoice breakdown */}
            <div className="rounded-3xl bg-slate-900/20 border border-slate-900 p-8 flex flex-col justify-between h-fit text-left">
              <div>
                <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-900/40 pb-3 uppercase tracking-wider">Ticket Invoice</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider">Quantity:</span>
                    <span className="font-bold text-white">
                      {sessionCode ? activeSelections.length : selectedSeats.length} Tickets
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider">Seats selected:</span>
                    <span className="font-extrabold text-rose-455 text-right max-w-[150px] break-words">
                      {sessionCode 
                        ? (activeSelections.length > 0 ? activeSelections.map(s => s.seatId).join(', ') : 'None')
                        : (selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None')
                      }
                    </span>
                  </div>
                  
                  {/* Category Breakdown list */}
                  {((sessionCode ? activeSelections.length : selectedSeats.length) > 0) && (
                    <div className="border-t border-slate-900/30 pt-3 space-y-1.5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Category Pricing:</p>
                      {sessionCode ? (
                        activeSelections.map(sel => {
                          const seat = seats.find(s => s.seatNumber === sel.seatId)
                          const p = participants.find(part => part.userId === sel.userId)
                          return (
                            <div key={sel.seatId} className="flex justify-between text-[11px] font-medium text-slate-400">
                              <span>Seat {sel.seatId} ({p ? p.displayName : 'Guest'}):</span>
                              <span>INR {seat?.price.toFixed(2)}</span>
                            </div>
                          )
                        })
                      ) : (
                        selectedSeats.map(sNum => {
                          const seat = seats.find(s => s.seatNumber === sNum)
                          return (
                            <div key={sNum} className="flex justify-between text-[11px] font-medium text-slate-400">
                              <span>Seat {sNum} ({seat?.type}):</span>
                              <span>INR {seat?.price.toFixed(2)}</span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-900/40 pt-6">
                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total:</span>
                  <span className="text-3xl font-black text-yellow-500">
                    INR {(sessionCode ? calculateTotalGroup() : calculateTotal()).toFixed(2)}
                  </span>
                </div>

                {sessionCode ? (
                  <button
                    onClick={() => {
                      if (!isReady && socket) {
                        socket.emit('confirm_ready', { sessionCode, userId: user.id });
                        setIsReady(true);
                      }
                    }}
                    disabled={isReady || activeSelections.filter(s => s.userId === user.id).length === 0}
                    className={`w-full text-white rounded-2xl py-4 text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-[0.98] ${
                      isReady 
                        ? 'bg-emerald-600 border border-emerald-500/40 cursor-not-allowed opacity-80' 
                        : 'bg-gradient-to-r from-purple-650 to-rose-650 hover:from-purple-550 hover:to-rose-550'
                    } disabled:opacity-50 disabled:pointer-events-none`}
                  >
                    {isReady ? 'Confirmed Ready' : "I'm Ready"}
                  </button>
                ) : (
                  <button
                    onClick={handleProceed}
                    disabled={selectedSeats.length === 0}
                    className="w-full bg-gradient-to-r from-rose-600 to-purple-650 hover:from-rose-500 hover:to-purple-550 text-white rounded-2xl py-4 text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Proceed to Payment
                  </button>
                )}
                
                <p className="text-[9px] text-center text-slate-555 mt-3.5 uppercase tracking-widest font-extrabold">
                  {sessionCode ? 'All participants choose seats live' : 'Seats locked for 5 mins during checkout'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <span className="px-3 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-xs font-black text-purple-400 uppercase tracking-widest mb-6">
            Synchronized Submission
          </span>
          <h2 className="text-3xl font-black text-white uppercase tracking-wider mb-2">Locking Selected Seats</h2>
          <p className="text-slate-400 text-sm font-semibold mb-10 max-w-sm text-center leading-relaxed">
            All participants are ready! Submitting choices in...
          </p>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/15 border-t-purple-500 animate-spin"></div>
            <span className="text-6xl font-black text-white font-mono tracking-tight animate-pulse">
              {countdown}
            </span>
          </div>
        </div>
      )}

      {/* Waiting for payment overlay (Participants view) */}
      {waitingForPayment && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in text-center p-6">
          <div className="w-16 h-16 rounded-full border-4 border-rose-500/15 border-t-rose-500 animate-spin mb-6"></div>
          <span className="px-3 py-1 rounded bg-rose-500/10 border border-rose-500/25 text-xs font-black text-rose-450 uppercase tracking-widest mb-3">
            Waiting for Organiser
          </span>
          <h2 className="text-2xl font-black text-white uppercase">Checkout in Progress</h2>
          <p className="text-slate-400 text-sm mt-3.5 max-w-sm leading-relaxed font-semibold">
            All seats are locked! The organiser is completing the payment. Please stay on this screen to view your ticket confirmation.
          </p>
        </div>
      )}

      {/* Confirmed Booking Overlay */}
      {bookingConfirmed && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md animate-fade-in text-center p-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 flex items-center justify-center mb-6 animate-bounce">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-xs font-black text-emerald-440 uppercase tracking-widest mb-3 animate-pulse">
            Payment Confirmed
          </span>
          <h2 className="text-3xl font-black text-white uppercase">Your Seat is Confirmed!</h2>
          <p className="text-slate-400 text-sm mt-3.5 max-w-md leading-relaxed font-semibold">
            The booking has been successfully completed. The organiser has received the tickets and receipt details. Enjoy your movie!
          </p>
          <button
            onClick={() => {
              sessionStorage.clear();
              navigate('/movies');
            }}
            className="mt-8 px-8 py-3 bg-slate-900 border border-slate-800 text-xs font-bold text-white rounded-xl hover:bg-slate-850 active:scale-[0.98] transition-all"
          >
            Back to Browse Movies
          </button>
        </div>
      )}
    </div>
  )
}
