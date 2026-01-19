import React, { useState } from 'react';
import { KanjiData, UserProgress } from '../types';
import { kanjiList } from '../data/kanji';
import { Search, Filter, Database } from 'lucide-react';

interface LearnModeProps {
  progress: Record<string, UserProgress>;
}

export const LearnMode: React.FC<LearnModeProps> = ({ progress }) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'N5' | 'N4'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKanji, setSelectedKanji] = useState<KanjiData | null>(null);

  const filtered = kanjiList.filter(k => {
    const matchesLevel = filterLevel === 'ALL' || k.level === filterLevel;
    const matchesSearch = k.meaning.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          k.char.includes(searchTerm) ||
                          k.onyomi.some(r => r.includes(searchTerm));
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 overflow-hidden">
      {/* Sidebar List - Top on mobile (30% height), Left on desktop (33% width) */}
      <div className="w-full md:w-1/3 h-[30%] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-current/30 pb-2 md:pb-0 md:pr-4 min-h-0 shrink-0">
         <div className="mb-2 md:mb-4 flex flex-col gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-[var(--theme-color)] opacity-20 blur-sm transition-opacity group-focus-within:opacity-50"></div>
                <div className="relative flex items-center bg-black/80 border border-current p-2 md:p-3 group-focus-within:shadow-[0_0_15px_var(--theme-color)] transition-shadow duration-300">
                    <span className="mr-3 text-xl md:text-2xl animate-pulse text-[var(--theme-color)]">{'>'}</span>
                    <input 
                        type="text" 
                        placeholder="SEARCH..." 
                        className="w-full bg-transparent border-none font-mono text-xl md:text-2xl focus:outline-none placeholder:opacity-50 uppercase text-[var(--theme-color)] font-bold"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        spellCheck={false}
                    />
                    <Search className="w-6 h-6 md:w-7 md:h-7 opacity-70" />
                </div>
            </div>

            {/* Filter Toggles */}
            <div className="flex items-center justify-between border-b border-current/30 pb-2">
                <div className="flex items-center gap-2 opacity-90">
                    <Filter className="w-4 h-4" />
                    <span className="text-xs md:text-sm uppercase tracking-widest hidden sm:inline font-bold">Filter</span>
                </div>
                <div className="flex gap-2">
                    {['ALL', 'N5', 'N4'].map(lvl => (
                        <button 
                            key={lvl}
                            onClick={() => setFilterLevel(lvl as any)}
                            className={`text-xs md:text-sm px-3 md:px-4 py-1.5 border transition-all uppercase duration-200 tracking-wider font-bold ${
                                filterLevel === lvl 
                                ? 'bg-[var(--theme-color)] text-black border-transparent shadow-[0_0_10px_var(--theme-color)] scale-105' 
                                : 'border-current/50 text-current hover:border-[var(--theme-color)] hover:shadow-[0_0_8px_var(--theme-color)] hover:bg-[var(--theme-color)]/10'
                            }`}
                        >
                            {lvl}
                        </button>
                    ))}
                </div>
            </div>
         </div>
         
         {/* List Items */}
         <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar min-h-0">
            <div className="text-xs uppercase opacity-60 mb-2 tracking-widest text-right sticky top-0 bg-black/90 z-10 py-1 font-bold">
                {filtered.length} Found
            </div>
            {filtered.map(k => (
                <button
                    key={k.id}
                    onClick={() => setSelectedKanji(k)}
                    className={`w-full text-left p-3 md:p-4 border flex items-center justify-between group transition-all duration-200 relative overflow-hidden ${
                        selectedKanji?.id === k.id 
                        ? 'bg-[var(--theme-color)]/10 border-[var(--theme-color)] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' 
                        : 'border-transparent border-b-current/20 hover:border-[var(--theme-color)] hover:shadow-[0_0_10px_var(--theme-color)_inset] hover:bg-[var(--theme-color)]/5'
                    }`}
                >
                    {selectedKanji?.id === k.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[var(--theme-color)] shadow-[0_0_10px_var(--theme-color)]"></div>}
                    <div className="flex items-baseline gap-4 pl-2">
                        <span className={`text-2xl md:text-4xl font-bold font-mono transition-colors ${selectedKanji?.id === k.id ? 'text-[var(--theme-color)] crt-text-glow' : 'group-hover:text-[var(--theme-color)]'}`}>{k.char}</span>
                        <span className="text-xs md:text-sm uppercase opacity-60 tracking-wider font-bold">[{k.level}]</span>
                    </div>
                    <span className="text-sm md:text-lg opacity-90 group-hover:opacity-100 font-mono truncate max-w-[50%] text-right font-bold">{k.meaning}</span>
                </button>
            ))}
            {filtered.length === 0 && (
                <div className="text-center opacity-60 py-10 border border-dashed border-current/30">
                    <div className="text-3xl mb-2">?</div>
                    <p className="text-sm uppercase font-bold">No Data</p>
                </div>
            )}
         </div>
      </div>

      {/* Detail View - Bottom on mobile (70% height), Right on desktop (66% width) */}
      <div className="flex-1 h-[70%] md:h-full pl-0 md:pl-2 min-h-0 flex flex-col overflow-hidden relative">
         {selectedKanji ? (
             <div className="flex flex-col h-full gap-3 md:gap-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-1">
                
                {/* Header Block: Larger Min Height */}
                <div className="flex-[0_0_auto] border-b-2 border-current pb-4 flex justify-between items-stretch relative overflow-hidden min-h-[140px] md:min-h-[200px]">
                    <div className="absolute top-0 right-0 text-[clamp(8rem,20vh,16rem)] opacity-10 font-bold select-none pointer-events-none -mt-6 -mr-6 text-[var(--theme-color)] leading-none">{selectedKanji.char}</div>
                    
                    <div className="relative z-10 flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs md:text-sm bg-[var(--theme-color)] text-black px-2 py-0.5 font-bold rounded-sm inline-block tracking-widest shadow-[0_0_5px_var(--theme-color)]">JLPT {selectedKanji.level}</span>
                            <span className="text-xs md:text-sm border border-current px-2 py-0.5 opacity-80 font-mono font-bold">ID: {selectedKanji.id.toUpperCase()}</span>
                        </div>
                        {/* Scalable Main Char - Increased Size */}
                        <h2 className="text-[clamp(6rem,16vh,12rem)] font-bold leading-none crt-text-glow text-[var(--theme-color)] mt-auto">{selectedKanji.char}</h2>
                    </div>
                    
                    <div className="text-right relative z-10 max-w-[60%] flex flex-col justify-between items-end pl-4">
                        <div className="text-[clamp(2rem,5vh,4rem)] font-bold leading-tight break-words">{selectedKanji.meaning}</div>
                        
                        {/* Mastery Progress Bar */}
                        {(() => {
                            const count = progress[selectedKanji.id]?.correctCount ?? 0;
                            const percent = Math.min((count / 100) * 100, 100);
                            const isMastered = count >= 100;
                            
                            return (
                                <div className="w-full max-w-[240px] mt-2">
                                    <div className="flex justify-end items-center gap-2 mb-1 opacity-90">
                                        {isMastered ? (
                                            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[var(--theme-color)] animate-pulse shadow-[0_0_5px_var(--theme-color)] px-1">MASTERY ACHIEVED</span>
                                        ) : (
                                            <span className="text-[10px] font-mono uppercase opacity-60 font-bold tracking-widest">SYNCING...</span>
                                        )}
                                        <span className="text-sm md:text-base font-mono font-bold leading-none">{count}<span className="text-[10px] opacity-60">/100</span></span>
                                    </div>
                                    <div className="h-3 md:h-4 w-full bg-black border border-current/40 p-0.5 relative">
                                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[length:4px_100%]"></div>
                                        <div 
                                            className={`h-full bg-[var(--theme-color)] transition-all duration-700 ease-out relative ${isMastered ? 'shadow-[0_0_10px_var(--theme-color)]' : 'opacity-80'}`}
                                            style={{ width: `${percent}%` }}
                                        >
                                             <div className="absolute inset-0 bg-white/20 w-full h-full opacity-50 bg-[linear-gradient(0deg,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Readings: Larger Height & Text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 shrink-0 flex-[0_0_auto]">
                    <div className="space-y-2 border border-current/30 p-3 md:p-5 bg-white/5 relative hover:border-[var(--theme-color)] transition-all flex flex-col justify-center min-h-[80px] md:min-h-[100px]">
                        <h3 className="absolute -top-2.5 left-3 bg-black px-2 text-xs md:text-sm uppercase tracking-widest text-[var(--theme-color)] border border-current/30 font-bold">Onyomi</h3>
                        <div className="flex flex-wrap gap-2 md:gap-3 mt-1">
                            {selectedKanji.onyomi.map(r => (
                                <span key={r} className="font-mono text-xl md:text-3xl px-3 py-1 border border-current/60 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_10px_var(--theme-color)] transition-all cursor-default font-bold">{r}</span>
                            ))}
                            {selectedKanji.onyomi.length === 0 && <span className="opacity-40 italic text-sm md:text-base">-- NO DATA --</span>}
                        </div>
                    </div>
                    <div className="space-y-2 border border-current/30 p-3 md:p-5 bg-white/5 relative hover:border-[var(--theme-color)] transition-all flex flex-col justify-center min-h-[80px] md:min-h-[100px]">
                         <h3 className="absolute -top-2.5 left-3 bg-black px-2 text-xs md:text-sm uppercase tracking-widest text-[var(--theme-color)] border border-current/30 font-bold">Kunyomi</h3>
                        <div className="flex flex-wrap gap-2 md:gap-3 mt-1">
                            {selectedKanji.kunyomi.map(r => (
                                <span key={r} className="font-mono text-xl md:text-3xl px-3 py-1 border border-current/60 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_10px_var(--theme-color)] transition-all cursor-default font-bold">{r}</span>
                            ))}
                             {selectedKanji.kunyomi.length === 0 && <span className="opacity-40 italic text-sm md:text-base">-- NO DATA --</span>}
                        </div>
                    </div>
                </div>

                {/* Vocabulary: Larger Text */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <h3 className="uppercase tracking-widest text-sm md:text-base opacity-80 border-b border-current/30 pb-2 mb-3 flex items-center justify-between font-bold shrink-0">
                        <span>Vocabulary Matrix</span>
                        <span className="text-xs md:text-sm">{selectedKanji.examples.length} ENTRIES</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid gap-3 auto-rows-min content-start">
                        {selectedKanji.examples.map((ex, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border-l-4 border-current/30 bg-white/5 hover:bg-white/10 hover:border-[var(--theme-color)] transition-all group gap-2">
                                <div className="flex items-baseline gap-3 md:gap-6">
                                    <span className="text-xl md:text-2xl font-bold text-current group-hover:crt-text-glow transition-all">{ex.word}</span>
                                    <span className="text-sm md:text-lg opacity-80 font-mono font-bold">[{ex.reading}]</span>
                                </div>
                                <span className="text-sm md:text-lg font-bold opacity-90">{ex.meaning}</span>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-60 border-2 border-dashed border-current/30 rounded-lg m-4 md:m-8 hover:border-[var(--theme-color)] hover:opacity-90 transition-all duration-500 hover:shadow-[0_0_20px_var(--theme-color)_inset]">
                <Database className="w-16 h-16 md:w-32 md:h-32 mb-6 opacity-60 animate-pulse" />
                <p className="text-xl md:text-3xl font-bold uppercase tracking-widest text-center">Select Data Node</p>
                <div className="mt-8 md:mt-12 flex gap-4">
                    <span className="w-3 h-3 bg-[var(--theme-color)] rounded-full animate-bounce shadow-[0_0_5px_var(--theme-color)]" style={{ animationDelay: '0s' }}></span>
                    <span className="w-3 h-3 bg-[var(--theme-color)] rounded-full animate-bounce shadow-[0_0_5px_var(--theme-color)]" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-3 h-3 bg-[var(--theme-color)] rounded-full animate-bounce shadow-[0_0_5px_var(--theme-color)]" style={{ animationDelay: '0.4s' }}></span>
                </div>
            </div>
         )}
      </div>
    </div>
  );
};
