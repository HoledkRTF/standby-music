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
    <div className="relative w-full h-full flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isNightMode ? 'bg-red-500 animate-pulse' : 'bg-white/80 animate-pulse'
            }`}
          />
          <span
            className={`text-xs uppercase tracking-widest font-semibold ${
              isNightMode ? 'text-red-500' : 'text-white/70'
            }`}
          >
            {lyrics.synced ? 'Real-Time Lyrics' : 'Lyrics'}
          </span>
        </div>
        <button
          onClick={onClose}
          className={`text-xs px-3 py-1.5 rounded-full transition-all active:scale-95 ${
            isNightMode
              ? 'bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/40'
              : 'bg-white/15 hover:bg-white/25 text-white/90 backdrop-blur-md'
          }`}
        >
          Done
        </button>
      </div>

      {/* Lyrics Scrollable Body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden py-10 space-y-6 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-white/50 text-sm">
            <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isNightMode ? 'border-red-500 border-t-transparent' : 'border-white/60 border-t-transparent'}`} />
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
                className={`text-xl md:text-3xl font-bold leading-relaxed transition-all duration-300 cursor-pointer ${
                  isActive
                    ? isNightMode
                      ? 'text-red-500 scale-[1.03] origin-left drop-shadow-[0_0_15px_rgba(255,20,0,0.6)]'
                      : 'text-white scale-[1.03] origin-left drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]'
                    : isNightMode
                    ? 'text-red-950/70 hover:text-red-800'
                    : 'text-white/35 hover:text-white/60 blur-[0.2px]'
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
