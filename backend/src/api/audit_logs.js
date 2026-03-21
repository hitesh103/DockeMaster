import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';
import { query } from '../services/audit_service.js';

const router = Router();

// GET /api/audit-logs — admin only, paginated
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const { actor, action, from, to, page } = req.query;

  const results = query({
    actor: actor || undefined,
    action: action || undefined,
    from: from != null ? Number(from) : undefined,
    to: to != null ? Number(to) : undefined,
    page: page != null ? Number(page) : 1,
  });

  res.json(results);
});

export default router;
