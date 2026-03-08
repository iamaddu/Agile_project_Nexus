import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function BookSession() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [skill, setSkill] = useState('');
  const [tokenCost, setTokenCost] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    API.get('/wallet/balance').then(r => setWallet(r.data)).catch(() => {});
    API.get(`/users/mentors`).then(r => {
      const m = r.data.find(u => u._id === mentorId);
      if (m) { setMentor(m); if (m.teachingSkills?.[0]) setSkill(m.teachingSkills[0]); }
    }).catch(() => {});
  }, [mentorId]);

  const handleBook = async () => {
    if (!skill) return setError('Please select a skill');
    setLoading(true);
    setError('');
    try {
      await API.post('/sessions/book', { mentorId, skill, tokenCost });
      navigate('/my-sessions');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally { setLoading(false); }
  };

  const canAfford = wallet && wallet.walletBalance >= tokenCost;
  const trustOk = wallet && wallet.trustScore >= 30;

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <button onClick={() => navigate(-1)} style={s.back}>← Back to mentors</button>

        {mentor ? (
          <div style={s.grid}>
            {/* Mentor card */}
            <div style={s.mentorCard}>
              <div style={s.avatar}>{mentor.name[0].toUpperCase()}</div>
              <h2 style={s.name}>{mentor.name}</h2>
              <div style={s.trustRow}>
                <span style={{ color: mentor.trustScore >= 80 ? '#22c97e' : mentor.trustScore >= 50 ? '#f5c842' : '#ff5c7a', fontWeight:700 }}>{mentor.trustScore}</span>
                <span style={{ color:'#555570', fontSize:13 }}> / 100 trust</span>
              </div>
              <div style={s.skillsTitle}>Teaches:</div>
              <div style={s.skills}>
                {mentor.teachingSkills?.map(sk => (
                  <span key={sk} className="nx-badge nx-badge-blue" style={{ fontSize:12 }}>{sk}</span>
                ))}
              </div>
            </div>

            {/* Booking form */}
            <div style={s.form}>
              <h1 style={s.title}>Book a Session</h1>

              <div style={s.field}>
                <label className="nx-label">Skill to Learn</label>
                <select className="nx-input" value={skill} onChange={e => setSkill(e.target.value)} style={{ appearance:'none' }}>
                  <option value="">Select skill…</option>
                  {mentor.teachingSkills?.map(sk => (
                    <option key={sk} value={sk}>{sk}</option>
                  ))}
                </select>
              </div>

              <div style={s.field}>
                <label className="nx-label">Token Cost</label>
                <div style={s.costRow}>
                  {[20, 30, 50, 75, 100].map(c => (
                    <button key={c}
                      style={{ ...s.costBtn, ...(tokenCost === c ? s.costActive : {}) }}
                      onClick={() => setTokenCost(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:12, color:'#555570', marginTop:6 }}>Tokens moved to escrow until session ends</div>
              </div>

              {/* Balance check */}
              <div style={s.balRow}>
                <span style={{ color:'#8888aa', fontSize:13 }}>Your balance:</span>
                <span style={{ color: canAfford ? '#22c97e' : '#ff5c7a', fontWeight:700, fontSize:14 }}>
                  {wallet?.walletBalance ?? '—'} tokens
                </span>
              </div>

              {!trustOk && (
                <div style={s.warn}>⚠️ Trust score below 30. Cannot book sessions.</div>
              )}
              {!canAfford && trustOk && (
                <div style={s.warn}>⚠️ Insufficient tokens. <span style={{ color:'#6c63ff', cursor:'pointer' }} onClick={() => navigate('/add-tokens')}>Add tokens →</span></div>
              )}

              {error && <div style={s.error}>⚠ {error}</div>}

              <button
                className="nx-btn"
                onClick={handleBook}
                disabled={loading || !canAfford || !trustOk || !skill}
                style={{ width:'100%', padding:'14px', marginTop:4 }}
              >
                {loading ? 'Booking…' : `Book for ${tokenCost} Tokens →`}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ color:'#8888aa', textAlign:'center', padding:'60px 0' }}>Loading mentor…</div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:800, margin:'0 auto', padding:'28px 24px' },
  back: { background:'none', border:'none', color:'#8888aa', cursor:'pointer', fontSize:14, marginBottom:20, padding:0 },
  grid: { display:'grid', gridTemplateColumns:'280px 1fr', gap:24, alignItems:'start' },
  mentorCard: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:16, padding:24, textAlign:'center' },
  avatar: { width:64, height:64, borderRadius:'50%', background:'linear-gradient(135deg, #6c63ff, #22c97e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, fontWeight:800, color:'#fff', margin:'0 auto 12px' },
  name: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#e8e8f0', marginBottom:6 },
  trustRow: { marginBottom:16 },
  skillsTitle: { fontSize:12, color:'#555570', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 },
  skills: { display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center' },
  form: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:16, padding:28, display:'flex', flexDirection:'column', gap:20 },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:22, color:'#e8e8f0' },
  field: {},
  costRow: { display:'flex', gap:8, marginTop:8 },
  costBtn: { flex:1, padding:'10px', border:'1.5px solid #1a1a35', borderRadius:8, background:'transparent', color:'#8888aa', cursor:'pointer', fontWeight:700, fontSize:15, transition:'all 0.15s' },
  costActive: { border:'1.5px solid #6c63ff', background:'rgba(108,99,255,0.15)', color:'#8b83ff' },
  balRow: { display:'flex', justifyContent:'space-between', alignItems:'center', background:'#0f0f22', borderRadius:8, padding:'10px 14px' },
  warn: { padding:'10px 14px', background:'rgba(255,92,122,0.08)', border:'1px solid rgba(255,92,122,0.2)', borderRadius:8, color:'#ff5c7a', fontSize:13 },
  error: { padding:'10px 14px', background:'rgba(255,92,122,0.1)', border:'1px solid rgba(255,92,122,0.25)', borderRadius:8, color:'#ff5c7a', fontSize:13 },
};
