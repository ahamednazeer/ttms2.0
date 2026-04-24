'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Lock, User } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

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
      <div className="auth-shell min-h-screen flex items-center justify-center relative">
        <div className="relative z-10 text-center space-y-4">
          <Truck size={48} className="text-[color:var(--accent)] animate-pulse mx-auto" />
          <div className="muted-text font-mono text-sm animate-pulse">Checking your session...</div>
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
      setError(err.message || 'Sign-in failed. Check your username and password and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center relative">
      <div className="scanlines" />
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="panel p-8 backdrop-blur-md">
          <div className="flex flex-col items-center mb-8">
            <Truck size={48} weight="duotone" className="text-blue-400 mb-4" />
            <h1 className="text-3xl font-chivo font-bold uppercase tracking-wider text-center">
              TTMS
            </h1>
            <p className="page-subtitle text-center mt-2">Sign in to manage journeys, assignments, and operational workflows securely.</p>
          </div>

          {error && (
            <div className="alert-error mb-4">
              {error}
            </div>
          )}

          <div className="info-strip mb-4">
            Access is provisioned by an administrator. If you need a new account, please contact your TTMS administrator.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
            <div>
              <label className="field-label">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 muted-text pointer-events-none" size={16} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="input-modern !pl-[3.25rem]"
                  placeholder="Enter your username"
                  id="username-input"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="field-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 muted-text pointer-events-none" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-modern !pl-[3.25rem]"
                  placeholder="Enter your password"
                  id="password-input"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
              id="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

