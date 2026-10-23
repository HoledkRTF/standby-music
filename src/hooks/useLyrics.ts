'use client';

import { useState, useEffect } from 'react';
import { LyricsData } from '../types/music';
import { parseLrc } from '../utils/lrcParser';

export function useLyrics(trackTitle?: string, artistName?: string) {
  const [lyrics, setLyrics] = useState<LyricsData>({ synced: false, lines: [] });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!trackTitle) {
      setLyrics({ synced: false, lines: [] });
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    // Clean noise often present in YouTube titles
    const cleanTitle = trackTitle
      .replace(/(\(|\[).*?(official|video|audio|remastered|music video|lyric|lyrics|visualizer|4k|hd|hq).*?(\)|\])/gi, '')
      .replace(/ft\..*?$/i, '')
      .replace(/feat\..*?$/i, '')
      .replace(/- topic/gi, '')
      .trim();

    const cleanArtist = (artistName || '')
      .replace(/- topic/gi, '')
      .replace(/vevo/gi, '')
      .trim();

    const query = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: cleanArtist,
    });

    fetch(`https://lrclib.net/api/get?${query.toString()}`)
      .then((res) => {
        if (!res.ok) {
          // Fallback to fuzzy search
          const searchParam = encodeURIComponent(`${cleanTitle} ${cleanArtist}`.trim());
          return fetch(`https://lrclib.net/api/search?q=${searchParam}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((list) => (Array.isArray(list) && list.length > 0 ? list[0] : null));
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data && data.syncedLyrics) {
          const lines = parseLrc(data.syncedLyrics);
          setLyrics({ synced: true, lines });
        } else if (data && data.plainLyrics) {
          const rawLines = data.plainLyrics
            .split('\n')
            .map((text: string) => ({ time: 0, text: text.trim() }))
            .filter((l: any) => l.text.length > 0);
          setLyrics({ synced: false, lines: rawLines, rawText: data.plainLyrics });
        } else {
          setLyrics({ synced: false, lines: [] });
        }
      })
      .catch((err) => {
        console.warn('LRCLIB fetch error:', err);
        if (isMounted) setLyrics({ synced: false, lines: [] });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [trackTitle, artistName]);

  return { lyrics, isLoading };
}
