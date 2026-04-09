import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Navbar from '../components/Navbar';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import * as fabric from 'fabric';
import { v4 as uuidv4 } from 'uuid';

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
  const [activeTab, setActiveTab] = useState('chat'); // chat, code, whiteboard
  const [code, setCode] = useState('// Welcome to collaborative coding!\n// Write your code here...\n\nconsole.log("Hello, World!");');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeOutput, setCodeOutput] = useState('');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  // Refs
  const socketRef = useRef(null);
  const chatRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  useEffect(() => {
    API.get('/users/me').then(r => setProfile(r.data)).catch(() => {});
    fetchSession();

    socketRef.current = io();
    socketRef.current.emit('join-session', sessionId);

    // Chat events
    socketRef.current.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Code collaboration events
    socketRef.current.on('code-update', ({ code: newCode, language }) => {
      setCode(newCode);
      setCodeLanguage(language);
    });

    // Whiteboard events
    socketRef.current.on('whiteboard-update', (data) => {
      if (fabricCanvasRef.current && data) {
        fabricCanvasRef.current.loadFromJSON(data, () => {
          fabricCanvasRef.current.renderAll();
        });
      }
    });

    // WebRTC events
    socketRef.current.on('webrtc-offer', handleOffer);
    socketRef.current.on('webrtc-answer', handleAnswer);
    socketRef.current.on('webrtc-ice', handleIceCandidate);

    return () => {
      socketRef.current?.disconnect();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Initialize whiteboard (once only, not on tab change)
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      canvasRef.current.width = 800;
      canvasRef.current.height = 600;
      canvasRef.current.style.width = '100%';
      canvasRef.current.style.height = '100%';

      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: 800,
        height: 600,
        backgroundColor: '#0f0f22',
        freeDrawingBrush: new fabric.PencilBrush(canvasRef.current),
      });
      fabricCanvasRef.current.freeDrawingBrush.color = '#e8e8f0';
      fabricCanvasRef.current.freeDrawingBrush.width = 3;
      fabricCanvasRef.current.setDimensions({ width: 800, height: 600 });
      fabricCanvasRef.current.renderAll();

      fabricCanvasRef.current.on('path:created', () => {
        const json = fabricCanvasRef.current.toJSON();
        socketRef.current?.emit('whiteboard-update', { sessionId, data: json });
      });

      fabricCanvasRef.current.on('object:added', () => {
        const json = fabricCanvasRef.current.toJSON();
        socketRef.current?.emit('whiteboard-update', { sessionId, data: json });
      });

      fabricCanvasRef.current.on('object:modified', () => {
        const json = fabricCanvasRef.current.toJSON();
        socketRef.current?.emit('whiteboard-update', { sessionId, data: json });
      });
    }
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await API.get(`/sessions/${sessionId}`);
      setSession(res.data);
      setMessages(res.data.messages || []);
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

  // WebRTC functions
  const startVideoCall = async () => {
    try {
      setIsVideoCall(true);
      // Video elements will be rendered after state update
    } catch (err) {
      console.error('Error starting video call:', err);
      alert('Could not start video call');
    }
  };

  // Handle video setup after video elements are rendered
  useEffect(() => {
    if (isVideoCall && !peerConnectionRef.current) {
      initializeVideoCall();
    }
  }, [isVideoCall]);

  const initializeVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Ensure audio is enabled by default
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        setIsAudioMuted(false);
      }
      
      // Wait for refs to be available
      const checkRefs = () => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          
          peerConnectionRef.current = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });

          stream.getTracks().forEach(track => {
            peerConnectionRef.current.addTrack(track, stream);
          });

          peerConnectionRef.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
          };

          peerConnectionRef.current.onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current?.emit('webrtc-ice', { sessionId, candidate: event.candidate });
            }
          };

          // Create and send offer
          peerConnectionRef.current.createOffer()
            .then(offer => peerConnectionRef.current.setLocalDescription(offer))
            .then(() => {
              socketRef.current?.emit('webrtc-offer', { sessionId, offer: peerConnectionRef.current.localDescription });
            })
            .catch(err => console.error('Error creating offer:', err));
        } else {
          // Retry after a short delay
          setTimeout(checkRefs, 100);
        }
      };
      
      checkRefs();
    } catch (err) {
      console.error('Error initializing video call:', err);
      alert('Could not access camera/microphone');
      setIsVideoCall(false);
    }
  };

  const handleOffer = async (offer) => {
    try {
      // Automatically enable video mode if receiving an offer
      if (!isVideoCall) {
        setIsVideoCall(true);
        // Retry after brief delay for video elements to render
        setTimeout(() => handleOffer(offer), 150);
        return;
      }

      // Already has a peer connection from initiating the call
      if (peerConnectionRef.current) {
        return;
      }

      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('webrtc-ice', { sessionId, candidate: event.candidate });
        }
      };

      // Set remote description first
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Get local media before creating answer
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Ensure audio is enabled by default
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        setIsAudioMuted(false);
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add all tracks to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Flush any queued ICE candidates now that remote description is set
      await flushPendingIceCandidates();

      // Create answer after setting up media
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socketRef.current?.emit('webrtc-answer', { sessionId, answer: peerConnectionRef.current.localDescription });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  const flushPendingIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    const queued = pendingIceCandidatesRef.current.splice(0);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.error('Error flushing queued ICE candidate:', err);
      }
    }
  };

  const handleAnswer = async (answer) => {
    try {
      if (!peerConnectionRef.current) {
        console.warn('Received answer but no peer connection');
        return;
      }
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      await flushPendingIceCandidates();
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };

  const handleIceCandidate = async (candidate) => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }
      await pc.addIceCandidate(candidate);
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  };

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const endVideoCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsVideoCall(false);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
  };

  // Code editor functions
  const handleCodeChange = (value) => {
    setCode(value);
    socketRef.current?.emit('code-update', { sessionId, code: value, language: codeLanguage });
  };

  const runCode = async () => {
    try {
      if (codeLanguage === 'javascript') {
        let output = '';
        const originalLog = console.log;
        console.log = (...args) => {
          output += args.map(arg => String(arg)).join(' ') + '\n';
          originalLog(...args);
        };

        try {
          const result = eval(code);
          if (result !== undefined && result !== null) {
            output += String(result);
          }
        } finally {
          console.log = originalLog;
        }

        setCodeOutput(output.trim() || 'No output');
      } else {
        setCodeOutput('Code execution for ' + codeLanguage + ' requires backend integration');
      }
    } catch (err) {
      setCodeOutput('Error: ' + err.message);
    }
  };

  const changeLanguage = (lang) => {
    setCodeLanguage(lang);
    socketRef.current?.emit('code-update', { sessionId, code, language: lang });
  };

  // Whiteboard functions
  const clearWhiteboard = () => {
    fabricCanvasRef.current.clear();
    socketRef.current?.emit('whiteboard-update', { sessionId, data: fabricCanvasRef.current.toJSON() });
  };

  const addText = () => {
    const text = new fabric.IText('Click to edit', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: '#ffffff',
    });
    fabricCanvasRef.current.add(text);
  };

  const addShape = (shape) => {
    let obj;
    switch (shape) {
      case 'circle':
        obj = new fabric.Circle({
          radius: 50,
          fill: '#6c63ff',
          left: 100,
          top: 100,
        });
        break;
      case 'rectangle':
        obj = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 80,
          fill: '#22c97e',
        });
        break;
      default:
        return;
    }
    fabricCanvasRef.current.add(obj);
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
            {session?.status === 'active' && !isVideoCall && (
              <button className="nx-btn" onClick={startVideoCall} style={{ background:'#f5c842', color:'#000', fontSize:13, padding:'8px 20px' }}>📹 Start Video Call</button>
            )}
          </div>
        </div>

        {/* Video Call Interface */}
        {isVideoCall && (
          <div style={s.videoContainer}>
            <div style={s.videoGrid}>
              <div style={s.videoWrapper}>
                <video ref={localVideoRef} autoPlay muted style={s.video} />
                <div style={s.videoLabel}>You</div>
              </div>
              <div style={s.videoWrapper}>
                <video ref={remoteVideoRef} autoPlay playsInline style={s.video} />
                <div style={s.videoLabel}>{other?.name}</div>
              </div>
            </div>
            <div style={s.videoControls}>
              <button onClick={toggleAudio} style={{ ...s.controlBtn, background: isAudioMuted ? '#ff5c7a' : '#22c97e' }}>
                {isAudioMuted ? '🔇' : '🎤'}
              </button>
              <button onClick={toggleVideo} style={{ ...s.controlBtn, background: isVideoMuted ? '#ff5c7a' : '#22c97e' }}>
                {isVideoMuted ? '📷' : '📹'}
              </button>
              <button onClick={endVideoCall} style={{ ...s.controlBtn, background:'#ff5c7a' }}>📞 End Call</button>
            </div>
          </div>
        )}

        {/* Status banner */}
        {session && (
          <div style={{ ...s.statusBanner, ...(session.status === 'active' ? s.statusActive : session.status === 'completed' ? s.statusDone : s.statusPending) }}>
            {session.status === 'pending' && '⏳ Waiting for mentor to start the session…'}
            {session.status === 'active' && '🟢 Session is live! Start learning.'}
            {session.status === 'completed' && '✅ Session ended. ' + (isLearner && session.quizScore === undefined ? 'Take the quiz to verify your learning!' : `Quiz score: ${session.quizScore ?? 'Not taken'}%`)}
          </div>
        )}

        <div style={s.workspace}>
          {/* Main Content Area */}
          <div style={s.mainPanel}>
            {/* Tab Navigation */}
            <div style={s.tabs}>
              <button
                style={{ ...s.tab, ...(activeTab === 'chat' ? s.tabActive : {}) }}
                onClick={() => setActiveTab('chat')}
              >
                💬 Chat
              </button>
              <button
                style={{ ...s.tab, ...(activeTab === 'code' ? s.tabActive : {}) }}
                onClick={() => setActiveTab('code')}
              >
                💻 Code Editor
              </button>
              <button
                style={{ ...s.tab, ...(activeTab === 'whiteboard' ? s.tabActive : {}) }}
                onClick={() => setActiveTab('whiteboard')}
              >
                🎨 Whiteboard
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'chat' && (
              <div style={s.tabContent}>
                <div style={s.panelTitle}>💬 Live Chat</div>
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
            )}

            {activeTab === 'code' && (
              <div style={s.tabContent}>
                <div style={s.codeHeader}>
                  <div style={s.panelTitle}>💻 Collaborative Code Editor</div>
                  <div style={s.codeControls}>
                    <select
                      value={codeLanguage}
                      onChange={e => changeLanguage(e.target.value)}
                      style={s.languageSelect}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="csharp">C#</option>
                      <option value="php">PHP</option>
                      <option value="ruby">Ruby</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="typescript">TypeScript</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="sql">SQL</option>
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                      <option value="yaml">YAML</option>
                    </select>
                    <button className="nx-btn" onClick={runCode} style={{ fontSize:12, padding:'6px 12px' }}>▶ Run Code</button>
                  </div>
                </div>
                <div style={s.codeEditor}>
                  <Editor
                    height="400px"
                    language={codeLanguage}
                    value={code}
                    onChange={handleCodeChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
                {codeOutput && (
                  <div style={s.codeOutput}>
                    <div style={s.outputHeader}>Output:</div>
                    <pre style={s.outputText}>{codeOutput}</pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'whiteboard' && (
              <div style={s.tabContent}>
                <div style={s.whiteboardHeader}>
                  <div style={s.panelTitle}>🎨 Interactive Whiteboard</div>
                  <div style={s.whiteboardControls}>
                    <button className="nx-btn-ghost" onClick={addText} style={{ fontSize:12, padding:'6px 12px' }}>📝 Add Text</button>
                    <button className="nx-btn-ghost" onClick={() => addShape('circle')} style={{ fontSize:12, padding:'6px 12px' }}>⭕ Circle</button>
                    <button className="nx-btn-ghost" onClick={() => addShape('rectangle')} style={{ fontSize:12, padding:'6px 12px' }}>▭ Rectangle</button>
                    <button className="nx-btn-ghost" onClick={clearWhiteboard} style={{ fontSize:12, padding:'6px 12px', borderColor:'rgba(255,92,122,0.3)', color:'#ff5c7a' }}>🗑️ Clear</button>
                  </div>
                </div>
                <div style={s.whiteboardContainer}>
                  <canvas ref={canvasRef} style={s.whiteboardCanvas} />
                </div>
                <div style={s.whiteboardHint}>
                  💡 Use your mouse to draw, click buttons to add shapes, or double-click text to edit
                </div>
              </div>
            )}
          </div>

          {/* Notes Panel */}
          <div style={s.notesPanel}>
            <div style={s.panelTitle}>📝 Session Notes</div>
            <textarea
              style={s.notes}
              placeholder="Take notes here during your session…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#05050f' },
  content: { maxWidth:1400, margin:'0 auto', padding:'20px 24px' },
  header: { display:'flex', alignItems:'center', gap:16, marginBottom:16, flexWrap:'wrap' },
  back: { background:'none', border:'none', color:'#8888aa', cursor:'pointer', fontSize:13, padding:0, flexShrink:0 },
  headerInfo: { flex:1 },
  sessionTitle: { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#e8e8f0' },
  sessionWith: { color:'#8888aa', fontSize:13 },
  headerActions: { display:'flex', gap:8, flexWrap:'wrap' },
  statusBanner: { padding:'11px 18px', borderRadius:10, fontSize:14, marginBottom:18, border:'1.5px solid' },
  statusPending: { background:'rgba(245,200,66,0.08)', borderColor:'rgba(245,200,66,0.25)', color:'#f5c842' },
  statusActive: { background:'rgba(34,201,126,0.08)', borderColor:'rgba(34,201,126,0.25)', color:'#22c97e' },
  statusDone: { background:'rgba(108,99,255,0.08)', borderColor:'rgba(108,99,255,0.25)', color:'#8b83ff' },

  // Video Call Styles
  videoContainer: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, padding:16, marginBottom:18 },
  videoGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 },
  videoWrapper: { position:'relative', borderRadius:8, overflow:'hidden', background:'#000' },
  video: { width:'100%', height:200, objectFit:'cover' },
  videoLabel: { position:'absolute', bottom:8, left:8, background:'rgba(0,0,0,0.7)', color:'#fff', padding:'4px 8px', borderRadius:4, fontSize:12 },
  videoControls: { display:'flex', gap:12, justifyContent:'center' },
  controlBtn: { padding:'10px 16px', border:'none', borderRadius:8, color:'#fff', cursor:'pointer', fontSize:14, transition:'all 0.2s' },

  // Workspace Layout
  workspace: { display:'grid', gridTemplateColumns:'1fr 320px', gap:16, height:'calc(100vh - 280px)' },

  // Main Panel with Tabs
  mainPanel: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, display:'flex', flexDirection:'column' },
  tabs: { display:'flex', borderBottom:'1px solid #1a1a35' },
  tab: { flex:1, padding:'12px 16px', background:'transparent', borderTop:'0', borderRight:'0', borderLeft:'0', borderBottom:'0', color:'#8888aa', cursor:'pointer', fontSize:13, transition:'all 0.2s' },
  tabActive: { background:'rgba(108,99,255,0.1)', color:'#8b83ff', borderBottom:'2px solid #6c63ff' },
  tabContent: { flex:1, display:'flex', flexDirection:'column', padding:16 },

  // Chat Styles
  panelTitle: { fontWeight:700, fontSize:13, color:'#8888aa', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 },
  chatMessages: { flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:12 },
  emptyChat: { color:'#555570', textAlign:'center', padding:'20px 0', fontSize:13 },
  msgRow: { display:'flex' },
  bubble: { maxWidth:'80%', padding:'9px 13px', borderRadius:12, fontSize:14, lineHeight:1.5 },
  bubbleMine: { background:'#6c63ff', color:'#fff', borderBottomRightRadius:4 },
  bubbleOther: { background:'#0f0f22', color:'#e8e8f0', borderBottomLeftRadius:4, border:'1px solid #1a1a35' },
  msgSender: { fontSize:11, color:'#8888aa', marginBottom:3, fontWeight:600 },
  chatInput: { display:'flex', gap:8 },

  // Code Editor Styles
  codeHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  codeControls: { display:'flex', gap:8, alignItems:'center' },
  languageSelect: { padding:'6px 10px', borderRadius:6, border:'1px solid #1a1a35', background:'#0f0f22', color:'#e8e8f0', fontSize:12 },
  codeEditor: { border:'1px solid #1a1a35', borderRadius:8, overflow:'hidden', marginBottom:12 },
  codeOutput: { background:'#0f0f22', border:'1px solid #1a1a35', borderRadius:8, padding:12 },
  outputHeader: { fontWeight:700, color:'#8888aa', fontSize:12, marginBottom:8, textTransform:'uppercase' },
  outputText: { color:'#e8e8f0', fontSize:13, fontFamily:'monospace', whiteSpace:'pre-wrap', margin:0 },

  // Whiteboard Styles
  whiteboardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  whiteboardControls: { display:'flex', gap:6, flexWrap:'wrap' },
  whiteboardContainer: { flex:1, display:'flex', justifyContent:'center', alignItems:'center', background:'#0f0f22', border:'1px solid #1a1a35', borderRadius:8, marginBottom:8 },
  whiteboardCanvas: { borderRadius:6 },
  whiteboardHint: { textAlign:'center', color:'#8888aa', fontSize:12, padding:'8px 0' },

  // Notes Panel
  notesPanel: { background:'#0a0a1a', border:'1.5px solid #1a1a35', borderRadius:14, display:'flex', flexDirection:'column', padding:16 },
  notes: { flex:1, background:'#0f0f22', border:'1px solid #1a1a35', borderRadius:8, color:'#e8e8f0', padding:'14px', fontSize:14, resize:'none', outline:'none', lineHeight:1.6 },
};
