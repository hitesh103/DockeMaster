import express from 'express';
import db from '../db/db.js';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';
import { addNode, pingNode } from '../services/node_client.js';

const router = express.Router();

// GET /api/nodes
router.get('/', requireAuth, (req, res) => {
  const nodes = db.prepare('SELECT id, hostname, ip_address, port, created_at FROM nodes').all();
  res.json(nodes);
});

// POST /api/nodes
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { hostname, ip_address, port, tls_cert } = req.body;
  if (!hostname || !ip_address) {
    return res.status(422).json({ error: 'hostname and ip_address are required' });
  }
  const result = db
    .prepare('INSERT INTO nodes (hostname, ip_address, port, tls_cert) VALUES (?, ?, ?, ?)')
    .run(hostname, ip_address, port || 2376, tls_cert || null);

  const node = { id: result.lastInsertRowid, hostname, ip_address, port: port || 2376, tls_cert };
  addNode(node);
  res.status(201).json({ id: node.id, hostname, ip_address, port: node.port });
});

// DELETE /api/nodes/:id
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM nodes WHERE id = ?').run(req.params.id);
  res.json({ message: 'Node removed' });
});

// GET /api/nodes/:id/health
router.get('/:id/health', requireAuth, async (req, res) => {
  const node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(req.params.id);
  if (!node) return res.status(404).json({ error: 'Node not found' });

  const reachable = await pingNode(req.params.id);
  res.json({ reachable });
});

export default router;
