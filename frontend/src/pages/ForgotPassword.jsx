import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const r = await API.post('/auth/forgot-password', { email }); setSent(true); if (r.data.devLink) setDevLink(r.data.devLink); }
    catch {} setLoading(false);
  };

  return (
    <div style={s.root}>
      <div style={s.card} className="fade-up">
        <Link to="/login" style={s.back}>← Back to sign in</Link>
        <h1 style={s.title}>Reset your password</h1>
        <p style={s.sub}>Enter your email and we'll send you a reset link.</p>
        {!sent ? (
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div><label className="nx-label">Email address</label><input className="nx-input" type="email" placeholder="name@example.com" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus /></div>
            <button className="nx-btn" type="submit" disabled={loading} style={{ width:'100%', padding:'11px', fontSize:15, justifyContent:'center', marginTop:4 }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div style={s.success}>
            <div style={s.checkIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p style={{ color:'var(--n-700)', fontSize:15 }}>Reset link sent to <strong>{email}</strong>. Check your inbox.</p>
            {devLink && (
              <div style={s.devBox}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--amber)', marginBottom:4 }}>DEV ONLY — direct link:</div>
                <a href={devLink} style={{ color:'var(--brand)', fontSize:12, wordBreak:'break-all' }}>{devLink}</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:24 },
  card: { width:'100%', maxWidth:400, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'36px 40px', boxShadow:'var(--sh-lg)' },
  back: { display:'inline-block', fontSize:13, color:'var(--n-400)', marginBottom:24 },
  title: { fontSize:24, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:6 },
  sub: { fontSize:14, color:'var(--n-400)', marginBottom:24 },
  success: { textAlign:'center', padding:'8px 0' },
  checkIcon: { width:52, height:52, borderRadius:'50%', background:'var(--emerald-bg)', border:'1.5px solid var(--emerald-bd)', color:'var(--emerald)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  devBox: { marginTop:16, padding:12, background:'var(--amber-bg)', border:'1px solid var(--amber-bd)', borderRadius:'var(--r)', textAlign:'left' },
};
