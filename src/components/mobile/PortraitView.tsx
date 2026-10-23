'use client';

import React from 'react';
import { SearchBar } from './SearchBar';
import { PresetPills } from './PresetPills';
import { QueueList } from './QueueList';
import { MiniPlayer } from './MiniPlayer';
import { Track, PlayerState } from '../../types/music';

interface PortraitViewProps {
  playerState: PlayerState;
  onSelectTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onTogglePlay: () => void;
  onEnterStandBy: () => void;
}

export const PortraitView: React.FC<PortraitViewProps> = ({
  playerState,
  onSelectTrack,
  onAddToQueue,
  onRemoveFromQueue,
  onTogglePlay,
  onEnterStandBy,
}) => {
  return (
    <div className="relative min-h-[100dvh] w-full max-w-lg mx-auto px-4 pt-6 pb-32 flex flex-col space-y-6">
      {/* Top Header */}
      <header className="flex items-center justify-between pt-2">
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

        <button
          onClick={onEnterStandBy}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md border border-white/15 transition-all active:scale-95 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="3" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8" />
          </svg>
          <span>StandBy</span>
        </button>
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
