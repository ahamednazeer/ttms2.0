'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EnvelopeSimple, ArrowLeft } from '@phosphor-icons/react';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.requestPasswordReset(identifier);
      setMessage(response.message || 'If an account matches that username or email, reset instructions have been sent.');
    } catch (err: any) {
      setError(err.message || 'Unable to send password reset instructions right now.');
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
            <EnvelopeSimple size={48} weight="duotone" className="text-blue-400 mb-4" />
            <h1 className="text-3xl font-chivo font-bold uppercase tracking-wider">Reset Password</h1>
            <p className="page-subtitle mt-2">
              Enter your username or email address and we&apos;ll send a secure password reset link.
            </p>
          </div>

          {message && <div className="info-strip">{message}</div>}

          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">
                Username or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="input-modern"
                placeholder="Enter your username or email"
                autoComplete="username"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3">
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
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
