import React, { useState } from 'react';
import { KanjiData, AppSettings } from '../types';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface LearnIntroProps {
  batch: KanjiData[];
  settings: AppSettings;
  onComplete: () => void;
  onAbort: () => void;
}

export const LearnIntro: React.FC<LearnIntroProps> = ({ batch, settings, onComplete, onAbort }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const themeColor = settings.theme === 'green' ? '#4ade80' : '#fbbf24';
  
  if (!batch || batch.length === 0) {
      return (
          <div className="flex-1 flex items-center justify-center font-bold font-mono opacity-50 uppercase tracking-widest">
              No Data Available
          </div>
      );
  }

  const currentKanji = batch[currentIndex];
  const isLast = currentIndex === batch.length - 1;

  const handleNext = () => {
      if (isLast) {
          onComplete();
      } else {
          setCurrentIndex(prev => prev + 1);
      }
  };

  const handlePrev = () => {
      if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full overflow-hidden p-2 md:p-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 pb-2 mb-4 shrink-0" style={{ borderColor: themeColor }}>
          <div className="flex items-center gap-3 md:gap-6">
             <button onClick={onAbort} className="select-none hover:bg-white/20 px-2 py-1 rounded transition-colors text-xs md:text-sm uppercase tracking-widest border border-current font-bold" style={{ borderColor: themeColor }}>[ ESC ] Abort</button>
             <div className="font-bold uppercase tracking-widest text-sm md:text-base">
                 New Data Entry
             </div>
          </div>
          <div className="font-mono text-sm md:text-base font-bold opacity-80 border px-3 py-1" style={{ borderColor: themeColor + '66' }}>
              CARD {currentIndex + 1} / {batch.length}
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 border-2 p-4 md:p-6 bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden min-h-0 relative animate-in fade-in zoom-in-95 duration-300" style={{ borderColor: themeColor }}>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-2 pb-16 flex flex-col">
              
              {/* Header Row: Kanji + Meaning */}
              <div className="flex items-end gap-6 border-b border-current/30 pb-4 pt-2 mb-6 shrink-0" style={{ borderColor: themeColor + '4D' }}>
                   <div className="text-6xl md:text-[9rem] font-bold crt-text-glow leading-none p-1 transition-all duration-300" style={{ color: themeColor, textShadow: `0 0 20px ${themeColor}` }}>
                       {currentKanji.char}
                   </div>
                   <div className="pb-1 min-w-0 flex-1">
                       <div className="text-2xl md:text-5xl font-bold opacity-90 uppercase tracking-widest leading-tight truncate mb-2">
                           {currentKanji.meaning}
                       </div>
                       <span className="text-xs md:text-sm uppercase font-bold tracking-widest bg-black text-current px-2 py-1 border shadow-sm" style={{ borderColor: themeColor, color: themeColor, boxShadow: `0 0 10px ${themeColor}40` }}>
                           JLPT {currentKanji.level}
                       </span>
                   </div>
              </div>

              {/* Readings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 shrink-0">
                  <div className="border p-4 bg-white/5 relative flex flex-col min-h-[100px]" style={{ borderColor: themeColor + '4D' }}>
                      <h3 className="absolute -top-3 left-4 bg-black px-2 text-xs md:text-sm uppercase tracking-widest font-bold border" style={{ color: themeColor, borderColor: themeColor + '4D' }}>
                          Onyomi (Chinese)
                      </h3>
                      <div className="text-xl md:text-3xl font-mono font-bold leading-tight break-words mt-2">
                          {currentKanji.onyomi.join(', ') || <span className="opacity-40 italic text-sm">-- None --</span>}
                      </div>
                  </div>
                  <div className="border p-4 bg-white/5 relative flex flex-col min-h-[100px]" style={{ borderColor: themeColor + '4D' }}>
                      <h3 className="absolute -top-3 left-4 bg-black px-2 text-xs md:text-sm uppercase tracking-widest font-bold border" style={{ color: themeColor, borderColor: themeColor + '4D' }}>
                          Kunyomi (Japanese)
                      </h3>
                      <div className="text-xl md:text-3xl font-mono font-bold leading-tight break-words mt-2">
                          {currentKanji.kunyomi.join(', ') || <span className="opacity-40 italic text-sm">-- None --</span>}
                      </div>
                  </div>
              </div>

               {/* Vocab List */}
               <div className="flex-1 flex flex-col min-h-0">
                   <h3 className="uppercase tracking-widest text-sm md:text-base opacity-80 border-b pb-2 mb-3 flex items-center justify-between font-bold shrink-0" style={{ borderColor: themeColor + '4D' }}>
                       Vocabulary Examples
                   </h3>
                   <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                       {currentKanji.examples.length === 0 ? (
                           <div className="opacity-40 italic text-sm font-bold uppercase py-4">-- No Examples Available --</div>
                       ) : (
                           currentKanji.examples.slice(0, 3).map((ex, i) => (
                               <div key={i} className="flex flex-col sm:flex-row sm:items-baseline justify-between p-3 border-l-4 bg-white/5" style={{ borderColor: themeColor + '66' }}>
                                   <div className="flex gap-3 md:gap-4 items-baseline mb-1 sm:mb-0">
                                      <span className="font-bold text-xl md:text-2xl" style={{ color: themeColor, textShadow: `0 0 8px ${themeColor}80` }}>{ex.word}</span>
                                      <span className="font-mono text-sm md:text-base opacity-70 font-bold">[{ex.reading}]</span>
                                   </div>
                                   <span className="text-right font-bold opacity-90 text-base md:text-lg sm:ml-4 leading-tight">{ex.meaning}</span>
                               </div>
                           ))
                       )}
                   </div>
               </div>
          </div>
          
          {/* Action Bar - Fixed at bottom of card */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 bg-black/90 backdrop-blur flex justify-between items-center" style={{ borderColor: themeColor + '80' }}>
              <button 
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`select-none px-6 py-2 border flex items-center gap-2 font-bold uppercase transition-all ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed border-transparent' : 'hover:bg-white/10 active:scale-95'}`}
                  style={{ borderColor: currentIndex !== 0 ? themeColor + '80' : undefined }}
              >
                  <ArrowLeft size={18} /> Prev
              </button>
              
              <button 
                  onClick={handleNext}
                  className="select-none px-8 py-3 font-bold text-base md:text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-3 text-black active:scale-95"
                  style={{ backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}80` }}
              >
                  {isLast ? 'Begin Quiz' : 'Next Card'} {isLast ? null : <ArrowRight size={20} />}
              </button>
          </div>
      </div>
    </div>
  );
};
