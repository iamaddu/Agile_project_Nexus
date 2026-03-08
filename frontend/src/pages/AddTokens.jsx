import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

const PACKAGES = [
  { amount: 50, label: 'Starter', desc: 'Try out a session', badge: null },
  { amount: 100, label: 'Basic', desc: 'Book 2–3 sessions', badge: null },
  { amount: 250, label: 'Growth', desc: 'Most popular', badge: '🔥 Popular' },
  { amount: 500, label: 'Pro', desc: 'Maximum top-up', badge: '⚡ Max' },
];

export default function AddTokens() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [selected, setSelected] = useState(100);
  const [loading, setLoading] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    API.get('/wallet/balance').then(r => setWallet(r.data)).catch(() => {});
    API.get('/wallet/history').then(r => setHistory(r.data)).catch(() => {});
  }, []);

  const handleAdd = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await API.post('/wallet/add', { amount: selected });
      setWallet(prev => ({ ...prev, walletBalance: res.data.walletBalance }));
      setMsg({ type:'success', text: `✓ Added ${selected} tokens! Balance: ${res.data.walletBalance}` });
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Failed to add tokens' });
    } finally { setLoading(false); }
  };

  const handleDaily = async () => {
    setDailyLoading(true);
    setMsg(null);
    try {
      const res = await API.post('/wallet/daily-reward');
      setWallet(prev => ({ ...prev, walletBalance: res.data.walletBalance }));
      setMsg({ type:'success', text: `🎁 ${res.data.message}` });
    } catch (err) {
      setMsg({ type:'error', text: err.response?.data?.message || 'Already claimed today' });
    } finally { setDailyLoading(false); }
  };

  const trustColor = !wallet ? '#8888aa' : wallet.trustScore >= 80 ? '#22c97e' : wallet.trustScore >= 50 ? '#f5c842' : '#ff5c7a';

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <button onClick={() => navigate(-1)} style={s.back}>← Back</button>
        <h1 style={s.title}>Wallet</h1>

        <div style={s.grid}>
          {/* Left: Balance & Daily */}
          <div style={s.left}>
            <div style={s.balCard}>
              <div style={s.balLabel}>🪙 Available Balance</div>
              <div style={s.balNum}>{wallet?.walletBalance ?? '—'}</div>
              <div style={s.balUnit}>tokens</div>
              {wallet?.escrowBalance > 0 && (
                <div style={s.escrow}>🔒 {wallet.escrowBalance} in escrow</div>
              )}
              <div style={s.trustRow}>
                <span style={{ color: trustColor, fontWeight:700 }}>{wallet?.trustScore ?? '—'}</span>
                <span style={s.trustLabel}> Trust Score</span>
              </div>
            </div>

            {/* Daily Reward */}
            <div style={s.dailyCard}>
              <div style={s.dailyIcon}>🎁</div>
              <div>
                <div style={s.dailyTitle}>Daily Free Tokens</div>
                <div style={s.dailySub}>Claim 50 tokens every 24 hours</div>
              </div>
              <button className="nx-btn" onClick={handleDaily} disabled={dailyLoading} style={{ padding:'9px 18px', fontSize:13, flexShrink:0 }}>
                {dailyLoading ? '…' : 'Claim'}
              </button>
            </div>

            {msg && (
              <div style={{ ...s.msg, background: msg.type==='success' ? 'rgba(34,201,126,0.1)' : 'rgba(255,92,122,0.1)', borderColor: msg.type==='success' ? 'rgba(34,201,126,0.3)' : 'rgba(255,92,122,0.3)', color: msg.type==='success' ? '#22c97e' : '#ff5c7a' }}>
                {msg.text}
              </div>
            )}
          </div>

          {/* Right: Top Up */}
          <div style={s.right}>
            <h2 style={s.sectionTitle}>Top Up</h2>
            <p style={s.sectionSub}>Max 500 per top-up · Max 1000 total balance</p>
            <div style={s.packages}>
              {PACKAGES.map(pkg => (
                <div key={pkg.amount} style={{ ...s.pkg, ...(selected===pkg.amount ? s.pkgActive : {}) }} onClick={() => setSelected(pkg.amount)}>
                  {pkg.badge && <span style={s.pkgBadge}>{pkg.badge}</span>}
                  <div style={s.pkgAmount}>{pkg.amount}</div>
                  <div style={s.pkgLabel}>{pkg.label}</div>
                  <div style={s.pkgDesc}>{pkg.desc}</div>
                </div>
              ))}
            </div>
            <button className="nx-btn" onClick={handleAdd} disabled={loading} style={{ width:'100%', padding:'14px', marginTop:16 }}>
              {loading ? 'Adding…' : `Add ${selected} Tokens →`}
            </button>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={s.historySection}>
            <h2 style={s.sectionTitle}>Transaction History</h2>
            <div style={s.historyList}>
              {history.map((h, i) => (
                <div key={i} style={s.histRow}>
                  <span style={{ fontSize:18 }}>{h.type==='credit' ? '⬆' : '⬇'}</span>
                  <div style={{ flex:1 }}>
                    <div style={s.histDesc}>{h.description}</div>
                    <div style={s.histDate}>{new Date(h.date).toLocaleDateString()}</div>
                  </div>
                  <span style={{ color: h.type==='credit' ? '#22c97e' : '#ff5c7a', fontWeight:700 }}>
                    {h.type==='credit' ? '+' : '-'}{h.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:900, margin:'0 auto', padding:'28px 24px' },
  back: { background:'none', border:'none', color:'#8888aa', cursor:'pointer', fontSize:14, marginBottom:16, padding:0 },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'#e8e8f0', marginBottom:24 },
  grid: { display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:20, marginBottom:28 },
  left: { display:'flex', flexDirection:'column', gap:12 },
  right: {},
  balCard: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:16, padding:'24px', textAlign:'center' },
  balLabel: { color:'#8888aa', fontSize:13, marginBottom:8 },
  balNum: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:52, color:'#e8e8f0', lineHeight:1 },
  balUnit: { color:'#555570', fontSize:16, marginTop:4, marginBottom:12 },
  escrow: { color:'#f5c842', fontSize:13, marginBottom:8 },
  trustRow: { fontSize:14, marginTop:8 },
  trustLabel: { color:'#8888aa' },
  dailyCard: { display:'flex', alignItems:'center', gap:12, background:'#0a0a1a', border:'1.5px solid rgba(34,201,126,0.2)', borderRadius:14, padding:'16px' },
  dailyIcon: { fontSize:24, flexShrink:0 },
  dailyTitle: { fontWeight:700, color:'#e8e8f0', fontSize:14 },
  dailySub: { color:'#8888aa', fontSize:12 },
  msg: { padding:'12px 16px', borderRadius:10, border:'1.5px solid', fontSize:14 },
  sectionTitle: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:17, color:'#e8e8f0', marginBottom:4 },
  sectionSub: { color:'#555570', fontSize:12, marginBottom:16 },
  packages: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  pkg: { padding:'16px', borderRadius:12, border:'1.5px solid #1a1a35', background:'#0a0a1a', cursor:'pointer', transition:'all 0.15s', position:'relative' },
  pkgActive: { border:'1.5px solid #6c63ff', background:'rgba(108,99,255,0.08)' },
  pkgBadge: { position:'absolute', top:8, right:8, fontSize:10, color:'#f5c842', background:'rgba(245,200,66,0.1)', padding:'2px 6px', borderRadius:10, border:'1px solid rgba(245,200,66,0.3)' },
  pkgAmount: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'#e8e8f0' },
  pkgLabel: { fontWeight:600, fontSize:13, color:'#8b83ff', marginTop:2 },
  pkgDesc: { fontSize:12, color:'#8888aa', marginTop:2 },
  historySection: { marginTop:8 },
  historyList: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, overflow:'hidden' },
  histRow: { display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:'1px solid #0f0f22' },
  histDesc: { fontSize:14, color:'#c8c8e0' },
  histDate: { fontSize:11, color:'#555570', marginTop:2 },
};
