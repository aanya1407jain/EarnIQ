import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const [params] = useSearchParams();
  const [tab, setTab]         = useState(params.get('tab') === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);

  // Login form state
  const [loginForm, setLoginForm] = useState({ emailOrUsername: '', password: '' });
  // Register form state
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '', confirm: '', walletAddress: '' });
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(loginForm.emailOrUsername, loginForm.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (regForm.password !== regForm.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      await register(regForm.username, regForm.email, regForm.password, regForm.walletAddress);
      setSuccess('Account created! Welcome to EarnIQ 🎉');
      setTimeout(() => navigate('/quiz'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 9,
    border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)',
    color: '#eeeeff', fontFamily: 'Inter, sans-serif', fontSize: 14,
    outline: 'none', transition: 'border-color .2s',
  };

  return (
    <div style={{
      minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1px' }}>
            Earn<span style={{ color: '#7c6fff' }}>IQ</span>
          </div>
          <p style={{ color: '#7777aa', fontSize: 14, marginTop: 6 }}>
            Learn. Answer. Earn real USDC.
          </p>
        </div>

        {/* Tab toggle */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,.04)',
          borderRadius: 10, padding: 4, marginBottom: 28,
          border: '1px solid rgba(255,255,255,.07)',
        }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '9px', border: 'none', cursor: 'pointer',
                borderRadius: 8, fontFamily: 'Inter, sans-serif',
                fontWeight: 700, fontSize: 14,
                background: tab === t ? '#7c6fff' : 'transparent',
                color: tab === t ? '#fff' : '#7777aa',
                transition: 'all .2s',
              }}>
              {t === 'login' ? '🔐 Log In' : '✨ Sign Up'}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 28 }}>
          {error && (
            <div style={{
              padding: '11px 14px', borderRadius: 8, marginBottom: 18,
              background: 'rgba(240,64,96,.1)', border: '1px solid rgba(240,64,96,.3)',
              color: '#f04060', fontSize: 13, fontWeight: 500,
            }}>⚠️ {error}</div>
          )}
          {success && (
            <div style={{
              padding: '11px 14px', borderRadius: 8, marginBottom: 18,
              background: 'rgba(0,229,184,.1)', border: '1px solid rgba(0,229,184,.3)',
              color: '#00e5b8', fontSize: 13, fontWeight: 500,
            }}>✅ {success}</div>
          )}

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Email or Username</label>
                <input style={inputStyle} placeholder="you@example.com or username"
                  value={loginForm.emailOrUsername}
                  onChange={e => setLoginForm(f => ({ ...f, emailOrUsername: e.target.value }))}
                  required
                  onFocus={e => e.target.style.borderColor = '#7c6fff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={inputStyle} placeholder="••••••••"
                    type={showPass ? 'text' : 'password'}
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    required
                    onFocus={e => e.target.style.borderColor = '#7c6fff'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7777aa', fontSize: 16 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? '⏳ Logging in…' : '→ Log In'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#7777aa' }}>
                No account?{' '}
                <span style={{ color: '#7c6fff', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setTab('register')}>Sign up free</span>
              </p>
            </form>
          )}

          {/* ── REGISTER ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Username</label>
                <input style={inputStyle} placeholder="coolcoder42"
                  value={regForm.username}
                  onChange={e => setRegForm(f => ({ ...f, username: e.target.value }))}
                  required minLength={3} maxLength={20}
                  onFocus={e => e.target.style.borderColor = '#7c6fff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                />
                <p style={{ fontSize: 11, color: '#7777aa', marginTop: 4 }}>3–20 chars, letters/numbers/underscores only</p>
              </div>
              <div>
                <label className="label">Email</label>
                <input style={inputStyle} placeholder="you@example.com" type="email"
                  value={regForm.email}
                  onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                  required
                  onFocus={e => e.target.style.borderColor = '#7c6fff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={inputStyle} placeholder="At least 6 characters"
                    type={showPass ? 'text' : 'password'}
                    value={regForm.password}
                    onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                    required minLength={6}
                    onFocus={e => e.target.style.borderColor = '#7c6fff'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7777aa', fontSize: 16 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input style={inputStyle} placeholder="Re-enter password"
                  type={showPass ? 'text' : 'password'}
                  value={regForm.confirm}
                  onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))}
                  required
                  onFocus={e => e.target.style.borderColor = '#7c6fff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                />
              </div>
              <div>
                <label className="label">USDC Wallet Address <span style={{ color: '#7777aa', fontWeight: 400 }}>(optional — add later)</span></label>
                <input style={inputStyle} placeholder="0x... (Base network)"
                  value={regForm.walletAddress}
                  onChange={e => setRegForm(f => ({ ...f, walletAddress: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = '#7c6fff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'}
                />
                <p style={{ fontSize: 11, color: '#7777aa', marginTop: 4 }}>Needed to receive USDC rewards via Locus</p>
              </div>
              <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? '⏳ Creating account…' : '🚀 Create Account & Start Earning'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 13, color: '#7777aa' }}>
                Already have an account?{' '}
                <span style={{ color: '#7c6fff', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setTab('login')}>Log in</span>
              </p>
            </form>
          )}
        </div>

        {/* Demo note */}
        <div style={{
          marginTop: 20, padding: '12px 16px', borderRadius: 10,
          background: 'rgba(0,229,184,.06)', border: '1px solid rgba(0,229,184,.15)',
          fontSize: 12, color: '#7777aa', textAlign: 'center',
        }}>
          💡 Demo mode: no real email verification needed. Just enter any email to try the platform.
        </div>
      </div>
    </div>
  );
}
