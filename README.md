# DockMaster — Container Management Dashboard

> **Status:** This project is still in the development phase.

**DockMaster** is a powerful, self-hosted alternative to Portainer. It provides a centralized web dashboard to manage Docker containers across multiple servers using Docker Swarm. From launching containers to monitoring, restarting, scaling, or deploying from Git repositories — all in one clean UI.

> Built for developers, DevOps teams, and sysadmins who want full control over their container infrastructure.

![DockMaster Dashboard](https://cdn2.allevents.in/transup/31/c27a6ddef141089d8ef1d8e05640f7/Screenshot-2026-03-22-at-3.10.16-PM.png)

---

## ✨ Features

### 🔧 Core Docker Management
- View all running containers across all connected servers
- Start, stop, restart, and remove containers
- View container logs in real-time
- Inspect container details (CPU, RAM, ports, volume mounts, etc.)
- View and remove Docker images
- Run new containers with custom environment variables, ports, and volumes

### 🌐 Multi-Server Swarm Control
- Add multiple servers via secure token-based authentication
- Connect and control Docker Swarm nodes from a single dashboard
- Health check and status view of each server
- Remote container deployment across selected nodes

### 📦 Git + Registry Integration
- Deploy containers directly from GitHub or GitLab repositories
- Integrated Git-based deploy: Auto-clone, build, and run containers
- Connect to private/public Docker registries (Docker Hub, GitHub Container Registry, GitLab Registry)
- View and pull images from any connected registry

### ⚙️ Orchestration & Scaling
- Deploy and manage Docker stacks using `docker-compose.yml`
- Scale services up or down with one click
- Automatically rebalance containers across nodes
- Rolling updates with zero-downtime

### 🔒 User Access & Authentication
- JWT-based user login system (admin/viewer roles)
- Future plan: Role-based access control per server/node

### 📈 Monitoring & Logs
- Real-time CPU/RAM/network usage per container
- Event logs for start/stop/crashes
- WebSocket stream for live container events

### 🧰 Additional Utilities
- Terminal access to containers from the browser (via WebSocket)
- Volume and network management
- TLS secured reverse proxy using Traefik or NGINX
- Optional 2FA for user accounts (Planned)

---

## 🚀 Tech Stack

| Layer          | Tech Stack                         |
|----------------|------------------------------------|
| Frontend       | React.js, Tailwind CSS             |
| Backend        | Node.js, Express.js                |
| Docker Access  | Dockerode (Node.js SDK)            |
| Real-Time      | WebSockets (Socket.IO)             |
| Auth           | JWT, bcrypt                        |
| Database       | MongoDB or SQLite (lightweight)    |
| Reverse Proxy  | NGINX or Traefik                   |
| Orchestration  | Docker Swarm                       |
| Git Integration| Git CLI + GitHub/GitLab APIs       |
| Registry Auth  | Docker Registry HTTP API v2        |

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP
- [x] Setup Docker client & multi-node connection
- [x] Backend API for container listing and control
- [x] React dashboard showing containers & actions
- [x] Deploy containers from form (image name, env, etc.)

### 🚧 Phase 2: Core Infrastructure
- [ ] Git-based deploy with optional build
- [ ] Docker registry integration
- [ ] Logs and resource metrics (stats)
- [ ] Swarm services & scaling controls
- [ ] Container terminal (WebSocket shell)

### 🔒 Phase 3: Security & Access
- [ ] JWT auth with sessions
- [ ] RBAC (Admin, Viewer, Node-Owner)
- [ ] Audit logs and actions history

### 📈 Phase 4: Monitoring & Alerts
- [ ] Real-time resource graphs
- [ ] Crash/health alerts via email or webhook
- [ ] Slack/Telegram integrations

---

## 📂 Project Structure
DockMaster/
├── backend/ # Node.js API to talk to Docker and Swarm nodes
├── frontend/ # React-based UI
├── docker/ # Dockerfiles and NGINX config
├── docker-compose.yml
└── README.md


