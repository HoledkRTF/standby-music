'use client';

import { useEffect, useRef } from 'react';
import { Track } from '../types/music';

// Ultra-short 1-second silent stereo WAV data URI (uncompressed 44.1kHz 16-bit silence)
const SILENT_WAV_BASE64 =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/';

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
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and manage the silent keep-alive audio element for iOS Safari background playback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!silentAudioRef.current) {
      const audio = new Audio(SILENT_WAV_BASE64);
      audio.loop = true;
      audio.preload = 'auto';
      // iOS WebKit playsInline flag
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      silentAudioRef.current = audio;
    }

    const audio = silentAudioRef.current;

    if (isPlaying) {
      audio.play().catch(() => {
        // User gesture may be required on initial page load
      });
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [isPlaying]);

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

    // Set lock screen & headphone action handlers
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

  // Sync position state with iOS lock screen scrubber
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

  // Handle visibility change: automatically resume playback when user returns to app
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        if (silentAudioRef.current && silentAudioRef.current.paused) {
          silentAudioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlaying]);
}
