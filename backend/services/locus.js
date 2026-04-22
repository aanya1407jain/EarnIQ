import dotenv from 'dotenv';
dotenv.config();

const BASE   = process.env.LOCUS_BASE_URL  || 'https://api.paywithlocus.com';
const APIKEY = process.env.LOCUS_API_KEY;
const WALLET = process.env.LOCUS_WALLET_ID;
const DEMO   = !APIKEY || APIKEY === 'your_locus_api_key_here';

export const REWARDS = {
  easy:   parseFloat(process.env.REWARD_EASY)   || 0.10,
  medium: parseFloat(process.env.REWARD_MEDIUM) || 0.25,
  hard:   parseFloat(process.env.REWARD_HARD)   || 0.50,
};

export const DAILY_LIMITS = {
  perStudent: parseFloat(process.env.MAX_DAILY_PER_STUDENT) || 1.00,
  total:      parseFloat(process.env.MAX_DAILY_TOTAL)       || 10.00,
};

export async function sendReward({ toWallet, amount, justification, userId, questionId, username }) {
  const payload = {
    from_wallet: WALLET,
    to_wallet:   toWallet,
    amount_usdc: amount,
    justification,
    metadata: { type: 'tutor_reward', userId, questionId, username, timestamp: new Date().toISOString() },
    policy: { max_per_transaction: DAILY_LIMITS.perStudent, require_justification: true },
  };

  if (DEMO) {
    console.log('[MOCK LOCUS] Payment:', payload);
    return { success: true, mock: true, transaction_id: `mock_tx_${Date.now()}`, amount_usdc: amount };
  }

  const res = await fetch(`${BASE}/v1/payments/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${APIKEY}`,
      'X-Wallet-ID': WALLET,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Locus error: ${err.message || res.statusText}`);
  }
  return res.json();
}

export async function getWalletBalance() {
  if (DEMO) return { balance_usdc: 10.00, mock: true, wallet_id: 'DEMO_WALLET' };
  const res = await fetch(`${BASE}/v1/wallets/${WALLET}/balance`, {
    headers: { 'Authorization': `Bearer ${APIKEY}` },
  });
  if (!res.ok) throw new Error('Failed to fetch balance');
  return res.json();
}

export async function getLocusTransactions() {
  if (DEMO) return { transactions: [], mock: true };
  const res = await fetch(`${BASE}/v1/wallets/${WALLET}/transactions`, {
    headers: { 'Authorization': `Bearer ${APIKEY}` },
  });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}
