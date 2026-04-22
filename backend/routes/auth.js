import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser, getUserByEmail, getUserByUsername,
  getUserTransactions, getUserAttempts,
} from '../services/store.js';
import { authMiddleware, signToken } from '../middleware/auth.js';

const router = express.Router();

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, walletAddress } = req.body;

    // Validate
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3–20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (getUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (getUserByUsername(username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({
      id: uuidv4(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      walletAddress: walletAddress || '',
    });

    const token = signToken(user.id);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: safeUser(user),
    });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const user = emailOrUsername.includes('@')
      ? getUserByEmail(emailOrUsername)
      : getUserByUsername(emailOrUsername);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastLoginAt = new Date().toISOString();
    const token = signToken(user.id);

    res.json({ message: 'Login successful!', token, user: safeUser(user) });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET PROFILE ───────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { walletAddress, currentPassword, newPassword } = req.body;
    const user = req.user;

    if (walletAddress !== undefined) user.walletAddress = walletAddress;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required to change password' });
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
      if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    res.json({ message: 'Profile updated', user: safeUser(user) });
  } catch (e) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// ── GET HISTORY ───────────────────────────────────────────────────────────────
router.get('/me/history', authMiddleware, (req, res) => {
  const attempts = getUserAttempts(req.user.id).slice(0, 50);
  res.json({ attempts });
});

router.get('/me/transactions', authMiddleware, (req, res) => {
  const txs = getUserTransactions(req.user.id).slice(0, 50);
  res.json({ transactions: txs });
});

// Helper: strip sensitive fields
function safeUser(user) {
  const { passwordHash, ...safe } = user;
  safe.accuracy = user.totalAnswers > 0
    ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 0;
  return safe;
}

export default router;
