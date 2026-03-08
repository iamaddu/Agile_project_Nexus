require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Socket.io for real-time chat
io.on('connection', (socket) => {
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
  });
  socket.on('send-message', ({ sessionId, message }) => {
    io.to(sessionId).emit('receive-message', message);
  });
  socket.on('webrtc-offer', ({ sessionId, offer }) => {
    socket.to(sessionId).emit('webrtc-offer', offer);
  });
  socket.on('webrtc-answer', ({ sessionId, answer }) => {
    socket.to(sessionId).emit('webrtc-answer', answer);
  });
  socket.on('webrtc-ice', ({ sessionId, candidate }) => {
    socket.to(sessionId).emit('webrtc-ice', candidate);
  });
  socket.on('disconnect', () => {});
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected!');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error('MongoDB error:', err));
