import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Check } from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilterBar from '../components/SearchFilterBar';
import StatusBadge from '../components/StatusBadge';
import SlideOver from '../components/SlideOver';
import { useToast } from '../components/Toast';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

const timeAgo = (dateStr) => {
  const s = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });
  const [slideOpen, setSlideOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelInput, setCancelInput] = useState('');
  const { addToast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'x-admin-email': user.email };
      const res = await axios.get(`http://localhost:8080/api/admin/bookings?page=${page}&limit=20&search=${search}&status=${filters.status}&dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}`, { headers });
      setBookings(res.data.data || []);
    } catch (error) {
      addToast('Failed to fetch bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, search, filters.status, filters.dateFrom, filters.dateTo]);

  const handleCancelBooking = async () => {
    if (cancelInput !== 'CANCEL') return;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.put(`http://localhost:8080/api/admin/bookings/${selectedBooking.id}/cancel`, {}, { headers: { 'x-admin-email': user.email } });
      addToast('Booking cancelled successfully', 'success');
      setSlideOpen(false);
      setCancelInput('');
      fetchBookings();
    } catch (e) {
      addToast('Failed to cancel booking', 'error');
    }
  };

  const columns = [
    { key: 'id', label: 'ID', render: r => <span title={r.id} style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{r.id.toString().slice(0, 8)}</span> },
    { key: 'user', label: 'User', render: r => r.user_email },
    { key: 'movie', label: 'Movie', render: r => r.movie_title },
    { key: 'theatre', label: 'Theatre', render: r => `${r.theatre_name || ''} - ${r.screen_name || ''}` },
    { key: 'seats', label: 'Seats', render: r => {
      let s = [];
      try { s = typeof r.seats === 'string' ? JSON.parse(r.seats) : r.seats; } catch(e){}
      return (s||[]).join(', ');
    }},
    { key: 'amount', label: 'Amount', render: r => <span style={{fontWeight:700}}>₹{r.total_amount}</span> },
    { key: 'payment', label: 'Payment', render: r => <Badge color="ghost">{r.payment_method}</Badge> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'time', label: 'Time', render: r => <span style={{fontSize:12,color:'var(--text-secondary)'}}>{timeAgo(r.created_at)}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <button onClick={() => { setSelectedBooking(r); setCancelInput(''); setSlideOpen(true); }} style={{ background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer' }}>
        <Eye size={16} />
      </button>
    )}
  ];

  const filterOptions = [
    { key: 'status', label: 'Status', options: [{ value: '', label: 'All' }, { value: 'CONFIRMED', label: 'Confirmed' }, { value: 'CANCELLED', label: 'Cancelled' }, { value: 'PENDING', label: 'Pending' }] }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ color: 'var(--text-primary)', margin: '0 0 24px 0', fontSize: '24px' }}>Bookings</h1>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            filters={filterOptions}
            activeFilters={filters}
            onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>to</span>
          <input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
        </div>
      </div>

      <DataTable columns={columns} data={bookings} />

      <SlideOver
        isOpen={slideOpen}
        onClose={() => setSlideOpen(false)}
        title="Booking Details"
        width={520}
      >
        {selectedBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Booking ID</span><div style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{selectedBooking.id}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>User</span><div style={{ color: 'var(--text-primary)' }}>{selectedBooking.user_email}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Movie</span><div style={{ color: 'var(--text-primary)' }}>{selectedBooking.movie_title}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Theatre</span><div style={{ color: 'var(--text-primary)' }}>{selectedBooking.theatre_name} - {selectedBooking.screen_name}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Show Time</span><div style={{ color: 'var(--text-primary)' }}>{new Date(selectedBooking.show_time).toLocaleString('en-IN')}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Seats</span><div style={{ color: 'var(--text-primary)' }}>{(Array.isArray(selectedBooking.seats) ? selectedBooking.seats : (JSON.parse(selectedBooking.seats||'[]'))).join(', ')}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Base Amount</span><div style={{ color: 'var(--text-primary)' }}>₹{selectedBooking.base_amount}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>GST</span><div style={{ color: 'var(--text-primary)' }}>₹{selectedBooking.gst_amount}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Total Amount</span><div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{selectedBooking.total_amount}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Payment Method</span><div style={{ color: 'var(--text-primary)' }}>{selectedBooking.payment_method}</div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Status</span><div><StatusBadge status={selectedBooking.status} /></div></div>
              <div><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Booked At</span><div style={{ color: 'var(--text-primary)' }}>{new Date(selectedBooking.created_at).toLocaleString('en-IN')}</div></div>
            </div>

            {selectedBooking.status !== 'CANCELLED' && (
              <>
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ color: 'var(--brand-red)', margin: 0, fontSize: 16 }}>Cancel Booking</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12, margin: 0 }}>Type CANCEL to confirm</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={cancelInput} onChange={e => setCancelInput(e.target.value)} placeholder="CANCEL" style={{ flex: 1, padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                    <Button danger disabled={cancelInput !== 'CANCEL'} onClick={handleCancelBooking}>Confirm Cancel</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
}
