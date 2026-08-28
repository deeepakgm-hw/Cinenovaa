import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Shield, User, Wallet, Sparkles } from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilterBar from '../components/SearchFilterBar';
import StatusBadge from '../components/StatusBadge';
import SlideOver from '../components/SlideOver';
import { useToast } from '../components/Toast';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { API_BASE_URL } from '../../config/apiConfig';

const timeAgo = (dateStr) => {
  if (!dateStr) return 'never';
  const s = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: '' });
  const [slideOpen, setSlideOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [balanceInput, setBalanceInput] = useState(0);
  const { addToast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'x-admin-email': user.email };
      const res = await axios.get(`${API_BASE_URL}/admin/users?page=${page}&limit=20&search=${search}&role=${filters.role}`, { headers });
      setUsers(res.data.data || []);
    } catch (error) {
      addToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, filters.role]);

  const fetchUserDetails = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await axios.get(`${API_BASE_URL}/admin/users/${id}`, { headers: { 'x-admin-email': user.email } });
      setSelectedUser(res.data);
      setSlideOpen(true);
    } catch (e) {
      addToast('Failed to load user details', 'error');
    }
  };

  const handleAdjustBalance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.put(`${API_BASE_URL}/admin/users/${selectedUser.id}/wallet`, { amount: balanceInput }, { headers: { 'x-admin-email': user.email } });
      addToast('Balance updated', 'success');
      setBalanceInput(0);
      fetchUserDetails(selectedUser.id);
      fetchUsers();
    } catch (e) {
      addToast('Failed to update balance', 'error');
    }
  };

  const handleRoleChange = async (newRole) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      await axios.put(`${API_BASE_URL}/admin/users/${selectedUser.id}/role`, { role: newRole }, { headers: { 'x-admin-email': user.email } });
      addToast(`Role updated to ${newRole}`, 'success');
      fetchUserDetails(selectedUser.id);
      fetchUsers();
    } catch (e) {
      addToast('Failed to update role', 'error');
    }
  };

  const getAvatarBg = (name) => `hsl(${(name||'A').charCodeAt(0) * 7 % 360}, 50%, 25%)`;

  const columns = [
    { key: 'avatar', label: '', render: r => <div style={{ width: 36, height: 36, borderRadius: '50%', background: getAvatarBg(r.username), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{(r.username||'U').charAt(0).toUpperCase()}</div> },
    { key: 'username', label: 'Username', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.username}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: r => <StatusBadge status={r.role === 'ADMIN' ? 'confirmed' : 'pending'} text={r.role} /> },
    { key: 'created', label: 'Joined', render: r => timeAgo(r.created_at) },
    { key: 'bookings', label: 'Bookings', render: r => r.total_bookings || 0 },
    { key: 'spent', label: 'Spent', render: r => `₹${r.total_spent || 0}` },
    { key: 'wallet', label: 'Wallet', render: r => `₹${r.wallet_balance || 0}` },
    { key: 'actions', label: 'Actions', render: r => (
      <button onClick={() => fetchUserDetails(r.id)} style={{ background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer' }}>
        <Eye size={16} />
      </button>
    )}
  ];

  const filterOptions = [
    { key: 'role', label: 'Role', options: [{ value: '', label: 'All' }, { value: 'USER', label: 'User' }, { value: 'ADMIN', label: 'Admin' }] }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ color: 'var(--text-primary)', margin: '0 0 24px 0', fontSize: '24px' }}>Users</h1>
      
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        filters={filterOptions}
        activeFilters={filters}
        onFilterChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
      />

      <div style={{ marginTop: '24px' }}>
        <DataTable columns={columns} data={users} />
      </div>

      <SlideOver
        isOpen={slideOpen}
        onClose={() => setSlideOpen(false)}
        title="User Profile"
        width={520}
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: getAvatarBg(selectedUser.username), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600 }}>{(selectedUser.username||'U').charAt(0).toUpperCase()}</div>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedUser.username}</h2>
                <div style={{ color: 'var(--text-secondary)' }}>{selectedUser.email}</div>
                <div style={{ marginTop: 4 }}><StatusBadge status={selectedUser.role === 'ADMIN' ? 'confirmed' : 'pending'} text={selectedUser.role} /></div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: 16 }}>Wallet Balance</h3>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>₹{selectedUser.wallet_balance || 0}</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" value={balanceInput} onChange={e => setBalanceInput(parseFloat(e.target.value))} placeholder="Amount" style={{ width: 120, padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
                <Button primary onClick={handleAdjustBalance}>Adjust Balance</Button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: 16 }}>Role Management</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedUser.role === 'USER' ? 
                  <Button secondary onClick={() => handleRoleChange('ADMIN')}>Promote to Admin</Button> :
                  <Button secondary onClick={() => handleRoleChange('USER')}>Demote to User</Button>
                }
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: 16 }}>Recent Bookings</h3>
              {selectedUser.recent_bookings?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedUser.recent_bookings.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{b.movie_title}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(b.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{b.total_amount}</div>
                        <StatusBadge status={b.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>No recent bookings.</div>
              )}
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
