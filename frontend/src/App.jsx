import { Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MoviesPage from './pages/MoviesPage'
import SeatPage from './pages/SeatPage'
import PaymentPage from './pages/PaymentPage'
import TicketPage from './pages/TicketPage'
import AdminApp from './admin/AdminApp'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Routes>
        <Route path="/"       element={<LoginPage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/home"   element={<MoviesPage />} />
        <Route path="/seats"  element={<SeatPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/ticket" element={<TicketPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </div>
  )
}
