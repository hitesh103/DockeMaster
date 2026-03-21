import { verifyToken, isBlocked } from '../services/auth_service.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (isBlocked(payload.jti)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
