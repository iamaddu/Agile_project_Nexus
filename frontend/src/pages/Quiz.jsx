import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function Quiz() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [profile,    setProfile]    = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [answers,    setAnswers]    = useState({});
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    API.post('/quiz/generate', { sessionId })
      .then(r => { setQuestions(r.data.questions); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Failed to load quiz'); setLoading(false); });
  }, [sessionId]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length)
      return setError('Please answer all questions before submitting');
    setSubmitting(true); setError('');
    try {
      const answersArray = questions.map((_, i) => answers[i] ?? -1);
      const res = await API.post('/quiz/submit', { sessionId, answers: answersArray, questions });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  const answered    = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answered === questions.length;

  // ── Already taken ──────────────────────────────────────────────────────────
  if (!loading && error === 'Quiz already taken') return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile}/>
      <div style={T.centered}>
        <div style={T.infoCard}>
          <div style={T.infoIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--n-400)" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 style={T.infoTitle}>Quiz already submitted</h2>
          <p style={T.infoSub}>You can only take the quiz once per session. View your result in My Sessions.</p>
          <button className="nx-btn" onClick={() => navigate('/my-sessions')} style={{ padding:'10px 24px' }}>
            Go to My Sessions
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Navbar profile={profile}/>
      <div style={T.page}>
        <button onClick={() => navigate('/my-sessions')} style={T.backBtn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          My Sessions
        </button>

        {/* ── Loading ── */}
        {loading && (
          <div style={T.centered}>
            <div style={T.spinner}/>
            <p style={{ color:'var(--n-400)', fontSize:14 }}>Generating quiz questions with AI…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && !questions.length && (
          <div style={T.centered}>
            <div style={{ padding:'12px 16px', background:'var(--rose-bg)', border:'1px solid var(--rose-bd)', borderRadius:'var(--r)', color:'var(--rose)', fontSize:14, marginBottom:16 }}>
              {error}
            </div>
            <button className="nx-btn-outline" onClick={() => navigate('/my-sessions')}>Back to Sessions</button>
          </div>
        )}

        {/* ── Result screen ── */}
        {result && (
          <div style={T.resultCard} className="fade-up">
            <div style={{ ...T.scoreBig, color: result.passed ? 'var(--emerald)' : 'var(--amber)' }}>
              {result.score}<span style={{ fontSize:28, fontWeight:400, opacity:.7 }}>%</span>
            </div>
            <h2 style={{ ...T.resultTitle, color: result.passed ? 'var(--emerald)' : 'var(--amber)' }}>
              {result.passed ? 'Quiz Passed!' : 'Not quite — keep going'}
            </h2>
            <p style={{ color:'var(--n-500)', fontSize:14, marginBottom:6 }}>
              {result.correct} out of {result.total} correct answers
            </p>
            <p style={{ fontWeight:700, fontSize:14, color: result.passed ? 'var(--emerald)' : 'var(--rose)', marginBottom:24 }}>
              Trust score {result.passed ? '+5' : '−2'}
            </p>

            {result.passed && (
              <div style={T.certBanner}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="6"/>
                  <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                </svg>
                Certificate issued — view it below
              </div>
            )}

            <p style={{ color:'var(--n-400)', fontSize:14, lineHeight:1.7, marginBottom:28, maxWidth:380, textAlign:'center' }}>
              {result.passed
                ? 'Your learning has been verified. A certificate has been issued for this session.'
                : 'You need 60% or higher to pass. Book another session to strengthen your understanding.'}
            </p>

            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              <button className="nx-btn" onClick={() => navigate('/my-sessions')} style={{ padding:'11px 24px' }}>
                My Sessions
              </button>
              {result.passed && (
                <button className="nx-btn-outline" onClick={() => navigate(`/certificate/${sessionId}`)} style={{ padding:'11px 24px' }}>
                  View Certificate
                </button>
              )}
              {!result.passed && (
                <button className="nx-btn-outline" onClick={() => navigate('/find-mentor')} style={{ padding:'11px 24px' }}>
                  Find Another Mentor
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Quiz questions ── */}
        {!loading && !result && questions.length > 0 && (
          <>
            <div style={T.quizHeader} className="fade-up">
              <div>
                <h1 style={T.title}>Knowledge Check</h1>
                <p style={T.sub}>{questions.length} questions · 60% to pass · One attempt per session</p>
              </div>
              <div style={T.progressBox}>
                <span style={{ ...T.progressNum, color: allAnswered ? 'var(--emerald)' : 'var(--n-700)' }}>{answered}</span>
                <span style={{ color:'var(--n-400)', fontSize:13 }}>/{questions.length} answered</span>
              </div>
            </div>

            {/* Overall progress bar */}
            <div style={T.progressBar}>
              <div style={{ ...T.progressFill, width:`${(answered/questions.length)*100}%`, background: allAnswered ? 'var(--emerald)' : 'var(--brand)' }}/>
            </div>

            {/* Questions */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {questions.map((q, qi) => (
                <div key={qi} style={T.qCard} className={`fade-up stagger-${Math.min(qi+1,4)}`}>
                  <div style={T.qLabel}>Question {qi + 1} of {questions.length}</div>
                  <div style={T.qText}>{q.question}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                    {q.options.map((opt, ai) => (
                      <button key={ai}
                        style={{ ...T.option, ...(answers[qi]===ai ? T.optionOn : {}) }}
                        onClick={() => setAnswers(p => ({ ...p, [qi]: ai }))}>
                        <span style={{ ...T.optLetter, ...(answers[qi]===ai ? { background:'var(--brand)', color:'white' } : {}) }}>
                          {'ABCD'[ai]}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ padding:'10px 13px', background:'var(--rose-bg)', border:'1px solid var(--rose-bd)', borderRadius:'var(--r)', color:'var(--rose)', fontSize:13 }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="nx-btn" onClick={handleSubmit} disabled={submitting || !allAnswered}
                style={{ padding:'12px 32px', fontSize:15, opacity: allAnswered ? 1 : .5 }}>
                {submitting ? 'Submitting…' : allAnswered ? 'Submit Quiz' : `Answer all ${questions.length} questions to submit`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const T = {
  page:        { maxWidth:740, margin:'0 auto', padding:'28px 24px 64px', display:'flex', flexDirection:'column', gap:20 },
  backBtn:     { display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'var(--n-400)', cursor:'pointer', fontSize:13, fontFamily:'var(--f)', padding:0, alignSelf:'flex-start' },
  centered:    { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:16 },
  infoCard:    { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'40px 36px', textAlign:'center', maxWidth:380, boxShadow:'var(--sh-md)' },
  infoIcon:    { width:56, height:56, borderRadius:16, background:'var(--n-100)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' },
  infoTitle:   { fontSize:18, fontWeight:800, color:'var(--n-800)', marginBottom:8 },
  infoSub:     { fontSize:14, color:'var(--n-400)', lineHeight:1.6, marginBottom:20 },
  spinner:     { width:28, height:28, border:'2.5px solid var(--border)', borderTop:'2.5px solid var(--brand)', borderRadius:'50%', animation:'spin .7s linear infinite' },
  quizHeader:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' },
  title:       { fontSize:26, fontWeight:800, color:'var(--n-900)', letterSpacing:'-.02em', marginBottom:4 },
  sub:         { fontSize:13, color:'var(--n-400)' },
  progressBox: { display:'flex', alignItems:'baseline', gap:4, padding:'10px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', flexShrink:0 },
  progressNum: { fontWeight:800, fontSize:24, letterSpacing:'-.02em' },
  progressBar: { height:5, background:'var(--n-100)', borderRadius:3, overflow:'hidden' },
  progressFill:{ height:'100%', borderRadius:3, transition:'width .3s, background .3s' },
  qCard:       { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'20px 22px', boxShadow:'var(--sh-xs)' },
  qLabel:      { fontSize:11, fontWeight:700, color:'var(--brand)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 },
  qText:       { fontSize:16, fontWeight:600, color:'var(--n-800)', marginBottom:14, lineHeight:1.5 },
  option:      { display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:'var(--r)', border:'1.5px solid var(--border)', background:'transparent', color:'var(--n-600)', fontSize:14, cursor:'pointer', transition:'all .15s', textAlign:'left', fontFamily:'var(--f)', width:'100%' },
  optionOn:    { border:'1.5px solid var(--brand)', background:'var(--brand-soft)', color:'var(--n-800)' },
  optLetter:   { width:26, height:26, borderRadius:7, background:'var(--n-100)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--n-500)', flexShrink:0, transition:'all .15s' },
  resultCard:  { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'48px 36px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', boxShadow:'var(--sh-md)' },
  scoreBig:    { fontWeight:800, fontSize:88, lineHeight:1, letterSpacing:'-.04em', marginBottom:12 },
  resultTitle: { fontSize:28, fontWeight:800, marginBottom:8, letterSpacing:'-.02em' },
  certBanner:  { display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'var(--emerald-bg)', border:'1px solid var(--emerald-bd)', borderRadius:'var(--r)', color:'var(--emerald)', fontSize:13, fontWeight:600, marginBottom:16 },
};
