'use client';

import React from 'react';
import { Track } from '../../types/music';

export const CURATED_PRESETS: Track[] = [
  {
    id: '5qap5aO4i9A',
    title: 'lofi hip hop radio - beats to relax/study to',
    artist: 'Lofi Girl',
    album: 'Lofi Chill Vibes',
    thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
    duration: 0,
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    duration: 200,
  },
  {
    id: 'PEM0Vs8jf1w',
    title: 'golden hour',
    artist: 'JVKE',
    album: 'this is what ____ feels like',
    thumbnail: 'https://i.ytimg.com/vi/PEM0Vs8jf1w/hqdefault.jpg',
    duration: 209,
  },
  {
    id: 'H5v3kku4y6Q',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    thumbnail: 'https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg',
    duration: 167,
  },
  {
    id: 'dX3k_QDnzHE',
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    thumbnail: 'https://i.ytimg.com/vi/dX3k_QDnzHE/hqdefault.jpg',
    duration: 243,
  },
  {
    id: 'eVli-tstM5E',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: 'Short n\' Sweet',
    thumbnail: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg',
    duration: 175,
  },
];

interface PresetPillsProps {
  onSelectTrack: (track: Track) => void;
  currentTrackId?: string;
}

export const PresetPills: React.FC<PresetPillsProps> = ({ onSelectTrack, currentTrackId }) => {
  return (
    <div className="w-full space-y-2.5">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider px-1">
        Featured Vibes
      </h3>
      <div className="flex space-x-2.5 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {CURATED_PRESETS.map((track) => {
          const isSelected = track.id === currentTrackId;
          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 border ${
                isSelected
                  ? 'bg-white/25 border-white/40 shadow-lg shadow-white/5'
                  : 'bg-white/10 hover:bg-white/15 border-white/5'
              }`}
            >
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-9 h-9 rounded-xl object-cover shadow-sm bg-white/5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
                }}
              />
              <div className="text-left">
                <p className="text-xs font-semibold text-white truncate max-w-[140px]">{track.title}</p>
                <p className="text-[10px] text-white/60 truncate max-w-[140px]">{track.artist}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
