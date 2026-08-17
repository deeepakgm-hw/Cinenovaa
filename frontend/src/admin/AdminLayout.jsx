import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Film, Building2, CalendarClock, Ticket, Users, BarChart3, Settings, LogOut, Bell, RefreshCw, Menu, X, ChevronRight } from 'lucide-react';
import { ToastProvider } from './components/Toast';

const navGroups = [
  { group: 'Overview', items: [{ label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' }] },
  { group: 'Content', items: [{ label: 'Movies', icon: Film, path: '/admin/movies' }, { label: 'Theatres', icon: Building2, path: '/admin/theatres' }, { label: 'Showtimes', icon: CalendarClock, path: '/admin/showtimes' }] },
  { group: 'Operations', items: [{ label: 'Bookings', icon: Ticket, path: '/admin/bookings' }, { label: 'Users', icon: Users, path: '/admin/users' }] },
  { group: 'Analytics', items: [{ label: 'Reports', icon: BarChart3, path: '/admin/reports' }] },
  { group: 'System', items: [{ label: 'Settings', icon: Settings, path: '/admin/settings' }] },
];

function Sidebar({ isMobile, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  
  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('user') || '{}'));
  }, []);

  const handleSignOut = () => {
    localStorage.clear();
    navigate('/');
  };

  const sidebarContent = (
    <div style={{
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      width: 240,
    }}>
      <div style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>
          Cine<span style={{ color: 'var(--brand-red)' }}>Nova</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, background: 'rgba(232,54,74,0.15)', color: 'var(--brand-red)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
          ADMIN
        </div>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}>
            <X size={20} />
          </button>
        )}
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {navGroups.map((g, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-tertiary)', padding: '8px 8px 4px', marginTop: 8 }}>
              {g.group}
            </div>
            {g.items.map((item, j) => (
              <NavLink key={j} to={item.path} onClick={() => isMobile && setMobileOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 'var(--radius-md)', margin: '1px 0',
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  textDecoration: 'none', transition: 'all 200ms', cursor: 'pointer',
                  background: isActive ? 'rgba(232,54,74,0.10)' : 'transparent',
                  color: isActive ? 'var(--brand-red)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid rgba(232,54,74,0.20)' : '1px solid transparent'
                })}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={16} color={isActive ? 'var(--brand-red)' : 'var(--text-secondary)'} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
      
      <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(232,54,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-red)', fontWeight: 700 }}>
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user?.email || 'admin@cinenova.com'}</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        pointerEvents: mobileOpen ? 'auto' : 'none',
        display: 'flex'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', opacity: mobileOpen ? 1 : 0, transition: 'opacity 300ms' }} onClick={() => setMobileOpen(false)} />
        <div style={{ position: 'relative', transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 300ms ease', height: '100vh' }}>
          {sidebarContent}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, zIndex: 200 }}>
      {sidebarContent}
    </div>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  
  const getPageTitle = (pathname) => {
    if (pathname.includes('/dashboard')) return 'Dashboard';
    if (pathname.includes('/movies')) return 'Movie Management';
    if (pathname.includes('/theatres')) return 'Theatre Management';
    if (pathname.includes('/showtimes')) return 'Showtime Management';
    if (pathname.includes('/bookings')) return 'Booking Management';
    if (pathname.includes('/users')) return 'User Management';
    if (pathname.includes('/reports')) return 'Revenue Reports';
    if (pathname.includes('/settings')) return 'Platform Settings';
    return 'Admin Panel';
  };
  
  const pageTitle = getPageTitle(location.pathname);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ToastProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <Sidebar isMobile={isMobile} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        
        <main style={{ marginLeft: isMobile ? 0 : 240, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            height: 64, position: 'sticky', top: 0, zIndex: 100,
            background: 'rgba(8,10,15,0.88)', backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {isMobile && (
                <button onClick={() => setMobileOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 0 }}>
                  <Menu size={24} />
                </button>
              )}
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{pageTitle}</h1>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  Admin <ChevronRight size={10} /> {pageTitle}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {time.toLocaleString()}
              </div>
              <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <RefreshCw size={16} />
              </button>
              <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Bell size={18} />
              </button>
            </div>
          </div>
          
          <div style={{ padding: '32px 24px', maxWidth: 1400, width: '100%', margin: '0 auto', flex: 1 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
