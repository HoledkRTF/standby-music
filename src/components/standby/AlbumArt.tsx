'use client';

import React from 'react';

interface AlbumArtProps {
  thumbnailUrl: string;
  title: string;
  isPlaying: boolean;
  isNightMode?: boolean;
  isLandscape?: boolean;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({
  thumbnailUrl,
  title,
  isPlaying,
  isNightMode = false,
}) => {
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
        src={thumbnailUrl}
        alt={title}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isNightMode
            ? 'filter grayscale contrast-125 brightness-75 sepia hue-rotate-[320deg] saturate-[300%]'
            : ''
        }`}
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
        }}
      />

      {/* Subtle Apple-style gloss sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
    </div>
  );
};
