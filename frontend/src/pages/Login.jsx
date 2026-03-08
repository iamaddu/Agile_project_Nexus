import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <div style={s.glow1} />
      <div style={s.glow2} />
      <div style={s.card} className="animate-in">
        <div style={s.logoRow}>
          <span style={s.logoMark}>⚡</span>
          <div>
            <div style={s.logoText}>NEXUS COGNITIVE</div>
            <div style={s.logoSub}>Peer-to-peer learning marketplace</div>
          </div>
        </div>
        <h1 style={s.title}>Welcome back</h1>
        <p style={s.subtitle}>Sign in to continue learning</p>
        <form onSubmit={handleSubmit} style={s.form}>
          <div>
            <label className="nx-label">Email</label>
            <input className="nx-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <label className="nx-label" style={{ margin:0 }}>Password</label>
              <Link to="/forgot-password" style={s.forgot}>Forgot password?</Link>
            </div>
            <input className="nx-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <div style={s.error}>⚠ {error}</div>}
          <button className="nx-btn" type="submit" disabled={loading} style={{ width:'100%', marginTop:4, padding:'14px' }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
        <div style={s.footer}>
          Don't have an account? <Link to="/register" style={{ color:'#8b83ff', fontWeight:600 }}>Create one free</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden', background:'#05050f' },
  glow1: { position:'fixed', top:'-20%', left:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(108,99,255,0.08) 0%, transparent 70%)', pointerEvents:'none' },
  glow2: { position:'fixed', bottom:'-20%', right:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,201,126,0.06) 0%, transparent 70%)', pointerEvents:'none' },
  card: { width:'100%', maxWidth:420, background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:20, padding:'36px 40px', position:'relative', zIndex:1 },
  logoRow: { display:'flex', alignItems:'center', gap:12, marginBottom:28 },
  logoMark: { fontSize:28 },
  logoText: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:15, color:'#e8e8f0', letterSpacing:'0.05em' },
  logoSub: { fontSize:11, color:'#555570', marginTop:1 },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'#e8e8f0', marginBottom:6 },
  subtitle: { color:'#8888aa', fontSize:14, marginBottom:24 },
  form: { display:'flex', flexDirection:'column', gap:16 },
  forgot: { fontSize:12, color:'#6c63ff' },
  error: { padding:'10px 14px', background:'rgba(255,92,122,0.1)', border:'1px solid rgba(255,92,122,0.25)', borderRadius:8, color:'#ff5c7a', fontSize:13 },
  footer: { marginTop:24, textAlign:'center', color:'#555570', fontSize:13 },
};
