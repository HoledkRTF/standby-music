'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Track, PlayerState, PlaybackStatus } from '../types/music';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT: any;
  }
}

export function useYouTubePlayer(initialTracks: Track[] = []) {
  const [state, setState] = useState<PlayerState>(() => {
    return {
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
    };
  });

  const playerRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const onPlayerReady = useCallback((event: any) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(state.volume);
    if (state.currentTrack) {
      playerRef.current.cueVideoById(state.currentTrack.id);
    }
  }, [state.volume, state.currentTrack]);

  const nextTrack = useCallback(() => {
    setState((prev) => {
      if (prev.isRepeat && prev.currentTrack) {
        if (playerRef.current && playerRef.current.seekTo) {
          playerRef.current.seekTo(0);
          playerRef.current.playVideo();
        }
        return { ...prev, currentTime: 0 };
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

      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(next.id);
        playerRef.current.playVideo();
      }

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
  }, []);

  const onPlayerStateChange = useCallback((event: any) => {
    const code = event.data;
    // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    let status: PlaybackStatus = 'unstarted';
    if (code === 1) status = 'playing';
    else if (code === 2) status = 'paused';
    else if (code === 3) status = 'buffering';
    else if (code === 0) {
      status = 'ended';
      nextTrack();
    }

    setState((prev) => ({ ...prev, status }));
  }, [nextTrack]);

  const onPlayerError = useCallback((event: any) => {
    console.warn('YouTube Player error code:', event.data);
    // If video is restricted or cannot be embedded, auto-skip
    if (event.data === 101 || event.data === 150) {
      nextTrack();
    }
  }, [nextTrack]);

  const playTrack = useCallback((track: Track) => {
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

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(track.id);
      playerRef.current.playVideo();
    }
  }, []);

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
    if (!playerRef.current) return;
    if (state.status === 'playing') {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [state.status]);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true);
      setState((prev) => ({ ...prev, currentTime: seconds }));
    }
  }, []);

  const prevTrack = useCallback(() => {
    if (state.currentTime > 4) {
      seekTo(0);
      return;
    }
    setState((prev) => {
      if (prev.history.length === 0) return prev;
      const [lastTrack, ...restHistory] = prev.history;
      const newQueue = prev.currentTrack ? [prev.currentTrack, ...prev.queue] : prev.queue;

      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(lastTrack.id);
        playerRef.current.playVideo();
      }

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
  }, [seekTo, state.currentTime]);

  const setVolume = useCallback((val: number) => {
    if (playerRef.current) {
      playerRef.current.setVolume(val);
      setState((prev) => ({ ...prev, volume: val, isMuted: val === 0 }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      if (state.isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(state.volume || 50);
        setState((prev) => ({ ...prev, isMuted: false }));
      } else {
        playerRef.current.mute();
        setState((prev) => ({ ...prev, isMuted: true }));
      }
    }
  }, [state.isMuted, state.volume]);

  const toggleShuffle = useCallback(() => {
    setState((prev) => ({ ...prev, isShuffle: !prev.isShuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((prev) => ({ ...prev, isRepeat: !prev.isRepeat }));
  }, []);

  // Time tracking interval
  useEffect(() => {
    if (state.status === 'playing') {
      timerRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const time = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || state.currentTrack?.duration || 0;
          setState((prev) => ({ ...prev, currentTime: time, duration: dur }));
        }
      }, 250);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.status, state.currentTrack]);

  return {
    state,
    playTrack,
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
  };
}
