'use client';

import React from 'react';
import { Playlist, Track } from '@/types/music';
import { formatTime } from '@/utils/youtube';

interface PlaylistDetailModalProps {
  playlist: Playlist;
  currentTrackId?: string;
  isPlaying?: boolean;
  onClose: () => void;
  onPlayPlaylist: (tracks: Track[], startIndex?: number) => void;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  playlist,
  currentTrackId,
  isPlaying,
  onClose,
  onPlayPlaylist,
  onPlayTrack,
  onAddToQueue,
}) => {
  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 180), 0);
  const totalMinutes = Math.round(totalDuration / 60);

  return (
    <div className="fixed inset-0 z-40 bg-[#0f0f0f] text-white overflow-y-auto flex flex-col animate-fadeIn select-none">
      {/* Top sticky header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top,16px))] pb-3 bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-all"
          title="Back"
        >
          <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold truncate max-w-[200px] text-white/90">
          {playlist.title}
        </span>
        <div className="w-8" />
      </div>

      <div className="p-5 pb-32 max-w-lg mx-auto w-full space-y-6">
        {/* Playlist Cover & Meta */}
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={playlist.coverUrl}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1.5 px-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              {playlist.title}
            </h1>
            <p className="text-xs sm:text-sm text-white/60 font-medium">
              {playlist.description}
            </p>
            <p className="text-xs text-white/40 pt-1">
              {playlist.creator} • {playlist.tracks.length} songs • {totalMinutes} min
            </p>
          </div>

          {/* Action Buttons: Play All & Shuffle */}
          <div className="flex items-center justify-center space-x-3 pt-2 w-full">
            <button
              onClick={() => onPlayPlaylist(playlist.tracks, 0)}
              className="flex-1 max-w-[160px] flex items-center justify-center space-x-2 py-3 px-5 bg-white text-black font-bold text-sm rounded-full shadow-lg hover:bg-white/90 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Play</span>
            </button>

            <button
              onClick={() => {
                const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
                onPlayPlaylist(shuffled, 0);
              }}
              className="flex-1 max-w-[160px] flex items-center justify-center space-x-2 py-3 px-5 bg-white/10 text-white font-semibold text-sm rounded-full border border-white/15 hover:bg-white/20 active:scale-95 transition-all"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
              </svg>
              <span>Shuffle</span>
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-1 divide-y divide-white/5 pt-2">
          {playlist.tracks.map((track, idx) => {
            const isCurrent = track.id === currentTrackId;

            return (
              <div
                key={`${track.id}-${idx}`}
                className={`flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors group cursor-pointer ${
                  isCurrent ? 'bg-white/10' : ''
                }`}
                onClick={() => onPlayPlaylist(playlist.tracks, idx)}
              >
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  {/* Track Number / Playing wave */}
                  <span className="w-5 text-center text-xs font-semibold text-white/40">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end justify-center space-x-0.5 h-3">
                        <span className="w-0.5 h-3 bg-red-500 animate-pulse" />
                        <span className="w-0.5 h-2 bg-red-500 animate-pulse delay-75" />
                        <span className="w-0.5 h-3 bg-red-500 animate-pulse delay-150" />
                      </div>
                    ) : (
                      idx + 1
                    )}
                  </span>

                  {/* Thumbnail */}
                  <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-red-400 font-bold' : 'text-white'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-white/50 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Right Duration & Action */}
                <div className="flex items-center space-x-2 pl-3">
                  <span className="text-xs font-mono text-white/40">
                    {formatTime(track.duration)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToQueue(track);
                    }}
                    className="p-1.5 text-white/40 hover:text-white rounded-full hover:bg-white/10 active:scale-90 transition-all"
                    title="Add to queue"
                  >
                    <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
