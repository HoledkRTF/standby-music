'use client';

import React, { useState, useEffect } from 'react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useOrientation } from '@/hooks/useOrientation';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useDominantColor } from '@/hooks/useDominantColor';
import { useLyrics } from '@/hooks/useLyrics';
import { AmbientBackground } from '@/components/ambient/AmbientBackground';
import { HiddenPlayer } from '@/components/standby/HiddenPlayer';
import { PortraitView } from '@/components/mobile/PortraitView';
import { StandByView } from '@/components/standby/StandByView';
import { CURATED_PRESETS } from '@/components/mobile/PresetPills';

export default function StandByMusicPage() {
  const {
    state: playerState,
    playTrack,
    addToQueue,
    removeFromQueue,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    onPlayerReady,
    onPlayerStateChange,
    onPlayerError,
  } = useYouTubePlayer(CURATED_PRESETS);

  const { isLandscape } = useOrientation();
  const [manualStandBy, setManualStandBy] = useState<boolean>(false);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);

  // Active StandBy mode if orientation is landscape OR manual trigger
  const isStandByActive = isLandscape || manualStandBy;

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

  const handleEnterStandBy = async () => {
    setManualStandBy(true);
    // Request native full screen if supported
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        // Fullscreen request might be blocked on iOS Safari; layout already handles 100dvh
      }
    }
  };

  const handleExitStandBy = async () => {
    setManualStandBy(false);
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (err) {}
    }
  };

  // Listen for Escape key to exit manual StandBy
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && manualStandBy) {
        handleExitStandBy();
      } else if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [manualStandBy, togglePlay]);

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden select-none">
      {/* Dynamic Ambient Fluid Mesh Glow */}
      <AmbientBackground palette={palette} isNightMode={isNightMode} />

      {/* Hidden YouTube IFrame Audio Engine */}
      <HiddenPlayer
        videoId={playerState.currentTrack?.id}
        onReady={onPlayerReady}
        onStateChange={onPlayerStateChange}
        onError={onPlayerError}
      />

      {/* Viewport View: Portrait Library vs Landscape StandBy */}
      {isStandByActive ? (
        <StandByView
          playerState={playerState}
          lyrics={lyrics}
          isLyricsLoading={isLyricsLoading}
          isNightMode={isNightMode}
          onTogglePlay={togglePlay}
          onNext={nextTrack}
          onPrev={prevTrack}
          onSeek={seekTo}
          onToggleShuffle={toggleShuffle}
          onToggleRepeat={toggleRepeat}
          onToggleNightMode={() => setIsNightMode((prev) => !prev)}
          onExitStandBy={handleExitStandBy}
        />
      ) : (
        <PortraitView
          playerState={playerState}
          onSelectTrack={playTrack}
          onAddToQueue={addToQueue}
          onRemoveFromQueue={removeFromQueue}
          onTogglePlay={togglePlay}
          onEnterStandBy={handleEnterStandBy}
        />
      )}
    </main>
  );
}
