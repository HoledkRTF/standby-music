'use client';

import React from 'react';
import { EqualizerBars } from './EqualizerBars';

interface TrackInfoProps {
  title: string;
  artist: string;
  album?: string;
  isPlaying: boolean;
  isNightMode?: boolean;
  isLandscape?: boolean;
}

export const TrackInfo: React.FC<TrackInfoProps> = ({
  title,
  artist,
  album,
  isPlaying,
  isNightMode = false,
  isLandscape = false,
}) => {
  return (
    <div className="w-full space-y-1 select-none">
      {/* Live Badge */}
      <div className="flex items-center space-x-2">
        <div
          className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full backdrop-blur-md border ${
            isNightMode
              ? 'bg-red-950/60 border-red-800/40 text-red-500'
              : 'bg-white/15 border-white/10 text-white/80'
          }`}
        >
          <EqualizerBars isPlaying={isPlaying} isNightMode={isNightMode} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Now Playing</span>
        </div>
      </div>

      {/* Song Title and Artist */}
      <div className="space-y-0.5">
        <h2
          className={`font-extrabold tracking-tight truncate leading-tight ${
            isLandscape ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-3xl'
          } ${
            isNightMode ? 'text-red-500 drop-shadow-[0_0_12px_rgba(255,0,0,0.4)]' : 'text-white drop-shadow-md'
          }`}
        >
          {title}
        </h2>
        <p
          className={`font-medium truncate ${
            isLandscape ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
          } ${
            isNightMode ? 'text-red-500/70' : 'text-white/70'
          }`}
        >
          {artist} {album ? `• ${album}` : ''}
        </p>
      </div>
    </div>
  );
};
