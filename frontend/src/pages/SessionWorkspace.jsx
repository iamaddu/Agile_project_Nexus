import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { io } from 'socket.io-client';

// ─────────────────────────────────────────────────────────────────────────────
// Whiteboard component — shared canvas synced via socket
// ─────────────────────────────────────────────────────────────────────────────
function Whiteboard({ socketRef, sessionId }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });
  const [tool,  setTool]  = useState('pen');
  const [color, setColor] = useState('#6366f1');
  const [size,  setSize]  = useState(3);

  // Init canvas white background + listen for remote draw events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const onDraw = ({ fromX, fromY, toX, toY, color, size, tool }) => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      drawLine(ctx, fromX, fromY, toX, toY, tool === 'eraser' ? '#ffffff' : color, tool === 'eraser' ? 28 : size);
    };
    const onClear = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height); }
    };

    socketRef.current?.on('whiteboard-draw',  onDraw);
    socketRef.current?.on('whiteboard-clear', onClear);
    return () => {
      socketRef.current?.off('whiteboard-draw',  onDraw);
      socketRef.current?.off('whiteboard-clear', onClear);
    };
  }, [socketRef]);

  const drawLine = (ctx, x1, y1, x2, y2, strokeColor, strokeSize) => {
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = strokeSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src    = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scaleX, y: (src.clientY - rect.top) * scaleY };
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getCanvasPos(e);
  };

  const onPointerMove = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const pos    = getCanvasPos(e);
    const ctx    = canvasRef.current.getContext('2d');
    const stroke = tool === 'eraser' ? '#ffffff' : color;
    const width  = tool === 'eraser' ? 28 : size;
    drawLine(ctx, lastPos.current.x, lastPos.current.y, pos.x, pos.y, stroke, width);
    socketRef.current?.emit('whiteboard-draw', {
      sessionId,
      fromX: lastPos.current.x, fromY: lastPos.current.y,
      toX: pos.x, toY: pos.y,
      color, size, tool,
    });
    lastPos.current = pos;
  };

  const onPointerUp = () => { drawing.current = false; };

  const clearBoard = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height); }
    socketRef.current?.emit('whiteboard-clear', { sessionId });
  };

  const COLORS = ['#6366f1','#e11d48','#059669','#d97706','#0284c7','#18181b','#9333ea','#ea580c'];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      {/* Toolbar */}
      <div style={wb.bar}>
        <button style={{ ...wb.toolBtn, ...(tool==='pen'    ? wb.on : {}) }} onClick={() => setTool('pen')}>Pen</button>
        <button style={{ ...wb.toolBtn, ...(tool==='eraser' ? wb.on : {}) }} onClick={() => setTool('eraser')}>Eraser</button>
        <div style={wb.sep}/>
        {COLORS.map(c => (
          <button key={c} onClick={() => { setTool('pen'); setColor(c); }}
            style={{ ...wb.dot, background:c, outline: color===c && tool==='pen' ? '2.5px solid #6366f1' : 'none', outlineOffset:2 }}/>
        ))}
        <div style={wb.sep}/>
        {[2,4,8,14].map(s => (
          <button key={s} style={{ ...wb.sizeBtn, ...(size===s ? wb.on:{}) }} onClick={() => setSize(s)}>
            {s===2?'XS':s===4?'S':s===8?'M':'L'}
          </button>
        ))}
        <div style={wb.sep}/>
        <button style={{ ...wb.toolBtn, color:'var(--rose)', borderColor:'var(--rose-bd)' }} onClick={clearBoard}>Clear</button>
      </div>
      <canvas
        ref={canvasRef}
        width={1400} height={900}
        style={{ flex:1, width:'100%', display:'block', cursor: tool==='eraser' ? 'cell' : 'crosshair', background:'white', touchAction:'none' }}
        onMouseDown={onPointerDown}  onMouseMove={onPointerMove}  onMouseUp={onPointerUp}  onMouseLeave={onPointerUp}
        onTouchStart={onPointerDown} onTouchMove={onPointerMove}  onTouchEnd={onPointerUp}
      />
    </div>
  );
}

