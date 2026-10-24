'use client';

import React, { useState } from 'react';
import { Playlist, Track } from '@/types/music';
import { extractYouTubeId } from '@/utils/youtube';

interface NewPlaylistModalProps {
  onClose: () => void;
  onCreatePlaylist: (playlist: Playlist) => void;
  onImportTrack: (track: Track) => void;
}

const COVER_OPTIONS = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
];

export const NewPlaylistModal: React.FC<NewPlaylistModalProps> = ({
  onClose,
  onCreatePlaylist,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCover, setSelectedCover] = useState(COVER_OPTIONS[0]);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPlaylist: Playlist = {
      id: `pl-user-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'My customized music mix',
      creator: 'You',
      coverUrl: selectedCover,
      tracks: [],
      category: 'all',
      isUserCreated: true,
    };

    onCreatePlaylist(newPlaylist);
    onClose();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setIsImporting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/playlist?url=${encodeURIComponent(importUrl.trim())}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to import playlist');
      }

      if (data.playlist) {
        onCreatePlaylist(data.playlist);
        // Also save to user quick picks if available
        if (data.playlist.tracks && data.playlist.tracks.length > 0 && typeof window !== 'undefined') {
          localStorage.setItem('standby_user_quick_picks', JSON.stringify(data.playlist.tracks));
          localStorage.setItem('standby_synced_playlist_name', data.playlist.title);
        }
        onClose();
        return;
      }
      throw new Error('No playlist data received');
    } catch (err: any) {
      console.warn('Playlist import error:', err);
      // Fallback: try single video
      const videoId = extractYouTubeId(importUrl.trim());
      if (videoId) {
        try {
          const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
          const data = await res.json();
          const importedTrack: Track = {
            id: videoId,
            title: data.title || 'Imported YouTube Song',
            artist: data.author_name || 'YouTube',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            duration: 210,
          };

          const newPlaylist: Playlist = {
            id: `pl-user-${Date.now()}`,
            title: data.title ? `Mix: ${data.title.slice(0, 24)}...` : 'Imported YouTube Mix',
            description: `Imported from YouTube link: ${data.author_name || 'YouTube'}`,
            creator: 'You',
            coverUrl: importedTrack.thumbnail,
            tracks: [importedTrack],
            category: 'all',
            isUserCreated: true,
          };

          onCreatePlaylist(newPlaylist);
          onClose();
          return;
        } catch {
          setErrorMsg('Could not fetch YouTube info. Please check the URL.');
        }
      } else {
        setErrorMsg(err.message || 'Please enter a valid YouTube or YouTube Music playlist link.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-[#1c1c1e] w-full max-w-md rounded-3xl border border-white/10 p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-white">Create New Playlist</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10"
          >
            <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab / Toggle between manual creation & YouTube link */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/60 block mb-1.5">
              Playlist Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Late Night Drives, Gym Hype"
              required
              className="w-full px-3.5 py-2.5 bg-white/10 text-white placeholder-white/40 rounded-xl text-sm outline-none border border-white/10 focus:border-white/30"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/60 block mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A few words about this vibe..."
              className="w-full px-3.5 py-2.5 bg-white/10 text-white placeholder-white/40 rounded-xl text-sm outline-none border border-white/10 focus:border-white/30"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/60 block mb-2">
              Select Artwork Cover
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COVER_OPTIONS.map((cov, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedCover(cov)}
                  className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedCover === cov ? 'border-white scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cov} alt="Cover" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-white text-black font-bold text-sm rounded-xl shadow-lg hover:bg-white/90 active:scale-98 transition-all"
          >
            Create Playlist
          </button>
        </form>

        {/* Import YouTube link */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Or Import YouTube Music Playlist
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="Paste YouTube Music playlist or song link..."
              className="flex-1 px-3 py-2 bg-white/5 text-white placeholder-white/30 rounded-xl text-xs outline-none border border-white/10 focus:border-red-500 transition-colors"
            />
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {isImporting ? '...' : 'Import'}
            </button>
          </div>
          {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
};
