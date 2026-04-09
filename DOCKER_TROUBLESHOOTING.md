# 🐳 Docker Setup - Troubleshooting Guide

## Error: "failed to connect to the docker API"

This error means **Docker Desktop daemon is not running**.

---

## ✅ Solution: Start Docker Desktop

### On Windows:

**Method 1: Using GUI (Recommended)**
```
1. Click the Windows Start button
2. Search for "Docker Desktop"
3. Click "Docker Desktop" to open it
4. Wait for it to fully start (1-2 minutes)
5. You'll see the Docker icon in system tray
6. Try docker commands now
```

**Method 2: Using PowerShell (As Administrator)**
```powershell
# Check if Docker is installed
docker --version

# Start Docker Desktop service
Start-Service docker

# Verify it's running
docker ps
```

**Method 3: Using Command Prompt**
```cmd
# Restart Docker daemon
net stop com.docker.service
net start com.docker.service
```

---

## 🔍 Verify Docker is Running

```bash
# Check Docker version
docker --version
# Output: Docker version 25.0.0, build ...

# Check Docker is responsive
docker ps
# Output: CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES

# Check Docker Compose
docker-compose --version
# Output: Docker Compose version v2.24.0
```

---

## 🚀 Now Try Docker Commands Again

After Docker Desktop starts, run:

```bash
# Navigate to project
cd C:\Users\harsh\Downloads\nexus-cognitive-v2\nexus

# Build images (takes 5-10 minutes first time)
docker-compose build

# Start all services
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 🎯 Expected Output After Docker Starts

```
$ docker-compose ps

NAME                 STATUS              PORTS
nexus-mongodb        Up (healthy)        27017:27017
nexus-backend        Up (healthy)        5000:5000
nexus-frontend       Up (healthy)        3000:3000

$ docker-compose logs
mongodb  | [initandlisten] waiting for connections on port 27017
backend  | MongoDB Connected!
backend  | Server running on port 5000
frontend | serve listening on 3000
```

---

## ⚙️ Docker Desktop System Requirements

- **RAM:** 2GB minimum (4GB recommended)
- **Disk Space:** 10GB for images
- **Windows Version:** Windows 11 or Windows 10 (Build 19041+)
- **Virtualization:** Enabled in BIOS
- **WSL 2:** Latest version installed

Check if WSL2 is installed:
```powershell
wsl --list --verbose

# Should show:
# NAME      STATE           VERSION
# Ubuntu    Running         2
```

---

## 🚨 If Docker Desktop Won't Start

### Quick Fixes:

1. **Restart Computer**
   ```
   Ctrl + Alt + Del → Restart
   ```

2. **Reinstall Docker Desktop**
   - Uninstall: Control Panel → Programs → Uninstall Docker Desktop
   - Download: https://www.docker.com/products/docker-desktop
   - Install and restart

3. **Check WSL2 Installation**
   ```powershell
   wsl --install
   wsl --update
   ```

4. **Enable Virtualization in BIOS**
   - Restart computer
   - Press F2/F10/Delete (varies by manufacturer)
   - Find "Virtualization" or "VT-x"
   - Set to "Enabled"
   - Save and restart

---

## 📚 Resources

- Docker Docs: https://docs.docker.com/
- Docker Compose Docs: https://docs.docker.com/compose/
- Troubleshooting: https://docs.docker.com/desktop/troubleshoot/

---

## ✅ Once Docker is Running

Your CI/CD will also activate:

1. **Every push to GitHub → Automatic tests run**
2. **Docker images built automatically**
3. **Code quality checked automatically**
4. **Reports generated automatically**

Go to GitHub → Actions tab to see workflows running! 🚀
