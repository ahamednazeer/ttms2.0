'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Lock, User } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const token = api.getToken();
        if (!token) {
          setCheckingAuth(false);
          return;
        }
        const userData = await api.getMe();
        const roleRoutes: Record<string, string> = {
          SUPERADMIN: '/admin',
          VENDOR: '/vendor',
          TRANSPORT: '/transport',
          USER: '/citizen',
        };
        const route = roleRoutes[userData.role?.toUpperCase()] || '/citizen';
        router.replace(route);
      } catch {
        api.clearToken();
        setCheckingAuth(false);
      }
    }
    checkExistingAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
        style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}
      >
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
        <div className="relative z-10 text-center space-y-4">
          <Truck size={48} className="text-blue-500 animate-pulse mx-auto" />
          <div className="text-slate-500 font-mono text-sm animate-pulse">VERIFYING SESSION...</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(username, password);
      const roleRoutes: Record<string, string> = {
        SUPERADMIN: '/admin',
        VENDOR: '/vendor',
        TRANSPORT: '/transport',
        USER: '/citizen',
      };
      const route = roleRoutes[response.user.role?.toUpperCase()] || '/citizen';
      router.push(route);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
      <div className="scanlines" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="panel p-8 backdrop-blur-md">
          <div className="flex flex-col items-center mb-8">
            <Truck size={48} weight="duotone" className="text-blue-400 mb-4" />
            <h1 className="text-3xl font-chivo font-bold uppercase tracking-wider text-center">
              TTMS
            </h1>
            <p className="page-subtitle text-center mt-2">Secure transport tracking, OTP verification, and operational management</p>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800 rounded-lg p-3 mb-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="input-modern !pl-[3.25rem]"
                  placeholder="Enter username"
                  id="username-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2 font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-modern !pl-[3.25rem]"
                  placeholder="Enter password"
                  id="password-input"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
              id="login-submit-btn"
            >
              {loading ? 'Authenticating...' : 'Access System'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

