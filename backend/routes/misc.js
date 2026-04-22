import express from 'express';
import { getLeaderboard, users } from '../services/store.js';
import { getWalletBalance, getLocusTransactions, REWARDS, DAILY_LIMITS } from '../services/locus.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
router.get('/leaderboard', (req, res) => {
  const { type = 'allTime' } = req.query;
  const board = getLeaderboard(type);
  res.json({ leaderboard: board, type });
});

// ── PAYMENT CONFIG ────────────────────────────────────────────────────────────
router.get('/payment/config', (req, res) => {
  res.json({ rewards: REWARDS, dailyLimits: DAILY_LIMITS, currency: 'USDC', network: 'Base' });
});

router.get('/payment/balance', async (req, res) => {
  try { res.json(await getWalletBalance()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/payment/transactions', authMiddleware, async (req, res) => {
  try { res.json(await getLocusTransactions()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PLATFORM STATS ────────────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const allUsers = Array.from(users.values());
  const totalEarned = allUsers.reduce((s, u) => s + u.totalEarned, 0);
  const totalAnswers = allUsers.reduce((s, u) => s + u.totalAnswers, 0);
  const totalCorrect = allUsers.reduce((s, u) => s + u.correctAnswers, 0);
  res.json({
    totalStudents: allUsers.length,
    totalEarned: parseFloat(totalEarned.toFixed(4)),
    totalAnswers,
    totalCorrect,
    overallAccuracy: totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0,
  });
});

export default router;
