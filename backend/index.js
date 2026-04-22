import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';
import miscRoutes from './routes/misc.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Request logger (dev)
app.use((req, _, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth',  authRoutes);
app.use('/api/quiz',  quizRoutes);
app.use('/api',       miscRoutes);

app.get('/api/health', (_, res) => res.json({
  status: 'ok',
  ai: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? 'Gemini connected' : 'Demo mode',
  payments: process.env.LOCUS_API_KEY && process.env.LOCUS_API_KEY !== 'your_locus_api_key_here' ? 'Locus connected' : 'Mock payments',
}));

app.listen(PORT, () => {
  console.log(`\n🚀 EarnIQ backend running at http://localhost:${PORT}`);
  console.log(`🤖 AI:       ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' ? '✅ Gemini 1.5 Flash' : '⚠️  Demo mode (add GEMINI_API_KEY)'}`);
  console.log(`💳 Payments: ${process.env.LOCUS_API_KEY && process.env.LOCUS_API_KEY !== 'your_locus_api_key_here' ? '✅ Locus connected' : '⚠️  Mock payments (add LOCUS_API_KEY)'}\n`);
});
