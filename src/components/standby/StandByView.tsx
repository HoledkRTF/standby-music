'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlbumArt } from './AlbumArt';
import { SyncedLyrics } from './SyncedLyrics';
import { EqualizerBars } from './EqualizerBars';
import { PlayerState, LyricsData } from '../../types/music';
import { formatTime, formatRemainingTime } from '../../utils/youtube';

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
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  onToggleNightMode: () => void;
  onToggleCinemaMode?: () => void;
  onToggleFullscreen?: () => void;
  onToggleMute?: () => void;
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
  onToggleNightMode,
  onToggleCinemaMode,
  onToggleFullscreen,
  onToggleMute,
  onExitStandBy,
}) => {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const currentTrack = playerState.currentTrack;

  const isPlaying = playerState.status === 'playing';

  // Scrubber percentage calculation
  const progressPercent =
    playerState.duration > 0
      ? Math.min(100, Math.max(0, (playerState.currentTime / playerState.duration) * 100))
      : 0;

  // Handle scrubber drag or tap
  const handleScrub = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || playerState.duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    const targetSeconds = ratio * playerState.duration;
    onSeek(targetSeconds);
  };

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
      <div className="w-full h-[100dvh] flex flex-col items-center justify-center text-center p-6 select-none bg-black/80">
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

  // ==========================================
  // CINEMA / MOVIE VIDEO FULLSCREEN MODE
  // ==========================================
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
            <button
              onClick={() => window.location.replace(`/?v=${Date.now()}`)}
              className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all active:scale-95 border border-white/10 shrink-0"
              title="App Version - Tap to refresh"
            >
              v1.0.4
            </button>
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

        {/* Center: Synced Lyrics if open */}
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
          className={`w-full max-w-2xl mx-auto bg-black/65 backdrop-blur-2xl rounded-3xl border border-white/15 p-5 shadow-2xl space-y-4 transition-opacity duration-500 pointer-events-auto ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Apple Style Scrubber */}
          <div className="w-full">
            <div
              ref={scrubberRef}
              onClick={handleScrub}
              className="w-full h-2 bg-white/20 rounded-full cursor-pointer relative overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-[width] duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs font-mono text-white/50 pt-1.5 px-0.5">
              <span>{formatTime(playerState.currentTime)}</span>
              <span>{formatRemainingTime(playerState.currentTime, playerState.duration)}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsLyricsOpen((prev) => !prev)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white active:scale-95 transition-all"
              >
                Lyrics
              </button>
              {onToggleCinemaMode && (
                <button
                  onClick={onToggleCinemaMode}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-400 text-black active:scale-95 transition-all"
                >
                  Cover Art
                </button>
              )}
            </div>

            <div className="flex items-center space-x-8">
              <button onClick={onPrev} className="p-1 hover:scale-105 active:scale-90 transition-transform">
                <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                  <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                </svg>
              </button>

              <button onClick={onTogglePlay} className="p-1 hover:scale-105 active:scale-90 transition-transform">
                {isPlaying ? (
                  <svg className="w-9 h-9 fill-white" viewBox="0 0 24 24">
                    <rect x="6" y="5" width="4" height="14" rx="1.5" />
                    <rect x="14" y="5" width="4" height="14" rx="1.5" />
                  </svg>
                ) : (
                  <svg className="w-9 h-9 fill-white translate-x-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button onClick={onNext} className="p-1 hover:scale-105 active:scale-90 transition-transform">
                <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                  <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleNightMode}
                className={`p-2 rounded-full transition-all active:scale-95 ${
                  isNightMode ? 'bg-red-600 text-black' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Night Mode"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.3 19.98 10.61 20.35 12 20.35c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7 0-1.8.69-3.44 1.82-4.69.28-.31.39-.73.29-1.13-.1-.4-.38-.72-.77-.84C4.69 4.84 4 6.34 4 8c0 4.41 3.59 8 8 8 1.66 0 3.16-.69 4.24-1.8.28-.29.41-.69.34-1.09-.07-.4-.33-.74-.71-.89C14.77 11.55 13.43 11 12 11c-1.66 0-3 1.34-3 3 0 .55-.45 1-1 1s-1-.45-1-1c0-2.76 2.24-5 5-5 1.79 0 3.37.95 4.25 2.38C17.63 8.35 15.01 6.5 12 6.5c-3.04 0-5.5 2.46-5.5 5.5 0 3.04 2.46 5.5 5.5 5.5 1.54 0 2.93-.63 3.93-1.65.38-.38 1.01-.39 1.4-.01.4.38.4 1.01.02 1.4C15.89 18.37 14.05 19 12 19z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // AUTHENTIC APPLE STANDBY FULLSCREEN DISPLAY
  // Edge-to-edge frosted glass with safe area padding clearing the Dynamic Island
  // ==========================================
  return (
    <div
      className={`relative w-full h-[100dvh] overflow-hidden select-none animate-fadeIn transition-colors duration-700 ${
        isNightMode
          ? 'bg-red-950/80 shadow-[inset_0_0_100px_rgba(255,0,0,0.3)]'
          : 'bg-[#5c5d5d]/75 dark:bg-[#2c2d2e]/80 backdrop-blur-3xl'
      } ${
        isLandscape
          ? 'flex flex-row items-center justify-between pl-[max(5rem,env(safe-area-inset-left,76px))] pr-[max(4.5rem,env(safe-area-inset-right,68px))] py-[max(1.5rem,env(safe-area-inset-top,24px))] pb-[max(1.5rem,env(safe-area-inset-bottom,24px))]'
          : 'flex flex-col items-center justify-between p-6 pt-[max(2.5rem,env(safe-area-inset-top,40px))] pb-[max(2.5rem,env(safe-area-inset-bottom,40px))]'
      }`}
    >
      {/* Left Column: Big Aspect-Square Album Artwork */}
      <div
        className={`${
          isLandscape ? 'h-full max-h-[370px] aspect-square' : 'w-full max-w-[300px] aspect-square'
        } flex items-center justify-center shrink-0`}
      >
        <AlbumArt
          thumbnailUrl={currentTrack.thumbnail}
          title={currentTrack.title}
          isPlaying={isPlaying}
          isNightMode={isNightMode}
          isLandscape={isLandscape}
        />
      </div>

      {/* Right Column: Apple StandBy Player Controls or Synced Lyrics */}
      <div
        className={`${
          isLandscape ? 'flex-1 h-full max-h-[370px] pl-6 sm:pl-10 pr-1' : 'w-full max-w-md pt-4'
        } flex flex-col justify-between`}
      >
        {isLyricsOpen ? (
          <SyncedLyrics
            lyrics={lyrics}
            currentTime={playerState.currentTime}
            isLoading={isLyricsLoading}
            onSeek={onSeek}
            onClose={() => setIsLyricsOpen(false)}
            isNightMode={isNightMode}
          />
        ) : (
          <>
            {/* Top Row: Equalizer status, Volume, AirPlay/Fullscreen, Lyrics, Cinema, Night, Close */}
            <div
              className={`flex items-center justify-end space-x-3.5 text-white/70 ${
                isNightMode ? 'text-red-400' : ''
              }`}
            >
              {isPlaying && (
                <div className="mr-auto">
                  <EqualizerBars isPlaying={true} isNightMode={isNightMode} />
                </div>
              )}
              {/* Speaker Volume / Mute */}
              {onToggleMute && (
                <button
                  onClick={onToggleMute}
                  className="p-1 hover:text-white transition-opacity active:scale-95"
                  title={playerState.isMuted ? 'Unmute' : 'Mute'}
                >
                  {playerState.isMuted ? (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  )}
                </button>
              )}

              {/* AirPlay / Fullscreen */}
              {onToggleFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  className="p-1 hover:text-white transition-opacity active:scale-95"
                  title={isFullscreen ? 'Exit Full Screen' : 'AirPlay / Full Screen'}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 4c-4.42 0-8 3.58-8 8 0 2.22.9 4.23 2.35 5.67l1.42-1.42C6.67 15.15 6 13.66 6 12c0-3.31 2.69-6 6-6s6 2.69 6 6c0 1.66-.67 3.15-1.77 4.25l1.42 1.42C19.1 16.23 20 14.22 20 12c0-4.42-3.58-8-8-8zm0 4c-2.21 0-4 1.79-4 4 0 1.11.45 2.11 1.18 2.83l1.41-1.41C10.23 13.06 10 12.56 10 12c0-1.1.9-2 2-2s2 .9 2 2c0 .56-.23 1.06-.59 1.42l1.41 1.41C15.55 14.11 16 13.11 16 12c0-2.21-1.79-4-4-4zm0 8l-5 5h10l-5-5z" />
                  </svg>
                </button>
              )}

              {/* Synced Lyrics Toggle */}
              <button
                onClick={() => setIsLyricsOpen(true)}
                className="p-1 hover:text-white transition-opacity active:scale-95"
                title="Synced Lyrics"
              >
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>

              {/* Cinema Mode Toggle */}
              {onToggleCinemaMode && (
                <button
                  onClick={onToggleCinemaMode}
                  className="p-1 hover:text-amber-300 transition-opacity active:scale-95"
                  title="Cinema Video Mode"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                  </svg>
                </button>
              )}

              {/* Bedside Night Mode */}
              <button
                onClick={onToggleNightMode}
                className={`p-1 transition-opacity active:scale-95 ${
                  isNightMode ? 'text-red-500' : 'hover:text-white'
                }`}
                title="Bedside Night Mode"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.3 19.98 10.61 20.35 12 20.35c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7 0-1.8.69-3.44 1.82-4.69.28-.31.39-.73.29-1.13-.1-.4-.38-.72-.77-.84C4.69 4.84 4 6.34 4 8c0 4.41 3.59 8 8 8 1.66 0 3.16-.69 4.24-1.8.28-.29.41-.69.34-1.09-.07-.4-.33-.74-.71-.89C14.77 11.55 13.43 11 12 11c-1.66 0-3 1.34-3 3 0 .55-.45 1-1 1s-1-.45-1-1c0-2.76 2.24-5 5-5 1.79 0 3.37.95 4.25 2.38C17.63 8.35 15.01 6.5 12 6.5c-3.04 0-5.5 2.46-5.5 5.5 0 3.04 2.46 5.5 5.5 5.5 1.54 0 2.93-.63 3.93-1.65.38-.38 1.01-.39 1.4-.01.4.38.4 1.01.02 1.4C15.89 18.37 14.05 19 12 19z" />
                </svg>
              </button>

              {/* App Version badge */}
              <button
                onClick={() => window.location.replace(`/?v=${Date.now()}`)}
                className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all active:scale-95 border border-white/10"
                title="App Version - Tap to refresh"
              >
                v1.0.4
              </button>

              {/* Close StandBy */}
              <button
                onClick={onExitStandBy}
                className="p-1 hover:text-white transition-opacity active:scale-95"
                title="Close StandBy"
              >
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Center Content: Song Title, Artist, and Solid Apple Controls */}
            <div className="my-auto flex flex-col items-center justify-center text-center w-full px-2">
              <h1
                className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight truncate max-w-full leading-tight ${
                  isNightMode ? 'text-red-500' : 'text-white'
                }`}
              >
                {currentTrack.title}
              </h1>
              <p
                className={`text-base sm:text-lg font-medium truncate max-w-full leading-tight mt-1.5 ${
                  isNightMode ? 'text-red-400/80' : 'text-white/60'
                }`}
              >
                {currentTrack.artist}
              </p>

              {/* Solid Apple Transport Controls (Matching Image 2) */}
              <div className="flex items-center justify-center space-x-10 sm:space-x-14 pt-4 sm:pt-6">
                {/* Previous / Rewind (Solid ◀◀) */}
                <button
                  onClick={onPrev}
                  className={`p-1 transition-transform active:scale-90 hover:scale-105 ${
                    isNightMode ? 'text-red-500' : 'text-white'
                  }`}
                  title="Previous Track"
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 fill-current" viewBox="0 0 24 24">
                    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
                  </svg>
                </button>

                {/* Play / Pause (Solid ❚❚ or ▶, NO circle border) */}
                <button
                  onClick={onTogglePlay}
                  className={`p-1 transition-all active:scale-90 hover:scale-105 ${
                    isNightMode
                      ? 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  }`}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 fill-current" viewBox="0 0 24 24">
                      <rect x="6" y="5" width="4" height="14" rx="1.5" />
                      <rect x="14" y="5" width="4" height="14" rx="1.5" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 fill-current translate-x-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Next / Fast-Forward (Solid ▶▶) */}
                <button
                  onClick={onNext}
                  className={`p-1 transition-transform active:scale-90 hover:scale-105 ${
                    isNightMode ? 'text-red-500' : 'text-white'
                  }`}
                  title="Next Track"
                >
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 fill-current" viewBox="0 0 24 24">
                    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bottom Scrubber & Timestamps (Matching Image 2) */}
            <div className="w-full pt-2">
              <div
                ref={scrubberRef}
                onClick={handleScrub}
                className={`w-full h-2 sm:h-2.5 rounded-full cursor-pointer relative overflow-hidden ${
                  isNightMode ? 'bg-red-950/60' : 'bg-white/25'
                }`}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-150 ${
                    isNightMode ? 'bg-red-500' : 'bg-white'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div
                className={`flex justify-between items-center text-xs sm:text-sm font-medium font-mono tabular-nums pt-1.5 px-0.5 ${
                  isNightMode ? 'text-red-400/70' : 'text-white/50'
                }`}
              >
                <span>{formatTime(playerState.currentTime)}</span>
                <span>{formatRemainingTime(playerState.currentTime, playerState.duration)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
