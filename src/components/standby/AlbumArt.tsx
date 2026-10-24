'use client';

import React, { useState, useEffect } from 'react';

interface AlbumArtProps {
  thumbnailUrl: string;
  title: string;
  isPlaying: boolean;
  isNightMode?: boolean;
  isLandscape?: boolean;
}

const getHighResUrl = (url: string): string => {
  if (!url) return '';
  // Convert standard YouTube low-res thumbnail into crisp maxresdefault (1280x720)
  const ytMatch = url.match(/\/vi\/([a-zA-Z0-9_-]{11})\//);
  if (ytMatch) {
    return `https://i.ytimg.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
  }
  // If it's a Google / YouTube Music CDN thumbnail with dimension parameters (e.g. =w120-h120 or =s120)
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    return url.replace(/=w\d+-h\d+/g, '=w1200-h1200').replace(/=s\d+/g, '=s1200');
  }
  return url;
};

export const AlbumArt: React.FC<AlbumArtProps> = ({
  thumbnailUrl,
  title,
  isPlaying,
  isNightMode = false,
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(() => getHighResUrl(thumbnailUrl));
  const [attempt, setAttempt] = useState<number>(0);

  useEffect(() => {
    setCurrentSrc(getHighResUrl(thumbnailUrl));
    setAttempt(0);
  }, [thumbnailUrl]);

  const handleImageError = () => {
    const ytMatch = thumbnailUrl.match(/\/vi\/([a-zA-Z0-9_-]{11})\//);
    if (ytMatch) {
      const vid = ytMatch[1];
      if (attempt === 0) {
        // Step 1: maxresdefault failed, try sddefault (640x480)
        setAttempt(1);
        setCurrentSrc(`https://i.ytimg.com/vi/${vid}/sddefault.jpg`);
        return;
      }
      if (attempt === 1) {
        // Step 2: sddefault failed, try hqdefault (480x360)
        setAttempt(2);
        setCurrentSrc(`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`);
        return;
      }
    }
    // Final fallback to original url or unsplash placeholder
    if (currentSrc !== thumbnailUrl && thumbnailUrl) {
      setCurrentSrc(thumbnailUrl);
    } else {
      setCurrentSrc('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80');
    }
  };

  return (
    <div
      className={`relative w-full h-full aspect-square rounded-[24px] sm:rounded-[28px] overflow-hidden transition-all duration-500 ease-out shadow-2xl select-none ${
        isPlaying ? 'scale-100' : 'scale-[0.96] opacity-90'
      } ${
        isNightMode
          ? 'shadow-[0_15px_40px_rgba(255,0,0,0.3)] border border-red-500/30'
          : 'shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10'
      }`}
    >
      <img
        src={currentSrc}
        alt={title}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isNightMode
            ? 'filter grayscale contrast-125 brightness-75 sepia hue-rotate-[320deg] saturate-[300%]'
            : ''
        }`}
      />

      {/* Subtle Apple-style gloss sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
    </div>
  );
};
