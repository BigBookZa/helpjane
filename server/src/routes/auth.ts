import express from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { ActivityLogger } from '../utils/activityLogger';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', { 
      body: req.body, 
      headers: req.headers,
      ip: req.ip 
    });

    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      console.log('Validation failed: missing fields');
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      console.log('Validation failed: password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    console.log('Creating new user...');
    // Create user
    const user = await UserModel.create({ name, email, password });
    console.log('User created successfully:', user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Log activity
    ActivityLogger.log(user.id, 'user_registered', 'user', user.id, {
      email: user.email,
      name: user.name
    }, req.ip, req.get('User-Agent'));

    console.log('Registration successful for:', email);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Authenticate user
    const user = await UserModel.authenticate(email, password);
    if (!user) {
      console.log('Authentication failed for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Log activity
    ActivityLogger.log(user.id, 'user_login', 'user', user.id, {
      email: user.email
    }, req.ip, req.get('User-Agent'));

    console.log('Login successful for:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // But we can log the activity if user info is available
  res.json({ message: 'Logout successful' });
});

export default router;