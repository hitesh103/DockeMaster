import express from 'express';
import jsYaml from 'js-yaml';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';
import { listStacks, deployStack, removeStack } from '../services/swarm_service.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    res.json(await listStacks());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, yaml } = req.body;
  if (!name || !yaml) {
    return res.status(422).json({ error: 'name and yaml are required' });
  }
  try {
    jsYaml.safeLoad(yaml); // validate YAML
  } catch {
    return res.status(422).json({ error: 'Invalid YAML' });
  }
  try {
    await deployStack(name, yaml);
    res.status(201).json({ message: 'Stack deployed' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/:name', requireAuth, requireAdmin, async (req, res) => {
  try {
    await removeStack(req.params.name);
    res.json({ message: 'Stack removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
