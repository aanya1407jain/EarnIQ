import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const loc = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/',            label: 'Home',        icon: '🏠' },
    { to: '/quiz',        label: 'Quiz',         icon: '🧠', auth: true },
    { to: '/dashboard',   label: 'Dashboard',    icon: '📊', auth: true },
    { to: '/leaderboard', label: 'Leaderboard',  icon: '🏆' },
  ];

  function handleLogout() {
    logout();
    loc('/');
  }

  const xpToNextLevel = user ? (user.level * 200) - (user.xp % 200) : 0;
  const xpProgress    = user ? ((user.xp % 200) / 200) * 100 : 0;

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: 'rgba(8,8,18,.92)',
      borderBottom: '1px solid rgba(255,255,255,.07)',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{
        maxWidth: 1140, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', height: 62, gap: 8,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', marginRight: 20, flexShrink: 0 }}>
          <span style={{ fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: '-.5px' }}>
            Earn<span style={{ color: '#7c6fff' }}>IQ</span>
          </span>
          <sup style={{ fontSize: 9, color: '#00e5b8', fontWeight: 700, marginLeft: 2 }}>BETA</sup>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {links.filter(l => !l.auth || user).map(l => {
            const active = location.pathname === l.to;
            return (
              <Link key={l.to} to={l.to} style={{
                padding: '6px 13px', borderRadius: 8, textDecoration: 'none',
                fontSize: 13, fontWeight: 600,
                color: active ? '#fff' : '#7777aa',
                background: active ? 'rgba(124,111,255,.18)' : 'transparent',
                transition: 'all .15s',
              }}
                onMouseEnter={e => { if (!active) e.target.style.color = '#ccc'; }}
                onMouseLeave={e => { if (!active) e.target.style.color = '#7777aa'; }}
              >
                {l.icon} {l.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Level + XP */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, color: '#7777aa', fontWeight: 600 }}>LVL</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#7c6fff' }}>{user.level}</span>
                <span style={{ fontSize: 11, color: '#00e5b8', fontWeight: 700 }}>
                  ${(user.totalEarned || 0).toFixed(2)}
                </span>
              </div>
              <div className="xp-bar-track" style={{ width: 80 }}>
                <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>

            {/* Avatar dropdown */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(v => !v)} style={{
                width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                background: 'linear-gradient(135deg,#7c6fff,#00e5b8)',
                border: '2px solid rgba(255,255,255,.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, color: '#fff',
              }}>
                {user.username[0].toUpperCase()}
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 44, width: 200,
                  background: '#161628', border: '1px solid rgba(255,255,255,.1)',
                  borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,.5)',
                  overflow: 'hidden', zIndex: 300,
                }} onClick={() => setMenuOpen(false)}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>@{user.username}</p>
                    <p style={{ fontSize: 12, color: '#7777aa', marginTop: 2 }}>{user.email}</p>
                  </div>
                  {[
                    { to: '/dashboard', label: '📊 Dashboard' },
                    { to: '/profile',   label: '⚙️ Profile' },
                    { to: '/quiz',      label: '🧠 Start Quiz' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} style={{
                      display: 'block', padding: '11px 16px',
                      textDecoration: 'none', fontSize: 13, fontWeight: 500,
                      color: '#ccc', transition: 'background .15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >{item.label}</Link>
                  ))}
                  <button onClick={handleLogout} style={{
                    width: '100%', padding: '11px 16px', textAlign: 'left',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, color: '#f04060',
                    borderTop: '1px solid rgba(255,255,255,.07)',
                  }}>🚪 Log Out</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/auth" style={{ textDecoration: 'none' }}>
              <button className="btn btn-outline btn-sm">Log In</button>
            </Link>
            <Link to="/auth?tab=register" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary btn-sm">Sign Up</button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
