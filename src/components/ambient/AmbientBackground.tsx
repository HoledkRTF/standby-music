'use client';

import React from 'react';
import { ColorPalette } from '../../hooks/useDominantColor';

interface AmbientBackgroundProps {
  palette: ColorPalette;
  isNightMode?: boolean;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ palette, isNightMode = false }) => {
  if (isNightMode) {
    return (
      <div className="fixed inset-0 pointer-events-none transition-colors duration-1000 bg-[#080000] overflow-hidden -z-10">
        <div
          className="absolute -top-[10%] -left-[10%] w-[120%] h-[120%] opacity-35 blur-[120px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #ff1e00 0%, #500000 55%, transparent 90%)',
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none transition-colors duration-1000 overflow-hidden -z-10"
      style={{ backgroundColor: palette.dark }}
    >
      {/* Primary animated orb */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[85vw] h-[85vw] max-w-[1000px] max-h-[1000px] rounded-full blur-[110px] opacity-65 transition-all duration-1000 animate-pulse"
        style={{
          background: `radial-gradient(circle, ${palette.primary} 0%, transparent 70%)`,
          animationDuration: '9s',
        }}
      />

      {/* Secondary fluid orb */}
      <div
        className="absolute -bottom-[20%] -right-[10%] w-[90vw] h-[90vw] max-w-[1100px] max-h-[1100px] rounded-full blur-[130px] opacity-55 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${palette.secondary} 0%, transparent 75%)`,
        }}
      />

      {/* Center accent highlight */}
      <div
        className="absolute top-[20%] left-[25%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full blur-[90px] opacity-35 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, ${palette.accent} 0%, transparent 65%)`,
        }}
      />

      {/* Glassmorphic dark veil */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[24px]" />
    </div>
  );
};
