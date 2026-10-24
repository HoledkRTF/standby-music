'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlbumArt } from './AlbumArt';
import { TrackInfo } from './TrackInfo';
import { ProgressScrubber } from './ProgressScrubber';
import { Controls } from './Controls';
import { SyncedLyrics } from './SyncedLyrics';
import { PlayerState, LyricsData } from '../../types/music';

interface StandByViewProps {
  playerState: PlayerState;
  lyrics: LyricsData;
  isLyricsLoading?: boolean;
  isNightMode: boolean;
  isCinemaMode?: boolean;
  isFullscreen?: boolean;
  isLandscape?: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleNightMode: () => void;
  onToggleCinemaMode?: () => void;
  onToggleFullscreen?: () => void;
  onExitStandBy: () => void;
}

export const StandByView: React.FC<StandByViewProps> = ({
  playerState,
  lyrics,
  isLyricsLoading = false,
  isNightMode,
  isCinemaMode = false,
  isFullscreen = false,
  isLandscape = false,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleNightMode,
  onToggleCinemaMode,
  onToggleFullscreen,
  onExitStandBy,
}) => {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTrack = playerState.currentTrack;

  const isPlaying = playerState.status === 'playing';

  // Auto-hide controls in Cinema Mode after 3.5s of inactivity when playing
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying && isCinemaMode) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying, isCinemaMode]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, isCinemaMode, resetHideTimer]);

  const handleContainerClick = () => {
    if (isCinemaMode) {
      if (showControls) {
        setShowControls(false);
      } else {
        resetHideTimer();
      }
    }
  };

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

  // CINEMA / MOVIE FULLSCREEN MODE
  if (isCinemaMode) {
    return (
      <div
        onClick={handleContainerClick}
        onMouseMove={resetHideTimer}
        onTouchStart={resetHideTimer}
        className="fixed inset-0 z-30 w-full h-[100dvh] flex flex-col justify-between p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom,16px))] pt-[max(1rem,env(safe-area-inset-top,16px))] pr-[max(1rem,env(safe-area-inset-right,16px))] pl-[max(1rem,env(safe-area-inset-left,16px))] select-none overflow-hidden"
      >
        {/* Cinema Top Header (Auto-hides) */}
        <div
          className={`w-full flex items-center justify-between transition-opacity duration-500 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center space-x-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 max-w-[70vw] truncate">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <div className="truncate">
              <h2 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
                {currentTrack.title}
              </h2>
              <p className="text-xs text-white/60 truncate leading-tight mt-0.5">
                {currentTrack.artist}
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30 shrink-0">
              Cinema
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/15 text-white active:scale-95 transition-transform"
                title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
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
            )}

            <button
              onClick={onExitStandBy}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/15 text-white active:scale-95 transition-transform"
              title="Close Cinema Mode"
            >
              <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Center: Lyrics overlay if open */}
        {isLyricsOpen && (
          <div
            className="w-full max-w-xl mx-auto my-auto max-h-[60vh] bg-black/75 backdrop-blur-2xl rounded-3xl border border-white/15 shadow-2xl overflow-hidden pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SyncedLyrics
              lyrics={lyrics}
              currentTime={playerState.currentTime}
              isLoading={isLyricsLoading}
              onSeek={onSeek}
              onClose={() => setIsLyricsOpen(false)}
              isNightMode={isNightMode}
            />
          </div>
        )}

        {/* Cinema Bottom Floating Controls (Auto-hides) */}
        <div
          className={`w-full max-w-2xl mx-auto bg-black/65 backdrop-blur-2xl rounded-3xl border border-white/15 p-4 shadow-2xl space-y-3 transition-opacity duration-500 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
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
            isCinemaMode={isCinemaMode}
            isFullscreen={isFullscreen}
            isLandscape={isLandscape}
            onTogglePlay={onTogglePlay}
            onNext={onNext}
            onPrev={onPrev}
            onToggleShuffle={onToggleShuffle}
            onToggleRepeat={onToggleRepeat}
            onToggleNightMode={onToggleNightMode}
            onToggleLyrics={() => setIsLyricsOpen((prev) => !prev)}
            onToggleCinemaMode={onToggleCinemaMode}
            onToggleFullscreen={onToggleFullscreen}
            onExitStandBy={onExitStandBy}
          />
        </div>
      </div>
    );
  }

  // STANDARD APPLE STANDBY MODE (Side-by-side or stacked album art)
  return (
    <div
      className={`relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none animate-fadeIn ${
        isLandscape
          ? 'flex flex-row items-center justify-between px-6 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom,8px))] pr-[max(1.5rem,env(safe-area-inset-right,16px))] pl-[max(1.5rem,env(safe-area-inset-left,16px))]'
          : 'flex flex-col items-center justify-between p-4 pb-[max(1.5rem,env(safe-area-inset-bottom,20px))]'
      }`}
    >
      {/* Left Column: Big Album Art */}
      <div className={`${isLandscape ? 'w-1/2 h-full' : 'w-full h-[45%]'} flex items-center justify-center`}>
        <AlbumArt
          thumbnailUrl={currentTrack.thumbnail}
          title={currentTrack.title}
          isPlaying={isPlaying}
          isNightMode={isNightMode}
          isLandscape={isLandscape}
        />
      </div>

      {/* Right Column: Dynamic Controller or Real-Time Lyrics */}
      <div className={`${isLandscape ? 'w-1/2 h-full py-1' : 'w-full h-[55%]'} flex flex-col justify-center px-3 sm:px-6`}>
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
          <div className={`w-full max-w-lg mx-auto flex flex-col justify-center ${isLandscape ? 'space-y-2.5 sm:space-y-3' : 'space-y-5 sm:space-y-6'}`}>
            <TrackInfo
              title={currentTrack.title}
              artist={currentTrack.artist}
              album={currentTrack.album}
              isPlaying={isPlaying}
              isNightMode={isNightMode}
              isLandscape={isLandscape}
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
              isCinemaMode={isCinemaMode}
              isFullscreen={isFullscreen}
              isLandscape={isLandscape}
              onTogglePlay={onTogglePlay}
              onNext={onNext}
              onPrev={onPrev}
              onToggleShuffle={onToggleShuffle}
              onToggleRepeat={onToggleRepeat}
              onToggleNightMode={onToggleNightMode}
              onToggleLyrics={() => setIsLyricsOpen(true)}
              onToggleCinemaMode={onToggleCinemaMode}
              onToggleFullscreen={onToggleFullscreen}
              onExitStandBy={onExitStandBy}
            />
          </div>
        )}
      </div>
    </div>
  );
};
