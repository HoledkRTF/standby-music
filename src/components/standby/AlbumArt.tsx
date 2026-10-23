'use client';

import React from 'react';

interface AlbumArtProps {
  thumbnailUrl: string;
  title: string;
  isPlaying: boolean;
  isNightMode?: boolean;
}

export const AlbumArt: React.FC<AlbumArtProps> = ({
  thumbnailUrl,
  title,
  isPlaying,
  isNightMode = false,
}) => {
  return (
    <div className="relative flex items-center justify-center w-full h-full p-2 md:p-6 select-none">
      <div
        className={`relative aspect-square w-full max-w-[280px] sm:max-w-[340px] md:max-w-[420px] max-h-[78vh] rounded-[2rem] overflow-hidden transition-all duration-700 ease-out shadow-2xl ${
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
        />

        {/* Gloss overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
      </div>
    </div>
  );
};
