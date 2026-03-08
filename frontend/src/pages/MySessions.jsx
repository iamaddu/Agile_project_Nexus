import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const STATUS_COLORS = {
  pending:   { bg:'rgba(245,200,66,0.1)',  border:'rgba(245,200,66,0.3)',  color:'#f5c842' },
  active:    { bg:'rgba(34,201,126,0.1)',  border:'rgba(34,201,126,0.3)',  color:'#22c97e' },
  completed: { bg:'rgba(108,99,255,0.1)',  border:'rgba(108,99,255,0.3)',  color:'#8b83ff' },
  cancelled: { bg:'rgba(255,92,122,0.08)', border:'rgba(255,92,122,0.2)',  color:'#ff5c7a' },
  refunded:  { bg:'rgba(255,92,122,0.08)', border:'rgba(255,92,122,0.2)',  color:'#ff5c7a' },
  disputed:  { bg:'rgba(245,200,66,0.12)', border:'rgba(245,200,66,0.4)',  color:'#f5c842' },
};

function StarRating({ value, onChange, readonly }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          style={{ fontSize:20, cursor: readonly ? 'default' : 'pointer', color: n <= value ? '#f5c842' : '#2a2a45', transition:'color 0.1s' }}
          onClick={() => !readonly && onChange && onChange(n)}
        >★</span>
      ))}
    </div>
  );
}

