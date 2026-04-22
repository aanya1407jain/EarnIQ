# EarnIQ v2 — AI Tutor That Pays Students

> **Locus Paygentic Hackathon #2 — BuildWithLocus Track** | $1,000 Prize Pool

An AI-powered tutoring platform where students earn real **USDC** for correct answers.
Powered by **Google Gemini 1.5 Flash** for evaluation + **Locus** for agentic payments.

---

## 📁 Project Structure

```
earniq/
├── backend/
│   ├── agents/
│   │   └── evaluator.js         # Gemini AI — evaluates answers, generates questions, study tips
│   ├── middleware/
│   │   └── auth.js              # JWT auth middleware + token signing
│   ├── routes/
│   │   ├── auth.js              # Register, Login, Profile, History endpoints
│   │   ├── quiz.js              # Submit answer (evaluate + pay), question bank, AI generate
│   │   └── misc.js              # Leaderboard, payment config, platform stats
│   ├── services/
│   │   ├── locus.js             # Locus PayWithLocus API (send, balance, transactions)
│   │   └── store.js             # In-memory users, transactions, achievements engine
│   └── index.js                 # Express server entry point
├── frontend/
│   └── src/
│       ├── context/
│       │   └── AuthContext.jsx  # Global auth state + JWT session management
│       ├── components/
│       │   ├── Navbar.jsx       # Responsive nav with avatar dropdown + XP bar
│       │   └── Spinner.jsx      # Loading spinner
│       ├── pages/
│       │   ├── Home.jsx         # Landing page with live stats
│       │   ├── AuthPage.jsx     # Login + Register tabs
│       │   ├── Quiz.jsx         # Main quiz: filters, timer, submit, result + achievements
│       │   ├── Dashboard.jsx    # Overview, history, achievements, analytics tabs
│       │   ├── Leaderboard.jsx  # All-time / weekly / accuracy rankings
│       │   └── Profile.jsx      # Wallet setup, password change, account settings
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
├── .env.example
├── package.json                 # Root (concurrently)
└── README.md
```

---

## 🚀 Quick Start

### 1. Install

```bash
git clone <your-repo>
cd earniq
npm run install:all
```

### 2. Configure

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
# Get from https://aistudio.google.com/app/apikey (free)
GEMINI_API_KEY=your_gemini_api_key

# Get from https://beta.paywithlocus.com (code: BETA-ACCESS-DOCS)
LOCUS_API_KEY=your_locus_api_key
LOCUS_WALLET_ID=your_wallet_id

# Change this in production!
JWT_SECRET=some_long_random_string
```

### 3. Run

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:**  http://localhost:3001

> **No API keys?** The app runs in full demo/mock mode automatically.
> Gemini → mock evaluations, Locus → logged mock payments. Perfect for judging.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | Register/Login with JWT, session persistence, password change |
| 🧠 AI Evaluation | Gemini 1.5 Flash grades answers with score, feedback, hints, strengths |
| ✨ AI Generation | Gemini generates fresh questions on demand for any topic/difficulty |
| 📖 Study Tips | Gemini generates personalized study tips + resources on wrong answers |
| 💸 USDC Rewards | Easy=$0.10, Medium=$0.25, Hard=$0.50 via Locus on Base |
| 🔒 Payment Policy | Daily cap, justification required, audit trail — all via Locus |
| ⏱️ Quiz Timer | Live countdown timer; fastest correct answer tracked |
| 🔥 Streaks | Current streak + best streak tracked |
| ⚡ XP & Levels | Earn XP per correct answer; level up every 200 XP |
| 🏅 Achievements | 12 unlockable achievements (First Blood, On Fire, Polymath, etc.) |
| 📊 Analytics | Subject/difficulty breakdown, accuracy trends, full history |
| 🏆 Leaderboard | All-time, weekly, and accuracy rankings |
| 💳 Wallet Setup | Set USDC wallet address in profile settings |
| 📱 Responsive | Clean dark UI works on mobile and desktop |

---

## 💳 Locus Integration

### Payment Flow
```
Student submits answer
        ↓
Gemini evaluates correctness (score 0-100)
        ↓
If score ≥ 75 → call Locus /v1/payments/send
        ↓
Locus enforces policy:
  - max_per_transaction: $0.50
  - require_justification: true  ← AI writes this
  - daily_limit: $1.00/student
        ↓
USDC sent on Base network
        ↓
Transaction recorded with AI-generated audit trail
```

### Locus API endpoints used

| Endpoint | Purpose |
|---|---|
| `POST /v1/payments/send` | Micro-payment to student wallet |
| `GET /v1/wallets/:id/balance` | Platform wallet balance |
| `GET /v1/wallets/:id/transactions` | Audit log |

---

## 🎯 Judging Criteria

| Criteria | How EarnIQ delivers |
|---|---|
| **Locus Integration** | Core to the product — every reward flows through Locus with policy enforcement |
| **AI Quality** | Gemini does 3 jobs: evaluation, question generation, study tips |
| **Real Use Case** | Incentivized learning is a proven market; micropayments unlock new models |
| **Demo-Ready** | Works in mock mode out of the box — judges can register and play immediately |
| **Polish** | Full auth, XP system, achievements, analytics — not a toy |

---

## 🔑 API Reference

### `POST /api/auth/register`
```json
{ "username": "alice", "email": "alice@x.com", "password": "pass123", "walletAddress": "0x..." }
```

### `POST /api/auth/login`
```json
{ "emailOrUsername": "alice", "password": "pass123" }
```

### `POST /api/quiz/submit` *(auth required)*
```json
{
  "questionId": "js1",
  "studentAnswer": "B) \"object\"",
  "subject": "JavaScript",
  "difficulty": "easy",
  "timeTaken": 12
}
```

**Response:**
```json
{
  "evaluation": { "isCorrect": true, "score": 95, "feedback": "...", "justification": "..." },
  "payment": { "sent": true, "amount": 0.10, "transactionId": "locus_tx_abc" },
  "newAchievements": [{ "id": "first_correct", "icon": "🎯", "name": "First Blood" }],
  "studyTip": null,
  "user": { "totalEarned": 0.10, "streak": 1, "xp": 10, "level": 1 }
}
```

---

## 📄 License

MIT — built for the Locus Paygentic Hackathon #2
