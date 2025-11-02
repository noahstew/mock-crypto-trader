import type { Request, Response, NextFunction } from 'express';
import { getUserFromToken } from '../services/auth.js';

export default function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing token' });

  const token = auth.slice(7);
  const user = getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  // attach to request for handlers
  (req as any).user = user;
  next();
}
