import { NextResponse } from 'next/server';
import { Track } from '@/types/music';
import { CURATED_TRACKS } from '@/data/musicData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const ytPayload = {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20231201.00.00',
          hl: 'en',
          gl: 'US',
        },
      },
      query: q,
    };

    const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(ytPayload),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`YouTube API returned ${res.status}`);
    }

    const data = await res.json();
    const tracks: Track[] = [];

    const sectionContents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

    for (const section of sectionContents) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const vr = item?.videoRenderer;
        if (vr && vr.videoId) {
          const title = vr.title?.runs?.[0]?.text || 'Unknown Title';
          const artist = vr.ownerText?.runs?.[0]?.text || vr.longBylineText?.runs?.[0]?.text || 'YouTube Music';
          const durationText = vr.lengthText?.simpleText || '3:30';

          // Parse duration string like "3:45" or "1:02:15" into seconds
          const parts = durationText.split(':').map((p: string) => parseInt(p, 10));
          let duration = 0;
          if (parts.length === 2) duration = parts[0] * 60 + parts[1];
          else if (parts.length === 3) duration = parts[0] * 3600 + parts[1] * 60 + parts[2];

          const thumbnail = `https://i.ytimg.com/vi/${vr.videoId}/maxresdefault.jpg`;

          tracks.push({
            id: vr.videoId,
            title,
            artist,
            thumbnail,
            duration: duration || 200,
          });

          if (tracks.length >= 15) break;
        }
      }
      if (tracks.length >= 15) break;
    }

    if (tracks.length === 0) {
      // Fallback: search in CURATED_TRACKS
      const queryLower = q.toLowerCase();
      const filtered = CURATED_TRACKS.filter(
        (t) => t.title.toLowerCase().includes(queryLower) || t.artist.toLowerCase().includes(queryLower)
      );
      return NextResponse.json({ tracks: filtered.length > 0 ? filtered : CURATED_TRACKS.slice(0, 5) });
    }

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error in YouTube search API:', error);
    // Safe graceful fallback
    const queryLower = q.toLowerCase();
    const filtered = CURATED_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(queryLower) || t.artist.toLowerCase().includes(queryLower)
    );
    return NextResponse.json({ tracks: filtered.length > 0 ? filtered : CURATED_TRACKS.slice(0, 5) });
  }
}
