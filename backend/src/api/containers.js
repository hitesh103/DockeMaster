import express from 'express';
import docker from '../services/docker_client.js';

const router = express.Router();

// GET /api/containers - List all containers
router.get('/', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json(containers);
  } catch (err) {
    console.error('Error listing containers:', err);
    res.status(500).json({ error: 'Failed to list containers' });
  }
});

// POST /api/containers/:id/start - Start a container
router.post('/:id/start', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.start();
    res.json({ message: 'Container started' });
  } catch (err) {
    console.error('Error starting container:', err);
    res.status(500).json({ error: 'Failed to start container' });
  }
});

// POST /api/containers/:id/stop - Stop a container
router.post('/:id/stop', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();
    res.json({ message: 'Container stopped' });
  } catch (err) {
    console.error('Error stopping container:', err);
    res.status(500).json({ error: 'Failed to stop container' });
  }
});

// DELETE /api/containers/:id - Remove a container
router.delete('/:id', async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.remove({ force: true });
    res.json({ message: 'Container removed' });
  } catch (err) {
    console.error('Error removing container:', err);
    res.status(500).json({ error: 'Failed to remove container' });
  }
});

export default router;
