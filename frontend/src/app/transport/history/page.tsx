'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DataTable from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { ClockCounterClockwise } from '@phosphor-icons/react';

export default function TransportHistoryPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getTickets().then(t => setTickets((t||[]).filter((x:any) => x.status === 'COMPLETED'))).catch(console.error).finally(()=>setLoading(false)); }, []);

  const columns = [
    { key: 'user', label: 'User', render: (r: any) => r.userId?.firstName || '-' },
    { key: 'pickup', label: 'From', render: (r: any) => r.pickupLocationId?.locationName || '-' },
    { key: 'drop', label: 'To', render: (r: any) => r.dropLocationId?.locationName || '-' },
    { key: 'date', label: 'Date', render: (r: any) => r.pickupDate ? new Date(r.pickupDate).toLocaleDateString() : '-' },
    { key: 'cost', label: 'Cost', render: (r: any) => <span className="text-green-400 font-mono">${r.cost || 0}</span> },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <ClockCounterClockwise size={28} weight="duotone" className="text-slate-400" /> Journey History
      </h1>
      <DataTable data={tickets} columns={columns} emptyMessage="No completed journeys yet" />
    </div>
  );
}
