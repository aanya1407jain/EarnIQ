import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const TOKEN_KEY = 'earniq_token';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.user) setUser(data.user); else clearSession(); })
        .catch(clearSession)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  async function register(username, email, password, walletAddress) {
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, walletAddress }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function login(emailOrUsername, password) {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() { clearSession(); }

  async function refreshUser() {
    if (!token) return;
    const r = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) { const d = await r.json(); setUser(d.user); }
  }

  async function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }

  return (
    <AuthCtx.Provider value={{ user, token, loading, register, login, logout, refreshUser, authFetch, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
