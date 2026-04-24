'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { useTicketRealtime } from '@/hooks/useTicketRealtime';
import { CarSimple, MapPin, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function TransportDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');

  const refreshTickets = useCallback(async () => {
    try {
      const nextTickets = await api.getTickets();
      setTickets(nextTickets || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    api.getTickets()
      .then(t => setTickets(t||[]))
      .catch(console.error)
      .finally(()=>setLoading(false));
  }, []);

  useTicketRealtime(refreshTickets);

  const activeTicket = tickets.find(t => t.status === 'ASSIGNED' || t.status === 'RIDE_STARTED');

  const handleStartRide = async (id: string) => {
    try { await api.startRide(id); toast.success('Ride started'); await refreshTickets(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleCompleteRide = async (id: string) => {
    if (!otp || otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    try { await api.completeRide(id, otp); toast.success('Ride completed!'); setOtp(''); await refreshTickets(); }
    catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;

  if (!activeTicket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <CarSimple size={64} weight="duotone" className="text-slate-600" />
        <p className="text-slate-500 font-mono uppercase tracking-wider">No active journey</p>
        <p className="text-slate-600 text-sm">Waiting for ticket assignment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <CarSimple size={28} weight="duotone" className="text-green-400" /> Active Journey
      </h1>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs uppercase">Status</span>
          <StatusBadge status={activeTicket.status} />
        </div>
        <div className="flex justify-between"><span className="text-slate-500 font-mono text-xs uppercase">User</span><span className="text-slate-200">{activeTicket.userId?.firstName || '-'}</span></div>
        <div className="flex justify-between"><span className="text-slate-500 font-mono text-xs uppercase">City</span><span className="text-slate-200">{activeTicket.cityId?.cityName || '-'}</span></div>

        <div className="border border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-green-400" weight="duotone" />
            <div><p className="text-xs text-slate-500 font-mono">PICKUP</p><p className="text-slate-200">{activeTicket.pickupLocationId?.locationName || '-'}</p></div>
          </div>
          <div className="border-l-2 border-dashed border-slate-700 ml-2.5 h-4" />
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-red-400" weight="duotone" />
            <div><p className="text-xs text-slate-500 font-mono">DROP</p><p className="text-slate-200">{activeTicket.dropLocationId?.locationName || '-'}</p></div>
          </div>
        </div>

        {activeTicket.status === 'ASSIGNED' && (
          <button onClick={() => handleStartRide(activeTicket._id)} className="w-full btn-success flex items-center justify-center gap-2 py-3">
            <CarSimple size={20} /> Start Ride - User Picked Up
          </button>
        )}

        {activeTicket.status === 'RIDE_STARTED' && (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm font-mono">Enter OTP from user to complete journey:</p>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className="input-modern text-left text-xl tracking-[0.3em] py-4"
            />
            <button onClick={() => handleCompleteRide(activeTicket._id)} className="w-full btn-primary flex items-center justify-center gap-2 py-3" disabled={otp.length !== 6}>
              <CheckCircle size={20} /> Verify OTP & Complete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

