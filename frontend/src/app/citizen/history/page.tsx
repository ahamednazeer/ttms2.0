'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { ClockCounterClockwise } from '@phosphor-icons/react';
import { CrudPageSkeleton } from '@/components/Skeleton';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false });

export default function CitizenHistoryPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getTickets().then(t => setTickets(t||[])).catch(console.error).finally(()=>setLoading(false)); }, []);

  const columns = [
    { key: 'pickup', label: 'From', render: (r: any) => r.pickupLocationId?.locationName || '-' },
    { key: 'drop', label: 'To', render: (r: any) => r.dropLocationId?.locationName || '-' },
    { key: 'date', label: 'Date', render: (r: any) => r.pickupDate ? new Date(r.pickupDate).toLocaleDateString() : '-' },
    { key: 'vehicle', label: 'Vehicle', render: (r: any) => r.transportId?.vehicleNo || '-' },
    { key: 'cost', label: 'Cost', render: (r: any) => r.cost ? <span className="text-green-400 font-mono">${r.cost}</span> : '-' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <CrudPageSkeleton cols={6} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <ClockCounterClockwise size={28} weight="duotone" className="text-slate-400" /> Journey History
      </h1>
      <p className="page-subtitle">Review previous bookings, assigned vehicles, fares, and final trip status.</p>
      <DataTable data={tickets} columns={columns} emptyMessage="No journeys yet" />
    </div>
  );
}
