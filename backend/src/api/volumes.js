import express from 'express';
import docker from '../services/docker_client.js';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const data = await docker.listVolumes();
    res.json(data.Volumes || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list volumes' });
  }
});

router.delete('/:name', requireAuth, requireAdmin, async (req, res) => {
  try {
    const volume = docker.getVolume(req.params.name);
    await volume.remove();
    res.json({ message: 'Volume removed' });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ error: 'Volume is in use' });
    }
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Volume not found' });
    }
    res.status(500).json({ error: 'Failed to remove volume' });
  }
});

export default router;
