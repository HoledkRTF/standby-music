import { LyricsLine } from '../types/music';

export function parseLrc(lrcContent: string): LyricsLine[] {
  if (!lrcContent) return [];
  const lines = lrcContent.split('\n');
  const result: LyricsLine[] = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)];
    const text = line.replace(timeRegex, '').trim();
    if (!text && matches.length === 0) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const msPart = match[3] ? match[3].padEnd(3, '0').slice(0, 3) : '000';
      const ms = parseInt(msPart, 10);
      const totalSeconds = minutes * 60 + seconds + ms / 1000;
      if (text) {
        result.push({ time: totalSeconds, text });
      }
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}
