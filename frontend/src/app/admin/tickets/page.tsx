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
const Modal = dynamic(() => import('@/components/Modal'), { ssr: false });

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [assignTransportId, setAssignTransportId] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [t, tr] = await Promise.all([api.getTickets(), api.getTransports()]);
      setTickets(t || []);
      setTransports(tr || []);
      setSelected((current: any) => {
        if (!current) return current;
        return (t || []).find((ticket: any) => ticket._id === current._id) || current;
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    Promise.all([api.getTickets(), api.getTransports()])
      .then(([t, tr]) => { setTickets(t || []); setTransports(tr || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useTicketRealtime(fetchData);

  const handleAssign = async () => {
    if (!selected || !assignTransportId) return;
    try {
      await api.assignTransport(selected._id, assignTransportId);
      toast.success('Transport assigned successfully');
      setAssignModal(false); setSelected(null); setAssignTransportId(''); fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  const columns = [
    { key: 'userName', label: 'User', render: (r: any) => r.userId?.firstName || r.userName || '-' },
    { key: 'pickup', label: 'Pickup', render: (r: any) => r.pickupLocationId?.locationName || '-' },
    { key: 'drop', label: 'Drop', render: (r: any) => r.dropLocationId?.locationName || '-' },
    { key: 'city', label: 'City', render: (r: any) => r.cityId?.cityName || '-' },
    { key: 'pickupDate', label: 'Date', render: (r: any) => r.pickupDate ? new Date(r.pickupDate).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'transport', label: 'Transport', render: (r: any) => r.transportId?.vehicleNo || <span className="text-slate-500">Unassigned</span> },
    { key: 'cost', label: 'Cost', render: (r: any) => r.cost ? <span className="text-green-400 font-mono">${r.cost}</span> : '-' },
    { key: 'actions', label: 'Actions', render: (r: any) => (
      <div className="flex gap-2">
        <button onClick={() => { setSelected(r); setViewModal(true); }} className="btn-secondary text-xs px-3 py-1">View</button>
        {r.status === 'PENDING' && <button onClick={() => { setSelected(r); setAssignTransportId(''); setAssignModal(true); }} className="btn-primary text-xs px-3 py-1">Assign</button>}
      </div>
    )},
  ];

  if (loading) return <CrudPageSkeleton cols={8} />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <Ticket size={28} weight="duotone" className="text-blue-400" /> Journey Requests
      </h1>
      <p className="page-subtitle">Review ticket status, inspect trip details, and intervene when operational support is needed.</p>
      <DataTable data={tickets} columns={columns} />

      {/* Assign Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Transport">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">Select a transport for <span className="text-blue-400">{selected?.userId?.firstName}</span> to move this request into dispatch.</p>
          <select value={assignTransportId} onChange={e => setAssignTransportId(e.target.value)} className="input-modern">
            <option value="">Select a transport</option>
            {transports.map((t: any) => <option key={t._id} value={t._id}>{t.vehicleNo} - {t.ownerDetails}</option>)}
          </select>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setAssignModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAssign} className="btn-primary" disabled={!assignTransportId}>Confirm Assignment</button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Ticket Details" size="lg">
        {selected && (
          <div className="space-y-3">
            {[
              ['Status', <StatusBadge key="s" status={selected.status} />],
              ['User', selected.userId?.firstName || '-'],
              ['City', selected.cityId?.cityName || '-'],
              ['Pickup', selected.pickupLocationId?.locationName || '-'],
              ['Drop', selected.dropLocationId?.locationName || '-'],
              ['Date', selected.pickupDate ? new Date(selected.pickupDate).toLocaleDateString() : '-'],
              ['Transport', selected.transportId?.vehicleNo || 'Unassigned'],
              ['Driver', selected.transportId?.ownerDetails || '-'],
              ['Cost', selected.cost ? `$${selected.cost}` : '-'],
              ['OTP', selected.otp || '-'],
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-500 font-mono text-xs uppercase">{label as string}</span>
                <span className="text-slate-200 font-mono text-sm">{value as any}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
