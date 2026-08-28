import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pencil, Eye, Trash2, Plus, Clock, Star } from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilterBar from '../components/SearchFilterBar';
import StatusBadge from '../components/StatusBadge';
import SlideOver from '../components/SlideOver';
import ToggleSwitch from '../components/ToggleSwitch';
import { useToast } from '../components/Toast';
import Button from '../../components/Button';

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

export default function AdminMovies() {
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', language: '' });
  const [slideOpen, setSlideOpen] = useState(false);
  const [slideMode, setSlideMode] = useState('add');
  const [editMovie, setEditMovie] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const { addToast } = useToast();

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'x-admin-email': user.email };
      
      const res = await axios.get(`${API_BASE_URL}/admin/movies?page=${page}&limit=20&search=${search}&status=${filters.status}&language=${filters.language}`, { headers });
      setMovies(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      addToast('Failed to fetch movies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [page, search, filters.status, filters.language]);

  const handleDelete = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.delete(`${API_BASE_URL}/admin/movies/${id}`, { headers: { 'x-admin-email': user.email } });
      addToast('Movie deleted successfully', 'success');
      setDeleteConfirmId(null);
      fetchMovies();
    } catch (error) {
      addToast('Failed to delete movie', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'x-admin-email': user.email };
      
      if (slideMode === 'add') {
        await axios.post(`${API_BASE_URL}/admin/movies`, editMovie, { headers });
        addToast('Movie added successfully', 'success');
      } else {
        await axios.put(`${API_BASE_URL}/admin/movies/${editMovie.id}`, editMovie, { headers });
        addToast('Movie updated successfully', 'success');
      }
      setSlideOpen(false);
      fetchMovies();
    } catch (error) {
      addToast('Failed to save movie', 'error');
    }
  };

  const columns = [
    { key: 'poster', label: 'Poster', render: r => <img src={r.poster_url || `${API_ORIGIN}/resources/images/posters/default_poster.png`} style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} onError={e => e.target.src = `${API_ORIGIN}/resources/images/posters/default_poster.png`} alt="poster" /> },
    { key: 'title', label: 'Title', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.title}</span> },
    { key: 'genre', label: 'Genre', render: r => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.genre}</span> },
    { key: 'duration', label: 'Runtime', render: r => <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />{r.duration}m</span> },
    { key: 'language', label: 'Language', render: r => <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--bg-hover)', fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, border: '1px solid var(--border-subtle)' }}>{r.language}</span> },
    { key: 'rating', label: 'Rating', render: r => r.rating ? <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Star size={11} fill='#f59e0b' />{parseFloat(r.rating).toFixed(1)}</span> : '-' },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status === 'NOW_SHOWING' ? 'confirmed' : r.status === 'COMING_SOON' ? 'pending' : 'inactive'} text={r.status} /> },
    {
      key: 'actions', label: 'Actions', render: r => (
        deleteConfirmId === r.id ?
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Delete {r.title.slice(0, 20)}?</span>
            <button style={{ padding: '4px 10px', background: 'var(--brand-red)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }} onClick={() => handleDelete(r.id)}>Confirm</button>
            <button style={{ padding: '4px 10px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: 11, cursor: 'pointer' }} onClick={() => setDeleteConfirmId(null)}>Cancel</button>
          </div> :
          <div style={{ display: 'flex', gap: 4 }}>
            <ActionBtn icon={<Pencil size={14} />} onClick={() => { setEditMovie(r); setSlideMode('edit'); setSlideOpen(true) }} />
            <ActionBtn icon={<Eye size={14} />} onClick={() => { setEditMovie(r); setSlideMode('view'); setSlideOpen(true) }} />
            <ActionBtn icon={<Trash2 size={14} />} danger onClick={() => setDeleteConfirmId(r.id)} />
          </div>
      )
    }
  ];

  const filterOptions = [
    { key: 'status', label: 'Status', options: [{ value: '', label: 'All' }, { value: 'NOW_SHOWING', label: 'Now Showing' }, { value: 'COMING_SOON', label: 'Coming Soon' }, { value: 'ENDED', label: 'Ended' }] },
    { key: 'language', label: 'Language', options: [{ value: '', label: 'All' }, { value: 'Hindi', label: 'Hindi' }, { value: 'English', label: 'English' }, { value: 'Tamil', label: 'Tamil' }, { value: 'Telugu', label: 'Telugu' }] }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ color: 'var(--text-primary)', margin: '0 0 24px 0', fontSize: '24px' }}>Movies</h1>
      
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        filters={filterOptions}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
        rightAction={<Button primary onClick={() => { setEditMovie({ title: '', overview: '', duration: 120, language: 'Hindi', status: 'COMING_SOON', rating: 0, poster_url: '' }); setSlideMode('add'); setSlideOpen(true); }}><Plus size={16} style={{marginRight:8}}/> Add Movie</Button>}
      />

      <div style={{ marginTop: '24px' }}>
        <DataTable columns={columns} data={movies} />
      </div>

      <SlideOver
        isOpen={slideOpen}
        onClose={() => setSlideOpen(false)}
        title={slideMode === 'edit' ? 'Edit Movie' : slideMode === 'add' ? 'Add Movie' : 'View Movie'}
        width={480}
      >
        {editMovie && (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Title</label>
              <input disabled={slideMode === 'view'} value={editMovie.title} onChange={e => setEditMovie({ ...editMovie, title: e.target.value })} required style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Overview</label>
              <textarea disabled={slideMode === 'view'} value={editMovie.overview} onChange={e => setEditMovie({ ...editMovie, overview: e.target.value })} rows={4} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Duration (mins)</label>
                <input disabled={slideMode === 'view'} type="number" value={editMovie.duration} onChange={e => setEditMovie({ ...editMovie, duration: parseInt(e.target.value) })} required style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Rating</label>
                <input disabled={slideMode === 'view'} type="number" step="0.1" value={editMovie.rating} onChange={e => setEditMovie({ ...editMovie, rating: parseFloat(e.target.value) })} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Language</label>
                <select disabled={slideMode === 'view'} value={editMovie.language} onChange={e => setEditMovie({ ...editMovie, language: e.target.value })} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                  <option value="Hindi">Hindi</option>
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Status</label>
                <select disabled={slideMode === 'view'} value={editMovie.status} onChange={e => setEditMovie({ ...editMovie, status: e.target.value })} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}>
                  <option value="NOW_SHOWING">NOW_SHOWING</option>
                  <option value="COMING_SOON">COMING_SOON</option>
                  <option value="ENDED">ENDED</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Poster URL</label>
              <input disabled={slideMode === 'view'} value={editMovie.poster_url || ''} onChange={e => setEditMovie({ ...editMovie, poster_url: e.target.value })} style={{ padding: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
            </div>

            {slideMode !== 'view' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <Button secondary onClick={() => setSlideOpen(false)}>Cancel</Button>
                <Button primary type="submit">{slideMode === 'edit' ? 'Save Changes' : 'Add Movie'}</Button>
              </div>
            )}
          </form>
        )}
      </SlideOver>
    </div>
  );
}
