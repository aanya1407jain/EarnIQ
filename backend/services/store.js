// ─────────────────────────────────────────────────────────────────────────────
// In-memory store (replace with PostgreSQL / MongoDB in production)
// ─────────────────────────────────────────────────────────────────────────────

export const users = new Map();           // id → user
export const usersByEmail = new Map();    // email → user
export const usersByUsername = new Map(); // username → user
export const sessions = new Map();        // token → userId
export const transactions = [];           // payment history
export const quizAttempts = [];           // attempt history

// ── ACHIEVEMENTS ──────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id: 'first_correct',   icon: '🎯', name: 'First Blood',       desc: 'Get your first correct answer',              condition: s => s.correctAnswers >= 1 },
  { id: 'streak_3',        icon: '🔥', name: 'On Fire',           desc: '3 correct answers in a row',                 condition: s => s.streak >= 3 },
  { id: 'streak_5',        icon: '⚡', name: 'Lightning',         desc: '5 correct answers in a row',                 condition: s => s.streak >= 5 },
  { id: 'streak_10',       icon: '🌪️', name: 'Unstoppable',       desc: '10 correct answers in a row',                condition: s => s.streak >= 10 },
  { id: 'earn_1',          icon: '💵', name: 'Dollar Earner',      desc: 'Earn $1.00 total',                           condition: s => s.totalEarned >= 1.00 },
  { id: 'earn_5',          icon: '💰', name: 'High Roller',        desc: 'Earn $5.00 total',                           condition: s => s.totalEarned >= 5.00 },
  { id: 'hard_master',     icon: '🧠', name: 'Hard Mode Master',   desc: 'Answer 5 hard questions correctly',          condition: s => (s.difficultyStats?.hard?.correct || 0) >= 5 },
  { id: 'polymath',        icon: '🎓', name: 'Polymath',           desc: 'Answer correctly in 3 different subjects',   condition: s => Object.keys(s.subjectStats || {}).filter(k => (s.subjectStats[k].correct || 0) > 0).length >= 3 },
  { id: 'speed_demon',     icon: '💨', name: 'Speed Demon',        desc: 'Answer correctly in under 15 seconds',       condition: s => s.fastestCorrect && s.fastestCorrect <= 15 },
  { id: 'perfect_10',      icon: '🌟', name: 'Perfect 10',         desc: 'Get 10 correct answers total',               condition: s => s.correctAnswers >= 10 },
  { id: 'accuracy_ace',    icon: '🎪', name: 'Accuracy Ace',       desc: 'Maintain 80%+ accuracy over 10+ answers',   condition: s => s.totalAnswers >= 10 && (s.correctAnswers / s.totalAnswers) >= 0.8 },
  { id: 'coding_wizard',   icon: '🧙', name: 'Coding Wizard',      desc: 'Answer 3 coding questions correctly',        condition: s => (s.typeStats?.coding?.correct || 0) >= 3 },
];

// ── USER HELPERS ──────────────────────────────────────────────────────────────
export function createUser({ id, username, email, passwordHash, walletAddress }) {
  const now = new Date().toISOString();
  const user = {
    id, username, email, passwordHash, walletAddress,
    createdAt: now, lastLoginAt: now,
    // Student stats
    totalEarned: 0, dailyEarned: 0, lastResetDate: new Date().toDateString(),
    correctAnswers: 0, totalAnswers: 0, streak: 0, bestStreak: 0,
    fastestCorrect: null,
    achievements: [],
    subjectStats: {},    // { JavaScript: { correct, total } }
    difficultyStats: {}, // { easy: { correct, total } }
    typeStats: {},       // { mcq: { correct, total } }
    xp: 0, level: 1,
    weeklyEarned: 0, lastWeekReset: getWeekKey(),
  };
  users.set(id, user);
  usersByEmail.set(email.toLowerCase(), user);
  usersByUsername.set(username.toLowerCase(), user);
  return user;
}

export function getUser(id) { return users.get(id); }
export function getUserByEmail(email) { return usersByEmail.get(email.toLowerCase()); }
export function getUserByUsername(username) { return usersByUsername.get(username.toLowerCase()); }

