'use client';

import React, { useEffect, useRef } from 'react';

interface HiddenPlayerProps {
  videoId?: string;
  isCinemaMode?: boolean;
  onReady: (event: any) => void;
  onStateChange: (event: any) => void;
  onError: (event: any) => void;
  onScreenTap?: () => void;
}

export const HiddenPlayer: React.FC<HiddenPlayerProps> = ({
  videoId,
  isCinemaMode = false,
  onReady,
  onStateChange,
  onError,
  onScreenTap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);

  useEffect(() => {
    function initPlayer() {
      if (typeof window !== 'undefined' && window.YT && window.YT.Player && containerRef.current) {
        try {
          playerInstanceRef.current = new window.YT.Player(containerRef.current, {
            height: '100%',
            width: '100%',
            videoId: videoId || '',
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 1,
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
      aria-hidden={!isCinemaMode}
      className={
        isCinemaMode
          ? 'fixed inset-0 z-10 w-full h-[100dvh] bg-black flex items-center justify-center overflow-hidden transition-all duration-300'
          : 'fixed -bottom-[300px] -right-[300px] w-px h-px opacity-0 pointer-events-none overflow-hidden -z-50'
      }
    >
      {/* Video Container centered with cinema aspect ratio */}
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          ref={containerRef}
          id="youtube-standby-player-element"
          className="w-full h-full max-w-full max-h-full object-contain"
        />

        {/* Transparent touch/click overlay to capture screen taps in cinema mode without iframe intercepting */}
        {isCinemaMode && (
          <div
            onClick={onScreenTap}
            className="absolute inset-0 z-20 cursor-pointer bg-transparent"
            title="Tap to toggle movie controls"
          />
        )}
      </div>
    </div>
  );
};
