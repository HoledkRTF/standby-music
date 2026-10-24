import { NextResponse } from 'next/server';
import { Track, Playlist } from '@/types/music';

function parseDuration(timeStr?: string): number {
  if (!timeStr) return 210;
  const parts = timeStr.split(':').map((p) => parseInt(p, 10)).filter((n) => !isNaN(n));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 210;
}

function findAllByTargetKey(obj: any, targetKey: string): any[] {
  const results: any[] = [];
  if (!obj || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      results.push(...findAllByTargetKey(item, targetKey));
    }
  } else {
    for (const [k, v] of Object.entries(obj)) {
      if (k === targetKey) {
        results.push(v);
      }
      results.push(...findAllByTargetKey(v, targetKey));
    }
  }
  return results;
}

function extractPlaylistId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }
  const match = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/i);
  if (match) return match[1];
  return null;
}

function extractVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:watch\?v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/i);
  return match ? match[1] : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('url') || searchParams.get('id') || searchParams.get('q') || '';

  if (!input.trim()) {
    return NextResponse.json({ error: 'Please provide a playlist URL or ID' }, { status: 400 });
  }

  const playlistId = extractPlaylistId(input);
  const videoId = extractVideoId(input);

  // If no playlist ID found, but single video ID found
  if (!playlistId && videoId) {
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      const track: Track = {
        id: videoId,
        title: data.title || 'YouTube Track',
        artist: data.author_name || 'YouTube Music',
        duration: 210,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
      const playlist: Playlist = {
        id: `pl-${videoId}`,
        title: data.title ? `${data.title.slice(0, 30)}` : 'YouTube Song',
        description: `Imported from YouTube: ${data.author_name || 'YouTube'}`,
        creator: data.author_name || 'You',
        coverUrl: track.thumbnail,
        tracks: [track],
        category: 'all',
        isUserCreated: true,
      };
      return NextResponse.json({ playlist });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch single video info' }, { status: 500 });
    }
  }

  if (!playlistId) {
    return NextResponse.json(
      { error: 'Invalid URL. Could not detect a YouTube playlist ID (list=...).' },
      { status: 400 }
    );
  }

  const browseId = playlistId.startsWith('VL') ? playlistId : `VL${playlistId}`;

  try {
    // 1. Try YouTube browse API (fastest & cleanest)
    const ytPayload = {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20231201.00.00',
          hl: 'en',
          gl: 'US',
        },
      },
      browseId,
    };

    let data: any = null;
    try {
      const apiRes = await fetch('https://www.youtube.com/youtubei/v1/browse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Cookie: 'SOCS=CAESEwgDEgk2OTQ0Mzg4MTQaAmVuIAEaBgiA_LyaBg;',
        },
        body: JSON.stringify(ytPayload),
        next: { revalidate: 300 },
      });

      if (apiRes.ok) {
        data = await apiRes.json();
      }
    } catch (e) {
      console.warn('Browse API failed, falling back to HTML fetch:', e);
    }

    // 2. If browse API failed or returned error, try HTML fetch fallback
    if (!data || data.alerts?.some((a: any) => a.alertRenderer?.type === 'ERROR')) {
      const htmlRes = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Cookie: 'SOCS=CAESEwgDEgk2OTQ0Mzg4MTQaAmVuIAEaBgiA_LyaBg;',
        },
        next: { revalidate: 300 },
      });

      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const match = html.match(/var ytInitialData = ({.*?});<\/script>/) || html.match(/ytInitialData = ({.*?});/);
        if (match) {
          try {
            data = JSON.parse(match[1]);
          } catch {
            // ignore
          }
        }
      }
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Could not load playlist. Please ensure it is set to Public or Unlisted on YouTube.' },
        { status: 404 }
      );
    }

    // Extract Playlist Title
    let title: string =
      data.header?.pageHeaderRenderer?.pageTitle ||
      data.metadata?.playlistMetadataRenderer?.title ||
      data.header?.playlistHeaderRenderer?.title?.simpleText ||
      'YouTube Music Playlist';

    // Extract Tracks from lockupViewModel
    const tracks: Track[] = [];
    const lockups = findAllByTargetKey(data, 'lockupViewModel');

    for (const item of lockups) {
      const vid = item?.contentId;
      if (!vid || typeof vid !== 'string' || vid.length !== 11) continue;

      const meta = item?.metadata?.lockupMetadataViewModel;
      const trackTitle = meta?.title?.content || 'Unknown Track';

      let artist = 'YouTube Music';
      const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
      if (rows.length > 0 && rows[0]?.metadataParts?.length > 0) {
        artist = rows[0].metadataParts[0]?.text?.content || 'YouTube Music';
      }

      // Duration badge
      let durText = '3:30';
      const overlays = item?.contentImage?.thumbnailViewModel?.overlays || [];
      for (const ov of overlays) {
        const badges = ov?.thumbnailBottomOverlayViewModel?.badges || [];
        for (const b of badges) {
          const t = b?.thumbnailBadgeViewModel?.text;
          if (t && typeof t === 'string' && t.includes(':')) {
            durText = t;
            break;
          }
        }
      }

      // Thumbnail
      const sources = item?.contentImage?.thumbnailViewModel?.image?.sources || [];
      const thumbnail =
        sources.length > 0
          ? sources[sources.length - 1].url
          : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

      tracks.push({
        id: vid,
        title: trackTitle,
        artist,
        duration: parseDuration(durText),
        thumbnail,
      });

      if (tracks.length >= 200) break;
    }

    // Fallback: check classic playlistVideoRenderer
    if (tracks.length === 0) {
      const pvrs = findAllByTargetKey(data, 'playlistVideoRenderer');
      for (const pvr of pvrs) {
        const vid = pvr?.videoId;
        if (!vid || typeof vid !== 'string' || vid.length !== 11) continue;

        const trackTitle = pvr?.title?.runs?.[0]?.text || 'Unknown Track';
        const artist = pvr?.shortBylineText?.runs?.[0]?.text || 'YouTube Music';
        const duration = parseInt(pvr?.lengthSeconds || '210', 10);
        const thumbs = pvr?.thumbnail?.thumbnails || [];
        const thumbnail =
          thumbs.length > 0 ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

        tracks.push({
          id: vid,
          title: trackTitle,
          artist,
          duration: isNaN(duration) ? 210 : duration,
          thumbnail,
        });

        if (tracks.length >= 200) break;
      }
    }

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: 'Playlist found but contains no playable tracks or is private.' },
        { status: 404 }
      );
    }

    const playlist: Playlist = {
      id: `pl-${playlistId}`,
      title,
      description: `Imported from YouTube Music (${tracks.length} songs)`,
      creator: 'YouTube Music',
      coverUrl: tracks[0]?.thumbnail || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      tracks,
      category: 'all',
      isUserCreated: true,
    };

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}
