import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, FileText, IndianRupee, Ticket, TrendingUp, XOctagon } from 'lucide-react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import Button from '../../components/Button';
import { API_BASE_URL } from '../../config/apiConfig';

export default function AdminReports() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [activeRange, setActiveRange] = useState('last30');
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = { 'x-admin-email': user.email };
      const res = await axios.get(`${API_BASE_URL}/admin/reports?dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers });
      setReports(res.data);
    } catch (e) {
      addToast('Failed to fetch reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo]);

  const handleRangeClick = (range) => {
    setActiveRange(range);
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = end;
    if (range === 'today') start = end;
    else if (range === 'last7') { const d = new Date(); d.setDate(d.getDate() - 7); start = d.toISOString().split('T')[0]; }
    else if (range === 'last30') { const d = new Date(); d.setDate(d.getDate() - 30); start = d.toISOString().split('T')[0]; }
    else if (range === 'month') { const d = new Date(); d.setDate(1); start = d.toISOString().split('T')[0]; }
    
    if (range !== 'custom') {
      setDateFrom(start);
      setDateTo(end);
    }
  };

  const handleExportCSV = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await axios.get(`${API_BASE_URL}/admin/reports/export/csv?dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers: { 'x-admin-email': user.email }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${dateFrom}_${dateTo}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch(e) {
      addToast('Failed to export CSV', 'error');
    }
  };

  const PIE_COLORS = { wallet: 'var(--brand-purple)', upi: '#3b82f6', card: 'var(--color-success)', cash: '#f59e0b' };

  const columns = [
    { key: 'title', label: 'Movie' },
    { key: 'theatre', label: 'Theatre' },
    { key: 'show_time', label: 'Show Time', render: r => new Date(r.show_time).toLocaleString('en-IN') },
    { key: 'seats_sold', label: 'Seats Sold' },
    { key: 'revenue', label: 'Revenue', render: r => `₹${r.revenue}` },
    { key: 'occupancy', label: 'Occupancy', render: r => (
      <div style={{ width: 80, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${r.occupancy}%`, height: '100%', background: 'var(--brand-gradient)' }}></div>
      </div>
    )}
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '24px' }}>Reports</h1>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['today', 'last7', 'last30', 'month', 'custom'].map(r => (
              <button key={r} onClick={() => handleRangeClick(r)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)', background: activeRange === r ? 'var(--brand-purple)' : 'transparent', color: activeRange === r ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                {r === 'today' ? 'Today' : r === 'last7' ? 'Last 7 Days' : r === 'last30' ? 'Last 30 Days' : r === 'month' ? 'This Month' : 'Custom'}
              </button>
            ))}
          </div>
          {activeRange === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>-</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        <StatCard label='Total Revenue' value={`₹${(reports?.totalRevenue || 0).toLocaleString('en-IN')}`} icon={<IndianRupee size={22} />} accentColor='var(--color-success)' />
        <StatCard label='Avg Order Value' value={`₹${(reports?.avgOrderValue || 0).toLocaleString('en-IN')}`} icon={<TrendingUp size={22} />} accentColor='var(--brand-purple)' />
        <StatCard label='Total Tickets' value={(reports?.totalTickets || 0).toLocaleString()} icon={<Ticket size={22} />} accentColor='var(--color-info)' />
        <StatCard label='Cancellation Rate' value={`${reports?.cancellationRate || 0}%`} icon={<XOctagon size={22} />} accentColor='var(--brand-red)' />
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1, background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 24px 0', fontSize: 18 }}>Revenue by Movie</h2>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={reports?.revenueByMovie || []}>
                <defs><linearGradient id='barGrad' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor='var(--brand-red)'/><stop offset='100%' stopColor='var(--brand-purple)'/></linearGradient></defs>
                <XAxis dataKey='title' tick={props => <text {...props} style={{ fontSize: 10, fill: 'var(--text-tertiary)' }}>{props.payload.value.slice(0, 12)}</text>} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }} />
                <Bar dataKey='revenue' fill='url(#barGrad)' radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ flex: 1, background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ color: 'var(--text-primary)', margin: '0 0 24px 0', fontSize: 18 }}>Revenue by Payment Method</h2>
          <div style={{ height: 300, width: '100%', position: 'relative' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={reports?.revenueByPaymentMethod || []} dataKey="revenue" nameKey="method" cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2}>
                  {(reports?.revenueByPaymentMethod || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.method.toLowerCase()] || 'var(--text-secondary)'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Total</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 700 }}>₹{(reports?.totalRevenue||0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <h2 style={{ color: 'var(--text-primary)', margin: '0 0 16px 0', fontSize: 18 }}>Top Performing Shows</h2>
        <DataTable columns={columns} data={reports?.topShows || []} />
      </div>

      <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
        <Button secondary onClick={handleExportCSV}><Download size={16} style={{marginRight:8}}/> Export CSV</Button>
        <Button secondary onClick={() => addToast('PDF export coming soon', 'info')}><FileText size={16} style={{marginRight:8}}/> Export PDF</Button>
      </div>
    </div>
  );
}
