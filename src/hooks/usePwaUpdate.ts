'use client';

import { useEffect, useState, useCallback } from 'react';
import { CURRENT_BUILD_ID } from '@/data/version';

export function usePwaUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState(CURRENT_BUILD_ID);

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
        if (serverVersion && serverVersion !== CURRENT_BUILD_ID) {
          console.log(`[PWA Update] New version detected: ${serverVersion} (current: ${CURRENT_BUILD_ID})`);
          setUpdateAvailable(true);
          setLatestVersion(serverVersion);

          // Guard against infinite reload loops: reload at most once per version in this session
          if (typeof window !== 'undefined' && window.sessionStorage) {
            const alreadyReloaded = sessionStorage.getItem('pwa_auto_reload_version');
            if (alreadyReloaded !== serverVersion) {
              sessionStorage.setItem('pwa_auto_reload_version', serverVersion);
              window.location.replace(`/?v=${Date.now()}`);
            }
          }
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

    // Check periodically in the background (every 30 seconds)
    const interval = setInterval(checkVersion, 30000);

    // Check every time app becomes visible (e.g. user returns from App Switcher or unlocks phone)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [checkVersion]);

  return {
    currentVersion: CURRENT_BUILD_ID,
    latestVersion,
    updateAvailable,
    forceRefresh,
  };
}
