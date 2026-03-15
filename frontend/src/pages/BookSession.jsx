import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const COST_OPTIONS = [20, 30, 50, 75, 100];

export default function BookSession() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const [profile,     setProfile]     = useState(null);
  const [mentor,      setMentor]      = useState(null);
  const [wallet,      setWallet]      = useState(null);
  const [skill,       setSkill]       = useState('');
  const [tokenCost,   setTokenCost]   = useState(30);
  const [loading,     setLoading]     = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, walletRes, mentorsRes] = await Promise.all([
          API.get('/users/me'),
          API.get('/wallet/balance'),
          API.get('/users/mentors'),
        ]);
        setProfile(meRes.data);
        setWallet(walletRes.data);
        // Guard: can't book yourself
        if (meRes.data._id === mentorId) { navigate('/find-mentor'); return; }
        const m = mentorsRes.data.find(u => u._id === mentorId);
        if (!m) { navigate('/find-mentor'); return; }
        setMentor(m);
        if (m.teachingSkills?.[0]) setSkill(m.teachingSkills[0]);
      } catch {
        navigate('/find-mentor');
      }
      setPageLoading(false);
    };
    load();
  }, [mentorId]);

  const handleBook = async () => {
    if (!skill) return setError('Please select a skill');
    setLoading(true); setError('');
    try {
      await API.post('/sessions/book', { mentorId, skill, tokenCost });
      navigate('/my-sessions');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    }
    setLoading(false);
  };

  const canAfford = wallet && wallet.walletBalance >= tokenCost;
  const trustOk   = wallet && wallet.trustScore >= 30;
  const tColor    = !wallet ? 'var(--n-400)' : wallet.trustScore >= 80 ? 'var(--emerald)' : wallet.trustScore >= 50 ? 'var(--amber)' : 'var(--rose)';

  if (pageLoading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={null}/>
      <div style={{ display:'flex', justifyContent:'center', padding:'80px 0', color:'var(--n-400)', gap:10 }}>
        <div style={{ width:20, height:20, border:'2px solid var(--border)', borderTop:'2px solid var(--brand)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
        Loading mentor…
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile}/>
      <div style={T.page}>
        <button onClick={() => navigate(-1)} style={T.backBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to mentors
        </button>

        {mentor && (
          <div style={T.grid} className="fade-up">

            {/* ── Mentor info sidebar ── */}
            <div style={T.sidebar}>
              <div style={T.avatarBig}>{mentor.name[0].toUpperCase()}</div>
              <h2 style={T.mentorName}>{mentor.name}</h2>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:16 }}>
                <span style={{ fontWeight:800, fontSize:20, color:tColor }}>{mentor.trustScore}</span>
                <span style={{ fontSize:12, color:'var(--n-400)' }}>trust score</span>
              </div>
              <div style={T.trustBarWrap}>
                <div style={{ ...T.trustBarFill, width:`${mentor.trustScore}%`, background:tColor }}/>
              </div>
              <div style={T.divider}/>
              <div style={T.skillsLabel}>Teaches</div>
              <div style={T.skillsWrap}>
                {mentor.teachingSkills?.map(sk => (
                  <span key={sk} className="nx-badge nx-badge-neutral" style={{ fontSize:12 }}>{sk}</span>
                ))}
              </div>
              <div style={T.divider}/>
              <div style={T.howBox}>
                <div style={T.howTitle}>Session flow</div>
                {[
                  'Tokens held in escrow on booking',
                  'Mentor starts the live session',
                  'You both join video call + whiteboard',
                  'Mentor ends — tokens released',
                  'Take AI quiz → earn certificate',
                ].map((step, i) => (
                  <div key={i} style={T.howStep}>
                    <span style={T.howN}>{i + 1}</span>
                    <span style={{ fontSize:12, color:'var(--n-600)', lineHeight:1.4 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Booking form ── */}
            <div>
              <h1 style={T.formTitle}>Book a session</h1>
              <p style={T.formSub}>
                Tokens are held in escrow and only released to the mentor when the session ends.
                You can dispute within 24 hours if something goes wrong.
              </p>

              <div style={T.formCard}>
                {/* Skill select */}
                <div>
                  <label className="nx-label">Skill to learn</label>
                  <select className="nx-input" value={skill} onChange={e => setSkill(e.target.value)} style={{ marginTop:6 }}>
                    <option value="">Select a skill…</option>
                    {mentor.teachingSkills?.map(sk => (
                      <option key={sk} value={sk}>{sk}</option>
                    ))}
                  </select>
                </div>

                {/* Token cost */}
                <div>
                  <label className="nx-label">Session cost</label>
                  <p style={{ fontSize:12, color:'var(--n-400)', margin:'4px 0 10px' }}>
                    Higher cost often means a longer or more in-depth session.
                  </p>
                  <div style={T.costRow}>
                    {COST_OPTIONS.map(c => (
                      <button key={c}
                        style={{ ...T.costBtn, ...(tokenCost === c ? T.costOn : {}) }}
                        onClick={() => setTokenCost(c)}>
                        <span style={{ fontWeight:800, fontSize:20, lineHeight:1 }}>{c}</span>
                        <span style={{ fontSize:11, color:tokenCost===c?'var(--brand-text)':'var(--n-400)', marginTop:2 }}>tokens</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Balance summary */}
                <div style={T.balanceBox}>
                  <div style={T.balRow}>
                    <span style={T.balLabel}>Your balance</span>
                    <span style={{ fontWeight:700, color:canAfford?'var(--n-800)':'var(--rose)' }}>{wallet?.walletBalance ?? '—'} tokens</span>
                  </div>
                  <div style={T.balRow}>
                    <span style={T.balLabel}>Trust score</span>
                    <span style={{ fontWeight:700, color:tColor }}>{wallet?.trustScore ?? '—'}</span>
                  </div>
                  <div style={{ height:1, background:'var(--border)', margin:'4px 0' }}/>
                  <div style={T.balRow}>
                    <span style={T.balLabel}>After booking</span>
                    <span style={{ fontWeight:700, color:'var(--n-700)' }}>
                      {wallet ? wallet.walletBalance - tokenCost : '—'} tokens
                    </span>
                  </div>
                </div>

                {/* Warnings */}
                {!trustOk && wallet && (
                  <div style={T.warnBox}>
                    Your trust score is below 30 — you cannot book sessions. Take quizzes or contact an admin to improve it.
                  </div>
                )}
                {!canAfford && trustOk && (
                  <div style={T.warnBox}>
                    Insufficient tokens.{' '}
                    <button onClick={() => navigate('/add-tokens')}
                      style={{ background:'none', border:'none', color:'var(--brand)', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'var(--f)', textDecoration:'underline' }}>
                      Add tokens →
                    </button>
                  </div>
                )}
                {error && <div style={T.errBox}>{error}</div>}

                <button className="nx-btn" onClick={handleBook}
                  disabled={loading || !canAfford || !trustOk || !skill}
                  style={{ width:'100%', padding:'13px', fontSize:15, justifyContent:'center' }}>
                  {loading ? 'Booking…' : `Book for ${tokenCost} tokens`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const T = {
  page:        { maxWidth:900, margin:'0 auto', padding:'28px 24px 64px', display:'flex', flexDirection:'column', gap:20 },
  backBtn:     { display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--n-400)', cursor:'pointer', fontSize:13, fontFamily:'var(--f)', padding:0, alignSelf:'flex-start' },
  grid:        { display:'grid', gridTemplateColumns:'240px 1fr', gap:24, alignItems:'start' },
  sidebar:     { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:22, textAlign:'center', boxShadow:'var(--sh-xs)', position:'sticky', top:80 },
  avatarBig:   { width:60, height:60, borderRadius:18, background:'linear-gradient(135deg, var(--brand) 0%, var(--brand-hover) 100%)', color:'white', fontSize:24, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 4px 14px rgba(99,102,241,.3)' },
  mentorName:  { fontWeight:800, fontSize:17, color:'var(--n-900)', marginBottom:8 },
  trustBarWrap:{ height:4, background:'var(--n-100)', borderRadius:2, overflow:'hidden', marginBottom:16 },
  trustBarFill:{ height:'100%', borderRadius:2, transition:'width .4s' },
  divider:     { height:1, background:'var(--border)', margin:'14px 0' },
  skillsLabel: { fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 },
  skillsWrap:  { display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' },
  howBox:      { textAlign:'left' },
  howTitle:    { fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 },
  howStep:     { display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 },
  howN:        { width:18, height:18, borderRadius:5, background:'var(--brand-soft)', color:'var(--brand-text)', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  formTitle:   { fontSize:24, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:6 },
  formSub:     { fontSize:14, color:'var(--n-400)', lineHeight:1.7, marginBottom:20 },
  formCard:    { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:22, display:'flex', flexDirection:'column', gap:18 },
  costRow:     { display:'flex', gap:8 },
  costBtn:     { flex:1, padding:'10px 6px', border:'1.5px solid var(--border)', borderRadius:'var(--r)', background:'var(--n-50)', color:'var(--n-700)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2, transition:'all .15s', fontFamily:'var(--f)' },
  costOn:      { border:'1.5px solid var(--brand)', background:'var(--brand-soft)', color:'var(--brand-text)' },
  balanceBox:  { background:'var(--n-50)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 },
  balRow:      { display:'flex', justifyContent:'space-between', alignItems:'center' },
  balLabel:    { fontSize:13, color:'var(--n-500)' },
  warnBox:     { padding:'10px 13px', background:'var(--rose-bg)', border:'1px solid var(--rose-bd)', borderRadius:'var(--r)', color:'var(--rose)', fontSize:13, lineHeight:1.5 },
  errBox:      { padding:'10px 13px', background:'var(--rose-bg)', border:'1px solid var(--rose-bd)', borderRadius:'var(--r)', color:'var(--rose)', fontSize:13 },
};
