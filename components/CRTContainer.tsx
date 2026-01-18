import React, { ReactNode } from 'react';
import { AppSettings } from '../types';

interface CRTContainerProps {
  children: ReactNode;
  settings: AppSettings;
}

export const CRTContainer: React.FC<CRTContainerProps> = ({ children, settings }) => {
  const { theme, crtEnabled, scanlines, flicker } = settings;

  const themeConfig = {
    green: {
      text: 'text-green-400',
      border: 'border-green-800',
      bg: 'bg-black',
      glow: 'drop-shadow-[0_0_2px_rgba(74,222,128,0.4)]',
      hex: '#4ade80' // Tailwind green-400
    },
    amber: {
      text: 'text-amber-400',
      border: 'border-amber-800',
      bg: 'bg-black',
      glow: 'drop-shadow-[0_0_2px_rgba(251,191,36,0.4)]',
      hex: '#fbbf24' // Tailwind amber-400
    }
  }[theme];

  return (
    <div 
      className={`relative w-full h-[100dvh] overflow-hidden ${themeConfig.bg} ${themeConfig.text} selection:bg-[var(--theme-color)] selection:text-black`}
      style={{ '--theme-color': themeConfig.hex } as React.CSSProperties}
    >
      {/* CRT Screen Effects */}
      {crtEnabled && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden rounded-lg">
          {/* Scanlines */}
          {scanlines && (
            <div 
              className="absolute inset-0 z-10 opacity-20"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 50%)',
                backgroundSize: '100% 4px'
              }} 
            />
          )}
          
          {/* Phosphor Bloom/Vignette */}
          <div 
            className="absolute inset-0 z-20"
            style={{
              background: 'radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.8) 100%)'
            }} 
          />
          
          {/* Flicker */}
          {flicker && <div className="absolute inset-0 z-30 bg-white/5 mix-blend-overlay crt-flicker pointer-events-none" />}
          
          {/* RGB Shift (Subtle) */}
          <div className="absolute inset-0 z-0 opacity-5"
             style={{
                 background: 'linear-gradient(90deg, rgba(255,0,0,1), rgba(0,255,0,1), rgba(0,0,255,1))',
                 backgroundSize: '3px 100%'
             }}
          />
        </div>
      )}

      {/* Main Content Area - Full Height, No Window Scroll */}
      <div className={`relative z-10 h-full flex flex-col p-2 md:p-6 ${themeConfig.glow}`}>
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
            {children}
        </div>
      </div>
    </div>
  );
};