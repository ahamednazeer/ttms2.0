'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from '@phosphor-icons/react';
import { StatusBadge } from '@/components/StatusBadge';
import { useTheme } from '@/components/ThemeProvider';

type DetailItem = {
  label: string;
  value: string;
  emphasis?: 'money' | 'default';
};

type Action = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
};

type InfoBadge = {
  label: string;
  tone?: 'emerald' | 'amber' | 'blue';
};

type CompletedJourneyCardProps = {
  title: string;
  subtitle: string;
  successTitle: string;
  successBody: string;
  status: string;
  timeline?: string[];
  invoiceBadge?: InfoBadge;
  summaryDetails: DetailItem[];
  metaDetails?: DetailItem[];
  pickup: string;
  drop: string;
  historyNote: string;
  actions: Action[];
};

type TripProgressTrackerProps = {
  steps: string[];
  currentStep: string;
  compact?: boolean;
};

function TripProgressTracker({ steps, currentStep, compact = false }: TripProgressTrackerProps) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const activeIndex = Math.max(0, steps.indexOf(currentStep));

  return (
    <div className={`grid gap-3 ${compact || steps.length === 4 ? 'grid-cols-4' : 'grid-cols-2 md:grid-cols-4'}`}>
      {steps.map((step, index) => {
        const state = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'upcoming';
        const dotClass = state === 'done'
          ? 'border-emerald-500 bg-emerald-500 text-white'
          : state === 'active'
            ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
            : isDark
              ? 'border-slate-700 bg-slate-900 text-slate-500'
              : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-[color:var(--text-muted)]';
        const lineStyle = index < activeIndex
          ? { background: isDark ? '#10b981' : '#16a34a' }
          : isDark
            ? { background: 'rgba(51, 65, 85, 0.9)' }
            : { background: 'var(--border)' };
        const textClass = state === 'upcoming'
          ? (isDark ? 'text-slate-500' : 'muted-text')
          : state === 'active'
            ? (isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]')
            : (isDark ? 'text-slate-300' : 'text-[color:var(--text-secondary)]');

        return (
          <div key={step} className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all duration-300 ease-out ${dotClass}`}
              >
                {state === 'done' ? '✓' : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1">
                  <div className="h-px w-full rounded-full transition-all duration-300 ease-out" style={lineStyle} />
                </div>
              )}
            </div>
            <p className={`text-[11px] leading-4 transition-colors duration-300 ${textClass}`}>{step}</p>
          </div>
        );
      })}
    </div>
  );
}

function InfoPill({ label, tone = 'blue' }: InfoBadge) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const toneClass =
    tone === 'emerald'
      ? isDark
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
        : 'border-emerald-500/20 bg-emerald-500/8 text-emerald-700'
      : tone === 'amber'
        ? isDark
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
          : 'border-amber-500/20 bg-amber-500/8 text-amber-700'
        : isDark
          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
          : 'border-blue-500/20 bg-blue-500/8 text-blue-700';

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wide ${toneClass}`}>{label}</span>;
}

function DetailGrid({ items, columns = 2 }: { items: DetailItem[]; columns?: 2 | 3 }) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const gridClass = columns === 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-3' : 'grid grid-cols-1 md:grid-cols-2 gap-3';

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border p-3 space-y-1"
          style={isDark
            ? { borderColor: 'rgba(30, 41, 59, 1)', background: 'rgba(15, 23, 42, 0.4)' }
            : { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-2) 88%, transparent)' }}
        >
          <p className={`font-mono text-xs uppercase tracking-wider ${isDark ? 'text-slate-500' : 'muted-text'}`}>{item.label}</p>
          <p className={item.emphasis === 'money'
            ? (isDark ? 'text-emerald-400 text-lg font-semibold' : 'text-emerald-700 text-lg font-semibold')
            : `${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'} font-semibold break-all`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function CompletedJourneyCard({
  title,
  subtitle,
  successTitle,
  successBody,
  status,
  timeline = [],
  invoiceBadge,
  summaryDetails,
  metaDetails = [],
  pickup,
  drop,
  historyNote,
  actions,
}: CompletedJourneyCardProps) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={`mx-auto w-full max-w-6xl space-y-5 sm:space-y-6 transition-all duration-500 ease-out ${entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
      <div className="space-y-2">
        <h1 className={`text-2xl font-chivo font-bold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'}`}>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      <div className="card space-y-5">
        <div
          className="rounded-xl border p-4 space-y-1"
          style={isDark
            ? { borderColor: 'rgba(5, 150, 105, 0.35)', background: 'rgba(16, 185, 129, 0.1)' }
            : { borderColor: 'rgba(34, 197, 94, 0.2)', background: 'rgba(34, 197, 94, 0.08)' }}
        >
          <p className={isDark ? 'text-emerald-300 font-semibold' : 'text-emerald-700 font-semibold'}>{successTitle}</p>
          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-[color:var(--text-secondary)]'}`}>{successBody}</p>
        </div>

        <div
          className="rounded-xl border p-4 space-y-4"
          style={isDark
            ? { borderColor: 'rgba(30, 41, 59, 1)', background: 'rgba(2, 6, 23, 0.18)' }
            : { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-2) 92%, transparent)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className={`font-mono text-xs uppercase ${isDark ? 'text-slate-500' : 'muted-text'}`}>Trip Receipt</span>
            <StatusBadge status={status} />
          </div>
          {timeline.length > 0 && <TripProgressTracker steps={timeline} currentStep={timeline[timeline.length - 1]} compact />}
          {invoiceBadge && (
            <div className="pt-1">
              <InfoPill {...invoiceBadge} />
            </div>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <DetailGrid items={summaryDetails} />
            {metaDetails.length > 0 && <DetailGrid items={metaDetails} columns={metaDetails.length >= 3 ? 3 : 2} />}
          </div>

          <div className="space-y-4">
            <div
              className="rounded-xl border p-4 space-y-3"
              style={isDark
                ? { borderColor: 'rgba(51, 65, 85, 0.8)', background: 'rgba(2, 6, 23, 0.3)' }
                : { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-2) 84%, transparent)' }}
            >
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-green-400" weight="duotone" />
                <div>
                  <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'muted-text'}`}>PICKUP</p>
                  <p className={isDark ? 'text-slate-200' : 'text-[color:var(--text-primary)]'}>{pickup}</p>
                </div>
              </div>
              <div className="ml-2.5 h-4 border-l-2 border-dashed" style={isDark ? { borderColor: 'rgba(51, 65, 85, 1)' } : { borderColor: 'var(--border)' }} />
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-red-400" weight="duotone" />
                <div>
                  <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'muted-text'}`}>DROP</p>
                  <p className={isDark ? 'text-slate-200' : 'text-[color:var(--text-primary)]'}>{drop}</p>
                </div>
              </div>
            </div>

            <div
              className="rounded-lg border p-3"
              style={isDark
                ? { borderColor: 'rgba(59, 130, 246, 0.28)', background: 'rgba(30, 64, 175, 0.12)' }
                : { borderColor: 'rgba(59, 130, 246, 0.18)', background: 'rgba(59, 130, 246, 0.06)' }}
            >
              <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-[color:var(--text-secondary)]'}`}>{historyNote}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {actions.map((action) =>
            action.href ? (
              <Link
                key={action.label}
                href={action.href}
                className={`${action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} flex-1 text-center py-3`}
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
      </div>
    </div>
  );
}

export { InfoPill, TripProgressTracker };
