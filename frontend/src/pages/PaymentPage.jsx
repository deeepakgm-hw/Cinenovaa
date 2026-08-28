import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import NavBar from '../components/NavBar'
import { API_BASE_URL, API_ORIGIN } from '../config/apiConfig'

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


const snackCatalog = [
  { id: 1, name: 'Large Butter Popcorn', price: 250.0, desc: 'Hot buttered classic cinema tub.' },
  { id: 2, name: 'Cheese Nachos Dip', price: 180.0, desc: 'Crispy chips served with hot cheese dip.' },
  { id: 3, name: 'Coca Cola Large Cup', price: 120.0, desc: 'Ice cold carbonated cola refresher.' }
]

export default function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionCode = searchParams.get('session')
  const [movie, setMovie] = useState(null)
  const [showtime, setShowtime] = useState(null)
  const [seats, setSeats] = useState([])
  const [ticketCost, setTicketCost] = useState(0)

  const [selectedSnacks, setSelectedSnacks] = useState({}) // { snackId: quantity }
  const [paymentMethod, setPaymentMethod] = useState('WALLET')
  const [redeemLoyalty, setRedeemLoyalty] = useState(false)
  const [walletBalance, setWalletBalance] = useState(100.0)
  const [loyaltyPoints, setLoyaltyPoints] = useState(50)
  
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Hold Timer state
  const [timeLeft, setTimeLeft] = useState(0)
  const [qrTimeLeft, setQrTimeLeft] = useState(300)

  // Mock Razorpay Modal states
  const [showMockRzp, setShowMockRzp] = useState(false)
  const [mockPaymentStep, setMockPaymentStep] = useState('METHODS') // METHODS, CARD_INPUT, OTP_VERIFY, QR_SCAN, PROCESSING
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [upiId, setUpiId] = useState('')
  const [paymentOtp, setPaymentOtp] = useState('')
  const [paymentOrderId, setPaymentOrderId] = useState('')
  const [paymentKey, setPaymentKey] = useState('')
  const [utrNumber, setUtrNumber] = useState('')

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      navigate('/')
      return
    }
    const parsedUser = JSON.parse(storedUser)
    setUser(parsedUser)

    // Load booking state
    const storedMovie = sessionStorage.getItem('selectedMovie')
    const storedShowtime = sessionStorage.getItem('selectedShowtime')
    const storedSeats = sessionStorage.getItem('selectedSeats')
    const storedCost = sessionStorage.getItem('ticketsCost')
    const lockExpiresAt = sessionStorage.getItem('lockExpiresAt')

    if (!storedMovie || !storedShowtime || !storedSeats) {
      navigate('/movies')
      return
    }

    setMovie(JSON.parse(storedMovie))
    setShowtime(JSON.parse(storedShowtime))
    setSeats(JSON.parse(storedSeats))
    setTicketCost(parseFloat(storedCost || '0'))

    // Initialize checkout countdown
    if (lockExpiresAt) {
      const remaining = Math.max(0, Math.floor((parseInt(lockExpiresAt) - Date.now()) / 1000))
      if (remaining === 0) {
        navigate('/movies')
      } else {
        setTimeLeft(remaining)
      }
    }

    // Fetch user wallet info
    fetchWalletInfo(parsedUser.id)
  }, [])

  // Timer Effect
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleLockExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Countdown timer for QR payment (5 minutes = 300 seconds)
  useEffect(() => {
    if (showMockRzp && mockPaymentStep === 'QR_SCAN' && qrTimeLeft > 0) {
      const timer = setInterval(() => {
        setQrTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleQrExpired()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [showMockRzp, mockPaymentStep, qrTimeLeft])

  // Real-time payment verification polling
  useEffect(() => {
    let pollInterval
    if (showMockRzp && mockPaymentStep === 'QR_SCAN' && paymentOrderId) {
      pollInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/payment/status/${paymentOrderId}`)
          if (res.data && res.data.success) {
            if (res.data.status === 'PAID') {
               clearInterval(pollInterval)
              // Store booking confirmation details and go to ticket page
              sessionStorage.setItem('confirmedBooking', JSON.stringify(res.data))
              setShowMockRzp(false)
              navigate('/ticket')
            } else if (res.data.status === 'FAILED' || res.data.status === 'EXPIRED') {
              clearInterval(pollInterval)
              setError('Payment failed or expired.')
              setShowMockRzp(false)
            }
          }
        } catch (err) {
          console.error('[POLLING ERROR] Failed to fetch payment status:', err.message)
        }
      }, 2500)
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [showMockRzp, mockPaymentStep, paymentOrderId])

  const fetchWalletInfo = async (userId) => {
    if (!userId) return
    try {
      const res = await axios.get(`${API_BASE_URL}/wallet/${userId}`)
      if (res.data && res.data.success) {
        setWalletBalance(res.data.balance)
        setLoyaltyPoints(res.data.loyaltyPoints)
      }
    } catch (err) {
      console.error('Failed to get wallet details:', err)
      setWalletBalance(100.00)
      setLoyaltyPoints(50)
    }
  }

  const handleLockExpired = async () => {
    setError('Your seat lock hold has expired. Returning to movies page.')
    if (showtime && user && seats.length > 0) {
      await axios.post(`${API_BASE_URL}/seats/release`, {
        showtimeId: showtime.id,
        userId: user.id,
        seats
      }).catch(() => null)
    }
    setTimeout(() => {
      navigate('/movies')
    }, 2500)
  }

  const handleCancelPayment = async () => {
    setLoading(true)
    if (paymentOrderId) {
      await axios.post(`${API_BASE_URL}/payments/cancel`, {
        orderId: paymentOrderId,
        reason: 'USER_CANCELLED'
      }).catch(() => null)
    }
    setLoading(false)
    setShowMockRzp(false)
    setError('Payment cancelled. Seats are still locked for you. Complete your order before timeout.')
  }

  const handleQrExpired = async () => {
    setLoading(true)
    if (paymentOrderId) {
      await axios.post(`${API_BASE_URL}/payments/cancel`, {
        orderId: paymentOrderId,
        reason: 'EXPIRED'
      }).catch(() => null)
    }
    setLoading(false)
    setShowMockRzp(false)
    setError('Payment session expired. Locked seats have been released.')
    setTimeout(() => {
      navigate('/movies')
    }, 2500)
  }

  const handleSnackQtyChange = (snackId, delta) => {
    setSelectedSnacks(prev => {
      const current = prev[snackId] || 0
      const next = Math.max(0, current + delta)
      return { ...prev, [snackId]: next }
    })
  }

  const getSnackCost = () => {
    return Object.entries(selectedSnacks).reduce((acc, [snackId, qty]) => {
      const item = snackCatalog.find(s => s.id === parseInt(snackId))
      return acc + (item ? item.price * qty : 0)
    }, 0)
  }

  const getGst = () => {
    return (ticketCost + getSnackCost()) * 0.18
  }

  const getFinalTotal = () => {
    let subtotal = ticketCost + getSnackCost() + getGst()
    if (redeemLoyalty) {
      const discount = Math.min(loyaltyPoints, subtotal)
      subtotal -= discount
    }
    return Math.max(0, subtotal)
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePay = async () => {
    setError('')
    setLoading(true)

    const finalAmount = getFinalTotal()

    // 1. If WALLET payment, handle directly in backend (no gateway needed)
    if (paymentMethod === 'WALLET') {
      if (walletBalance < finalAmount) {
        setError('Insufficient balance in CineNova Wallet. Choose another payment option.')
        setLoading(false)
        return
      }
      submitPaymentConfirm(null, null, null)
      return
    }

    // 2. Gateway payments (CARD or UPI): fetch Order ID from server
    try {
      const snacksPayload = Object.entries(selectedSnacks)
        .filter(([_, qty]) => qty > 0)
        .map(([snackId, qty]) => {
          const item = snackCatalog.find(s => s.id === parseInt(snackId))
          return {
            snackId: parseInt(snackId),
            quantity: qty,
            price: item ? item.price : 0
          }
        })

      const orderRes = await axios.post(`${API_BASE_URL}/payments/create-order`, {
        amount: finalAmount,
        userId: user.id,
        showtimeId: showtime.id,
        seats: seats.join(','),
        paymentMethod: paymentMethod,
        snacks: snacksPayload
      })

      if (orderRes.data.success) {
        const orderId = orderRes.data.orderId
        const key = orderRes.data.key
        
        setPaymentOrderId(orderId)
        setPaymentKey(key)

        // Check if it's a mock key or if the official SDK should be bypassed
        const isMock = key === 'rzp_test_mockkey' || orderId.startsWith('order_mock_')

        if (isMock) {
          // Launch the custom Mock Razorpay Dialog Sheet
          if (paymentMethod === 'CARD') {
            setMockPaymentStep('CARD_INPUT')
          } else if (paymentMethod === 'UPI') {
            setQrTimeLeft(300)
            setMockPaymentStep('QR_SCAN')
          } else {
            setMockPaymentStep('METHODS')
          }
          setShowMockRzp(true)
        } else {
          // Load official Razorpay Checkout SDK script
          const scriptLoaded = await loadRazorpayScript()
          if (!scriptLoaded) {
            setError('Failed to load payment gateway SDK. Please check your internet connection.')
            setLoading(false)
            return
          }

          const options = {
            key,
            amount: orderRes.data.amount,
            currency: orderRes.data.currency,
            name: 'CineNova',
            description: 'Premium Movie Reservation Checkout',
            order_id: orderId,
            handler: function (response) {
              submitPaymentConfirm(
                response.razorpay_payment_id,
                response.razorpay_order_id,
                response.razorpay_signature
              )
            },
            modal: {
              ondismiss: function () {
                // If user closes Razorpay dialog, unlock seats or notify them
                setLoading(false)
                setError('Payment gateway modal closed. Transaction cancelled.')
              }
            },
            theme: {
              color: '#e11d48'
            }
          }

          const rzp = new window.Razorpay(options)
          rzp.open()
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment order. Gateway offline.')
      setLoading(false)
    }
  }

  // Submit payment confirmation details to backend
  const submitPaymentConfirm = async (paymentId, orderId, signature) => {
    setLoading(true)
    try {
      const snacksPayload = Object.entries(selectedSnacks)
        .filter(([_, qty]) => qty > 0)
        .map(([snackId, qty]) => {
          const item = snackCatalog.find(s => s.id === parseInt(snackId))
          return {
            snackId: parseInt(snackId),
            quantity: qty,
            price: item ? item.price : 0
          }
        })

      const payload = {
        userId: user.id,
        showtimeId: showtime.id,
        seats: seats.join(','),
        totalAmount: getFinalTotal(),
        paymentMethod: paymentMethod,
        snacks: snacksPayload,
        razorpayPaymentId: paymentId,
        razorpayOrderId: orderId,
        razorpaySignature: signature,
        groupSessionCode: sessionCode || null
      }

      const res = await axios.post(`${API_BASE_URL}/payments/confirm`, payload)
      
      if (res.data.success) {
        sessionStorage.setItem('confirmedBooking', JSON.stringify(res.data))
        setShowMockRzp(false)
        navigate('/ticket')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment confirmation failed. Seats released if timeout occurred.')
      setShowMockRzp(false)
    } finally {
      setLoading(false)
    }
  }

  // Triggered from Mock Razorpay Modal on successful mock verification (e.g. Card payment)
  const handleMockPaymentSuccess = () => {
    setMockPaymentStep('PROCESSING')
    const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substr(2, 9)
    const mockSignature = 'sig_mock_' + Math.random().toString(36).substr(2, 15)

    setTimeout(() => {
      submitPaymentConfirm(mockPaymentId, paymentOrderId, mockSignature)
    }, 1500)
  }

  // Verify manual payment UTR in real-time
  const handleVerifyUtr = async () => {
    setError('')
    if (!utrNumber || utrNumber.length !== 12) {
      setError('Please enter a valid 12-digit UPI UTR number.')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/payments/verify-utr`, {
        orderId: paymentOrderId,
        utr: utrNumber
      })
      if (res.data.success) {
        setMockPaymentStep('PROCESSING')
        const statusRes = await axios.get(`${API_BASE_URL}/payment/status/${paymentOrderId}`)
        if (statusRes.data.success && statusRes.data.status === 'PAID') {
          sessionStorage.setItem('confirmedBooking', JSON.stringify(statusRes.data))
          setShowMockRzp(false)
          navigate('/ticket')
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'UTR verification failed. Please verify the transaction details.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen text-slate-100 bg-[#07070a]">
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900/60 pb-5">
          <div>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
              Checkout Panel
            </span>
            <h2 className="text-3xl font-black text-white mt-3.5 leading-none">Confirm Billing Order</h2>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-[10px] uppercase tracking-wider px-5 py-2.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-full font-bold transition-all w-max"
          >
            ← Back to Seats
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {timeLeft > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-350 text-xs font-bold flex justify-between items-center tracking-wider uppercase">
            <span>⏰ Complete your transaction before the seat hold expires.</span>
            <span className="text-sm font-black bg-amber-500/25 px-3.5 py-1 rounded-lg text-yellow-400">
              {formatTime(timeLeft)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout options */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Snack Selector */}
            <div className="rounded-3xl bg-slate-900/20 border border-slate-900 p-8">
              <h3 className="text-xl font-bold text-white mb-1.5">Concessions Combo Addons</h3>
              <p className="text-xs text-slate-500 font-medium">Pre-order gourmet movie snacks and beverages for screen pickup</p>
              
              <div className="space-y-4 mt-6">
                {snackCatalog.map(snack => {
                  const qty = selectedSnacks[snack.id] || 0
                  return (
                    <div key={snack.id} className="flex justify-between items-center p-4 rounded-2xl bg-black/20 border border-slate-900 hover:border-slate-800/80 transition-all animate-fade-in">
                      <div>
                        <h4 className="font-bold text-white text-sm">{snack.name}</h4>
                        <p className="text-slate-500 text-xs mt-1 font-medium">{snack.desc}</p>
                        <p className="text-xs text-rose-450 font-extrabold mt-2">INR {snack.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <button
                          onClick={() => handleSnackQtyChange(snack.id, -1)}
                          disabled={qty === 0}
                          className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-white">{qty}</span>
                        <button
                          onClick={() => handleSnackQtyChange(snack.id, 1)}
                          className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-black flex items-center justify-center transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Payment Method selection */}
            <div className="rounded-3xl bg-slate-900/20 border border-slate-900 p-8">
              <h3 className="text-xl font-bold text-white mb-1.5">Secure Payment Options</h3>
              <p className="text-xs text-slate-500 font-medium">Complete booking securely using standard gateways</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* Wallet Method */}
                <div
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between min-h-[120px] ${paymentMethod === 'WALLET' ? 'border-rose-500 bg-rose-500/5' : 'border-slate-900 bg-black/20 hover:border-slate-800'}`}
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">CineNova Wallet</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">Instant account billing</p>
                  </div>
                  <div className="text-[10px] font-extrabold text-yellow-500 tracking-wider">
                    BAL: INR {walletBalance.toFixed(2)}
                  </div>
                </div>

                {/* UPI Method */}
                <div
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between min-h-[120px] ${paymentMethod === 'UPI' ? 'border-rose-500 bg-rose-500/5' : 'border-slate-900 bg-black/20 hover:border-slate-800'}`}
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">UPI Portal (Gateway)</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">GPay, PhonePe, Paytm</p>
                  </div>
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Instant scan / VPA</span>
                </div>

                {/* Card Method */}
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between min-h-[120px] ${paymentMethod === 'CARD' ? 'border-rose-500 bg-rose-500/5' : 'border-slate-900 bg-black/20 hover:border-slate-800'}`}
                >
                  <div>
                    <h4 className="font-bold text-white text-sm">Credit / Debit Card</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">Visa, Mastercard, RuPay</p>
                  </div>
                  <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Secure 3DS Gateway</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout sidebar panel */}
          <div className="rounded-3xl bg-slate-900/20 border border-slate-900 p-8 flex flex-col justify-between h-fit">
            <div>
              <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-900/40 pb-3 uppercase tracking-wider">Order Invoice</h3>
              
              <div className="space-y-4">
                {movie && (
                  <div className="border-b border-slate-900/40 pb-4">
                    <p className="text-sm font-bold text-white">{movie.title}</p>
                    <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-1">{showtime?.screenName} | Seats: {seats.join(', ')}</p>
                  </div>
                )}

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">Tickets Base:</span>
                  <span className="font-bold text-white">INR {ticketCost.toFixed(2)}</span>
                </div>

                {getSnackCost() > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider">Snack combos:</span>
                    <span className="font-bold text-white">INR {getSnackCost().toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider">GST tax (18%):</span>
                  <span className="font-bold text-white">INR {getGst().toFixed(2)}</span>
                </div>

                {/* Loyalty Point Redemption */}
                {loyaltyPoints > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-900/40 pt-4 mt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="loyaltyCheck"
                        checked={redeemLoyalty}
                        onChange={(e) => setRedeemLoyalty(e.target.checked)}
                        className="rounded bg-black border-slate-800 text-rose-500 focus:ring-rose-500/20 cursor-pointer"
                      />
                      <label htmlFor="loyaltyCheck" className="text-xs text-slate-400 cursor-pointer font-medium">
                        Redeem Loyalty Points
                      </label>
                    </div>
                    <span className="text-xs font-bold text-yellow-500">
                      -{Math.min(loyaltyPoints, ticketCost + getSnackCost() + getGst()).toFixed(0)} PTS
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-900/40 pt-6">
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Final Total:</span>
                <span className="text-3xl font-black text-yellow-500">INR {getFinalTotal().toFixed(2)}</span>
              </div>

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full bg-gradient-to-r from-rose-600 to-purple-650 hover:from-rose-500 hover:to-purple-550 text-white rounded-2xl py-4 text-xs font-bold tracking-wider uppercase transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Processing Order...' : 'Pay & Confirm'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* STUNNING HIGH-FIDELITY MOCK RAZORPAY DIALOG OVERLAY */}
      {showMockRzp && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0e1017] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Rzp Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-blue-200 tracking-widest uppercase bg-blue-500/20 px-2 py-0.5 rounded">Secure Gateway</span>
                <h3 className="text-lg font-black text-white mt-1">CineNova Payment Gateway</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-blue-200 font-bold uppercase">Amount</p>
                <p className="text-lg font-black text-yellow-350">₹{getFinalTotal().toFixed(2)}</p>
              </div>
            </div>

            {/* Rzp Content */}
            <div className="p-6">
              {mockPaymentStep === 'METHODS' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 font-medium">Select a secure mock gateway method:</p>
                  
                  <button 
                    onClick={() => {
                      if (paymentMethod === 'CARD') setMockPaymentStep('CARD_INPUT')
                      else setMockPaymentStep('QR_SCAN')
                    }}
                    className="w-full p-4 rounded-2xl bg-black/40 border border-slate-800 hover:border-blue-500/50 hover:bg-black/60 transition-all flex items-center gap-3.5 text-left"
                  >
                    <span className="text-xl">
                      {paymentMethod === 'CARD' ? '💳' : '📱'}
                    </span>
                    <div>
                      <p className="font-extrabold text-sm text-white">
                        {paymentMethod === 'CARD' ? 'Pay via Mock Credit/Debit Card' : 'Pay via UPI QR Code scan'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                        {paymentMethod === 'CARD' ? 'Simulate 3D-Secure bank OTP' : 'Render instant mock scan'}
                      </p>
                    </div>
                  </button>

                  <div className="border-t border-slate-900 pt-4 flex gap-3.5">
                    <button 
                      onClick={handleCancelPayment}
                      className="flex-1 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs py-3.5 rounded-2xl transition-all"
                    >
                      Cancel Payment
                    </button>
                  </div>
                </div>
              )}

              {mockPaymentStep === 'CARD_INPUT' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Enter Card Specifications</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Card Number</label>
                      <input 
                        type="text" 
                        maxLength={16}
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-xl bg-black/40 border border-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Expiry Date</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full rounded-xl bg-black/40 border border-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">CVV</label>
                        <input 
                          type="password" 
                          placeholder="***"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full rounded-xl bg-black/40 border border-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3.5 pt-2">
                    <button 
                      onClick={() => setMockPaymentStep('METHODS')}
                      className="flex-1 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs py-3.5 rounded-2xl"
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => {
                        if (cardNumber.length < 16 || cardCvv.length < 3) {
                          setError('Please fill in complete card specifications.')
                          return
                        }
                        setMockPaymentStep('OTP_VERIFY')
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3.5 rounded-2xl"
                    >
                      Authenticate
                    </button>
                  </div>
                </div>
              )}

              {mockPaymentStep === 'OTP_VERIFY' && (
                <div className="space-y-4 text-center">
                  <p className="text-xs text-slate-400 font-medium">
                    A simulated bank 3D-Secure authentication OTP has been sent.
                  </p>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Enter 6-digit Bank OTP</label>
                    <input 
                      type="text" 
                      placeholder="000000"
                      maxLength={6}
                      value={paymentOtp}
                      onChange={(e) => setPaymentOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-28 text-center text-xl tracking-[0.4em] rounded-xl bg-black/40 border border-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-3.5 pt-2">
                    <button 
                      onClick={handleCancelPayment}
                      className="flex-1 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs py-3.5 rounded-2xl"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (paymentOtp.length !== 6) return
                        handleMockPaymentSuccess()
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3.5 rounded-2xl"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </div>
              )}

              {mockPaymentStep === 'QR_SCAN' && (
                <div className="space-y-5 text-center">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Scan UPI QR Code</h4>
                    <p className="text-[22px] font-black text-yellow-500">₹{getFinalTotal().toFixed(2)}</p>
                  </div>
                  
                  {/* Real Kotak Bank QR Code Image (Cropped to display only the QR code) */}
                  <div className="relative w-48 h-48 mx-auto overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-800">
                    <img 
                      src={`${API_ORIGIN}/resources/payment/kotak_qr.png`} 
                      alt="Kotak Bank UPI QR" 
                      className="absolute w-[145%] max-w-none left-1/2 top-[66%] -translate-x-1/2 -translate-y-1/2" 
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-white font-extrabold">Pay to: DEEPAK G M</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">UPI ID: deeepakgm@kotak</p>
                  </div>

                  {/* UTR Input Form */}
                  <div className="bg-black/45 border border-slate-850 rounded-2xl p-4.5 space-y-3.5 max-w-[320px] mx-auto text-left">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Enter 12-Digit UPI Ref / UTR No.
                      </label>
                      <input 
                        type="text" 
                        maxLength={12}
                        placeholder="12-digit transaction UTR"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-sm font-semibold rounded-xl bg-black/60 border border-slate-800 px-4 py-3 text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-550 transition-all font-mono"
                      />
                    </div>
                    <button
                      onClick={handleVerifyUtr}
                      disabled={loading || utrNumber.length !== 12}
                      className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs py-3.5 rounded-xl transition-all uppercase tracking-wider"
                    >
                      {loading ? 'Verifying Reference...' : 'I Have Paid & Verify'}
                    </button>
                  </div>

                  <div className="bg-black/30 rounded-xl py-2 px-3 inline-flex items-center gap-2 text-xs font-bold border border-slate-900">
                    <span className="text-slate-400">Time Remaining:</span>
                    <span className="text-yellow-450 font-black font-mono">{formatTime(qrTimeLeft)}</span>
                  </div>

                  <div className="border-t border-slate-900 pt-4">
                    <button 
                      onClick={handleCancelPayment}
                      className="w-full bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 font-bold text-xs py-3 rounded-xl transition-all"
                    >
                      Cancel Payment
                    </button>
                  </div>
                </div>
              )}

              {mockPaymentStep === 'PROCESSING' && (
                <div className="py-8 text-center space-y-4">
                  <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div>
                    <h4 className="font-extrabold text-white text-sm">Processing transaction...</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Finalizing booking reservations</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
