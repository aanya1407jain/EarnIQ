import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const MEDALS = ['🥇','🥈','🥉'];

export default function Leaderboard() {
  const { user } = useAuth();
  const [board, setBoard]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType]     = useState('allTime');

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/leaderboard?type=${type}`)
      .then(r=>r.json())
      .then(d=>setBoard(d.leaderboard||[]))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, [type]);

  const tabs = [
    { id:'allTime',  label:'💰 All-Time Earnings' },
    { id:'weekly',   label:'📅 This Week' },
    { id:'accuracy', label:'🎯 Accuracy' },
  ];

  return (
    <div style={{ maxWidth:780, margin:'44px auto', padding:'0 24px' }}>
      <div style={{ textAlign:'center', marginBottom:36 }}>
        <h1 style={{ fontWeight:900, fontSize:36 }}>🏆 Leaderboard</h1>
        <p style={{ color:'#7777aa', marginTop:8 }}>
          Top earners on EarnIQ — real USDC, real rankings, real achievements.
        </p>
      </div>

      {/* Tab toggle */}
      <div style={{
        display:'flex', background:'rgba(255,255,255,.04)',
        borderRadius:10, padding:4, marginBottom:24,
        border:'1px solid rgba(255,255,255,.07)',
      }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setType(t.id)} style={{
            flex:1, padding:'9px 4px', border:'none', cursor:'pointer',
            borderRadius:8, fontFamily:'Inter,sans-serif',
            fontWeight:600, fontSize:12,
            background: type===t.id?'#7c6fff':'transparent',
            color: type===t.id?'#fff':'#7777aa',
            transition:'all .2s',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'#7777aa', padding:'48px 0' }}>Loading…</p>
      ) : board.length===0 ? (
        <div className="card" style={{ textAlign:'center', padding:'64px 24px' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏅</div>
          <p style={{ fontWeight:700, marginBottom:8 }}>No entries yet</p>
          <p style={{ color:'#7777aa' }}>Be the first — answer a question and earn USDC!</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {board.map((s,i)=>{
            const isMe = user?.username===s.username;
            return (
              <div key={s.username} className="card" style={{
                display:'flex', alignItems:'center', gap:16,
                border: isMe
                  ? '1px solid rgba(124,111,255,.5)'
                  : i===0
                  ? '1px solid rgba(245,158,11,.35)'
                  : '1px solid rgba(255,255,255,.07)',
                background: isMe
                  ? 'rgba(124,111,255,.07)'
                  : i===0
                  ? 'rgba(245,158,11,.04)'
                  : 'var(--bg2)',
              }}>
                {/* Rank */}
                <div style={{ width:40, textAlign:'center', fontSize:i<3?24:14, fontWeight:800, flexShrink:0,
                  color: i===0?'#f59e0b':i===1?'#aaaacc':i===2?'#cd7f32':'#555577',
                }}>
                  {MEDALS[i]||`#${i+1}`}
                </div>

                {/* Avatar */}
                <div style={{
                  width:40, height:40, borderRadius:'50%', flexShrink:0,
                  background:'linear-gradient(135deg,#7c6fff,#00e5b8)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:800, fontSize:16, color:'#fff',
                }}>{s.username[0].toUpperCase()}</div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontWeight:700, fontSize:15 }}>@{s.username}</span>
                    {isMe && <span style={{ fontSize:11, color:'#7c6fff', fontWeight:700 }}>YOU</span>}
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10,
                      background:'rgba(124,111,255,.15)', color:'#7c6fff', fontWeight:600 }}>
                      Lv.{s.level}
                    </span>
                  </div>
                  <div style={{ display:'flex', gap:12, marginTop:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:12, color:'#7777aa' }}>✅ {s.correctAnswers} correct</span>
                    <span style={{ fontSize:12, color:'#7777aa' }}>🎯 {s.accuracy}% acc</span>
                    <span style={{ fontSize:12, color:'#7777aa' }}>🔥 {s.bestStreak} best</span>
                    <span style={{ fontSize:12, color:'#7777aa' }}>🏅 {s.achievements} badges</span>
                  </div>
                </div>

                {/* Earnings */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:900, fontSize:20, color:'#00e5b8' }}>
                    ${type==='weekly'
                      ? (s.weeklyEarned||0).toFixed(2)
                      : (s.totalEarned||0).toFixed(2)}
                  </div>
                  <div style={{ fontSize:11, color:'#7777aa' }}>
                    {type==='weekly'?'this week':'total'} USDC
                  </div>
                  {type==='accuracy' && (
                    <div style={{ fontWeight:800, color:'#7c6fff', fontSize:16, marginTop:2 }}>
                      {s.accuracy}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ marginTop:28, textAlign:'center', padding:'16px 24px' }}>
        <p style={{ color:'#7777aa', fontSize:13 }}>
          All payouts enforced by <strong style={{ color:'#00e5b8' }}>Locus</strong> spending policies ·
          Max $1.00/day per student · Justified & audited
        </p>
      </div>
    </div>
  );
}
