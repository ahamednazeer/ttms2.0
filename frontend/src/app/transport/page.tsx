'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { CompletedJourneyCard, InfoPill, TripProgressTracker } from '@/components/CompletedJourneyCard';
import { EmptyState } from '@/components/FeedbackState';
import { useTheme } from '@/components/ThemeProvider';
import { useTicketRealtime } from '@/hooks/useTicketRealtime';
import type { City, Location, Ticket, User } from '@/lib/types';
import { CarSimple, MapPin, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { SingleCardSkeleton } from '@/components/Skeleton';

export default function TransportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [lastCompletedTicket, setLastCompletedTicket] = useState<Ticket | null>(null);
  const [startingRide, setStartingRide] = useState(false);
  const [completingRide, setCompletingRide] = useState(false);
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);
  const { theme, mounted } = useTheme();
  const isDark = !mounted || theme === 'dark';

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
  const activeTimelineStep = activeTicket?.status === 'RIDE_STARTED' ? 'Ride Started' : 'Assigned';
  const getLocationName = (value?: string | Location) => typeof value === 'string' ? '-' : value?.locationName || '-';
  const getUserName = (value?: string | User) => typeof value === 'string' ? '-' : value?.firstName || '-';
  const getCityName = (value?: string | City) => typeof value === 'string' ? '-' : value?.cityName || '-';
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
  const infoNoticeStyle = isDark
    ? { borderColor: 'rgba(34, 197, 94, 0.25)', background: 'rgba(34, 197, 94, 0.12)' }
    : { borderColor: 'rgba(34, 197, 94, 0.18)', background: 'rgba(34, 197, 94, 0.08)' };
  const blueActionStyle = isDark
    ? { borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.12)' }
    : { borderColor: 'rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.06)' };
  const greenActionStyle = isDark
    ? { borderColor: 'rgba(34, 197, 94, 0.28)', background: 'rgba(34, 197, 94, 0.12)' }
    : { borderColor: 'rgba(34, 197, 94, 0.2)', background: 'rgba(34, 197, 94, 0.06)' };
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

  const handleStartRide = async (id: string) => {
    try {
      setStartingRide(true);
      setInlineNotice(null);
      await api.startRide(id);
      toast.success('Ride started');
      setInlineNotice('Ride started successfully. The passenger can now share the OTP at drop-off.');
      await refreshTickets();
    }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to start ride'); }
    finally { setStartingRide(false); }
  };

  const handleCompleteRide = async (id: string) => {
    if (!otp || otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    try {
      setCompletingRide(true);
      setInlineNotice(null);
      const completedTicket = await api.completeRide(id, otp);
      toast.success('Ride completed!');
      setInlineNotice('OTP verified. This journey has been completed and moved to history.');
      setOtp('');
      setLastCompletedTicket(completedTicket || null);
      await refreshTickets();
    }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to complete ride'); }
    finally { setCompletingRide(false); }
  };

  if (loading) return <SingleCardSkeleton />;

  if (!activeTicket) {
    if (lastCompletedTicket) {
      return (
        <CompletedJourneyCard
          title="Journey Completed"
          subtitle="OTP verified, trip closed, and this completed ride is now ready for review."
          successTitle="OTP verified. Ride completed successfully."
          successBody="Fare confirmation and invoice-related notifications have been triggered for this trip."
          status={lastCompletedTicket.status}
          invoiceBadge={{ label: 'Invoice email queued', tone: 'emerald' }}
          summaryDetails={[
            { label: 'Passenger', value: getUserName(lastCompletedTicket.userId) },
            { label: 'City', value: getCityName(lastCompletedTicket.cityId) },
            { label: 'Fare', value: formatMoney(lastCompletedTicket.cost), emphasis: 'money' },
            { label: 'Duration', value: getDurationLabel(lastCompletedTicket.rideStartTime, lastCompletedTicket.rideEndTime) },
          ]}
          metaDetails={[
            { label: 'Scheduled Date', value: formatDateTime(lastCompletedTicket.pickupDate) },
            { label: 'Started', value: formatDateTime(lastCompletedTicket.rideStartTime) },
            { label: 'Ended', value: formatDateTime(lastCompletedTicket.rideEndTime) },
          ]}
          pickup={getLocationName(lastCompletedTicket.pickupLocationId)}
          drop={getLocationName(lastCompletedTicket.dropLocationId)}
          historyNote="You can review this completed job anytime in transport history."
          actions={[
            { label: 'Open Completed Journeys', href: '/transport/history', variant: 'primary' },
            { label: 'Back to Active Screen', onClick: () => setLastCompletedTicket(null), variant: 'secondary' },
          ]}
        />
      );
    }

    return (
      <EmptyState
        title="No Active Journey"
        description="There are no journeys assigned right now. This screen refreshes automatically when a new trip is dispatched."
        icon={CarSimple}
        actions={[
          { label: 'Refresh', onClick: refreshTickets, variant: 'primary' },
          { label: 'Open History', href: '/transport/history', variant: 'secondary' },
        ]}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-chivo font-bold uppercase tracking-wider flex items-center gap-3">
          <CarSimple size={28} weight="duotone" className="text-green-400" /> Active Journey
        </h1>
        <p className="page-subtitle">Manage assigned rides, verify OTP, and complete the journey workflow.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="card space-y-4">
          {inlineNotice && (
            <div className="rounded-xl border px-4 py-3" style={infoNoticeStyle}>
              <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{inlineNotice}</p>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className={`font-mono text-xs uppercase ${labelTone}`}>Status</span>
            <StatusBadge status={activeTicket.status} />
          </div>
          <div className="rounded-xl border p-3 space-y-3" style={softPanelStyle}>
            <div className="flex items-center justify-between gap-3">
              <span className={`font-mono text-xs uppercase ${labelTone}`}>Trip Progress</span>
              <InfoPill
                label={activeTicket.status === 'RIDE_STARTED' ? 'Invoice pending' : 'Invoice queued after completion'}
                tone={activeTicket.status === 'RIDE_STARTED' ? 'amber' : 'blue'}
              />
            </div>
            <TripProgressTracker
              steps={['Assigned', 'Ride Started', 'OTP Verify', 'Completed']}
              currentStep={activeTicket.status === 'RIDE_STARTED' ? 'Ride Started' : activeTimelineStep}
              compact
            />
          </div>
          <div className="info-strip">
            {activeTicket.status === 'ASSIGNED'
              ? 'Confirm pickup only after the passenger is onboard and the trip has begun.'
              : 'Use the passenger OTP only at drop-off to securely complete the ride.'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
              <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Passenger</p>
              <p className={`${bodyTone} font-semibold`}>{getUserName(activeTicket.userId)}</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
              <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>City</p>
              <p className={`${bodyTone} font-semibold`}>{getCityName(activeTicket.cityId)}</p>
            </div>
            <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
              <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Scheduled Date</p>
              <p className={`${bodyTone} font-semibold`}>{formatDateTime(activeTicket.pickupDate)}</p>
            </div>
          </div>
          <div className="rounded-xl border p-3 space-y-3" style={routePanelStyle}>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-green-400" weight="duotone" />
              <div><p className={`text-xs font-mono ${labelTone}`}>PICKUP</p><p className={bodyTone}>{getLocationName(activeTicket.pickupLocationId)}</p></div>
            </div>
            <div className="ml-2 h-3 border-l-2 border-dashed" style={isDark ? { borderColor: 'rgba(51, 65, 85, 1)' } : { borderColor: 'var(--border)' }} />
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-red-400" weight="duotone" />
              <div><p className={`text-xs font-mono ${labelTone}`}>DROP</p><p className={bodyTone}>{getLocationName(activeTicket.dropLocationId)}</p></div>
            </div>
          </div>
          {activeTicket.rideStartTime && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
                <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Started</p>
                <p className={`${bodyTone} font-semibold`}>{formatDateTime(activeTicket.rideStartTime)}</p>
              </div>
              <div className="rounded-lg border p-3 space-y-1" style={softPanelStyle}>
                <p className={`font-mono text-xs uppercase tracking-wider ${labelTone}`}>Elapsed</p>
                <p className={`${bodyTone} font-semibold`}>{getDurationLabel(activeTicket.rideStartTime, new Date().toISOString())}</p>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          {activeTicket.status === 'ASSIGNED' && (
            <div className="rounded-2xl border p-5 space-y-4" style={greenActionStyle}>
              <div className="space-y-1 text-center">
                <p className={`text-xs font-mono uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Pickup Confirmation</p>
                <p className={`text-sm ${secondaryTone}`}>Start the ride only after the passenger is onboard.</p>
              </div>
              <button
                onClick={() => handleStartRide(activeTicket._id)}
                className="w-full btn-success flex min-h-12 items-center justify-center gap-2 py-3"
                disabled={startingRide}
              >
                <CarSimple size={20} /> {startingRide ? 'Starting Ride...' : 'Start Ride - User Picked Up'}
              </button>
            </div>
          )}

          {activeTicket.status === 'RIDE_STARTED' && (
            <div className="rounded-2xl border p-5 space-y-4" style={blueActionStyle}>
              <div className="space-y-1 text-center">
                <p className={`text-xs font-mono uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Complete Journey</p>
                <p className={`text-sm ${secondaryTone}`}>Enter the passenger OTP at drop-off.</p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                className="input-modern text-center text-xl tracking-[0.3em] py-4"
              />
              <p className={`text-center text-xs ${isDark ? 'text-slate-400' : 'text-[color:var(--text-secondary)]'}`}>
                {otp.length === 6 ? 'OTP looks complete. You can verify now.' : 'Enter all 6 digits to unlock completion.'}
              </p>
              <button
                onClick={() => handleCompleteRide(activeTicket._id)}
                className="w-full btn-primary flex min-h-12 items-center justify-center gap-2 py-3"
                disabled={otp.length !== 6 || completingRide}
              >
                <CheckCircle size={20} /> {completingRide ? 'Verifying OTP...' : 'Verify OTP & Complete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

