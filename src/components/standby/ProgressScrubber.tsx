'use client';

import React, { useRef, useState } from 'react';
import { formatTime, formatRemainingTime } from '../../utils/youtube';

interface ProgressScrubberProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  isNightMode?: boolean;
}

export const ProgressScrubber: React.FC<ProgressScrubberProps> = ({
  currentTime,
  duration,
  onSeek,
  isNightMode = false,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);

  const displayTime = isDragging && dragTime !== null ? dragTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, (displayTime / duration) * 100) : 0;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateSeek(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateSeek(e);
    }
  };

  const handlePointerUp = () => {
    if (isDragging && dragTime !== null) {
      onSeek(dragTime);
    }
    setIsDragging(false);
    setDragTime(null);
  };

  const updateSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!barRef.current || duration <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const clientX = Math.max(rect.left, Math.min(e.clientX, rect.right));
    const ratio = (clientX - rect.left) / rect.width;
    const targetSeconds = Math.max(0, Math.min(duration, ratio * duration));
    setDragTime(targetSeconds);
  };

  return (
    <div className="w-full space-y-1.5 select-none">
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-6 flex items-center cursor-pointer group"
      >
        {/* Track Bar */}
        <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-white/20 group-hover:h-2 transition-all">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isNightMode ? 'bg-red-500 shadow-[0_0_8px_#ff0000]' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full transition-transform ${
            isDragging ? 'scale-125' : 'group-hover:scale-110'
          } ${
            isNightMode ? 'bg-red-500 shadow-[0_0_10px_#ff0000]' : 'bg-white shadow-md'
          }`}
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Time indicators */}
      <div className="flex items-center justify-between text-xs font-semibold tabular-nums tracking-wider px-0.5">
        <span className={isNightMode ? 'text-red-500/80' : 'text-white/60'}>
          {formatTime(displayTime)}
        </span>
        <span className={isNightMode ? 'text-red-500/80' : 'text-white/60'}>
          {formatRemainingTime(displayTime, duration)}
        </span>
      </div>
    </div>
  );
};
