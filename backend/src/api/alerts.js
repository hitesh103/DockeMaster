import express from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth_middleware.js';
import { saveConfig, getConfig } from '../services/alert_service.js';

const router = express.Router();

router.get('/config', requireAuth, requireAdmin, (req, res) => {
  res.json(getConfig());
});

router.post('/config', requireAuth, requireAdmin, (req, res) => {
  try {
    saveConfig(req.body);
    res.json({ message: 'Alert config saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save alert config' });
  }
});

export default router;
