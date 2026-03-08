import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { io } from 'socket.io-client';

export default function SessionWorkspace() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [notes, setNotes] = useState('');
  const [ending, setEnding] = useState(false);
  const socketRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    fetchSession();

    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join-session', sessionId);
    socketRef.current.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => socketRef.current?.disconnect();
  }, [sessionId]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const fetchSession = async () => {
    try {
      const res = await API.get(`/sessions/${sessionId}`);
      setSession(res.data);
      setMessages(res.data.messages || []);
      // Auto-start if mentor opens pending session
    } catch {}
  };

  const handleStart = async () => {
    try {
      await API.patch(`/sessions/${sessionId}/start`);
      fetchSession();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleEnd = async () => {
    if (!confirm('End session? Tokens will be released to you.')) return;
    setEnding(true);
    try {
      await API.patch(`/sessions/${sessionId}/end`);
      fetchSession();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    setEnding(false);
  };

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    const msg = { sender: user?.id, senderName: user?.name, text: newMsg, timestamp: new Date() };
    socketRef.current?.emit('send-message', { sessionId, message: msg });
    setMessages(prev => [...prev, msg]);
    setNewMsg('');
  };

  const isMentor = session?.mentor?._id === user?.id || session?.mentor?.toString() === user?.id;
  const isLearner = session?.learner?._id === user?.id || session?.learner?.toString() === user?.id;
  const other = isMentor ? session?.learner : session?.mentor;

  return (
    <div style={s.root}>
      <Navbar profile={profile} />
      <div style={s.content}>
        {/* Session header */}
        <div style={s.header}>
          <button onClick={() => navigate('/my-sessions')} style={s.back}>← Sessions</button>
          {session && (
            <div style={s.headerInfo}>
              <div style={s.sessionTitle}>{session.skill} Session</div>
              <div style={s.sessionWith}>with {other?.name}</div>
            </div>
          )}
          <div style={s.headerActions}>
            {isMentor && session?.status === 'pending' && (
              <button className="nx-btn" onClick={handleStart} style={{ background:'#22c97e', fontSize:13, padding:'8px 20px' }}>▶ Start Session</button>
            )}
            {isMentor && session?.status === 'active' && (
              <button className="nx-btn" onClick={handleEnd} disabled={ending} style={{ background:'#ff5c7a', fontSize:13, padding:'8px 20px' }}>
                {ending ? '…' : '⏹ End Session'}
              </button>
            )}
            {isLearner && session?.status === 'completed' && session?.quizScore === undefined && (
              <button className="nx-btn" onClick={() => navigate(`/quiz/${sessionId}`)} style={{ background:'#8b83ff', fontSize:13, padding:'8px 20px' }}>📝 Take Quiz</button>
            )}
          </div>
        </div>

        {/* Status banner */}
        {session && (
          <div style={{ ...s.statusBanner, ...(session.status === 'active' ? s.statusActive : session.status === 'completed' ? s.statusDone : s.statusPending) }}>
            {session.status === 'pending' && '⏳ Waiting for mentor to start the session…'}
            {session.status === 'active' && '🟢 Session is live! Start learning.'}
            {session.status === 'completed' && '✅ Session ended. ' + (isLearner && session.quizScore === undefined ? 'Take the quiz to verify your learning!' : `Quiz score: ${session.quizScore ?? 'Not taken'}%`)}
          </div>
        )}

        <div style={s.workspace}>
          {/* Notes area */}
          <div style={s.notesPanel}>
            <div style={s.panelTitle}>📝 Session Notes</div>
            <textarea
              style={s.notes}
              placeholder="Take notes here during your session…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Chat */}
          <div style={s.chatPanel}>
            <div style={s.panelTitle}>💬 Chat</div>
            <div style={s.chatMessages} ref={chatRef}>
              {messages.length === 0 ? (
                <div style={s.emptyChat}>No messages yet. Say hello!</div>
              ) : messages.map((msg, i) => {
                const mine = msg.sender === user?.id || msg.senderName === user?.name;
                return (
                  <div key={i} style={{ ...s.msgRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ ...s.bubble, ...(mine ? s.bubbleMine : s.bubbleOther) }}>
                      {!mine && <div style={s.msgSender}>{msg.senderName}</div>}
                      <div>{msg.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={s.chatInput}>
              <input
                className="nx-input"
                placeholder="Type a message…"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                style={{ flex:1 }}
              />
              <button className="nx-btn" onClick={sendMessage} style={{ padding:'11px 18px', fontSize:13, flexShrink:0 }}>Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:1100, margin:'0 auto', padding:'20px 24px' },
  header: { display:'flex', alignItems:'center', gap:16, marginBottom:16, flexWrap:'wrap' },
  back: { background:'none', border:'none', color:'#8888aa', cursor:'pointer', fontSize:13, padding:0, flexShrink:0 },
  headerInfo: { flex:1 },
  sessionTitle: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#e8e8f0' },
  sessionWith: { color:'#8888aa', fontSize:13 },
  headerActions: { display:'flex', gap:8 },
  statusBanner: { padding:'11px 18px', borderRadius:10, fontSize:14, marginBottom:18, border:'1.5px solid' },
  statusPending: { background:'rgba(245,200,66,0.08)', borderColor:'rgba(245,200,66,0.25)', color:'#f5c842' },
  statusActive: { background:'rgba(34,201,126,0.08)', borderColor:'rgba(34,201,126,0.25)', color:'#22c97e' },
  statusDone: { background:'rgba(108,99,255,0.08)', borderColor:'rgba(108,99,255,0.25)', color:'#8b83ff' },
  workspace: { display:'grid', gridTemplateColumns:'1fr 380px', gap:16, height:'calc(100vh - 220px)' },
  notesPanel: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, display:'flex', flexDirection:'column', padding:16 },
  chatPanel: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, display:'flex', flexDirection:'column', padding:16 },
  panelTitle: { fontWeight:700, fontSize:13, color:'#8888aa', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 },
  notes: { flex:1, background:'#0f0f22', border:'1px solid #1a1a35', borderRadius:8, color:'#e8e8f0', padding:'14px', fontSize:14, resize:'none', outline:'none', lineHeight:1.6 },
  chatMessages: { flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:12 },
  emptyChat: { color:'#555570', textAlign:'center', padding:'20px 0', fontSize:13 },
  msgRow: { display:'flex' },
  bubble: { maxWidth:'80%', padding:'9px 13px', borderRadius:12, fontSize:14, lineHeight:1.5 },
  bubbleMine: { background:'#6c63ff', color:'#fff', borderBottomRightRadius:4 },
  bubbleOther: { background:'#0f0f22', color:'#e8e8f0', borderBottomLeftRadius:4, border:'1px solid #1a1a35' },
  msgSender: { fontSize:11, color:'#8888aa', marginBottom:3, fontWeight:600 },
  chatInput: { display:'flex', gap:8 },
};
