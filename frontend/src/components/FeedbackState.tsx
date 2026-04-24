import React from 'react';
import { CircleNotch, Package, type Icon } from '@phosphor-icons/react';

interface LoadingStateProps {
  label?: string;
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: Icon;
}

export function LoadingState({ label = 'Loading data...' }: LoadingStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 py-12 text-center">
      <CircleNotch size={28} className="text-blue-400 animate-spin" />
      <div className="space-y-1">
        <p className="text-slate-200 font-medium">{label}</p>
        <p className="text-slate-500 text-sm font-mono uppercase tracking-wider">
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
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="w-16 h-16 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-center">
        <IconComponent size={34} weight="duotone" className="text-slate-500" />
      </div>
      <div className="space-y-1">
        <p className="text-slate-200 font-semibold uppercase tracking-wide">{title}</p>
        <p className="text-slate-500 text-sm max-w-sm">{description}</p>
      </div>
    </div>
  );
}
