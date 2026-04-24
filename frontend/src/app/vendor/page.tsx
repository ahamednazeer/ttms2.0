'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DataCard } from '@/components/DataCard';
import { Gauge, Ticket, Truck } from '@phosphor-icons/react';

export default function VendorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading vendor dashboard...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <Gauge size={28} weight="duotone" className="text-blue-400" /> Operations Overview
      </h1>
      <p className="page-subtitle">Track your active dispatch queue, available fleet, and completed journey volume.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataCard title="Active Queue" value={stats?.rideTicketCount || 0} icon={Ticket} />
        <DataCard title="Fleet Vehicles" value={stats?.transportCount || 0} icon={Truck} iconColor="text-green-400" />
        <DataCard title="Completed Journeys" value={stats?.ticketsByStatus?.COMPLETED || 0} icon={Ticket} iconColor="text-emerald-400" />
      </div>
    </div>
  );
}
