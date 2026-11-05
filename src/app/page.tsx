'use client';

import React, { useState, useEffect } from 'react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useOrientation } from '@/hooks/useOrientation';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useDominantColor } from '@/hooks/useDominantColor';
import { useLyrics } from '@/hooks/useLyrics';
import { useFullscreen } from '@/hooks/useFullscreen';
import { usePwaUpdate } from '@/hooks/usePwaUpdate';
import { AmbientBackground } from '@/components/ambient/AmbientBackground';
import { HiddenPlayer } from '@/components/standby/HiddenPlayer';
import { YouTubeMusicView } from '@/components/ytmusic/YouTubeMusicView';
import { StandByView } from '@/components/standby/StandByView';
import { CURATED_TRACKS } from '@/data/musicData';

export default function StandByMusicPage() {
  const [manualStandBy, setManualStandBy] = useState<boolean>(false);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);

  // Auto-refresh hook to ensure iOS Home Screen WebClip updates immediately
  usePwaUpdate();

  const {
    state: playerState,
    playTrack,
    playPlaylist,
    addToQueue,
    removeFromQueue,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleMute,
    onPlayerReady,
    onPlayerStateChange,
    onPlayerError,
  } = useYouTubePlayer(CURATED_TRACKS);

  const { isLandscape } = useOrientation();

  // Fullscreen hook for platforms that support it
  const {
    isFullscreen,
    toggleFullscreen,
  } = useFullscreen();

  const [isStandByDismissed, setIsStandByDismissed] = useState<boolean>(false);

  // Active StandBy mode if orientation is landscape OR manual trigger OR cinema mode, unless dismissed
  const isStandByActive = !isStandByDismissed && (isLandscape || manualStandBy || isCinemaMode);

  // Reset dismissal when orientation physically changes
  useEffect(() => {
    setIsStandByDismissed(false);
  }, [isLandscape]);

  // Suppress OS-level media session metadata to prevent Dynamic Island and lock screen hijacking
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }
  }, [playerState.currentTrack]);

  // Screen wake lock during active playback
  const isPlaying = playerState.status === 'playing';
  useWakeLock(isPlaying && isStandByActive);

  // Ambient dominant color from current thumbnail
  const palette = useDominantColor(playerState.currentTrack?.thumbnail);

  // Real-time lyrics
  const { lyrics, isLoading: isLyricsLoading } = useLyrics(
    playerState.currentTrack?.title,
    playerState.currentTrack?.artist
  );

  const handleEnterStandBy = () => {
    setIsStandByDismissed(false);
    setManualStandBy(true);
  };

  const handleEnterCinemaMode = () => {
    setIsStandByDismissed(false);
    setIsCinemaMode(true);
    setManualStandBy(true);
  };

  const handleExitStandBy = async () => {
    setIsStandByDismissed(true);
    setManualStandBy(false);
    setIsCinemaMode(false);
    if (isFullscreen) {
      await toggleFullscreen();
    }
  };

  // Listen for Escape key to exit manual StandBy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStandByActive) {
        handleExitStandBy();
      } else if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStandByActive, togglePlay]);

  return (
    <main className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-black">
      {/* Dynamic Ambient Fluid Mesh Glow (visible behind album art & letterboxed cinema) */}
      <AmbientBackground palette={palette} isNightMode={isNightMode} />

      {/* YouTube Video / Audio Engine (visible in-viewport to suppress Dynamic Island) */}
      <HiddenPlayer
        videoId={playerState.currentTrack?.id}
        thumbnailUrl={playerState.currentTrack?.thumbnail}
        isCinemaMode={isCinemaMode}
        isStandByActive={isStandByActive}
        isLandscape={isLandscape}
        onReady={onPlayerReady}
        onStateChange={onPlayerStateChange}
        onError={onPlayerError}
        onScreenTap={handleEnterCinemaMode}
      />

      {/* Viewport View: Portrait Library vs Landscape StandBy / Movie Cinema */}
      {isStandByActive ? (
        <StandByView
          playerState={playerState}
          lyrics={lyrics}
          isLyricsLoading={isLyricsLoading}
          isNightMode={isNightMode}
          isCinemaMode={isCinemaMode}
          isFullscreen={isFullscreen}
          isLandscape={isLandscape}
          onTogglePlay={togglePlay}
          onNext={nextTrack}
          onPrev={prevTrack}
          onSeek={seekTo}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
          onToggleNightMode={() => setIsNightMode((prev) => !prev)}
          onToggleCinemaMode={() => setIsCinemaMode((prev) => !prev)}
          onToggleFullscreen={toggleFullscreen}
          onToggleMute={toggleMute}
          onExitStandBy={handleExitStandBy}
        />
      ) : (
        <YouTubeMusicView
          playerState={playerState}
          isFullscreen={isFullscreen}
          onSelectTrack={playTrack}
          onPlayTrack={playTrack}
          onPlayPlaylist={playPlaylist}
          onAddToQueue={addToQueue}
          onRemoveFromQueue={removeFromQueue}
          onTogglePlay={togglePlay}
          onNextTrack={nextTrack}
          onNext={nextTrack}
          onPrev={prevTrack}
          onSeek={seekTo}
          onEnterStandBy={handleEnterStandBy}
          onEnterCinemaMode={handleEnterCinemaMode}
          onToggleFullscreen={toggleFullscreen}
        />
      )}
    </main>
  );
}
