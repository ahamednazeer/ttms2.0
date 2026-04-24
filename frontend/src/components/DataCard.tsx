import React from 'react';

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
  return (
    <div className={`card card-hover relative overflow-hidden ${className}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-400/30 to-transparent" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wider font-mono mb-2">{title}</p>
          <p className="text-3xl font-bold font-mono text-slate-100 tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-xl border border-slate-700/70 bg-slate-900/70 p-3 ${iconColor}`}>
            <Icon size={28} weight="duotone" />
          </div>
        )}
      </div>
    </div>
  );
}
