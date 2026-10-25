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
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    // Detect iOS devices (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent || '';
    const isIOS =
      /iPhone|iPad|iPod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    // On iOS Safari, registering MediaSession metadata (artwork, title) with an active YouTube iframe
    // causes iOS to render an intrusive duplicate album art pill inside the Dynamic Island on screen,
    // while providing ZERO background playback (iOS WebKit forcefully freezes YouTube iframes on screen lock).
    // Disabling mediaSession on iOS keeps the Dynamic Island completely dark and clean in StandBy mode.
    if (isIOS) {
      try {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      } catch {
        // ignore
      }
      return;
    }

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

    // Set desktop media key action handlers (play/pause, next, prev, seek)
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

  // Sync position state on supported desktop platforms
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('mediaSession' in navigator) ||
      !('setPositionState' in navigator.mediaSession)
    ) {
      return;
    }

    const isIOS =
      /iPhone|iPad|iPod/.test(window.navigator.userAgent || '') ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

    if (isIOS) return;

    if (duration > 0 && currentTime <= duration) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: isPlaying ? 1 : 0,
          position: Math.min(currentTime, duration),
        });
      } catch {
        // ignore
      }
    }
  }, [currentTime, duration, isPlaying]);
}
