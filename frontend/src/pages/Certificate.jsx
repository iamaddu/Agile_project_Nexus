import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function Certificate() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const certRef = useRef(null);

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    API.get(`/sessions/${sessionId}`)
      .then(r => { setSession(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Certificate — Nexus Cognitive</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Outfit, sans-serif; background: white; padding: 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>${certRef.current?.innerHTML}</body>
</html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile}/>
      <div style={{ display:'flex', justifyContent:'center', padding:'80px 0', color:'var(--n-400)' }}>Loading…</div>
    </div>
  );

  if (!session?.certificateIssued) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile}/>
      <div style={{ textAlign:'center', padding:'80px 24px' }}>
        <div style={{ width:60, height:60, borderRadius:18, background:'var(--n-100)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--n-400)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
        </div>
        <h2 style={{ fontSize:18, fontWeight:700, color:'var(--n-700)', marginBottom:8 }}>No certificate yet</h2>
        <p style={{ color:'var(--n-400)', fontSize:14, marginBottom:20 }}>Pass the quiz with 60%+ to earn a certificate for this session.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button className="nx-btn-outline" onClick={() => navigate('/my-sessions')} style={{ padding:'9px 20px' }}>Back to Sessions</button>
          <button className="nx-btn" onClick={() => navigate(`/quiz/${sessionId}`)} style={{ padding:'9px 20px' }}>Take Quiz</button>
        </div>
      </div>
    </div>
  );

  const issuedDate = new Date(session.certificateIssuedAt || session.updatedAt)
    .toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const certId = `NXC-${session._id.toString().slice(-8).toUpperCase()}`;

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile}/>
      <div style={C.page}>
        <div style={C.topRow}>
          <button className="nx-btn-outline" onClick={() => navigate('/my-sessions')} style={{ fontSize:13 }}>
            ← My Sessions
          </button>
          <button className="nx-btn" onClick={handlePrint} style={{ fontSize:13, padding:'9px 18px', gap:7 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print / Save as PDF
          </button>
        </div>

        {/* Certificate */}
        <div ref={certRef}>
          <div style={C.certOuter}>
            <div style={C.certBorderA}>
              <div style={C.certBorderB}>

                {/* Header */}
                <div style={C.header}>
                  <div style={C.logoBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div style={C.orgName}>NEXUS COGNITIVE</div>
                  <div style={C.orgSub}>Peer Learning Marketplace · Certificate of Completion</div>
                </div>

                <div style={C.rule}/>

                {/* Body */}
                <div style={C.body}>
                  <p style={C.pre}>This is to certify that</p>
                  <div style={C.recipientName}>{session.learner?.name}</div>
                  <p style={C.pre}>has successfully completed a mentoring session in</p>
                  <div style={C.skillName}>{session.skill}</div>
                  <p style={C.pre}>
                    under the guidance of{' '}
                    <strong style={{ color:'#1e3a8a', fontWeight:800 }}>{session.mentor?.name}</strong>
                    {' '}and demonstrated knowledge through an AI-assessed quiz with a score of{' '}
                    <strong style={{ color:'#1e3a8a' }}>{session.quizScore}%</strong>.
                  </p>
                </div>

                <div style={C.rule}/>

                {/* Footer */}
                <div style={C.footer}>
                  <div style={C.metaGrid}>
                    {[
                      ['Date Issued',     issuedDate],
                      ['Certificate ID',  certId],
                      ['Quiz Score',      `${session.quizScore}% — Passed`],
                    ].map(([lbl, val]) => (
                      <div key={lbl}>
                        <div style={C.metaLabel}>{lbl}</div>
                        <div style={C.metaVal}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={C.seal}>
                    <div style={C.sealRing}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <div style={C.sealText}>VERIFIED</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign:'center', padding:'12px 0 4px' }}>
          <span style={{ color:'var(--n-400)', fontSize:13 }}>
            Certificate ID:{' '}
            <code style={{ color:'var(--brand)', fontFamily:'monospace', fontWeight:600 }}>{certId}</code>
          </span>
        </div>
      </div>
    </div>
  );
}

const C = {
  page:        { maxWidth:860, margin:'0 auto', padding:'28px 24px 64px' },
  topRow:      { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:10 },
  certOuter:   { background:'linear-gradient(145deg, #f0f4ff 0%, #e8f0fe 50%, #f0fff4 100%)', borderRadius:14, padding:10, boxShadow:'0 24px 60px rgba(30,58,138,.12)', marginBottom:16 },
  certBorderA: { border:'2.5px solid #1e3a8a', borderRadius:9, padding:5 },
  certBorderB: { border:'1px solid rgba(30,58,138,.2)', borderRadius:7, padding:'44px 56px' },
  header:      { textAlign:'center', marginBottom:24 },
  logoBox:     { width:48, height:48, borderRadius:13, background:'#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' },
  orgName:     { fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:20, color:'#1e3a8a', letterSpacing:'.14em', marginBottom:4 },
  orgSub:      { fontFamily:'Outfit,sans-serif', fontSize:11, color:'#94a3b8', letterSpacing:'.1em', textTransform:'uppercase' },
  rule:        { height:1, background:'linear-gradient(90deg,transparent,rgba(30,58,138,.25),transparent)', margin:'24px 0' },
  body:        { textAlign:'center', padding:'8px 0' },
  pre:         { fontFamily:'Outfit,sans-serif', fontSize:14, color:'#64748b', fontStyle:'italic', marginBottom:8 },
  recipientName:{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:40, color:'#1e293b', marginBottom:14, letterSpacing:'-.02em', lineHeight:1.1 },
  skillName:   { fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:26, color:'#1e3a8a', marginBottom:12 },
  footer:      { display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16 },
  metaGrid:    { display:'flex', gap:32, flexWrap:'wrap' },
  metaLabel:   { fontFamily:'Outfit,sans-serif', fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:3 },
  metaVal:     { fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:13, color:'#1e293b' },
  seal:        { flexShrink:0 },
  sealRing:    { width:76, height:76, borderRadius:'50%', border:'2.5px solid #1e3a8a', background:'rgba(30,58,138,.05)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 },
  sealText:    { fontFamily:'Outfit,sans-serif', fontSize:7, fontWeight:800, letterSpacing:'.1em', color:'#1e3a8a' },
};
