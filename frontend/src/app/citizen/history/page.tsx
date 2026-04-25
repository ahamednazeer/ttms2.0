'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { ClockCounterClockwise } from '@phosphor-icons/react';
import { CrudPageSkeleton } from '@/components/Skeleton';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false }) as any;

export default function CitizenHistoryPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getTickets().then(t => setTickets(t||[])).catch(console.error).finally(()=>setLoading(false)); }, []);

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
    { key: 'pickup', label: 'From', render: (r: any) => r.pickupLocationId?.locationName || '-' },
    { key: 'drop', label: 'To', render: (r: any) => r.dropLocationId?.locationName || '-' },
    { key: 'date', label: 'Date', render: (r: any) => r.pickupDate ? new Date(r.pickupDate).toLocaleDateString() : '-' },
    { key: 'started', label: 'Started', render: (r: any) => formatDateTime(r.rideStartTime) },
    { key: 'ended', label: 'Ended', render: (r: any) => formatDateTime(r.rideEndTime) },
    { key: 'duration', label: 'Duration', render: (r: any) => getDurationLabel(r.rideStartTime, r.rideEndTime) },
    { key: 'vehicle', label: 'Vehicle', render: (r: any) => r.transportId?.vehicleNo || '-' },
    { key: 'cost', label: 'Cost', render: (r: any) => r.cost ? <span className="text-green-400 font-mono">${r.cost}</span> : '-' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <CrudPageSkeleton cols={9} />;

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
