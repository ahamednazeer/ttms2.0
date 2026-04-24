'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingState } from '@/components/FeedbackState';
import DatePicker from '@/components/DatePicker';
import { useTicketRealtime } from '@/hooks/useTicketRealtime';
import type { CreateTicketInput, Location, Ticket, Transport } from '@/lib/types';
import { Path, MapPin, CarSimple, Key } from '@phosphor-icons/react';
import { toast } from 'sonner';

type LocationOption = Location;
type TicketRecord = Ticket;

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CitizenPage() {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateTicketInput>({ pickupLocationId: '', dropLocationId: '', pickupDate: '' });
  const minPickupDate = getTodayDateValue();

  const getLocationName = (value?: string | Location) =>
    typeof value === 'string' ? '-' : value?.locationName || '-';

  const getTransportValue = (value: string | Transport | undefined, key: 'vehicleNo' | 'ownerDetails' | 'contact') =>
    typeof value === 'string' ? '-' : value?.[key] || '-';

  const refreshTickets = useCallback(async () => {
    try {
      const nextTickets = await api.getTickets();
      setTickets(nextTickets || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    Promise.all([api.getTickets(), api.getLocations()])
      .then(([t, l]) => { setTickets(t||[]); setLocations(l||[]); })
      .catch(console.error).finally(()=>setLoading(false));
  }, []);

  useTicketRealtime(refreshTickets);

  const activeTicket = tickets.find(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pickupDate) {
      toast.error('Please select a travel date');
      return;
    }
    try {
      setSubmitting(true);
      await api.createTicket(form);
      toast.success('Ride booked!');
      setForm({ pickupLocationId: '', dropLocationId: '', pickupDate: '' });
      await refreshTickets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to book ride');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState label="Loading your ride details..." />;

  // Show active ticket
  if (activeTicket) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
            <CarSimple size={28} weight="duotone" className="text-blue-400" /> Your Ride
          </h1>
          <p className="page-subtitle">Track dispatch progress, driver details, and journey completion verification in real time.</p>
        </div>
        <div className="card space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-mono text-xs uppercase">Status</span>
            <StatusBadge status={activeTicket.status} />
          </div>
          <div className="info-strip">
            {activeTicket.status === 'RIDE_STARTED'
              ? 'Your ride is in progress. Share the OTP with the driver only when you reach your destination.'
              : 'This screen refreshes automatically when your booking is assigned or updated.'}
          </div>
          <div className="border border-slate-700/80 rounded-xl p-4 space-y-3 bg-slate-950/30">
            <div className="flex items-center gap-3"><MapPin size={20} className="text-green-400" weight="duotone" /><div><p className="text-xs text-slate-500 font-mono">PICKUP</p><p className="text-slate-200">{getLocationName(activeTicket.pickupLocationId)}</p></div></div>
            <div className="border-l-2 border-dashed border-slate-700 ml-2.5 h-4" />
            <div className="flex items-center gap-3"><MapPin size={20} className="text-red-400" weight="duotone" /><div><p className="text-xs text-slate-500 font-mono">DROP</p><p className="text-slate-200">{getLocationName(activeTicket.dropLocationId)}</p></div></div>
          </div>
          {activeTicket.transportId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                <p className="text-slate-500 font-mono text-xs uppercase tracking-wider">Vehicle</p>
                <p className="text-slate-100 font-semibold break-all">{getTransportValue(activeTicket.transportId, 'vehicleNo')}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                <p className="text-slate-500 font-mono text-xs uppercase tracking-wider">Driver</p>
                <p className="text-slate-100 font-semibold">{getTransportValue(activeTicket.transportId, 'ownerDetails')}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-1">
                <p className="text-slate-500 font-mono text-xs uppercase tracking-wider">Contact</p>
                <p className="text-slate-100 font-semibold break-all">{getTransportValue(activeTicket.transportId, 'contact')}</p>
              </div>
            </div>
          )}
          {activeTicket.status === 'RIDE_STARTED' && activeTicket.otp && (
            <div className="bg-blue-950/50 border border-blue-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2"><Key size={20} className="text-blue-400" /><span className="text-blue-400 font-mono text-xs uppercase">Journey OTP</span></div>
              <p className="text-4xl font-bold font-mono tracking-[0.5em] text-blue-300">{activeTicket.otp}</p>
              <p className="text-xs text-slate-500 mt-2">Share this code with your driver when the journey ends to confirm completion.</p>
            </div>
          )}
          {activeTicket.status === 'PENDING' && <p className="text-slate-500 text-sm font-mono text-center">Your request has been received and is waiting for vendor assignment.</p>}
          {activeTicket.status === 'ASSIGNED' && <p className="text-slate-500 text-sm font-mono text-center">A driver has been assigned. Please be ready for pickup.</p>}
        </div>
      </div>
    );
  }

  // Booking form
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Path size={28} weight="duotone" className="text-blue-400" /> Request a Ride
        </h1>
        <p className="page-subtitle">Choose your route and preferred journey date to submit a new transport request.</p>
      </div>
      <form onSubmit={handleBook} className="card space-y-5">
        <div>
          <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Pickup Location</label>
          <select value={form.pickupLocationId} onChange={e => setForm({...form, pickupLocationId: e.target.value})} required className="input-modern">
            <option value="">Select pickup</option>
            {locations.map((l) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Drop Location</label>
          <select value={form.dropLocationId} onChange={e => setForm({...form, dropLocationId: e.target.value})} required className="input-modern">
            <option value="">Select drop</option>
            {locations.filter((l) => l._id !== form.pickupLocationId).map((l) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs uppercase mb-2 font-mono">Date</label>
          <DatePicker
            value={form.pickupDate}
            onChange={(pickupDate) => setForm({ ...form, pickupDate })}
            min={minPickupDate}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full btn-primary py-3"
        >
          {submitting ? 'Booking Ride...' : 'Book Ride'}
        </button>
      </form>
    </div>
  );
}
