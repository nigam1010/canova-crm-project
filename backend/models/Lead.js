import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

const COLLECTION = 'leads';

// Generate unique assignment ID
const generateAssignmentId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `#ASN${Date.now().toString(36).toUpperCase().slice(-6)}${randomPart}`;
};

export const LeadModel = {
  // Create single lead
  async create(leadData) {
    const db = getDB();

    const lead = {
      name: leadData.name,
      email: leadData.email,
      source: leadData.source,
      date: new Date(leadData.date),
      location: leadData.location,
      language: leadData.language,
      assignedTo: leadData.assignedTo ? new ObjectId(leadData.assignedTo) : null,
      assignmentId: leadData.assignedTo ? generateAssignmentId() : null,
      status: leadData.status || 'Ongoing',
      type: leadData.type || null, // Hot, Warm, Cold
      scheduledDate: leadData.scheduledDate ? new Date(leadData.scheduledDate) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(COLLECTION).insertOne(lead);
    return { ...lead, _id: result.insertedId };
  },

  // Bulk create leads
  async bulkCreate(leadsArray) {
    const db = getDB();

    const leads = leadsArray.map(lead => ({
      name: lead.name,
      email: lead.email,
      source: lead.source,
      date: new Date(lead.date),
      location: lead.location,
      language: lead.language,
      assignedTo: lead.assignedTo ? new ObjectId(lead.assignedTo) : null,
      assignmentId: lead.assignedTo ? generateAssignmentId() : null,
      status: 'Ongoing',
      type: null,
      scheduledDate: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const result = await db.collection(COLLECTION).insertMany(leads);
    return result.insertedCount;
  },

  // Find lead by ID
  async findById(id) {
    const db = getDB();
    return await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  },

  // Get all leads
  async findAll(filters = {}) {
    const db = getDB();
    const query = {};

    if (filters.assignedTo) query.assignedTo = new ObjectId(filters.assignedTo);
    if (filters.status) query.status = filters.status;
    if (filters.language) query.language = filters.language;
    if (filters.type) query.type = filters.type;

    return await db.collection(COLLECTION)
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  },

  // Get leads assigned to user
  async findByAssignedUser(userId) {
    const db = getDB();
    return await db.collection(COLLECTION)
      .find({ assignedTo: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  },

  // Update lead
  async update(id, updateData) {
    const db = getDB();

    const updates = {
      updatedAt: new Date()
    };

    if (updateData.type !== undefined) updates.type = updateData.type;
    if (updateData.status !== undefined) updates.status = updateData.status;
    if (updateData.scheduledDate !== undefined) {
      updates.scheduledDate = updateData.scheduledDate ? new Date(updateData.scheduledDate) : null;
    }
    if (updateData.assignedTo !== undefined) {
      updates.assignedTo = new ObjectId(updateData.assignedTo);
      updates.assignmentId = generateAssignmentId();
    }

    const result = await db.collection(COLLECTION).updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    return result.modifiedCount > 0;
  },

  // Get unassigned leads count
  async getUnassignedCount() {
    const db = getDB();
    return await db.collection(COLLECTION).countDocuments({ assignedTo: null });
  },

  // Get leads assigned this week
  async getAssignedThisWeekCount() {
    const db = getDB();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return await db.collection(COLLECTION).countDocuments({
      assignedTo: { $ne: null },
      createdAt: { $gte: startOfWeek }
    });
  },

  // Get conversion rate
  async getConversionRate() {
    const db = getDB();

    const totalAssigned = await db.collection(COLLECTION).countDocuments({
      assignedTo: { $ne: null }
    });

    const totalClosed = await db.collection(COLLECTION).countDocuments({
      status: 'Closed'
    });

    return totalAssigned > 0 ? Math.round((totalClosed / totalAssigned) * 100) : 0;
  },

  // Get conversion data for graph (last 2 weeks)
  async getConversionGraphData() {
    const db = getDB();

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 13);
    startDate.setHours(0, 0, 0, 0);

    const leads = await db.collection(COLLECTION)
      .find({ createdAt: { $gte: startDate, $lte: today } })
      .toArray();

    // Prepare 14-day map
    const dayMap = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const key = d.toISOString().split('T')[0];
      dayMap[key] = { total: 0, closed: 0, dateObj: d };
    }

    // Fill data
    leads.forEach(lead => {
      const key = lead.createdAt.toISOString().split('T')[0];
      if (dayMap[key]) {
        dayMap[key].total++;
        if (lead.status === 'Closed') {
          dayMap[key].closed++;
        }
      }
    });

    // Return ordered 14-day array WITH DAY NAMES
    return Object.keys(dayMap).map(key => ({
      day: dayMap[key].dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      rate: dayMap[key].total > 0
        ? Math.round((dayMap[key].closed / dayMap[key].total) * 100)
        : 0
    }));
  },
  // Get scheduled leads with filters
  async getScheduledLeads(userId, filter = 'All') {
    const db = getDB();
    const query = {
      assignedTo: new ObjectId(userId),
      scheduledDate: { $ne: null }
    };

    if (filter === 'Today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      query.scheduledDate = {
        $gte: today,
        $lt: tomorrow
      };
    }

    return await db.collection(COLLECTION)
      .find(query)
      .sort({ scheduledDate: 1 })
      .toArray();
  },

  // Get lead count by user
  async getLeadCountByUser(userId) {
    const db = getDB();
    return await db.collection(COLLECTION).countDocuments({
      assignedTo: new ObjectId(userId)
    });
  }
};
