import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { type, userId, userName, sessionId }
  const [modalInput, setModalInput] = useState('');
  const [modalInput2, setModalInput2] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    API.get('/users/me').then(r => {
      setProfile(r.data);
      if (!r.data.isAdmin) navigate('/dashboard');
    }).catch(() => navigate('/dashboard'));
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, u, ses] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/sessions'),
      ]);
      setStats(s.data);
      setUsers(u.data);
      setSessions(ses.data);
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type='success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  const handleTrust = async () => {
    try {
      await API.patch(`/admin/trust/${modal.userId}`, { trustScore: parseInt(modalInput), reason: modalInput2 });
      showMsg(`Trust score updated to ${modalInput}`);
      fetchAll();
    } catch { showMsg('Failed', 'error'); }
    setModal(null);
  };

  const handleBan = async (userId, ban) => {
    const reason = ban ? prompt('Reason for ban?') : undefined;
    try {
      await API.patch(`/admin/ban/${userId}`, { ban, reason });
      showMsg(ban ? 'User banned' : 'User unbanned');
      fetchAll();
    } catch { showMsg('Failed', 'error'); }
  };

  const handleWarn = async () => {
    try {
      await API.post(`/admin/warn/${modal.userId}`, { message: modalInput });
      showMsg('Warning sent');
      fetchAll();
    } catch { showMsg('Failed', 'error'); }
    setModal(null);
  };

  const handleRefund = async (sessionId) => {
    if (!confirm('Issue refund for this session?')) return;
    try {
      await API.post(`/admin/refund/${sessionId}`);
      showMsg('Refund issued');
      fetchAll();
    } catch (err) { showMsg(err.response?.data?.message || 'Failed', 'error'); }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSessions = sessions.filter(s =>
    s.skill?.toLowerCase().includes(search.toLowerCase()) ||
    s.mentor?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.learner?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = { pending:'#f5c842', active:'#22c97e', completed:'#8b83ff', cancelled:'#ff5c7a', refunded:'#ff5c7a' };

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.title}>Admin Dashboard</h1>
            <p style={s.sub}>Platform management & oversight</p>
          </div>
          <button className="nx-btn-ghost" onClick={fetchAll} style={{ fontSize:13, padding:'8px 18px' }}>↻ Refresh</button>
        </div>

        {msg && (
          <div style={{ ...s.msg, background: msg.type==='success' ? 'rgba(34,201,126,0.1)' : 'rgba(255,92,122,0.1)', borderColor: msg.type==='success' ? 'rgba(34,201,126,0.3)' : 'rgba(255,92,122,0.3)', color: msg.type==='success' ? '#22c97e' : '#ff5c7a' }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {[{id:'overview',label:'📊 Overview'},{id:'users',label:'👥 Users'},{id:'sessions',label:'📅 Sessions'},{id:'disputes',label:'⚠️ Disputes'}].map(t => (
            <button key={t.id} style={{ ...s.tab, ...(tab===t.id ? s.tabActive : {}) }} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <div style={{ color:'#8888aa', padding:'40px 0' }}>Loading…</div> : (
          <>
            {/* Overview */}
            {tab === 'overview' && stats && (
              <div>
                <div style={s.statsGrid}>
                  {[
                    { label:'Total Users', val: stats.totalUsers, icon:'👥', color:'#8b83ff' },
                    { label:'Mentors', val: stats.totalMentors, icon:'🎓', color:'#22c97e' },
                    { label:'Total Sessions', val: stats.totalSessions, icon:'📅', color:'#f5c842' },
                    { label:'Active Now', val: stats.activeSessions, icon:'🟢', color:'#22c97e' },
                  ].map(stat => (
                    <div key={stat.label} style={s.statCard}>
                      <div style={s.statIcon}>{stat.icon}</div>
                      <div style={{ ...s.statVal, color: stat.color }}>{stat.val}</div>
                      <div style={s.statLabel}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Session breakdown */}
                <div style={s.section}>
                  <h2 style={s.sectionTitle}>Session Breakdown</h2>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {stats.sessionBreakdown?.map(item => (
                      <div key={item._id} style={{ ...s.breakdownChip, borderColor:`${statusColors[item._id] || '#555'}44`, color: statusColors[item._id] || '#888' }}>
                        <span style={{ fontWeight:800, fontSize:20 }}>{item.count}</span>
                        <span style={{ fontSize:12, textTransform:'capitalize' }}>{item._id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div style={s.section}>
                  <h2 style={s.sectionTitle}>Recent Sessions</h2>
                  <div style={s.table}>
                    <div style={s.tableHeader}>
                      <span>Mentor</span><span>Learner</span><span>Skill</span><span>Status</span><span>Date</span>
                    </div>
                    {stats.recentActivity?.map(session => (
                      <div key={session._id} style={s.tableRow}>
                        <span style={{ color:'#e8e8f0' }}>{session.mentor?.name}</span>
                        <span style={{ color:'#e8e8f0' }}>{session.learner?.name}</span>
                        <span style={{ color:'#8b83ff' }}>{session.skill}</span>
                        <span style={{ color: statusColors[session.status] || '#888', textTransform:'capitalize' }}>{session.status}</span>
                        <span style={{ color:'#555570' }}>{new Date(session.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {tab === 'users' && (
              <div>
                <input className="nx-input" placeholder="Search users by name or email…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:360, marginBottom:16 }} />
                <div style={s.table}>
                  <div style={{ ...s.tableHeader, gridTemplateColumns:'1fr 1.5fr 80px 80px 1fr' }}>
                    <span>Name</span><span>Email</span><span>Trust</span><span>Role</span><span>Actions</span>
                  </div>
                  {filteredUsers.map(u => (
                    <div key={u._id} style={{ ...s.tableRow, gridTemplateColumns:'1fr 1.5fr 80px 80px 1fr', opacity: u.isBanned ? 0.6 : 1 }}>
                      <span style={{ color:'#e8e8f0', fontWeight:600 }}>{u.name} {u.isBanned && '🚫'}</span>
                      <span style={{ color:'#8888aa', fontSize:13 }}>{u.email}</span>
                      <span style={{ color: u.trustScore >= 80 ? '#22c97e' : u.trustScore >= 50 ? '#f5c842' : '#ff5c7a', fontWeight:700 }}>{u.trustScore}</span>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {u.isMentor && <span className="nx-badge nx-badge-green" style={{ fontSize:10, padding:'2px 6px' }}>Mentor</span>}
                        {u.isAdmin && <span className="nx-badge nx-badge-yellow" style={{ fontSize:10, padding:'2px 6px' }}>Admin</span>}
                        {!u.isMentor && !u.isAdmin && <span className="nx-badge nx-badge-blue" style={{ fontSize:10, padding:'2px 6px' }}>Learner</span>}
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button style={s.actionBtn} onClick={() => { setModal({type:'trust',userId:u._id,userName:u.name}); setModalInput(String(u.trustScore)); setModalInput2(''); }}>Trust</button>
                        <button style={s.actionBtn} onClick={() => { setModal({type:'warn',userId:u._id,userName:u.name}); setModalInput(''); }}>Warn</button>
                        <button style={{ ...s.actionBtn, borderColor:'rgba(255,92,122,0.3)', color:'#ff5c7a' }} onClick={() => handleBan(u._id, !u.isBanned)}>
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sessions */}
            {tab === 'sessions' && (
              <div>
                <input className="nx-input" placeholder="Search sessions…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:360, marginBottom:16 }} />
                <div style={s.table}>
                  <div style={{ ...s.tableHeader, gridTemplateColumns:'1fr 1fr 1fr 80px 80px 100px' }}>
                    <span>Mentor</span><span>Learner</span><span>Skill</span><span>Tokens</span><span>Status</span><span>Action</span>
                  </div>
                  {filteredSessions.map(sess => (
                    <div key={sess._id} style={{ ...s.tableRow, gridTemplateColumns:'1fr 1fr 1fr 80px 80px 100px' }}>
                      <span style={{ color:'#e8e8f0' }}>{sess.mentor?.name}</span>
                      <span style={{ color:'#e8e8f0' }}>{sess.learner?.name}</span>
                      <span style={{ color:'#8b83ff' }}>{sess.skill}</span>
                      <span style={{ color:'#f5c842', fontWeight:700 }}>{sess.tokenCost}</span>
                      <span style={{ color: statusColors[sess.status] || '#888', textTransform:'capitalize', fontSize:12 }}>{sess.status}</span>
                      {sess.status !== 'refunded' && sess.status !== 'cancelled' ? (
                        <button style={{ ...s.actionBtn, borderColor:'rgba(255,92,122,0.3)', color:'#ff5c7a', fontSize:11 }} onClick={() => handleRefund(sess._id)}>Refund</button>
                      ) : <span style={{ color:'#555570', fontSize:12 }}>—</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>
              {modal.type === 'trust' ? `Set Trust Score — ${modal.userName}` : `Warn User — ${modal.userName}`}
            </h3>
            {modal.type === 'trust' ? (
              <>
                <label className="nx-label">Trust Score (0–100)</label>
                <input className="nx-input" type="number" min="0" max="100" value={modalInput} onChange={e => setModalInput(e.target.value)} />
                <label className="nx-label" style={{ marginTop:12 }}>Reason (optional)</label>
                <input className="nx-input" placeholder="Why are you changing this?" value={modalInput2} onChange={e => setModalInput2(e.target.value)} />
              </>
            ) : (
              <>
                <label className="nx-label">Warning Message</label>
                <textarea className="nx-input" placeholder="Describe the violation…" value={modalInput} onChange={e => setModalInput(e.target.value)} style={{ height:100, resize:'none' }} />
              </>
            )}
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="nx-btn-ghost" onClick={() => setModal(null)} style={{ flex:1 }}>Cancel</button>
              <button className="nx-btn" onClick={modal.type === 'trust' ? handleTrust : handleWarn} style={{ flex:1 }}>
                {modal.type === 'trust' ? 'Update Score' : 'Send Warning'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:1100, margin:'0 auto', padding:'28px 24px' },
  pageHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'#e8e8f0', marginBottom:4 },
  sub: { color:'#8888aa', fontSize:14 },
  msg: { padding:'11px 16px', borderRadius:10, border:'1.5px solid', fontSize:14, marginBottom:16 },
  tabs: { display:'flex', gap:2, marginBottom:24, background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:12, padding:4, maxWidth:480 },
  tab: { flex:1, padding:'9px 16px', borderRadius:10, border:'none', background:'transparent', color:'#8888aa', fontSize:13, cursor:'pointer', transition:'all 0.15s' },
  tabActive: { background:'rgba(108,99,255,0.15)', color:'#e8e8f0', fontWeight:700 },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 },
  statCard: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, padding:'20px', textAlign:'center' },
  statIcon: { fontSize:24, marginBottom:8 },
  statVal: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:32, lineHeight:1, marginBottom:4 },
  statLabel: { color:'#8888aa', fontSize:13 },
  section: { marginBottom:24 },
  sectionTitle: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:16, color:'#e8e8f0', marginBottom:12 },
  breakdownChip: { padding:'14px 18px', background:'#0a0a1a', border:'1.5px solid', borderRadius:12, display:'flex', flexDirection:'column', gap:2, alignItems:'center', minWidth:80 },
  table: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, overflow:'hidden' },
  tableHeader: { display:'grid', gridTemplateColumns:'repeat(5,1fr)', padding:'12px 18px', borderBottom:'1px solid #1a1a35', gap:12, fontSize:11, fontWeight:700, color:'#555570', textTransform:'uppercase', letterSpacing:'0.05em' },
  tableRow: { display:'grid', gridTemplateColumns:'repeat(5,1fr)', padding:'12px 18px', borderBottom:'1px solid #0f0f22', gap:12, fontSize:13, alignItems:'center', transition:'background 0.1s' },
  actionBtn: { padding:'5px 10px', borderRadius:7, background:'transparent', border:'1.5px solid #1a1a35', color:'#8888aa', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500 },
  modalCard: { background:'#0f0f22', border:'1.5px solid #1a1a35', borderRadius:16, padding:'28px 32px', width:'100%', maxWidth:420 },
  modalTitle: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:17, color:'#e8e8f0', marginBottom:20 },
};
