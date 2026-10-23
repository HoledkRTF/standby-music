'use client';

import { useState, useEffect } from 'react';

export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function checkOrientation() {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
    }

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', checkOrientation);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      if (window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', checkOrientation);
      }
    };
  }, []);

  return { isLandscape };
}
