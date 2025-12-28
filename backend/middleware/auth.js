import crypto from 'crypto';
import { UserModel } from '../models/User.js';

// Simple token generation
const generateToken = (userId, email) => {
  const payload = JSON.stringify({ userId, email, timestamp: Date.now() });
  return Buffer.from(payload).toString('base64');
};

// Verify token
const verifyToken = (token) => {
  try {
    const payload = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
};

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Admin only middleware
export const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

export { generateToken, verifyToken };
