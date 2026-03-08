import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const SKILLS = ['Python','JavaScript','React','Node.js','Java','C++','C','Machine Learning','Deep Learning','Data Science','SQL','MongoDB','TypeScript','HTML/CSS','Flutter','Kotlin','Swift','Docker','AWS','System Design','DSA','Rust','Go','DevOps'];

export default function BecomeMentor() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useState(() => {
    API.get('/users/me').then(r => { setProfile(r.data); if (r.data.isMentor) navigate('/profile'); }).catch(() => {});
  }, []);

  const toggle = (sk) => setSelected(prev => prev.includes(sk) ? prev.filter(x => x !== sk) : [...prev, sk]);
  const addCustom = () => {
    const s = custom.trim();
    if (s && !selected.includes(s)) { setSelected(prev => [...prev, s]); setCustom(''); }
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return setError('Select at least one skill');
    setLoading(true);
    try {
      await API.patch('/users/become-mentor', { teachingSkills: selected });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <button onClick={() => navigate('/dashboard')} style={s.back}>← Dashboard</button>

        <div style={s.hero}>
          <div style={s.heroIcon}>🎓</div>
          <h1 style={s.title}>Become a Mentor</h1>
          <p style={s.sub}>Share your expertise with learners and earn tokens for every session you teach</p>
          <div style={s.perks}>
            {['Earn tokens per session', 'Flexible scheduling', 'Build your reputation', 'Help others grow'].map(p => (
              <span key={p} style={s.perk}>✓ {p}</span>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <h2 style={s.cardTitle}>Select skills you teach</h2>
          <p style={s.cardSub}>Pick all the topics you're confident teaching</p>

          <div style={s.skills}>
            {SKILLS.map(sk => (
              <button key={sk}
                style={{ ...s.skillBtn, ...(selected.includes(sk) ? s.skillActive : {}) }}
                onClick={() => toggle(sk)}
              >
                {selected.includes(sk) && <span style={{ color:'#22c97e' }}>✓ </span>}
                {sk}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <input className="nx-input" placeholder="Add custom skill (e.g., Blockchain, UI/UX)…" value={custom} onChange={e => setCustom(e.target.value)} onKeyDown={e => e.key==='Enter' && addCustom()} />
            <button className="nx-btn-outline" onClick={addCustom} style={{ flexShrink:0, padding:'10px 18px' }}>+ Add</button>
          </div>

          {selected.length > 0 && (
            <div style={s.selectedRow}>
              <div style={{ fontSize:12, color:'#8888aa', marginBottom:8 }}>Selected ({selected.length}):</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {selected.map(sk => (
                  <span key={sk} className="nx-badge nx-badge-green" style={{ cursor:'pointer' }} onClick={() => toggle(sk)}>
                    {sk} ✕
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && <div style={s.error}>⚠ {error}</div>}

          <button className="nx-btn" onClick={handleSubmit} disabled={loading} style={{ width:'100%', padding:'14px', marginTop:20 }}>
            {loading ? 'Applying…' : '🎓 Become a Mentor →'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:720, margin:'0 auto', padding:'28px 24px' },
  back: { background:'none', border:'none', color:'#8888aa', cursor:'pointer', fontSize:14, marginBottom:20, padding:0 },
  hero: { textAlign:'center', marginBottom:28 },
  heroIcon: { fontSize:48, marginBottom:12 },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28, color:'#e8e8f0', marginBottom:8 },
  sub: { color:'#8888aa', fontSize:15, marginBottom:16, lineHeight:1.6 },
  perks: { display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' },
  perk: { padding:'5px 14px', background:'rgba(34,201,126,0.08)', border:'1px solid rgba(34,201,126,0.2)', borderRadius:20, color:'#22c97e', fontSize:12 },
  card: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:18, padding:'28px 32px' },
  cardTitle: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'#e8e8f0', marginBottom:4 },
  cardSub: { color:'#8888aa', fontSize:14, marginBottom:20 },
  skills: { display:'flex', flexWrap:'wrap', gap:8 },
  skillBtn: { padding:'8px 16px', borderRadius:20, border:'1.5px solid #1a1a35', background:'transparent', color:'#8888aa', fontSize:13, cursor:'pointer', transition:'all 0.15s' },
  skillActive: { border:'1.5px solid #22c97e', background:'rgba(34,201,126,0.08)', color:'#22c97e' },
  selectedRow: { marginTop:16, padding:14, background:'#0f0f22', borderRadius:10 },
  error: { padding:'10px 14px', background:'rgba(255,92,122,0.1)', border:'1px solid rgba(255,92,122,0.25)', borderRadius:8, color:'#ff5c7a', fontSize:13, marginTop:16 },
};
