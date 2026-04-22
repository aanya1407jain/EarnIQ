import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const SUBJECTS    = ['JavaScript','Python','Computer Science','Web Development','DSA'];
const DIFFS       = ['easy','medium','hard'];
const TYPES       = ['mcq','coding','open'];
const DIFF_COLOR  = { easy:'#00e5b8', medium:'#f59e0b', hard:'#f04060' };

export default function Quiz() {
  const { authFetch, user, refreshUser } = useAuth();
  const [screen, setScreen]   = useState('setup');   // setup|question|result
  const [config, setConfig]   = useState(null);
  const [bankQs, setBankQs]   = useState([]);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer]   = useState('');
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [sessionStats, setSessionStats] = useState({ correct:0, total:0, earned:0, streak:0 });
  const [timer, setTimer]     = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  const [filters, setFilters] = useState({
    subject: 'JavaScript', difficulty: 'medium', type: 'mcq', useAI: false,
  });

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/payment/config`).then(r=>r.json()).then(setConfig).catch(()=>{});
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/quiz/questions`).then(r=>r.json()).then(d=>setBankQs(d.questions||[])).catch(()=>{});
  }, []);

  // Timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimer(t => t+1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  async function handleStart() {
    setLoading(true); setResult(null); setAnswer(''); setSelected('');
    try {
      let q;
      if (filters.useAI) {
        const r = await authFetch('/api/quiz/generate', {
          method:'POST', body: JSON.stringify({ subject:filters.subject, difficulty:filters.difficulty, type:filters.type }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        q = { ...d.question, _ai: true };
      } else {
        const pool = bankQs.filter(q =>
          q.subject===filters.subject && q.difficulty===filters.difficulty
        );
        if (!pool.length) { alert('No questions match those filters. Try AI mode!'); return; }
        q = pool[Math.floor(Math.random() * pool.length)];
      }
      setQuestion(q);
      setTimer(0); setTimerActive(true);
      setScreen('question');
    } catch(e) { alert('Error: '+e.message); }
    finally { setLoading(false); }
  }

  async function handleSubmit() {
    const finalAnswer = question.type==='mcq' ? selected : answer;
    if (!finalAnswer.trim()) return alert('Please provide an answer!');
    if (!user.walletAddress) {
      if (!window.confirm('You have no wallet address set. You won\'t receive USDC rewards. Continue anyway?')) return;
    }
    setTimerActive(false);
    setLoading(true);
    try {
      const r = await authFetch('/api/quiz/submit', {
        method:'POST',
        body: JSON.stringify({
          questionId: question.id,
          studentAnswer: finalAnswer,
          subject: question.subject,
          difficulty: question.difficulty,
          type: question.type,
          generatedQuestion: question._ai ? question : undefined,
          timeTaken: timer,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
      setSessionStats(prev => ({
        correct: prev.correct + (d.evaluation.isCorrect?1:0),
        total:   prev.total + 1,
        earned:  prev.earned + (d.payment?.amount||0),
        streak:  d.user.streak,
      }));
      setScreen('result');
      refreshUser();
    } catch(e) { alert('Submit failed: '+e.message); }
    finally { setLoading(false); }
  }

  const reward = config?.rewards?.[filters.difficulty];

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (screen==='setup') return (
    <div style={{ maxWidth:700, margin:'44px auto', padding:'0 24px' }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontWeight:900, fontSize:30 }}>🧠 Quiz Mode</h1>
        <p style={{ color:'#7777aa', marginTop:6 }}>Answer correctly → get paid in USDC via Locus.</p>
      </div>

      {sessionStats.total>0 && (
        <div className="card animate-in" style={{ marginBottom:20, display:'flex', gap:24, flexWrap:'wrap' }}>
          <StatBox label="Session" val={`${sessionStats.correct}/${sessionStats.total}`} />
          <StatBox label="Earned"  val={`$${sessionStats.earned.toFixed(2)}`} color="#00e5b8" />
          <StatBox label="Accuracy" val={`${Math.round((sessionStats.correct/sessionStats.total)*100)}%`} />
          <StatBox label="Streak"  val={`🔥 ${sessionStats.streak}`} color="#f59e0b" />
        </div>
      )}

      <div className="card">
        <FilterRow label="Subject">
          {SUBJECTS.map(s => <Chip key={s} active={filters.subject===s} onClick={() => setFilters(f=>({...f,subject:s}))}>{s}</Chip>)}
        </FilterRow>
        <FilterRow label="Difficulty">
          {DIFFS.map(d => (
            <Chip key={d} active={filters.difficulty===d}
              color={DIFF_COLOR[d]}
              onClick={() => setFilters(f=>({...f,difficulty:d}))}>
              {d==='easy'?'🟢':d==='medium'?'🟡':'🔴'} {d.charAt(0).toUpperCase()+d.slice(1)}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Question Type">
          {TYPES.map(t => (
            <Chip key={t} active={filters.type===t} onClick={() => setFilters(f=>({...f,type:t}))}>
              {t==='mcq'?'🔘 MCQ':t==='coding'?'💻 Coding':'📝 Open-Ended'}
            </Chip>
          ))}
        </FilterRow>

        <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom:24 }}>
          <div style={{
            width:42, height:24, borderRadius:12, position:'relative', cursor:'pointer',
            background: filters.useAI ? '#7c6fff' : 'rgba(255,255,255,.1)',
            transition:'background .2s',
          }} onClick={() => setFilters(f=>({...f,useAI:!f.useAI}))}>
            <div style={{
              position:'absolute', top:3, left: filters.useAI?19:3,
              width:18, height:18, borderRadius:'50%', background:'#fff',
              transition:'left .2s',
            }} />
          </div>
          <span style={{ fontWeight:600 }}>✨ AI-Generated Question</span>
          <span style={{ fontSize:12, color:'#7777aa' }}>Fresh question from Gemini on demand</span>
        </label>

        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px', borderRadius:10,
          background:'rgba(0,229,184,.06)', border:'1px solid rgba(0,229,184,.15)',
          marginBottom:20,
        }}>
          <span style={{ color:'#7777aa', fontSize:14 }}>Reward if correct:</span>
          <span style={{ fontWeight:900, fontSize:26, color:'#00e5b8' }}>
            {reward!=null ? `$${reward.toFixed(2)}` : '...'} <span style={{ fontSize:14 }}>USDC</span>
          </span>
        </div>

        {!user.walletAddress && (
          <div style={{
            padding:'10px 14px', borderRadius:8, marginBottom:16,
            background:'rgba(240,64,96,.08)', border:'1px solid rgba(240,64,96,.2)',
            fontSize:13, color:'#f04060',
          }}>
            ⚠️ No wallet address set — you won't receive rewards. <a href="/profile" style={{ color:'inherit', fontWeight:700 }}>Set one in Profile →</a>
          </div>
        )}

        <button className="btn btn-primary btn-full" style={{ padding:'13px', fontSize:15 }}
          onClick={handleStart} disabled={loading}>
          {loading ? '⏳ Loading question…' : 'Get Question →'}
        </button>
      </div>
    </div>
  );

  // ── QUESTION ───────────────────────────────────────────────────────────────
  if (screen==='question' && question) return (
    <div style={{ maxWidth:740, margin:'44px auto', padding:'0 24px' }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        <span className={`badge badge-${question.difficulty}`}>
          {question.difficulty.charAt(0).toUpperCase()+question.difficulty.slice(1)}
        </span>
        <span className="badge badge-mcq" style={{ background:'rgba(255,255,255,.06)', color:'#7777aa' }}>
          {question.subject}
        </span>
        <span className={`badge badge-${question.type}`}>{question.type.toUpperCase()}</span>
        {question._ai && <span style={{ fontSize:11, color:'#7c6fff', fontWeight:700 }}>✨ AI</span>}

        {/* Timer */}
        <div style={{
          marginLeft:'auto', fontWeight:700, fontSize:15,
          color: timer>60?'#f04060':timer>30?'#f59e0b':'#00e5b8',
          fontFamily:'monospace',
        }}>
          ⏱ {String(Math.floor(timer/60)).padStart(2,'0')}:{String(timer%60).padStart(2,'0')}
        </div>

        <div style={{ color:'#00e5b8', fontWeight:700, fontSize:14 }}>
          +${config?.rewards?.[question.difficulty]?.toFixed(2)} USDC
        </div>
      </div>

      <div className="card" style={{ marginBottom:18 }}>
        <h2 style={{ fontWeight:700, fontSize:19, lineHeight:1.55, marginBottom:22 }}>
          {question.question}
        </h2>

        {/* MCQ */}
        {question.type==='mcq' && question.options && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {question.options.map(opt => (
              <button key={opt} onClick={() => setSelected(opt)} style={{
                padding:'12px 16px', borderRadius:9, textAlign:'left', cursor:'pointer',
                border:`2px solid ${selected===opt?'#7c6fff':'rgba(255,255,255,.08)'}`,
                background: selected===opt?'rgba(124,111,255,.12)':'rgba(255,255,255,.02)',
                color: selected===opt?'#fff':'#aaaacc',
                fontFamily:'Inter,sans-serif', fontSize:14, transition:'all .15s',
              }}>{opt}</button>
            ))}
          </div>
        )}

        {/* Coding */}
        {question.type==='coding' && (
          <>
            {question.starterCode && (
              <pre style={{
                background:'#08080f', border:'1px solid rgba(255,255,255,.08)',
                borderRadius:8, padding:14, fontSize:13, color:'#00e5b8',
                marginBottom:12, overflow:'auto',
              }}>{question.starterCode}</pre>
            )}
            <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
              placeholder="Write your solution here…"
              style={{
                width:'100%', minHeight:200, padding:14,
                background:'#08080f', border:'1px solid rgba(255,255,255,.1)',
                borderRadius:8, color:'#eeeeff', fontSize:13,
                fontFamily:'Fira Code,monospace', resize:'vertical', outline:'none',
              }} />
          </>
        )}

        {/* Open */}
        {question.type==='open' && (
          <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
            placeholder="Type your answer here…"
            style={{
              width:'100%', minHeight:150, padding:14,
              background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.1)',
              borderRadius:9, color:'#eeeeff', fontSize:14,
              fontFamily:'Inter,sans-serif', resize:'vertical', outline:'none',
            }} />
        )}
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-outline" onClick={() => { setTimerActive(false); setScreen('setup'); }}>← Back</button>
        <button className="btn btn-success" style={{ flex:1, padding:'13px', fontSize:15 }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? '🤖 Gemini is evaluating…' : 'Submit Answer ✓'}
        </button>
      </div>
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (screen==='result' && result) {
    const { evaluation, payment, newAchievements, studyTip, user: uStats } = result;
    const won = evaluation.isCorrect;
    return (
      <div style={{ maxWidth:700, margin:'44px auto', padding:'0 24px' }} className="animate-in">
        {/* Main result card */}
        <div className="card" style={{
          textAlign:'center', marginBottom:18,
          border:`1px solid ${won?'rgba(0,229,184,.35)':'rgba(240,64,96,.25)'}`,
          background: won?'rgba(0,229,184,.04)':'rgba(240,64,96,.04)',
        }}>
          <div style={{ fontSize:54, marginBottom:8 }}>{won?'🎉':'😅'}</div>
          <h2 style={{ fontWeight:900, fontSize:28, color:won?'#00e5b8':'#f04060' }}>
            {won?'Correct!':'Not Quite…'}
          </h2>
          <p style={{ color:'#9999bb', marginTop:10, lineHeight:1.65, maxWidth:480, margin:'10px auto 0', fontSize:15 }}>
            {evaluation.feedback}
          </p>

          {/* Score bar */}
          <div style={{ maxWidth:300, margin:'20px auto 0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:'#7777aa' }}>Score</span>
              <span style={{ fontWeight:800, color: evaluation.score>=75?'#00e5b8':evaluation.score>=50?'#f59e0b':'#f04060' }}>
                {evaluation.score}/100
              </span>
            </div>
            <div style={{ height:8, background:'rgba(255,255,255,.06)', borderRadius:4, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:4,
                width:`${evaluation.score}%`,
                background: evaluation.score>=75?'#00e5b8':evaluation.score>=50?'#f59e0b':'#f04060',
                transition:'width .6s ease',
              }} />
            </div>
          </div>

          {/* Payment badge */}
          {won && payment?.sent && (
            <div className="animate-pop" style={{
              display:'inline-flex', alignItems:'center', gap:12,
              margin:'22px auto 0', padding:'14px 24px', borderRadius:14,
              background:'rgba(0,229,184,.12)', border:'1px solid rgba(0,229,184,.35)',
            }}>
              <span style={{ fontSize:28 }}>💰</span>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontWeight:900, fontSize:24, color:'#00e5b8' }}>
                  +${payment.amount.toFixed(2)} USDC
                </div>
                <div style={{ fontSize:11, color:'#7777aa' }}>
                  {payment.mock ? 'Demo payment (add Locus API key for real)' : `TX: ${payment.transactionId}`}
                </div>
              </div>
            </div>
          )}

          {won && !payment?.sent && (
            <div style={{ marginTop:16, fontSize:13, color:'#f59e0b' }}>
              ⚠️ {payment?.reason || 'Payment not sent'}
            </div>
          )}

          {!won && evaluation.hint && (
            <div style={{
              marginTop:16, padding:'11px 16px', borderRadius:9, textAlign:'left',
              background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)',
              fontSize:13, color:'#f59e0b', maxWidth:460, margin:'16px auto 0',
            }}>💡 Hint: {evaluation.hint}</div>
          )}
        </div>

        {/* Strengths & improvements */}
        {(evaluation.strengths?.length>0 || evaluation.improvements?.length>0) && (
          <div className="card" style={{ marginBottom:18, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {evaluation.strengths?.length>0 && (
              <div>
                <p style={{ fontWeight:700, fontSize:13, color:'#00e5b8', marginBottom:8 }}>✅ What you got right</p>
                {evaluation.strengths.map((s,i) => (
                  <div key={i} style={{ fontSize:13, color:'#9999bb', marginBottom:4 }}>• {s}</div>
                ))}
              </div>
            )}
            {evaluation.improvements?.length>0 && (
              <div>
                <p style={{ fontWeight:700, fontSize:13, color:'#f59e0b', marginBottom:8 }}>📚 Study next</p>
                {evaluation.improvements.map((s,i) => (
                  <div key={i} style={{ fontSize:13, color:'#9999bb', marginBottom:4 }}>• {s}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New achievements */}
        {newAchievements?.length>0 && (
          <div className="card animate-pop" style={{
            marginBottom:18, border:'1px solid rgba(124,111,255,.3)',
            background:'rgba(124,111,255,.06)', textAlign:'center',
          }}>
            <p style={{ fontWeight:800, fontSize:15, marginBottom:12 }}>🏅 Achievement Unlocked!</p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
              {newAchievements.map(a => (
                <div key={a.id} style={{
                  padding:'8px 16px', borderRadius:20, fontSize:14,
                  background:'rgba(124,111,255,.2)', border:'1px solid rgba(124,111,255,.35)',
                }}>
                  {a.icon} {a.name}
                  <div style={{ fontSize:11, color:'#9999bb', marginTop:2 }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Study tip */}
        {studyTip && (
          <div className="card" style={{ marginBottom:18, borderColor:'rgba(77,166,255,.2)' }}>
            <p style={{ fontWeight:700, fontSize:13, color:'#4da6ff', marginBottom:8 }}>📖 Study Tip</p>
            <p style={{ fontSize:13, color:'#9999bb', lineHeight:1.6 }}>{studyTip.tip}</p>
            {studyTip.resources?.length>0 && (
              <div style={{ marginTop:10, display:'flex', gap:8, flexWrap:'wrap' }}>
                {studyTip.resources.map((r,i) => (
                  <span key={i} style={{
                    padding:'3px 10px', borderRadius:6, fontSize:11,
                    background:'rgba(77,166,255,.1)', color:'#4da6ff', fontWeight:600,
                  }}>{r}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Session + user stats */}
        <div className="card" style={{ marginBottom:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
            <StatBox label="Total Earned"  val={`$${(uStats?.totalEarned||0).toFixed(2)}`} color="#00e5b8" />
            <StatBox label="Accuracy"      val={`${uStats?.accuracy||0}%`} />
            <StatBox label="Streak"        val={`🔥 ${uStats?.streak||0}`} color="#f59e0b" />
            <StatBox label="Level"         val={`⚡ ${uStats?.level||1}`} color="#7c6fff" />
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <span style={{ fontSize:12, color:'#7777aa' }}>XP</span>
            <div className="xp-bar-track" style={{ flex:1 }}>
              <div className="xp-bar-fill" style={{ width:`${((uStats?.xp||0)%200)/200*100}%` }} />
            </div>
            <span style={{ fontSize:12, color:'#7777aa' }}>{(uStats?.xp||0)%200}/200</span>
          </div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-outline" onClick={() => setScreen('setup')}>← Change Filters</button>
          <button className="btn btn-primary" style={{ flex:1 }} onClick={() => {
            setQuestion(null); setAnswer(''); setSelected(''); setResult(null);
            setTimer(0); handleStart();
          }} disabled={loading}>
            {loading ? '⏳ Loading…' : 'Next Question →'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function FilterRow({ label, children }) {
  return (
    <div style={{ marginBottom:22 }}>
      <p style={{ fontSize:12, fontWeight:700, color:'#7777aa', marginBottom:10, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</p>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{children}</div>
    </div>
  );
}

function Chip({ children, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding:'7px 14px', borderRadius:8, cursor:'pointer',
      border:`1px solid ${active?(color||'#7c6fff'):'rgba(255,255,255,.08)'}`,
      background: active?`${(color||'#7c6fff')}22`:'transparent',
      color: active?(color||'#7c6fff'):'#7777aa',
      fontFamily:'Inter,sans-serif', fontSize:13, fontWeight:600, transition:'all .15s',
    }}>{children}</button>
  );
}

function StatBox({ label, val, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontWeight:800, fontSize:18, color:color||'#fff' }}>{val}</div>
      <div style={{ fontSize:11, color:'#7777aa', marginTop:2 }}>{label}</div>
    </div>
  );
}
