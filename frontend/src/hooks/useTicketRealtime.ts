'use client';

import { useEffect, useRef } from 'react';
import { realtimeClient } from '@/lib/realtime';

export function useTicketRealtime(onRefresh: () => void | Promise<void>) {
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const socket = realtimeClient.connect();
    if (!socket) return;

    const refresh = () => {
      void onRefreshRef.current();
    };

    const handleTicketUpdated = () => {
      refresh();
    };

    socket.on('connect', refresh);
    socket.on('realtime.connected', refresh);
    socket.on('ticket.updated', handleTicketUpdated);

    return () => {
      socket.off('connect', refresh);
      socket.off('realtime.connected', refresh);
      socket.off('ticket.updated', handleTicketUpdated);
    };
  }, []);
}
