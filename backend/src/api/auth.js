import { Router } from 'express';
import db from '../db/db.js';
import {
  signToken,
  verifyToken,
  blockToken,
  checkPassword,
} from '../services/auth_service.js';
import { requireAuth } from '../middlewares/auth_middleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = await checkPassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  const { jti, exp } = req.user;
  blockToken(jti, exp);
  return res.json({ message: 'Logged out' });
});

export default router;
