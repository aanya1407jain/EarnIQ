import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Dashboard() {
  const { user, authFetch } = useAuth();
  const [history, setHistory]   = useState([]);
  const [txs, setTxs]           = useState([]);
  const [balance, setBalance]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('overview');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [h, t, b] = await Promise.all([
          authFetch('/api/auth/me/history').then(r=>r.json()),
          authFetch('/api/auth/me/transactions').then(r=>r.json()),
          fetch(`${import.meta.env.VITE_API_URL || ''}/api/payment/balance`).then(r=>r.json()),
        ]);
        setHistory(h.attempts||[]);
        setTxs(t.transactions||[]);
        setBalance(b);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  const accuracy  = user.totalAnswers>0 ? Math.round((user.correctAnswers/user.totalAnswers)*100) : 0;
  const xpPct     = ((user.xp||0)%200)/200*100;
  const dailyPct  = Math.min(((user.dailyEarned||0)/1.00)*100, 100);

  const tabs = ['overview','history','achievements','analytics'];

  return (
    <div style={{ maxWidth:980, margin:'40px auto', padding:'0 24px' }}>
      {/* Profile banner */}
      <div className="card" style={{
        marginBottom:24, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
        background:'linear-gradient(135deg,rgba(124,111,255,.08),rgba(0,229,184,.06))',
        border:'1px solid rgba(124,111,255,.2)',
      }}>
        <div style={{
          width:64, height:64, borderRadius:'50%', flexShrink:0,
          background:'linear-gradient(135deg,#7c6fff,#00e5b8)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:900, fontSize:28, color:'#fff',
        }}>{user.username[0].toUpperCase()}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <h1 style={{ fontWeight:900, fontSize:22 }}>@{user.username}</h1>
            <span style={{
              padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700,
              background:'rgba(124,111,255,.2)', color:'#7c6fff',
            }}>Level {user.level}</span>
            <span style={{ fontSize:13, color:'#7777aa' }}>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          <div style={{ marginTop:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#7777aa', marginBottom:4 }}>
              <span>XP: {user.xp}</span>
              <span>{200-(user.xp%200)} XP to Level {user.level+1}</span>
            </div>
            <div className="xp-bar-track" style={{ maxWidth:300 }}>
              <div className="xp-bar-fill" style={{ width:`${xpPct}%` }} />
            </div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontWeight:900, fontSize:28, color:'#00e5b8' }}>
            ${(user.totalEarned||0).toFixed(2)}
          </div>
          <div style={{ fontSize:12, color:'#7777aa' }}>total USDC earned</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:"Today's Earnings",  val:`$${(user.dailyEarned||0).toFixed(2)}`, sub:'/ $1.00 daily cap', color:'#7c6fff' },
          { label:'Weekly Earned',     val:`$${(user.weeklyEarned||0).toFixed(2)}`, sub:'this week',         color:'#00e5b8' },
          { label:'Correct Answers',   val:user.correctAnswers||0, sub:`of ${user.totalAnswers||0} total` },
          { label:'Accuracy',          val:`${accuracy}%`,                          sub:'overall' },
          { label:'Best Streak',       val:`🔥 ${user.bestStreak||0}`,              sub:'consecutive correct' },
          { label:'Achievements',      val:`🏅 ${user.achievements?.length||0}`,    sub:'unlocked' },
        ].map(s=>(
          <div key={s.label} className="card">
            <div style={{ fontWeight:900, fontSize:22, color:s.color||'#fff' }}>{s.val}</div>
            <div style={{ fontSize:12, fontWeight:600, color:'#ccc', marginTop:4 }}>{s.label}</div>
            <div style={{ fontSize:11, color:'#7777aa', marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily limit bar */}
      <div className="card" style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, alignItems:'center' }}>
          <span style={{ fontWeight:700, fontSize:14 }}>Daily Reward Limit</span>
          <span style={{ fontSize:13, color:'#7777aa' }}>
            ${(user.dailyEarned||0).toFixed(2)} / $1.00
            {dailyPct>=100 && <span style={{ color:'#f04060', marginLeft:8 }}>LIMIT REACHED · Resets midnight UTC</span>}
          </span>
        </div>
        <div style={{ height:10, background:'rgba(255,255,255,.06)', borderRadius:5, overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:5,
            width:`${dailyPct}%`,
            background:`linear-gradient(90deg,#7c6fff,${dailyPct>=100?'#f04060':'#00e5b8'})`,
            transition:'width .5s',
          }} />
        </div>
        <p style={{ fontSize:11, color:'#555577', marginTop:6 }}>
          Enforced by Locus spending policy — every payout has a justification & audit trail
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'1px solid rgba(255,255,255,.07)', paddingBottom:0 }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'9px 18px', border:'none', cursor:'pointer', background:'transparent',
            fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:13,
            color: tab===t?'#fff':'#7777aa',
            borderBottom: tab===t?'2px solid #7c6fff':'2px solid transparent',
            transition:'all .15s',
          }}>
            {t==='overview'?'📊 Overview':t==='history'?'📝 History':t==='achievements'?'🏅 Achievements':'📈 Analytics'}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab==='overview' && (
        <div className="animate-in">
          {/* Wallet + recent txs */}
          {balance && (
            <div className="card" style={{ marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontSize:36 }}>🏦</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:22, color:'#00e5b8' }}>
                  ${(balance.balance_usdc||0).toFixed(4)} USDC
                </div>
                <div style={{ fontSize:12, color:'#7777aa' }}>
                  Locus Platform Wallet {balance.mock&&'(Demo)'}
                </div>
              </div>
              <div style={{ fontSize:11, color:'#7777aa', textAlign:'right' }}>
                <div>Network: Base</div>
                <div>Currency: USDC</div>
              </div>
            </div>
          )}
          <div className="card">
            <p style={{ fontWeight:700, marginBottom:16 }}>Recent Payments</p>
            {txs.length===0 ? (
              <p style={{ color:'#7777aa', textAlign:'center', padding:'24px 0' }}>No payments yet. Answer some questions!</p>
            ) : txs.slice(0,8).map((tx,i)=>(
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 0',
                borderBottom: i<Math.min(txs.length-1,7)?'1px solid rgba(255,255,255,.05)':'none',
              }}>
                <span style={{ fontSize:20 }}>💰</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:600 }}>
                    {tx.subject} · {tx.difficulty}
                    {tx.mock&&<span style={{ color:'#f59e0b', marginLeft:6, fontSize:11 }}>DEMO</span>}
                  </p>
                  <p style={{ fontSize:11, color:'#7777aa', marginTop:2 }}>{tx.justification}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:800, color:'#00e5b8', fontSize:14 }}>+${(tx.amount||0).toFixed(2)}</div>
                  <div style={{ fontSize:10, color:'#7777aa' }}>{tx.timestamp?new Date(tx.timestamp).toLocaleString():''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History tab */}
      {tab==='history' && (
        <div className="animate-in">
          {history.length===0 ? (
            <div className="card" style={{ textAlign:'center', padding:'48px 24px', color:'#7777aa' }}>
              No quiz attempts yet. <a href="/quiz" style={{ color:'#7c6fff' }}>Start a quiz →</a>
            </div>
          ) : history.map((a,i)=>(
            <div key={i} className="card" style={{
              marginBottom:10,
              borderLeft:`3px solid ${a.isCorrect?'#00e5b8':'#f04060'}`,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div>
                  <p style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{a.question?.slice(0,80)}…</p>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <span className={`badge badge-${a.difficulty}`}>{a.difficulty}</span>
                    <span style={{ fontSize:11, color:'#7777aa' }}>{a.subject}</span>
                    <span style={{ fontSize:11, color:'#7777aa' }}>{a.type}</span>
                    {a.timeTaken && <span style={{ fontSize:11, color:'#7777aa' }}>⏱ {a.timeTaken}s</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:800, color:a.isCorrect?'#00e5b8':'#f04060' }}>
                    {a.isCorrect?`+$${(a.rewardEarned||0).toFixed(2)}`:'Incorrect'}
                  </div>
                  <div style={{ fontSize:10, color:'#7777aa' }}>Score: {a.score}/100</div>
                  <div style={{ fontSize:10, color:'#7777aa' }}>{new Date(a.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements tab */}
      {tab==='achievements' && (
        <div className="animate-in">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
            {(user.achievements||[]).map(a=>(
              <div key={a.id} className="card" style={{
                border:'1px solid rgba(124,111,255,.3)',
                background:'rgba(124,111,255,.06)',
              }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{a.icon}</div>
                <div style={{ fontWeight:800, marginBottom:4 }}>{a.name}</div>
                <div style={{ fontSize:13, color:'#7777aa', marginBottom:8 }}>{a.desc}</div>
                <div style={{ fontSize:11, color:'#555577' }}>
                  Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {/* Locked achievements */}
            {[
              {id:'first_correct',icon:'🎯',name:'First Blood',desc:'Get your first correct answer'},
              {id:'streak_3',icon:'🔥',name:'On Fire',desc:'3 correct in a row'},
              {id:'earn_1',icon:'💵',name:'Dollar Earner',desc:'Earn $1.00 total'},
              {id:'hard_master',icon:'🧠',name:'Hard Mode Master',desc:'Answer 5 hard questions correctly'},
              {id:'polymath',icon:'🎓',name:'Polymath',desc:'Answer correctly in 3 different subjects'},
              {id:'coding_wizard',icon:'🧙',name:'Coding Wizard',desc:'Answer 3 coding questions correctly'},
            ].filter(a => !(user.achievements||[]).find(u=>u.id===a.id)).map(a=>(
              <div key={a.id} className="card" style={{ opacity:.4, filter:'grayscale(1)' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{a.icon}</div>
                <div style={{ fontWeight:800, marginBottom:4 }}>{a.name}</div>
                <div style={{ fontSize:13, color:'#7777aa' }}>{a.desc}</div>
                <div style={{ fontSize:11, color:'#555577', marginTop:8 }}>🔒 Locked</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics tab */}
      {tab==='analytics' && (
        <div className="animate-in" style={{ display:'grid', gap:16 }}>
          {/* Subject breakdown */}
          <div className="card">
            <p style={{ fontWeight:700, marginBottom:16 }}>📚 Performance by Subject</p>
            {Object.entries(user.subjectStats||{}).length===0 ? (
              <p style={{ color:'#7777aa', fontSize:14 }}>No data yet.</p>
            ) : Object.entries(user.subjectStats||{}).map(([subj,s])=>{
              const acc = s.total>0?Math.round((s.correct/s.total)*100):0;
              return (
                <div key={subj} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontWeight:600, fontSize:14 }}>{subj}</span>
                    <span style={{ fontSize:13, color:'#7777aa' }}>
                      {s.correct}/{s.total} · {acc}%
                    </span>
                  </div>
                  <div style={{ height:7, background:'rgba(255,255,255,.06)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:4,
                      width:`${acc}%`,
                      background: acc>=80?'#00e5b8':acc>=60?'#f59e0b':'#f04060',
                      transition:'width .5s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Difficulty breakdown */}
          <div className="card">
            <p style={{ fontWeight:700, marginBottom:16 }}>⚡ Performance by Difficulty</p>
            {Object.entries(user.difficultyStats||{}).map(([diff,s])=>{
              const acc = s.total>0?Math.round((s.correct/s.total)*100):0;
              const col = diff==='easy'?'#00e5b8':diff==='medium'?'#f59e0b':'#f04060';
              return (
                <div key={diff} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontWeight:600, fontSize:14, color:col }}>
                      {diff.charAt(0).toUpperCase()+diff.slice(1)}
                    </span>
                    <span style={{ fontSize:13, color:'#7777aa' }}>{s.correct}/{s.total} · {acc}%</span>
                  </div>
                  <div style={{ height:7, background:'rgba(255,255,255,.06)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:4, width:`${acc}%`, background:col, transition:'width .5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
