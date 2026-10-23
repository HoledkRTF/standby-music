'use client';

import React, { useState } from 'react';
import { AlbumArt } from './AlbumArt';
import { TrackInfo } from './TrackInfo';
import { ProgressScrubber } from './ProgressScrubber';
import { Controls } from './Controls';
import { SyncedLyrics } from './SyncedLyrics';
import { Track, PlayerState } from '../../types/music';
import { LyricsData } from '../../types/music';

interface StandByViewProps {
  playerState: PlayerState;
  lyrics: LyricsData;
  isLyricsLoading?: boolean;
  isNightMode: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleNightMode: () => void;
  onExitStandBy: () => void;
}

export const StandByView: React.FC<StandByViewProps> = ({
  playerState,
  lyrics,
  isLyricsLoading = false,
  isNightMode,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleNightMode,
  onExitStandBy,
}) => {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const currentTrack = playerState.currentTrack;

  if (!currentTrack) {
    return (
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center text-center p-6 select-none">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white/50 fill-current" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Music Selected</h2>
        <p className="text-sm text-white/50 mb-6">Choose a track or playlist from library</p>
        <button
          onClick={onExitStandBy}
          className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm active:scale-95 transition-transform"
        >
          Open Library
        </button>
      </div>
    );
  }

  const isPlaying = playerState.status === 'playing';

  return (
    <div className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col md:flex-row items-center justify-between p-4 sm:p-8 md:p-12 select-none animate-fadeIn">
      {/* Left Column: Big Album Art */}
      <div className="w-full md:w-1/2 h-[45%] md:h-full flex items-center justify-center">
        <AlbumArt
          thumbnailUrl={currentTrack.thumbnail}
          title={currentTrack.title}
          isPlaying={isPlaying}
          isNightMode={isNightMode}
        />
      </div>

      {/* Right Column: Dynamic Controller or Real-Time Lyrics */}
      <div className="w-full md:w-1/2 h-[55%] md:h-full flex flex-col justify-center px-2 sm:px-6 md:px-10">
        {isLyricsOpen ? (
          <div className="w-full h-full max-h-[85vh] bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <SyncedLyrics
              lyrics={lyrics}
              currentTime={playerState.currentTime}
              isLoading={isLyricsLoading}
              onSeek={onSeek}
              onClose={() => setIsLyricsOpen(false)}
              isNightMode={isNightMode}
            />
          </div>
        ) : (
          <div className="w-full max-w-lg mx-auto flex flex-col justify-center space-y-6 sm:space-y-8">
            <TrackInfo
              title={currentTrack.title}
              artist={currentTrack.artist}
              album={currentTrack.album}
              isPlaying={isPlaying}
              isNightMode={isNightMode}
            />

            <ProgressScrubber
              currentTime={playerState.currentTime}
              duration={playerState.duration}
              onSeek={onSeek}
              isNightMode={isNightMode}
            />

            <Controls
              isPlaying={isPlaying}
              isShuffle={playerState.isShuffle}
              isRepeat={playerState.isRepeat}
              isNightMode={isNightMode}
              isLyricsOpen={isLyricsOpen}
              onTogglePlay={onTogglePlay}
              onNext={onNext}
              onPrev={onPrev}
              onToggleShuffle={onToggleShuffle}
              onToggleRepeat={onToggleRepeat}
              onToggleNightMode={onToggleNightMode}
              onToggleLyrics={() => setIsLyricsOpen(true)}
              onExitStandBy={onExitStandBy}
            />
          </div>
        )}
      </div>
    </div>
  );
};
