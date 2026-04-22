import jwt from 'jsonwebtoken';
import { getUser } from '../services/store.js';

const SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET);
    const user = getUser(decoded.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const decoded = jwt.verify(token, SECRET);
      req.user = getUser(decoded.userId);
    } catch (_) {}
  }
  next();
}

export function signToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}
