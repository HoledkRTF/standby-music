'use client';

import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean = true) {
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }

    let isMounted = true;

    async function requestLock() {
      try {
        if ('wakeLock' in navigator && (navigator as any).wakeLock) {
          sentinelRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        // Silently catch wake lock errors (e.g. low battery mode or permissions)
      }
    }

    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sentinelRef.current && sentinelRef.current.release) {
        sentinelRef.current.release().catch(() => {});
        sentinelRef.current = null;
      }
    };
  }, [enabled]);
}
