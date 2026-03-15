import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const SKILL_CATEGORIES = [
  { name: 'Programming Languages',  skills: ['Python','JavaScript','TypeScript','Java','C','C++','C#','Go','Rust','Swift','Kotlin','Ruby','PHP'] },
  { name: 'Web & Frontend',         skills: ['React','Vue.js','Angular','HTML/CSS','Next.js','Tailwind CSS','Figma','UI/UX Design'] },
  { name: 'Backend & Databases',    skills: ['Node.js','Express','Django','FastAPI','SQL','MongoDB','PostgreSQL','Redis','Firebase','GraphQL'] },
  { name: 'Mobile',                 skills: ['Flutter','React Native','Android (Kotlin)','iOS (Swift)','Dart'] },
  { name: 'AI & Data Science',      skills: ['Machine Learning','Deep Learning','Data Science','NLP','Computer Vision','PyTorch','TensorFlow','Pandas'] },
  { name: 'DevOps & Cloud',         skills: ['Docker','Kubernetes','AWS','GCP','Azure','CI/CD','Linux','Networking','DevOps'] },
  { name: 'CS Fundamentals',        skills: ['DSA','System Design','Competitive Programming','Operating Systems','Computer Networks','DBMS'] },
  { name: 'Other',                  skills: ['Cybersecurity','Ethical Hacking','Blockchain','Web3','Solidity','Unity','Game Dev'] },
];

