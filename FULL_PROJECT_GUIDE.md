# Nexus Cognitive Full Project Guide

## Overview
This guide explains how to run the project locally, use Docker, run automated tests, and understand the CI/CD pipeline. It also describes what each file or service does and why it matters.

## Project Structure
The repository is organized into these main folders:

- `backend/` - Node.js Express server, API routes, authentication, Socket.io, MongoDB integration.
- `frontend/` - React + Vite app, real-time collaboration UI, WebRTC, chat, code editor, whiteboard.
- `.github/workflows/` - GitHub Actions CI/CD pipelines.
- `docker-compose.yml` - Docker Compose orchestration of backend, frontend, and MongoDB.
- `backend/Dockerfile` - Backend container definition.
- `frontend/Dockerfile` - Frontend container definition.

## Local Setup

### 1. Install Dependencies

From the project root (`nexus/`):

```powershell
cd c:\Users\harsh\Downloads\nexus-cognitive-v2\nexus
cd backend
npm install
cd ..\frontend
npm install
```

### 2. Start Backend Locally

```powershell
cd c:\Users\harsh\Downloads\nexus-cognitive-v2\nexus\backend
npm run dev
```

This starts the backend server on port `5000` by default.

### 3. Start Frontend Locally

```powershell
cd c:\Users\harsh\Downloads\nexus-cognitive-v2\nexus\frontend
npm run dev
```

This starts the frontend app on port `3000` by default.

### 4. Access the App

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## Docker Setup

### Why Docker?

Docker ensures the entire project runs in the same environment every time. This avoids "it works on my machine" problems by packaging each service with its dependencies.

### 1. Build and Start Services

From the root `nexus/` folder:

```powershell
cd c:\Users\harsh\Downloads\nexus-cognitive-v2\nexus
docker-compose build
docker-compose up -d
```

### 2. Verify Services

```powershell
docker-compose ps
```

Look for `healthy` status in the backend and frontend services.

### 3. Stop Services

```powershell
docker-compose down
```

### What Docker Services Do

- `mongodb` - Runs MongoDB and stores data in Docker volumes.
- `backend` - Serves the Express API and real-time Socket.io endpoints.
- `frontend` - Serves the built React app on port `3000`.

## Automated Tests

### Backend Tests

Backend tests are located in `backend/tests/` and run with Jest.

```powershell
cd c:\Users\harsh\Downloads\nexus-cognitive-v2\nexus\backend
npm test
```

To run coverage:

```powershell
npm run test:coverage
```

### Frontend Tests

Frontend tests use Vitest and React Testing Library.

```powershell
cd c:\Users\harsh\Downloads\nexus-cognitive-v2\nexus\frontend
npm test
```

To run coverage:

```powershell
npm run test:coverage
```

## CI/CD Pipeline

### Workflow File
The CI pipeline is defined in `.github/workflows/build-test.yml`.

### What the pipeline does

- Installs backend dependencies.
- Runs backend Jest tests.
- Verifies MongoDB connection.
- Installs frontend dependencies.
- Runs frontend Vitest tests with coverage.
- Builds the frontend app.
- Performs minimal code quality checks.

### Key Fix

The frontend pipeline now runs with the correct command:

```yaml
cd frontend && npm run test:coverage
```

This ensures Vitest runs in CI mode instead of interactive watch mode.

## Important Commands Summary

### Local development
- `cd backend && npm run dev`
- `cd frontend && npm run dev`

### Testing
- `cd backend && npm test`
- `cd backend && npm run test:coverage`
- `cd frontend && npm test`
- `cd frontend && npm run test:coverage`

### Docker
- `docker-compose build`
- `docker-compose up -d`
- `docker-compose ps`
- `docker-compose down`

## Why This Setup Matters

- `npm install` keeps dependencies in sync for frontend and backend.
- `npm test` validates code behavior before deployment.
- `docker-compose` reproduces the full service environment locally.
- CI ensures every push is validated automatically.

## Troubleshooting

If Docker does not start:
- Make sure Docker Desktop is running.
- Restart Docker Desktop.
- Check for port conflicts on `3000`, `5000`, or `27017`.

If frontend tests hang:
- Use `npm run test:coverage` to force Vitest into non-watch mode.

If backend tests fail:
- Ensure MongoDB is running if tests are configured against a local database.
- For this project, backend tests currently use an in-memory MongoDB server.

## Final Notes

This repository supports:
- Full-stack React + Node.js development.
- Automated unit testing.
- Docker-based local environment.
- GitHub Actions CI/CD validation.

Use this file as your single source of truth for how to run, test, and verify the project.