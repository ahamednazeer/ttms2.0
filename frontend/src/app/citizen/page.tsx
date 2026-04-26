'use client';
import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { CompletedJourneyCard, TripProgressTracker } from '@/components/CompletedJourneyCard';
import { useTheme } from '@/components/ThemeProvider';
import { useTicketRealtime } from '@/hooks/useTicketRealtime';
import type { CreateTicketInput, Location, Ticket, Transport } from '@/lib/types';
import { Path, MapPin, CarSimple, Key } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { SingleCardSkeleton } from '@/components/Skeleton';

const DatePicker = dynamic(() => import('@/components/DatePicker'), { ssr: false });

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
  const [lastCompletedTicket, setLastCompletedTicket] = useState<TicketRecord | null>(null);
  const [dismissedCompletedTicketId, setDismissedCompletedTicketId] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTicketInput>({ pickupLocationId: '', dropLocationId: '', pickupDate: '' });
  const minPickupDate = getTodayDateValue();
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';
  const isBookingReady = Boolean(
    form.pickupLocationId &&
    form.dropLocationId &&
    form.pickupDate &&
    form.pickupLocationId !== form.dropLocationId,
  );

  const getLocationName = (value?: string | Location) =>
    typeof value === 'string' ? '-' : value?.locationName || '-';

  const getTransportValue = (value: string | Transport | undefined, key: 'vehicleNo' | 'ownerDetails' | 'contact') =>
    typeof value === 'string' ? '-' : value?.[key] || '-';
  const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-';
  const formatMoney = (value?: number) => `$${(value || 0).toFixed(2)}`;
  const labelTone = isDark ? 'text-slate-500' : 'muted-text';
  const bodyTone = isDark ? 'text-slate-100' : 'text-[color:var(--text-primary)]';
  const secondaryTone = isDark ? 'text-slate-200' : 'text-[color:var(--text-secondary)]';
  const softPanelStyle = isDark
    ? { borderColor: 'rgba(30, 41, 59, 1)', background: 'rgba(2, 6, 23, 0.32)' }
    : { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-2) 88%, transparent)' };
  const routePanelStyle = isDark
    ? { borderColor: 'rgba(51, 65, 85, 0.8)', background: 'rgba(2, 6, 23, 0.3)' }
    : { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-2) 84%, transparent)' };
  const blueActionStyle = isDark
    ? { borderColor: 'rgba(59, 130, 246, 0.35)', background: 'rgba(30, 64, 175, 0.22)' }
    : { borderColor: 'rgba(59, 130, 246, 0.22)', background: 'rgba(59, 130, 246, 0.08)' };
  const successNoticeStyle = isDark
    ? { borderColor: 'rgba(34, 197, 94, 0.25)', background: 'rgba(34, 197, 94, 0.12)' }
    : { borderColor: 'rgba(34, 197, 94, 0.18)', background: 'rgba(34, 197, 94, 0.08)' };
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
      .then(([t, l]) => { setTickets(t || []); setLocations(l || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  useTicketRealtime(refreshTickets);

  const activeTicket = tickets.find(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const activeTimelineStep =
    activeTicket?.status === 'PENDING'
      ? 'Requested'
      : activeTicket?.status === 'ASSIGNED'
        ? 'Assigned'
        : activeTicket?.status === 'RIDE_STARTED'
          ? 'Ride Started'
          : 'Completed';
  const latestCompletedTicket = [...tickets]
    .filter((ticket) => ticket.status === 'COMPLETED')
    .sort((left, right) => {
      const leftTime = new Date(left.rideEndTime || left.pickupDate || 0).getTime();
      const rightTime = new Date(right.rideEndTime || right.pickupDate || 0).getTime();
      return rightTime - leftTime;
    })[0];

  useEffect(() => {
    if (
      !activeTicket &&
      latestCompletedTicket &&
      latestCompletedTicket._id !== dismissedCompletedTicketId &&
      (!lastCompletedTicket || lastCompletedTicket._id !== latestCompletedTicket._id)
    ) {
      setLastCompletedTicket(latestCompletedTicket);
    }
  }, [activeTicket, dismissedCompletedTicketId, lastCompletedTicket, latestCompletedTicket]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBookingReady) {
      toast.error('Please complete pickup, drop, and date before booking');
      return;
    }
    try {
      setSubmitting(true);
      setFormNotice(null);
      await api.createTicket(form);
      toast.success('Ride booked!');
      setFormNotice('Ride booked successfully. We will update this screen once your trip is assigned.');
      setForm({ pickupLocationId: '', dropLocationId: '', pickupDate: '' });
      await refreshTickets();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to book ride');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SingleCardSkeleton />;

  // Show active ticket
  if (activeTicket) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
            <CarSimple size={28} weight="duotone" className="text-blue-400" /> Your Ride
          </h1>
          <p className="page-subtitle">Track dispatch progress, driver details, and journey completion verification in real time.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="card space-y-4">
            <div className="flex justify-between items-center">
              <span className={`font-mono text-xs uppercase ${labelTone}`}>Status</span>
              <StatusBadge status={activeTicket.status} />
            </div>
            <div className="rounded-xl border p-3 space-y-3" style={softPanelStyle}>
              <span className={`font-mono text-xs uppercase ${labelTone}`}>Trip Progress</span>
              <TripProgressTracker
                steps={['Requested', 'Assigned', 'Ride Started', 'Completed']}
                currentStep={activeTimelineStep}
                compact
              />
            </div>
            <div className="rounded-xl border p-3 space-y-3" style={routePanelStyle}>
              <div className="flex items-center gap-3"><MapPin size={18} className="text-green-400" weight="duotone" /><div><p className={`text-xs font-mono ${labelTone}`}>PICKUP</p><p className={bodyTone}>{getLocationName(activeTicket.pickupLocationId)}</p></div></div>
              <div className="ml-2 h-3 border-l-2 border-dashed" style={isDark ? { borderColor: 'rgba(51, 65, 85, 1)' } : { borderColor: 'var(--border)' }} />
              <div className="flex items-center gap-3"><MapPin size={18} className="text-red-400" weight="duotone" /><div><p className={`text-xs font-mono ${labelTone}`}>DROP</p><p className={bodyTone}>{getLocationName(activeTicket.dropLocationId)}</p></div></div>
            </div>
            {activeTicket.transportId && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
                  <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Vehicle</p>
                  <p className={`${bodyTone} font-semibold break-all`}>{getTransportValue(activeTicket.transportId, 'vehicleNo')}</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
                  <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Driver</p>
                  <p className={`${bodyTone} font-semibold`}>{getTransportValue(activeTicket.transportId, 'ownerDetails')}</p>
                </div>
                <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
                  <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Contact</p>
                  <p className={`${bodyTone} font-semibold break-all`}>{getTransportValue(activeTicket.transportId, 'contact')}</p>
                </div>
              </div>
            )}
            {(activeTicket.rideStartTime || activeTicket.status === 'PENDING' || activeTicket.status === 'ASSIGNED') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTicket.rideStartTime && (
                  <>
                    <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
                      <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Started</p>
                      <p className={`${bodyTone} font-semibold`}>{formatDateTime(activeTicket.rideStartTime)}</p>
                    </div>
                    <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
                      <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>
                        {activeTicket.rideEndTime ? 'Duration' : 'Elapsed'}
                      </p>
                      <p className={`${bodyTone} font-semibold`}>
                        {getDurationLabel(activeTicket.rideStartTime, activeTicket.rideEndTime || new Date().toISOString())}
                      </p>
                    </div>
                  </>
                )}
                {!activeTicket.rideStartTime && (
                  <div className="rounded-lg border p-3 sm:col-span-2" style={softPanelStyle}>
                    <p className={`text-sm font-mono text-center ${labelTone}`}>
                      {activeTicket.status === 'PENDING'
                        ? 'Your request has been received and is waiting for vendor assignment.'
                        : 'A driver has been assigned. Please be ready for pickup.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="card space-y-4">
            {activeTicket.status === 'RIDE_STARTED' ? (
              <div className="rounded-2xl border p-5 text-center space-y-3" style={blueActionStyle}>
                <div className="flex items-center justify-center gap-2">
                  <Key size={18} className="text-blue-400" />
                  <span className={`font-mono text-xs uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Completion Code</span>
                </div>
                <p className={`text-sm ${secondaryTone}`}>Share this OTP only after reaching the destination.</p>
                {activeTicket.otp && (
                  <p className={`text-3xl font-bold font-mono tracking-[0.35em] pl-[0.35em] ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    {activeTicket.otp}
                  </p>
                )}
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[color:var(--text-secondary)]'}`}>This code completes the ride.</p>
              </div>
            ) : (
              <div className="rounded-2xl border p-5 text-center space-y-2" style={softPanelStyle}>
                <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Current Stage</p>
                <p className={`${bodyTone} font-semibold`}>
                  {activeTicket.status === 'PENDING' ? 'Waiting for assignment' : 'Driver assigned'}
                </p>
                <p className={`text-sm ${secondaryTone}`}>
                  {activeTicket.status === 'PENDING'
                    ? 'We will update this screen as soon as a driver is assigned.'
                    : 'Your driver details are shown here. Keep this screen ready for ride start.'}
                </p>
              </div>
            )}
            {activeTicket.rideEndTime && (
              <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
                <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Ended</p>
                <p className={`${bodyTone} font-semibold`}>{formatDateTime(activeTicket.rideEndTime)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (lastCompletedTicket) {
    return (
      <CompletedJourneyCard
        title="Journey Completed"
        subtitle="Your OTP was verified, the ride is closed, and your trip summary is ready."
        successTitle="OTP verified. Ride completed successfully."
        successBody="Your journey has been saved to history and the invoice is being shared by email when available."
        status={lastCompletedTicket.status}
        summaryDetails={[
          { label: 'Fare', value: formatMoney(lastCompletedTicket.cost), emphasis: 'money' },
          { label: 'Duration', value: getDurationLabel(lastCompletedTicket.rideStartTime, lastCompletedTicket.rideEndTime) },
          { label: 'Started', value: formatDateTime(lastCompletedTicket.rideStartTime) },
          { label: 'Ended', value: formatDateTime(lastCompletedTicket.rideEndTime) },
        ]}
        metaDetails={lastCompletedTicket.transportId ? [
          { label: 'Trip Date', value: formatDateTime(lastCompletedTicket.pickupDate) },
          { label: 'Vehicle', value: getTransportValue(lastCompletedTicket.transportId, 'vehicleNo') },
          { label: 'Driver', value: getTransportValue(lastCompletedTicket.transportId, 'ownerDetails') },
          { label: 'Contact', value: getTransportValue(lastCompletedTicket.transportId, 'contact') },
        ] : []}
        pickup={getLocationName(lastCompletedTicket.pickupLocationId)}
        drop={getLocationName(lastCompletedTicket.dropLocationId)}
        historyNote="Need a record later? You can always review this completed ride in Journey History."
        actions={[
          { label: 'Open Journey History', href: '/citizen/history', variant: 'primary' },
          {
            label: 'Book Another Ride',
            onClick: () => {
              setDismissedCompletedTicketId(lastCompletedTicket._id);
              setLastCompletedTicket(null);
            },
            variant: 'secondary',
          },
        ]}
      />
    );
  }

  // Booking form
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <Path size={28} weight="duotone" className="text-blue-400" /> Request a Ride
        </h1>
        <p className="page-subtitle">Choose your route and preferred journey date to submit a new transport request.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={handleBook} className="card space-y-4">
          {formNotice && (
            <div className="rounded-xl border px-4 py-3" style={successNoticeStyle}>
              <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{formNotice}</p>
            </div>
          )}
          <div>
            <label className={`block text-xs uppercase mb-2 font-mono ${labelTone}`}>Pickup Location</label>
            <select value={form.pickupLocationId} onChange={e => setForm({ ...form, pickupLocationId: e.target.value })} required className="input-modern">
              <option value="">Select pickup</option>
              {locations.map((l) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-xs uppercase mb-2 font-mono ${labelTone}`}>Drop Location</label>
            <select value={form.dropLocationId} onChange={e => setForm({ ...form, dropLocationId: e.target.value })} required className="input-modern">
              <option value="">Select drop</option>
              {locations.filter((l) => l._id !== form.pickupLocationId).map((l) => <option key={l._id} value={l._id}>{l.locationName}</option>)}
            </select>
          </div>
          <div>
            <label className={`block text-xs uppercase mb-2 font-mono ${labelTone}`}>Date</label>
            <DatePicker
              value={form.pickupDate}
              onChange={(pickupDate) => setForm({ ...form, pickupDate })}
              min={minPickupDate}
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !isBookingReady}
            className="w-full btn-primary py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Booking Ride...' : 'Book Ride'}
          </button>
        </form>
        <div className="card space-y-4">
          <div className="rounded-xl border p-4 space-y-3" style={softPanelStyle}>
            <p className={`font-mono text-xs uppercase ${labelTone}`}>Booking Checklist</p>
            {!form.pickupLocationId && <p className={secondaryTone}>Select a pickup location to continue.</p>}
            {form.pickupLocationId && !form.dropLocationId && <p className={secondaryTone}>Select a drop location to complete your route.</p>}
            {form.pickupLocationId && form.dropLocationId && form.pickupLocationId === form.dropLocationId && <p className={secondaryTone}>Pickup and drop locations need to be different.</p>}
            {form.pickupLocationId && form.dropLocationId && form.pickupLocationId !== form.dropLocationId && !form.pickupDate && <p className={secondaryTone}>Choose your travel date before submitting the request.</p>}
            {isBookingReady && <p className={`font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Everything looks good. You can book this ride now.</p>}
          </div>
          <div className="rounded-xl border p-4 space-y-3" style={routePanelStyle}>
            <p className={`font-mono text-xs uppercase ${labelTone}`}>Selected Route</p>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-green-400" weight="duotone" />
              <div>
                <p className={`text-xs font-mono ${labelTone}`}>PICKUP</p>
                <p className={bodyTone}>
                  {getLocationName(locations.find((location) => location._id === form.pickupLocationId))}
                </p>
              </div>
            </div>
            <div className="ml-2 h-3 border-l-2 border-dashed" style={isDark ? { borderColor: 'rgba(51, 65, 85, 1)' } : { borderColor: 'var(--border)' }} />
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-red-400" weight="duotone" />
              <div>
                <p className={`text-xs font-mono ${labelTone}`}>DROP</p>
                <p className={bodyTone}>
                  {getLocationName(locations.find((location) => location._id === form.dropLocationId))}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border p-4" style={softPanelStyle}>
            <p className={`text-sm ${secondaryTone}`}>After booking, this screen will update with assignment, ride start, and completion status so you can track the whole trip from one place.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
