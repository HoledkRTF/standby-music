export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

export function parseYouTubeUrl(url: string): { videoId: string | null; playlistId: string | null } {
  if (!url) return { videoId: null, playlistId: null };
  const videoId = extractYouTubeId(url);
  const playlistMatch = url.match(/[?&]list=([^#&?]+)/);
  const playlistId = playlistMatch ? playlistMatch[1] : null;
  return { videoId, playlistId };
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function formatRemainingTime(current: number, duration: number): string {
  if (isNaN(duration) || duration <= 0) return '-0:00';
  const remaining = Math.max(0, duration - (isNaN(current) ? 0 : current));
  return `-${formatTime(remaining)}`;
}
