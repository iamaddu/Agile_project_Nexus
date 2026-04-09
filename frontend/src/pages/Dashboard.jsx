import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    API.get('/wallet/balance').then(r => setWallet(r.data)).catch(() => {});
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
  }, []);

  const trustColor = !wallet ? '#8888aa' : wallet.trustScore >= 80 ? '#22c97e' : wallet.trustScore >= 50 ? '#f5c842' : '#ff5c7a';

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        {/* Welcome hero */}
        <div style={s.hero} className="animate-in">
          <div style={s.heroLeft}>
            <div style={s.greeting}>Good to see you,</div>
            <h1 style={s.name}>{user?.name} 👋</h1>
            <div style={s.badges}>
              <span className="nx-badge nx-badge-blue">📖 Learner</span>
              {profile?.isMentor && <span className="nx-badge nx-badge-green">🎓 Mentor</span>}
              {profile?.isAdmin && <span className="nx-badge nx-badge-yellow">👑 Admin</span>}
            </div>
          </div>
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <div style={s.statVal}>{wallet?.walletBalance ?? '—'}</div>
              <div style={s.statLabel}>Tokens</div>
            </div>
            {wallet?.escrowBalance > 0 && (
              <div style={{ ...s.statCard, borderColor:'rgba(245,200,66,0.3)' }}>
                <div style={{ ...s.statVal, color:'#f5c842' }}>{wallet.escrowBalance}</div>
                <div style={s.statLabel}>In Escrow</div>
              </div>
            )}
            <div style={{ ...s.statCard, borderColor: `${trustColor}33` }}>
              <div style={{ ...s.statVal, color: trustColor }}>{wallet?.trustScore ?? '—'}</div>
              <div style={s.statLabel}>Trust Score</div>
            </div>
          </div>
        </div>

        {/* Low trust warning */}
        {wallet?.trustScore < 30 && (
          <div style={s.warn}>
            ⚠️ Your trust score is below 30. You cannot book sessions until it improves. Contact admin for help.
          </div>
        )}

        {/* Mentor skills card */}
        {profile?.isMentor && profile?.teachingSkills?.length > 0 && (
          <div style={s.mentorBanner}>
            <div>
              <div style={s.mentorTitle}>🎓 You're teaching</div>
              <div style={s.skillsRow}>
                {profile.teachingSkills.map(sk => (
                  <span key={sk} className="nx-badge nx-badge-green" style={{ fontSize:12 }}>{sk}</span>
                ))}
              </div>
            </div>
            <button className="nx-btn-outline" onClick={() => navigate('/profile')} style={{ flexShrink:0 }}>Edit Skills</button>
          </div>
        )}

        {/* How it works */}
        <div style={s.howBanner}>
          {[
            { n:1, t:'Add Tokens' },
            { n:2, t:'Find Mentor' },
            { n:3, t:'Learn Together' },
            { n:4, t:'Take Quiz → Verify' },
          ].map((step, i) => (
            <div key={i} style={s.howStep}>
              <span style={s.howNum}>{step.n}</span>
              <span style={s.howLabel}>{step.t}</span>
              {i < 3 && <span style={s.howArrow}>›</span>}
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div style={s.grid}>
          {[
            { icon:'🔍', title:'Find a Mentor', desc:'Browse mentors by skill and book a live session', btn:'Find Mentor', path:'/find-mentor', color:'var(--accent)' },
            { icon:'📅', title:'My Sessions', desc:'View all your sessions as learner and mentor', btn:'View Sessions', path:'/my-sessions', color:'var(--accent)' },
            { icon: profile?.isMentor ? '✏️' : '🎓', title: profile?.isMentor ? 'Manage Skills' : 'Become a Mentor', desc: profile?.isMentor ? 'Edit the skills you teach learners' : 'Share what you know and earn tokens', btn: profile?.isMentor ? 'Edit Skills' : 'Start Teaching', path: profile?.isMentor ? '/profile' : '/become-mentor', color: '#22c97e' },
            { icon:'🪙', title:'Add Tokens', desc:'Top up your wallet to book learning sessions', btn:'Add Tokens', path:'/add-tokens', color:'#f5c842' },
          ].map((card, i) => (
            <div key={i} style={s.card} onClick={() => navigate(card.path)} className="animate-in">
              <div style={s.cardIcon}>{card.icon}</div>
              <h3 style={s.cardTitle}>{card.title}</h3>
              <p style={s.cardDesc}>{card.desc}</p>
              <button style={{ ...s.cardBtn, background: card.color }} onClick={e => { e.stopPropagation(); navigate(card.path); }}>
                {card.btn} →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:1100, margin:'0 auto', padding:'32px 24px' },
  hero: { background:'linear-gradient(135deg, #0a0a1a 0%, #0f0a20 100%)', border:'1.5px solid #1a1a35', borderRadius:20, padding:'28px 32px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' },
  heroLeft: {},
  greeting: { color:'#8888aa', fontSize:14, marginBottom:4 },
  name: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28, color:'#e8e8f0', marginBottom:10 },
  badges: { display:'flex', gap:8, flexWrap:'wrap' },
  statsRow: { display:'flex', gap:12 },
  statCard: { padding:'14px 20px', background:'rgba(255,255,255,0.03)', border:'1.5px solid #1a1a35', borderRadius:12, minWidth:90, textAlign:'center' },
  statVal: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28, color:'#e8e8f0', lineHeight:1 },
  statLabel: { fontSize:12, color:'#8888aa', marginTop:4 },
  warn: { padding:'12px 18px', background:'rgba(255,92,122,0.08)', border:'1px solid rgba(255,92,122,0.25)', borderRadius:10, color:'#ff5c7a', fontSize:13, marginBottom:16 },
  mentorBanner: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, background:'rgba(34,201,126,0.05)', border:'1.5px solid rgba(34,201,126,0.2)', borderRadius:14, padding:'16px 20px', marginBottom:16, flexWrap:'wrap' },
  mentorTitle: { color:'#22c97e', fontWeight:700, fontSize:14, marginBottom:8 },
  skillsRow: { display:'flex', flexWrap:'wrap', gap:6 },
  howBanner: { display:'flex', alignItems:'center', gap:4, background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:12, padding:'14px 20px', marginBottom:24, flexWrap:'wrap' },
  howStep: { display:'flex', alignItems:'center', gap:8 },
  howNum: { width:22, height:22, borderRadius:'50%', background:'#6c63ff', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  howLabel: { fontSize:13, color:'#8888aa' },
  howArrow: { color:'#2a2a45', fontSize:18, margin:'0 4px' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:16 },
  card: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:16, padding:22, cursor:'pointer', transition:'border-color 0.2s, transform 0.15s', display:'flex', flexDirection:'column' },
  cardIcon: { fontSize:28, marginBottom:12 },
  cardTitle: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:15, color:'#e8e8f0', marginBottom:6 },
  cardDesc: { fontSize:13, color:'#8888aa', marginBottom:18, lineHeight:1.5, flex:1 },
  cardBtn: { width:'100%', padding:'10px', border:'none', borderRadius:8, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Syne,sans-serif' },
};
