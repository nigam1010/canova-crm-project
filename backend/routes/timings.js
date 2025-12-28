import express from 'express';
import { TimingModel } from '../models/Timing.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Check-in
router.post('/check-in', authenticate, async (req, res) => {
  try {
    const timing = await TimingModel.checkIn(req.user._id.toString());
    res.json(timing);
  } catch (error) {
    res.status(500).json({ error: 'Check-in failed', message: error.message });
  }
});

// Check-out
router.post('/check-out', authenticate, async (req, res) => {
  try {
    const success = await TimingModel.checkOut(req.user._id.toString());
    
    if (!success) {
      return res.status(400).json({ error: 'No active check-in found or already checked out' });
    }
    
    res.json({ message: 'Checked out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Check-out failed', message: error.message });
  }
});

// Start break
router.post('/break-start', authenticate, async (req, res) => {
  try {
    const success = await TimingModel.startBreak(req.user._id.toString());
    
    if (!success) {
      return res.status(400).json({ error: 'No active check-in found' });
    }
    
    res.json({ message: 'Break started' });
  } catch (error) {
    res.status(500).json({ error: 'Break start failed', message: error.message });
  }
});

// End break
router.post('/break-end', authenticate, async (req, res) => {
  try {
    const success = await TimingModel.endBreak(req.user._id.toString());
    
    if (!success) {
      return res.status(400).json({ error: 'No active break found' });
    }
    
    res.json({ message: 'Break ended' });
  } catch (error) {
    res.status(500).json({ error: 'Break end failed', message: error.message });
  }
});

// Get today's timing
router.get('/today', authenticate, async (req, res) => {
  try {
    const timing = await TimingModel.getTodayTiming(req.user._id.toString());
    res.json(timing || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch timing', message: error.message });
  }
});

// Get past break logs (4 days)
router.get('/break-logs', authenticate, async (req, res) => {
  try {
    const logs = await TimingModel.getPastBreakLogs(req.user._id.toString());
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch break logs', message: error.message });
  }
});

export default router;
