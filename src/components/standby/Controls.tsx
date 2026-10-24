'use client';

import React from 'react';

interface ControlsProps {
  isPlaying: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  isNightMode: boolean;
  isLyricsOpen: boolean;
  isLandscape?: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleNightMode: () => void;
  onToggleLyrics: () => void;
  onExitStandBy: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  isShuffle,
  isRepeat,
  isNightMode,
  isLyricsOpen,
  isLandscape = false,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleShuffle,
  onToggleRepeat,
  onToggleNightMode,
  onToggleLyrics,
  onExitStandBy,
}) => {
  return (
    <div className={`w-full flex flex-col select-none ${isLandscape ? 'space-y-2' : 'space-y-4'}`}>
      {/* Primary Transport Controls */}
      <div className="flex items-center justify-between sm:justify-center sm:space-x-6">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          className={`p-2 rounded-full transition-all active:scale-90 ${
            isShuffle
              ? isNightMode
                ? 'text-red-500 bg-red-950/60'
                : 'text-white bg-white/20'
              : isNightMode
              ? 'text-red-950 hover:text-red-700'
              : 'text-white/40 hover:text-white/80'
          }`}
          title="Shuffle"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
          </svg>
        </button>

        {/* Previous */}
        <button
          onClick={onPrev}
          className={`p-2 rounded-full transition-all active:scale-90 ${
            isNightMode ? 'text-red-500 hover:text-red-400' : 'text-white/90 hover:text-white'
          }`}
          title="Previous Track"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`aspect-square shrink-0 rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-2xl ${
            isLandscape ? 'w-12 h-12 sm:w-14 sm:h-14' : 'w-16 h-16 sm:w-20 sm:h-20'
          } ${
            isNightMode
              ? 'bg-red-600 hover:bg-red-500 text-black shadow-[0_0_25px_rgba(255,0,0,0.5)]'
              : 'bg-white hover:bg-white/95 text-black shadow-[0_10px_30px_rgba(255,255,255,0.3)]'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className={isLandscape ? 'w-6 h-6 fill-current' : 'w-8 h-8 fill-current'} viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          ) : (
            <svg className={isLandscape ? 'w-6 h-6 fill-current translate-x-0.5' : 'w-8 h-8 fill-current translate-x-0.5'} viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className={`p-2 rounded-full transition-all active:scale-90 ${
            isNightMode ? 'text-red-500 hover:text-red-400' : 'text-white/90 hover:text-white'
          }`}
          title="Next Track"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        {/* Repeat */}
        <button
          onClick={onToggleRepeat}
          className={`p-2 rounded-full transition-all active:scale-90 ${
            isRepeat
              ? isNightMode
                ? 'text-red-500 bg-red-950/60'
                : 'text-white bg-white/20'
              : isNightMode
              ? 'text-red-950 hover:text-red-700'
              : 'text-white/40 hover:text-white/80'
          }`}
          title="Repeat"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
        </button>
      </div>

      {/* Secondary Bar: Lyrics, Night Mode, and Exit StandBy */}
      <div className={`flex items-center justify-between px-1 border-t border-white/10 ${isLandscape ? 'pt-1.5' : 'pt-2'}`}>
        <div className="flex items-center space-x-2">
          {/* Lyrics Button */}
          <button
            onClick={onToggleLyrics}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all active:scale-95 ${
              isLyricsOpen
                ? isNightMode
                  ? 'bg-red-600 text-black'
                  : 'bg-white text-black shadow-md'
                : isNightMode
                ? 'bg-red-950/50 text-red-500 hover:bg-red-900/60 border border-red-800/40'
                : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
            }`}
            title="Lyrics"
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Lyrics</span>
          </button>

          {/* Night Mode Toggle */}
          <button
            onClick={onToggleNightMode}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md transition-all active:scale-95 ${
              isNightMode
                ? 'bg-red-600 text-black shadow-[0_0_12px_#ff0000]'
                : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
            }`}
            title="Apple StandBy Bedside Night Mode"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.3 19.98 10.61 20.35 12 20.35c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7 0-1.8.69-3.44 1.82-4.69.28-.31.39-.73.29-1.13-.1-.4-.38-.72-.77-.84C4.69 4.84 4 6.34 4 8c0 4.41 3.59 8 8 8 1.66 0 3.16-.69 4.24-1.8.28-.29.41-.69.34-1.09-.07-.4-.33-.74-.71-.89C14.77 11.55 13.43 11 12 11c-1.66 0-3 1.34-3 3 0 .55-.45 1-1 1s-1-.45-1-1c0-2.76 2.24-5 5-5 1.79 0 3.37.95 4.25 2.38C17.63 8.35 15.01 6.5 12 6.5c-3.04 0-5.5 2.46-5.5 5.5 0 3.04 2.46 5.5 5.5 5.5 1.54 0 2.93-.63 3.93-1.65.38-.38 1.01-.39 1.4-.01.4.38.4 1.01.02 1.4C15.89 18.37 14.05 19 12 19z" />
            </svg>
            <span>{isNightMode ? 'Night Mode' : 'Night Mode'}</span>
          </button>
        </div>

        {/* Exit StandBy */}
        <button
          onClick={onExitStandBy}
          className={`p-1.5 rounded-full backdrop-blur-md transition-all active:scale-95 ${
            isNightMode
              ? 'text-red-500 hover:bg-red-950/60'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          title="Exit StandBy Mode"
        >
          <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
};
