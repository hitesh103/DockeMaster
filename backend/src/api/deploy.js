import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';
import { gitDeploy } from '../services/deploy_service.js';

const router = express.Router();

// POST /api/deploy/git
router.post('/git', requireAuth, requireAdmin, async (req, res) => {
  const { repositoryUrl, branch, dockerfilePath, imageTag, env } = req.body;

  if (!repositoryUrl) {
    return res.status(422).json({ error: 'repositoryUrl is required' });
  }

  try {
    const jobId = await gitDeploy({ repositoryUrl, branch, dockerfilePath, imageTag, env });
    res.status(202).json({ jobId });
  } catch (err) {
    console.error('Git deploy error:', err);
    res.status(500).json({ error: 'Failed to start git deploy' });
  }
});

export default router;
