'use client';

import React, { useEffect, useRef } from 'react';

interface HiddenPlayerProps {
  videoId?: string;
  thumbnailUrl?: string;
  isCinemaMode?: boolean;
  isStandByActive?: boolean;
  isLandscape?: boolean;
  onReady: (event: any) => void;
  onStateChange: (event: any) => void;
  onError: (event: any) => void;
  onScreenTap?: () => void;
}

export const HiddenPlayer: React.FC<HiddenPlayerProps> = ({
  videoId,
  thumbnailUrl,
  isCinemaMode = false,
  isStandByActive = false,
  isLandscape = false,
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
              controls: isCinemaMode ? 1 : 0,
              disablekb: 1,
              fs: 1,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
              origin: typeof window !== 'undefined' ? window.location.origin : '',
            },
            events: {
              onReady: (event: any) => {
                try {
                  const iframe = containerRef.current?.querySelector('iframe');
                  if (iframe) {
                    iframe.setAttribute('allow', 'autoplay; encrypted-media; mediasession \'none\'');
                  }
                  if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
                    navigator.mediaSession.metadata = null;
                    navigator.mediaSession.playbackState = 'none';
                  }
                } catch {}
                onReady(event);
              },
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
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);

  // Compute dynamic positioning so the YouTube player is VISIBLE on screen in all modes.
  // Rendering with opacity: 1 and true viewport dimensions prevents iOS WebKit from classifying
  // the playback as an invisible background audio stream and suppressing the Dynamic Island pill.
  let positionClass = '';
  if (isCinemaMode) {
    positionClass = 'fixed inset-0 z-50 w-full h-[100dvh] bg-black flex items-center justify-center overflow-hidden transition-all duration-300';
  } else if (isStandByActive && isLandscape) {
    positionClass = 'fixed left-[max(5rem,env(safe-area-inset-left,76px))] top-1/2 -translate-y-1/2 h-[calc(100dvh-max(3rem,calc(env(safe-area-inset-top,24px)+env(safe-area-inset-bottom,24px))))] max-h-[370px] aspect-square rounded-[28px] overflow-hidden shadow-2xl z-20 transition-all duration-300';
  } else if (isStandByActive && !isLandscape) {
    positionClass = 'fixed top-[max(2.5rem,env(safe-area-inset-top,40px))] left-1/2 -translate-x-1/2 w-[min(300px,calc(100vw-3rem))] aspect-square rounded-[24px] overflow-hidden shadow-2xl z-20 transition-all duration-300';
  } else {
    // In Library Mode (bottom-left miniplayer thumbnail)
    positionClass = 'fixed bottom-[calc(env(safe-area-inset-bottom,0px)+3.75rem)] left-3 w-10 h-10 rounded-lg overflow-hidden shadow-md z-30 pointer-events-none transition-all duration-300';
  }

  return (
    <div
      onClick={!isCinemaMode ? onScreenTap : undefined}
      className={`${positionClass} ${isCinemaMode ? 'pointer-events-auto' : 'cursor-pointer'} bg-black`}
    >
      {thumbnailUrl && !isCinemaMode && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none -z-10"
        />
      )}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <div
          ref={containerRef}
          id="youtube-standby-player-element"
          className={
            isCinemaMode
              ? 'w-full h-full max-w-full max-h-full object-contain pointer-events-auto'
              : 'w-[178%] h-full max-w-none -translate-x-[22%] object-cover pointer-events-none'
          }
        />
      </div>
    </div>
  );
};
