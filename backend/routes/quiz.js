import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { evaluateAnswer, generateQuestion, generateStudyTip } from '../agents/evaluator.js';
import { sendReward, REWARDS, DAILY_LIMITS } from '../services/locus.js';
import { updateUserStats, recordTransaction, recordAttempt, getUser } from '../services/store.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ── QUESTION BANK ─────────────────────────────────────────────────────────────
export const QUESTION_BANK = [
  // JavaScript
  {
    id: 'js1', subject: 'JavaScript', difficulty: 'easy', type: 'mcq',
    question: 'What does `typeof null` return in JavaScript?',
    options: ['A) "null"', 'B) "object"', 'C) "undefined"', 'D) "number"'],
    correctAnswer: 'B) "object"',
    explanation: 'A known legacy bug in JavaScript — typeof null returns "object".',
    concept: 'JavaScript type system',
  },
  {
    id: 'js2', subject: 'JavaScript', difficulty: 'medium', type: 'mcq',
    question: 'Which of the following creates a closure in JavaScript?',
    options: ['A) A function inside another function', 'B) An if statement', 'C) A for loop', 'D) A switch statement'],
    correctAnswer: 'A) A function inside another function',
    explanation: 'A closure is formed when a function retains access to variables from its outer scope.',
    concept: 'Closures',
  },
  {
    id: 'js3', subject: 'JavaScript', difficulty: 'hard', type: 'open',
    question: 'Explain the JavaScript event loop. How do the call stack, callback queue, and microtask queue interact?',
    correctAnswer: 'Call stack runs synchronous code. Microtask queue (Promises) runs before callback queue (setTimeout). Event loop moves tasks from queues to stack when stack is empty.',
    explanation: 'The event loop enables non-blocking I/O by offloading async operations.',
    concept: 'Event loop / async JavaScript',
  },
  {
    id: 'js4', subject: 'JavaScript', difficulty: 'medium', type: 'coding',
    question: 'Write a function `debounce(fn, delay)` that returns a debounced version of `fn` that only fires after `delay` ms of inactivity.',
    starterCode: 'function debounce(fn, delay) {\n  // your code here\n}',
    correctAnswer: 'function debounce(fn, delay) {\n  let timer;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}',
    explanation: 'Use clearTimeout + setTimeout to reset the timer on each call.',
    concept: 'Debounce / Higher-order functions',
  },
  // Python
  {
    id: 'py1', subject: 'Python', difficulty: 'easy', type: 'mcq',
    question: 'What is the output of `print(type([]))` in Python?',
    options: ['A) <class \'array\'>', 'B) <class \'list\'>', 'C) <class \'tuple\'>', 'D) <class \'dict\'>'],
    correctAnswer: 'B) <class \'list\'>',
    explanation: '[] is a list literal in Python.',
    concept: 'Python data types',
  },
  {
    id: 'py2', subject: 'Python', difficulty: 'medium', type: 'coding',
    question: 'Write a Python function `flatten(lst)` that flattens a nested list of any depth. Example: flatten([1,[2,[3,4]],5]) → [1,2,3,4,5]',
    starterCode: 'def flatten(lst):\n    # your code here\n    pass',
    correctAnswer: 'def flatten(lst):\n    result = []\n    for item in lst:\n        if isinstance(item, list):\n            result.extend(flatten(item))\n        else:\n            result.append(item)\n    return result',
    explanation: 'Recursively check each element; if it\'s a list, flatten it first.',
    concept: 'Recursion / list manipulation',
  },
  {
    id: 'py3', subject: 'Python', difficulty: 'hard', type: 'open',
    question: 'What is the difference between `__str__` and `__repr__` in Python? When would you implement each?',
    correctAnswer: '__str__ is for human-readable output (used by print). __repr__ is for unambiguous developer representation (used in REPL, debugging). __repr__ should ideally return code that can recreate the object.',
    explanation: 'Both are dunder methods for string representation with different purposes.',
    concept: 'Python dunder methods',
  },
  // Computer Science
  {
    id: 'cs1', subject: 'Computer Science', difficulty: 'easy', type: 'mcq',
    question: 'What is the time complexity of binary search on a sorted array?',
    options: ['A) O(n)', 'B) O(n log n)', 'C) O(log n)', 'D) O(1)'],
    correctAnswer: 'C) O(log n)',
    explanation: 'Binary search halves the search space each step → logarithmic complexity.',
    concept: 'Algorithm complexity',
  },
  {
    id: 'cs2', subject: 'Computer Science', difficulty: 'medium', type: 'open',
    question: 'Explain the difference between a stack and a queue. Give a real-world use case for each.',
    correctAnswer: 'Stack: LIFO — used in function call stack, undo operations. Queue: FIFO — used in task scheduling, print queues, BFS.',
    explanation: 'Stack is LIFO, Queue is FIFO.',
    concept: 'Data structures',
  },
  {
    id: 'cs3', subject: 'Computer Science', difficulty: 'hard', type: 'open',
    question: 'What is the CAP theorem? Explain each property and describe a real-world system that sacrifices each one.',
    correctAnswer: 'CAP = Consistency, Availability, Partition Tolerance. You can only guarantee 2/3. CP: HBase (sacrifices availability). AP: Cassandra (sacrifices consistency). CA: single-node SQL (sacrifices partition tolerance).',
    explanation: 'Distributed systems must choose between C, A, and P in the presence of network partitions.',
    concept: 'Distributed systems / CAP theorem',
  },
  // Web Dev
  {
    id: 'web1', subject: 'Web Development', difficulty: 'easy', type: 'mcq',
    question: 'What HTTP status code means "Not Found"?',
    options: ['A) 200', 'B) 301', 'C) 404', 'D) 500'],
    correctAnswer: 'C) 404',
    explanation: '404 means the requested resource was not found on the server.',
    concept: 'HTTP status codes',
  },
  {
    id: 'web2', subject: 'Web Development', difficulty: 'medium', type: 'open',
    question: 'Explain the difference between REST and GraphQL. When would you choose one over the other?',
    correctAnswer: 'REST: multiple endpoints, fixed data shapes, simpler caching. GraphQL: single endpoint, client specifies exact data needed, reduces over/under-fetching. GraphQL is better for complex UIs with varied data needs.',
    explanation: 'Both are API paradigms with different tradeoffs.',
    concept: 'API design',
  },
  {
    id: 'web3', subject: 'Web Development', difficulty: 'hard', type: 'coding',
    question: 'Implement a simple `EventEmitter` class with `on(event, fn)`, `off(event, fn)`, and `emit(event, ...args)` methods.',
    starterCode: 'class EventEmitter {\n  constructor() {\n    // your code\n  }\n  on(event, fn) {}\n  off(event, fn) {}\n  emit(event, ...args) {}\n}',
    correctAnswer: 'class EventEmitter {\n  constructor() { this.events = {}; }\n  on(event, fn) {\n    if (!this.events[event]) this.events[event] = [];\n    this.events[event].push(fn);\n  }\n  off(event, fn) {\n    this.events[event] = (this.events[event]||[]).filter(f=>f!==fn);\n  }\n  emit(event, ...args) {\n    (this.events[event]||[]).forEach(fn=>fn(...args));\n  }\n}',
    explanation: 'Use an object to store arrays of listeners per event name.',
    concept: 'Design patterns / Observer pattern',
  },
  // Math/DSA
  {
    id: 'dsa1', subject: 'DSA', difficulty: 'medium', type: 'coding',
    question: 'Write a function that checks if a string is a palindrome (ignoring spaces and case). isPalindrome("Race car") → true',
    starterCode: 'function isPalindrome(str) {\n  // your code\n}',
    correctAnswer: 'function isPalindrome(str) {\n  const clean = str.toLowerCase().replace(/\\s+/g, \'\');\n  return clean === clean.split(\'\').reverse().join(\'\');\n}',
    explanation: 'Clean the string then compare to its reverse.',
    concept: 'String manipulation',
  },
  {
    id: 'dsa2', subject: 'DSA', difficulty: 'hard', type: 'open',
    question: 'Explain dynamic programming. What are the two approaches (top-down and bottom-up) and give an example of each with the Fibonacci sequence.',
    correctAnswer: 'DP breaks problems into overlapping subproblems. Top-down: recursive + memoization (cache fib(n) as computed). Bottom-up: iterative, build table from base cases up. Both achieve O(n) vs naive O(2^n).',
    explanation: 'DP = recursion + memoization or tabulation.',
    concept: 'Dynamic programming',
  },
];

