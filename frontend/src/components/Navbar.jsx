import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Navbar({ profile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch {}
  };

  const handleNotifOpen = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unread > 0) {
      try {
        await API.patch('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch {}
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: '⚡' },
    { path: '/find-mentor', label: 'Find Mentor', icon: '🔍' },
    { path: '/my-sessions', label: 'Sessions', icon: '📅' },
    { path: '/add-tokens', label: 'Wallet', icon: '🪙' },
  ];

  const typeColor = { success: '#22c97e', warning: '#f5c842', error: '#ff5c7a', info: '#8b83ff' };

  return (
    <nav style={s.nav}>
      <div style={s.navInner}>
        <div style={s.logo} onClick={() => navigate('/dashboard')}>
          <span style={s.logoMark}>⚡</span>
          <span style={s.logoText}>NEXUS</span>
          <span style={s.logoDim}>COGNITIVE</span>
        </div>

        <div style={s.links}>
          {navItems.map(item => (
            <button
              key={item.path}
              style={{ ...s.link, ...(location.pathname === item.path ? s.linkActive : {}) }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        <div style={s.right}>
          <div style={s.notifWrap} ref={notifRef}>
            <button style={s.iconBtn} onClick={handleNotifOpen}>
              🔔
              {unread > 0 && <span style={s.badge}>{unread}</span>}
            </button>
            {notifOpen && (
              <div style={s.dropdown}>
                <div style={s.dropHeader}>Notifications</div>
                {notifications.length === 0 ? (
                  <div style={s.emptyNotif}>No notifications yet</div>
                ) : notifications.slice(0, 8).map((n, i) => (
                  <div key={i} style={{ ...s.notifItem, opacity: n.read ? 0.6 : 1 }}>
                    <span style={{ ...s.notifDot, background: typeColor[n.type] || '#6c63ff' }} />
                    <span style={s.notifMsg}>{n.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {profile?.isAdmin && (
            <button style={s.adminBtn} onClick={() => navigate('/admin')}>👑 Admin</button>
          )}

          <button style={s.profileBtn} onClick={() => navigate('/profile')}>
            <span style={s.avatar}>{user?.name?.[0]?.toUpperCase()}</span>
            <span style={s.profileName}>{user?.name?.split(' ')[0]}</span>
          </button>

          <button style={s.logoutBtn} onClick={handleLogout} title="Logout">↪</button>
        </div>
      </div>
    </nav>
  );
}

const s = {
  nav: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(5,5,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1a1a35' },
  navInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px', height: 60 },
  logo: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginRight: 8, flexShrink: 0 },
  logoMark: { fontSize: 20 },
  logoText: { fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: '#e8e8f0', letterSpacing: '0.05em' },
  logoDim: { fontFamily: 'Syne,sans-serif', fontWeight: 400, fontSize: 11, color: '#555570', letterSpacing: '0.12em' },
  links: { display: 'flex', alignItems: 'center', gap: 2, flex: 1 },
  link: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'transparent', border: 'none', color: '#8888aa', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'color 0.15s, background 0.15s', whiteSpace: 'nowrap' },
  linkActive: { color: '#e8e8f0', background: 'rgba(108,99,255,0.12)' },
  right: { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  notifWrap: { position: 'relative' },
  iconBtn: { position: 'relative', width: 36, height: 36, borderRadius: 8, background: '#0f0f22', border: '1.5px solid #1a1a35', color: '#8888aa', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' },
  badge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ff5c7a', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropdown: { position: 'absolute', right: 0, top: 44, width: 300, maxHeight: 360, overflowY: 'auto', background: '#0f0f22', border: '1.5px solid #1a1a35', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.6)', zIndex: 200 },
  dropHeader: { padding: '14px 16px 10px', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: '#8b83ff', borderBottom: '1px solid #1a1a35' },
  emptyNotif: { padding: '20px 16px', color: '#555570', fontSize: 13, textAlign: 'center' },
  notifItem: { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px', borderBottom: '1px solid #0a0a1a' },
  notifDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 6 },
  notifMsg: { fontSize: 13, color: '#c8c8e0', lineHeight: 1.5 },
  adminBtn: { padding: '6px 14px', borderRadius: 8, background: 'rgba(108,99,255,0.15)', border: '1.5px solid rgba(108,99,255,0.4)', color: '#8b83ff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne,sans-serif' },
  profileBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px 5px 5px', borderRadius: 24, background: '#0f0f22', border: '1.5px solid #1a1a35', cursor: 'pointer' },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #6c63ff, #22c97e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff' },
  profileName: { fontSize: 13, fontWeight: 600, color: '#c8c8e0' },
  logoutBtn: { width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '1.5px solid rgba(255,92,122,0.3)', color: '#ff5c7a', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
