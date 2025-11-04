import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE || 'http://localhost:5000';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const navigate = useNavigate();

  function sanitizeMessage(raw?: any) {
    if (!raw && raw !== 0) return null;
    const s = String(raw).trim();
    if (!s) return null;
    // Capitalize first letter
    const first = s.charAt(0).toUpperCase() + s.slice(1);
    // Ensure it ends with punctuation
    if (!/[.?!]$/.test(first)) return first + '.';
    return first;
  }

  function resetMessages() {
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!username.trim() || !password) {
      setError(sanitizeMessage('Please enter both username and password.'));
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          // server sends { error: 'message' }
          setError(sanitizeMessage(data?.error || 'Login failed'));
          return;
        }

        // expected { token, username }
        if (data?.token) {
          localStorage.setItem('token', data.token);
        }
        if (data?.username) {
          localStorage.setItem('username', data.username);
        }

        // navigate to home
        navigate('/');
      } else {
        // register
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(sanitizeMessage(data?.error || 'Registration failed'));
          return;
        }

        // registration success — switch to login and prefill
        setInfo(sanitizeMessage('Registration successful. Please log in.'));
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(sanitizeMessage(err?.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-700 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-white mb-1">
          {isLogin ? 'Sign in' : 'Create an account'}
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          {isLogin
            ? 'Enter your credentials to sign in.'
            : 'Choose a username and password to register.'}
        </p>

        {error && <div className="text-sm text-rose-400 mb-3">{error}</div>}
        {info && <div className="text-sm text-emerald-400 mb-3">{info}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <div className="text-xs text-slate-400 mb-1">Username</div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white"
              placeholder="username"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <div className="text-xs text-slate-400 mb-1">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white"
              placeholder="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </label>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-400 text-slate-900 font-semibold rounded disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : isLogin
                ? 'Sign in'
                : 'Create account'}
            </button>

            <button
              type="button"
              onClick={() => {
                resetMessages();
                setIsLogin((s) => !s);
              }}
              className="text-sm text-slate-400 underline"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
