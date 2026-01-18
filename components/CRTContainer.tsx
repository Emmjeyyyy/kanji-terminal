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
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center overflow-hidden">
      <div 
        className={`relative w-[98vw] h-[98vh] max-w-[1600px] rounded-lg md:rounded-xl border-2 ${themeConfig.border} overflow-hidden ${themeConfig.bg} ${themeConfig.text} selection:bg-[var(--theme-color)] selection:text-black shadow-[0_0_50px_rgba(0,0,0,0.8)]`}
        style={{ '--theme-color': themeConfig.hex } as React.CSSProperties}
      >
        {/* CRT Screen Effects */}
        {crtEnabled && (
          <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden rounded-lg md:rounded-xl">
            {/* Scanlines */}
            {scanlines && (
              <div 
                className="absolute inset-0 z-10 opacity-10 md:opacity-15"
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
                background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.4) 100%)'
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

        {/* Main Content Area - Reduced padding for better fit */}
        <div className={`relative z-10 h-full flex flex-col p-4 md:p-6 lg:p-8 ${themeConfig.glow}`}>
          <div className="w-full h-full flex flex-col mx-auto">
              {children}
          </div>
        </div>
      </div>
    </div>
  );
};