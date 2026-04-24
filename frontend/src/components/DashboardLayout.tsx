'use client';

import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { realtimeClient } from '@/lib/realtime';
import type { User } from '@/lib/types';
import {
  Truck,
  SignOut,
  Gauge,
  Users,
  MapPin,
  Buildings,
  CurrencyDollar,
  Ticket,
  Invoice,
  ShieldCheck,
  CarSimple,
  ClockCounterClockwise,
  List,
  Path,
  Storefront,
} from '@phosphor-icons/react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

type SessionUser = Partial<User> & Pick<User, 'role'>;

const MIN_WIDTH = 60;
const COLLAPSED_WIDTH = 64;
const DEFAULT_WIDTH = 64;
const MAX_WIDTH = 320;

const menuItemsByRole: Record<string, MenuItem[]> = {
  SUPERADMIN: [
    { icon: Gauge, label: 'Dashboard', path: '/admin' },
    { icon: Buildings, label: 'Cities', path: '/admin/cities' },
    { icon: MapPin, label: 'Locations', path: '/admin/locations' },
    { icon: CurrencyDollar, label: 'Location Costs', path: '/admin/location-costs' },
    { icon: Storefront, label: 'Vendors', path: '/admin/vendors' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Truck, label: 'Transports', path: '/admin/transports' },
    { icon: Ticket, label: 'Tickets', path: '/admin/tickets' },
    { icon: Invoice, label: 'Invoices', path: '/admin/invoices' },
    { icon: ShieldCheck, label: 'Audit Logs', path: '/admin/audit-logs' },
  ],
  VENDOR: [
    { icon: Gauge, label: 'Dashboard', path: '/vendor' },
    { icon: Ticket, label: 'Tickets', path: '/vendor/tickets' },
    { icon: Truck, label: 'Transports', path: '/vendor/transports' },
  ],
  TRANSPORT: [
    { icon: CarSimple, label: 'Active Journey', path: '/transport' },
    { icon: ClockCounterClockwise, label: 'History', path: '/transport/history' },
  ],
  USER: [
    { icon: Path, label: 'Book Ride', path: '/citizen' },
    { icon: ClockCounterClockwise, label: 'History', path: '/citizen/history' },
  ],
};

