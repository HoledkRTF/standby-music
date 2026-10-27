'use client';

import { useEffect, useState, useCallback } from 'react';

const CURRENT_APP_VERSION = '1.0.3-zenith-restore';

export function usePwaUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(CURRENT_APP_VERSION);

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const serverVersion = `${data.version}-${data.codename}`;
        if (serverVersion && serverVersion !== CURRENT_APP_VERSION) {
          console.log(`[PWA Update] New version detected: ${serverVersion} (current: ${CURRENT_APP_VERSION})`);
          setUpdateAvailable(true);
          setLatestVersion(serverVersion);
          // Hard reload with cache-bust to ensure iOS WebClip loads latest code
          window.location.replace(`/?v=${Date.now()}`);
        }
      }
    } catch {
      // Offline or network error - ignore
    }
  }, []);

  const forceRefresh = useCallback(() => {
    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch {}
    window.location.replace(`/?v=${Date.now()}`);
  }, []);

  useEffect(() => {
    // Check once on initial mount
    checkVersion();

    // Check every time app becomes visible (e.g. user returns from App Switcher or unlocks phone)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [checkVersion]);

  return {
    currentVersion: CURRENT_APP_VERSION,
    latestVersion,
    updateAvailable,
    forceRefresh,
  };
}
