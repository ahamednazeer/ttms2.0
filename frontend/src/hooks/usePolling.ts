'use client';

import { useEffect } from 'react';

export function usePolling(callback: () => void | Promise<void>, intervalMs = 5000) {
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          void callback();
        }
      }, intervalMs);
    };

    const stopPolling = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void callback();
        startPolling();
        return;
      }
      stopPolling();
    };

    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callback, intervalMs]);
}
