import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';
import {
  listRegistries,
  createRegistry,
  deleteRegistry,
  testConnection,
  listImages,
} from '../services/registry_service.js';

const router = express.Router();

// GET /api/registries
router.get('/', requireAuth, (req, res) => {
  try {
    res.json(listRegistries());
  } catch (err) {
    res.status(500).json({ error: 'Failed to list registries' });
  }
});

// POST /api/registries
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, url, username, password } = req.body;
  if (!name || !url || !username || !password) {
    return res.status(422).json({ error: 'name, url, username, and password are required' });
  }
  try {
    const registry = createRegistry({ name, url, username, password });
    res.status(201).json(registry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create registry' });
  }
});

// DELETE /api/registries/:id
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    deleteRegistry(req.params.id);
    res.json({ message: 'Registry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete registry' });
  }
});

// GET /api/registries/:id/images
router.get('/:id/images', requireAuth, async (req, res) => {
  try {
    const images = await listImages(req.params.id);
    res.json(images);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Failed to list registry images' });
  }
});

// POST /api/registries/:id/test
router.post('/:id/test', requireAuth, async (req, res) => {
  try {
    const result = await testConnection(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: err.message });
    res.status(500).json({ error: 'Connection test failed' });
  }
});

export default router;
