import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import containersRouter from './api/containers.js';
// import imagesRouter from './api/images.js';
// import nodesRouter from './api/nodes.js';
// import authRouter from './api/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/containers', containersRouter);
// app.use('/api/images', imagesRouter);
// app.use('/api/nodes', nodesRouter);
// app.use('/api/auth', authRouter);

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
