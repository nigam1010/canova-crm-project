import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

const COLLECTION = 'timings';

export const TimingModel = {
  // Create or update check-in
  async checkIn(userId) {
    const db = getDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timing = {
      userId: new ObjectId(userId),
      date: today,
      checkInTime: new Date(),
      checkOutTime: null,
      breaks: [],
      currentBreakStart: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection(COLLECTION).insertOne(timing);
    return { ...timing, _id: result.insertedId };
  },

  // Update check-out
  async checkOut(userId) {
    const db = getDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db.collection(COLLECTION).updateOne(
      {
        userId: new ObjectId(userId),
        date: today,
        checkOutTime: null
      },
      {
        $set: {
          checkOutTime: new Date(),
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  },

  // Start break
  async startBreak(userId) {
    const db = getDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await db.collection(COLLECTION).updateOne(
      {
        userId: new ObjectId(userId),
        date: today
      },
      {
        $set: {
          currentBreakStart: new Date(),
          updatedAt: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  },

  // End break
  async endBreak(userId) {
    const db = getDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timing = await db.collection(COLLECTION).findOne({
      userId: new ObjectId(userId),
      date: today
    });

    if (timing && timing.currentBreakStart) {
      const breakEntry = {
        startTime: timing.currentBreakStart,
        endTime: new Date()
      };

      const result = await db.collection(COLLECTION).updateOne(
        { _id: timing._id },
        {
          $push: { breaks: breakEntry },
          $set: {
            currentBreakStart: null,
            updatedAt: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    }

    return false;
  },

  // Get today's timing
  async getTodayTiming(userId) {
    const db = getDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await db.collection(COLLECTION).findOne({
      userId: new ObjectId(userId),
      date: today
    });
  },

  // Get today's break logs (Recent 5)
  async getPastBreakLogs(userId) {
    const db = getDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timing = await db.collection(COLLECTION).findOne(
      {
        userId: new ObjectId(userId),
        date: today
      }
    );

    if (!timing) return [];

    // Get last 5 breaks and reverse to show most recent first
    const recentBreaks = (timing.breaks || []).slice(-5).reverse();

    // Return as an array of logs (to maintain frontend compatibility)
    // showing only today's date and the Recent 5 breaks
    return [{
      ...timing,
      breaks: recentBreaks,
      date: today
    }];
  }
};
