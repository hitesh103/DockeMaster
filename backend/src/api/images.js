import express from 'express';
import docker from '../services/docker_client.js';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';

const router = express.Router();

// GET /api/images - List all images
router.get('/', requireAuth, async (req, res) => {
  try {
    const images = await docker.listImages({ all: false });
    const result = images.map((img) => ({
      id: img.Id.slice(7, 19),
      repository: img.RepoTags?.[0]?.split(':')[0] || '<none>',
      tag: img.RepoTags?.[0]?.split(':')[1] || '<none>',
      size: Math.round(img.Size / 1048576),
      created: img.Created,
    }));
    res.json(result);
  } catch (err) {
    console.error('Error listing images:', err);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// DELETE /api/images/:id - Remove an image
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const image = docker.getImage(req.params.id);
    await image.remove();
    res.json({ message: 'Image removed' });
  } catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({ error: 'Conflict', detail: err.message });
    }
    console.error('Error removing image:', err);
    res.status(500).json({ error: 'Failed to remove image' });
  }
});

export default router;
