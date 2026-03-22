import { createServer } from 'http';
import { URL } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import containersRouter from './api/containers.js';
import authRouter from './api/auth.js';
import auditLogsRouter from './api/audit_logs.js';
import imagesRouter from './api/images.js';
import deployRouter from './api/deploy.js';
import registriesRouter from './api/registries.js';
import servicesRouter from './api/services.js';
import stacksRouter from './api/stacks.js';
import volumesRouter from './api/volumes.js';
import networksRouter from './api/networks.js';
import nodesRouter from './api/nodes.js';
import usersRouter from './api/users.js';
import alertsRouter from './api/alerts.js';
import { loadNodesFromDb } from './services/node_client.js';
import { startEventListener } from './services/alert_service.js';
import { initSchema } from './db/schema.js';
import { seedAdminUser } from './services/auth_service.js';
import { verifyToken } from './services/auth_service.js';
import { auditMiddleware } from './middlewares/audit_middleware.js';
import { handleLogsWs } from './ws/logs_ws.js';
import { handleTerminalWs } from './ws/terminal_ws.js';
import { handleGitLogsWs } from './ws/git_logs_ws.js';
import { handleStatsWs } from './ws/stats_ws.js';

// Load environment variables
dotenv.config();

// Initialise DB schema and seed default admin
initSchema();
seedAdminUser().catch(err => console.error('Seed error:', err));
loadNodesFromDb();
startEventListener();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Audit middleware — applied after auth (req.user set by requireAuth per-route), before routes
app.use(auditMiddleware);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/containers', containersRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/images', imagesRouter);
app.use('/api/deploy', deployRouter);
app.use('/api/registries', registriesRouter);
app.use('/api/services', servicesRouter);
app.use('/api/stacks', stacksRouter);
app.use('/api/volumes', volumesRouter);
app.use('/api/networks', networksRouter);
app.use('/api/nodes', nodesRouter);
app.use('/api/users', usersRouter);
app.use('/api/alerts', alertsRouter);

// Root route
app.get('/', (req, res) => {
  res.send('🚀 DockMaster backend is running!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// JSON parse error handler
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next(err);
});

// Global error handler — maps Dockerode errors to HTTP status codes
app.use((err, req, res, next) => {
  const msg = err.message || '';
  const isDev = process.env.NODE_ENV !== 'production';

  // Dockerode / Docker API error mapping
  if (err.statusCode === 404 || /no such (container|image|volume|network|service)/i.test(msg)) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (err.statusCode === 409 || /conflict/i.test(msg)) {
    return res.status(409).json({ error: msg || 'Conflict' });
  }
  if (err.statusCode === 503 || /swarm/i.test(msg)) {
    return res.status(503).json({ error: 'Docker is not in Swarm mode' });
  }

  console.error('Unhandled error:', isDev ? err : msg);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Create HTTP server and WebSocket server
const server = createServer(app);
export const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade requests
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://localhost`);
  const token = url.searchParams.get('token');

  // Verify JWT
  let payload;
  try {
    if (!token) throw new Error('No token');
    payload = verifyToken(token);
  } catch {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  const pathname = url.pathname;

  // Route: /api/containers/:id/logs
  const logsMatch = pathname.match(/^\/api\/containers\/([^/]+)\/logs$/);
  if (logsMatch) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      req.user = payload;
      handleLogsWs(ws, req, logsMatch[1]);
    });
    return;
  }

  // Route: /api/containers/:id/terminal
  const terminalMatch = pathname.match(/^\/api\/containers\/([^/]+)\/terminal$/);
  if (terminalMatch) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      req.user = payload;
      handleTerminalWs(ws, req, terminalMatch[1]);
    });
    return;
  }

  // Route: /api/stats/stream
  if (pathname === '/api/stats/stream') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      req.user = payload;
      handleStatsWs(ws);
    });
    return;
  }

  // Route: /api/deploy/git/:jobId/logs
  const gitLogsMatch = pathname.match(/^\/api\/deploy\/git\/([^/]+)\/logs$/);
  if (gitLogsMatch) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      req.user = payload;
      handleGitLogsWs(ws, req, gitLogsMatch[1]);
    });
    return;
  }

  // No matching route
  socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
  socket.destroy();
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ DockMaster API running on port ${PORT}`);
});
