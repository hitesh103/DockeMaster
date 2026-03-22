import express from 'express';
import db from '../db/db.js';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';
import { hashPassword } from '../services/auth_service.js';

const router = express.Router();

// GET /api/users
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at FROM users').all();
  res.json(users);
});

// POST /api/users
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(422).json({ error: 'username, password, and role are required' });
  }
  if (!['admin', 'viewer'].includes(role)) {
    return res.status(422).json({ error: 'role must be admin or viewer' });
  }
  try {
    const hashed = await hashPassword(password);
    const result = db
      .prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run(username, hashed, role);
    res.status(201).json({ id: result.lastInsertRowid, username, role });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { role } = req.body;
  if (!role || !['admin', 'viewer'].includes(role)) {
    return res.status(422).json({ error: 'role must be admin or viewer' });
  }
  const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User updated' });
});

// DELETE /api/users/:id
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  // Prevent deleting yourself
  if (String(req.user.id) === String(req.params.id)) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'User deleted' });
});

export default router;
