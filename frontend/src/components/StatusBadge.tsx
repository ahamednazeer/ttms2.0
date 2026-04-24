import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'text-green-400 bg-green-950/50 border-green-800',
  INACTIVE: 'text-red-400 bg-red-950/50 border-red-800',
  PENDING: 'text-yellow-400 bg-yellow-950/50 border-yellow-800',
  ASSIGNED: 'text-blue-400 bg-blue-950/50 border-blue-800',
  RIDE_STARTED: 'text-purple-400 bg-purple-950/50 border-purple-800',
  COMPLETED: 'text-green-400 bg-green-950/50 border-green-800',
  CANCELLED: 'text-red-400 bg-red-950/50 border-red-800',
  PAID: 'text-green-400 bg-green-950/50 border-green-800',
  UNPAID: 'text-yellow-400 bg-yellow-950/50 border-yellow-800',
  SUPERADMIN: 'text-purple-400 bg-purple-950/50 border-purple-800',
  VENDOR: 'text-blue-400 bg-blue-950/50 border-blue-800',
  TRANSPORT: 'text-green-400 bg-green-950/50 border-green-800',
  USER: 'text-yellow-400 bg-yellow-950/50 border-yellow-800',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = statusStyles[status?.toUpperCase()] || 'text-slate-400 bg-slate-950/50 border-slate-800';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${style} ${className}`}
    >
      {(status || '').replace(/_/g, ' ')}
    </span>
  );
}
