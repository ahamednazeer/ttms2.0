'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LockKey } from '@phosphor-icons/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!token) {
      setError('This reset link is missing or invalid.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.resetPassword(token, password);
      setMessage(response.message || 'Password reset successful.');
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setError(err.message || 'Unable to reset your password.');
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
        <div className="panel p-8 backdrop-blur-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <LockKey size={48} weight="duotone" className="text-blue-400 mb-4" />
            <h1 className="text-3xl font-chivo font-bold uppercase tracking-wider">Choose a New Password</h1>
            <p className="page-subtitle mt-2">
              Set a new password for your TTMS account. For security, reset links expire automatically.
            </p>
          </div>

          {!token && (
            <div className="alert-warning">
              This reset link is missing a token. Please request a new password reset email.
            </div>
          )}

          {message && <div className="info-strip">{message}</div>}

          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input-modern"
                placeholder="Enter a new password"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="field-label">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="input-modern"
                placeholder="Confirm your new password"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading || !token} className="w-full btn-primary py-3">
              {loading ? 'Resetting password...' : 'Reset Password'}
            </button>
          </form>

          <Link href="/" className="inline-flex items-center gap-2 text-sm secondary-text hover:primary-text transition-colors">
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-shell min-h-screen flex items-center justify-center relative">
          <div className="relative z-10 secondary-text font-mono">Loading reset link...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
