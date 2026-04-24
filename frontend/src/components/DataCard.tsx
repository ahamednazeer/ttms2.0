import React from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface DataCardProps {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  className?: string;
  iconColor?: string;
}

export function DataCard({
  title,
  value,
  icon: Icon,
  className = '',
  iconColor = 'text-blue-400',
}: DataCardProps) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';

  return (
    <div className={`card card-hover relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={isDark
          ? { background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent)' }
          : { background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 28%, transparent), transparent)' }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs uppercase tracking-wider font-mono mb-2 ${isDark ? 'text-slate-500' : 'muted-text'}`}>{title}</p>
          <p className={`text-3xl font-bold font-mono tracking-tight ${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'}`}>{value}</p>
        </div>
        {Icon && (
          <div
            className={`rounded-xl p-3 ${iconColor}`}
            style={isDark
              ? { border: '1px solid rgba(71, 85, 105, 0.7)', background: 'rgba(15, 23, 42, 0.7)' }
              : { border: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface-2) 86%, transparent)' }}
          >
            <Icon size={28} weight="duotone" />
          </div>
        )}
      </div>
    </div>
  );
}
