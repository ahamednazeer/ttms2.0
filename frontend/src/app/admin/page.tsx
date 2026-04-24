'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataCard } from '@/components/DataCard';
import { api } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import {
  Users, Gauge, Buildings, MapPin, Truck, Storefront,
  Ticket, Sparkle, ArrowSquareOut
} from '@phosphor-icons/react';
import { DashboardSkeleton } from '@/components/Skeleton';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton cardCount={6} />;

  const quickActions = [
    { label: 'Manage Cities', path: '/admin/cities', hue: isDark ? 'from-blue-900/40 to-blue-950/60 border-blue-700/30 hover:border-blue-600/50 text-blue-300' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400 text-blue-700' },
    { label: 'Manage Vendors', path: '/admin/vendors', hue: isDark ? 'from-purple-900/40 to-purple-950/60 border-purple-700/30 hover:border-purple-600/50 text-purple-300' : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:border-purple-400 text-purple-700' },
    { label: 'View Tickets', path: '/admin/tickets', hue: isDark ? 'from-green-900/40 to-green-950/60 border-green-700/30 hover:border-green-600/50 text-green-300' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:border-emerald-400 text-emerald-700' },
    { label: 'Invoices', path: '/admin/invoices', hue: isDark ? 'from-orange-900/40 to-orange-950/60 border-orange-700/30 hover:border-orange-600/50 text-orange-300' : 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400 text-amber-700' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className={`text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3 ${isDark ? '' : 'text-[color:var(--text-primary)]'}`}>
          <Gauge size={28} weight="duotone" className={isDark ? 'text-indigo-400' : 'text-[color:var(--accent)]'} />
          Administration
        </h1>
        <p className="page-subtitle mt-1">Monitor platform activity, key operational metrics, and administrative workflows from one place.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <DataCard title="Cities" value={stats?.cityCount || 0} icon={Buildings} iconColor={isDark ? 'text-indigo-400' : 'text-indigo-600'} />
        <DataCard title="Locations" value={stats?.locationCount || 0} icon={MapPin} iconColor={isDark ? 'text-red-400' : 'text-red-600'} />
        <DataCard title="Users" value={stats?.userCount || 0} icon={Users} iconColor={isDark ? 'text-green-400' : 'text-green-600'} />
        <DataCard title="Tickets" value={stats?.rideTicketCount || 0} icon={Ticket} iconColor={isDark ? 'text-blue-400' : 'text-blue-600'} />
        <DataCard title="Transports" value={stats?.transportCount || 0} icon={Truck} iconColor={isDark ? 'text-purple-400' : 'text-purple-600'} />
        <DataCard title="Vendors" value={stats?.vendorCount || 0} icon={Storefront} iconColor={isDark ? 'text-yellow-400' : 'text-yellow-600'} />
      </div>

      {/* Quick Actions & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card relative overflow-hidden">
          <Sparkle size={80} weight="duotone" className={`absolute -right-4 -top-4 ${isDark ? 'text-slate-700/20' : 'text-[color:var(--accent)]/10'}`} />
          <h3 className={`text-sm font-mono uppercase tracking-widest mb-5 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'muted-text'}`}>
            <Users size={16} weight="duotone" />
            Ticket Status
          </h3>
          <div className="space-y-3 relative z-10">
            {stats?.ticketsByStatus && Object.entries(stats.ticketsByStatus).map(([status, count]: [string, any]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors"
                style={{
                  background: isDark ? 'rgba(15,23,42,0.5)' : 'color-mix(in srgb, var(--surface-2) 90%, transparent)',
                  border: `1px solid ${isDark ? 'rgba(51,65,85,0.5)' : 'var(--border)'}`,
                }}
              >
                <span className={`text-sm font-mono uppercase tracking-wider ${isDark ? 'text-slate-400' : 'secondary-text'}`}>{status.replace(/_/g, ' ')}</span>
                <span className={`font-bold font-mono text-lg ${isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]'}`}>{count}</span>
              </div>
            ))}
            {!stats?.ticketsByStatus && (
              <div className={`font-mono text-sm ${isDark ? 'text-slate-500' : 'muted-text'}`}>No ticket data yet</div>
            )}
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <Sparkle size={80} weight="duotone" className={`absolute -right-4 -top-4 ${isDark ? 'text-slate-700/20' : 'text-[color:var(--accent)]/10'}`} />
          <h3 className={`text-sm font-mono uppercase tracking-widest mb-5 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'muted-text'}`}>
            <ArrowSquareOut size={16} weight="duotone" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3 relative z-10">
            {quickActions.map((action) => (
              <button
                key={action.path}
                onClick={() => router.push(action.path)}
                className={`${isDark ? `bg-gradient-to-br ${action.hue}` : action.hue} border rounded-xl px-4 py-3 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02]`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

