'use client';

import React from 'react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose, isIOS }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-md bg-zinc-900/95 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl text-white transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </div>
            <h3 className="text-base font-bold tracking-tight">Full Screen Movie Mode</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="py-4 space-y-4 text-sm text-zinc-300">
          <p className="leading-relaxed">
            For true <span className="text-white font-semibold">100% borderless edge-to-edge</span> playback without browser bars or URL bars:
          </p>

          {isIOS ? (
            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tap the <span className="text-white font-semibold">Share button</span> (
                  <svg className="inline w-3.5 h-3.5 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  ) at the bottom of Safari or Arc.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Scroll down and tap <span className="text-white font-semibold">Add to Home Screen</span> (⊞).
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Open from your Home Screen for a native standalone app with <span className="text-white font-semibold">zero browser toolbars</span>!
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tap the browser menu (<span className="font-semibold text-white">⋮</span> in Chrome).
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Select <span className="text-white font-semibold">Install App</span> or <span className="text-white font-semibold">Add to Home screen</span>.
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white text-black font-semibold text-sm active:scale-98 transition-transform shadow-lg"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
