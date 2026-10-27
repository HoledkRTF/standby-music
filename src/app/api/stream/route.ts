import { NextRequest, NextResponse } from 'next/server';
import http, { IncomingMessage } from 'http';
import https from 'https';
import { Ytdl } from '@distube/ytdl-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface CachedFormat {
  url: string;
  contentLength: number;
  mimeType: string;
  expiresAt: number;
}

const formatCache = new Map<string, CachedFormat>();
const yt = new Ytdl();

async function resolveAudioFormat(videoId: string, forceFresh = false): Promise<CachedFormat> {
  if (!forceFresh) {
    const cached = formatCache.get(videoId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached;
    }
  }

  const info = await yt.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
  const audioFormats = info.formats.filter((f) => !f.hasVideo && f.hasAudio);

  // Prefer itag 140 (128kbps AAC / audio/mp4) - Apple hardware accelerated native format
  const target =
    audioFormats.find((f) => f.itag === 140) ||
    audioFormats.find((f) => f.mimeType && f.mimeType.includes('audio/mp4')) ||
    audioFormats[0];

  if (!target || !target.url) {
    throw new Error(`No compatible audio format found for video ${videoId}`);
  }

  const result: CachedFormat = {
    url: target.url,
    contentLength: parseInt(String(target.contentLength || '0'), 10),
    mimeType: 'audio/mp4',
    expiresAt: Date.now() + 25 * 60 * 1000, // 25 minutes TTL
  };

  formatCache.set(videoId, result);
  return result;
}

function nodeStreamToWeb(nodeStream: IncomingMessage): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      nodeStream.on('end', () => {
        controller.close();
      });
      nodeStream.on('error', (err) => {
        controller.error(err);
      });
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('v');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId parameter (v)' }, { status: 400 });
  }

  try {
    let format = await resolveAudioFormat(videoId);
    const rangeHeader = request.headers.get('range');

    const fetchStream = (formatUrl: string): Promise<{ res: IncomingMessage; statusCode: number }> => {
      return new Promise((resolve, reject) => {
        const urlObj = new URL(formatUrl);
        const headers: Record<string, string> = {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        };

        if (rangeHeader) {
          headers['Range'] = rangeHeader;
        }

        const req = https.request(
          {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers,
          },
          (res) => {
            resolve({ res, statusCode: res.statusCode || 200 });
          }
        );

        req.on('error', reject);
        req.end();
      });
    };

    let { res: upstreamRes, statusCode } = await fetchStream(format.url);

    // If upstream returned 403 Forbidden (URL expired or invalidated), retry once with fresh URL
    if (statusCode === 403) {
      formatCache.delete(videoId);
      format = await resolveAudioFormat(videoId, true);
      const retryResult = await fetchStream(format.url);
      upstreamRes = retryResult.res;
      statusCode = retryResult.statusCode;
    }

    if (statusCode !== 200 && statusCode !== 206) {
      return NextResponse.json(
        { error: 'Upstream stream error', statusCode },
        { status: 502 }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'audio/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    if (upstreamRes.headers['content-range']) {
      responseHeaders.set('Content-Range', upstreamRes.headers['content-range'] as string);
    }
    if (upstreamRes.headers['content-length']) {
      responseHeaders.set('Content-Length', upstreamRes.headers['content-length'] as string);
    }

    const webStream = nodeStreamToWeb(upstreamRes);

    return new Response(webStream, {
      status: statusCode,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Audio stream error for video:', videoId, error?.message || error);
    return NextResponse.json(
      { error: 'Failed to stream audio', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
