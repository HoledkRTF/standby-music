'use client';

import React, { useEffect, useRef } from 'react';

interface HiddenPlayerProps {
  videoId?: string;
  onReady: (event: any) => void;
  onStateChange: (event: any) => void;
  onError: (event: any) => void;
}

export const HiddenPlayer: React.FC<HiddenPlayerProps> = ({ videoId, onReady, onStateChange, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    function initPlayer() {
      if (typeof window !== 'undefined' && window.YT && window.YT.Player && containerRef.current) {
        try {
          playerInstanceRef.current = new window.YT.Player(containerRef.current, {
            height: '1',
            width: '1',
            videoId: videoId || '',
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
              origin: typeof window !== 'undefined' ? window.location.origin : '',
            },
            events: {
              onReady,
              onStateChange,
              onError,
            },
          });
        } catch (err) {
          console.error('Failed to initialize YouTube Player:', err);
        }
      }
    }

    if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
      initPlayer();
    } else if (typeof window !== 'undefined') {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };
    }

    return () => {
      if (playerInstanceRef.current && playerInstanceRef.current.destroy) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {
          // ignore cleanup error
        }
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: -200,
        right: -200,
        width: 1,
        height: 1,
        opacity: 0.001,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: -999,
      }}
    >
      <div ref={containerRef} id="youtube-standby-player-element" />
    </div>
  );
};
