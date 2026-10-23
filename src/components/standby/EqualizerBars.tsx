'use client';

import React from 'react';

interface EqualizerBarsProps {
  isPlaying: boolean;
  isNightMode?: boolean;
}

export const EqualizerBars: React.FC<EqualizerBarsProps> = ({ isPlaying, isNightMode = false }) => {
  return (
    <div className="flex items-end space-x-1 h-3.5 px-1">
      <span
        className={`w-1 rounded-full transition-all duration-300 ${
          isNightMode ? 'bg-red-500' : 'bg-white'
        } ${isPlaying ? 'animate-bounce' : 'h-1.5'}`}
        style={{
          height: isPlaying ? '14px' : '4px',
          animationDuration: '600ms',
          animationDelay: '0ms',
        }}
      />
      <span
        className={`w-1 rounded-full transition-all duration-300 ${
          isNightMode ? 'bg-red-500' : 'bg-white'
        } ${isPlaying ? 'animate-bounce' : 'h-3'}`}
        style={{
          height: isPlaying ? '10px' : '8px',
          animationDuration: '450ms',
          animationDelay: '150ms',
        }}
      />
      <span
        className={`w-1 rounded-full transition-all duration-300 ${
          isNightMode ? 'bg-red-500' : 'bg-white'
        } ${isPlaying ? 'animate-bounce' : 'h-2'}`}
        style={{
          height: isPlaying ? '16px' : '6px',
          animationDuration: '750ms',
          animationDelay: '300ms',
        }}
      />
      <span
        className={`w-1 rounded-full transition-all duration-300 ${
          isNightMode ? 'bg-red-500' : 'bg-white'
        } ${isPlaying ? 'animate-bounce' : 'h-1'}`}
        style={{
          height: isPlaying ? '8px' : '3px',
          animationDuration: '500ms',
          animationDelay: '75ms',
        }}
      />
    </div>
  );
};
