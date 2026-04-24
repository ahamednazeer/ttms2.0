'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, LoadingState } from '@/components/FeedbackState';
import { useTicketRealtime } from '@/hooks/useTicketRealtime';
import type { City, Location, Ticket, User } from '@/lib/types';
import { CarSimple, MapPin, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function TransportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [startingRide, setStartingRide] = useState(false);
  const [completingRide, setCompletingRide] = useState(false);

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
  const getLocationName = (value?: string | Location) => typeof value === 'string' ? '-' : value?.locationName || '-';
  const getUserName = (value?: string | User) => typeof value === 'string' ? '-' : value?.firstName || '-';
  const getCityName = (value?: string | City) => typeof value === 'string' ? '-' : value?.cityName || '-';

  const handleStartRide = async (id: string) => {
    try {
      setStartingRide(true);
      await api.startRide(id);
      toast.success('Ride started');
      await refreshTickets();
    }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to start ride'); }
    finally { setStartingRide(false); }
  };

  const handleCompleteRide = async (id: string) => {
    if (!otp || otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    try {
      setCompletingRide(true);
      await api.completeRide(id, otp);
      toast.success('Ride completed!');
      setOtp('');
      await refreshTickets();
    }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to complete ride'); }
    finally { setCompletingRide(false); }
  };

  if (loading) return <LoadingState label="Loading assigned journeys..." />;

  if (!activeTicket) {
    return (
      <EmptyState
        title="No Active Journey"
        description="There are no journeys assigned right now. This screen refreshes automatically when a new trip is dispatched."
        icon={CarSimple}
      />
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <CarSimple size={28} weight="duotone" className="text-green-400" /> Active Journey
        </h1>
        <p className="page-subtitle">Manage assigned rides, verify OTP, and complete the journey workflow.</p>
      </div>

      <div className="card space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-mono text-xs uppercase">Status</span>
          <StatusBadge status={activeTicket.status} />
        </div>
        <div className="info-strip">
          {activeTicket.status === 'ASSIGNED'
            ? 'Confirm pickup only after the passenger is onboard and the trip has begun.'
            : 'Use the passenger OTP only at drop-off to securely complete the ride.'}
        </div>
        <div className="flex justify-between"><span className="text-slate-500 font-mono text-xs uppercase">User</span><span className="text-slate-200">{getUserName(activeTicket.userId)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500 font-mono text-xs uppercase">City</span><span className="text-slate-200">{getCityName(activeTicket.cityId)}</span></div>

        <div className="border border-slate-700/80 rounded-xl p-4 space-y-3 bg-slate-950/30">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-green-400" weight="duotone" />
            <div><p className="text-xs text-slate-500 font-mono">PICKUP</p><p className="text-slate-200">{getLocationName(activeTicket.pickupLocationId)}</p></div>
          </div>
          <div className="border-l-2 border-dashed border-slate-700 ml-2.5 h-4" />
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-red-400" weight="duotone" />
            <div><p className="text-xs text-slate-500 font-mono">DROP</p><p className="text-slate-200">{getLocationName(activeTicket.dropLocationId)}</p></div>
          </div>
        </div>

        {activeTicket.status === 'ASSIGNED' && (
          <button
            onClick={() => handleStartRide(activeTicket._id)}
            className="w-full btn-success flex items-center justify-center gap-2 py-3"
            disabled={startingRide}
          >
            <CarSimple size={20} /> {startingRide ? 'Starting Ride...' : 'Start Ride - User Picked Up'}
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
            <button
              onClick={() => handleCompleteRide(activeTicket._id)}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
              disabled={otp.length !== 6 || completingRide}
            >
              <CheckCircle size={20} /> {completingRide ? 'Verifying OTP...' : 'Verify OTP & Complete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

