import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';
import { listServices, scaleService, removeService } from '../services/swarm_service.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await listServices());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/:id/scale', requireAuth, requireAdmin, async (req, res) => {
  const replicas = parseInt(req.body.replicas, 10);
  if (isNaN(replicas) || replicas < 0) {
    return res.status(422).json({ error: 'replicas must be a non-negative integer' });
  }
  try {
    await scaleService(req.params.id, replicas);
    res.json({ message: 'Service scaled' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await removeService(req.params.id);
    res.json({ message: 'Service removed' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
