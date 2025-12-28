import express from 'express';
import { UserModel } from '../models/User.js';
import { ActivityModel } from '../models/Activity.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Get all users (paginated)
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const status = req.query.status;

    const filters = {};
    if (status) filters.status = status;

    const result = await UserModel.findPaginated(page, limit, filters);

    // START: Add Timing Status Logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const db = (await import('../config/db.js')).getDB();

    // Get list of user IDs from the result
    const userIds = result.users.map(u => u._id);

    // Fetch timings for these users for today (Fetching all for today to avoid ID type mismatch, then matching in memory)
    const timings = await db.collection('timings').find({
      date: today
    }).toArray();

    // Map timings
    const timingMap = {};
    timings.forEach(t => {
      timingMap[t.userId.toString()] = t; // Ensure we match string to string
    });

    // Attach timingStatus to users
    result.users = result.users.map(user => {
      const timing = timingMap[user._id.toString()];
      let timingStatus = 'Inactive';

      // Logic matching dashboard active-sales:
      // Active if checked in, AND not checked out (On Break is also considered Active/Green per user request)
      if (timing && timing.checkInTime && !timing.checkOutTime) {
        timingStatus = 'Active';
      }

      return {
        ...user,
        timingStatus
      };
    });
    // END: Add Timing Status Logic

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// Search users by name
router.get('/search', authenticate, async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const users = await UserModel.searchByName(searchTerm);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Get single user
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// Create user (Admin only)
router.post('/', authenticate, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, location, language } = req.body;

    if (!firstName || !lastName || !email || !language) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await UserModel.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      location,
      language,
      role: 'sales'
    });

    // Create activity
    await ActivityModel.create({
      type: 'employee_created',
      description: `New employee ${firstName} ${lastName} was added`,
      userId: user._id.toString()
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user', message: error.message });
  }
});

// Update user
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, location, password } = req.body;

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (location) updateData.location = location;
    if (password) updateData.password = password;

    const success = await UserModel.update(req.params.id, updateData);

    if (!success) {
      return res.status(404).json({ error: 'User not found or no changes made' });
    }

    const updatedUser = await UserModel.findById(req.params.id);
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', message: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const success = await UserModel.delete(req.params.id);

    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user', message: error.message });
  }
});

// Bulk delete users (Admin only)
router.post('/bulk-delete', authenticate, adminOnly, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid ids array' });
    }

    const deletedCount = await UserModel.bulkDelete(ids);

    res.json({
      message: `${deletedCount} user(s) deleted successfully`,
      deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete users', message: error.message });
  }
});

export default router;
