import { Track, Playlist } from '../types/music';
import userPlaylistsRaw from './userPlaylists.json';

// All 12 authentic YouTube Music playlists from @HoledkRTF
export const USER_AUTHENTIC_PLAYLISTS: Playlist[] = userPlaylistsRaw as Playlist[];

// Initial playlists presented across the app (Home, Library, Explore)
export const INITIAL_PLAYLISTS: Playlist[] = USER_AUTHENTIC_PLAYLISTS;

// Curated starter tracks extracted directly from the user's top "Mix" playlist
const mixPlaylist = USER_AUTHENTIC_PLAYLISTS.find((p) => p.title === 'Mix');
export const CURATED_TRACKS: Track[] = (mixPlaylist?.tracks && mixPlaylist.tracks.length > 0)
  ? mixPlaylist.tracks.slice(0, 30)
  : [
      {
        id: 'BGIy38szxn0',
        title: 'DEADBEAT (demo)',
        artist: 'WesGhost',
        album: 'Mix',
        thumbnail: 'https://i.ytimg.com/vi/BGIy38szxn0/maxresdefault.jpg',
        duration: 146,
      },
      {
        id: '5wHgROHd3fc',
        title: 'Midnight Club',
        artist: 'ADTurnUp',
        album: 'Mix',
        thumbnail: 'https://i.ytimg.com/vi/5wHgROHd3fc/maxresdefault.jpg',
        duration: 166,
      },
    ];