// ── ROUTES ────────────────────────────────────────────────────────────────────

router.get('/questions', (req, res) => {
  const { subject, difficulty, type } = req.query;
  let qs = QUESTION_BANK;
  if (subject)    qs = qs.filter(q => q.subject.toLowerCase() === subject.toLowerCase());
  if (difficulty) qs = qs.filter(q => q.difficulty === difficulty);
  if (type)       qs = qs.filter(q => q.type === type);

  // Never expose correct answers to client
  const safe = qs.map(({ correctAnswer, explanation, ...q }) => q);
  res.json({ questions: safe, total: safe.length });
});

router.get('/subjects', (req, res) => {
  const subjects = [...new Set(QUESTION_BANK.map(q => q.subject))];
  res.json({ subjects });
});

router.post('/generate', authMiddleware, async (req, res) => {
  const { subject = 'JavaScript', difficulty = 'medium', type = 'mcq' } = req.body;
  try {
    const q = await generateQuestion({ subject, difficulty, type });
    res.json({ question: { id: `gen_${uuidv4()}`, subject, difficulty, ...q } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate question', details: e.message });
  }
});

router.post('/submit', authMiddleware, async (req, res) => {
  const { questionId, studentAnswer, subject = 'General', difficulty = 'medium', type = 'mcq', generatedQuestion, timeTaken } = req.body;
  const user = req.user;

  if (!studentAnswer?.trim()) return res.status(400).json({ error: 'Answer is required' });
  if (!user.walletAddress) return res.status(400).json({ error: 'Set a wallet address in your profile to receive rewards' });

  // Find question
  let qData = QUESTION_BANK.find(q => q.id === questionId) || generatedQuestion;
  if (!qData) return res.status(404).json({ error: 'Question not found' });

  // Daily limit check
  const currentDaily = user.dailyEarned || 0;
  if (currentDaily >= DAILY_LIMITS.perStudent) {
    return res.status(429).json({
      error: 'Daily reward limit reached',
      limit: DAILY_LIMITS.perStudent,
      earned: currentDaily,
      resetsAt: 'midnight UTC',
    });
  }

  try {
    // 1. Gemini evaluates the answer
    const evaluation = await evaluateAnswer({
      question: qData.question,
      correctAnswer: qData.correctAnswer,
      studentAnswer,
      difficulty: qData.difficulty || difficulty,
      subject: qData.subject || subject,
      type: qData.type || type,
    });

    let paymentResult = null;
    let rewardAmount  = 0;
    let newAchievements = [];

    if (evaluation.isCorrect) {
      rewardAmount = REWARDS[qData.difficulty || difficulty] || REWARDS.medium;
      const remaining = DAILY_LIMITS.perStudent - currentDaily;
      rewardAmount = Math.min(rewardAmount, remaining);

      if (rewardAmount > 0) {
        // 2. Locus payment
        paymentResult = await sendReward({
          toWallet: user.walletAddress,
          amount: rewardAmount,
          justification: evaluation.justification,
          userId: user.id,
          username: user.username,
          questionId: qData.id || questionId,
        });

        recordTransaction({
          userId: user.id,
          username: user.username,
          txId: paymentResult.transaction_id,
          amount: rewardAmount,
          questionId: qData.id || questionId,
          subject: qData.subject || subject,
          difficulty: qData.difficulty || difficulty,
          justification: evaluation.justification,
          mock: paymentResult.mock || false,
        });
      }
    }

    // 3. Update stats + check achievements
    newAchievements = updateUserStats(user.id, {
      isCorrect: evaluation.isCorrect,
      difficulty: qData.difficulty || difficulty,
      subject: qData.subject || subject,
      type: qData.type || type,
      timeTaken,
      rewardAmount: evaluation.isCorrect ? rewardAmount : 0,
    }) || [];

    // Record attempt
    recordAttempt({
      userId: user.id,
      questionId: qData.id || questionId,
      question: qData.question,
      subject: qData.subject || subject,
      difficulty: qData.difficulty || difficulty,
      type: qData.type || type,
      studentAnswer,
      isCorrect: evaluation.isCorrect,
      score: evaluation.score,
      rewardEarned: rewardAmount,
      timeTaken,
    });

    // 4. Optionally get study tip if wrong
    let studyTip = null;
    if (!evaluation.isCorrect && evaluation.concept) {
      studyTip = await generateStudyTip({ subject: qData.subject || subject, wrongConcept: evaluation.concept });
    }

    const freshUser = getUser(user.id);
    res.json({
      evaluation,
      payment: paymentResult
        ? { sent: true, amount: rewardAmount, transactionId: paymentResult.transaction_id, mock: paymentResult.mock || false }
        : { sent: false, reason: evaluation.isCorrect ? 'Daily limit reached' : 'Incorrect answer' },
      newAchievements,
      studyTip,
      user: {
        totalEarned:    freshUser.totalEarned,
        dailyEarned:    freshUser.dailyEarned,
        weeklyEarned:   freshUser.weeklyEarned,
        correctAnswers: freshUser.correctAnswers,
        totalAnswers:   freshUser.totalAnswers,
        streak:         freshUser.streak,
        bestStreak:     freshUser.bestStreak,
        xp:             freshUser.xp,
        level:          freshUser.level,
        accuracy:       freshUser.totalAnswers > 0
          ? Math.round((freshUser.correctAnswers / freshUser.totalAnswers) * 100) : 0,
      },
    });
  } catch (e) {
    console.error('Submit error:', e);
    res.status(500).json({ error: 'Submission failed', details: e.message });
  }
});

export default router;
