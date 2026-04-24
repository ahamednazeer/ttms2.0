'use client';

import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={isDark ? { background: 'rgba(15, 23, 42, 0.7)' } : { background: 'color-mix(in srgb, var(--overlay) 100%, transparent)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`panel w-full ${sizeClasses[size]} animate-scale-in max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={isDark ? { borderColor: 'rgba(30, 41, 59, 0.9)' } : { borderColor: 'var(--border)' }}>
          <h2 className={`text-xl font-chivo font-bold uppercase tracking-wider ${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'}`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 ${isDark ? 'text-slate-400 hover:text-slate-100' : 'secondary-text hover:primary-text'}`}
            style={isDark
              ? { border: '1px solid rgba(51, 65, 85, 0.8)', background: 'rgba(15, 23, 42, 0.7)' }
              : { border: '1px solid var(--border)', background: 'color-mix(in srgb, var(--surface-2) 78%, transparent)' }}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
