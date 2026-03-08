import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const SKILLS = ['Python','JavaScript','React','Node.js','Java','C++','C','Machine Learning','Data Science','SQL','MongoDB','TypeScript','HTML/CSS','Flutter','Kotlin','Swift','Docker','AWS','System Design','DSA'];

export default function Register() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isMentor, setIsMentor] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const toggleSkill = (s) => {
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };
  const addCustom = () => {
    const s = customSkill.trim();
    if (s && !selectedSkills.includes(s)) { setSelectedSkills(prev => [...prev, s]); setCustomSkill(''); }
  };

  const handleSubmit = async () => {
    setError('');
    if (!name || !email || !password) return setError('All fields required');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (isMentor && selectedSkills.length === 0) return setError('Select at least one skill you teach');
    setLoading(true);
    try {
      const res = await API.post('/auth/register', { name, email, password, isMentor, teachingSkills: selectedSkills });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <div style={s.glow} />
      <div style={s.card} className="animate-in">
        <div style={s.logoRow}>
          <span>⚡</span>
          <span style={s.logoText}>NEXUS COGNITIVE</span>
        </div>

        {/* Progress */}
        <div style={s.progress}>
          {[1, 2].map(n => (
            <div key={n} style={{ ...s.dot, background: step >= n ? '#6c63ff' : '#1a1a35' }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 style={s.title}>Create account</h1>
            <p style={s.sub}>Get 100 tokens free on signup</p>
            <div style={s.form}>
              <div>
                <label className="nx-label">Full Name</label>
                <input className="nx-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="nx-label">Email</label>
                <input className="nx-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="nx-label">Password</label>
                <input className="nx-input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              {/* Role selection */}
              <div>
                <label className="nx-label">I want to</label>
                <div style={s.roleRow}>
                  <div style={{ ...s.roleCard, ...(isMentor ? {} : s.roleActive) }} onClick={() => setIsMentor(false)}>
                    <span style={s.roleIcon}>📖</span>
                    <span style={s.roleLabel}>Learn</span>
                    <span style={s.roleSub}>Find mentors & book sessions</span>
                  </div>
                  <div style={{ ...s.roleCard, ...(isMentor ? s.roleActive : {}) }} onClick={() => setIsMentor(true)}>
                    <span style={s.roleIcon}>🎓</span>
                    <span style={s.roleLabel}>Teach & Learn</span>
                    <span style={s.roleSub}>Mentor others & earn tokens</span>
                  </div>
                </div>
              </div>

              {error && <div style={s.error}>⚠ {error}</div>}
              <button className="nx-btn" style={{ width:'100%', padding:'14px' }} onClick={() => {
                if (!name || !email || !password) return setError('All fields required');
                if (password.length < 6) return setError('Password min 6 chars');
                setError('');
                isMentor ? setStep(2) : handleSubmit();
              }}>
                {isMentor ? 'Continue → Add Skills' : loading ? 'Creating…' : 'Create Account →'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={s.title}>Skills you teach</h1>
            <p style={s.sub}>Select all that apply</p>
            <div style={s.skills}>
              {SKILLS.map(skill => (
                <button key={skill}
                  style={{ ...s.skillBtn, ...(selectedSkills.includes(skill) ? s.skillActive : {}) }}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:12 }}>
              <input className="nx-input" placeholder="Add custom skill…" value={customSkill} onChange={e => setCustomSkill(e.target.value)} onKeyDown={e => e.key==='Enter' && addCustom()} style={{ flex:1 }} />
              <button className="nx-btn-outline" onClick={addCustom} style={{ padding:'10px 14px', flexShrink:0 }}>+ Add</button>
            </div>
            {selectedSkills.length > 0 && (
              <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:6 }}>
                {selectedSkills.map(s2 => (
                  <span key={s2} style={s.selectedTag} onClick={() => toggleSkill(s2)}>
                    {s2} ✕
                  </span>
                ))}
              </div>
            )}
            {error && <div style={s.error}>⚠ {error}</div>}
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button className="nx-btn-ghost" onClick={() => setStep(1)} style={{ flex:1 }}>← Back</button>
              <button className="nx-btn" onClick={handleSubmit} disabled={loading} style={{ flex:2, padding:'13px' }}>
                {loading ? 'Creating…' : 'Create Account →'}
              </button>
            </div>
          </>
        )}

        <div style={s.footer}>
          Have an account? <Link to="/login" style={{ color:'#8b83ff', fontWeight:600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'#05050f', position:'relative', overflow:'hidden' },
  glow: { position:'fixed', top:'-30%', right:'-10%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(108,99,255,0.07) 0%, transparent 70%)', pointerEvents:'none' },
  card: { width:'100%', maxWidth:480, background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:20, padding:'36px 40px', position:'relative', zIndex:1 },
  logoRow: { display:'flex', alignItems:'center', gap:8, marginBottom:20 },
  logoText: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:14, color:'#8888aa', letterSpacing:'0.08em' },
  progress: { display:'flex', gap:6, marginBottom:24 },
  dot: { height:3, flex:1, borderRadius:2, transition:'background 0.3s' },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:24, color:'#e8e8f0', marginBottom:6 },
  sub: { color:'#8888aa', fontSize:14, marginBottom:24 },
  form: { display:'flex', flexDirection:'column', gap:16 },
  roleRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  roleCard: { padding:'14px 12px', borderRadius:12, border:'1.5px solid #1a1a35', background:'transparent', cursor:'pointer', transition:'all 0.2s', display:'flex', flexDirection:'column', gap:4, alignItems:'flex-start' },
  roleActive: { border:'1.5px solid #6c63ff', background:'rgba(108,99,255,0.1)' },
  roleIcon: { fontSize:20 },
  roleLabel: { fontWeight:700, fontSize:14, color:'#e8e8f0' },
  roleSub: { fontSize:11, color:'#8888aa', lineHeight:1.3 },
  error: { padding:'10px 14px', background:'rgba(255,92,122,0.1)', border:'1px solid rgba(255,92,122,0.25)', borderRadius:8, color:'#ff5c7a', fontSize:13 },
  skills: { display:'flex', flexWrap:'wrap', gap:8, marginBottom:4 },
  skillBtn: { padding:'7px 14px', borderRadius:20, border:'1.5px solid #1a1a35', background:'transparent', color:'#8888aa', fontSize:13, cursor:'pointer', transition:'all 0.15s' },
  skillActive: { border:'1.5px solid #6c63ff', background:'rgba(108,99,255,0.15)', color:'#8b83ff' },
  selectedTag: { padding:'4px 10px', borderRadius:20, background:'rgba(108,99,255,0.15)', border:'1px solid rgba(108,99,255,0.3)', color:'#8b83ff', fontSize:12, cursor:'pointer' },
  footer: { marginTop:24, textAlign:'center', color:'#555570', fontSize:13 },
};
