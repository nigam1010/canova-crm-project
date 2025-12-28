import express from 'express';
import { LeadModel } from '../models/Lead.js';
import { UserModel } from '../models/User.js';
import { ActivityModel } from '../models/Activity.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard metrics
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const [
      unassignedLeads,
      assignedThisWeek,
      activeSalesPeople,
      conversionRate
    ] = await Promise.all([
      LeadModel.getUnassignedCount(),
      LeadModel.getAssignedThisWeekCount(),
      UserModel.getActiveSalesCount(),
      LeadModel.getConversionRate()
    ]);

    res.json({
      unassignedLeads,
      assignedThisWeek,
      activeSalesPeople,
      conversionRate
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics', message: error.message });
  }
});

// Get sales graph data (2 weeks)
router.get('/sales-graph', authenticate, async (req, res) => {
  try {
    const graphData = await LeadModel.getConversionGraphData();
    res.json(graphData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch graph data', message: error.message });
  }
});

// Get active sales people list with timing status
router.get('/active-sales', authenticate, async (req, res) => {
  try {
    const users = await UserModel.findAll({ role: 'sales', status: 'Active' });

    // Get today's timing for each user
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const db = (await import('../config/db.js')).getDB();
    const timings = await db.collection('timings').find({
      date: today
    }).toArray();

    // Create a map of userId to timing
    const timingMap = {};
    timings.forEach(t => {
      timingMap[t.userId.toString()] = t;
    });

    // Add timing status to each user
    const usersWithStatus = users.map(user => {
      const timing = timingMap[user._id.toString()];
      let timingStatus = 'Inactive';

      // Only show Active if checked in and NOT on break and NOT checked out
      if (timing && timing.checkInTime && !timing.checkOutTime && !timing.currentBreakStart) {
        timingStatus = 'Active';
      }

      return {
        ...user,
        timingStatus
      };
    });

    res.json(usersWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active sales people', message: error.message });
  }
});

export default router;
