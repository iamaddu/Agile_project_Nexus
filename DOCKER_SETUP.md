# 🐳 Docker Setup Guide - Nexus Cognitive Project

## 📋 Overview

This guide explains how to run the entire Nexus Cognitive project using Docker and Docker Compose.

### Project Architecture:
```
┌─────────────────────────────────────────────┐
│         Frontend (React + Vite)             │
│      Running on Port 3000                   │
└────────────────┬────────────────────────────┘
                 │ (HTTP Requests)
┌────────────────▼────────────────────────────┐
│      Backend (Express + Node.js)            │
│      Running on Port 5000                   │
└────────────────┬────────────────────────────┘
                 │ (MongoDB Queries)
┌────────────────▼────────────────────────────┐
│    Database (MongoDB)                       │
│    Running on Port 27017                    │
└─────────────────────────────────────────────┘
```

---

## 📁 File Explanations

### 1. **backend/Dockerfile**
**Purpose:** Creates a Docker image for the backend server
```
- Uses Node.js 18 Alpine (small, lightweight image)
- Installs production dependencies
- Copies application code
- Exposes port 5000
- Includes health check to verify backend is running
- Runs 'npm start' command
```

### 2. **frontend/Dockerfile** 
**Purpose:** Creates a Docker image for the frontend
```
- Stage 1 (Builder): Builds React + Vite application
- Stage 2 (Runtime): Serves built app using 'serve'
- Multi-stage build reduces final image size
- Exposes port 3000
- Includes health check to verify frontend is running
```

### 3. **docker-compose.yml**
**Purpose:** Orchestrates all three services (Backend, Frontend, Database)
```
Services:
  - mongodb: Database service with authentication
  - backend: Express API server
  - frontend: React web application

Features:
  - Volume management for persistent database storage
  - Environment variables for configuration
  - Health checks for each service
  - Dependency management (frontend waits for backend, backend waits for database)
  - Custom network for service communication
```

### 4. **.dockerignore files**
**Purpose:** Specifies files to exclude from Docker images
```
- Reduces image size by excluding unnecessary files
- Improves build performance
- Similar to .gitignore but for Docker
```

---

## 🚀 Step-by-Step Setup Instructions

