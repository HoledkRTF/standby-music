'use client';

import React, { useState, useEffect } from 'react';
import { Track, Playlist, PlayerState } from '@/types/music';
import { INITIAL_PLAYLISTS, CURATED_TRACKS } from '@/data/musicData';
import { PlaylistDetailModal } from './PlaylistDetailModal';
import { NewPlaylistModal } from './NewPlaylistModal';
import { EqualizerBars } from '../standby/EqualizerBars';
import { formatTime, extractPlaylistId } from '@/utils/youtube';

interface YouTubeMusicViewProps {
  playerState: PlayerState;
  isFullscreen?: boolean;
  onSelectTrack?: (track: Track) => void;
  onPlayTrack?: (track: Track) => void;
  onPlayPlaylist: (tracks: Track[], startIndex?: number) => void;
  onAddToQueue?: (track: Track) => void;
  onRemoveFromQueue?: (index: number) => void;
  onTogglePlay: () => void;
  onNextTrack?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSeek?: (seconds: number) => void;
  onEnterStandBy: () => void;
  onEnterCinemaMode: () => void;
  onToggleFullscreen?: () => void;
}

type TabType = 'home' | 'explore' | 'library' | 'search';
type CategoryFilter = 'all' | 'relax' | 'workout' | 'focus' | 'energize' | 'commute' | 'party' | 'hits';

