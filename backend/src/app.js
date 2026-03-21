import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import containersRouter from './api/containers.js';
import authRouter from './api/auth.js';
import auditLogsRouter from './api/audit_logs.js';
import imagesRouter from './api/images.js';
// import nodesRouter from './api/nodes.js';
import { initSchema } from './db/schema.js';
import { seedAdminUser } from './services/auth_service.js';
import { auditMiddleware } from './middlewares/audit_middleware.js';

// Load environment variables
dotenv.config();

// Initialise DB schema and seed default admin
initSchema();
seedAdminUser().catch(err => console.error('Seed error:', err));

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
// app.use('/api/nodes', nodesRouter);

// Root route
app.get('/', (req, res) => {
  res.send('🚀 DockMaster backend is running!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ DockMaster API running on port ${PORT}`);
});