export default function BecomeMentor() {
  const navigate = useNavigate();
  const [profile,  setProfile]  = useState(null);
  const [selected, setSelected] = useState([]);
  const [custom,   setCustom]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    API.get('/users/me').then(r => {
      setProfile(r.data);
      if (r.data.isMentor) navigate('/profile');
    }).catch(() => {});
  }, []);

  const toggle = (sk) =>
    setSelected(p => p.includes(sk) ? p.filter(x => x !== sk) : [...p, sk]);

  const addCustom = () => {
    const s = custom.trim();
    if (s && !selected.includes(s)) { setSelected(p => [...p, s]); setCustom(''); }
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return setError('Select at least one skill you can teach');
    setLoading(true); setError('');
    try {
      await API.patch('/users/become-mentor', { teachingSkills: selected });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile}/>
      <div style={T.page}>

        {/* Hero section */}
        <div style={T.hero} className="fade-up">
          <div style={T.heroLeft}>
            <div style={T.pill}>Become a Mentor</div>
            <h1 style={T.heroTitle}>Share what you know.<br/>Earn while you teach.</h1>
            <p style={T.heroSub}>
              Mentors on Nexus Cognitive earn tokens for every session they conduct.
              Learners find you by skill, book sessions, and pay upfront — you get paid when the session ends.
            </p>
            <div style={T.perks}>
              {[
                { title:'Earn tokens per session',   desc:'You keep 98%. 2% goes to the platform.' },
                { title:'Escrow protects both sides', desc:'Tokens are locked on booking, released on session end.' },
                { title:'Build your reputation',      desc:'Trust score grows with good ratings and quiz passes.' },
                { title:'Dispute protection',         desc:'Admin arbitrates any disputes within 24 hours.' },
              ].map(p => (
                <div key={p.title} style={T.perk}>
                  <div style={T.perkCheck}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div>
                    <div style={T.perkTitle}>{p.title}</div>
                    <div style={T.perkDesc}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={T.heroRight}>
            <div style={T.infoCard}>
              <div style={T.infoTitle}>How it works</div>
              {[
                ['1', 'Learner finds you by skill'],
                ['2', 'Learner books and pays tokens'],
                ['3', 'You start the live session'],
                ['4', 'Session ends — you get paid'],
                ['5', 'Learner takes AI quiz to verify'],
              ].map(([n, step]) => (
                <div key={n} style={T.infoStep}>
                  <div style={T.infoNum}>{n}</div>
                  <div style={{ fontSize:13, color:'var(--n-600)' }}>{step}</div>
                </div>
              ))}
              <div style={T.infoDiv}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:13, color:'var(--n-500)' }}>Platform fee</span>
                <span style={{ fontWeight:700, fontSize:13, color:'var(--n-800)' }}>2%</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color:'var(--n-500)' }}>You keep</span>
                <span style={{ fontWeight:700, fontSize:14, color:'var(--emerald)' }}>98%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skill picker */}
        <div style={T.card} className="fade-up">
          <div style={T.cardHead}>
            <div>
              <h2 style={T.cardTitle}>Select your teaching skills</h2>
              <p style={T.cardSub}>Choose all subjects you're confident teaching. Learners search by skill.</p>
            </div>
            {selected.length > 0 && (
              <div style={T.countBadge}>{selected.length} selected</div>
            )}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {SKILL_CATEGORIES.map(cat => (
              <div key={cat.name}>
                <div style={T.catLabel}>{cat.name}</div>
                <div style={T.chipGrid}>
                  {cat.skills.map(sk => (
                    <button key={sk} style={{ ...T.chip, ...(selected.includes(sk) ? T.chipOn : {}) }} onClick={() => toggle(sk)}>
                      {selected.includes(sk) && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                      {sk}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Custom skill input */}
          <div style={{ marginTop:8 }}>
            <label className="nx-label">Add a skill not listed above</label>
            <div style={{ display:'flex', gap:8, marginTop:6 }}>
              <input
                className="nx-input"
                placeholder="e.g. Blender, Solidity, Unity, AutoCAD…"
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
              />
              <button className="nx-btn-outline" onClick={addCustom} style={{ flexShrink:0, padding:'9px 16px', fontSize:13 }}>
                Add
              </button>
            </div>
          </div>

          {/* Selected preview */}
          {selected.length > 0 && (
            <div style={T.selectedBox}>
              <div style={T.selectedLabel}>{selected.length} skill{selected.length !== 1 ? 's' : ''} selected — click to remove</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {selected.map(sk => (
                  <span key={sk} className="nx-badge nx-badge-blue" style={{ cursor:'pointer' }} onClick={() => toggle(sk)}>
                    {sk} ×
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding:'10px 13px', background:'var(--rose-bg)', border:'1px solid var(--rose-bd)', borderRadius:'var(--r)', color:'var(--rose)', fontSize:13 }}>
              {error}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button className="nx-btn-outline" onClick={() => navigate('/dashboard')} style={{ padding:'11px 22px', fontSize:14 }}>
              Cancel
            </button>
            <button className="nx-btn" onClick={handleSubmit} disabled={loading || selected.length === 0}
              style={{ flex:1, padding:'11px', fontSize:15, justifyContent:'center', opacity: selected.length === 0 ? .45 : 1 }}>
              {loading ? 'Saving…' : 'Start mentoring on Nexus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const T = {
  page:        { maxWidth:1100, margin:'0 auto', padding:'32px 24px 64px', display:'flex', flexDirection:'column', gap:20 },
  hero:        { display:'grid', gridTemplateColumns:'1fr 280px', gap:32, alignItems:'start' },
  heroLeft:    {},
  pill:        { display:'inline-block', padding:'4px 12px', borderRadius:'var(--r-full)', background:'var(--brand-soft)', color:'var(--brand-text)', fontSize:12, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase', marginBottom:14 },
  heroTitle:   { fontSize:32, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.025em', lineHeight:1.15, marginBottom:14 },
  heroSub:     { fontSize:15, color:'var(--n-500)', lineHeight:1.7, marginBottom:24 },
  perks:       { display:'flex', flexDirection:'column', gap:14 },
  perk:        { display:'flex', alignItems:'flex-start', gap:11 },
  perkCheck:   { width:22, height:22, borderRadius:7, background:'var(--emerald-bg)', border:'1px solid var(--emerald-bd)', color:'var(--emerald)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 },
  perkTitle:   { fontWeight:700, fontSize:14, color:'var(--n-800)', marginBottom:2 },
  perkDesc:    { fontSize:13, color:'var(--n-400)', lineHeight:1.5 },
  heroRight:   {},
  infoCard:    { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'20px', boxShadow:'var(--sh-sm)', position:'sticky', top:80 },
  infoTitle:   { fontSize:13, fontWeight:700, color:'var(--n-600)', marginBottom:14, letterSpacing:'.02em' },
  infoStep:    { display:'flex', alignItems:'center', gap:10, marginBottom:10 },
  infoNum:     { width:22, height:22, borderRadius:6, background:'var(--brand-soft)', color:'var(--brand-text)', fontSize:11, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  infoDiv:     { height:1, background:'var(--border)', margin:'12px 0' },
  card:        { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'28px 30px', display:'flex', flexDirection:'column', gap:18 },
  cardHead:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16 },
  cardTitle:   { fontSize:20, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.015em', marginBottom:4 },
  cardSub:     { fontSize:14, color:'var(--n-400)', lineHeight:1.6 },
  countBadge:  { padding:'4px 12px', borderRadius:'var(--r-full)', background:'var(--brand)', color:'white', fontSize:12, fontWeight:700, flexShrink:0 },
  catLabel:    { fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 },
  chipGrid:    { display:'flex', flexWrap:'wrap', gap:7 },
  chip:        { display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:'var(--r-full)', border:'1.5px solid var(--border)', background:'var(--n-50)', color:'var(--n-600)', fontSize:13, cursor:'pointer', transition:'all .15s', fontFamily:'var(--f)' },
  chipOn:      { border:'1.5px solid var(--brand)', background:'var(--brand-soft)', color:'var(--brand-text)', fontWeight:600 },
  selectedBox: { background:'var(--brand-soft)', border:'1px solid var(--brand-border)', borderRadius:'var(--r)', padding:'14px 16px' },
  selectedLabel:{ fontSize:11, fontWeight:700, color:'var(--brand-text)', marginBottom:8, letterSpacing:'.04em', textTransform:'uppercase' },
};
