import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import API from '../api/axios';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [valid, setValid] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get(`/auth/verify-reset-token/${token}`)
      .then(r => setValid(r.data.valid))
      .catch(() => setValid(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords don't match");
    if (password.length < 6) return setError('Min 6 characters');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, newPassword: password });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  if (valid === null) return <div style={s.root}><div style={{ color:'#8888aa' }}>Verifying link…</div></div>;

  return (
    <div style={s.root}>
      <div style={s.card} className="animate-in">
        <h1 style={s.title}>Set new password</h1>
        {!valid ? (
          <div style={{ color:'#ff5c7a', marginTop:16 }}>
            Link expired or invalid. <Link to="/forgot-password" style={{ color:'#8b83ff' }}>Request new link →</Link>
          </div>
        ) : done ? (
          <div style={s.success}>
            <div style={s.check}>✓</div>
            <p style={{ color:'#c8c8e0' }}>Password updated! Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16, marginTop:20 }}>
            <div>
              <label className="nx-label">New Password</label>
              <input className="nx-input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="nx-label">Confirm Password</label>
              <input className="nx-input" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            {error && <div style={s.error}>⚠ {error}</div>}
            <button className="nx-btn" style={{ width:'100%', padding:'14px' }} disabled={loading}>
              {loading ? 'Saving…' : 'Reset Password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'#05050f' },
  card: { width:'100%', maxWidth:420, background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:20, padding:'36px 40px' },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:24, color:'#e8e8f0' },
  success: { textAlign:'center', padding:'32px 0' },
  check: { width:52, height:52, borderRadius:'50%', background:'rgba(34,201,126,0.15)', border:'2px solid #22c97e', color:'#22c97e', fontSize:22, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  error: { padding:'10px 14px', background:'rgba(255,92,122,0.1)', border:'1px solid rgba(255,92,122,0.25)', borderRadius:8, color:'#ff5c7a', fontSize:13 },
};
