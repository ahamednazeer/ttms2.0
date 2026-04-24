'use client';
import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { useTicketRealtime } from '@/hooks/useTicketRealtime';
import { Ticket } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { CrudPageSkeleton } from '@/components/Skeleton';

const DataTable = dynamic(() => import('@/components/DataTable'), { ssr: false }) as any;

export default function VendorTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTickets = useCallback(async () => {
    try {
      const nextTickets = await api.getTickets();
      setTickets(nextTickets || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    Promise.all([api.getTickets(), api.getTransports()])
      .then(([t, tr]) => { setTickets(t || []); setTransports(tr || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  useTicketRealtime(refreshTickets);

  const handleAssign = async (ticketId: string, transportId: string) => {
    try { await api.assignTransport(ticketId, transportId); toast.success('Transport assigned successfully'); await refreshTickets(); }
    catch (err: any) { toast.error(err.message); }
  };

  const columns = [
    { key: 'user', label: 'User', render: (r: any) => r.userId?.firstName || '-' },
    { key: 'pickup', label: 'Pickup', render: (r: any) => r.pickupLocationId?.locationName || '-' },
    { key: 'drop', label: 'Drop', render: (r: any) => r.dropLocationId?.locationName || '-' },
    { key: 'date', label: 'Date', render: (r: any) => r.pickupDate ? new Date(r.pickupDate).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'transport', label: 'Transport', render: (r: any) => r.status === 'PENDING' ? (
      <select onChange={e => { if (e.target.value) handleAssign(r._id, e.target.value); }} className="input-modern text-xs py-1" defaultValue="">
        <option value="">Select transport...</option>
        {transports.map((t: any) => <option key={t._id} value={t._id}>{t.vehicleNo}</option>)}
      </select>
    ) : r.transportId?.vehicleNo || '-' },
  ];

  if (loading) return <CrudPageSkeleton cols={6} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <Ticket size={28} weight="duotone" className="text-blue-400" /> Dispatch Queue
      </h1>
      <p className="page-subtitle">Review pending city requests, assign vehicles, and monitor journeys already linked to your fleet.</p>
      <DataTable data={tickets} columns={columns} />
    </div>
  );
}
