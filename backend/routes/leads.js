import express from 'express';
import fs from 'fs';
import path from 'path';
import { LeadModel } from '../models/Lead.js';
import { UserModel } from '../models/User.js';
import { ActivityModel } from '../models/Activity.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { parseCSV, validateCSVStructure } from '../utils/csvParser.js';
import { assignLeadsToUsers, getNextUserForLanguage } from '../utils/leadAssignment.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all leads
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.language) filters.language = req.query.language;
    if (req.query.type) filters.type = req.query.type;

    const leads = await LeadModel.findAll(filters);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads', message: error.message });
  }
});

// Get leads for logged-in user
router.get('/my-leads', authenticate, async (req, res) => {
  try {
    const leads = await LeadModel.findByAssignedUser(req.user._id.toString());
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads', message: error.message });
  }
});

// Get scheduled leads with filter
router.get('/scheduled', authenticate, async (req, res) => {
  try {
    const filter = req.query.filter || 'All'; // 'Today' or 'All'
    const leads = await LeadModel.getScheduledLeads(req.user._id.toString(), filter);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scheduled leads', message: error.message });
  }
});

// Create single lead manually (Admin only)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { name, email, source, date, location, language, assignedTo } = req.body;

    if (!name || !email || !language) {
      return res.status(400).json({ error: 'Name, email, and language are required' });
    }

    let finalAssignedTo = assignedTo || null;
    let assignedUser = null;

    // If manual assignment provided
    if (assignedTo) {
      const user = await UserModel.findById(assignedTo);
      if (user) {
        assignedUser = user;
        finalAssignedTo = user._id.toString();
      }
    } else {
      // Auto-assign based on language
      assignedUser = await getNextUserForLanguage(language);
      finalAssignedTo = assignedUser ? assignedUser._id.toString() : null;
    }

    const lead = await LeadModel.create({
      name,
      email,
      source,
      date: date || new Date(),
      location,
      language,
      assignedTo: finalAssignedTo
    });

    // Update user's assigned count (for whichever user got it)
    if (assignedUser) {
      await UserModel.incrementAssignedLeads(assignedUser._id.toString());

      // Create activity
      await ActivityModel.create({
        type: 'lead_assigned',
        description: `Lead ${name} was assigned to ${assignedUser.firstName} ${assignedUser.lastName}`,
        userId: assignedUser._id.toString(),
        leadId: lead._id.toString()
      });
    }

    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lead', message: error.message });
  }
});

// Get conversion rate (Leads closed in last 7 days)
router.get('/analytics/conversion-rate', authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all leads updated in last 7 days with status 'Closed'
    // Since we don't track exact "closedAt" in LeadModel unless we parse activity, 
    // we will approximate by checking leads that are currently closed.
    // Ideally we would query ActivityModel for 'lead_updated' with description 'closed' in last 7 days.

    // Better approach: Query ActivityModel
    const activities = await ActivityModel.findAll({
      type: 'lead_updated',
      createdAt: { $gte: sevenDaysAgo }
    });

    // Filter for "closed" in description
    const closedCount = activities.filter(a => a.description.toLowerCase().includes('was closed')).length;

    res.json({ closedCount });

    /* 
       Alternative if ActivityModel doesn't support rich query args in this mock/setup:
       Fetch all closed leads and check if they look recent? No, that's inaccurate.
       We will rely on the fact that we log 'lead_updated' when closing.
    */
  } catch (error) {
    console.error('Conversion rate error:', error);
    // Fallback: Return 0 or simple count of all closed leads if DB doesn't support time query well
    const allClosed = await LeadModel.findAll({ status: 'Closed' });
    res.json({ closedCount: allClosed.length });
  }
});

