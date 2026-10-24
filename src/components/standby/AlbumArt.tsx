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
  isLandscape = false,
}) => {
  return (
    <div className="relative flex items-center justify-center w-full h-full p-2 select-none">
      <div
        className={`relative aspect-square rounded-[1.75rem] overflow-hidden transition-all duration-700 ease-out shadow-2xl ${
          isLandscape
            ? 'h-[75vh] w-[75vh] max-h-[250px] max-w-[250px] sm:max-h-[290px] sm:max-w-[290px]'
            : 'w-full max-w-[280px] sm:max-w-[340px] max-h-[42vh]'
        } ${
          isPlaying ? 'scale-100' : 'scale-[0.94] opacity-85'
        } ${
          isNightMode
            ? 'shadow-[0_20px_50px_rgba(255,0,0,0.25)] border border-red-900/40'
            : 'shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-white/15'
        }`}
      >
        <img
          src={thumbnailUrl}
          alt={title}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isNightMode ? 'filter grayscale contrast-125 brightness-75 sepia hue-rotate-[320deg] saturate-[300%]' : ''
          }`}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
          }}
        />

        {/* Gloss overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
      </div>
    </div>
  );
};
