'use client';

import React, { useState, useEffect } from 'react';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useOrientation } from '@/hooks/useOrientation';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useDominantColor } from '@/hooks/useDominantColor';
import { useLyrics } from '@/hooks/useLyrics';
import { useFullscreen } from '@/hooks/useFullscreen';
import { AmbientBackground } from '@/components/ambient/AmbientBackground';
import { HiddenPlayer } from '@/components/standby/HiddenPlayer';
import { YouTubeMusicView } from '@/components/ytmusic/YouTubeMusicView';
import { StandByView } from '@/components/standby/StandByView';
import { InstallModal } from '@/components/mobile/InstallModal';
import { CURATED_TRACKS } from '@/data/musicData';

export default function StandByMusicPage() {
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
  const [manualStandBy, setManualStandBy] = useState<boolean>(false);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);

  // Fullscreen and PWA hooks
  const {
    isFullscreen,
    isIOS,
    showInstallPrompt,
    setShowInstallPrompt,
    toggleFullscreen,
  } = useFullscreen();

  // Active StandBy mode if orientation is landscape OR manual trigger OR cinema mode
  const isStandByActive = isLandscape || manualStandBy || isCinemaMode;

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
    await toggleFullscreen();
  };

  const handleEnterCinemaMode = async () => {
    setIsCinemaMode(true);
    setManualStandBy(true);
    await toggleFullscreen();
  };

  const handleExitStandBy = async () => {
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
    <main className="relative min-h-[100dvh] w-full overflow-hidden select-none bg-black">
      {/* Dynamic Ambient Fluid Mesh Glow (visible behind album art & letterboxed cinema) */}
      <AmbientBackground palette={palette} isNightMode={isNightMode} />

      {/* YouTube Video / Audio Engine (hidden audio engine or fullscreen cinema video) */}
      <HiddenPlayer
        videoId={playerState.currentTrack?.id}
        isCinemaMode={isCinemaMode}
        onReady={onPlayerReady}
        onStateChange={onPlayerStateChange}
        onError={onPlayerError}
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
          onPlayPlaylist={playPlaylist}
          onAddToQueue={addToQueue}
          onRemoveFromQueue={removeFromQueue}
          onTogglePlay={togglePlay}
          onNextTrack={nextTrack}
          onEnterStandBy={handleEnterStandBy}
          onEnterCinemaMode={handleEnterCinemaMode}
          onToggleFullscreen={toggleFullscreen}
        />
      )}

      {/* iOS / Mobile PWA Fullscreen Install Guide */}
      <InstallModal
        isOpen={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
        isIOS={isIOS}
      />
    </main>
  );
}
