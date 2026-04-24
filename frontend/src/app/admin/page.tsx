'use client';

import React, { useEffect, useState } from 'react';
import { DataCard } from '@/components/DataCard';
import { api } from '@/lib/api';
import {
  Users, Gauge, Buildings, MapPin, Truck, Storefront,
  Ticket, Sparkle, ArrowSquareOut
} from '@phosphor-icons/react';

export default function AdminDashboard() {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin" />
        </div>
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Gauge size={28} weight="duotone" className="text-indigo-400" />
          Administration
        </h1>
        <p className="text-slate-500 mt-1">System overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <DataCard title="Cities" value={stats?.cityCount || 0} icon={Buildings} iconColor="text-indigo-400" />
        <DataCard title="Locations" value={stats?.locationCount || 0} icon={MapPin} iconColor="text-red-400" />
        <DataCard title="Users" value={stats?.userCount || 0} icon={Users} iconColor="text-green-400" />
        <DataCard title="Tickets" value={stats?.rideTicketCount || 0} icon={Ticket} iconColor="text-blue-400" />
        <DataCard title="Transports" value={stats?.transportCount || 0} icon={Truck} iconColor="text-purple-400" />
        <DataCard title="Vendors" value={stats?.vendorCount || 0} icon={Storefront} iconColor="text-yellow-400" />
      </div>

      {/* Quick Actions & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
          <Sparkle size={80} weight="duotone" className="absolute -right-4 -top-4 text-slate-700/20" />
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Users size={16} weight="duotone" />
            Ticket Status
          </h3>
          <div className="space-y-3 relative z-10">
            {stats?.ticketsByStatus && Object.entries(stats.ticketsByStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="flex items-center justify-between bg-slate-900/50 border border-slate-800/50 rounded-xl px-4 py-3 hover:bg-slate-800/50 transition-colors">
                <span className="text-slate-400 text-sm font-mono uppercase tracking-wider">{status.replace(/_/g, ' ')}</span>
                <span className="text-slate-100 font-bold font-mono text-lg">{count}</span>
              </div>
            ))}
            {!stats?.ticketsByStatus && (
              <div className="text-slate-500 font-mono text-sm">No ticket data yet</div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 relative overflow-hidden">
          <Sparkle size={80} weight="duotone" className="absolute -right-4 -top-4 text-slate-700/20" />
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <ArrowSquareOut size={16} weight="duotone" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <button
              onClick={() => window.location.href = '/admin/cities'}
              className="bg-gradient-to-br from-blue-900/40 to-blue-950/60 border border-blue-700/30 hover:border-blue-600/50 rounded-xl px-4 py-3 text-blue-300 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02]"
            >
              Manage Cities
            </button>
            <button
              onClick={() => window.location.href = '/admin/vendors'}
              className="bg-gradient-to-br from-purple-900/40 to-purple-950/60 border border-purple-700/30 hover:border-purple-600/50 rounded-xl px-4 py-3 text-purple-300 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02]"
            >
              Manage Vendors
            </button>
            <button
              onClick={() => window.location.href = '/admin/tickets'}
              className="bg-gradient-to-br from-green-900/40 to-green-950/60 border border-green-700/30 hover:border-green-600/50 rounded-xl px-4 py-3 text-green-300 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02]"
            >
              View Tickets
            </button>
            <button
              onClick={() => window.location.href = '/admin/invoices'}
              className="bg-gradient-to-br from-orange-900/40 to-orange-950/60 border border-orange-700/30 hover:border-orange-600/50 rounded-xl px-4 py-3 text-orange-300 font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.02]"
            >
              Invoices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
