'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDots, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useTheme } from '@/components/ThemeProvider';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatLabel(value: string) {
  const parsed = parseDateValue(value);
  if (!parsed) return '';
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({
  value,
  onChange,
  min,
  placeholder = 'Select travel date',
}: DatePickerProps) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const today = useMemo(() => startOfDay(new Date()), []);
  const minDate = useMemo(() => {
    const parsed = min ? parseDateValue(min) : null;
    return startOfDay(parsed ?? today);
  }, [min, today]);

  const selectedDate = useMemo(() => (value ? parseDateValue(value) : null), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(selectedDate ?? minDate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const leadingEmptyDays = firstDayOfMonth.getDay();

  const canGoToPreviousMonth =
    new Date(viewDate.getFullYear(), viewDate.getMonth(), 1) >
    new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1);
    const normalized = startOfDay(date);
    const dateValue = formatDateValue(normalized);
    const disabled = normalized < minDate;
    const isSelected = value === dateValue;
    const isToday = formatDateValue(normalized) === formatDateValue(today);

    return { dateValue, day: index + 1, disabled, isSelected, isToday };
  });

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            setViewDate(selectedDate ?? minDate);
          }
          setIsOpen((current) => !current);
        }}
        className="input-modern flex items-center justify-between gap-3 text-left"
      >
        <span className={value ? (isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]') : (isDark ? 'text-slate-500' : 'muted-text')}>
          {value ? formatLabel(value) : placeholder}
        </span>
        <CalendarDots size={18} className="text-blue-400 shrink-0" />
      </button>

      <input type="hidden" value={value} required readOnly />

      {isOpen && (
        <div
          className="absolute z-20 mt-2 w-full rounded-xl p-4"
          style={isDark
            ? {
                border: '1px solid rgba(51, 65, 85, 0.8)',
                background: '#0f172a',
                boxShadow: '0 24px 48px rgba(2, 6, 23, 0.6)',
              }
            : {
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                boxShadow: 'var(--shadow-lg)',
              }}
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => canGoToPreviousMonth && setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              disabled={!canGoToPreviousMonth}
              className={`flex h-9 w-9 items-center justify-center ${isDark ? 'rounded-sm' : 'rounded-lg'} transition disabled:cursor-not-allowed disabled:opacity-40`}
              style={isDark
                ? { border: '1px solid rgba(71, 85, 105, 1)', background: '#020617', color: '#cbd5e1' }
                : { border: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface-3) 62%, transparent)', color: 'var(--text-secondary)' }}
            >
              <CaretLeft size={16} />
            </button>
            <div className={`text-sm font-mono uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-[color:var(--text-secondary)]'}`}>{monthLabel}</div>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className={`flex h-9 w-9 items-center justify-center ${isDark ? 'rounded-sm' : 'rounded-lg'} transition`}
              style={isDark
                ? { border: '1px solid rgba(71, 85, 105, 1)', background: '#020617', color: '#cbd5e1' }
                : { border: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface-3) 62%, transparent)', color: 'var(--text-secondary)' }}
            >
              <CaretRight size={16} />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEK_DAYS.map((day) => (
              <div key={day} className={`py-2 text-center text-xs font-mono uppercase ${isDark ? 'text-slate-500' : 'muted-text'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingEmptyDays }, (_, index) => (
              <div key={`empty-${index}`} />
            ))}
            {days.map(({ dateValue, day, disabled, isSelected, isToday }) => (
              <button
                key={dateValue}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(dateValue);
                  setIsOpen(false);
                }}
                className={[
                  `h-10 ${isDark ? 'rounded-sm' : 'rounded-lg'} border text-sm font-mono transition`,
                  isSelected
                    ? 'border-blue-500 bg-blue-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.35)]'
                    : isDark ? 'text-slate-200' : 'text-[color:var(--text-primary)]',
                  isToday && !isSelected ? (isDark ? 'text-blue-300' : 'text-blue-500') : '',
                  disabled ? 'cursor-not-allowed opacity-30' : '',
                ].join(' ')}
                style={isSelected ? undefined : (isDark
                  ? { borderColor: 'rgba(30, 41, 59, 1)', background: '#020617' }
                  : { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-3) 56%, transparent)' })}
              >
                {day}
              </button>
            ))}
          </div>

          <div className={`mt-4 flex items-center justify-between border-t pt-3 text-xs font-mono ${isDark ? 'text-slate-500' : 'muted-text'}`} style={isDark ? { borderColor: 'rgba(30, 41, 59, 1)' } : { borderColor: 'var(--border)' }}>
            <span>Past dates disabled</span>
            <button
              type="button"
              onClick={() => {
                const nextValue = formatDateValue(today);
                onChange(nextValue);
                setViewDate(today);
                setIsOpen(false);
              }}
              className="text-blue-400 transition hover:text-blue-300"
            >
              Pick today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
