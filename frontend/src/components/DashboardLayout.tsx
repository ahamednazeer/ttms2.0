'use client';

import React, { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { realtimeClient } from '@/lib/realtime';
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

  const [user, setUser] = useState<any>(null);
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
        setUser({ role: propRole, firstName: propName, email: propEmail });
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Truck size={48} className="text-blue-500 animate-pulse mx-auto" />
          <div className="text-slate-500 font-mono text-sm animate-pulse">VERIFYING CREDENTIALS...</div>
        </div>
      </div>
    );
  }

  const role = propRole || user?.role?.toUpperCase() || 'USER';
  const name = propName || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User');
  const email = propEmail || user?.email || '';
  const menuItems = menuItemsByRole[role] || menuItemsByRole.USER;
  const isCollapsed = sidebarWidth < 150;
  const showLabels = sidebarWidth >= 150 && !isHidden;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="scanlines" />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`print:hidden bg-slate-900 border-r border-slate-800 h-screen sticky top-0 flex flex-col z-50 transition-all ${isResizing ? 'transition-none' : 'duration-200'
          } ${isHidden ? 'w-0 overflow-hidden border-0' : ''}`}
        style={{ width: isHidden ? 0 : sidebarWidth }}
      >
        {/* Header */}
        <div className={`p-4 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <Truck size={28} weight="duotone" className="text-blue-400 flex-shrink-0" />
          {showLabels && (
            <div className="overflow-hidden">
              <h1 className="font-chivo font-bold text-sm uppercase tracking-wider whitespace-nowrap">TTMS</h1>
              <p className="text-xs text-slate-500 font-mono">{role.replace('_', ' ')}</p>
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150 text-sm font-medium ${isCollapsed ? 'justify-center' : ''
                      } ${isActive
                        ? 'text-blue-400 bg-blue-950/50 border-l-2 border-blue-400'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                      }`}
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
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-sm transition-all duration-150 text-sm font-medium ${isCollapsed ? 'justify-center' : ''}`}
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
        <div className="print:hidden backdrop-blur-md bg-slate-950/80 border-b border-slate-700 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {isHidden && (
                <button
                  onClick={() => { setIsHidden(false); setSidebarWidth(DEFAULT_WIDTH); }}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                  title="Show Sidebar"
                >
                  <List size={24} />
                </button>
              )}
              <div>
                <h2 className="font-chivo font-bold text-xl uppercase tracking-wider">Dashboard</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">Welcome back, {name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">Logged in as</p>
                <p className="text-sm font-mono text-slate-300">{email}</p>
              </div>
              <div className="h-9 w-9 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold text-sm">
                {name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
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
