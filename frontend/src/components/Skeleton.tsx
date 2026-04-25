'use client';

import React from 'react';

/* ─── Primitive skeleton block ─── */
export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-shimmer rounded-lg ${className}`}
      style={style}
    />
  );
}

/* ─── Page-level skeleton presets ─── */

/** Header row: page icon + title shimmer */
export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-7 rounded-md" />
        <Skeleton className="h-7 w-44" />
      </div>
      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
  );
}

/** Subtitle shimmer */
export function SubtitleSkeleton() {
  return <Skeleton className="h-4 w-80 mt-1" />;
}

/** A single DataCard shimmer */
export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

/** Grid of card skeletons */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Table skeleton: header + rows */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="panel overflow-hidden">
      {/* Search header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-9 w-52 rounded-lg" />
      </div>
      {/* Header row */}
      <div className="px-6 py-4 flex gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }, (_, rowIdx) => (
        <div
          key={rowIdx}
          className="px-6 py-4 flex gap-6"
          style={{ borderBottom: '1px solid var(--border)', opacity: 1 - rowIdx * 0.12 }}
        >
          {Array.from({ length: cols }, (_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Full-page CRUD skeleton: header + subtitle + table */
export function CrudPageSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeaderSkeleton />
      <SubtitleSkeleton />
      <TableSkeleton cols={cols} />
    </div>
  );
}

/** Dashboard skeleton: header + cards + two panels */
export function DashboardSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-48" />
        </div>
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <CardGridSkeleton count={cardCount} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
        <div className="card p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact single-card skeleton (citizen / transport pages) */
export function SingleCardSkeleton() {
  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="card p-6 space-y-5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
        </div>
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
