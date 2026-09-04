import React, { useState } from 'react';
import { AppSettings } from '../types';
import { ArrowLeft, Play, AlertTriangle } from 'lucide-react';

interface ReviewSetupProps {
  learnedCount: number;
  difficultCount: number;
  settings: AppSettings;
  onStart: (type: string, count: 10 | 15 | 20 | 'all') => void;
  onBack: () => void;
}

export const ReviewSetup: React.FC<ReviewSetupProps> = ({ learnedCount, difficultCount, settings, onStart, onBack }) => {
  const [selectedType, setSelectedType] = useState<string>('random');
  const [selectedCount, setSelectedCount] = useState<10 | 15 | 20 | 'all'>(10);

  const themeColor = settings.theme === 'green' ? '#4ade80' : '#fbbf24';

  const types = [
    { id: 'random', label: 'RANDOM MIX', desc: 'A balanced mix of all question types.' },
    { id: 'meaning', label: 'KANJI → MEANING', desc: 'Given a kanji, identify its English meaning.' },
    { id: 'reverse', label: 'MEANING → KANJI', desc: 'Given an English meaning, identify the kanji.' },
    { id: 'reading', label: 'KANJI → READING', desc: 'Given a kanji, identify its Japanese reading.' },
    { id: 'reading_reverse', label: 'READING → KANJI', desc: 'Given a Japanese reading, identify the kanji.' },
    { id: 'difficult', label: 'DIFFICULT KANJI', desc: 'Focus strictly on kanji you previously missed.' }
  ];

  const counts: (10 | 15 | 20 | 'all')[] = [10, 15, 20, 'all'];

  // Automatically adjust count if they pick difficult but have less than the selected count
  const getMaxAvailable = () => {
    return selectedType === 'difficult' ? difficultCount : learnedCount;
  };

  const handleStart = () => {
    onStart(selectedType, selectedCount);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 md:gap-8 animate-in fade-in duration-500 w-full max-w-4xl mx-auto p-4 relative">
      
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-3xl md:text-5xl font-bold uppercase crt-text-glow tracking-tighter mb-2" style={{ color: themeColor, textShadow: `0 0 15px ${themeColor}80` }}>
          Review Session
        </h2>
        <div className="flex gap-4 justify-center text-sm md:text-base font-mono font-bold opacity-80 uppercase tracking-widest">
           <span>{learnedCount} Learned</span>
           <span className="text-red-500 flex items-center gap-1"><AlertTriangle size={14}/> {difficultCount} Difficult</span>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_16rem] gap-6 md:gap-8 min-h-0 flex-1 pb-4">
        
        {/* Left Column: Quiz Type */}
        <div className="flex flex-col border-2 p-4 md:p-6 bg-black/80 backdrop-blur min-h-0" style={{ borderColor: themeColor + '80' }}>
            <h3 className="uppercase tracking-widest text-sm font-bold border-b-2 pb-2 mb-4 shrink-0" style={{ borderColor: themeColor + '4D' }}>
                Select Quiz Type
            </h3>
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-2 p-2 -m-2">
                {types.map(t => {
                    const isDisabled = t.id === 'difficult' && difficultCount === 0;
                    if (isDisabled) return null;
                    
                    const isSelected = selectedType === t.id;
                    return (
                        <button
                            key={t.id}
                            disabled={isDisabled}
                            onClick={() => setSelectedType(t.id)}
                            className={`p-3 border-2 text-left transition-all shrink-0 ${isDisabled ? 'opacity-30 cursor-not-allowed border-current/20' : isSelected ? 'text-black shadow-[0_0_15px_currentColor_inset] scale-[1.02]' : 'hover:bg-white/10'}`}
                            style={{ 
                                borderColor: isSelected ? themeColor : (isDisabled ? 'inherit' : themeColor + '4D'),
                                backgroundColor: isSelected ? themeColor : 'transparent' 
                            }}
                        >
                            <div className="font-bold text-base md:text-lg tracking-widest uppercase mb-1 flex justify-between items-center">
                                <span>{t.label}</span>
                            </div>
                            <div className={`text-xs font-mono font-bold ${isSelected ? 'opacity-80' : 'opacity-50'}`}>
                                {t.desc}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Right Column: Quantity & Actions */}
        <div className="flex flex-col gap-6 justify-between min-h-0">
            <div className="border-2 p-4 md:p-6 bg-black/80 backdrop-blur flex-1 flex flex-col min-h-0" style={{ borderColor: themeColor + '80' }}>
                <h3 className="uppercase tracking-widest text-sm font-bold border-b-2 pb-2 mb-4" style={{ borderColor: themeColor + '4D' }}>
                    Data Volume
                </h3>
                <div className="grid grid-cols-2 gap-3 flex-1">
                    {counts.map(c => {
                        const isSelected = selectedCount === c;
                        const label = c === 'all' ? 'ALL' : c.toString();
                        return (
                            <button
                                key={c}
                                onClick={() => setSelectedCount(c)}
                                className={`py-4 border-2 text-center font-bold text-xl md:text-2xl transition-all flex items-center justify-center ${isSelected ? 'text-black shadow-[0_0_10px_currentColor]' : 'hover:bg-white/10'}`}
                                style={{ 
                                    borderColor: isSelected ? themeColor : themeColor + '4D',
                                    backgroundColor: isSelected ? themeColor : 'transparent' 
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
                
                <div className="mt-6 text-xs md:text-sm font-mono opacity-60 font-bold uppercase text-center shrink-0">
                    Available Pool: {getMaxAvailable()}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 shrink-0">
                <button 
                    onClick={handleStart}
                    disabled={getMaxAvailable() === 0}
                    className={`select-none py-4 border-2 font-bold text-lg md:text-xl uppercase tracking-widest transition-all flex items-center justify-center gap-3 w-full ${getMaxAvailable() === 0 ? 'opacity-50 cursor-not-allowed border-current/50' : 'text-black active:scale-95'}`}
                    style={getMaxAvailable() > 0 ? { backgroundColor: themeColor, borderColor: themeColor, boxShadow: `0 0 20px ${themeColor}80` } : undefined}
                >
                    <Play fill="currentColor" size={20} /> Begin Review
                </button>
                <button 
                    onClick={onBack}
                    className="select-none py-3 border font-bold text-sm uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95 w-full flex items-center justify-center gap-2"
                    style={{ borderColor: themeColor + '80' }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
