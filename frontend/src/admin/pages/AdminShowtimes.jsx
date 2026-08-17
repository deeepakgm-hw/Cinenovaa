import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Trash2, Plus, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilterBar from '../components/SearchFilterBar';
import StatusBadge from '../components/StatusBadge';
import SlideOver from '../components/SlideOver';
import ToggleSwitch from '../components/ToggleSwitch';
import { useToast } from '../components/Toast';
import Button from '../../components/Button';
import Badge from '../../components/Badge';

const ActionBtn = ({ icon, danger, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: 32, height: 32, border: 'none', background: 'transparent',
      borderRadius: '50%', cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--bg-hover)';
      e.currentTarget.style.color = danger ? 'var(--brand-red)' : 'var(--text-primary)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.color = 'var(--text-secondary)';
    }}
  >
    {icon}
  </button>
);

export default function AdminShowtimes() {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ theatreId: '', format: '' });
  const [slideOpen, setSlideOpen] = useState(false);
  const [editShowtime, setEditShowtime] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const { addToast } = useToast();

  const fetchShowtimes = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'x-admin-email': user.email };
      const res = await axios.get(`http://localhost:8080/api/admin/showtimes?page=${page}&limit=20&search=${search}&theatreId=${filters.theatreId}&format=${filters.format}`, { headers });
      setShowtimes(res.data.data || []);
    } catch (error) {
      addToast('Failed to fetch showtimes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'x-admin-email': user.email };
      const [m, t] = await Promise.all([
        axios.get('http://localhost:8080/api/movies?limit=100'),
        axios.get('http://localhost:8080/api/theatres')
      ]);
      setMovies(m.data.data || m.data || []);
      setTheatres(t.data.data || t.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchShowtimes();
  }, [page, search, filters.theatreId, filters.format]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'x-admin-email': user.email };
      if (editShowtime.id) {
        await axios.put(`http://localhost:8080/api/admin/showtimes/${editShowtime.id}`, editShowtime, { headers });
        addToast('Showtime updated successfully', 'success');
      } else {
        await axios.post('http://localhost:8080/api/admin/showtimes', editShowtime, { headers });
        addToast('Showtime added successfully', 'success');
      }
      setSlideOpen(false);
      fetchShowtimes();
    } catch (error) {
      addToast('Failed to save showtime', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete showtime?')) return;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.delete(`http://localhost:8080/api/admin/showtimes/${id}`, { headers: { 'x-admin-email': user.email } });
      addToast('Showtime deleted', 'success');
      fetchShowtimes();
    } catch (e) {
      addToast('Failed to delete showtime', 'error');
    }
  };

  const formatBadge = (fmt) => {
    if(fmt === 'IMAX') return <Badge color="info">IMAX</Badge>;
    if(fmt === 'Dolby') return <Badge color="primary">Dolby</Badge>;
    return <Badge color="ghost">2D</Badge>;
  };

  const columns = [
    { key: 'movie_title', label: 'Movie' },
    { key: 'theatre_name', label: 'Theatre', render: r => `${r.theatre_name}` },
    { key: 'screen_name', label: 'Screen' },
    { key: 'show_time', label: 'Date & Time', render: r => {
        const d = new Date(r.show_time);
        return d.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'}) + ' · ' + d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
    }},
    { key: 'format', label: 'Format', render: r => formatBadge(r.screen_type) },
    { key: 'price', label: 'Price', render: r => <span style={{fontWeight:600}}>₹{r.price}</span> },
    { key: 'surge', label: 'Surge', render: r => r.is_surge ? <Badge color="warning">Surge</Badge> : null },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={new Date(r.show_time) > new Date() ? 'confirmed' : 'inactive'} /> },
    {
      key: 'actions', label: 'Actions', render: r => (
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionBtn icon={<Pencil size={14} />} onClick={(e) => { e.stopPropagation(); setEditShowtime(r); setSlideOpen(true); }} />
          <ActionBtn icon={<Trash2 size={14} />} danger onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} />
        </div>
      )
    }
  ];

  const filterOptions = [
    { key: 'format', label: 'Format', options: [{ value: '', label: 'All' }, { value: 'Standard', label: 'Standard' }, { value: 'IMAX', label: 'IMAX' }, { value: 'Dolby', label: 'Dolby' }] }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ color: 'var(--text-primary)', margin: '0 0 24px 0', fontSize: '24px' }}>Showtimes</h1>
      
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        filters={filterOptions}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
        rightAction={<Button primary onClick={() => { setEditShowtime({ movie_id: '', theatre_id: '', screen_name: '', show_time: '', price: 200, screen_type: 'Standard', show_type: '2D', total_seats: 100, is_surge: false }); setSlideOpen(true); }}><Plus size={16} style={{marginRight:8}}/> Add Showtime</Button>}
      />

      <div style={{ marginTop: '24px' }}>
        <DataTable columns={columns} data={showtimes} />
      </div>

      <SlideOver
        isOpen={slideOpen}
        onClose={() => setSlideOpen(false)}
        title={editShowtime?.id ? 'Edit Showtime' : 'Add Showtime'}
        width={480}
      >
        {editShowtime && (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Movie</label>
              <select value={editShowtime.movie_id} onChange={e => setEditShowtime({ ...editShowtime, movie_id: e.target.value })} required style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                <option value="">Select Movie</option>
                {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Theatre</label>
              <select value={editShowtime.theatre_id} onChange={e => setEditShowtime({ ...editShowtime, theatre_id: e.target.value })} required style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                <option value="">Select Theatre</option>
                {theatres.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Screen Name</label>
                <input value={editShowtime.screen_name} onChange={e => setEditShowtime({ ...editShowtime, screen_name: e.target.value })} required style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Show Time</label>
                <input type="datetime-local" value={editShowtime.show_time ? new Date(editShowtime.show_time).toISOString().slice(0, 16) : ''} onChange={e => setEditShowtime({ ...editShowtime, show_time: e.target.value })} required style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Price (₹)</label>
                <input type="number" value={editShowtime.price} onChange={e => setEditShowtime({ ...editShowtime, price: parseInt(e.target.value) })} required style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Total Seats</label>
                <input type="number" value={editShowtime.total_seats} onChange={e => setEditShowtime({ ...editShowtime, total_seats: parseInt(e.target.value) })} required style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Screen Type</label>
                <select value={editShowtime.screen_type} onChange={e => setEditShowtime({ ...editShowtime, screen_type: e.target.value })} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="IMAX">IMAX</option>
                  <option value="Dolby">Dolby</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Show Type</label>
                <select value={editShowtime.show_type} onChange={e => setEditShowtime({ ...editShowtime, show_type: e.target.value })} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                  <option value="2D">2D</option>
                  <option value="3D">3D</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Surge Pricing</label>
              <ToggleSwitch checked={editShowtime.is_surge} onChange={(c) => setEditShowtime({ ...editShowtime, is_surge: c })} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <Button secondary onClick={() => setSlideOpen(false)}>Cancel</Button>
              <Button primary type="submit">Save Changes</Button>
            </div>
          </form>
        )}
      </SlideOver>
    </div>
  );
}
