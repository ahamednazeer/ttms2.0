'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { mounted, theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-10 items-center gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 text-sm font-medium text-[color:var(--text-primary)] shadow-[var(--shadow-sm)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)] ${className}`}
      aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Toggle theme'}
      title={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Toggle theme'}
    >
      {mounted && isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-[color:var(--accent)]" />}
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
        {mounted ? (isDark ? 'Light' : 'Dark') : 'Theme'}
      </span>
    </button>
  );
}
