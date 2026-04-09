import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import Navbar from '../components/Navbar';

export default function Quiz() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    API.post('/quiz/generate', { sessionId })
      .then(r => { setQuestions(r.data.questions); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Failed to load quiz'); setLoading(false); });
  }, [sessionId]);

  const handleAnswer = (qi, ai) => {
    setAnswers(prev => ({ ...prev, [qi]: ai }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      return setError('Please answer all questions before submitting');
    }
    setSubmitting(true);
    try {
      const answersArray = questions.map((_, i) => answers[i] ?? -1);
      const res = await API.post('/quiz/submit', { sessionId, answers: answersArray, questions });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        <button onClick={() => navigate('/my-sessions')} style={s.back}>← My Sessions</button>

        {loading ? (
          <div style={s.empty}>Generating quiz questions with AI…</div>
        ) : error && !questions.length ? (
          <div style={{ color:'#ff5c7a', padding:'40px 0' }}>{error}</div>
        ) : result ? (
          /* Result screen */
          <div style={s.resultCard}>
            <div style={s.resultIcon}>{result.passed ? '🎓' : '📖'}</div>
            <h1 style={{ ...s.resultTitle, color: result.passed ? '#22c97e' : '#f5c842' }}>
              {result.passed ? 'Quiz Passed!' : 'Keep Practicing!'}
            </h1>
            <div style={s.resultScore}>
              <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:56, color: result.passed ? '#22c97e' : '#f5c842' }}>{result.score}</span>
              <span style={{ color:'#8888aa', fontSize:20 }}>%</span>
            </div>
            <div style={s.resultMeta}>
              {result.correct} / {result.total} correct · {result.passed ? 'Trust score +5 🔺' : 'Trust score -3 🔻'}
            </div>
            <p style={s.resultMsg}>
              {result.passed
                ? 'Great job! Your trust score has been updated and your learning is verified.'
                : 'Score 60% or more to pass. Book another session to strengthen your knowledge!'}
            </p>
            <div style={s.resultActions}>
              {result.passed && (
                <button className="nx-btn" onClick={() => navigate(`/certificate/${sessionId}`)} style={{ padding:'12px 28px', background:'#f5c842', color:'#000' }}>
                  🎓 View Certificate
                </button>
              )}
              <button className="nx-btn" onClick={() => navigate('/my-sessions')} style={{ padding:'12px 28px' }}>
                Back to Sessions →
              </button>
              {!result.passed && (
                <button className="nx-btn-outline" onClick={() => navigate('/find-mentor')}>
                  Find Mentor Again
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Questions */
          <>
            <h1 style={s.title}>Knowledge Check</h1>
            <p style={s.sub}>Answer all {questions.length} questions · 60% to pass</p>

            <div style={s.questions}>
              {questions.map((q, qi) => (
                <div key={qi} style={s.questionCard}>
                  <div style={s.qNum}>Q{qi + 1}</div>
                  <div style={s.qText}>{q.question}</div>
                  <div style={s.options}>
                    {q.options.map((opt, ai) => (
                      <button
                        key={ai}
                        style={{ ...s.option, ...(answers[qi] === ai ? s.optionSelected : {}) }}
                        onClick={() => handleAnswer(qi, ai)}
                      >
                        <span style={s.optionLetter}>{'ABCD'[ai]}</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={s.progress}>
              {questions.map((_, i) => (
                <div key={i} style={{ ...s.progressDot, background: answers[i] !== undefined ? '#6c63ff' : '#1a1a35' }} />
              ))}
              <span style={{ color:'#8888aa', fontSize:13 }}>{Object.keys(answers).length}/{questions.length} answered</span>
            </div>

            {error && <div style={s.error}>⚠ {error}</div>}

            <button
              className="nx-btn"
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              style={{ padding:'14px 40px', fontSize:15, marginTop:8 }}
            >
              {submitting ? 'Submitting…' : 'Submit Quiz →'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:720, margin:'0 auto', padding:'28px 24px' },
  back: { background:'none', border:'none', color:'#8888aa', cursor:'pointer', fontSize:14, marginBottom:20, padding:0 },
  empty: { color:'#8888aa', textAlign:'center', padding:'60px 0' },
  title: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:26, color:'#e8e8f0', marginBottom:6 },
  sub: { color:'#8888aa', fontSize:14, marginBottom:28 },
  questions: { display:'flex', flexDirection:'column', gap:16, marginBottom:24 },
  questionCard: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, padding:'20px 22px' },
  qNum: { fontSize:11, fontWeight:700, color:'#6c63ff', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 },
  qText: { fontSize:16, color:'#e8e8f0', fontWeight:600, marginBottom:16, lineHeight:1.5 },
  options: { display:'flex', flexDirection:'column', gap:8 },
  option: { display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderRadius:10, border:'1.5px solid #1a1a35', background:'transparent', color:'#c8c8e0', fontSize:14, cursor:'pointer', transition:'all 0.15s', textAlign:'left' },
  optionSelected: { border:'1.5px solid #6c63ff', background:'rgba(108,99,255,0.12)', color:'#e8e8f0' },
  optionLetter: { width:22, height:22, borderRadius:6, background:'#0f0f22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#8888aa', flexShrink:0 },
  progress: { display:'flex', alignItems:'center', gap:8, marginBottom:16 },
  progressDot: { width:10, height:10, borderRadius:'50%', transition:'background 0.2s' },
  error: { padding:'10px 14px', background:'rgba(255,92,122,0.1)', border:'1px solid rgba(255,92,122,0.25)', borderRadius:8, color:'#ff5c7a', fontSize:13, marginBottom:12 },
  resultCard: { textAlign:'center', padding:'48px 0' },
  resultIcon: { fontSize:56, marginBottom:16 },
  resultTitle: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:28, marginBottom:16 },
  resultScore: { display:'flex', alignItems:'flex-end', justifyContent:'center', gap:4, marginBottom:10 },
  resultMeta: { color:'#8888aa', fontSize:14, marginBottom:16 },
  resultMsg: { color:'#c8c8e0', fontSize:15, maxWidth:480, margin:'0 auto 28px', lineHeight:1.6 },
  resultActions: { display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' },
};
