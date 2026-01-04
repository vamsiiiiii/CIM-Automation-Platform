const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validateRequest } = require('../middleware/validation');
const Joi = require('joi');

const prisma = new PrismaClient();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('ADMIN', 'MANAGER', 'ANALYST').optional()
});

router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // DEMO MODE: Find user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user && email.toLowerCase() === 'demo@example.com') {
      // If demo user is missing from DB (shouldn't happen with seed, but stay safe),
      // we use the seeded ID to ensure companies match.
      user = {
        id: 'b4a8131b-6ff7-4797-bf0b-d4ad0f008c56',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'MANAGER'
      };
    } else if (!user) {
      console.log('User not in DB, creating guest demo session');
      user = {
        id: 'mock-' + Math.random().toString(36).substring(7),
        email,
        firstName: 'Guest',
        lastName: 'User',
        role: 'ANALYST'
      };
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-demo';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    console.log('Login successful for:', email, 'ID:', user.id);
    res.json({
      message: 'Login successful (Demo Mode)',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'ANALYST' } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName, role }
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-for-demo',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ message: 'User created', token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-for-demo');

    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;