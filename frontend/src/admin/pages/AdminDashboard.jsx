import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { IndianRupee, Ticket, CalendarClock, Users } from 'lucide-react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';

const timeAgo = (dateStr) => {
  const s = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [activity, setActivity] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const headers = { 'x-admin-email': user.email };
        
        const [statsRes, activityRes, perfRes, bookingsRes] = await Promise.all([
          axios.get('http://localhost:8080/api/admin/stats', { headers }),
          axios.get('http://localhost:8080/api/admin/activity?days=14', { headers }),
          axios.get('http://localhost:8080/api/admin/performance', { headers }),
          axios.get('http://localhost:8080/api/admin/bookings?limit=10&page=1', { headers })
        ]);

        setStats(statsRes.data);
        setActivity(activityRes.data);
        setPerformance(perfRes.data);
        setRecentBookings(bookingsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const bookingColumns = [
    { key: 'id', label: 'Booking ID', render: r => <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{(r.id || '').toString().slice(0, 8)}...</span> },
    { key: 'user', label: 'User', render: r => r.username || r.user_email },
    { key: 'movie_title', label: 'Movie' },
    { key: 'total_amount', label: 'Amount', render: r => `₹${parseFloat(r.total_amount || 0).toLocaleString('en-IN')}` },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Time', render: r => timeAgo(r.created_at) }
  ];

  if (loading) return <div style={{ color: 'var(--text-primary)' }}>Loading dashboard...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <StatCard label='Total Revenue' value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} delta={stats.revenueDelta} deltaType={stats.revenueDelta?.startsWith('+') ? 'positive' : 'negative'} icon={<IndianRupee size={22} />} accentColor='var(--color-success)' />
        <StatCard label='Tickets Sold' value={(stats.ticketsSold || 0).toLocaleString()} delta={stats.ticketsDelta} deltaType='positive' icon={<Ticket size={22} />} accentColor='var(--color-info)' />
        <StatCard label='Active Shows' value={stats.activeShows || 0} delta='+3 vs yesterday' deltaType='positive' icon={<CalendarClock size={22} />} accentColor='var(--brand-purple)' />
        <StatCard label='Registered Users' value={(stats.registeredUsers || 0).toLocaleString()} delta={`+${stats.newUsersLastWeek || 0} this week`} deltaType='positive' icon={<Users size={22} />} accentColor='#f59e0b' />
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: '6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '18px' }}>Recent Bookings</h2>
            <a href="#" style={{ color: 'var(--brand-purple)', textDecoration: 'none', fontSize: '14px' }}>View All</a>
          </div>
          <DataTable columns={bookingColumns} data={recentBookings} />
        </div>

        <div style={{ flex: '4', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 16px 0', fontSize: '18px' }}>Now Playing Performance</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {performance.map((item, i) => {
              const occupancy = Math.min(100, Math.max(0, (item.booked_seats / item.total_seats) * 100));
              return (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={item.poster_url || 'http://localhost:8080/resources/images/posters/default_poster.png'} alt={item.title} style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600 }}>{item.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }}>{item.showtime_count} theatres</div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'var(--bg-hover)', width: '100%', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--brand-gradient)', width: `${occupancy}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 20px 0', fontSize: '18px' }}>Booking Activity — Last 14 Days</h2>
        <div style={{ height: '280px', width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart data={activity}>
              <XAxis dataKey='date' tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} stroke="var(--text-secondary)" fontSize={12} />
              <YAxis yAxisId='left' stroke="var(--text-secondary)" fontSize={12} />
              <YAxis yAxisId='right' orientation='right' stroke="var(--text-secondary)" fontSize={12} />
              <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.05)' />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }} />
              <Area yAxisId='left' type='monotone' dataKey='bookings' stroke='var(--brand-red)' fill='rgba(232,54,74,0.12)' strokeWidth={2} />
              <Area yAxisId='right' type='monotone' dataKey='revenue' stroke='var(--brand-purple)' fill='rgba(155,93,229,0.08)' strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
