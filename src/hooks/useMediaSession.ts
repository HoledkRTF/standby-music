'use client';

import { useEffect } from 'react';
import { Track } from '../types/music';

interface UseMediaSessionProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
}

export function useMediaSession({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
}: UseMediaSessionProps) {
  // Configure Media Session API metadata & action handlers
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'StandBy Music',
        artwork: [
          {
            src: currentTrack.thumbnail,
            sizes: '96x96',
            type: 'image/jpeg',
          },
          {
            src: currentTrack.thumbnail,
            sizes: '128x128',
            type: 'image/jpeg',
          },
          {
            src: currentTrack.thumbnail,
            sizes: '256x256',
            type: 'image/jpeg',
          },
          {
            src: currentTrack.thumbnail,
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Set lock screen & headphone action handlers where supported
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        onTogglePlay();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        onTogglePlay();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        onPrev();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        onNext();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          onSeek(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        onSeek(Math.max(0, currentTime - offset));
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        onSeek(Math.min(duration || Infinity, currentTime + offset));
      });
    } catch (e) {
      console.warn('MediaSession handler registration notice:', e);
    }
  }, [currentTrack, isPlaying, onTogglePlay, onNext, onPrev, onSeek, currentTime, duration]);

  // Sync position state with system scrubber
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('mediaSession' in navigator) ||
      !('setPositionState' in navigator.mediaSession)
    ) {
      return;
    }

    if (duration > 0 && currentTime <= duration) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: isPlaying ? 1 : 0,
          position: Math.min(currentTime, duration),
        });
      } catch {
        // ignore out of range warnings during track transitions
      }
    }
  }, [currentTime, duration, isPlaying]);
}
