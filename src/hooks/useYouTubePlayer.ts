'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Track, PlayerState, PlaybackStatus } from '../types/music';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

export function useYouTubePlayer(initialTracks: Track[] = [], isCinemaMode: boolean = false) {
  const [state, setState] = useState<PlayerState>(() => ({
    currentTrack: initialTracks[0] || null,
    queue: initialTracks.slice(1),
    history: [],
    status: 'unstarted',
    currentTime: 0,
    duration: initialTracks[0]?.duration || 0,
    volume: 80,
    isMuted: false,
    isShuffle: false,
    isRepeat: false,
  }));

  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerRef = useRef<any>(null); // YouTube Iframe API instance
  const isCinemaModeRef = useRef<boolean>(isCinemaMode);
  isCinemaModeRef.current = isCinemaMode;

  // Initialize native HTML5 audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 0.8;
      audioRef.current = audio;

      // Request playback audio session category on iOS Safari (16.4+)
      if ('audioSession' in navigator) {
        try {
          (navigator as any).audioSession.type = 'playback';
        } catch {
          // ignore
        }
      }
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (!isCinemaModeRef.current && audio.duration) {
        setState((prev) => ({
          ...prev,
          currentTime: audio.currentTime,
          duration: audio.duration || prev.duration,
        }));
      }
    };

    const handlePlay = () => {
      if (!isCinemaModeRef.current) {
        setState((prev) => ({ ...prev, status: 'playing' }));
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      }
    };

    const handlePause = () => {
      if (!isCinemaModeRef.current) {
        setState((prev) => ({ ...prev, status: 'paused' }));
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      }
    };

    const handleEnded = () => {
      if (!isCinemaModeRef.current) {
        nextTrack();
      }
    };

    const handleError = (e: any) => {
      console.warn('Native audio stream error, falling back to YouTube iframe player:', e);
      setUseIframeFallback(true);
      if (state.currentTrack && playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(state.currentTrack.id);
        playerRef.current.playVideo();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Load YouTube Iframe API script once for Cinema Mode / fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Load user saved quick picks on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('standby_user_quick_picks');
      if (saved) {
        const parsed: Track[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setState((prev) => {
            if (prev.status === 'unstarted') {
              return {
                ...prev,
                currentTrack: parsed[0],
                queue: parsed.slice(1),
                duration: parsed[0].duration || 0,
              };
            }
            return prev;
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Update MediaSession metadata and handlers whenever track or status changes
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !state.currentTrack) return;

    const track = state.currentTrack;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: 'Apple StandBy Music',
        artwork: [
          { src: track.thumbnail, sizes: '512x512', type: 'image/jpeg' },
          { src: track.thumbnail, sizes: '192x192', type: 'image/jpeg' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlay();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          seekTo(details.seekTime);
        }
      });
    } catch (e) {
      // ignore
    }
  }, [state.currentTrack]);

  // YouTube Iframe callbacks
  const onPlayerReady = useCallback(
    (event: any) => {
      playerRef.current = event.target;
      playerRef.current.setVolume(state.volume);
      if (state.currentTrack && isCinemaMode) {
        playerRef.current.cueVideoById(state.currentTrack.id);
      }
    },
    [state.volume, state.currentTrack, isCinemaMode]
  );

  const onPlayerStateChange = useCallback(
    (event: any) => {
      if (!isCinemaMode && !useIframeFallback) return;

      const code = event.data;
      let status: PlaybackStatus = 'unstarted';
      if (code === 1) status = 'playing';
      else if (code === 2) status = 'paused';
      else if (code === 3) status = 'buffering';
      else if (code === 0) {
        status = 'ended';
        nextTrack();
      }

      setState((prev) => ({ ...prev, status }));
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = status === 'playing' ? 'playing' : 'paused';
      }
    },
    [isCinemaMode, useIframeFallback]
  );

  const onPlayerError = useCallback((event: any) => {
    console.warn('YouTube Player error code:', event.data);
    if (event.data === 101 || event.data === 150) {
      nextTrack();
    }
  }, []);

  // Play a specific track
  const playTrack = useCallback(
    (track: Track) => {
      setState((prev) => {
        const newHistory = prev.currentTrack ? [prev.currentTrack, ...prev.history] : prev.history;
        return {
          ...prev,
          currentTrack: track,
          history: newHistory,
          currentTime: 0,
          duration: track.duration || 0,
          status: 'playing',
        };
      });

      setUseIframeFallback(false);

      if (isCinemaModeRef.current) {
        if (playerRef.current && playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById(track.id);
          playerRef.current.playVideo();
        }
      } else {
        const audio = audioRef.current;
        if (audio) {
          audio.src = `/api/stream?v=${track.id}`;
          audio.play().catch((err) => {
            console.warn('Native audio play error, falling back to YouTube iframe:', err);
            setUseIframeFallback(true);
            if (playerRef.current && playerRef.current.loadVideoById) {
              playerRef.current.loadVideoById(track.id);
              playerRef.current.playVideo();
            }
          });
        }
      }
    },
    []
  );

  const nextTrack = useCallback(() => {
    setState((prev) => {
      if (prev.isRepeat && prev.currentTrack) {
        seekTo(0);
        return prev;
      }
      if (prev.queue.length === 0) {
        return { ...prev, status: 'ended', currentTime: prev.duration };
      }

      let nextIndex = 0;
      if (prev.isShuffle) {
        nextIndex = Math.floor(Math.random() * prev.queue.length);
      }
      const next = prev.queue[nextIndex];
      const remainingQueue = prev.queue.filter((_, i) => i !== nextIndex);
      const newHistory = prev.currentTrack ? [prev.currentTrack, ...prev.history] : prev.history;

      // Play next track
      setTimeout(() => playTrack(next), 0);

      return {
        ...prev,
        currentTrack: next,
        queue: remainingQueue,
        history: newHistory,
        currentTime: 0,
        duration: next.duration || 0,
        status: 'playing',
      };
    });
  }, [playTrack]);

  const prevTrack = useCallback(() => {
    if (state.currentTime > 4) {
      seekTo(0);
      return;
    }
    setState((prev) => {
      if (prev.history.length === 0) return prev;
      const [lastTrack, ...restHistory] = prev.history;
      const newQueue = prev.currentTrack ? [prev.currentTrack, ...prev.queue] : prev.queue;

      setTimeout(() => playTrack(lastTrack), 0);

      return {
        ...prev,
        currentTrack: lastTrack,
        history: restHistory,
        queue: newQueue,
        currentTime: 0,
        duration: lastTrack.duration || 0,
        status: 'playing',
      };
    });
  }, [playTrack, state.currentTime]);

  const playPlaylist = useCallback(
    (tracks: Track[], startIndex: number = 0) => {
      if (!tracks || tracks.length === 0) return;
      const clampedIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
      const targetTrack = tracks[clampedIndex];
      const newQueue = tracks.slice(clampedIndex + 1);

      setState((prev) => {
        const newHistory = prev.currentTrack ? [prev.currentTrack, ...prev.history] : prev.history;
        return {
          ...prev,
          currentTrack: targetTrack,
          queue: newQueue,
          history: newHistory,
          currentTime: 0,
          duration: targetTrack.duration || 0,
          status: 'playing',
        };
      });

      playTrack(targetTrack);
    },
    [playTrack]
  );

  const addToQueue = useCallback((track: Track) => {
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, track],
    }));
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((_, i) => i !== index),
    }));
  }, []);

  const togglePlay = useCallback(() => {
    const isCurrentlyPlaying = state.status === 'playing';

    if (isCinemaModeRef.current || useIframeFallback) {
      if (playerRef.current) {
        if (isCurrentlyPlaying) playerRef.current.pauseVideo();
        else playerRef.current.playVideo();
      }
    } else {
      const audio = audioRef.current;
      if (audio) {
        if (isCurrentlyPlaying) {
          audio.pause();
        } else {
          if (!audio.src && state.currentTrack) {
            audio.src = `/api/stream?v=${state.currentTrack.id}`;
          }
          audio.play().catch((err) => {
            console.warn('Audio play error:', err);
          });
        }
      }
    }
  }, [state.status, state.currentTrack, useIframeFallback]);

  const seekTo = useCallback(
    (seconds: number) => {
      setState((prev) => ({ ...prev, currentTime: seconds }));
      if (isCinemaModeRef.current || useIframeFallback) {
        if (playerRef.current && playerRef.current.seekTo) {
          playerRef.current.seekTo(seconds, true);
        }
      } else {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = seconds;
        }
      }
    },
    [useIframeFallback]
  );

  const setVolume = useCallback((val: number) => {
    setState((prev) => ({ ...prev, volume: val, isMuted: val === 0 }));
    if (audioRef.current) {
      audioRef.current.volume = val / 100;
    }
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(val);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => {
      const nextMuted = !prev.isMuted;
      if (audioRef.current) {
        audioRef.current.muted = nextMuted;
      }
      if (playerRef.current) {
        if (nextMuted) playerRef.current.mute();
        else playerRef.current.unMute();
      }
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((prev) => ({ ...prev, isRepeat: !prev.isRepeat }));
  }, []);

  // Sync mode changes (transition between Cinema Mode and StandBy Audio Mode)
  useEffect(() => {
    const audio = audioRef.current;
    if (isCinemaMode) {
      // Entering cinema mode: pause native audio and hand over to YouTube video
      if (audio && !audio.paused) {
        const currentTime = audio.currentTime;
        audio.pause();
        if (playerRef.current && playerRef.current.seekTo && playerRef.current.playVideo) {
          playerRef.current.seekTo(currentTime, true);
          playerRef.current.playVideo();
        }
      }
    } else {
      // Exiting cinema mode: pause YouTube video and hand over to native audio
      if (playerRef.current && playerRef.current.getPlayerState && playerRef.current.getPlayerState() === 1) {
        const currentTime = playerRef.current.getCurrentTime() || 0;
        playerRef.current.pauseVideo();
        if (audio && state.currentTrack) {
          audio.src = `/api/stream?v=${state.currentTrack.id}`;
          audio.currentTime = currentTime;
          audio.play().catch(() => {});
        }
      }
    }
  }, [isCinemaMode, state.currentTrack]);

  // Track time in YouTube mode
  useEffect(() => {
    if ((isCinemaMode || useIframeFallback) && state.status === 'playing') {
      const timer = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const time = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || state.currentTrack?.duration || 0;
          setState((prev) => ({ ...prev, currentTime: time, duration: dur }));
        }
      }, 250);
      return () => clearInterval(timer);
    }
  }, [isCinemaMode, useIframeFallback, state.status, state.currentTrack]);

  return {
    state,
    playTrack,
    playPlaylist,
    addToQueue,
    removeFromQueue,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    onPlayerReady,
    onPlayerStateChange,
    onPlayerError,
    useIframeFallback,
  };
}
