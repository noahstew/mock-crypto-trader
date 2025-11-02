import express from 'express';
import type { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await registerUser(username, password);
    res.status(201).json({ username: user.username });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const token = await loginUser(username, password);
    res.json({ token, username });
  } catch (err: any) {
    res.status(401).json({ error: err?.message || 'Invalid credentials' });
  }
});

// GET /auth/me (protected)
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  // authMiddleware attaches user to req.user
  res.json({ user: (req as any).user });
});

export default router;
