export interface Track {
  id: string; // YouTube Video ID
  title: string;
  artist: string;
  album?: string;
  thumbnail: string;
  duration: number; // in seconds
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  creator: string;
  coverUrl: string;
  tracks: Track[];
  category?: 'hits' | 'relax' | 'workout' | 'focus' | 'commute' | 'party' | 'all';
  isUserCreated?: boolean;
}

export interface LyricsLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsData {
  synced: boolean;
  lines: LyricsLine[];
  rawText?: string;
}

export type PlaybackStatus = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';

export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  history: Track[];
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
}