// Get conversion rate (Leads closed in last 7 days)
router.get('/analytics/conversion-rate', authenticate, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all activities
    const allActivities = await ActivityModel.findAll();

    // Filter in memory for safety
    const recentClosed = allActivities.filter(a => {
      const isType = a.type === 'lead_updated';
      const isClosed = a.description && a.description.toLowerCase().includes('was closed');
      const isRecent = new Date(a.createdAt) >= sevenDaysAgo;
      return isType && isClosed && isRecent;
    });

    res.json({ closedCount: recentClosed.length });
  } catch (error) {
    console.error('Conversion rate error:', error);
    res.status(500).json({ error: 'Failed to fetch conversion rate' });
  }
});
// Upload CSV (Admin only)
router.post('/upload-csv', authenticate, adminOnly, async (req, res) => {
  try {
    // Manual file upload handling
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('text/csv')) {
      return res.status(400).json({ error: 'Invalid file type. CSV file required.' });
    }

    // Read the raw body
    let csvData = '';
    req.on('data', chunk => {
      csvData += chunk.toString();
    });

    req.on('end', async () => {
      try {
        // Save to temp file
        const fileName = `leads_${Date.now()}.csv`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, csvData);

        // Parse CSV
        const parsedData = await parseCSV(filePath);

        // Validate structure
        const validation = validateCSVStructure(parsedData);
        if (!validation.isValid) {
          fs.unlinkSync(filePath);
          return res.status(400).json({ error: 'Invalid CSV data', errors: validation.errors });
        }

        // Assign leads to users
        const assignedLeads = await assignLeadsToUsers(parsedData);

        // Bulk insert using Promise.all for performance
        const insertPromises = assignedLeads.map(async (lead) => {
          const createdLead = await LeadModel.create(lead);

          // Update user's assigned count
          if (lead.assignedTo) {
            await UserModel.incrementAssignedLeads(lead.assignedTo);
          }

          return createdLead;
        });

        await Promise.all(insertPromises);

        // Clean up temp file
        fs.unlinkSync(filePath);

        res.json({
          message: `Successfully uploaded ${assignedLeads.length} leads`,
          count: assignedLeads.length
        });
      } catch (error) {
        res.status(500).json({ error: 'CSV processing failed', message: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Update lead (for sales users)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { type, status, scheduledDate } = req.body;

    const lead = await LeadModel.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Check if lead is assigned to current user (unless admin)
    if (req.user.role !== 'admin' && lead.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this lead' });
    }

    // Validate scheduled lead closure
    if (status === 'Closed' && lead.scheduledDate) {
      const now = new Date();
      if (now < lead.scheduledDate) {
        return res.status(400).json({ error: 'Lead cannot be closed before scheduled time' });
      }
    }

    const updateData = {};
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;

    const success = await LeadModel.update(req.params.id, updateData);

    if (!success) {
      return res.status(400).json({ error: 'No changes made' });
    }

    // If closed, increment closed count
    if (status === 'Closed' && lead.status !== 'Closed') {
      await UserModel.incrementClosedLeads(lead.assignedTo.toString());

      // Create activity
      await ActivityModel.create({
        type: 'lead_updated',
        description: `Lead ${lead.name} was closed`,
        userId: lead.assignedTo.toString(),
        leadId: lead._id.toString()
      });
    }

    const updatedLead = await LeadModel.findById(req.params.id);
    res.json(updatedLead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead', message: error.message });
  }
});

// Assign lead to employee (Admin only)
router.put('/:id/assign', authenticate, adminOnly, async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const lead = await LeadModel.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Get the user being assigned to
    const user = await UserModel.findById(assignedTo);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If previously assigned, decrement old user's count
    if (lead.assignedTo) {
      await UserModel.decrementAssignedLeads(lead.assignedTo.toString());
    }

    // Update lead assignment
    await LeadModel.update(req.params.id, { assignedTo });

    // Increment new user's count
    await UserModel.incrementAssignedLeads(assignedTo);

    // Create activity
    await ActivityModel.create({
      type: 'lead_assigned',
      description: `Lead ${lead.name} was assigned to ${user.firstName} ${user.lastName}`,
      userId: assignedTo,
      leadId: lead._id.toString()
    });

    const updatedLead = await LeadModel.findById(req.params.id);
    res.json(updatedLead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign lead', message: error.message });
  }
});

export default router;