### Prerequisites:
- Docker installed (https://docs.docker.com/get-docker/)
- Docker Compose installed (usually comes with Docker Desktop)
- 4GB+ free disk space

### Step 1: Navigate to Project Root
```bash
cd C:\Users\harsh\Downloads\nexus-cognitive-v2\nexus
```

### Step 2: Build Docker Images
```bash
# This builds images for the backend and frontend
docker-compose build
```
**What happens:** Docker reads the Dockerfiles and creates container images (~5-10 minutes first time)

### Step 3: Start All Services
```bash
# This starts MongoDB, Backend, and Frontend containers
docker-compose up -d
```
**Flags:**
- `-d` = Run in background (detached mode)

**What happens:**
1. MongoDB starts and initializes
2. Backend starts and connects to MongoDB
3. Frontend starts and serves the React app

### Step 4: Verify Services Are Running
```bash
# Check container status
docker-compose ps
```

**Expected Output:**
```
NAME                 STATUS
nexus-mongodb        Up (healthy)
nexus-backend        Up (healthy)
nexus-frontend       Up (healthy)
```

---

## ✅ Verification Steps

### Check 1: Verify MongoDB is Running
```bash
# Connect to MongoDB container
docker-compose exec mongodb mongosh -u admin -p admin123

# Inside mongosh shell, run:
use nexus_cognitive
db.users.find()

# Exit with: exit
```

### Check 2: Verify Backend is Running
```bash
# Test backend endpoint
curl http://localhost:5000/api/users/me

# Or open in browser:
# http://localhost:5000/api/users
```
**Expected:** You should get a response (may need authentication token)

### Check 3: Verify Frontend is Running
```bash
# Open in browser:
# http://localhost:3000

# The Nexus Cognitive application should load
```

### Check 4: View Live Logs
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# MongoDB logs
docker-compose logs -f mongodb

# All logs
docker-compose logs -f
```
**Press Ctrl+C to exit logs**

### Check 5: Verify Frontend-Backend Communication
```bash
# Inside frontend container logs, look for successful API calls
docker-compose logs frontend

# Look for successful HTTP responses (not 5xx errors)
```

---

## 🛑 Stopping Services

### Stop All Services (Keep Data)
```bash
docker-compose stop
```

### Stop and Remove Containers (Keep Data & Images)
```bash
docker-compose down
```

### Stop and Remove Everything Including Volumes (DELETE DATA)
```bash
docker-compose down -v
```

---

## 🔧 Common Operations

### Rebuild After Code Changes
```bash
# Rebuild images with latest code
docker-compose build --no-cache

# Then start again
docker-compose up -d
```

### View Container Shell (Debug)
```bash
# Access backend container shell
docker-compose exec backend sh

# Access frontend container shell
docker-compose exec frontend sh

# Exit with: exit
```

### View Detailed Container Info
```bash
# Inspect backend service
docker inspect nexus-backend

# Inspect frontend service
docker inspect nexus-frontend
```

---

## 📊 Port Mapping

| Service    | Container Port | Host Port | Access URL                  |
|-----------|----------------|-----------|---------------------------|
| Frontend  | 3000           | 3000      | http://localhost:3000     |
| Backend   | 5000           | 5000      | http://localhost:5000     |
| MongoDB   | 27017          | 27017     | mongodb://localhost:27017 |

---

## 🔐 Database Credentials (for Docker)

```
MongoDB Username: admin
MongoDB Password: admin123
MongoDB Database: nexus_cognitive
Connection String: mongodb://admin:admin123@localhost:27017/nexus_cognitive?authSource=admin
```

---

## 📝 Environment Variables Explained

### Backend (in docker-compose.yml)
```yaml
MONGO_URI: mongodb://admin:admin123@mongodb:27017/nexus_cognitive?authSource=admin
  # This connects backend to MongoDB using the internal network address 'mongodb'
  
PORT: 5000
  # Backend runs on port 5000 inside container
  
NODE_ENV: production
  # Sets Node environment to production
```

### Frontend (in docker-compose.yml)
```yaml
VITE_API_URL: http://backend:5000
  # Frontend uses the internal network address 'backend' to reach the API
  # This is only needed in production builds
```

---

## 🐛 Troubleshooting

### Backend fails to connect to MongoDB
```
Error: connect ECONNREFUSED
Solution: 
  1. Check MongoDB is healthy: docker-compose ps
  2. Wait 30 seconds for MongoDB to initialize
  3. Check MONGO_URI in docker-compose.yml is correct
```

### Frontend shows blank page
```
Solution:
  1. Check frontend logs: docker-compose logs frontend
  2. Clear browser cache (Ctrl+Shift+Del)
  3. Rebuild: docker-compose build --no-cache
```

### Port already in use
```
Error: bind: address already in use
Solution:
  1. Find process using port: lsof -i :3000 (Mac/Linux)
  2. Or change port in docker-compose.yml
  3. Or stop other Docker containers: docker stop <container_id>
```

### MongoDB volume issues
```
Solution:
  1. Remove volumes: docker-compose down -v
  2. Clean rebuild: docker-compose build --no-cache && docker-compose up -d
```

---

## 📈 Production Considerations

For academic submission, explain these points in your viva:

1. **Health Checks:** Each service has health checks to auto-restart on failure
2. **Restart Policy:** Services auto-restart if they crash (`restart: unless-stopped`)
3. **Networking:** Internal Docker network ensures secure service-to-service communication
4. **Volumes:** Database data persists even if container stops
5. **Environment Variables:** Configuration managed through docker-compose.yml
6. **Multi-stage Building:** Frontend uses multi-stage builds to reduce image size

---

## ✨ Summary Commands

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose stop

# Complete cleanup
docker-compose down -v
```

---

**For Academic Viva Explanation:**
"We containerized the entire application using Docker. Each service (Backend, Frontend, Database) runs in its own container. Docker Compose orchestrates these containers, manages networking, environment variables, and ensures they all communicate correctly. This makes deployment consistent, scalable, and easy to replicate across different environments."
