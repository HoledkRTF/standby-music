import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = (searchParams.get('channel') || searchParams.get('handle') || searchParams.get('url') || searchParams.get('q') || '').trim();

  if (!input) {
    return NextResponse.json({ error: 'Please provide a channel handle, URL, or channel ID.' }, { status: 400 });
  }

  let targetUrl = input.replace('music.youtube.com', 'www.youtube.com');

  if (targetUrl.startsWith('@')) {
    targetUrl = `https://www.youtube.com/${targetUrl}/playlists`;
  } else if (/^UC[a-zA-Z0-9_-]{20,}$/.test(targetUrl)) {
    targetUrl = `https://www.youtube.com/channel/${targetUrl}/playlists`;
  } else if (targetUrl.includes('/channel/') || targetUrl.includes('/@') || targetUrl.includes('/c/') || targetUrl.includes('/user/')) {
    if (!targetUrl.endsWith('/playlists')) {
      targetUrl = targetUrl.replace(/\/+$/, '') + '/playlists';
    }
  } else if (!targetUrl.startsWith('http')) {
    targetUrl = `https://www.youtube.com/@${targetUrl}/playlists`;
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: 'SOCS=CAESEwgDEgk2OTQ0Mzg4MTQaAmVuIAEaBgiA_LyaBg;',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `YouTube responded with status ${res.status}. Channel not found or private.` },
        { status: res.status }
      );
    }

    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/) || html.match(/ytInitialData = ({.*?});/);

    if (!match) {
      return NextResponse.json(
        { error: 'Could not extract playlist data. Please verify the channel handle or URL.' },
        { status: 404 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(match[1]);
    } catch {
      return NextResponse.json({ error: 'Failed to parse YouTube channel metadata.' }, { status: 500 });
    }

    const channelTitle =
      data.header?.pageHeaderRenderer?.pageTitle ||
      data.metadata?.channelMetadataRenderer?.title ||
      input;

    const lockups = findAllByTargetKey(data, 'lockupViewModel');
    const gridPlaylists = findAllByTargetKey(data, 'gridPlaylistRenderer');

    const playlists: Array<{
      id: string;
      title: string;
      thumbnail: string;
      itemCountText?: string;
    }> = [];

    const seenIds = new Set<string>();

    for (const item of lockups) {
      const id = item?.contentId;
      if (!id || typeof id !== 'string' || id.length < 5 || seenIds.has(id)) continue;

      const title = item?.metadata?.lockupMetadataViewModel?.title?.content || 'Untitled Playlist';
      let thumbnail = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600';
      const sources = item?.contentImage?.thumbnailViewModel?.image?.sources;
      if (sources && sources.length > 0) {
        thumbnail = sources[sources.length - 1].url;
      }

      // Check for item count overlay (e.g. "45 videos")
      let itemCountText = '';
      const overlays = item?.contentImage?.thumbnailViewModel?.overlays || [];
      for (const ov of overlays) {
        const badge = ov?.thumbnailBottomOverlayViewModel?.badges?.[0]?.thumbnailBadgeViewModel?.text;
        if (badge && typeof badge === 'string') {
          itemCountText = badge;
          break;
        }
      }

      seenIds.add(id);
      playlists.push({ id, title, thumbnail, itemCountText });
    }

    for (const item of gridPlaylists) {
      const id = item?.playlistId;
      if (!id || typeof id !== 'string' || id.length < 5 || seenIds.has(id)) continue;

      const title = item?.title?.runs?.[0]?.text || 'Untitled Playlist';
      let thumbnail = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600';
      const thumbs = item?.thumbnail?.thumbnails;
      if (thumbs && thumbs.length > 0) {
        thumbnail = thumbs[thumbs.length - 1].url;
      }
      const itemCountText = item?.videoCountShortText?.simpleText || '';

      seenIds.add(id);
      playlists.push({ id, title, thumbnail, itemCountText });
    }

    return NextResponse.json({
      channelTitle,
      count: playlists.length,
      playlists,
    });
  } catch (error: any) {
    console.error('Channel playlists error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