export const YouTubeMusicView: React.FC<YouTubeMusicViewProps> = ({
  playerState,
  onSelectTrack,
  onPlayTrack,
  onPlayPlaylist,
  onAddToQueue,
  onRemoveFromQueue,
  onTogglePlay,
  onNextTrack,
  onNext,
  onEnterStandBy,
  onEnterCinemaMode,
}) => {
  const handleSelectTrack = onSelectTrack || onPlayTrack || (() => {});
  const handleNextTrack = onNextTrack || onNext || (() => {});
  const handleAddToQueue = onAddToQueue || (() => {});
  const handleRemoveFromQueue = onRemoveFromQueue || (() => {});

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('standby_user_playlists');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map((p: Playlist) => p.id));
            return [...parsed, ...INITIAL_PLAYLISTS.filter((p) => !existingIds.has(p.id))];
          }
        } catch {
          // ignore error
        }
      }
    }
    return INITIAL_PLAYLISTS;
  });

  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);

  // User's custom or synced Quick Picks from real YouTube Music
  const [quickPicks, setQuickPicks] = useState<Track[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('standby_user_quick_picks');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // ignore
        }
      }
    }
    return CURATED_TRACKS.slice(0, 5);
  });

  const [syncedPlaylistName, setSyncedPlaylistName] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('standby_synced_playlist_name');
    }
    return null;
  });

  // Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncTab, setSyncTab] = useState<'channel' | 'batch' | 'curated' | 'single' | 'backup'>('channel');
  const [syncInputUrl, setSyncInputUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Channel discovery state
  const [channelInput, setChannelInput] = useState('');
  const [isSearchingChannel, setIsSearchingChannel] = useState(false);
  const [channelResults, setChannelResults] = useState<{
    channelTitle: string;
    count: number;
    playlists: Array<{ id: string; title: string; thumbnail: string; itemCountText?: string }>;
  } | null>(null);
  const [selectedChannelPlaylists, setSelectedChannelPlaylists] = useState<Set<string>>(new Set());

  // Batch paste state
  const [batchInputText, setBatchInputText] = useState('');
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentTitle?: string } | null>(null);

  // Sync single playlist function
  const handleSyncPlaylist = async (urlOrId: string) => {
    if (!urlOrId.trim()) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/playlist?url=${encodeURIComponent(urlOrId.trim())}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to sync playlist');
      }

      const pl: Playlist = data.playlist;
      if (!pl || !pl.tracks || pl.tracks.length === 0) {
        throw new Error('Playlist contains no playable tracks or is private');
      }

      // 1. Update quick picks
      setQuickPicks(pl.tracks);
      setSyncedPlaylistName(pl.title);
      if (typeof window !== 'undefined') {
        localStorage.setItem('standby_user_quick_picks', JSON.stringify(pl.tracks));
        localStorage.setItem('standby_synced_playlist_name', pl.title);
      }

      // 2. Add to user playlists if not already there
      const exists = playlists.some((p) => p.id === pl.id);
      let updatedPls = playlists;
      if (!exists) {
        updatedPls = [pl, ...playlists];
        setPlaylists(updatedPls);
        if (typeof window !== 'undefined') {
          const userOnly = updatedPls.filter((p) => p.isUserCreated);
          localStorage.setItem('standby_user_playlists', JSON.stringify(userOnly));
        }
      }

      // 3. Immediately play first track from user's playlist
      onPlayPlaylist(pl.tracks, 0);

      setSyncInputUrl('');
      setShowSyncModal(false);
      setSyncNotice(`Synced "${pl.title}" (${pl.tracks.length} songs)`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      console.warn('Sync failed:', err);
      setSyncError(err.message || 'Could not sync playlist. Please check the URL.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Discover all playlists for a channel / handle
  const handleSearchChannel = async () => {
    if (!channelInput.trim()) return;
    setIsSearchingChannel(true);
    setSyncError(null);
    setChannelResults(null);
    try {
      const res = await fetch(`/api/channel-playlists?channel=${encodeURIComponent(channelInput.trim())}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to find channel playlists');
      }
      setChannelResults(data);
      setSelectedChannelPlaylists(new Set(data.playlists.map((p: any) => p.id)));
    } catch (err: any) {
      setSyncError(err.message || 'Could not find channel. Verify the handle or URL.');
    } finally {
      setIsSearchingChannel(false);
    }
  };

  // Import all or selected playlists from channel discovery
  const handleImportChannelPlaylists = () => {
    if (!channelResults || channelResults.playlists.length === 0) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const toImport = channelResults.playlists.filter((p) => selectedChannelPlaylists.has(p.id));
      if (toImport.length === 0) {
        throw new Error('Please select at least one playlist to import');
      }

      const newPlaylists: Playlist[] = toImport.map((item) => ({
        id: `pl-${item.id}`,
        title: item.title,
        description: `Imported from ${channelResults.channelTitle} (${item.itemCountText || 'Playlist'})`,
        creator: channelResults.channelTitle || 'YouTube Music',
        coverUrl: item.thumbnail,
        tracks: [],
        category: 'all',
        isUserCreated: true,
      }));

      const existingIds = new Set(newPlaylists.map((p) => p.id));
      const updated = [...newPlaylists, ...playlists.filter((p) => !existingIds.has(p.id))];
      setPlaylists(updated);
      if (typeof window !== 'undefined') {
        const userOnly = updated.filter((p) => p.isUserCreated);
        localStorage.setItem('standby_user_playlists', JSON.stringify(userOnly));
      }

      setShowSyncModal(false);
      setChannelResults(null);
      setChannelInput('');
      setSyncNotice(`Imported ${newPlaylists.length} playlists from ${channelResults.channelTitle}!`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      setSyncError(err.message || 'Import failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Batch import multiple playlist links
  const handleBatchImport = async () => {
    if (!batchInputText.trim()) return;
    setIsSyncing(true);
    setSyncError(null);

    const matches = Array.from(batchInputText.matchAll(/(?:list=|\/playlist\/)([a-zA-Z0-9_-]+)/gi));
    const extractedIds = Array.from(new Set(matches.map((m) => m[1])));

    if (extractedIds.length === 0) {
      const rawLines = batchInputText.split(/[\n,\s]+/).map((s) => s.trim()).filter((s) => s.length >= 10);
      if (rawLines.length > 0) {
        extractedIds.push(...Array.from(new Set(rawLines)));
      }
    }

    if (extractedIds.length === 0) {
      setSyncError('No valid playlist links found. Paste lines containing YouTube playlist URLs.');
      setIsSyncing(false);
      return;
    }

    const importedPlaylists: Playlist[] = [];
    for (let i = 0; i < extractedIds.length; i++) {
      const id = extractedIds[i];
      setBatchProgress({ current: i + 1, total: extractedIds.length, currentTitle: `Playlist ${i + 1}` });
      try {
        const res = await fetch(`/api/playlist?url=${encodeURIComponent(id)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.playlist && data.playlist.tracks?.length > 0) {
            importedPlaylists.push(data.playlist);
          }
        }
      } catch (e) {
        console.warn(`Failed to import ${id}`, e);
      }
    }

    if (importedPlaylists.length === 0) {
      setSyncError('Could not load any playlists. Ensure they are public or unlisted.');
      setIsSyncing(false);
      setBatchProgress(null);
      return;
    }

    const existingIds = new Set(importedPlaylists.map((p) => p.id));
    const updated = [...importedPlaylists, ...playlists.filter((p) => !existingIds.has(p.id))];
    setPlaylists(updated);
    if (typeof window !== 'undefined') {
      const userOnly = updated.filter((p) => p.isUserCreated);
      localStorage.setItem('standby_user_playlists', JSON.stringify(userOnly));
    }

    if (importedPlaylists[0]?.tracks?.length > 0) {
      setQuickPicks(importedPlaylists[0].tracks);
      setSyncedPlaylistName(importedPlaylists[0].title);
      if (typeof window !== 'undefined') {
        localStorage.setItem('standby_user_quick_picks', JSON.stringify(importedPlaylists[0].tracks));
        localStorage.setItem('standby_synced_playlist_name', importedPlaylists[0].title);
      }
    }

    setBatchProgress(null);
    setBatchInputText('');
    setShowSyncModal(false);
    setIsSyncing(false);
    setSyncNotice(`Imported ${importedPlaylists.length} playlists to your Library!`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // Curated flagship YouTube Music essentials
  const CURATED_ESSENTIALS = [
    {
      id: 'PL4fGSIFgk5kWV6Vb5v9zQ1v9Z7v5N4e0p',
      title: "Today's Biggest Hits",
      subtitle: 'The hottest chart-toppers on YouTube Music right now',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
    },
    {
      id: 'PL4fGSIFgk5jWCEfO_H62q_4v3fV7pQG8S',
      title: 'Top 50 Global',
      subtitle: 'The most popular songs streaming worldwide',
      cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
    },
    {
      id: 'PLsCPTY_MPoPaND9NRG0rgqg_c3Tb5D52A',
      title: 'HIT ME HARD AND SOFT',
      subtitle: 'Billie Eilish Album & Complete Tracklist',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
    },
    {
      id: 'RDCLAK5uy_n9Fbdw7e6ap-98_A-8JYBmPv64v-Uaq1g',
      title: 'Chill Lo-Fi Vibes',
      subtitle: 'Relaxing ambient beats for coding and unwinding',
      cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600',
    },
    {
      id: 'PL4fGSIFgk5kXQ1b3h-9o',
      title: 'Deep Focus & Flow',
      subtitle: 'Instrumental concentration and study soundscapes',
      cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600',
    },
    {
      id: 'PL4fGSIFgk5kU8v_m',
      title: 'Late Night Synthwave',
      subtitle: 'Retrowave neon highway cruising',
      cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600',
    },
  ];

  const handleAddCuratedEssential = async (item: typeof CURATED_ESSENTIALS[0]) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(`/api/playlist?url=${encodeURIComponent(item.id)}`);
      let newPl: Playlist;
      if (res.ok) {
        const data = await res.json();
        newPl = data.playlist;
      } else {
        newPl = {
          id: `pl-${item.id}`,
          title: item.title,
          description: item.subtitle,
          creator: 'YouTube Music',
          coverUrl: item.cover,
          tracks: [],
          category: 'all',
          isUserCreated: true,
        };
      }
      const existing = playlists.filter((p) => p.id !== newPl.id);
      const updated = [newPl, ...existing];
      setPlaylists(updated);
      if (typeof window !== 'undefined') {
        const userOnly = updated.filter((p) => p.isUserCreated);
        localStorage.setItem('standby_user_playlists', JSON.stringify(userOnly));
      }
      setSyncNotice(`Added "${item.title}" to your Library!`);
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (e: any) {
      setSyncError(e.message || 'Failed to add playlist');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportLibrary = () => {
    const userPlaylists = playlists.filter((p) => p.isUserCreated);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userPlaylists, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ytmusic_library_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setSyncNotice('Library exported as JSON!');
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleImportLibraryJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) throw new Error('File must contain an array of playlists');
      const validPlaylists: Playlist[] = parsed.filter((p) => p && p.title && p.id);
      if (validPlaylists.length === 0) throw new Error('No valid playlists found');
      const existingIds = new Set(validPlaylists.map((p) => p.id));
      const updated = [...validPlaylists, ...playlists.filter((p) => !existingIds.has(p.id))];
      setPlaylists(updated);
      if (typeof window !== 'undefined') {
        const userOnly = updated.filter((p) => p.isUserCreated);
        localStorage.setItem('standby_user_playlists', JSON.stringify(userOnly));
      }
      setShowSyncModal(false);
      setSyncNotice(`Restored ${validPlaylists.length} playlists!`);
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      setSyncError(err.message || 'Failed to parse JSON file');
    }
  };

  const handleDeletePlaylist = (id: string) => {
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    if (typeof window !== 'undefined') {
      const userOnly = updated.filter((p) => p.isUserCreated);
      localStorage.setItem('standby_user_playlists', JSON.stringify(userOnly));
    }
    setSyncNotice('Playlist removed from Library');
    setTimeout(() => setSyncNotice(null), 2500);
  };

  const handleSetAsQuickPicks = (tracks: Track[], title: string) => {
    setQuickPicks(tracks);
    setSyncedPlaylistName(title);
    if (typeof window !== 'undefined') {
      localStorage.setItem('standby_user_quick_picks', JSON.stringify(tracks));
      localStorage.setItem('standby_synced_playlist_name', title);
    }
    setSyncNotice(`Set "${title}" as your Quick picks`);
    setTimeout(() => setSyncNotice(null), 3000);
  };

  const handleAddToQuickPicks = (track: Track) => {
    const exists = quickPicks.some((t) => t.id === track.id);
    let updated: Track[];
    if (exists) {
      updated = [track, ...quickPicks.filter((t) => t.id !== track.id)];
    } else {
      updated = [track, ...quickPicks];
    }
    setQuickPicks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('standby_user_quick_picks', JSON.stringify(updated));
    }
    setSyncNotice(`Added "${track.title}" to Quick picks`);
    setTimeout(() => setSyncNotice(null), 2500);
  };

  const handleResetQuickPicks = () => {
    setQuickPicks(CURATED_TRACKS.slice(0, 5));
    setSyncedPlaylistName(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('standby_user_quick_picks');
      localStorage.removeItem('standby_synced_playlist_name');
    }
    setSyncNotice('Reset Quick picks to default');
    setTimeout(() => setSyncNotice(null), 2500);
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Dynamic greeting based on user time of day
  const [greeting, setGreeting] = useState('Good vibes');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17 && hour < 22) setGreeting('Good evening');
    else setGreeting('Late night vibes');
  }, []);

  // Save custom playlists to localStorage
  const handleCreatePlaylist = (newPl: Playlist) => {
    const updated = [newPl, ...playlists];
    setPlaylists(updated);
    if (typeof window !== 'undefined') {
      const userOnly = updated.filter((p) => p.isUserCreated);
      localStorage.setItem('standby_user_playlists', JSON.stringify(userOnly));
    }
    setSelectedPlaylist(newPl);
  };

  // Perform search query to /api/search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.tracks || []);
        }
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtered playlists by category
  const filteredPlaylists =
    activeCategory === 'all'
      ? playlists
      : playlists.filter((p) => p.category === activeCategory || p.isUserCreated);

  const isPlaying = playerState.status === 'playing';
  const currentTrack = playerState.currentTrack;

  // Progress for mini-player
  const progressPercent =
    playerState.duration > 0
      ? Math.min(100, Math.max(0, (playerState.currentTime / playerState.duration) * 100))
      : 0;

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#030303] text-white flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* Top YouTube Music Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top,14px))] pb-3 bg-[#030303]/90 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          {/* Authentic YouTube Music Logo */}
          <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
            <svg className="w-3.5 h-3.5 fill-white ml-0.5" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center">
            Music
          </span>
          <button
            onClick={() => window.location.replace(`/?v=${Date.now()}`)}
            className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-all active:scale-95 border border-white/10 ml-1"
            title="App Version - Tap to refresh"
          >
            v1.0.5
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search tab toggle */}
          <button
            onClick={() => setActiveTab('search')}
            className={`p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all ${
              activeTab === 'search' ? 'bg-white/15 text-white' : 'text-white/70'
            }`}
            title="Search songs, artists, playlists"
          >
            <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* StandBy Mode Pill Button */}
          <button
            onClick={onEnterStandBy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-sm"
            title="Rotate phone or tap for Apple StandBy Display"
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
              <rect x="2" y="5" width="20" height="14" rx="3" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
            </svg>
            <span>StandBy</span>
          </button>
        </div>
      </header>

      {/* Main Body by Tab */}
      <main className="flex-1 overflow-y-auto px-4 pb-36 space-y-7 pt-2 max-w-lg mx-auto w-full">
        {/* Category Filter Pills (Home & Explore) */}
        {activeTab !== 'search' && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 pt-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'relax', label: 'Relax' },
                { id: 'workout', label: 'Workout' },
                { id: 'focus', label: 'Focus' },
                { id: 'energize', label: 'Energize' },
                { id: 'commute', label: 'Commute' },
                { id: 'party', label: 'Party' },
                { id: 'hits', label: 'Top Hits' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  activeCategory === cat.id
                    ? 'bg-white text-black shadow-md font-bold'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* ===================== TAB: HOME ===================== */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Quick Greeting & Status */}
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-2xl font-black tracking-tight text-white">
                {greeting}
              </h2>
              {syncedPlaylistName && (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Library Synced</span>
                </span>
              )}
            </div>

            {/* Notification Toast */}
            {syncNotice && (
              <div className="px-3.5 py-2.5 rounded-2xl bg-white/15 text-white text-xs font-semibold backdrop-blur-xl border border-white/20 animate-fadeIn flex items-center justify-between shadow-lg">
                <span>{syncNotice}</span>
                <button onClick={() => setSyncNotice(null)} className="text-white/60 hover:text-white text-xs ml-2">✕</button>
              </div>
            )}

            {/* YouTube Music Sync Banner */}
            {syncedPlaylistName ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-white/5 to-transparent border border-red-500/20 shadow-md">
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Connected: {syncedPlaylistName}</p>
                    <p className="text-[11px] text-white/50">{quickPicks.length} songs from your YouTube Music</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setShowSyncModal(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg transition-all"
                  >
                    Change
                  </button>
                  <button
                    onClick={handleResetQuickPicks}
                    className="p-1 text-white/40 hover:text-white/80 rounded-lg transition-all"
                    title="Reset to default"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-gradient-to-br from-red-950/40 via-zinc-900 to-black border border-red-500/30 shadow-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/30">
                      Your Real Music
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight">Sync Your YouTube Music</h3>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Paste any YouTube Music playlist link to replace sample songs with your actual library.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 fill-red-500" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={syncInputUrl}
                      onChange={(e) => setSyncInputUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSyncPlaylist(syncInputUrl)}
                      placeholder="Paste YouTube Music playlist link..."
                      className="w-full pl-3 pr-8 py-2.5 bg-black/60 text-white placeholder-white/30 rounded-xl text-xs outline-none border border-white/10 focus:border-red-500 transition-colors"
                    />
                    {syncInputUrl && (
                      <button
                        onClick={() => setSyncInputUrl('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleSyncPlaylist(syncInputUrl)}
                    disabled={isSyncing || !syncInputUrl.trim()}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 shrink-0 flex items-center space-x-1"
                  >
                    {isSyncing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Connect</span>
                    )}
                  </button>
                </div>

                {syncError && (
                  <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-800/40">{syncError}</p>
                )}

                <div className="pt-0.5 flex items-center justify-between text-[11px] text-white/40">
                  <span>Tip: In YT Music, tap playlist Share → Copy link</span>
                </div>
              </div>
            )}

            {/* Quick Picks / Start Radio */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/50 font-bold">
                    {syncedPlaylistName ? `FROM ${syncedPlaylistName.toUpperCase()}` : 'START RADIO FROM A SONG'}
                  </p>
                  <h3 className="text-xl font-bold text-white tracking-tight">Quick picks</h3>
                </div>
                <button
                  onClick={() => onPlayPlaylist(quickPicks, 0)}
                  className="text-xs font-semibold text-white/60 hover:text-white px-3 py-1 rounded-full border border-white/15 active:scale-95 transition-all"
                >
                  Play all
                </button>
              </div>

              {/* Song list with live equalizer indicator */}
              <div className="grid grid-cols-1 gap-2">
                {quickPicks.slice(0, 15).map((track) => {
                  const isCurrent = track.id === currentTrack?.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer group ${
                        isCurrent ? 'bg-white/10 border border-white/15' : 'bg-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/5 relative shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {isCurrent && isPlaying ? (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <EqualizerBars isPlaying={true} />
                            </div>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-red-400 font-bold' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-xs text-white/50 truncate mt-0.5 font-medium">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pl-3">
                        <span className="text-xs font-mono tabular-nums text-white/40">
                          {formatTime(track.duration)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToQueue(track);
                          }}
                          className="p-1.5 text-white/40 hover:text-white rounded-full hover:bg-white/10 active:scale-90 transition-transform"
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
            </section>

            {/* Playlists for You / Mixed for You Carousel */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-white/50 font-bold">
                    RECOMMENDED MIXES
                  </p>
                  <h3 className="text-xl font-bold text-white tracking-tight">Mixed for you</h3>
                </div>
                <button
                  onClick={() => setShowNewPlaylistModal(true)}
                  className="text-xs font-semibold text-white/60 hover:text-white flex items-center space-x-1 active:scale-95 transition-all"
                >
                  <span>+ Custom</span>
                </button>
              </div>

              {/* Horizontal Scroll Playlists with rich card design */}
              <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
                {filteredPlaylists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlaylist(pl)}
                    className="w-40 sm:w-44 shrink-0 space-y-2 cursor-pointer group active:scale-[0.98] transition-transform"
                  >
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-xl border border-white/10 group-hover:border-white/30 transition-all">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pl.coverUrl}
                        alt={pl.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayPlaylist(pl.tracks, 0);
                        }}
                        className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-black/85 hover:bg-red-600 text-white flex items-center justify-center shadow-xl opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all active:scale-95"
                        title="Play Playlist"
                      >
                        <svg className="w-4 h-4 fill-white ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white truncate leading-tight">
                        {pl.title}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-0.5 font-medium">
                        {pl.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Trending & Global Hits */}
            <section className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-white/50 font-bold">
                  WHAT&apos;S POPULAR
                </p>
                <h3 className="text-xl font-bold text-white tracking-tight">Trending worldwide</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {CURATED_TRACKS.slice(5, 9).map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className="p-3 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-2xl border border-white/5 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-white/10 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate">{track.title}</p>
                      <p className="text-[11px] text-white/50 truncate font-medium">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ===================== TAB: EXPLORE ===================== */}
        {activeTab === 'explore' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Explore Top Banners */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div
                onClick={() => onEnterCinemaMode()}
                className="p-4 rounded-2xl bg-gradient-to-br from-amber-600/35 to-zinc-900 border border-amber-500/20 cursor-pointer active:scale-95 transition-all shadow-lg"
              >
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                  </svg>
                  <span>Movie Mode</span>
                </div>
                <p className="text-xs text-white/60 mt-1">Watch live music videos fullscreen</p>
              </div>

              <div
                onClick={() => onEnterStandBy()}
                className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/35 to-zinc-900 border border-blue-500/20 cursor-pointer active:scale-95 transition-all shadow-lg"
              >
                <div className="flex items-center space-x-2 text-blue-300 font-bold text-sm">
                  <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="3" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
                  </svg>
                  <span>StandBy</span>
                </div>
                <p className="text-xs text-white/60 mt-1">Authentic Apple StandBy widget</p>
              </div>
            </div>

            {/* Moods and Genres */}
            <section className="space-y-3">
              <h3 className="text-xl font-bold text-white">Moods & Genres</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { name: 'Pop Hits', color: 'from-pink-600/50' },
                  { name: 'Chill & Lofi', color: 'from-purple-600/50' },
                  { name: 'Hip-Hop & R&B', color: 'from-yellow-600/50' },
                  { name: 'Workout & Energy', color: 'from-red-600/50' },
                  { name: 'Deep Focus', color: 'from-emerald-600/50' },
                  { name: 'Night Synth', color: 'from-indigo-600/50' },
                ].map((genre, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (playlists[idx % playlists.length]) {
                        setSelectedPlaylist(playlists[idx % playlists.length]);
                      }
                    }}
                    className={`h-20 rounded-2xl bg-gradient-to-br ${genre.color} to-zinc-900 border border-white/10 p-3 flex flex-col justify-end cursor-pointer hover:border-white/30 active:scale-95 transition-all shadow-md`}
                  >
                    <span className="text-sm font-bold text-white">{genre.name}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ===================== TAB: LIBRARY ===================== */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white tracking-tight">Your Library</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSyncModal(true)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-full shadow-lg active:scale-95 transition-all flex items-center space-x-1"
                >
                  <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                  <span>Sync YT Music</span>
                </button>
                <button
                  onClick={() => setShowNewPlaylistModal(true)}
                  className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-full shadow-lg hover:bg-white/90 active:scale-95 transition-all flex items-center space-x-1"
                >
                  <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New</span>
                </button>
              </div>
            </div>

            {/* If quick picks exist, offer to view them as a playlist */}
            {syncedPlaylistName && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-white/5 to-transparent border border-red-500/20 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span className="truncate">{syncedPlaylistName}</span>
                  </p>
                  <p className="text-[11px] text-white/50">{quickPicks.length} songs currently in your Home Quick picks</p>
                </div>
                <button
                  onClick={() => onPlayPlaylist(quickPicks, 0)}
                  className="px-3 py-1 bg-white text-black font-bold text-xs rounded-full hover:bg-white/90 active:scale-95 transition-all shrink-0"
                >
                  Play All
                </button>
              </div>
            )}

            {/* Playlists List */}
            <div className="space-y-2">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylist(pl)}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/10 border border-white/10 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pl.coverUrl}
                        alt={pl.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{pl.title}</h4>
                      <p className="text-xs text-white/50 truncate mt-0.5 font-medium">
                        {pl.creator} • {pl.tracks.length} songs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {pl.isUserCreated && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(pl.id);
                        }}
                        className="p-2 text-white/30 hover:text-red-400 rounded-full hover:bg-white/10 active:scale-90 transition-all"
                        title="Remove playlist from Library"
                      >
                        <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pl.tracks && pl.tracks.length > 0) {
                          onPlayPlaylist(pl.tracks, 0);
                        } else {
                          setSelectedPlaylist(pl);
                        }
                      }}
                      className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white active:scale-90 transition-transform"
                      title="Play"
                    >
                      <svg className="w-5 h-5 fill-white ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB: SEARCH ===================== */}
        {activeTab === 'search' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Search Input Box */}
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-white/40 pointer-events-none">
                <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, artists, albums, or paste YouTube link..."
                className="w-full pl-10 pr-10 py-3 bg-white/10 text-white placeholder-white/40 rounded-2xl text-sm font-medium outline-none border border-white/15 focus:border-white/35 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 text-white/40 hover:text-white"
                >
                  <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Check if searchQuery is a YouTube playlist or video link */}
            {extractPlaylistId(searchQuery) && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/70 to-zinc-900 border border-red-500/30 flex items-center justify-between shadow-lg">
                <div className="min-w-0 pr-3">
                  <p className="text-xs font-bold text-white">YouTube Music Playlist Link</p>
                  <p className="text-[11px] text-white/50 truncate">Tap to sync this playlist to your Quick picks & library</p>
                </div>
                <button
                  onClick={() => handleSyncPlaylist(searchQuery)}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md shrink-0 active:scale-95 flex items-center space-x-1"
                >
                  {isSyncing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Sync & Play</span>
                  )}
                </button>
              </div>
            )}

            {/* Results */}
            {isSearching ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-white/50 text-sm">
                <div className="w-6 h-6 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                <span>Searching YouTube Music...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1 divide-y divide-white/5">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/10 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{track.title}</p>
                        <p className="text-xs text-white/50 truncate mt-0.5 font-medium">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pl-3">
                      <span className="text-xs font-mono tabular-nums text-white/40">
                        {formatTime(track.duration)}
                      </span>
                      {/* Add to Home Quick Picks */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToQuickPicks(track);
                        }}
                        className="p-1.5 text-white/40 hover:text-amber-400 rounded-full hover:bg-white/10 active:scale-90 transition-transform"
                        title="Add to Home Quick picks"
                      >
                        <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      {/* Add to Queue */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToQueue(track);
                        }}
                        className="p-1.5 text-white/40 hover:text-white rounded-full hover:bg-white/10 active:scale-90 transition-transform"
                        title="Add to queue"
                      >
                        <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-center text-sm text-white/50 py-8">No results found for &ldquo;{searchQuery}&rdquo;</p>
            ) : (
              <div className="py-6 space-y-3">
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['golden hour', 'Billie Eilish', 'Lofi hip hop', 'Sabrina Carpenter', 'The Weeknd', 'Synthwave'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-white/80 active:scale-95 transition-transform"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ===================== DOCKED MINI PLAYER & BOTTOM NAV ===================== */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#101012]/95 backdrop-blur-3xl border-t border-white/10 flex flex-col">
        {/* Scrubber progress line on top of mini-player */}
        <div className="w-full h-0.5 bg-white/10 overflow-hidden">
          <div
            className="h-full bg-white transition-[width] duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Mini Player Row */}
        {currentTrack && (
          <div
            onClick={onEnterStandBy}
            className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/10 shadow-sm border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {currentTrack.title}
                  </p>
                  {isPlaying && <EqualizerBars isPlaying={true} />}
                </div>
                <p className="text-[11px] text-white/50 truncate mt-0.5 font-medium">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-1 pl-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="p-2 text-white hover:scale-105 active:scale-90 transition-transform"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextTrack();
                }}
                className="p-2 text-white/80 hover:text-white hover:scale-105 active:scale-90 transition-transform"
                title="Next"
              >
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 4-Tab YouTube Music Bottom Navigation */}
        <nav className="flex items-center justify-around py-2 border-t border-white/5 pb-[max(0.6rem,env(safe-area-inset-bottom,10px))]">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center space-y-1 py-1 px-4 transition-all ${
              activeTab === 'home' ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span className="text-[10px] font-semibold">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center space-y-1 py-1 px-4 transition-all ${
              activeTab === 'explore' ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
            </svg>
            <span className="text-[10px] font-semibold">Explore</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center space-y-1 py-1 px-4 transition-all ${
              activeTab === 'library' ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zm-7-2h2v-4h2V6h-4v6z" />
            </svg>
            <span className="text-[10px] font-semibold">Library</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center space-y-1 py-1 px-4 transition-all ${
              activeTab === 'search' ? 'text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[10px] font-semibold">Search</span>
          </button>
        </nav>
      </footer>

      {/* Playlist Detail Modal */}
      {selectedPlaylist && (
        <PlaylistDetailModal
          playlist={selectedPlaylist}
          currentTrackId={currentTrack?.id}
          isPlaying={isPlaying}
          onClose={() => setSelectedPlaylist(null)}
          onPlayPlaylist={onPlayPlaylist}
          onPlayTrack={handleSelectTrack}
          onAddToQueue={handleAddToQueue}
          onSetAsQuickPicks={handleSetAsQuickPicks}
          onUpdatePlaylist={(updated) => {
            const updatedList = playlists.map((p) => (p.id === updated.id ? updated : p));
            setPlaylists(updatedList);
            setSelectedPlaylist(updated);
            if (typeof window !== 'undefined') {
              const userOnly = updatedList.filter((p) => p.isUserCreated);
              localStorage.setItem('standby_user_playlists', JSON.stringify(userOnly));
            }
          }}
        />
      )}

      {/* New Playlist Modal */}
      {showNewPlaylistModal && (
        <NewPlaylistModal
          onClose={() => setShowNewPlaylistModal(false)}
          onCreatePlaylist={handleCreatePlaylist}
          onImportTrack={handleSelectTrack}
        />
      )}

      {/* Enhanced Multi-Method YouTube Music Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none">
          <div className="bg-[#1c1c1e] w-full max-w-lg rounded-3xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shadow-md">
                  <svg className="w-3.5 h-3.5 fill-white ml-0.5" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">Bring YouTube Music Libraries</h2>
                  <p className="text-[11px] text-white/50">Import playlists, channels, or full libraries</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setChannelResults(null);
                  setSyncError(null);
                }}
                className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 active:scale-95 transition-all"
              >
                ✕
              </button>
            </div>

            {/* Sync Method Tabs */}
            <div className="flex items-center space-x-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 text-xs shrink-0 overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  setSyncTab('channel');
                  setSyncError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  syncTab === 'channel' ? 'bg-red-600 text-white shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                Channel (@)
              </button>
              <button
                onClick={() => {
                  setSyncTab('batch');
                  setSyncError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  syncTab === 'batch' ? 'bg-red-600 text-white shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                Paste Links
              </button>
              <button
                onClick={() => {
                  setSyncTab('curated');
                  setSyncError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  syncTab === 'curated' ? 'bg-red-600 text-white shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                Essentials
              </button>
              <button
                onClick={() => {
                  setSyncTab('backup');
                  setSyncError(null);
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  syncTab === 'backup' ? 'bg-red-600 text-white shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                Backup
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
              {/* Error Banner */}
              {syncError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 font-medium leading-relaxed">
                  {syncError}
                </div>
              )}

              {/* TAB 1: Channel / Profile Sync */}
              {syncTab === 'channel' && (
                <div className="space-y-3">
                  <p className="text-white/70 leading-relaxed">
                    Enter your YouTube / YouTube Music handle or channel link (e.g. <span className="font-mono text-amber-300">@username</span> or <span className="font-mono text-amber-300">music.youtube.com/channel/UC...</span>) to automatically discover and import all your public playlists at once.
                  </p>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={channelInput}
                      onChange={(e) => setChannelInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchChannel()}
                      placeholder="@billieeilish or channel URL"
                      className="flex-1 px-3.5 py-2.5 bg-white/10 text-white placeholder-white/30 rounded-xl outline-none border border-white/15 focus:border-red-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSearchChannel}
                      disabled={isSearchingChannel || !channelInput.trim()}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all shrink-0 flex items-center space-x-1.5"
                    >
                      {isSearchingChannel ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Find All</span>
                      )}
                    </button>
                  </div>

                  {/* Channel Discovery Results */}
                  {channelResults && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                        <div>
                          <span className="font-bold text-white">{channelResults.channelTitle}</span>
                          <span className="text-white/50 ml-2">({channelResults.playlists.length} playlists found)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedChannelPlaylists(new Set(channelResults.playlists.map((p) => p.id)))}
                            className="text-red-400 hover:underline font-semibold"
                          >
                            Select All
                          </button>
                          <span className="text-white/20">•</span>
                          <button
                            onClick={() => setSelectedChannelPlaylists(new Set())}
                            className="text-white/40 hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Scrollable list of found playlists */}
                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {channelResults.playlists.map((item) => {
                          const isSelected = selectedChannelPlaylists.has(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                const next = new Set(selectedChannelPlaylists);
                                if (isSelected) next.delete(item.id);
                                else next.add(item.id);
                                setSelectedChannelPlaylists(next);
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                                isSelected ? 'bg-white/15 border-red-500/50' : 'bg-white/5 border-white/5 opacity-60'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded accent-red-600 shrink-0"
                                />
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/10">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-white truncate text-xs">{item.title}</p>
                                  <p className="text-[10px] text-white/50 truncate">{item.itemCountText || 'Playlist'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={handleImportChannelPlaylists}
                        disabled={selectedChannelPlaylists.size === 0 || isSyncing}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
                      >
                        {isSyncing ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>Import All {selectedChannelPlaylists.size} Playlists to Library</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Batch Paste Multiple Links */}
              {syncTab === 'batch' && (
                <div className="space-y-3">
                  <p className="text-white/70 leading-relaxed">
                    Paste one or multiple YouTube Music / YouTube playlist links below (one per line, or separated by commas/spaces).
                  </p>

                  <textarea
                    rows={4}
                    value={batchInputText}
                    onChange={(e) => setBatchInputText(e.target.value)}
                    placeholder="https://music.youtube.com/playlist?list=PL...&#10;https://music.youtube.com/playlist?list=PL..."
                    className="w-full p-3 bg-white/10 text-white placeholder-white/30 rounded-xl outline-none border border-white/15 focus:border-red-500 transition-colors font-mono text-xs leading-relaxed"
                  />

                  {batchProgress && (
                    <div className="p-3 rounded-xl bg-white/10 space-y-1.5 border border-white/10">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-white/80">
                        <span>Importing playlist {batchProgress.current} of {batchProgress.total}...</span>
                        <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600 transition-all duration-300"
                          style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleBatchImport}
                    disabled={isSyncing || !batchInputText.trim()}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    {isSyncing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Import All Playlists</span>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 3: Curated Flagship Essentials */}
              {syncTab === 'curated' && (
                <div className="space-y-3">
                  <p className="text-white/70 leading-relaxed">
                    Instantly load official YouTube Music flagship charts and curated playlists into your library:
                  </p>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {CURATED_ESSENTIALS.map((item) => {
                      const isAlreadyAdded = playlists.some((p) => p.id === `pl-${item.id}` || p.id === item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-white/10 shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white truncate text-xs">{item.title}</p>
                              <p className="text-[11px] text-white/50 truncate mt-0.5">{item.subtitle}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddCuratedEssential(item)}
                            disabled={isSyncing}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ml-2 shrink-0 ${
                              isAlreadyAdded
                                ? 'bg-white/10 text-white/60 hover:text-white'
                                : 'bg-white text-black hover:bg-white/90 active:scale-95 shadow-md'
                            }`}
                          >
                            {isAlreadyAdded ? '✓ Added' : '+ Add'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: Backup & Restore */}
              {syncTab === 'backup' && (
                <div className="space-y-4">
                  <p className="text-white/70 leading-relaxed">
                    Export your custom playlists as a JSON backup, or import an existing backup file to restore your entire library across any phone, tablet, or browser.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={handleExportLibrary}
                      className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-center space-y-2 active:scale-95 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/10 mx-auto flex items-center justify-center">
                        <svg className="w-4 h-4 fill-none stroke-current text-white" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                      <p className="font-bold text-white text-xs">Export Library (.json)</p>
                      <p className="text-[10px] text-white/50">Save all custom playlists to file</p>
                    </button>

                    <label className="p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-center space-y-2 active:scale-95 transition-all cursor-pointer block">
                      <div className="w-8 h-8 rounded-full bg-white/10 mx-auto flex items-center justify-center">
                        <svg className="w-4 h-4 fill-none stroke-current text-white" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <p className="font-bold text-white text-xs">Import Library (.json)</p>
                      <p className="text-[10px] text-white/50">Upload previous backup file</p>
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const content = ev.target?.result as string;
                              if (content) handleImportLibraryJson(content);
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-white/40 shrink-0">
              <span>Supports YouTube Music and YouTube public/unlisted libraries</span>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="text-white/60 hover:text-white font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
