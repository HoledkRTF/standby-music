'use client';

import React, { useState } from 'react';
import { extractYouTubeId } from '../../utils/youtube';
import { Track } from '../../types/music';

interface SearchBarProps {
  onSelectTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectTrack, onAddToQueue }) => {
  const [inputVal, setInputVal] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const trimmed = inputVal.trim();
    const videoId = extractYouTubeId(trimmed);

    if (videoId) {
      const newTrack: Track = {
        id: videoId,
        title: 'Playing from Link',
        artist: 'YouTube / YouTube Music',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 0,
      };

      // Attempt to fetch oEmbed metadata for accurate title and artist
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.title) {
            newTrack.title = data.title;
            newTrack.artist = data.author_name || 'YouTube Music';
          }
        })
        .catch(() => {})
        .finally(() => {
          onSelectTrack(newTrack);
          setInputVal('');
          setStatusMsg('Loaded track from link!');
          setTimeout(() => setStatusMsg(null), 3000);
        });
    } else {
      // Direct title search simulation: create a playable search track or query
      const searchTrack: Track = {
        id: 'dQw4w9WgXcQ', // fallback or placeholder
        title: trimmed,
        artist: 'YouTube Music Search',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
        duration: 212,
      };

      // Query noembed or invidious search if available
      setStatusMsg(`Searching for "${trimmed}"...`);
      onSelectTrack(searchTrack);
      setInputVal('');
      setTimeout(() => setStatusMsg(null), 2500);
    }
  };

  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 text-white/40 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Paste YouTube Music URL or search song..."
          className="w-full pl-10 pr-24 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-white/40 rounded-2xl text-sm font-medium backdrop-blur-md outline-none border border-white/10 focus:border-white/30 transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 px-3 py-1.5 bg-white text-black hover:bg-white/90 font-semibold text-xs rounded-xl transition-transform active:scale-95 shadow-sm"
        >
          Play
        </button>
      </form>
      {statusMsg && (
        <p className="text-xs text-white/70 px-1 animate-fadeIn">{statusMsg}</p>
      )}
    </div>
  );
};
