import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const SKILLS = ['Python','JavaScript','React','Node.js','Java','C++','Machine Learning','Data Science','SQL','MongoDB','TypeScript','HTML/CSS','Flutter','Swift','Docker','AWS','System Design','DSA'];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [tab, setTab] = useState('info');
  const [name, setName] = useState('');
  const [skills, setSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);

  useEffect(() => {
    API.get('/users/me').then(r => { setProfile(r.data); setName(r.data.name); setSkills(r.data.teachingSkills || []); }).catch(() => {});
    API.get('/wallet/balance').then(r => setWallet(r.data)).catch(() => {});
  }, []);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await API.patch('/users/update-profile', { name });
      setMsg({ type:'success', text:'Name updated!' });
      setProfile(prev => ({ ...prev, name }));
    } catch { setMsg({ type:'error', text:'Failed to save' }); }
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSaveSkills = async () => {
    setSaving(true);
    try {
      await API.patch('/users/update-skills', { teachingSkills: skills });
      if (!profile.isMentor && skills.length > 0) await API.patch('/users/become-mentor', { teachingSkills: skills });
      setMsg({ type:'success', text:'Skills updated!' });
    } catch { setMsg({ type:'error', text:'Failed to save' }); }
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const toggleSkill = (sk) => setSkills(prev => prev.includes(sk) ? prev.filter(x => x !== sk) : [...prev, sk]);
  const addCustom = () => {
    const s = customSkill.trim();
    if (s && !skills.includes(s)) { setSkills(prev => [...prev, s]); setCustomSkill(''); }
  };

  const handleDailyReward = async () => {
    setDailyLoading(true);
    try {
      const res = await API.post('/wallet/daily-reward');
      setWallet(prev => ({ ...prev, walletBalance: res.data.walletBalance }));
      setMsg({ type:'success', text: res.data.message });
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Already claimed' });
    }
    setDailyLoading(false);
    setTimeout(() => setMsg(null), 4000);
  };

  const trustColor = !wallet ? '#8888aa' : wallet.trustScore >= 80 ? '#22c97e' : wallet.trustScore >= 50 ? '#f5c842' : '#ff5c7a';

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        {/* Profile header */}
        <div style={s.hero}>
          <div style={s.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <h1 style={s.heroName}>{profile?.name}</h1>
            <div style={s.heroBadges}>
              <span className="nx-badge nx-badge-blue">📖 Learner</span>
              {profile?.isMentor && <span className="nx-badge nx-badge-green">🎓 Mentor</span>}
              {profile?.isAdmin && <span className="nx-badge nx-badge-yellow">👑 Admin</span>}
            </div>
          </div>
          <div style={s.heroStats}>
            <div style={s.heroStat}>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:24, color:'#e8e8f0' }}>{wallet?.walletBalance ?? '—'}</div>
              <div style={{ color:'#8888aa', fontSize:12 }}>Tokens</div>
            </div>
            <div style={s.heroStat}>
              <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:24, color: trustColor }}>{wallet?.trustScore ?? '—'}</div>
              <div style={{ color:'#8888aa', fontSize:12 }}>Trust Score</div>
            </div>
          </div>
        </div>

        {/* Daily reward banner */}
        <div style={s.dailyBanner}>
          <span style={{ fontSize:20 }}>🎁</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:'#e8e8f0', fontSize:14 }}>Daily Reward</div>
            <div style={{ color:'#8888aa', fontSize:12 }}>50 free tokens every 24 hours</div>
          </div>
          <button className="nx-btn" onClick={handleDailyReward} disabled={dailyLoading} style={{ fontSize:13, padding:'9px 20px', flexShrink:0, background:'#22c97e' }}>
            {dailyLoading ? '…' : 'Claim 50 Tokens'}
          </button>
        </div>

        {msg && (
          <div style={{ ...s.msg, background: msg.type==='success' ? 'rgba(34,201,126,0.1)' : 'rgba(255,92,122,0.1)', borderColor: msg.type==='success' ? 'rgba(34,201,126,0.3)' : 'rgba(255,92,122,0.3)', color: msg.type==='success' ? '#22c97e' : '#ff5c7a' }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {[{id:'info',label:'Account Info'},{id:'skills',label:'Teaching Skills'},{id:'trust',label:'Trust Score'}].map(t => (
            <button key={t.id} style={{ ...s.tab, ...(tab===t.id ? s.tabActive : {}) }} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div style={s.card}>
            <div style={s.field}>
              <label className="nx-label">Full Name</label>
              <input className="nx-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div style={s.field}>
              <label className="nx-label">Email</label>
              <input className="nx-input" value={profile?.email || ''} disabled style={{ opacity:0.6 }} />
            </div>
            <div style={s.field}>
              <label className="nx-label">Member Since</label>
              <input className="nx-input" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ''} disabled style={{ opacity:0.6 }} />
            </div>
            <button className="nx-btn" onClick={handleSaveName} disabled={saving} style={{ padding:'12px 28px', marginTop:8 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {tab === 'skills' && (
          <div style={s.card}>
            <p style={{ color:'#8888aa', fontSize:14, marginBottom:20 }}>
              {profile?.isMentor ? 'Edit the skills you teach. Learners will find you based on these.' : 'Select skills to become a mentor and start earning tokens.'}
            </p>
            <div style={s.skillGrid}>
              {SKILLS.map(sk => (
                <button key={sk}
                  style={{ ...s.skillBtn, ...(skills.includes(sk) ? s.skillActive : {}) }}
                  onClick={() => toggleSkill(sk)}
                >
                  {skills.includes(sk) && '✓ '}{sk}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <input className="nx-input" placeholder="Custom skill…" value={customSkill} onChange={e => setCustomSkill(e.target.value)} onKeyDown={e => e.key==='Enter' && addCustom()} />
              <button className="nx-btn-outline" onClick={addCustom} style={{ flexShrink:0, padding:'10px 16px' }}>+ Add</button>
            </div>
            {skills.length > 0 && (
              <div style={s.selectedSkills}>
                {skills.map(sk => <span key={sk} className="nx-badge nx-badge-green" style={{ cursor:'pointer' }} onClick={() => toggleSkill(sk)}>{sk} ✕</span>)}
              </div>
            )}
            <button className="nx-btn" onClick={handleSaveSkills} disabled={saving} style={{ padding:'12px 28px', marginTop:16 }}>
              {saving ? 'Saving…' : 'Save Skills'}
            </button>
          </div>
        )}

        {tab === 'trust' && (
          <div style={s.card}>
            <div style={s.trustDisplay}>
              <div style={{ ...s.trustBig, color: trustColor }}>{wallet?.trustScore ?? '—'}</div>
              <div style={{ color:'#8888aa', fontSize:14 }}>/ 100</div>
            </div>
            <div style={s.trustBar}>
              <div style={{ ...s.trustFill, width:`${wallet?.trustScore || 0}%`, background: trustColor }} />
            </div>
            <div style={s.trustList}>
              {[
                { label:'Passing quizzes', change:'+5 each' },
                { label:'Completing sessions', change:'+2 each' },
                { label:'Failing quizzes', change:'-3 each' },
                { label:'Cancelling sessions', change:'-2 each' },
              ].map(item => (
                <div key={item.label} style={s.trustItem}>
                  <span style={{ color:'#c8c8e0' }}>{item.label}</span>
                  <span style={{ color: item.change.startsWith('+') ? '#22c97e' : '#ff5c7a', fontWeight:600 }}>{item.change}</span>
                </div>
              ))}
            </div>
            <div style={s.trustNote}>
              ⚠️ Trust score below 30 prevents booking sessions. Keep learning and passing quizzes to maintain a healthy score.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:720, margin:'0 auto', padding:'28px 24px' },
  hero: { display:'flex', alignItems:'center', gap:16, background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:18, padding:'24px', marginBottom:16, flexWrap:'wrap' },
  avatar: { width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg, #6c63ff, #22c97e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:800, color:'#fff', flexShrink:0 },
  heroName: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#e8e8f0', marginBottom:8 },
  heroBadges: { display:'flex', gap:6, flexWrap:'wrap' },
  heroStats: { marginLeft:'auto', display:'flex', gap:20 },
  heroStat: { textAlign:'center' },
  dailyBanner: { display:'flex', alignItems:'center', gap:12, background:'rgba(34,201,126,0.05)', border:'1.5px solid rgba(34,201,126,0.2)', borderRadius:14, padding:'16px 20px', marginBottom:16 },
  msg: { padding:'11px 16px', borderRadius:10, border:'1.5px solid', fontSize:14, marginBottom:16 },
  tabs: { display:'flex', gap:2, marginBottom:20, background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:12, padding:4 },
  tab: { flex:1, padding:'9px 16px', borderRadius:10, border:'none', background:'transparent', color:'#8888aa', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.15s' },
  tabActive: { background:'rgba(108,99,255,0.15)', color:'#e8e8f0', fontWeight:700 },
  card: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:16, padding:'24px' },
  field: { marginBottom:16 },
  skillGrid: { display:'flex', flexWrap:'wrap', gap:8 },
  skillBtn: { padding:'7px 14px', borderRadius:20, border:'1.5px solid #1a1a35', background:'transparent', color:'#8888aa', fontSize:12, cursor:'pointer', transition:'all 0.15s' },
  skillActive: { border:'1.5px solid #22c97e', background:'rgba(34,201,126,0.08)', color:'#22c97e' },
  selectedSkills: { display:'flex', flexWrap:'wrap', gap:6, marginTop:14, padding:12, background:'#0f0f22', borderRadius:10 },
  trustDisplay: { display:'flex', alignItems:'flex-end', gap:6, justifyContent:'center', marginBottom:12 },
  trustBig: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:64, lineHeight:1 },
  trustBar: { height:8, background:'#1a1a35', borderRadius:4, marginBottom:24, overflow:'hidden' },
  trustFill: { height:'100%', borderRadius:4, transition:'width 0.5s ease' },
  trustList: { display:'flex', flexDirection:'column', gap:12, marginBottom:20 },
  trustItem: { display:'flex', justifyContent:'space-between', fontSize:14, padding:'8px 0', borderBottom:'1px solid #0f0f22' },
  trustNote: { padding:'12px 14px', background:'rgba(245,200,66,0.07)', border:'1px solid rgba(245,200,66,0.2)', borderRadius:8, color:'#f5c842', fontSize:13 },
};
