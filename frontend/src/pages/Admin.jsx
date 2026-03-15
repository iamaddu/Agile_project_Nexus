import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const STATUS_BADGE = {
  pending:   'nx-badge-yellow',
  active:    'nx-badge-green',
  completed: 'nx-badge-blue',
  cancelled: 'nx-badge-neutral',
  refunded:  'nx-badge-neutral',
  disputed:  'nx-badge-red',
};

// ── Reusable modal ────────────────────────────────────────────────────────────
function Modal({ show, title, onClose, children }) {
  if (!show) return null;
  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.box} onClick={e => e.stopPropagation()} className="fade-up">
        <div style={M.head}>
          <h3 style={M.title}>{title}</h3>
          <button style={M.closeBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
const M = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:24 },
  box:     { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'28px 30px', width:'100%', maxWidth:460, boxShadow:'var(--sh-xl)' },
  head:    { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  title:   { fontSize:17, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.01em' },
  closeBtn:{ width:28, height:28, borderRadius:7, background:'var(--n-100)', border:'none', color:'var(--n-500)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile,  setProfile]  = useState(null);
  const [tab,      setTab]      = useState('overview');
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [toast,    setToast]    = useState(null);

  // Modal states
  const [trustModal, setTrustModal] = useState(null);  // { userId, userName, currentScore }
  const [warnModal,  setWarnModal]  = useState(null);  // { userId, userName }
  const [banModal,   setBanModal]   = useState(null);  // { userId, userName, ban }
  const [trustVal,   setTrustVal]   = useState('');
  const [trustNote,  setTrustNote]  = useState('');
  const [warnMsg,    setWarnMsg]    = useState('');
  const [banReason,  setBanReason]  = useState('');
  const [working,    setWorking]    = useState(false);

  useEffect(() => {
    API.get('/users/me')
      .then(r => { setProfile(r.data); if (!r.data.isAdmin) navigate('/dashboard'); })
      .catch(() => navigate('/dashboard'));
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

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Admin actions ─────────────────────────────────────────────────────────
  const handleTrust = async () => {
    const score = parseInt(trustVal);
    if (isNaN(score) || score < 0 || score > 100) return showToast('Trust score must be 0–100', 'error');
    setWorking(true);
    try {
      await API.patch(`/admin/trust/${trustModal.userId}`, { trustScore: score, reason: trustNote || 'Admin adjustment' });
      setUsers(p => p.map(u => u._id === trustModal.userId ? { ...u, trustScore: score } : u));
      showToast(`Trust score updated to ${score} for ${trustModal.userName}`);
      setTrustModal(null);
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    setWorking(false);
  };

  const handleWarn = async () => {
    if (!warnMsg.trim()) return showToast('Enter a warning message', 'error');
    setWorking(true);
    try {
      await API.post(`/admin/warn/${warnModal.userId}`, { message: warnMsg });
      showToast(`Warning sent to ${warnModal.userName}`);
      setWarnModal(null); setWarnMsg('');
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    setWorking(false);
  };

  const handleBan = async () => {
    setWorking(true);
    try {
      await API.patch(`/admin/ban/${banModal.userId}`, { ban: banModal.ban, reason: banReason });
      setUsers(p => p.map(u => u._id === banModal.userId ? { ...u, isBanned: banModal.ban } : u));
      showToast(`${banModal.userName} ${banModal.ban ? 'banned' : 'unbanned'} successfully`);
      setBanModal(null); setBanReason('');
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    setWorking(false);
  };

  const handleRefund = async (sessionId) => {
    if (!window.confirm('Issue a full refund? This will deduct tokens from the mentor.')) return;
    try {
      await API.post(`/admin/refund/${sessionId}`);
      showToast('Refund issued successfully');
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
  };

  const handleResolveDispute = async (sessionId, refund) => {
    const resolution = window.prompt(
      refund ? 'Resolution note (refund will be issued to learner):' : 'Resolution note (dispute will be rejected):'
    );
    if (resolution === null) return;
    try {
      await API.post(`/admin/resolve-dispute/${sessionId}`, { resolution: resolution || 'Resolved by admin', refund });
      showToast(refund ? 'Dispute resolved — learner refunded' : 'Dispute rejected');
      fetchAll();
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const disputed = sessions.filter(s => s.status === 'disputed');

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSessions = sessions.filter(s =>
    !search ||
    s.skill?.toLowerCase().includes(search.toLowerCase()) ||
    s.mentor?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.learner?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { id:'overview',  label:'Overview' },
    { id:'users',     label:`Users (${users.length})` },
    { id:'sessions',  label:`Sessions (${sessions.length})` },
    { id:'disputes',  label:'Disputes', alert: disputed.length > 0, count: disputed.length },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile}/>
      <div style={T.page}>

        {/* Header */}
        <div style={T.pageHead} className="fade-up">
          <div>
            <h1 style={T.title}>Admin Panel</h1>
            <p style={T.sub}>Platform oversight and moderation</p>
          </div>
          <button className="nx-btn-outline" onClick={fetchAll} style={{ fontSize:13, gap:6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-.49-7.5"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ padding:'10px 14px', borderRadius:'var(--r)', border:'1px solid', fontSize:13,
            background: toast.type==='success' ? 'var(--emerald-bg)' : 'var(--rose-bg)',
            borderColor: toast.type==='success' ? 'var(--emerald-bd)' : 'var(--rose-bd)',
            color: toast.type==='success' ? 'var(--emerald)' : 'var(--rose)' }}>
            {toast.msg}
          </div>
        )}

        {/* Tabs */}
        <div style={T.tabBar}>
          {TABS.map(t => (
            <button key={t.id} style={{ ...T.tab, ...(tab===t.id ? T.tabOn : {}) }} onClick={() => setTab(t.id)}>
              {t.label}
              {t.alert && <span style={T.alertDot}/>}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px 0', gap:10, color:'var(--n-400)' }}>
            <div style={{ width:20, height:20, border:'2px solid var(--border)', borderTop:'2px solid var(--brand)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
            Loading…
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && stats && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={T.statGrid}>
                  {[
                    { label:'Total Users',    val:stats.totalUsers,    color:'var(--brand)' },
                    { label:'Mentors',        val:stats.totalMentors,  color:'var(--emerald)' },
                    { label:'Total Sessions', val:stats.totalSessions, color:'var(--amber)' },
                    { label:'Active Now',     val:stats.activeSessions,color:'var(--emerald)' },
                    { label:'Disputed',       val:disputed.length,     color:'var(--rose)' },
                  ].map(s => (
                    <div key={s.label} style={T.statCard}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--n-400)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>{s.label}</div>
                      <div style={{ fontSize:38, fontWeight:800, color:s.color, letterSpacing:'-.03em', lineHeight:1 }}>{s.val}</div>
                    </div>
                  ))}
                </div>

                {/* Session breakdown chips */}
                <div style={T.card}>
                  <div style={T.cardTitle}>Session Breakdown</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:12 }}>
                    {stats.sessionBreakdown?.map(item => (
                      <div key={item._id} style={{ padding:'8px 16px', borderRadius:'var(--r-full)', border:'1.5px solid var(--border)', background:'var(--n-50)', fontSize:13 }}>
                        <span style={{ fontWeight:800, color:'var(--n-800)', marginRight:6 }}>{item.count}</span>
                        <span className={`nx-badge ${STATUS_BADGE[item._id] || 'nx-badge-neutral'}`}>{item._id}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent sessions */}
                <div style={T.card}>
                  <div style={T.cardTitle}>Recent Sessions</div>
                  <div style={{ marginTop:12 }}>
                    <div style={{ ...T.tableHead, gridTemplateColumns:'1fr 1fr 140px 100px 100px' }}>
                      <span>Mentor</span><span>Learner</span><span>Skill</span><span>Status</span><span>Date</span>
                    </div>
                    {stats.recentActivity?.map(sess => (
                      <div key={sess._id} style={{ ...T.tableRow, gridTemplateColumns:'1fr 1fr 140px 100px 100px' }}>
                        <span style={{ fontWeight:600, color:'var(--n-800)', fontSize:14 }}>{sess.mentor?.name}</span>
                        <span style={{ color:'var(--n-700)', fontSize:14 }}>{sess.learner?.name}</span>
                        <span style={{ color:'var(--brand)', fontWeight:600, fontSize:13 }}>{sess.skill}</span>
                        <span><span className={`nx-badge ${STATUS_BADGE[sess.status]||'nx-badge-neutral'}`}>{sess.status}</span></span>
                        <span style={{ color:'var(--n-400)', fontSize:12 }}>{new Date(sess.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === 'users' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ position:'relative', maxWidth:320 }}>
                  <svg style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--n-400)', pointerEvents:'none' }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input className="nx-input" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:32, fontSize:13 }}/>
                </div>
                <div style={T.card}>
                  <div style={T.tableHead} style={{ ...T.tableHead, gridTemplateColumns:'1fr 180px 70px 100px 180px' }}>
                    <span>User</span><span>Email</span><span>Trust</span><span>Role</span><span>Actions</span>
                  </div>
                  {filteredUsers.map(u => (
                    <div key={u._id} style={{ ...T.tableRow, gridTemplateColumns:'1fr 180px 70px 100px 180px', opacity:u.isBanned?.5:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,var(--brand-soft),var(--brand-border))', color:'var(--brand-text)', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:14, color:'var(--n-800)' }}>{u.name}</div>
                          {u.isBanned && <span className="nx-badge nx-badge-red" style={{ fontSize:10 }}>Banned</span>}
                        </div>
                      </div>
                      <span style={{ fontSize:12, color:'var(--n-400)' }}>{u.email}</span>
                      <span style={{ fontWeight:800, fontSize:15, color: u.trustScore>=80?'var(--emerald)':u.trustScore>=50?'var(--amber)':'var(--rose)' }}>
                        {u.trustScore}
                      </span>
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                        {u.isAdmin  && <span className="nx-badge nx-badge-yellow" style={{ fontSize:10 }}>Admin</span>}
                        {u.isMentor && <span className="nx-badge nx-badge-blue"   style={{ fontSize:10 }}>Mentor</span>}
                        {!u.isMentor && !u.isAdmin && <span className="nx-badge nx-badge-neutral" style={{ fontSize:10 }}>Learner</span>}
                      </div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        <button style={T.actBtn} onClick={() => { setTrustModal({ userId:u._id, userName:u.name, currentScore:u.trustScore }); setTrustVal(String(u.trustScore)); setTrustNote(''); }}>
                          Trust
                        </button>
                        <button style={T.actBtn} onClick={() => { setWarnModal({ userId:u._id, userName:u.name }); setWarnMsg(''); }}>
                          Warn
                        </button>
                        <button style={{ ...T.actBtn, borderColor:'var(--rose-bd)', color:'var(--rose)' }}
                          onClick={() => { setBanModal({ userId:u._id, userName:u.name, ban:!u.isBanned }); setBanReason(''); }}>
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div style={{ padding:'24px', textAlign:'center', color:'var(--n-400)', fontSize:13 }}>No users found</div>
                  )}
                </div>
              </div>
            )}

            {/* ── SESSIONS ── */}
            {tab === 'sessions' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={{ position:'relative', maxWidth:320 }}>
                  <svg style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--n-400)', pointerEvents:'none' }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input className="nx-input" placeholder="Search sessions…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft:32, fontSize:13 }}/>
                </div>
                <div style={T.card}>
                  <div style={{ ...T.tableHead, gridTemplateColumns:'1fr 1fr 130px 60px 100px 90px' }}>
                    <span>Mentor</span><span>Learner</span><span>Skill</span><span>Cost</span><span>Status</span><span>Action</span>
                  </div>
                  {filteredSessions.map(sess => (
                    <div key={sess._id} style={{ ...T.tableRow, gridTemplateColumns:'1fr 1fr 130px 60px 100px 90px' }}>
                      <span style={{ fontWeight:600, color:'var(--n-800)', fontSize:14 }}>{sess.mentor?.name}</span>
                      <span style={{ color:'var(--n-700)', fontSize:14 }}>{sess.learner?.name}</span>
                      <span style={{ color:'var(--brand)', fontWeight:600, fontSize:13 }}>{sess.skill}</span>
                      <span style={{ fontWeight:700, color:'var(--n-800)', fontSize:14 }}>{sess.tokenCost}</span>
                      <span><span className={`nx-badge ${STATUS_BADGE[sess.status]||'nx-badge-neutral'}`}>{sess.status}</span></span>
                      <span>
                        {sess.status !== 'refunded' && sess.status !== 'cancelled' ? (
                          <button style={{ ...T.actBtn, borderColor:'var(--rose-bd)', color:'var(--rose)', fontSize:11 }} onClick={() => handleRefund(sess._id)}>
                            Refund
                          </button>
                        ) : (
                          <span style={{ color:'var(--n-300)', fontSize:12 }}>—</span>
                        )}
                      </span>
                    </div>
                  ))}
                  {filteredSessions.length === 0 && (
                    <div style={{ padding:'24px', textAlign:'center', color:'var(--n-400)', fontSize:13 }}>No sessions found</div>
                  )}
                </div>
              </div>
            )}

            {/* ── DISPUTES ── */}
            {tab === 'disputes' && (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {disputed.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'80px 0', color:'var(--n-400)', fontSize:14 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--n-300)" strokeWidth="1.5" strokeLinecap="round" style={{ display:'block', margin:'0 auto 12px' }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    No active disputes — all clear
                  </div>
                ) : disputed.map(sess => (
                  <div key={sess._id} style={T.disputeCard}>
                    <div style={T.disputeTop}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:'var(--n-800)', marginBottom:4 }}>
                          {sess.skill} · {sess.mentor?.name} → {sess.learner?.name}
                        </div>
                        <div style={{ fontSize:13, color:'var(--n-400)' }}>
                          {sess.tokenCost} tokens · ended {sess.endedAt ? new Date(sess.endedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}
                        </div>
                      </div>
                      <span className="nx-badge nx-badge-red">Disputed</span>
                    </div>
                    <div style={T.disputeBody}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--amber)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>
                        Learner's complaint
                      </div>
                      <p style={{ fontSize:14, color:'var(--n-700)', lineHeight:1.6 }}>{sess.disputeReason}</p>
                    </div>
                    <div style={{ display:'flex', gap:10 }}>
                      <button className="nx-btn" onClick={() => handleResolveDispute(sess._id, true)}
                        style={{ fontSize:13, padding:'8px 18px', background:'var(--emerald)', border:'none', boxShadow:'none' }}>
                        Refund Learner
                      </button>
                      <button className="nx-btn-outline" onClick={() => handleResolveDispute(sess._id, false)}
                        style={{ fontSize:13, padding:'8px 18px', borderColor:'var(--rose-bd)', color:'var(--rose)' }}>
                        Reject Dispute
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Trust Score Modal ── */}
      <Modal show={!!trustModal} title={`Set Trust Score — ${trustModal?.userName}`} onClose={() => setTrustModal(null)}>
        <p style={{ fontSize:13, color:'var(--n-400)', marginBottom:16 }}>
          Current: <strong style={{ color:'var(--n-700)' }}>{trustModal?.currentScore}</strong> · Enter new value (0–100)
        </p>
        <label className="nx-label">New trust score</label>
        <input className="nx-input" type="number" min="0" max="100" value={trustVal} onChange={e => setTrustVal(e.target.value)} style={{ marginBottom:12 }} autoFocus/>
        <label className="nx-label">Reason (optional)</label>
        <input className="nx-input" placeholder="Why are you adjusting this?" value={trustNote} onChange={e => setTrustNote(e.target.value)} style={{ marginBottom:20 }}/>
        <div style={{ display:'flex', gap:10 }}>
          <button className="nx-btn-outline" onClick={() => setTrustModal(null)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
          <button className="nx-btn" onClick={handleTrust} disabled={working} style={{ flex:2, justifyContent:'center' }}>
            {working ? 'Saving…' : 'Update Score'}
          </button>
        </div>
      </Modal>

      {/* ── Warn Modal ── */}
      <Modal show={!!warnModal} title={`Warn ${warnModal?.userName}`} onClose={() => setWarnModal(null)}>
        <label className="nx-label">Warning message</label>
        <textarea className="nx-input" placeholder="Describe the violation or issue…" value={warnMsg} onChange={e => setWarnMsg(e.target.value)}
          style={{ height:90, resize:'none', marginBottom:20, marginTop:6 }} autoFocus/>
        <div style={{ display:'flex', gap:10 }}>
          <button className="nx-btn-outline" onClick={() => setWarnModal(null)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
          <button className="nx-btn" onClick={handleWarn} disabled={working}
            style={{ flex:2, justifyContent:'center', background:'var(--amber)', border:'none', boxShadow:'none' }}>
            {working ? 'Sending…' : 'Send Warning'}
          </button>
        </div>
      </Modal>

      {/* ── Ban / Unban Modal ── */}
      <Modal show={!!banModal} title={banModal?.ban ? `Ban ${banModal?.userName}` : `Unban ${banModal?.userName}`} onClose={() => setBanModal(null)}>
        {banModal?.ban ? (
          <>
            <p style={{ fontSize:13, color:'var(--n-500)', lineHeight:1.6, marginBottom:14 }}>
              This user will be immediately locked out of their account and notified with the reason below.
            </p>
            <label className="nx-label">Reason for ban</label>
            <textarea className="nx-input" placeholder="Describe the policy violation…" value={banReason} onChange={e => setBanReason(e.target.value)}
              style={{ height:80, resize:'none', marginBottom:20, marginTop:6 }} autoFocus/>
          </>
        ) : (
          <p style={{ fontSize:14, color:'var(--n-600)', lineHeight:1.6, marginBottom:24 }}>
            <strong>{banModal?.userName}</strong> will be able to log in and use the platform immediately.
          </p>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <button className="nx-btn-outline" onClick={() => setBanModal(null)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
          <button className="nx-btn" onClick={handleBan} disabled={working}
            style={{ flex:2, justifyContent:'center', background:'var(--rose)', border:'none', boxShadow:'none' }}>
            {working ? 'Processing…' : banModal?.ban ? 'Confirm Ban' : 'Confirm Unban'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

const T = {
  page:        { maxWidth:1200, margin:'0 auto', padding:'28px 24px 64px', display:'flex', flexDirection:'column', gap:16 },
  pageHead:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 },
  title:       { fontSize:26, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:3 },
  sub:         { fontSize:13, color:'var(--n-400)' },
  tabBar:      { display:'flex', gap:2, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:4 },
  tab:         { flex:1, padding:'8px 12px', borderRadius:7, border:'none', background:'transparent', color:'var(--n-400)', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all .15s', fontFamily:'var(--f)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, position:'relative', whiteSpace:'nowrap' },
  tabOn:       { background:'var(--brand)', color:'white', fontWeight:700 },
  alertDot:    { width:7, height:7, borderRadius:'50%', background:'var(--rose)', flexShrink:0 },
  statGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 },
  statCard:    { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'18px 20px', boxShadow:'var(--sh-xs)' },
  card:        { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'18px 20px', boxShadow:'var(--sh-xs)' },
  cardTitle:   { fontSize:14, fontWeight:700, color:'var(--n-700)' },
  tableHead:   { display:'grid', padding:'0 4px 10px', fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.06em', textTransform:'uppercase', gap:12, borderBottom:'1px solid var(--border)' },
  tableRow:    { display:'grid', padding:'11px 4px', borderBottom:'1px solid var(--n-50)', gap:12, alignItems:'center' },
  actBtn:      { padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--n-600)', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'var(--f)', transition:'all .15s' },
  disputeCard: { background:'var(--surface)', border:'1px solid var(--rose-bd)', borderRadius:'var(--r-lg)', padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 },
  disputeTop:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 },
  disputeBody: { background:'var(--amber-bg)', border:'1px solid var(--amber-bd)', borderRadius:'var(--r)', padding:'12px 14px' },
};
