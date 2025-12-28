import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import crypto from 'crypto';

const COLLECTION = 'users';

// Hash password using native crypto
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Generate unique employee ID (format: #23454GH + 6 random chars)
const generateEmployeeId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `#23454GH${randomPart}`;
};

export const UserModel = {
  // Create user
  async create(userData) {
    const db = getDB();

    const user = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.toLowerCase(),
      password: hashPassword(userData.password || userData.email), // Default password is email
      role: userData.role || 'sales', // 'admin' or 'sales'
      employeeId: generateEmployeeId(),
      location: userData.location || '',
      language: userData.language || 'English',
      status: 'Active',
      assignedLeads: 0,
      closedLeads: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(COLLECTION).insertOne(user);
    return { ...user, _id: result.insertedId };
  },

  // Find user by email
  async findByEmail(email) {
    const db = getDB();
    return await db.collection(COLLECTION).findOne({ email: email.toLowerCase() });
  },

  // Find user by ID
  async findById(id) {
    const db = getDB();
    return await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  },

  // Get all users with filters
  async findAll(filters = {}) {
    const db = getDB();
    const query = {};

    if (filters.status) query.status = filters.status;
    if (filters.role) query.role = filters.role;
    if (filters.language) query.language = filters.language;

    return await db.collection(COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  },

  // Get paginated users
  async findPaginated(page = 1, limit = 8, filters = {}) {
    const db = getDB();
    const query = {};

    if (filters.status) query.status = filters.status;
    if (filters.role) query.role = filters.role;

    const skip = (page - 1) * limit;

    const users = await db.collection(COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection(COLLECTION).countDocuments(query);

    return {
      users,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  },

  // Update user (excluding email and language)
  async update(id, updateData) {
    const db = getDB();

    const allowedUpdates = {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      location: updateData.location,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key =>
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    if (updateData.password) {
      allowedUpdates.password = hashPassword(updateData.password);
    }

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: allowedUpdates }
    );

    return result.modifiedCount > 0;
  },

  // Delete user
  async delete(id) {
    const db = getDB();
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  },

  // Bulk delete users
  async bulkDelete(ids) {
    const db = getDB();
    const objectIds = ids.map(id => new ObjectId(id));
    const result = await db.collection(COLLECTION).deleteMany({ _id: { $in: objectIds } });
    return result.deletedCount;
  },

  // Verify password
  verifyPassword(inputPassword, hashedPassword) {
    return hashPassword(inputPassword) === hashedPassword;
  },

  // Increment assigned leads
  async incrementAssignedLeads(userId) {
    const db = getDB();
    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { assignedLeads: 1 } }
    );
  },

  // Increment closed leads
  async incrementClosedLeads(userId) {
    const db = getDB();
    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { closedLeads: 1 } }
    );
  },

  // Decrement assigned leads (when reassigning)
  async decrementAssignedLeads(userId) {
    const db = getDB();
    await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(userId) },
      { $inc: { assignedLeads: -1 } }
    );
  },

  // Get active sales people count
  async getActiveSalesCount() {
    const db = getDB();
    return await db.collection(COLLECTION).countDocuments({
      role: 'sales',
      status: 'Active'
    });
  },

  // Search users by name
  async searchByName(searchTerm) {
    const db = getDB();
    const regex = new RegExp(searchTerm, 'i');

    return await db.collection(COLLECTION).find({
      $or: [
        { firstName: regex },
        { lastName: regex }
      ]
    }).toArray();
  }
};
