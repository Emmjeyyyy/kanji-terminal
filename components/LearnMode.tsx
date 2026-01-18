import React, { useState } from 'react';
import { KanjiData } from '../types';
import { kanjiList } from '../data/kanji';
import { Search, Filter, Database } from 'lucide-react';

export const LearnMode: React.FC = () => {
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
    <div className="h-full flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden">
      {/* Sidebar List - Top on mobile (35% height), Left on desktop (33% width) */}
      <div className="w-full md:w-1/3 h-[35%] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-current/30 pb-4 md:pb-0 md:pr-6 min-h-0">
         <div className="mb-4 flex flex-col gap-3 shrink-0">
            {/* Improved Search Input */}
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-[var(--theme-color)] opacity-20 blur-sm transition-opacity group-focus-within:opacity-50"></div>
                <div className="relative flex items-center bg-black/80 border border-current p-2 group-focus-within:shadow-[0_0_15px_var(--theme-color)] transition-shadow duration-300">
                    <span className="mr-2 text-lg animate-pulse text-[var(--theme-color)]">{'>'}</span>
                    <input 
                        type="text" 
                        placeholder="SEARCH..." 
                        className="w-full bg-transparent border-none font-mono text-lg focus:outline-none placeholder:opacity-30 uppercase text-[var(--theme-color)]"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        spellCheck={false}
                    />
                    <Search className="w-5 h-5 opacity-50" />
                </div>
            </div>

            {/* Improved Filter Toggles */}
            <div className="flex items-center justify-between border-b border-current/30 pb-2">
                <div className="flex items-center gap-2 opacity-70">
                    <Filter className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-widest hidden sm:inline">Filter</span>
                </div>
                <div className="flex gap-2">
                    {['ALL', 'N5', 'N4'].map(lvl => (
                        <button 
                            key={lvl}
                            onClick={() => setFilterLevel(lvl as any)}
                            className={`text-[10px] md:text-xs px-2 md:px-3 py-1 border transition-all uppercase duration-200 tracking-wider ${
                                filterLevel === lvl 
                                ? 'bg-[var(--theme-color)] text-black border-transparent font-bold shadow-[0_0_10px_var(--theme-color)] scale-105' 
                                : 'border-current/30 text-current hover:border-[var(--theme-color)] hover:shadow-[0_0_8px_var(--theme-color)] hover:bg-[var(--theme-color)]/10'
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
            <div className="text-[10px] uppercase opacity-40 mb-2 tracking-widest text-right sticky top-0 bg-black/90 z-10 py-1">
                {filtered.length} Found
            </div>
            {filtered.map(k => (
                <button
                    key={k.id}
                    onClick={() => setSelectedKanji(k)}
                    className={`w-full text-left p-2 md:p-3 border flex items-center justify-between group transition-all duration-200 relative overflow-hidden ${
                        selectedKanji?.id === k.id 
                        ? 'bg-[var(--theme-color)]/10 border-[var(--theme-color)] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' 
                        : 'border-transparent border-b-current/10 hover:border-[var(--theme-color)] hover:shadow-[0_0_10px_var(--theme-color)_inset] hover:bg-[var(--theme-color)]/5'
                    }`}
                >
                    {selectedKanji?.id === k.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--theme-color)] shadow-[0_0_10px_var(--theme-color)]"></div>}
                    <div className="flex items-baseline gap-3 pl-2">
                        <span className={`text-xl md:text-2xl font-bold font-mono transition-colors ${selectedKanji?.id === k.id ? 'text-[var(--theme-color)] crt-text-glow' : 'group-hover:text-[var(--theme-color)]'}`}>{k.char}</span>
                        <span className="text-[10px] uppercase opacity-50 tracking-wider">[{k.level}]</span>
                    </div>
                    <span className="text-xs md:text-sm opacity-70 group-hover:opacity-100 font-mono truncate max-w-[50%] text-right">{k.meaning}</span>
                </button>
            ))}
            {filtered.length === 0 && (
                <div className="text-center opacity-50 py-8 border border-dashed border-current/30">
                    <div className="text-2xl mb-1">?</div>
                    <p className="text-[10px] uppercase">No Data</p>
                </div>
            )}
         </div>
      </div>

      {/* Detail View - Bottom on mobile (65% height), Right on desktop (66% width) */}
      <div className="flex-1 h-[65%] md:h-full overflow-y-auto pl-0 md:pl-2 custom-scrollbar min-h-0">
         {selectedKanji ? (
             <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
                <div className="border-b-2 border-current pb-2 md:pb-4 flex justify-between items-end relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 text-[6rem] md:text-[10rem] opacity-5 font-bold select-none pointer-events-none -mt-4 md:-mt-10 -mr-4 md:-mr-10 text-[var(--theme-color)]">{selectedKanji.char}</div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 md:mb-4">
                            <span className="text-[10px] md:text-xs bg-[var(--theme-color)] text-black px-2 py-0.5 font-bold rounded-sm inline-block tracking-widest shadow-[0_0_5px_var(--theme-color)]">JLPT {selectedKanji.level}</span>
                            <span className="text-[10px] md:text-xs border border-current px-2 py-0.5 opacity-70 font-mono">ID: {selectedKanji.id.toUpperCase()}</span>
                        </div>
                        <h2 className="text-6xl md:text-8xl font-bold leading-none crt-text-glow text-[var(--theme-color)]">{selectedKanji.char}</h2>
                    </div>
                    <div className="text-right relative z-10 max-w-[50%] md:max-w-md">
                        <div className="text-xl md:text-3xl font-bold mb-1 leading-tight">{selectedKanji.meaning}</div>
                        <div className="h-1 w-full bg-[var(--theme-color)]/20 mt-2 shadow-[0_0_5px_var(--theme-color)]">
                            <div className="h-full bg-[var(--theme-color)] w-1/3 animate-pulse shadow-[0_0_10px_var(--theme-color)]"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-2 border border-current/20 p-3 md:p-4 bg-white/5 relative hover:border-[var(--theme-color)] hover:shadow-[0_0_10px_var(--theme-color)_inset] transition-all duration-300">
                        <h3 className="absolute -top-3 left-3 bg-black px-2 text-[10px] md:text-xs uppercase tracking-widest text-[var(--theme-color)] border border-current/20">Onyomi</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedKanji.onyomi.map(r => (
                                <span key={r} className="font-mono text-base md:text-xl px-2 md:px-3 py-0.5 md:py-1 border border-current/50 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_10px_var(--theme-color)] transition-all cursor-default">{r}</span>
                            ))}
                            {selectedKanji.onyomi.length === 0 && <span className="opacity-30 italic text-sm">-- NO DATA --</span>}
                        </div>
                    </div>
                    <div className="space-y-2 border border-current/20 p-3 md:p-4 bg-white/5 relative hover:border-[var(--theme-color)] hover:shadow-[0_0_10px_var(--theme-color)_inset] transition-all duration-300">
                         <h3 className="absolute -top-3 left-3 bg-black px-2 text-[10px] md:text-xs uppercase tracking-widest text-[var(--theme-color)] border border-current/20">Kunyomi</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedKanji.kunyomi.map(r => (
                                <span key={r} className="font-mono text-base md:text-xl px-2 md:px-3 py-0.5 md:py-1 border border-current/50 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_10px_var(--theme-color)] transition-all cursor-default">{r}</span>
                            ))}
                             {selectedKanji.kunyomi.length === 0 && <span className="opacity-30 italic text-sm">-- NO DATA --</span>}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="uppercase tracking-widest text-xs md:text-sm opacity-70 border-b border-current/30 pb-1 mb-3 md:mb-4 flex items-center justify-between">
                        <span>Vocabulary Matrix</span>
                        <span className="text-[10px]">{selectedKanji.examples.length} ENTRIES</span>
                    </h3>
                    <div className="grid gap-2 md:gap-3">
                        {selectedKanji.examples.map((ex, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border-l-2 border-current/30 bg-white/5 hover:bg-white/10 hover:border-[var(--theme-color)] hover:shadow-[0_0_10px_var(--theme-color)_inset] transition-all group gap-1">
                                <div className="flex items-baseline gap-2 md:gap-4">
                                    <span className="text-lg md:text-2xl font-bold text-current group-hover:crt-text-glow transition-all">{ex.word}</span>
                                    <span className="text-xs md:text-sm opacity-60 font-mono">[{ex.reading}]</span>
                                </div>
                                <span className="text-sm md:text-base font-bold opacity-80">{ex.meaning}</span>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-40 border-2 border-dashed border-current/20 rounded-lg m-2 md:m-4 hover:border-[var(--theme-color)] hover:opacity-80 transition-all duration-500 hover:shadow-[0_0_15px_var(--theme-color)_inset]">
                <Database className="w-16 h-16 md:w-24 md:h-24 mb-4 md:mb-6 opacity-50 animate-pulse" />
                <p className="text-base md:text-xl font-bold uppercase tracking-widest text-center">Select Data Node</p>
                <div className="mt-6 md:mt-8 flex gap-2">
                    <span className="w-2 h-2 bg-[var(--theme-color)] rounded-full animate-bounce shadow-[0_0_5px_var(--theme-color)]" style={{ animationDelay: '0s' }}></span>
                    <span className="w-2 h-2 bg-[var(--theme-color)] rounded-full animate-bounce shadow-[0_0_5px_var(--theme-color)]" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-[var(--theme-color)] rounded-full animate-bounce shadow-[0_0_5px_var(--theme-color)]" style={{ animationDelay: '0.4s' }}></span>
                </div>
            </div>
         )}
      </div>
    </div>
  );
};