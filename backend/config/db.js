import { MongoClient } from 'mongodb';

let db = null;
let client = null;

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('canovacrm');
    
    console.log('✅ MongoDB Atlas Connected');
    
    // Create indexes
    await createIndexes();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // Lead indexes for performance
    await db.collection('leads').createIndex({ language: 1 });
    await db.collection('leads').createIndex({ assignedTo: 1 });
    await db.collection('leads').createIndex({ status: 1 });
    await db.collection('leads').createIndex({ createdAt: -1 });
    
    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ employeeId: 1 }, { unique: true });
    
    // Activity indexes
    await db.collection('activities').createIndex({ createdAt: -1 });
    
    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('⚠️ Index creation warning:', error.message);
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

export const closeDB = async () => {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
};
