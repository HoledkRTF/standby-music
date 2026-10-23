'use client';

import { useState, useEffect } from 'react';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  textMuted: string;
}

const DEFAULT_PALETTES: ColorPalette[] = [
  { primary: '#3b1d60', secondary: '#5e239d', accent: '#9b5de5', dark: '#0c0714', textMuted: 'rgba(255,255,255,0.6)' },
  { primary: '#0a3663', secondary: '#006494', accent: '#00a6fb', dark: '#03101e', textMuted: 'rgba(255,255,255,0.6)' },
  { primary: '#4f131a', secondary: '#780000', accent: '#c1121f', dark: '#140305', textMuted: 'rgba(255,255,255,0.6)' },
  { primary: '#153b2a', secondary: '#2d6a4f', accent: '#52b788', dark: '#06130d', textMuted: 'rgba(255,255,255,0.6)' },
  { primary: '#4a3000', secondary: '#b67a00', accent: '#ffb703', dark: '#140c00', textMuted: 'rgba(255,255,255,0.6)' },
];

export function useDominantColor(thumbnailUrl?: string) {
  const [palette, setPalette] = useState<ColorPalette>(DEFAULT_PALETTES[0]);

  useEffect(() => {
    if (!thumbnailUrl) {
      setPalette(DEFAULT_PALETTES[0]);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = thumbnailUrl;

    img.onload = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, 32, 32);
        const imgData = ctx.getImageData(0, 0, 32, 32).data;

        let totalR = 0, totalG = 0, totalB = 0, count = 0;
        // Sample every 4th pixel for speed
        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip completely transparent or near black / pure white
          if (a > 128 && (r + g + b > 40) && (r + g + b < 720)) {
            totalR += r;
            totalG += g;
            totalB += b;
            count++;
          }
        }

        if (count > 0) {
          const avgR = Math.floor(totalR / count);
          const avgG = Math.floor(totalG / count);
          const avgB = Math.floor(totalB / count);

          const primary = `rgb(${avgR}, ${avgG}, ${avgB})`;
          const secondary = `rgb(${Math.min(255, avgR + 35)}, ${Math.min(255, avgG + 25)}, ${Math.min(255, avgB + 45)})`;
          const accent = `rgb(${Math.min(255, Math.floor(avgR * 1.3))}, ${Math.min(255, Math.floor(avgG * 1.3))}, ${Math.min(255, Math.floor(avgB * 1.3))})`;
          const dark = `rgb(${Math.floor(avgR * 0.12)}, ${Math.floor(avgG * 0.12)}, ${Math.floor(avgB * 0.12)})`;

          setPalette({
            primary,
            secondary,
            accent,
            dark,
            textMuted: 'rgba(255,255,255,0.65)',
          });
        }
      } catch (e) {
        // Fallback using string hash
        let hash = 0;
        for (let i = 0; i < thumbnailUrl.length; i++) {
          hash = (hash << 5) - hash + thumbnailUrl.charCodeAt(i);
          hash |= 0;
        }
        const index = Math.abs(hash) % DEFAULT_PALETTES.length;
        setPalette(DEFAULT_PALETTES[index]);
      }
    };

    img.onerror = () => {
      if (isMounted) setPalette(DEFAULT_PALETTES[0]);
    };

    return () => {
      isMounted = false;
    };
  }, [thumbnailUrl]);

  return palette;
}
