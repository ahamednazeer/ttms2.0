'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import DatePicker from '@/components/DatePicker';
import { useTicketRealtime } from '@/hooks/useTicketRealtime';
import { Path, MapPin, CarSimple, Key } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface LocationOption {
  _id: string;
  locationName: string;
}

interface TransportInfo {
  vehicleNo?: string;
  ownerDetails?: string;
  contact?: string;
}

interface TicketRecord {
  _id: string;
  status: string;
  otp?: string;
  pickupLocationId?: LocationOption;
  dropLocationId?: LocationOption;
  transportId?: TransportInfo;
}

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
  const [form, setForm] = useState({ pickupLocationId: '', dropLocationId: '', pickupDate: '' });
  const minPickupDate = getTodayDateValue();

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
      await api.createTicket(form);
      toast.success('Ride booked!');
      await refreshTickets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to book ride');
    }
  };

  if (loading) return <div className="text-slate-500 font-mono text-center py-12 animate-pulse">Loading...</div>;

  // Show active ticket
  if (activeTicket) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <CarSimple size={28} weight="duotone" className="text-blue-400" /> Your Ride
        </h1>
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-mono text-xs uppercase">Status</span>
            <StatusBadge status={activeTicket.status} />
          </div>
          <div className="border border-slate-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3"><MapPin size={20} className="text-green-400" weight="duotone" /><div><p className="text-xs text-slate-500 font-mono">PICKUP</p><p className="text-slate-200">{activeTicket.pickupLocationId?.locationName || '-'}</p></div></div>
            <div className="border-l-2 border-dashed border-slate-700 ml-2.5 h-4" />
            <div className="flex items-center gap-3"><MapPin size={20} className="text-red-400" weight="duotone" /><div><p className="text-xs text-slate-500 font-mono">DROP</p><p className="text-slate-200">{activeTicket.dropLocationId?.locationName || '-'}</p></div></div>
          </div>
          {activeTicket.transportId && (
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-500 font-mono text-xs">Vehicle</span><span className="text-slate-200">{activeTicket.transportId?.vehicleNo}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-mono text-xs">Driver</span><span className="text-slate-200">{activeTicket.transportId?.ownerDetails}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-mono text-xs">Contact</span><span className="text-slate-200">{activeTicket.transportId?.contact}</span></div>
            </div>
          )}
          {activeTicket.status === 'RIDE_STARTED' && activeTicket.otp && (
            <div className="bg-blue-950/50 border border-blue-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2"><Key size={20} className="text-blue-400" /><span className="text-blue-400 font-mono text-xs uppercase">Your OTP</span></div>
              <p className="text-4xl font-bold font-mono tracking-[0.5em] text-blue-300">{activeTicket.otp}</p>
              <p className="text-xs text-slate-500 mt-2">Share this with your driver to complete the journey</p>
            </div>
          )}
          {activeTicket.status === 'PENDING' && <p className="text-slate-500 text-sm font-mono text-center">Waiting for transport assignment...</p>}
          {activeTicket.status === 'ASSIGNED' && <p className="text-slate-500 text-sm font-mono text-center">Transport assigned. Waiting for pickup...</p>}
        </div>
      </div>
    );
  }

  // Booking form
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
        <Path size={28} weight="duotone" className="text-blue-400" /> Book a Ride
      </h1>
      <form onSubmit={handleBook} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-6 space-y-4">
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
        <button type="submit" className="w-full btn-primary py-3">Book Ride</button>
      </form>
    </div>
  );
}
