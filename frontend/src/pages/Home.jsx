import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/stats`).then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const features = [
    { icon: '🤖', title: 'Gemini AI Evaluation', desc: 'Google Gemini 1.5 Flash grades every answer instantly — with feedback, hints, and partial credit scoring.' },
    { icon: '💸', title: 'Real USDC Rewards', desc: 'Correct answers pay in USDC on Base via Locus. Easy=$0.10, Medium=$0.25, Hard=$0.50.' },
    { icon: '🔒', title: 'Policy-Governed Payments', desc: 'Every payout is justified, capped, and audited by Locus\'s agentic payment infrastructure.' },
    { icon: '🏆', title: 'XP, Levels & Achievements', desc: 'Earn XP, level up, unlock 12 achievements, and climb the leaderboard.' },
    { icon: '✨', title: 'AI Question Generation', desc: 'Need fresh questions? Gemini generates unique quizzes on any topic at any difficulty on demand.' },
    { icon: '📊', title: 'Deep Analytics', desc: 'Track earnings, accuracy by subject, streak records, and full payment history with audit trails.' },
  ];

  const rewards = [
    { level: 'Easy', emoji: '🟢', amount: '$0.10', desc: 'Fundamentals & syntax' },
    { level: 'Medium', emoji: '🟡', amount: '$0.25', desc: 'Concepts & problem-solving' },
    { level: 'Hard', emoji: '🔴', amount: '$0.50', desc: 'Architecture & deep dives' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 0 56px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: 'rgba(124,111,255,.12)', border: '1px solid rgba(124,111,255,.25)',
          fontSize: 12, color: '#7c6fff', fontWeight: 700, marginBottom: 24,
        }}>
          🏆 Locus Paygentic Hackathon #2 · BuildWithLocus Track
        </div>

        <h1 style={{ fontSize: 58, fontWeight: 900, lineHeight: 1.1, marginBottom: 22, letterSpacing: '-1.5px' }}>
          Study Smarter.<br />
          <span style={{
            background: 'linear-gradient(135deg,#7c6fff,#00e5b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Get Paid to Learn.</span>
        </h1>

        <p style={{ fontSize: 19, color: '#7777aa', maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.65 }}>
          The AI tutor that pays you <strong style={{ color: '#00e5b8' }}>real USDC</strong> for correct answers.
          Powered by <strong style={{ color: '#fff' }}>Gemini AI</strong> + <strong style={{ color: '#7c6fff' }}>Locus payments</strong>.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/quiz')}>
                🧠 Start Earning Now
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/dashboard')}>
                📊 My Dashboard
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?tab=register')}>
                🚀 Sign Up & Earn Free
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => navigate('/auth')}>
                Log In
              </button>
            </>
          )}
        </div>

        {/* Live platform stats */}
        {stats && (
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            {[
              { label: 'Students', val: stats.totalStudents },
              { label: 'Total Earned', val: `$${(stats.totalEarned || 0).toFixed(2)} USDC` },
              { label: 'Questions Answered', val: stats.totalAnswers },
              { label: 'Platform Accuracy', val: `${stats.overallAccuracy}%` },
            ].map(s => (
              <div key={s.label} style={{
                padding: '10px 20px', borderRadius: 10,
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
              }}>
                <span style={{ color: '#7777aa', fontSize: 12 }}>{s.label}: </span>
                <span style={{ fontWeight: 800, color: '#00e5b8', fontSize: 14 }}>{s.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rewards table */}
      <div style={{ marginBottom: 72 }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: 28, marginBottom: 32 }}>
          💰 Reward Structure
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
          {rewards.map(r => (
            <div key={r.level} className="card" style={{ textAlign: 'center', padding: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{r.emoji}</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{r.level}</div>
              <div style={{ fontWeight: 900, fontSize: 32, color: '#00e5b8', marginBottom: 6 }}>{r.amount}</div>
              <div style={{ fontSize: 13, color: '#7777aa' }}>USDC per correct answer</div>
              <div style={{ fontSize: 12, color: '#555577', marginTop: 8 }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', color: '#7777aa', fontSize: 13, marginTop: 14 }}>
          Daily cap: $1.00 per student · All payments enforced by Locus spending policy
        </p>
      </div>

      {/* Features */}
      <div style={{ marginBottom: 72 }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: 28, marginBottom: 32 }}>
          What Makes EarnIQ Different
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
          {features.map(f => (
            <div key={f.title} className="card card-hover" style={{ cursor: 'default' }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{f.title}</h3>
              <p style={{ color: '#7777aa', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ marginBottom: 72 }}>
        <h2 style={{ textAlign: 'center', fontWeight: 800, fontSize: 28, marginBottom: 40 }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
          {[
            { n: '1', icon: '✍️', label: 'Sign Up',      desc: 'Create a free account in 30 seconds.' },
            { n: '2', icon: '🔗', label: 'Add Wallet',   desc: 'Connect your USDC wallet on Base.' },
            { n: '3', icon: '🧠', label: 'Answer',       desc: 'Pick a topic, answer the question.' },
            { n: '4', icon: '🤖', label: 'AI Grades',    desc: 'Gemini evaluates in seconds.' },
            { n: '5', icon: '💸', label: 'Get Paid',     desc: 'USDC lands in your wallet instantly.' },
          ].map(s => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
                background: 'linear-gradient(135deg,#7c6fff22,#00e5b822)',
                border: '2px solid rgba(124,111,255,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>{s.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{s.label}</div>
              <div style={{ color: '#7777aa', fontSize: 13, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        textAlign: 'center', padding: '52px 24px', borderRadius: 20, marginBottom: 80,
        background: 'linear-gradient(135deg,rgba(124,111,255,.08),rgba(0,229,184,.08))',
        border: '1px solid rgba(124,111,255,.2)',
      }}>
        <h2 style={{ fontWeight: 900, fontSize: 32, marginBottom: 12 }}>Ready to earn?</h2>
        <p style={{ color: '#7777aa', marginBottom: 28 }}>
          Join EarnIQ and start getting paid for what you know.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate(user ? '/quiz' : '/auth?tab=register')}>
          {user ? '🧠 Go to Quiz →' : '🚀 Get Started Free'}
        </button>
        <p style={{ marginTop: 16, fontSize: 12, color: '#555577' }}>
          Powered by Google Gemini AI · Payments via Locus (YC F25) on Base
        </p>
      </div>
    </div>
  );
}
