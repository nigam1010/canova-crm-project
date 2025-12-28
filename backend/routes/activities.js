import express from 'express';
import { ActivityModel } from '../models/Activity.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get recent activities (last 7)
router.get('/recent', authenticate, async (req, res) => {
  try {
    const activities = await ActivityModel.getRecent(7);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities', message: error.message });
  }
});

// Get activities for current user
router.get('/my-activities', authenticate, async (req, res) => {
  try {
    const activities = await ActivityModel.getByUser(req.user._id.toString(), 7);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities', message: error.message });
  }
});

export default router;
