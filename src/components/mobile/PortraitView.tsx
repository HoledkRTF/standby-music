'use client';

import React from 'react';
import { SearchBar } from './SearchBar';
import { PresetPills } from './PresetPills';
import { QueueList } from './QueueList';
import { MiniPlayer } from './MiniPlayer';
import { Track, PlayerState } from '../../types/music';

interface PortraitViewProps {
  playerState: PlayerState;
  isFullscreen?: boolean;
  onSelectTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onTogglePlay: () => void;
  onEnterStandBy: () => void;
  onEnterCinemaMode: () => void;
  onToggleFullscreen: () => void;
}

export const PortraitView: React.FC<PortraitViewProps> = ({
  playerState,
  isFullscreen = false,
  onSelectTrack,
  onAddToQueue,
  onRemoveFromQueue,
  onTogglePlay,
  onEnterStandBy,
  onEnterCinemaMode,
  onToggleFullscreen,
}) => {
  return (
    <div className="relative min-h-[100dvh] w-full max-w-lg mx-auto px-4 pt-[max(3.75rem,env(safe-area-inset-top,60px))] pb-[max(8.5rem,env(safe-area-inset-bottom,36px))] flex flex-col space-y-6 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-sm">
            <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">StandBy Music</h1>
            <p className="text-[11px] text-white/50 leading-none mt-1">YouTube Music Apple Display</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Cinema / Movie Mode Button */}
          <button
            onClick={onEnterCinemaMode}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md border border-amber-500/30 transition-all active:scale-95 shadow-sm"
            title="Watch Music Video in Movie Mode"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
            <span>Movie</span>
          </button>

          {/* StandBy Mode Button */}
          <button
            onClick={onEnterStandBy}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all active:scale-95 shadow-sm"
            title="Enter StandBy Display"
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="3" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8" />
            </svg>
            <span>StandBy</span>
          </button>

          {/* Fullscreen / PWA Helper Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-sm"
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen / App Mode'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <SearchBar onSelectTrack={onSelectTrack} onAddToQueue={onAddToQueue} />

      {/* Featured Vibes Presets */}
      <PresetPills
        onSelectTrack={onSelectTrack}
        currentTrackId={playerState.currentTrack?.id}
      />

      {/* Up Next Queue */}
      <div className="flex-1">
        <QueueList
          queue={playerState.queue}
          onSelectTrack={onSelectTrack}
          onRemoveTrack={onRemoveFromQueue}
        />
      </div>

      {/* Persistent Floating Mini-Player */}
      <MiniPlayer
        currentTrack={playerState.currentTrack}
        status={playerState.status}
        currentTime={playerState.currentTime}
        duration={playerState.duration}
        onTogglePlay={onTogglePlay}
        onEnterStandBy={onEnterStandBy}
      />
    </div>
  );
};
