require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const allowedOrigins = [/^http:\/\/localhost(?::\d+)?$/];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
};

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] }
});

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint for Docker and monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

// Socket.io for real-time features
io.on('connection', (socket) => {
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
  });

  socket.on('send-message', ({ sessionId, message }) => {
    io.to(sessionId).emit('receive-message', message);
  });

  // WebRTC events
  socket.on('webrtc-offer', ({ sessionId, offer }) => {
    socket.to(sessionId).emit('webrtc-offer', offer);
  });
  socket.on('webrtc-answer', ({ sessionId, answer }) => {
    socket.to(sessionId).emit('webrtc-answer', answer);
  });
  socket.on('webrtc-ice', ({ sessionId, candidate }) => {
    socket.to(sessionId).emit('webrtc-ice', candidate);
  });

  // Code collaboration events
  socket.on('code-update', ({ sessionId, code, language }) => {
    socket.to(sessionId).emit('code-update', { code, language });
  });

  // Whiteboard events
  socket.on('whiteboard-update', ({ sessionId, data }) => {
    socket.to(sessionId).emit('whiteboard-update', data);
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
