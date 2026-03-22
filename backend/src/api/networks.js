import express from 'express';
import docker from '../services/docker_client.js';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const networks = await docker.listNetworks();
    res.json(networks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list networks' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const network = docker.getNetwork(req.params.id);
    await network.remove();
    res.json({ message: 'Network removed' });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ error: 'Network is in use' });
    }
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Network not found' });
    }
    res.status(500).json({ error: 'Failed to remove network' });
  }
});

export default router;
