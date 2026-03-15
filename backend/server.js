require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ── Allow ANY localhost port (Vite picks 5173, 5174, 5175 etc.) ──────────────
const ALLOWED_ORIGIN = /^http:\/\/localhost:\d+$/;

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN, methods: ['GET', 'POST'] }
});

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/wallet',        require('./routes/wallet'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/sessions',      require('./routes/sessions'));
app.use('/api/quiz',          require('./routes/quiz'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/code',          require('./routes/code'));

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {

  // Join a session room
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
  });

  // Chat messages
  socket.on('send-message', ({ sessionId, message }) => {
    io.to(sessionId).emit('receive-message', message);
  });

  // WebRTC signalling — relay offer/answer/ice between the two peers
  socket.on('webrtc-offer',  ({ sessionId, offer })     => socket.to(sessionId).emit('webrtc-offer',  { offer }));
  socket.on('webrtc-answer', ({ sessionId, answer })    => socket.to(sessionId).emit('webrtc-answer', { answer }));
  socket.on('webrtc-ice',    ({ sessionId, candidate }) => socket.to(sessionId).emit('webrtc-ice',    { candidate }));
  socket.on('webrtc-hangup', ({ sessionId })            => socket.to(sessionId).emit('webrtc-hangup'));

  // Whiteboard — relay draw strokes and clear events
  socket.on('whiteboard-draw',  ({ sessionId, ...data }) => socket.to(sessionId).emit('whiteboard-draw', data));
  socket.on('whiteboard-clear', ({ sessionId })          => socket.to(sessionId).emit('whiteboard-clear'));

  socket.on('disconnect', () => {});
});

// ── DB + Start ────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected!');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error('MongoDB error:', err));
