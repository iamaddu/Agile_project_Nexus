import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function Certificate() {
  const { sessionId } = useParams();
  const { user } = useAuth();
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

  const handlePrint = () => window.print();

  const handleDownload = () => {
    // Create a printable version
    const certContent = certRef.current?.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate — ${session?.skill}</title>
          <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 0; background: #fff; font-family: 'DM Sans', sans-serif; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>${certContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return (
    <div style={s.root}><Navbar profile={profile} /><div style={s.empty}>Loading…</div></div>
  );

  if (!session || !session.certificateIssued) return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.empty}>
        <div style={{ fontSize:40, marginBottom:12 }}>🎓</div>
        <div>No certificate available.</div>
        <p style={{ color:'#555570', fontSize:13, marginTop:8 }}>Pass the quiz with 60%+ to earn a certificate.</p>
        <button className="nx-btn" onClick={() => navigate('/my-sessions')} style={{ marginTop:16, padding:'10px 24px' }}>← My Sessions</button>
      </div>
    </div>
  );

  const issuedDate = new Date(session.certificateIssuedAt || session.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const certId = `NXC-${session._id.toString().slice(-8).toUpperCase()}`;

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <div style={s.topRow}>
          <button onClick={() => navigate('/my-sessions')} style={s.back}>← My Sessions</button>
          <div style={s.topActions}>
            <button className="nx-btn-ghost" onClick={handleDownload} style={{ fontSize:13 }}>🖨 Print / Save PDF</button>
          </div>
        </div>

        {/* THE CERTIFICATE */}
        <div ref={certRef}>
          <div style={s.cert}>
            {/* Background decoration */}
            <div style={s.cornerTL} />
            <div style={s.cornerBR} />
            <div style={s.borderOuter}>
              <div style={s.borderInner}>

                {/* Header */}
                <div style={s.certHeader}>
                  <div style={s.certLogo}>⚡</div>
                  <div style={s.certLogoText}>NEXUS COGNITIVE</div>
                  <div style={s.certLogoSub}>PEER LEARNING MARKETPLACE</div>
                </div>

                <div style={s.divider} />

                {/* Title */}
                <div style={s.certTitleSmall}>This is to certify that</div>
                <div style={s.certName}>{session.learner?.name}</div>
                <div style={s.certTitleSmall}>has successfully completed a learning session in</div>
                <div style={s.certSkill}>{session.skill}</div>
                <div style={s.certTitleSmall}>under the mentorship of</div>
                <div style={s.certMentor}>{session.mentor?.name}</div>

                <div style={s.divider} />

                {/* Score badge */}
                <div style={s.scoreRow}>
                  <div style={s.scoreBadge}>
                    <div style={s.scoreNum}>{session.quizScore}%</div>
                    <div style={s.scoreLabel}>Quiz Score</div>
                  </div>
                  <div style={s.scoreDetail}>
                    <div style={s.scoreDetailLine}><span style={s.sdLabel}>Skill:</span> {session.skill}</div>
                    <div style={s.scoreDetailLine}><span style={s.sdLabel}>Issued:</span> {issuedDate}</div>
                    <div style={s.scoreDetailLine}><span style={s.sdLabel}>Certificate ID:</span> {certId}</div>
                  </div>
                </div>

                <div style={s.divider} />

                {/* Footer signatures */}
                <div style={s.sigRow}>
                  <div style={s.sig}>
                    <div style={s.sigName}>{session.mentor?.name}</div>
                    <div style={s.sigLine} />
                    <div style={s.sigTitle}>Mentor</div>
                  </div>
                  <div style={s.certSeal}>
                    <div style={s.sealInner}>
                      <div style={s.sealCheck}>✓</div>
                      <div style={s.sealText}>VERIFIED</div>
                    </div>
                  </div>
                  <div style={s.sig}>
                    <div style={s.sigName}>NEXUS COGNITIVE</div>
                    <div style={s.sigLine} />
                    <div style={s.sigTitle}>Platform</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Share / info */}
        <div style={s.shareBox}>
          <div style={s.shareIcon}>🎊</div>
          <div>
            <div style={{ fontWeight:700, color:'#e8e8f0', fontSize:15 }}>Congratulations, {session.learner?.name}!</div>
            <div style={{ color:'#8888aa', fontSize:13, marginTop:2 }}>
              You've earned a verified certificate for <strong style={{ color:'#8b83ff' }}>{session.skill}</strong>. Certificate ID: <code style={{ color:'#f5c842', fontSize:12 }}>{certId}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:900, margin:'0 auto', padding:'28px 24px' },
  topRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  back: { background:'none', border:'none', color:'#8888aa', cursor:'pointer', fontSize:14, padding:0 },
  topActions: { display:'flex', gap:10 },
  empty: { textAlign:'center', padding:'80px 0', color:'#8888aa' },

  // Certificate styles
  cert: {
    background: 'linear-gradient(135deg, #fefefe 0%, #f8f4ff 50%, #fff8e1 100%)',
    borderRadius: 12,
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    marginBottom: 20,
  },
  cornerTL: { position:'absolute', top:0, left:0, width:120, height:120, background:'rgba(108,99,255,0.06)', borderBottomRightRadius:'100%' },
  cornerBR: { position:'absolute', bottom:0, right:0, width:120, height:120, background:'rgba(34,201,126,0.06)', borderTopLeftRadius:'100%' },
  borderOuter: { border:'3px solid #6c63ff', borderRadius:8, padding:4 },
  borderInner: { border:'1px solid rgba(108,99,255,0.3)', borderRadius:6, padding:'40px 52px', position:'relative' },

  certHeader: { textAlign:'center', marginBottom:20 },
  certLogo: { fontSize:36, marginBottom:4 },
  certLogoText: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#1a1040', letterSpacing:'0.15em' },
  certLogoSub: { fontFamily:'Syne,sans-serif', fontWeight:400, fontSize:10, color:'#8888aa', letterSpacing:'0.2em', marginTop:2 },

  divider: { height:1, background:'linear-gradient(90deg, transparent, rgba(108,99,255,0.3), transparent)', margin:'20px 0' },

  certTitleSmall: { textAlign:'center', color:'#888', fontSize:13, marginBottom:6, fontStyle:'italic', fontFamily:'DM Sans,sans-serif' },
  certName: { textAlign:'center', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:34, color:'#1a1040', marginBottom:10, letterSpacing:'0.02em' },
  certSkill: { textAlign:'center', fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'#6c63ff', marginBottom:10 },
  certMentor: { textAlign:'center', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:18, color:'#333', marginBottom:0 },

  scoreRow: { display:'flex', alignItems:'center', justifyContent:'center', gap:32 },
  scoreBadge: { textAlign:'center', padding:'16px 24px', background:'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(34,201,126,0.1))', border:'2px solid rgba(108,99,255,0.2)', borderRadius:12 },
  scoreNum: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:36, color:'#6c63ff' },
  scoreLabel: { fontSize:12, color:'#888', marginTop:2 },
  scoreDetail: { display:'flex', flexDirection:'column', gap:6 },
  scoreDetailLine: { fontSize:13, color:'#555' },
  sdLabel: { fontWeight:700, color:'#333' },

  sigRow: { display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:4 },
  sig: { textAlign:'center', flex:1 },
  sigName: { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:14, color:'#333', marginBottom:6 },
  sigLine: { height:1, background:'rgba(0,0,0,0.15)', marginBottom:4 },
  sigTitle: { fontSize:11, color:'#888', textTransform:'uppercase', letterSpacing:'0.1em' },

  certSeal: { width:80, height:80, borderRadius:'50%', border:'3px solid #6c63ff', background:'rgba(108,99,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, position:'relative' },
  sealInner: { textAlign:'center' },
  sealCheck: { fontSize:22, color:'#6c63ff', lineHeight:1 },
  sealText: { fontSize:9, color:'#6c63ff', fontWeight:800, letterSpacing:'0.1em', marginTop:2 },

  shareBox: { display:'flex', alignItems:'center', gap:16, background:'rgba(34,201,126,0.05)', border:'1.5px solid rgba(34,201,126,0.2)', borderRadius:14, padding:'18px 22px' },
  shareIcon: { fontSize:28, flexShrink:0 },
};
