const request = require('supertest');
const express = require('express');

process.env.JWT_SECRET = 'testsecret';

// Mock the server setup
jest.mock('../models/User', () => ({
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock('../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'test-user-id' };
  next();
});

const app = express();
app.use(express.json());

// Import routes after mocking
const userRoutes = require('../routes/users');
const authRoutes = require('../routes/auth');

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

const User = require('../models/User');

describe('Backend API Tests', () => {
  beforeEach(() => {
    Object.values(User).forEach((fn) => {
      if (fn && fn.mockReset) fn.mockReset();
    });
  });
  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        service: 'backend'
      });
    });
  });

  describe('User Routes', () => {
    test('should get user profile when authenticated', async () => {
      const mockUser = {
        _id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com'
      };

      const User = require('../models/User');
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .get('/api/users/me')
        .expect(200);

      expect(response.body.name).toBe('Test User');
      expect(response.body.email).toBe('test@example.com');
    });

    test('should get mentors list', async () => {
      const mockMentors = [
        { _id: '1', name: 'Mentor 1', isMentor: true },
        { _id: '2', name: 'Mentor 2', isMentor: true }
      ];

      const User = require('../models/User');
      User.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockMentors)
        })
      });

      const response = await request(app)
        .get('/api/users/mentors')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });
  });

  describe('Auth Routes', () => {
    test('should register new user', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123'
      };

      const User = require('../models/User');
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'new-user-id',
        name: 'New User',
        email: 'new@example.com',
        isMentor: false,
        isAdmin: false
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.name).toBe('New User');
      expect(response.body.user.email).toBe('new@example.com');
      expect(response.body.token).toBeDefined();
    });
  });
});