import React from 'react';
import Link from 'next/link';
import { CircleNotch, Package, type Icon } from '@phosphor-icons/react';
import { useTheme } from '@/components/ThemeProvider';

interface LoadingStateProps {
  label?: string;
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: Icon;
  actions?: Array<
    | { label: string; href: string; variant?: 'primary' | 'secondary' }
    | { label: string; onClick: () => void; variant?: 'primary' | 'secondary' }
  >;
}

export function LoadingState({ label = 'Loading data...' }: LoadingStateProps) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  return (
    <div className="card flex flex-col items-center justify-center gap-3 py-12 text-center">
      <CircleNotch size={28} className="text-blue-400 animate-spin" />
      <div className="space-y-1">
        <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-[color:var(--text-primary)]'}`}>{label}</p>
        <p className={`text-sm font-mono uppercase tracking-wider ${isDark ? 'text-slate-500' : 'muted-text'}`}>
          Please wait a moment
        </p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: IconComponent = Package,
  actions = [],
}: EmptyStateProps) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  return (
    <div className="card flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={isDark
          ? { border: '1px solid rgba(30, 41, 59, 0.9)', background: 'rgba(2, 6, 23, 0.6)' }
          : { border: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface-2) 84%, transparent)' }}
      >
        <IconComponent size={34} weight="duotone" className={isDark ? 'text-slate-500' : 'muted-text'} />
      </div>
      <div className="space-y-1">
        <p className={`font-semibold uppercase tracking-wide ${isDark ? 'text-slate-200' : 'text-[color:var(--text-primary)]'}`}>{title}</p>
        <p className={`text-sm max-w-sm ${isDark ? 'text-slate-500' : 'muted-text'}`}>{description}</p>
      </div>
      {actions.length > 0 && (
        <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          {actions.map((action) =>
            'href' in action ? (
              <Link
                key={action.label}
                href={action.href}
                className={`${action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} flex-1 py-3 text-center`}
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={`${action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} flex-1 py-3`}
              >
                {action.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
