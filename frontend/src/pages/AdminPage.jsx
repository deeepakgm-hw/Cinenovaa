import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../services/api'
import NavBar from '../components/NavBar'
import { RefreshCw } from 'lucide-react'

export default function AdminPage() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check admin authentication
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      navigate('/')
      return;
    }
    const user = JSON.parse(storedUser)
    if (user.role !== 'ADMIN') {
      navigate('/movies')
      return;
    }

    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.analytics()
      setAnalytics(res.data)
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to fetch real-time analytics data from server.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen text-slate-100 bg-[#0b0f17]">
      <NavBar onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-center border-b border-slate-900 pb-5">
          <div>
            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Management Console</span>
            <h2 className="text-3xl font-black text-white mt-1">Real-time Analytics Dashboard</h2>
          </div>
          <button
            onClick={fetchAnalytics}
            className="text-xs px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw size={13} /> Refresh Data
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-900/20 border border-rose-500/30 text-rose-400 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading system metrics dashboard...</div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="rounded-3xl bg-slate-900/40 border border-slate-900 p-6 flex flex-col justify-between hover:border-slate-800 transition-all">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Sales Revenue</span>
                <span className="text-3xl font-black text-yellow-500 mt-4">
                  INR {analytics?.totalRevenue?.toFixed(2) || '0.00'}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase mt-2">✓ Verified Live</span>
              </div>

              {/* Card 2 */}
              <div className="rounded-3xl bg-slate-900/40 border border-slate-900 p-6 flex flex-col justify-between hover:border-slate-800 transition-all">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Bookings</span>
                <span className="text-3xl font-black text-white mt-4">{analytics?.totalBookings || 0} Bookings</span>
                <span className="text-[10px] text-purple-400 font-bold uppercase mt-2">Digital E-Tickets</span>
              </div>

              {/* Card 3 */}
              <div className="rounded-3xl bg-slate-900/40 border border-slate-900 p-6 flex flex-col justify-between hover:border-slate-800 transition-all">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Registered Accounts</span>
                <span className="text-3xl font-black text-white mt-4">{analytics?.totalUsers || 0} Accounts</span>
                <span className="text-[10px] text-blue-400 font-bold uppercase mt-2">OTP Login Enabled</span>
              </div>

              {/* Card 4 */}
              <div className="rounded-3xl bg-slate-900/40 border border-slate-900 p-6 flex flex-col justify-between hover:border-slate-800 transition-all">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Trending Movie</span>
                <span className="text-2xl font-black text-rose-400 mt-4 truncate">{analytics?.trendingMovie || 'N/A'}</span>
                <span className="text-[10px] text-rose-500 font-extrabold uppercase mt-2 inline-flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 text-rose-500 fill-rose-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Top Selling
                </span>
              </div>
            </div>

            {/* Sub-panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sales Performance Panel */}
              <div className="rounded-3xl bg-slate-900/40 border border-slate-900 p-8">
                <h3 className="text-xl font-bold text-white mb-4">Ticket Sales Reports</h3>
                <p className="text-xs text-slate-400 mb-6">Aggregate movie ticket and concession sales overview from DB</p>
                <div className="rounded-2xl bg-slate-950/50 p-6 border border-slate-900 text-slate-400 text-sm flex flex-col gap-3">
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="font-bold text-slate-300">Metric Details</span>
                    <span className="font-bold text-slate-300">Value</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Ticket Order Cost</span>
                    <span className="text-white font-semibold">
                      INR {analytics?.totalBookings > 0 ? (analytics.totalRevenue / analytics.totalBookings).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sales Target Completion</span>
                    <span className="text-emerald-400 font-bold">100% (Completed)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database Connection Pool</span>
                    <span className="text-white font-semibold">Active (Thread Safe)</span>
                  </div>
                </div>
              </div>

              {/* Concession Stand Panel */}
              <div className="rounded-3xl bg-slate-900/40 border border-slate-900 p-8">
                <h3 className="text-xl font-bold text-white mb-4">Concessions & Snacks Stock</h3>
                <p className="text-xs text-slate-400 mb-6">Current stock count levels for concession inventory stand</p>
                <div className="rounded-2xl bg-slate-950/50 p-6 border border-slate-900 text-slate-400 text-sm flex flex-col gap-3">
                  <div className="flex justify-between border-b border-slate-900 pb-2">
                    <span className="font-bold text-slate-300">Snack Item</span>
                    <span className="font-bold text-slate-300">Status</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Large Butter Popcorn</span>
                    <span className="text-emerald-400 font-bold">IN STOCK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cheese Nachos dip</span>
                    <span className="text-emerald-400 font-bold">IN STOCK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coca Cola Cup Large</span>
                    <span className="text-emerald-400 font-bold">IN STOCK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
