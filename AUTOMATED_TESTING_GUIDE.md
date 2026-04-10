# 🔬 Automated Testing Guide for Nexus Cognitive

## Overview
This project now includes comprehensive automated testing for both backend and frontend components. Tests run automatically on every push to GitHub via CI/CD pipeline.

## 🧪 Testing Framework

### Backend Testing
- **Framework**: Jest
- **API Testing**: Supertest
- **Database**: MongoDB Memory Server (in-memory database for tests)
- **Coverage**: HTML and LCOV reports

### Frontend Testing
- **Framework**: Vitest
- **Component Testing**: React Testing Library
- **Environment**: jsdom (simulates browser)
- **Coverage**: HTML and LCOV reports

## 🚀 Running Tests Automatically

### Method 1: Local Test Runner (Recommended)
Run all tests with a single command:

**Windows:**
```bash
# From project root
./run-tests.bat
```

**Linux/Mac:**
```bash
# From project root
chmod +x run-tests.sh
./run-tests.sh
```

### Method 2: Manual Commands

**Backend Tests:**
```bash
cd backend
npm install
npm test
npm run test:coverage
```

**Frontend Tests:**
```bash
cd frontend
npm install
npm test
npm run test:coverage
```

### Method 3: CI/CD Pipeline (Automatic)
Tests run automatically when you push to GitHub:
- Go to **GitHub → Actions** tab
- See workflows running automatically
- Check test results and coverage reports

## 📊 Test Coverage Reports

After running tests, coverage reports are generated:

- **Backend**: `backend/coverage/lcov-report/index.html`
- **Frontend**: `frontend/coverage/lcov-report/index.html`

Open these files in your browser to see detailed coverage reports.

## 🧪 What Tests Cover

### Backend Tests (`backend/tests/api.test.js`)
- ✅ Health check endpoint (`/api/health`)
- ✅ User profile retrieval (`/api/users/me`)
- ✅ Mentors list (`/api/users/mentors`)
- ✅ User registration (`/api/auth/register`)
- ✅ Database connection and cleanup

### Frontend Tests (`frontend/src/test/App.test.tsx`)
- ✅ App component rendering
- ✅ Basic component functionality
- ✅ User interaction handling
- ✅ React Router integration

## 🔧 CI/CD Integration

### GitHub Actions Workflow (`.github/workflows/build-test.yml`)

**Triggers:**
- Push to `main` or `develop` branch
- Pull requests to `main` or `develop`

**Steps:**
1. **Backend Testing:**
   - Install dependencies
   - Run Jest tests with coverage
   - Verify MongoDB connection

2. **Frontend Testing:**
   - Install dependencies
   - Run Vitest tests with coverage
   - Build production bundle

3. **Code Quality:**
   - Security scanning
   - Dockerfile validation
   - Build verification

## 📈 Test Results in CI/CD

### Success Indicators:
```
✅ Backend tests completed successfully!
✅ Frontend tests completed successfully!
✅ Build successful!
✅ Code quality verified!
```

### Coverage Thresholds:
- Backend: Minimum 80% coverage
- Frontend: Minimum 70% coverage

## 🐛 Debugging Failed Tests

### Backend Test Issues:
```bash
cd backend
npm test -- --verbose
```

### Frontend Test Issues:
```bash
cd frontend
npm test -- --reporter=verbose
```

### Check Test Logs:
```bash
# Backend logs
docker-compose logs backend

# Frontend build logs
cd frontend && npm run build
```

## 📋 Test Checklist for Viva

### Local Testing:
- [ ] Run `./run-tests.bat` (Windows) or `./run-tests.sh` (Linux/Mac)
- [ ] All tests pass (exit code 0)
- [ ] Coverage reports generated
- [ ] No console errors

### CI/CD Testing:
- [ ] Push code to GitHub
- [ ] Go to Actions tab
- [ ] See "Build & Test" workflow running
- [ ] All jobs pass (green checkmarks)
- [ ] Download coverage artifacts

### Manual Verification:
- [ ] Backend health: `curl http://localhost:5000/api/health`
- [ ] Frontend build: `cd frontend && npm run build`
- [ ] Database connection: MongoDB logs show successful connection

## 🎯 Viva Demo Script

### What to Show:
1. **Local Test Execution:**
   ```bash
   ./run-tests.bat
   ```
   Show: "All tests pass automatically"

2. **CI/CD Pipeline:**
   - Open GitHub Actions tab
   - Show latest workflow run
   - Show test results and coverage

3. **Coverage Reports:**
   - Open `backend/coverage/lcov-report/index.html`
   - Open `frontend/coverage/lcov-report/index.html`

### What to Say:
- "We implemented automated testing with Jest for backend and Vitest for frontend"
- "Tests run automatically on every push via GitHub Actions CI/CD pipeline"
- "We achieve 80%+ backend coverage and 70%+ frontend coverage"
- "Tests include API endpoints, component rendering, and database operations"

## 🔄 Adding New Tests

### Backend Tests:
Create files in `backend/tests/` with `.test.js` extension:
```javascript
describe('New Feature', () => {
  test('should work correctly', async () => {
    // Test code here
  });
});
```

### Frontend Tests:
Create files in `frontend/src/test/` with `.test.tsx` extension:
```typescript
describe('New Component', () => {
  it('should render correctly', () => {
    // Test code here
  });
});
```

## 📞 Support

If tests fail:
1. Check console output for error messages
2. Verify dependencies are installed: `npm install`
3. Check database connection for backend tests
4. Review CI/CD logs on GitHub Actions

---

## ✅ Summary

**Automated Testing is Now Active:**
- ✅ Backend: Jest + Supertest + MongoDB Memory Server
- ✅ Frontend: Vitest + React Testing Library
- ✅ CI/CD: GitHub Actions automatic execution
- ✅ Coverage: HTML reports with detailed metrics
- ✅ Scripts: One-command test execution locally

**For Viva:** Show `./run-tests.bat` running successfully, then GitHub Actions tab with passing workflows.