export default function DashboardLayout({
  children,
  userRole: propRole,
  userName: propName,
  userEmail: propEmail,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, mounted } = useTheme();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedWidth = localStorage.getItem('ttms_sidebarWidth');
    const savedHidden = localStorage.getItem('ttms_sidebarHidden');
    if (savedWidth) setSidebarWidth(parseInt(savedWidth));
    if (savedHidden === 'true') setIsHidden(true);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem('ttms_sidebarWidth', sidebarWidth.toString());
      localStorage.setItem('ttms_sidebarHidden', isHidden.toString());
    }
  }, [sidebarWidth, isHidden, isResizing]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = e.clientX;
      if (newWidth < MIN_WIDTH) {
        setIsHidden(true);
        setSidebarWidth(COLLAPSED_WIDTH);
      } else {
        setIsHidden(false);
        const clampedWidth = Math.min(MAX_WIDTH, Math.max(COLLAPSED_WIDTH, newWidth));
        setSidebarWidth(clampedWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    async function checkAuth() {
      if (propRole) {
        setUser({ role: propRole as User['role'], firstName: propName, email: propEmail });
        setLoading(false);
        return;
      }
      try {
        const userData = await api.getMe();
        setUser(userData);

        // Role-based route protection
        const role = userData.role?.toUpperCase();
        if (pathname.startsWith('/admin') && role !== 'SUPERADMIN') {
          const roleRoutes: Record<string, string> = {
            VENDOR: '/vendor',
            TRANSPORT: '/transport',
            USER: '/citizen',
          };
          router.replace(roleRoutes[role] || '/');
          return;
        }
      } catch (error) {
        console.error('Auth check failed', error);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname, propRole, propName, propEmail, router]);

  const handleLogout = () => {
    realtimeClient.disconnect();
    api.clearToken();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Truck size={48} className="text-[color:var(--accent)] animate-pulse mx-auto" />
          <div className="muted-text font-mono text-sm animate-pulse">VERIFYING CREDENTIALS...</div>
        </div>
      </div>
    );
  }

  const role = propRole || user?.role?.toUpperCase() || 'USER';
  const name = propName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User');
  const email = propEmail || user?.email || '';
  const menuItems = menuItemsByRole[role] || menuItemsByRole.USER;
  const isDark = !mounted || theme === 'dark';
  const isCollapsed = sidebarWidth < 150;
  const showLabels = sidebarWidth >= 150 && !isHidden;
  const currentMenuItem = menuItems.find((item) => pathname === item.path) ||
    menuItems.find((item) => pathname.startsWith(`${item.path}/`));
  const pageTitle = currentMenuItem?.label || 'Dashboard';
  const roleLabel = role.replace('_', ' ');

  return (
    <div className={`${isDark ? 'min-h-screen bg-slate-950' : 'app-shell min-h-screen'} flex`}>
      <div className="scanlines" />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`print:hidden h-screen sticky top-0 flex flex-col z-50 transition-all ${isDark ? 'bg-slate-900 border-r border-slate-800' : 'border-r' } ${isResizing ? 'transition-none' : 'duration-200'
          } ${isHidden ? 'w-0 overflow-hidden border-0' : ''}`}
        style={isDark
          ? { width: isHidden ? 0 : sidebarWidth }
          : {
              width: isHidden ? 0 : sidebarWidth,
              background: 'color-mix(in srgb, var(--surface-1) 96%, transparent)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
      >
        {/* Header */}
        <div
          className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}
        >
          <Truck size={28} weight="duotone" className={`${isDark ? 'text-blue-400' : 'text-[color:var(--accent)]'} flex-shrink-0`} />
          {showLabels && (
            <div className="overflow-hidden">
              <h1 className={`font-chivo font-bold text-sm uppercase whitespace-nowrap ${isDark ? 'tracking-wider text-slate-100' : 'tracking-[0.18em] text-[color:var(--text-primary)]'}`}>TTMS</h1>
              <p className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'muted-text'}`}>{role.replace('_', ' ')}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 ${isDark ? 'rounded-sm' : 'rounded-lg'} transition-all duration-150 text-sm font-medium ${isCollapsed ? 'justify-center' : ''
                      } ${isActive
                        ? isDark
                          ? 'text-blue-400 bg-blue-950/50 border-l-2 border-blue-400'
                          : 'text-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                        : isDark
                          ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                          : 'secondary-text hover:primary-text hover:bg-[color:var(--surface-3)]'
                      }`}
                    style={!isDark && isActive ? { boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent)' } : undefined}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={20} weight="duotone" className="flex-shrink-0" />
                    {showLabels && <span className="truncate">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-2">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 ${isDark ? 'rounded-sm text-red-400 hover:text-red-300 hover:bg-slate-800' : 'rounded-lg text-[color:var(--danger)] hover:bg-[color:var(--surface-3)]'} transition-all duration-150 text-sm font-medium ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <SignOut size={20} className="flex-shrink-0" />
            {showLabels && 'Sign Out'}
          </button>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-ew-resize hover:bg-blue-500/50 active:bg-blue-500 transition-colors z-50"
          onMouseDown={startResizing}
          style={{ transform: 'translateX(50%)' }}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-10">
        {/* Header */}
        <div className="print:hidden relative z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {isHidden && (
                <button
                  onClick={() => { setIsHidden(false); setSidebarWidth(DEFAULT_WIDTH); }}
                  className={`p-2 transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded' : 'secondary-text hover:primary-text hover:bg-[color:var(--surface-3)] rounded-lg'}`}
                  title="Show Sidebar"
                >
                  <List size={24} />
                </button>
              )}
              <div>
                <p className="section-title">TTMS / {roleLabel}</p>
                <h2 className={`font-chivo font-bold text-2xl uppercase mt-1 ${isDark ? 'tracking-wider text-slate-100' : 'tracking-[0.08em] text-[color:var(--text-primary)]'}`}>{pageTitle}</h2>
                <p className={`text-xs font-mono mt-1 ${isDark ? 'text-slate-400' : 'secondary-text'}`}>Welcome back, {name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle className="hidden sm:inline-flex" />
              <div className="text-right hidden sm:block">
                <p className={`text-xs uppercase tracking-wider font-mono ${isDark ? 'text-slate-500' : 'muted-text'}`}>Logged in as</p>
                <p className={`text-sm font-mono ${isDark ? 'text-slate-300' : 'text-[color:var(--text-secondary)]'}`}>{email}</p>
              </div>
              <div className={`h-9 w-9 rounded-full flex items-center justify-center overflow-hidden text-white font-bold text-sm ${isDark ? 'shadow-lg bg-gradient-to-br from-blue-600 to-blue-800' : ''}`}
                style={isDark ? undefined : {
                  background: 'linear-gradient(135deg, var(--accent), #0ea5e9)',
                  boxShadow: 'var(--shadow-md)',
                }}>
                {name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
          <div className="px-6 pb-4 sm:hidden">
            <ThemeToggle className="w-full justify-center" />
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>

      {isResizing && (
        <div className="fixed inset-0 z-[100] cursor-ew-resize" />
      )}
    </div>
  );
}