const wb = {
  bar:     { display:'flex', alignItems:'center', gap:5, padding:'8px 12px', background:'var(--n-50)', borderBottom:'1px solid var(--border)', flexShrink:0, flexWrap:'wrap' },
  toolBtn: { padding:'4px 11px', borderRadius:6, border:'1px solid var(--border)', background:'white', color:'var(--n-600)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--f)' },
  on:      { background:'var(--brand-soft)', borderColor:'var(--brand-border)', color:'var(--brand-text)' },
  dot:     { width:18, height:18, borderRadius:'50%', border:'none', cursor:'pointer', flexShrink:0, padding:0 },
  sep:     { width:1, height:20, background:'var(--border)', margin:'0 2px' },
  sizeBtn: { padding:'4px 8px', borderRadius:6, border:'1px solid var(--border)', background:'white', color:'var(--n-600)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--f)' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Code Editor — monospace textarea with run functionality
// ─────────────────────────────────────────────────────────────────────────────
function CodeEditor({ code, onChange }) {
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  const runCode = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setOutput('Running...');
    try {
      const response = await API.post('/code/run', { language, code });
      setOutput(response.data.output || response.data.error || 'No output');
    } catch (error) {
      setOutput('Error: ' + (error.response?.data?.error || error.message));
    }
    setRunning(false);
  };

  const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
  ];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
      <div style={ce.bar}>
        <span style={ce.label}>Code Editor</span>
        <select value={language} onChange={e => setLanguage(e.target.value)} style={ce.langSelect}>
          {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <button style={ce.runBtn} onClick={runCode} disabled={running}>
          {running ? 'Running...' : 'Run Code'}
        </button>
        <button style={ce.copyBtn} onClick={() => { navigator.clipboard.writeText(code); }}>Copy</button>
      </div>
      <textarea
        value={code}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const s = e.target.selectionStart;
            const n = code.substring(0, s) + '  ' + code.substring(e.target.selectionEnd);
            onChange(n);
            setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 2; }, 0);
          }
        }}
        spellCheck={false}
        style={ce.area}
        placeholder={`// Write code here — share it with the other person via chat\n// Both mentor and learner can write and read code here\n\nfunction example() {\n  console.log("Hello, Nexus!");\n}`}
      />
      <div style={ce.outputBar}>
        <span style={ce.outputLabel}>Output</span>
      </div>
      <pre style={ce.outputArea}>{output}</pre>
    </div>
  );
}
const ce = {
  bar:        { display:'flex', alignItems:'center', gap:8, padding:'7px 14px', background:'#1e1e2e', borderBottom:'1px solid #313244', flexShrink:0 },
  label:      { fontSize:11, fontWeight:700, color:'#cdd6f4', letterSpacing:'.06em', textTransform:'uppercase' },
  langSelect: { fontSize:11, padding:'2px 6px', borderRadius:4, background:'#313244', border:'1px solid #45475a', color:'#cdd6f4', cursor:'pointer', fontFamily:'var(--f)' },
  runBtn:     { fontSize:11, padding:'2px 9px', borderRadius:4, background:'#89b4fa', border:'1px solid #45475a', color:'#1e1e2e', cursor:'pointer', fontFamily:'var(--f)', fontWeight:600 },
  copyBtn:    { fontSize:11, padding:'2px 9px', borderRadius:4, background:'#313244', border:'1px solid #45475a', color:'#cdd6f4', cursor:'pointer', fontFamily:'var(--f)' },
  area:       { flex:1, background:'#1e1e2e', color:'#cdd6f4', border:'none', outline:'none', resize:'none', fontFamily:'"Fira Code","Cascadia Code","Consolas",monospace', fontSize:13, lineHeight:1.65, padding:'14px 16px', minHeight:0, tabSize:2 },
  outputBar:  { display:'flex', alignItems:'center', padding:'7px 14px', background:'#1e1e2e', borderTop:'1px solid #313244', borderBottom:'1px solid #313244', flexShrink:0 },
  outputLabel:{ fontSize:11, fontWeight:700, color:'#cdd6f4', letterSpacing:'.06em', textTransform:'uppercase' },
  outputArea: { flex:1, background:'#1e1e2e', color:'#cdd6f4', border:'none', outline:'none', resize:'none', fontFamily:'"Fira Code","Cascadia Code","Consolas",monospace', fontSize:13, lineHeight:1.65, padding:'14px 16px', minHeight:0, whiteSpace:'pre-wrap', overflow:'auto' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main SessionWorkspace
// ─────────────────────────────────────────────────────────────────────────────
export default function SessionWorkspace() {
  const { sessionId } = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  const [profile,    setProfile]    = useState(null);
  const [session,    setSession]    = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [newMsg,     setNewMsg]     = useState('');
  const [notes,      setNotes]      = useState('');
  const [code,       setCode]       = useState('');
  const [activeTab,  setActiveTab]  = useState('notes'); // 'notes' | 'code' | 'board'
  const [ending,     setEnding]     = useState(false);

  // Video call state
  const [callStatus, setCallStatus] = useState('idle'); // idle | ringing | connecting | connected | ended
  const [micOn,      setMicOn]      = useState(true);
  const [camOn,      setCamOn]      = useState(true);

  const socketRef      = useRef(null);
  const chatRef        = useRef(null);
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef        = useRef(null);
  const localStream    = useRef(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    fetchSession();

    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.emit('join-session', sessionId);
    socket.on('receive-message', msg => setMessages(p => [...p, msg]));

    // Remote peer started a call — auto-answer
    socket.on('webrtc-offer', async ({ offer }) => {
      setCallStatus('connecting');
      try {
        const pc = await createPeer();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc-answer', { sessionId, answer });
      } catch (err) {
        console.error('Answer failed:', err);
        setCallStatus('idle');
      }
    });

    socket.on('webrtc-answer', async ({ answer }) => {
      try { await peerRef.current?.setRemoteDescription(new RTCSessionDescription(answer)); }
      catch (err) { console.error('Set answer failed:', err); }
    });

    socket.on('webrtc-ice', async ({ candidate }) => {
      try { if (candidate) await peerRef.current?.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch {}
    });

    socket.on('webrtc-hangup', () => {
      cleanupCall();
      setCallStatus('ended');
    });

    return () => {
      cleanupCall();
      socket.disconnect();
    };
  }, [sessionId]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const fetchSession = async () => {
    try {
      const r = await API.get(`/sessions/${sessionId}`);
      setSession(r.data);
      setMessages(r.data.messages || []);
    } catch {}
  };

  // ── WebRTC helpers ────────────────────────────────────────────────────────
  const createPeer = useCallback(async () => {
    // Get local media
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true; // avoid echo
    }

    // Create peer connection with Google STUN
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });
    peerRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Show remote stream when tracks arrive
    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
      setCallStatus('connected');
    };

    // Send ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('webrtc-ice', { sessionId, candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanupCall();
        setCallStatus('ended');
      }
    };

    return pc;
  }, [sessionId]);

  const startCall = async () => {
    try {
      setCallStatus('connecting');
      const pc = await createPeer();
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('webrtc-offer', { sessionId, offer });
    } catch (err) {
      alert('Could not access camera/microphone.\n\n' + err.message + '\n\nMake sure you have allowed camera and mic access in the browser.');
      setCallStatus('idle');
    }
  };

  const hangUp = () => {
    socketRef.current?.emit('webrtc-hangup', { sessionId });
    cleanupCall();
    setCallStatus('idle');
  };

  const cleanupCall = () => {
    localStream.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();
    peerRef.current   = null;
    localStream.current = null;
    if (localVideoRef.current)  localVideoRef.current.srcObject  = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setMicOn(true);
    setCamOn(true);
  };

  const toggleMic = () => {
    const track = localStream.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };

  const toggleCam = () => {
    const track = localStream.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };

  // ── Session controls ──────────────────────────────────────────────────────
  const handleStart = async () => {
    try { await API.patch(`/sessions/${sessionId}/start`); fetchSession(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to start session'); }
  };

  const handleEnd = async () => {
    if (!window.confirm('End the session now?\n\nTokens will be released to you immediately.')) return;
    setEnding(true);
    if (callStatus === 'connected') hangUp();
    try { await API.patch(`/sessions/${sessionId}/end`); fetchSession(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to end session'); }
    setEnding(false);
  };

  const sendMsg = () => {
    if (!newMsg.trim()) return;
    const msg = { sender: user?.id, senderName: user?.name, text: newMsg.trim(), timestamp: new Date() };
    socketRef.current?.emit('send-message', { sessionId, message: msg });
    setMessages(p => [...p, msg]);
    setNewMsg('');
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isMentor  = session?.mentor?._id  === user?.id || session?.mentor?.toString()  === user?.id;
  const isLearner = session?.learner?._id === user?.id || session?.learner?.toString() === user?.id;
  const other     = isMentor ? session?.learner : session?.mentor;
  const inCall    = callStatus === 'connected' || callStatus === 'connecting';

  const STATUS = {
    pending:   { text: 'Waiting for mentor to start the session', color:'var(--amber)',   bg:'var(--amber-bg)',  bd:'var(--amber-bd)' },
    active:    { text: 'Session is live',                         color:'var(--emerald)', bg:'var(--emerald-bg)',bd:'var(--emerald-bd)' },
    completed: { text: 'Session ended' + (isLearner && !session?.quizScore ? ' — take the quiz to earn your certificate' : ''),
                 color:'var(--brand)', bg:'var(--brand-soft)', bd:'var(--brand-border)' },
  };
  const si = session ? (STATUS[session.status] || STATUS.pending) : null;

  const TABS = [
    { id:'notes', label:'Notes' },
    { id:'code',  label:'Code Editor' },
    { id:'board', label:'Whiteboard' },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)', overflow:'hidden' }}>
      <Navbar profile={profile} />

      {/* ── Top control bar ── */}
      <div style={S.topBar}>
        <button style={S.backBtn} onClick={() => navigate('/my-sessions')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Sessions
        </button>

        {session && (
          <div style={S.titleArea}>
            <span style={S.sessionSkill}>{session.skill}</span>
            <span style={S.sessionWith}>with {other?.name}</span>
          </div>
        )}

        <div style={S.controls}>
          {/* ── Video call controls ── */}
          {session?.status === 'active' && (
            <>
              {!inCall ? (
                <button className="nx-btn" onClick={startCall}
                  style={{ background:'var(--emerald)', border:'none', boxShadow:'0 1px 6px rgba(5,150,105,.35)', fontSize:13, padding:'7px 16px', gap:7 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  Join Video Call
                </button>
              ) : (
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <div style={S.callBadge}>
                    <div style={S.callDot}/>
                    {callStatus === 'connecting' ? 'Connecting…' : 'Live call'}
                  </div>
                  <button onClick={toggleMic}
                    style={{ ...S.callCtrl, background: micOn ? 'var(--n-100)' : 'var(--rose-bg)', borderColor: micOn ? 'var(--border)' : 'var(--rose-bd)', color: micOn ? 'var(--n-600)' : 'var(--rose)' }}>
                    {micOn ? 'Mic On' : 'Mic Off'}
                  </button>
                  <button onClick={toggleCam}
                    style={{ ...S.callCtrl, background: camOn ? 'var(--n-100)' : 'var(--amber-bg)', borderColor: camOn ? 'var(--border)' : 'var(--amber-bd)', color: camOn ? 'var(--n-600)' : 'var(--amber)' }}>
                    {camOn ? 'Cam On' : 'Cam Off'}
                  </button>
                  <button onClick={hangUp}
                    style={{ ...S.callCtrl, background:'var(--rose-bg)', borderColor:'var(--rose-bd)', color:'var(--rose)' }}>
                    End Call
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Session controls ── */}
          {isMentor && session?.status === 'pending' && (
            <button className="nx-btn" onClick={handleStart}
              style={{ background:'var(--emerald)', border:'none', boxShadow:'none', fontSize:13, padding:'7px 18px' }}>
              Start Session
            </button>
          )}
          {isMentor && session?.status === 'active' && (
            <button className="nx-btn" onClick={handleEnd} disabled={ending}
              style={{ background:'var(--rose)', border:'none', boxShadow:'none', fontSize:13, padding:'7px 18px' }}>
              {ending ? 'Ending…' : 'End Session'}
            </button>
          )}
          {isLearner && session?.status === 'completed' && !session?.quizScore && (
            <button className="nx-btn" onClick={() => navigate(`/quiz/${sessionId}`)}
              style={{ background:'var(--emerald)', border:'none', fontSize:13, padding:'7px 18px' }}>
              Take Quiz
            </button>
          )}
          {isLearner && session?.certificateIssued && (
            <button className="nx-btn-outline" onClick={() => navigate(`/certificate/${sessionId}`)}
              style={{ fontSize:13, padding:'7px 14px' }}>
              View Certificate
            </button>
          )}
        </div>
      </div>

      {/* ── Status bar ── */}
      {si && (
        <div style={{ ...S.statusBar, background:si.bg, borderColor:si.bd, color:si.color }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:si.color, flexShrink:0, display:'inline-block' }}/>
          {si.text}
          {callStatus === 'connected' && (
            <span style={{ marginLeft:'auto', fontSize:12, color:'var(--emerald)', fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--emerald)', animation:'pulse 1.5s infinite', display:'inline-block' }}/>
              Video call active
            </span>
          )}
        </div>
      )}

      {/* ── Main body ── */}
      <div style={S.body}>

        {/* ── Left panel — video + tabbed workspace ── */}
        <div style={S.leftPanel}>

          {/* Video panels — shown only when in call */}
          {inCall && (
            <div style={S.videoStrip}>
              {/* Remote peer (big) */}
              <div style={S.videoBoxMain}>
                <video ref={remoteVideoRef} autoPlay playsInline style={S.video}/>
                <div style={S.videoName}>{other?.name}</div>
                {callStatus === 'connecting' && (
                  <div style={S.videoOverlay}>
                    <div style={{ width:28, height:28, border:'3px solid rgba(255,255,255,.3)', borderTop:'3px solid white', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
                    <span style={{ color:'white', fontSize:13 }}>Connecting…</span>
                  </div>
                )}
              </div>
              {/* Self preview (small, bottom-right) */}
              <div style={S.videoBoxSelf}>
                <video ref={localVideoRef} autoPlay playsInline muted style={S.video}/>
                <div style={S.videoName}>You</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={S.tabBar}>
            {TABS.map(t => (
              <button key={t.id} style={{ ...S.tab, ...(activeTab===t.id ? S.tabOn : {}) }} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={S.tabContent}>
            {activeTab === 'notes' && (
              <textarea
                style={S.notesArea}
                placeholder={`Take notes during your session...\n\nThese notes are private — only you can see them.`}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            )}
            {activeTab === 'code' && (
              <CodeEditor code={code} onChange={setCode} />
            )}
            {activeTab === 'board' && (
              <Whiteboard socketRef={socketRef} sessionId={sessionId} />
            )}
          </div>
        </div>

        {/* ── Right panel — chat ── */}
        <div style={S.chatPanel}>
          <div style={S.chatHead}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat
          </div>

          <div style={S.chatBody} ref={chatRef}>
            {messages.length === 0 ? (
              <div style={S.chatEmpty}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--n-300)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                No messages yet
              </div>
            ) : messages.map((m, i) => {
              const mine = m.sender === user?.id || m.senderName === user?.name;
              return (
                <div key={i} style={{ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom:8 }}>
                  <div style={{ ...S.bubble, ...(mine ? S.bubbleMine : S.bubbleOther) }}>
                    {!mine && <div style={S.senderTag}>{m.senderName}</div>}
                    {m.text}
                    <div style={S.msgTime}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={S.chatFooter}>
            <input
              className="nx-input"
              placeholder="Type a message…"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
              style={{ flex:1, fontSize:13 }}
            />
            <button className="nx-btn" onClick={sendMsg} style={{ flexShrink:0, padding:'9px 14px', fontSize:13 }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  topBar:      { display:'flex', alignItems:'center', gap:12, padding:'8px 16px', background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0, flexWrap:'wrap', minHeight:50 },
  backBtn:     { display:'flex', alignItems:'center', gap:5, background:'none', border:'none', color:'var(--n-400)', cursor:'pointer', fontSize:13, fontFamily:'var(--f)', padding:0, flexShrink:0 },
  titleArea:   { display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 },
  sessionSkill:{ fontWeight:800, fontSize:17, color:'var(--n-900)', letterSpacing:'-.01em', flexShrink:0 },
  sessionWith: { fontSize:13, color:'var(--n-400)', flexShrink:0 },
  controls:    { display:'flex', alignItems:'center', gap:8, marginLeft:'auto', flexWrap:'wrap' },
  callBadge:   { display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:'var(--emerald-bg)', border:'1px solid var(--emerald-bd)', color:'var(--emerald)', fontSize:12, fontWeight:600 },
  callDot:     { width:6, height:6, borderRadius:'50%', background:'var(--emerald)', animation:'pulse 1.5s infinite' },
  callCtrl:    { padding:'5px 11px', borderRadius:7, border:'1.5px solid var(--border)', background:'var(--n-100)', color:'var(--n-600)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--f)', transition:'all .15s' },
  statusBar:   { display:'flex', alignItems:'center', gap:8, padding:'7px 16px', fontSize:13, fontWeight:500, borderBottom:'1px solid', flexShrink:0 },
  body:        { flex:1, display:'grid', gridTemplateColumns:'1fr 310px', minHeight:0, overflow:'hidden' },

  leftPanel:   { display:'flex', flexDirection:'column', minHeight:0, borderRight:'1px solid var(--border)' },
  videoStrip:  { display:'flex', gap:6, padding:'8px 10px', background:'#0d0d14', flexShrink:0, position:'relative' },
  videoBoxMain:{ flex:1, position:'relative', background:'#1a1a2e', borderRadius:8, overflow:'hidden', minHeight:180, maxHeight:260 },
  videoBoxSelf:{ width:130, flexShrink:0, position:'relative', background:'#1a1a2e', borderRadius:8, overflow:'hidden' },
  video:       { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  videoName:   { position:'absolute', bottom:6, left:8, fontSize:11, color:'white', fontWeight:600, background:'rgba(0,0,0,.6)', padding:'2px 8px', borderRadius:4 },
  videoOverlay:{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, background:'rgba(0,0,0,.6)' },

  tabBar:      { display:'flex', background:'var(--n-50)', borderBottom:'1px solid var(--border)', flexShrink:0 },
  tab:         { flex:1, padding:'10px 8px', background:'none', border:'none', borderBottom:'2.5px solid transparent', color:'var(--n-400)', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all .15s', fontFamily:'var(--f)' },
  tabOn:       { color:'var(--brand)', borderBottomColor:'var(--brand)', background:'white', fontWeight:700 },
  tabContent:  { flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' },
  notesArea:   { flex:1, border:'none', outline:'none', resize:'none', padding:'16px 18px', fontSize:14, lineHeight:1.75, fontFamily:'var(--f)', color:'var(--n-800)', background:'white' },

  chatPanel:   { display:'flex', flexDirection:'column', background:'var(--surface)', minHeight:0 },
  chatHead:    { display:'flex', alignItems:'center', gap:7, padding:'12px 14px', fontSize:11, fontWeight:700, color:'var(--n-400)', letterSpacing:'.06em', textTransform:'uppercase', borderBottom:'1px solid var(--border)', flexShrink:0 },
  chatBody:    { flex:1, overflowY:'auto', padding:'12px 12px 4px', minHeight:0 },
  chatEmpty:   { display:'flex', flexDirection:'column', alignItems:'center', gap:8, color:'var(--n-300)', fontSize:13, padding:'32px 0', textAlign:'center' },
  bubble:      { maxWidth:'82%', padding:'8px 11px', borderRadius:12, fontSize:14, lineHeight:1.5, wordBreak:'break-word' },
  bubbleMine:  { background:'var(--brand)', color:'white', borderBottomRightRadius:3 },
  bubbleOther: { background:'var(--n-100)', color:'var(--n-800)', borderBottomLeftRadius:3 },
  senderTag:   { fontSize:10, fontWeight:700, color:'var(--n-400)', marginBottom:3 },
  msgTime:     { fontSize:10, opacity:.6, marginTop:3, textAlign:'right' },
  chatFooter:  { display:'flex', gap:7, padding:'10px 10px', borderTop:'1px solid var(--border)', flexShrink:0 },
};
