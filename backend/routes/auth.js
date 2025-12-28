import express from 'express';
import { UserModel } from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isPasswordValid = UserModel.verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user._id.toString(), user.email);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Register (for creating default admin)
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    const existingUser = await UserModel.findByEmail(email);
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'admin'
    });
    
    const token = generateToken(user._id.toString(), user.email);
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

export default router;
