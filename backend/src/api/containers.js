import express from 'express';
import docker from '../services/docker_client.js';
import { deploy } from '../services/container_service.js';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';

const router = express.Router();

// POST /api/containers/deploy — must be before /:id routes
router.post('/deploy', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { image, name, env, ports, volumes, restartPolicy } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Bad request', detail: 'image is required' });
    }
    const info = await deploy({ image, name, env, ports, volumes, restartPolicy });
    res.status(201).json(info);
  } catch (err) {
    console.error('Error deploying container:', err);
    if (err.status === 422) {
      return res.status(422).json({ error: 'Unprocessable', detail: err.message });
    }
    res.status(500).json({ error: 'Failed to deploy container' });
  }
});

// GET /api/containers - List all containers
router.get('/', requireAuth, async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    res.json(containers);
  } catch (err) {
    console.error('Error listing containers:', err);
    res.status(500).json({ error: 'Failed to list containers' });
  }
});

// GET /api/containers/:id - Inspect a container (alias)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const info = await container.inspect();
    res.json(info);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Not found', id: req.params.id });
    }
    console.error('Error inspecting container:', err);
    res.status(500).json({ error: 'Failed to inspect container' });
  }
});

// GET /api/containers/:id/inspect
router.get('/:id/inspect', requireAuth, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const info = await container.inspect();
    res.json(info);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Not found', id: req.params.id });
    }
    console.error('Error inspecting container:', err);
    res.status(500).json({ error: 'Failed to inspect container' });
  }
});

// GET /api/containers/:id/stats
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    const statsRaw = await container.stats({ stream: false });

    const cpuDelta =
      statsRaw.cpu_stats.cpu_usage.total_usage -
      statsRaw.precpu_stats.cpu_usage.total_usage;
    const systemDelta =
      statsRaw.cpu_stats.system_cpu_usage - statsRaw.precpu_stats.system_cpu_usage;
    const cpuCount =
      statsRaw.cpu_stats.online_cpus ||
      statsRaw.cpu_stats.cpu_usage.percpu_usage?.length ||
      1;
    const cpu =
      systemDelta > 0 ? (cpuDelta / systemDelta) * cpuCount * 100 : 0;

    const memoryBytes = statsRaw.memory_stats?.usage || 0;
    const memory = memoryBytes / 1048576;

    let networkRx = 0;
    let networkTx = 0;
    if (statsRaw.networks) {
      for (const iface of Object.values(statsRaw.networks)) {
        networkRx += iface.rx_bytes || 0;
        networkTx += iface.tx_bytes || 0;
      }
    }

    const name = statsRaw.name ? statsRaw.name.replace(/^\//, '') : req.params.id;

    res.json({
      containerId: req.params.id,
      name,
      cpu,
      memory,
      networkRx,
      networkTx,
      timestamp: Date.now(),
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Not found', id: req.params.id });
    }
    console.error('Error getting container stats:', err);
    res.status(500).json({ error: 'Failed to get container stats' });
  }
});

// POST /api/containers/:id/start
router.post('/:id/start', requireAuth, requireAdmin, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.start();
    res.json({ message: 'Container started' });
  } catch (err) {
    console.error('Error starting container:', err);
    res.status(500).json({ error: 'Failed to start container' });
  }
});

// POST /api/containers/:id/stop
router.post('/:id/stop', requireAuth, requireAdmin, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.stop();
    res.json({ message: 'Container stopped' });
  } catch (err) {
    console.error('Error stopping container:', err);
    res.status(500).json({ error: 'Failed to stop container' });
  }
});

// POST /api/containers/:id/restart
router.post('/:id/restart', requireAuth, requireAdmin, async (req, res) => {
  try {
    const container = docker.getContainer(req.params.id);
    await container.restart();
    res.json({ message: 'Container restarted' });
  } catch (err) {
    console.error('Error restarting container:', err);
    res.status(500).json({ error: 'Failed to restart container' });
  }
});

// DELETE /api/containers/:id
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
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
