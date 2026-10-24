'use client';

import React from 'react';
import { Track, PlaybackStatus } from '../../types/music';

interface MiniPlayerProps {
  currentTrack: Track | null;
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onEnterStandBy: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  status,
  currentTime,
  duration,
  onTogglePlay,
  onEnterStandBy,
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const isPlaying = status === 'playing';

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="relative overflow-hidden bg-black/60 backdrop-blur-2xl border border-white/15 rounded-3xl p-3 shadow-2xl flex items-center justify-between">
        {/* Track Thumbnail and Info */}
        <div
          onClick={onEnterStandBy}
          className="flex items-center space-x-3.5 flex-1 min-w-0 cursor-pointer"
        >
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md">
            <img
              src={currentTrack.thumbnail}
              alt={currentTrack.title}
              className="w-full h-full object-cover bg-white/5"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
              }}
            />
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-sm font-bold text-white truncate">{currentTrack.title}</p>
            <p className="text-xs text-white/60 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 aspect-square shrink-0 rounded-full bg-white text-black flex items-center justify-center transition-transform active:scale-90 shadow-md"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg className="w-5 h-5 fill-current translate-x-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* StandBy Fullscreen Button */}
          <button
            onClick={onEnterStandBy}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-all active:scale-95"
            title="Enter Apple StandBy Mode"
          >
            <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="3" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6" />
            </svg>
            <span className="hidden sm:inline">StandBy</span>
          </button>
        </div>

        {/* Progress Bar Line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <div
            className="h-full bg-white/80 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