export function updateUserStats(userId, { isCorrect, difficulty, subject, type, timeTaken, rewardAmount }) {
  const user = users.get(userId);
  if (!user) return;

  // Reset daily/weekly if needed
  if (user.lastResetDate !== new Date().toDateString()) {
    user.dailyEarned = 0;
    user.lastResetDate = new Date().toDateString();
  }
  if (user.lastWeekReset !== getWeekKey()) {
    user.weeklyEarned = 0;
    user.lastWeekReset = getWeekKey();
  }

  user.totalAnswers += 1;

  // Subject stats
  if (!user.subjectStats[subject]) user.subjectStats[subject] = { correct: 0, total: 0 };
  user.subjectStats[subject].total += 1;

  // Difficulty stats
  if (!user.difficultyStats[difficulty]) user.difficultyStats[difficulty] = { correct: 0, total: 0 };
  user.difficultyStats[difficulty].total += 1;

  // Type stats
  if (!user.typeStats[type]) user.typeStats[type] = { correct: 0, total: 0 };
  user.typeStats[type].total += 1;

  if (isCorrect) {
    user.correctAnswers += 1;
    user.streak += 1;
    user.bestStreak = Math.max(user.bestStreak, user.streak);
    user.subjectStats[subject].correct = (user.subjectStats[subject].correct || 0) + 1;
    user.difficultyStats[difficulty].correct = (user.difficultyStats[difficulty].correct || 0) + 1;
    user.typeStats[type].correct = (user.typeStats[type].correct || 0) + 1;

    if (timeTaken && (!user.fastestCorrect || timeTaken < user.fastestCorrect)) {
      user.fastestCorrect = timeTaken;
    }

    if (rewardAmount) {
      user.totalEarned += rewardAmount;
      user.dailyEarned += rewardAmount;
      user.weeklyEarned += rewardAmount;
    }

    // XP system: easy=10, medium=25, hard=50, streak bonus
    const xpMap = { easy: 10, medium: 25, hard: 50 };
    let xpGain = xpMap[difficulty] || 10;
    if (user.streak % 5 === 0) xpGain *= 2; // Double XP every 5 streak
    user.xp += xpGain;
    user.level = Math.floor(user.xp / 200) + 1;
  } else {
    user.streak = 0;
  }

  // Check achievements
  const newAchievements = [];
  for (const ach of ACHIEVEMENTS) {
    if (!user.achievements.find(a => a.id === ach.id) && ach.condition(user)) {
      user.achievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      newAchievements.push(ach);
    }
  }

  return newAchievements;
}

export function recordTransaction(tx) {
  transactions.push({ ...tx, timestamp: new Date().toISOString() });
}

export function recordAttempt(attempt) {
  quizAttempts.push({ ...attempt, timestamp: new Date().toISOString() });
}

export function getLeaderboard(type = 'allTime') {
  const allUsers = Array.from(users.values());
  const sorted = allUsers.sort((a, b) => {
    if (type === 'weekly') return b.weeklyEarned - a.weeklyEarned;
    if (type === 'accuracy') {
      const accA = a.totalAnswers > 0 ? a.correctAnswers / a.totalAnswers : 0;
      const accB = b.totalAnswers > 0 ? b.correctAnswers / b.totalAnswers : 0;
      return accB - accA;
    }
    return b.totalEarned - a.totalEarned;
  });
  return sorted.slice(0, 20).map(u => ({
    username: u.username,
    totalEarned: u.totalEarned,
    weeklyEarned: u.weeklyEarned,
    correctAnswers: u.correctAnswers,
    totalAnswers: u.totalAnswers,
    streak: u.streak,
    bestStreak: u.bestStreak,
    level: u.level,
    xp: u.xp,
    accuracy: u.totalAnswers > 0 ? Math.round((u.correctAnswers / u.totalAnswers) * 100) : 0,
    achievements: u.achievements.length,
  }));
}

export function getUserTransactions(userId) {
  return transactions.filter(t => t.userId === userId).reverse();
}

export function getUserAttempts(userId) {
  return quizAttempts.filter(a => a.userId === userId).reverse();
}

function getWeekKey() {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}
