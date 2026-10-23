'use client';

import React from 'react';
import { Track } from '../../types/music';

interface QueueListProps {
  queue: Track[];
  onSelectTrack: (track: Track) => void;
  onRemoveTrack: (index: number) => void;
}

export const QueueList: React.FC<QueueListProps> = ({ queue, onSelectTrack, onRemoveTrack }) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Up Next ({queue.length})
        </h3>
      </div>

      {queue.length === 0 ? (
        <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/5">
          <p className="text-sm font-medium text-white/40">Queue is empty</p>
          <p className="text-xs text-white/25 mt-0.5">Select a song or preset to start playing</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              className="group flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
            >
              <div
                onClick={() => onSelectTrack(track)}
                className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
              >
                <img
                  src={track.thumbnail}
                  alt={track.title}
                  className="w-10 h-10 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{track.title}</p>
                  <p className="text-[11px] text-white/50 truncate">{track.artist}</p>
                </div>
              </div>

              <button
                onClick={() => onRemoveTrack(idx)}
                className="p-1.5 text-white/30 hover:text-white/80 transition-colors rounded-lg"
                title="Remove from queue"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
