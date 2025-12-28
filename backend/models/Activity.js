import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

const COLLECTION = 'activities';

export const ActivityModel = {
  // Create activity
  async create(activityData) {
    const db = getDB();

    const activity = {
      type: activityData.type, // 'lead_assigned', 'lead_updated', 'employee_created', etc.
      description: activityData.description,
      userId: activityData.userId ? new ObjectId(activityData.userId) : null,
      leadId: activityData.leadId ? new ObjectId(activityData.leadId) : null,
      metadata: activityData.metadata || {},
      createdAt: new Date()
    };

    const result = await db.collection(COLLECTION).insertOne(activity);
    return { ...activity, _id: result.insertedId };
  },

  // Get recent activities (last 7)
  async getRecent(limit = 7) {
    const db = getDB();
    return await db.collection(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  },

  // Get activities for a specific user
  async getByUser(userId, limit = 7) {
    const db = getDB();
    return await db.collection(COLLECTION)
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
};
