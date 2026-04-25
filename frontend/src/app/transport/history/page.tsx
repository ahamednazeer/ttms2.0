'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { ClockCounterClockwise } from '@phosphor-icons/react';
import { CrudPageSkeleton } from '@/components/Skeleton';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false }) as any;

export default function TransportHistoryPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getTickets().then(t => setTickets((t||[]).filter((x:any) => x.status === 'COMPLETED'))).catch(console.error).finally(()=>setLoading(false)); }, []);

  const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-';
  const getDurationLabel = (start?: string, end?: string) => {
    if (!start || !end) return '-';
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime < startTime) return '-';
    const totalMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours && minutes) return `${hours} hr ${minutes} min`;
    if (hours) return `${hours} hr`;
    return `${minutes} min`;
  };

  const columns = [
    { key: 'user', label: 'User', render: (r: any) => r.userId?.firstName || '-' },
    { key: 'pickup', label: 'From', render: (r: any) => r.pickupLocationId?.locationName || '-' },
    { key: 'drop', label: 'To', render: (r: any) => r.dropLocationId?.locationName || '-' },
    { key: 'date', label: 'Date', render: (r: any) => r.pickupDate ? new Date(r.pickupDate).toLocaleDateString() : '-' },
    { key: 'started', label: 'Started', render: (r: any) => formatDateTime(r.rideStartTime) },
    { key: 'ended', label: 'Ended', render: (r: any) => formatDateTime(r.rideEndTime) },
    { key: 'duration', label: 'Duration', render: (r: any) => getDurationLabel(r.rideStartTime, r.rideEndTime) },
    { key: 'cost', label: 'Cost', render: (r: any) => <span className="text-green-400 font-mono">${r.cost || 0}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <CrudPageSkeleton cols={9} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <ClockCounterClockwise size={28} weight="duotone" className="text-slate-400" /> Completed Journeys
      </h1>
      <p className="page-subtitle">View completed trips, verified fares, and past service activity.</p>
      <DataTable data={tickets} columns={columns} emptyMessage="No completed journeys yet" />
    </div>
  );
}
