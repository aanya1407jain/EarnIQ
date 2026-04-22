import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, authFetch, refreshUser, logout } = useAuth();
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');
  const [wallet, setWallet]   = useState(user?.walletAddress||'');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');

  async function saveWallet() {
    setMsg(''); setError(''); setSaving(true);
    try {
      const r = await authFetch('/api/auth/me', {
        method:'PATCH', body:JSON.stringify({ walletAddress: wallet }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await refreshUser();
      setMsg('Wallet address saved!');
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    setMsg(''); setError('');
    if (newPass !== confPass) return setError('New passwords do not match');
    setSaving(true);
    try {
      const r = await authFetch('/api/auth/me', {
        method:'PATCH', body:JSON.stringify({ currentPassword:curPass, newPassword:newPass }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMsg('Password changed!');
      setCurPass(''); setNewPass(''); setConfPass('');
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const inputStyle = {
    width:'100%', padding:'11px 14px', borderRadius:9,
    border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.04)',
    color:'#eeeeff', fontFamily:'Inter,sans-serif', fontSize:14, outline:'none',
  };

  return (
    <div style={{ maxWidth:620, margin:'44px auto', padding:'0 24px' }}>
      <h1 style={{ fontWeight:900, fontSize:28, marginBottom:28 }}>⚙️ Profile Settings</h1>

      {msg   && <div style={{ padding:'11px 14px', borderRadius:8, marginBottom:16, background:'rgba(0,229,184,.1)', border:'1px solid rgba(0,229,184,.3)', color:'#00e5b8', fontSize:13 }}>✅ {msg}</div>}
      {error && <div style={{ padding:'11px 14px', borderRadius:8, marginBottom:16, background:'rgba(240,64,96,.1)', border:'1px solid rgba(240,64,96,.3)', color:'#f04060', fontSize:13 }}>⚠️ {error}</div>}

      {/* Account info */}
      <div className="card" style={{ marginBottom:20 }}>
        <p style={{ fontWeight:700, marginBottom:16 }}>👤 Account Info</p>
        <div style={{ display:'grid', gap:12 }}>
          <div>
            <label className="label">Username</label>
            <input style={{ ...inputStyle, opacity:.6 }} value={`@${user.username}`} disabled />
          </div>
          <div>
            <label className="label">Email</label>
            <input style={{ ...inputStyle, opacity:.6 }} value={user.email} disabled />
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:1 }}>
              <label className="label">Level</label>
              <input style={{ ...inputStyle, opacity:.6, color:'#7c6fff', fontWeight:800 }} value={`Level ${user.level}`} disabled />
            </div>
            <div style={{ flex:1 }}>
              <label className="label">Total XP</label>
              <input style={{ ...inputStyle, opacity:.6 }} value={`${user.xp} XP`} disabled />
            </div>
          </div>
        </div>
      </div>

      {/* Wallet address */}
      <div className="card" style={{ marginBottom:20 }}>
        <p style={{ fontWeight:700, marginBottom:8 }}>💳 USDC Wallet Address</p>
        <p style={{ fontSize:13, color:'#7777aa', marginBottom:14, lineHeight:1.5 }}>
          Add your Base network wallet address to receive USDC rewards for correct answers via Locus.
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <input style={{ ...inputStyle, flex:1 }} placeholder="0x... (Base network)"
            value={wallet} onChange={e=>setWallet(e.target.value)}
            onFocus={e=>e.target.style.borderColor='#7c6fff'}
            onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.12)'}
          />
          <button className="btn btn-primary" onClick={saveWallet} disabled={saving} style={{ flexShrink:0 }}>
            {saving?'Saving…':'Save'}
          </button>
        </div>
        {user.walletAddress && (
          <div style={{
            marginTop:10, padding:'8px 12px', borderRadius:8,
            background:'rgba(0,229,184,.06)', border:'1px solid rgba(0,229,184,.15)',
            fontSize:12, color:'#00e5b8', fontFamily:'monospace',
          }}>
            ✅ Current: {user.walletAddress}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card" style={{ marginBottom:20 }}>
        <p style={{ fontWeight:700, marginBottom:14 }}>🔐 Change Password</p>
        <div style={{ display:'grid', gap:12 }}>
          <div>
            <label className="label">Current Password</label>
            <input style={inputStyle} type="password" placeholder="••••••••"
              value={curPass} onChange={e=>setCurPass(e.target.value)}
              onFocus={e=>e.target.style.borderColor='#7c6fff'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.12)'}
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input style={inputStyle} type="password" placeholder="At least 6 characters"
              value={newPass} onChange={e=>setNewPass(e.target.value)}
              onFocus={e=>e.target.style.borderColor='#7c6fff'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.12)'}
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input style={inputStyle} type="password" placeholder="Re-enter new password"
              value={confPass} onChange={e=>setConfPass(e.target.value)}
              onFocus={e=>e.target.style.borderColor='#7c6fff'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.12)'}
            />
          </div>
          <button className="btn btn-outline" onClick={changePassword} disabled={saving||!curPass||!newPass}>
            {saving?'Changing…':'Change Password'}
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="card" style={{ marginBottom:20 }}>
        <p style={{ fontWeight:700, marginBottom:16 }}>📊 Your Stats</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {[
            { label:'Total Earned',    val:`$${(user.totalEarned||0).toFixed(2)}`, color:'#00e5b8' },
            { label:'Correct Answers', val:user.correctAnswers||0 },
            { label:'Accuracy',        val:`${user.totalAnswers>0?Math.round((user.correctAnswers/user.totalAnswers)*100):0}%` },
            { label:'Best Streak',     val:`🔥 ${user.bestStreak||0}` },
            { label:'Achievements',    val:`🏅 ${user.achievements?.length||0}` },
            { label:'Level',           val:`⚡ ${user.level}`, color:'#7c6fff' },
          ].map(s=>(
            <div key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:20, color:s.color||'#fff' }}>{s.val}</div>
              <div style={{ fontSize:11, color:'#7777aa', marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor:'rgba(240,64,96,.2)' }}>
        <p style={{ fontWeight:700, marginBottom:8, color:'#f04060' }}>⚠️ Danger Zone</p>
        <p style={{ fontSize:13, color:'#7777aa', marginBottom:14 }}>Log out from all devices and clear your session.</p>
        <button className="btn btn-danger btn-sm" onClick={logout}>🚪 Log Out</button>
      </div>
    </div>
  );
}