export default function MySessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [ratingModal, setRatingModal] = useState(null); // { session, role }
  const [disputeModal, setDisputeModal] = useState(null); // { session }
  const [ratingVal, setRatingVal] = useState(5);
  const [reviewVal, setReviewVal] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await API.get('/sessions/my-sessions');
      setSessions(res.data);
    } catch {}
    setLoading(false);
  };

  const showMsg = (text, type='success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleCancel = async (sessionId) => {
    if (!confirm('Cancel this session? Tokens will be fully refunded.')) return;
    setCancelling(sessionId);
    try {
      await API.patch(`/sessions/${sessionId}/cancel`);
      fetchSessions();
      showMsg('Session cancelled. Tokens refunded!');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Cancel failed', 'error');
    } finally { setCancelling(null); }
  };

  const handleRate = async () => {
    setActionLoading(true);
    try {
      await API.post(`/sessions/${ratingModal.session._id}/rate`, { rating: ratingVal, review: reviewVal });
      fetchSessions();
      setRatingModal(null);
      showMsg('Rating submitted! Thank you.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed', 'error');
    } finally { setActionLoading(false); }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return showMsg('Please describe the issue', 'error');
    setActionLoading(true);
    try {
      await API.post(`/sessions/${disputeModal.session._id}/dispute`, { reason: disputeReason });
      fetchSessions();
      setDisputeModal(null);
      showMsg('Dispute raised. Admin will review within 24 hours.');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed', 'error');
    } finally { setActionLoading(false); }
  };

  const filtered = sessions.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.skill?.toLowerCase().includes(q) ||
        s.mentor?.name?.toLowerCase().includes(q) ||
        s.learner?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  const isLearner = (s) => s.learner?._id === user?.id || s.learner?.toString() === user?.id;
  const sc = (status) => STATUS_COLORS[status] || STATUS_COLORS.cancelled;

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <h1 style={s.title}>My Sessions</h1>

        {msg && (
          <div style={{ ...s.msg, background: msg.type==='success'?'rgba(34,201,126,0.1)':'rgba(255,92,122,0.1)', borderColor: msg.type==='success'?'rgba(34,201,126,0.3)':'rgba(255,92,122,0.3)', color: msg.type==='success'?'#22c97e':'#ff5c7a' }}>
            {msg.text}
          </div>
        )}

        <div style={s.controls}>
          <input className="nx-input" placeholder="Search by skill, mentor, or learner…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:300 }} />
          <div style={s.filters}>
            {['all','pending','active','completed','disputed','cancelled'].map(f => (
              <button key={f} style={{ ...s.filter, ...(filter===f?s.filterActive:{}) }} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={s.empty}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            {sessions.length === 0 ? (
              <div>
                <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
                <div>No sessions yet.</div>
                <button className="nx-btn" onClick={() => navigate('/find-mentor')} style={{ marginTop:16, padding:'10px 24px' }}>Find a Mentor →</button>
              </div>
            ) : 'No sessions match your filter.'}
          </div>
        ) : (
          <div style={s.list}>
            {filtered.map(session => {
              const role = isLearner(session) ? 'learner' : 'mentor';
              const other = role === 'learner' ? session.mentor : session.learner;
              const color = sc(session.status);
              const alreadyRated = role === 'learner' ? session.mentorRating !== undefined : session.learnerRating !== undefined;
              const myRating = role === 'learner' ? session.mentorRating : session.learnerRating;

              return (
                <div key={session._id} style={s.card}>
                  <div style={s.cardMain}>
                    {/* Left: who + skill */}
                    <div style={s.cardLeft}>
                      <div style={s.avatarRow}>
                        <div style={s.avatar}>{other?.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={s.otherName}>{other?.name}</div>
                          <div style={{ color:'#555570', fontSize:12 }}>{role === 'learner' ? 'Mentor' : 'Learner'}</div>
                        </div>
                      </div>
                      <div style={s.skill}>{session.skill}</div>
                      <div style={s.meta}>
                        <span>💰 {session.tokenCost} tokens</span>
                        <span style={{ color:'#555570' }}>·</span>
                        <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                        {session.quizScore !== undefined && (
                          <>
                            <span style={{ color:'#555570' }}>·</span>
                            <span style={{ color: session.quizPassed ? '#22c97e' : '#f5c842' }}>
                              Quiz: {session.quizScore}%{session.quizPassed ? ' ✓' : ''}
                            </span>
                          </>
                        )}
                      </div>
                      {/* Show rating received */}
                      {alreadyRated && (
                        <div style={{ marginTop:6 }}>
                          <StarRating value={myRating} readonly />
                        </div>
                      )}
                    </div>

                    {/* Right: status + actions */}
                    <div style={s.cardRight}>
                      <div style={{ ...s.statusBadge, background:color.bg, border:`1px solid ${color.border}`, color:color.color }}>
                        {session.status === 'disputed' ? '⚠️ Disputed' : session.status}
                      </div>

                      <div style={s.actions}>
                        {/* Start (mentor, pending) */}
                        {role === 'mentor' && session.status === 'pending' && (
                          <button className="nx-btn" onClick={() => navigate(`/session/${session._id}`)} style={{ fontSize:12, padding:'7px 14px', background:'#22c97e' }}>▶ Start</button>
                        )}
                        {/* Join active */}
                        {session.status === 'active' && (
                          <button className="nx-btn" onClick={() => navigate(`/session/${session._id}`)} style={{ fontSize:12, padding:'7px 14px' }}>🟢 Join</button>
                        )}
                        {/* Take quiz (learner, completed, not taken) */}
                        {role === 'learner' && session.status === 'completed' && session.quizScore === undefined && (
                          <button className="nx-btn" onClick={() => navigate(`/quiz/${session._id}`)} style={{ fontSize:12, padding:'7px 14px', background:'#8b83ff' }}>📝 Quiz</button>
                        )}
                        {/* View Certificate */}
                        {role === 'learner' && session.certificateIssued && (
                          <button className="nx-btn" onClick={() => navigate(`/certificate/${session._id}`)} style={{ fontSize:12, padding:'7px 14px', background:'#f5c842', color:'#000' }}>🎓 Certificate</button>
                        )}
                        {/* Rate mentor (learner, completed, not rated) */}
                        {role === 'learner' && session.status === 'completed' && session.mentorRating === undefined && (
                          <button className="nx-btn-outline" onClick={() => { setRatingModal({ session, role }); setRatingVal(5); setReviewVal(''); }} style={{ fontSize:12, padding:'7px 14px' }}>⭐ Rate</button>
                        )}
                        {/* Rate learner (mentor, completed, not rated) */}
                        {role === 'mentor' && session.status === 'completed' && session.learnerRating === undefined && (
                          <button className="nx-btn-outline" onClick={() => { setRatingModal({ session, role }); setRatingVal(5); setReviewVal(''); }} style={{ fontSize:12, padding:'7px 14px' }}>⭐ Rate</button>
                        )}
                        {/* Dispute (learner, completed, no dispute, within 24h) */}
                        {role === 'learner' && session.status === 'completed' && !session.disputeReason && (
                          <button className="nx-btn-ghost" onClick={() => { setDisputeModal({ session }); setDisputeReason(''); }} style={{ fontSize:12, padding:'7px 12px', borderColor:'rgba(255,92,122,0.3)', color:'#ff5c7a' }}>Dispute</button>
                        )}
                        {/* Cancel pending */}
                        {session.status === 'pending' && (
                          <button className="nx-btn-ghost" onClick={() => handleCancel(session._id)} disabled={cancelling === session._id} style={{ fontSize:12, padding:'7px 12px', borderColor:'rgba(255,92,122,0.3)', color:'#ff5c7a' }}>
                            {cancelling === session._id ? '…' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dispute info banner */}
                  {session.status === 'disputed' && (
                    <div style={s.disputeBanner}>
                      ⚠️ <strong>Dispute raised:</strong> "{session.disputeReason}" — Admin is reviewing.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {ratingModal && (
        <div style={s.overlay} onClick={() => setRatingModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>
              Rate {ratingModal.role === 'learner' ? 'your Mentor' : 'your Learner'} — {ratingModal.role === 'learner' ? ratingModal.session.mentor?.name : ratingModal.session.learner?.name}
            </h3>
            <p style={{ color:'#8888aa', fontSize:13, marginBottom:16 }}>
              {ratingModal.role === 'learner'
                ? 'How well did the mentor explain the topic and engage with you?'
                : 'How engaged and receptive was the learner during the session?'}
            </p>
            <div style={{ marginBottom:16 }}>
              <div className="nx-label">Your Rating</div>
              <StarRating value={ratingVal} onChange={setRatingVal} />
            </div>
            <div style={{ marginBottom:16 }}>
              <div className="nx-label">Review (optional)</div>
              <textarea className="nx-input" placeholder="Share your experience…" value={reviewVal} onChange={e => setReviewVal(e.target.value)} style={{ height:90, resize:'none' }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="nx-btn-ghost" onClick={() => setRatingModal(null)} style={{ flex:1 }}>Cancel</button>
              <button className="nx-btn" onClick={handleRate} disabled={actionLoading} style={{ flex:2 }}>
                {actionLoading ? 'Submitting…' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModal && (
        <div style={s.overlay} onClick={() => setDisputeModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Raise a Dispute</h3>
            <div style={s.disputeInfo}>
              <div style={{ fontWeight:700, color:'#f5c842', marginBottom:4 }}>When to dispute:</div>
              <ul style={{ color:'#8888aa', fontSize:13, paddingLeft:16, lineHeight:1.8 }}>
                <li>Mentor didn't show up or was significantly late</li>
                <li>Mentor was clearly unprepared or taught wrong information</li>
                <li>Session was ended prematurely without teaching</li>
              </ul>
              <div style={{ color:'#ff5c7a', fontSize:12, marginTop:8 }}>
                ⚠️ False disputes can lower your own trust score. Only dispute genuine cases.
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div className="nx-label">Describe the issue</div>
              <textarea className="nx-input" placeholder="Explain clearly what went wrong…" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} style={{ height:100, resize:'none' }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="nx-btn-ghost" onClick={() => setDisputeModal(null)} style={{ flex:1 }}>Cancel</button>
              <button className="nx-btn" onClick={handleDispute} disabled={actionLoading} style={{ flex:2, background:'#ff5c7a' }}>
                {actionLoading ? 'Submitting…' : 'Raise Dispute'}
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
  content: { maxWidth:900, margin:'0 auto', padding:'28px 24px' },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'#e8e8f0', marginBottom:20 },
  msg: { padding:'11px 16px', borderRadius:10, border:'1.5px solid', fontSize:14, marginBottom:16 },
  controls: { display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' },
  filters: { display:'flex', gap:6, flexWrap:'wrap' },
  filter: { padding:'6px 14px', borderRadius:20, border:'1.5px solid #1a1a35', background:'transparent', color:'#8888aa', fontSize:12, cursor:'pointer', transition:'all 0.15s' },
  filterActive: { border:'1.5px solid #6c63ff', background:'rgba(108,99,255,0.15)', color:'#8b83ff' },
  empty: { color:'#8888aa', textAlign:'center', padding:'60px 0', fontSize:15 },
  list: { display:'flex', flexDirection:'column', gap:12 },
  card: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, overflow:'hidden' },
  cardMain: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, padding:'18px 20px' },
  cardLeft: { flex:1 },
  cardRight: { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, flexShrink:0 },
  avatarRow: { display:'flex', alignItems:'center', gap:10, marginBottom:10 },
  avatar: { width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg, #6c63ff, #22c97e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#fff', flexShrink:0 },
  otherName: { fontWeight:700, fontSize:15, color:'#e8e8f0' },
  skill: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'#8b83ff', marginBottom:6 },
  meta: { display:'flex', gap:10, color:'#8888aa', fontSize:12, marginBottom:4, flexWrap:'wrap' },
  statusBadge: { padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:700, textTransform:'capitalize', flexShrink:0 },
  actions: { display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' },
  disputeBanner: { padding:'10px 20px', background:'rgba(245,200,66,0.05)', borderTop:'1px solid rgba(245,200,66,0.15)', color:'#f5c842', fontSize:13 },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500 },
  modal: { background:'#0f0f22', border:'1.5px solid #1a1a35', borderRadius:16, padding:'28px 30px', width:'100%', maxWidth:440 },
  modalTitle: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:17, color:'#e8e8f0', marginBottom:16 },
  disputeInfo: { background:'rgba(245,200,66,0.05)', border:'1px solid rgba(245,200,66,0.15)', borderRadius:10, padding:'14px', marginBottom:16 },
};
