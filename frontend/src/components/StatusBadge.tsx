import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'status-success',
  INACTIVE: 'status-failed',
  PENDING: 'status-pending',
  ASSIGNED: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  RIDE_STARTED: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  COMPLETED: 'status-success',
  CANCELLED: 'status-failed',
  PAID: 'status-success',
  UNPAID: 'status-pending',
  SUPERADMIN: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  VENDOR: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  TRANSPORT: 'status-success',
  USER: 'status-pending',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const style = statusStyles[status?.toUpperCase()] || 'secondary-text';
  const label = (status || 'UNKNOWN').replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border shadow-sm ${style} ${className}`}
      style={style === 'secondary-text'
        ? (isDark
            ? { background: 'rgba(2, 6, 23, 0.5)', borderColor: 'rgba(30, 41, 59, 1)', color: '#94a3b8' }
            : { background: 'color-mix(in srgb, var(--surface-3) 50%, transparent)', borderColor: 'var(--border)' })
        : undefined}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
      {label}
    </span>
  );
}
