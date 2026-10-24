'use client';

import React, { useEffect, useRef } from 'react';
import { LyricsData } from '../../types/music';

interface SyncedLyricsProps {
  lyrics: LyricsData;
  currentTime: number;
  isLoading?: boolean;
  onSeek: (seconds: number) => void;
  onClose: () => void;
  isNightMode?: boolean;
}

export const SyncedLyrics: React.FC<SyncedLyricsProps> = ({
  lyrics,
  currentTime,
  isLoading = false,
  onSeek,
  onClose,
  isNightMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  // Find active line index based on current playback seconds
  let activeIndex = -1;
  if (lyrics.synced && lyrics.lines.length > 0) {
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (currentTime >= lyrics.lines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }
  }

  // Smoothly center the active lyric line
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none animate-fadeIn">
      {/* Minimal Top Close Control - Floating seamlessly without clunky title or border line */}
      <div className="flex items-center justify-end shrink-0 z-20 pb-1 pr-1">
        <button
          onClick={onClose}
          className={`p-1.5 rounded-full backdrop-blur-xl transition-all active:scale-90 ${
            isNightMode
              ? 'bg-red-950/60 text-red-400 hover:bg-red-900/80 border border-red-500/20'
              : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/10'
          }`}
          title="Close Lyrics"
        >
          <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Lyrics Scrollable Body - 100% clean typography without any mask or overlay artifacts */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-24 space-y-6 scrollbar-none relative"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-white/50 text-sm">
            <div
              className={`w-6 h-6 border-2 rounded-full animate-spin ${
                isNightMode ? 'border-red-500 border-t-transparent' : 'border-white/60 border-t-transparent'
              }`}
            />
            <span>Finding lyrics...</span>
          </div>
        ) : lyrics.lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <p className={`text-base font-medium ${isNightMode ? 'text-red-500/70' : 'text-white/60'}`}>
              Lyrics aren't available for this song
            </p>
            <p className="text-xs text-white/40 mt-1">Enjoy the music</p>
          </div>
        ) : (
          lyrics.lines.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => {
                  if (lyrics.synced) onSeek(line.time);
                }}
                className={`text-xl sm:text-2xl md:text-3xl leading-snug transition-all duration-300 cursor-pointer ${
                  isActive
                    ? isNightMode
                      ? 'text-red-500 font-black'
                      : 'text-white font-black'
                    : isNightMode
                    ? 'text-red-950/70 font-semibold hover:text-red-800'
                    : 'text-white/30 font-semibold hover:text-white/60'
                }`}
              >
                {line.text}
              </p>
            );
          })
        )}
      </div>
    </div>
  );
};
