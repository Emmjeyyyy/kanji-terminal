import React, { useState, useEffect } from 'react';
import { CRTContainer } from './components/CRTContainer';
import { Dashboard } from './components/Dashboard';
import { LearnMode } from './components/LearnMode';
import { QuizMode } from './components/QuizMode';
import { AppState, UserProgress, QuizQuestion, KanjiData, QuizType } from './types';
import { kanjiList } from './data/kanji';
import { getDueItems } from './utils/srs';
import { Home, Book, Brain, Trophy, Settings, Power } from 'lucide-react';

const DEFAULT_STATE: AppState = {
  progress: {},
  settings: {
    crtEnabled: true,
    scanlines: true,
    flicker: true,
    audio: false,
    theme: 'green'
  }
};

type View = 'dashboard' | 'learn' | 'quiz_setup' | 'quiz_active' | 'boss_mode' | 'settings';

export default function App() {
  // Initialize state from local storage to prevent settings reset on refresh
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('crt_kanji_lab_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with default state to ensure structure integrity
        return {
          ...DEFAULT_STATE,
          ...parsed,
          settings: {
            ...DEFAULT_STATE.settings,
            ...(parsed.settings || {})
          },
          progress: {
            ...DEFAULT_STATE.progress,
            ...(parsed.progress || {})
          }
        };
      } catch (e) {
        console.error("Save corrupted", e);
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isBossMode, setIsBossMode] = useState(false);

  // Save on change
  useEffect(() => {
    localStorage.setItem('crt_kanji_lab_v1', JSON.stringify(state));
  }, [state]);

  const updateProgress = (results: Record<string, UserProgress>) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        ...results
      }
    }));
    setCurrentView('dashboard');
  };

  const startDailySession = () => {
    // Priority: Due items -> New items (if due count < 10)
    const due = getDueItems(state.progress);
    let sessionKanjiIds = due.map(p => p.kanjiId);
    
    // Fill up to 10 with new items if needed
    if (sessionKanjiIds.length < 10) {
        const learnedIds = Object.keys(state.progress);
        const newItems = kanjiList
            .filter(k => !learnedIds.includes(k.id))
            .slice(0, 10 - sessionKanjiIds.length)
            .map(k => k.id);
        sessionKanjiIds = [...sessionKanjiIds, ...newItems];
    }

    if (sessionKanjiIds.length === 0) {
        // Fallback if everything learned and nothing due: Review random 10
        sessionKanjiIds = kanjiList
            .sort(() => 0.5 - Math.random())
            .slice(0, 10)
            .map(k => k.id);
    }

    generateQuestions(sessionKanjiIds);
    setIsBossMode(false);
    setCurrentView('quiz_active');
  };

  const startBossRun = (level: 'N5' | 'N4') => {
      const targetKanji = kanjiList
        .filter(k => k.level === level)
        .sort(() => 0.5 - Math.random())
        .slice(0, 20); // 20 questions
      
      generateQuestions(targetKanji.map(k => k.id));
      setIsBossMode(true);
      setCurrentView('quiz_active');
  };

  const shuffle = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const generateQuestions = (ids: string[]) => {
      const questions: QuizQuestion[] = ids.map(id => {
          const k = kanjiList.find(i => i.id === id)!;
          const r = Math.random();
          const type: QuizType = r > 0.6 ? 'meaning' : (r > 0.3 ? 'reading' : 'reverse');
          
          let getOptionValue: (item: KanjiData) => string;
          
          if (type === 'meaning') {
              getOptionValue = (item) => item.meaning;
          } else if (type === 'reading') {
              getOptionValue = (item) => {
                  const on = item.onyomi.join(', ');
                  const kun = item.kunyomi.join(', ');
                  return on ? (kun ? `${on} / ${kun}` : on) : kun || '---';
              };
          } else { // reverse
              getOptionValue = (item) => item.char;
          }

          const correctAnswer = getOptionValue(k);
          
          // Find 3 distractors that don't have the exact same answer string
          const potentialDistractors = kanjiList.filter(item => item.id !== id && getOptionValue(item) !== correctAnswer);
          const distractors = potentialDistractors.sort(() => 0.5 - Math.random()).slice(0, 3);
          
          const options = shuffle([correctAnswer, ...distractors.map(getOptionValue)]);

          return { kanji: k, type, options, correctAnswer };
      });
      setActiveQuizQuestions(questions);
  };

  const toggleSetting = (key: keyof AppState['settings']) => {
      setState(prev => ({
          ...prev,
          settings: {
              ...prev.settings,
              [key]: !prev.settings[key]
          }
      }));
  };
  
  const toggleTheme = () => {
      setState(prev => ({
          ...prev,
          settings: {
              ...prev.settings,
              theme: prev.settings.theme === 'green' ? 'amber' : 'green'
          }
      }));
  };

  return (
    <CRTContainer settings={state.settings}>
      {/* Top Navigation - Fixed Height */}
      <nav className="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-4 border-b-2 border-current pb-2 md:pb-4 select-none shrink-0 gap-2 md:gap-0">
        <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-start">
            <span className="font-bold text-xl md:text-2xl tracking-widest border-r-2 border-current pr-2 md:pr-4 mr-1 md:mr-2 crt-text-glow whitespace-nowrap">KANJI TERMINAL</span>
            <div className="flex gap-3 md:gap-4">
                <button onClick={() => setCurrentView('dashboard')} className={`flex items-center gap-2 transition-all duration-200 text-base md:text-lg uppercase tracking-wider ${currentView === 'dashboard' ? 'opacity-100 font-bold text-shadow-[0_0_5px_currentColor]' : 'opacity-60 hover:opacity-100 hover:text-shadow-[0_0_5px_currentColor]'}`}>
                    <Home size={18} /> <span className="hidden sm:inline">DASHBOARD</span>
                </button>
                <button onClick={() => setCurrentView('learn')} className={`flex items-center gap-2 transition-all duration-200 text-base md:text-lg uppercase tracking-wider ${currentView === 'learn' ? 'opacity-100 font-bold text-shadow-[0_0_5px_currentColor]' : 'opacity-60 hover:opacity-100 hover:text-shadow-[0_0_5px_currentColor]'}`}>
                    <Book size={18} /> <span className="hidden sm:inline">DATABASE</span>
                </button>
            </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <button onClick={() => toggleSetting('crtEnabled')} className={`text-[10px] md:text-xs uppercase border-2 border-current px-2 py-0.5 rounded transition-all duration-200 font-bold tracking-wider ${state.settings.crtEnabled ? 'bg-[var(--theme-color)] text-black shadow-[0_0_15px_var(--theme-color)]' : 'opacity-60 hover:opacity-100'}`}>
                CRT: {state.settings.crtEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setCurrentView('settings')} className={`hover:opacity-100 transition-opacity ${currentView === 'settings' ? 'opacity-100' : 'opacity-60'}`}>
                <Settings size={20} />
            </button>
        </div>
      </nav>

      {/* Main Content Render - Flex Grow and Scrollable */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        {currentView === 'dashboard' && (
            <div className="h-full flex flex-col gap-2 md:gap-4 overflow-hidden">
                <div className="flex-1 min-h-0">
                    <Dashboard state={state} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 shrink-0 pb-1">
                    <button 
                        onClick={startDailySession}
                        className="group relative border-2 border-current p-3 md:p-4 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] active:scale-[0.99]"
                    >
                        <div className="absolute top-0 right-0 p-2 md:p-3 opacity-20 group-hover:opacity-10 transition-opacity">
                            <Brain size={32} className="md:w-12 md:h-12" />
                        </div>
                        <h2 className="text-lg md:text-2xl font-bold mb-1 tracking-wide">DAILY SESSION</h2>
                        <p className="text-[10px] md:text-sm opacity-80 font-mono group-hover:font-bold">
                           {getDueItems(state.progress).length} items due for review.
                        </p>
                    </button>
                    
                    <button 
                        onClick={() => setCurrentView('quiz_setup')}
                        className="group relative border-2 border-current p-3 md:p-4 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] active:scale-[0.99]"
                    >
                         <div className="absolute top-0 right-0 p-2 md:p-3 opacity-20 group-hover:opacity-10 transition-opacity">
                            <Trophy size={32} className="md:w-12 md:h-12" />
                        </div>
                        <h2 className="text-lg md:text-2xl font-bold mb-1 tracking-wide">BOSS RUNS</h2>
                        <p className="text-[10px] md:text-sm opacity-80 font-mono group-hover:font-bold">
                           Simulate JLPT exams (N5/N4).
                        </p>
                    </button>
                </div>
            </div>
        )}

        {currentView === 'learn' && <LearnMode />}

        {currentView === 'quiz_setup' && (
             <div className="flex flex-col items-center justify-center h-full gap-8 md:gap-12 animate-in fade-in duration-500">
                 <h2 className="text-3xl md:text-5xl font-bold uppercase crt-text-glow text-center tracking-tighter">Select Difficulty</h2>
                 <div className="flex flex-col md:flex-row gap-4 md:gap-10 w-full md:w-auto px-6 md:px-0">
                     <button 
                        onClick={() => startBossRun('N5')}
                        className="w-full md:w-56 h-24 md:h-40 border-2 border-current flex flex-col items-center justify-center transition-all duration-300 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_40px_var(--theme-color)] hover:scale-105 group"
                     >
                         <span className="text-5xl md:text-7xl font-bold mb-1 md:mb-3 group-hover:scale-110 transition-transform">N5</span>
                         <span className="text-xs md:text-base uppercase tracking-[0.3em] font-bold">Beginner</span>
                     </button>
                     <button 
                        onClick={() => startBossRun('N4')}
                        className="w-full md:w-56 h-24 md:h-40 border-2 border-current flex flex-col items-center justify-center transition-all duration-300 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_40px_var(--theme-color)] hover:scale-105 group"
                     >
                         <span className="text-5xl md:text-7xl font-bold mb-1 md:mb-3 group-hover:scale-110 transition-transform">N4</span>
                         <span className="text-xs md:text-base uppercase tracking-[0.3em] font-bold">Elementary</span>
                     </button>
                 </div>
                 <button onClick={() => setCurrentView('dashboard')} className="mt-6 md:mt-10 opacity-60 hover:opacity-100 hover:text-shadow-[0_0_5px_currentColor] underline tracking-widest text-base md:text-lg font-bold uppercase">Back to Dashboard</button>
             </div>
        )}

        {currentView === 'quiz_active' && (
            <QuizMode 
                questions={activeQuizQuestions} 
                onComplete={updateProgress}
                settings={state.settings}
                appState={state}
                onExit={() => setCurrentView('dashboard')}
                isTimed={isBossMode}
            />
        )}
        
        {currentView === 'settings' && (
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
                <div className="max-w-xl mx-auto w-full border-2 border-current p-6 md:p-10 bg-black/60 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b-2 border-current pb-3 crt-text-glow">SYSTEM CONFIGURATION</h2>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between group">
                            <span className="text-base md:text-lg group-hover:text-shadow-[0_0_3px_currentColor] font-bold">Monitor Theme</span>
                            <button onClick={toggleTheme} className="border-2 border-current px-4 py-2 uppercase text-sm md:text-base hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-28 transition-all font-bold">
                                {state.settings.theme}
                            </button>
                        </div>
                        <div className="flex items-center justify-between group">
                            <span className="text-base md:text-lg group-hover:text-shadow-[0_0_3px_currentColor] font-bold">CRT Emulation</span>
                            <button onClick={() => toggleSetting('crtEnabled')} className="border-2 border-current px-4 py-2 uppercase text-sm md:text-base hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-28 transition-all font-bold">
                                {state.settings.crtEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        {state.settings.crtEnabled && (
                            <>
                                <div className="flex items-center justify-between pl-6 border-l-2 border-current/30 group">
                                    <span className="text-base md:text-lg opacity-80 group-hover:opacity-100 group-hover:text-shadow-[0_0_3px_currentColor]">Scanlines</span>
                                    <button onClick={() => toggleSetting('scanlines')} className="border-2 border-current px-4 py-2 uppercase text-sm md:text-base hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-28 transition-all font-bold">
                                        {state.settings.scanlines ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between pl-6 border-l-2 border-current/30 group">
                                    <span className="text-base md:text-lg opacity-80 group-hover:opacity-100 group-hover:text-shadow-[0_0_3px_currentColor]">Phosphor Flicker</span>
                                    <button onClick={() => toggleSetting('flicker')} className="border-2 border-current px-4 py-2 uppercase text-sm md:text-base hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-28 transition-all font-bold">
                                        {state.settings.flicker ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </>
                        )}
                         <div className="pt-8 mt-8 border-t-2 border-current/30 text-center">
                             <button 
                                onClick={() => { localStorage.removeItem('crt_kanji_lab_v1'); window.location.reload(); }}
                                className="text-red-500 border-2 border-red-500 px-6 py-2 hover:bg-red-900/40 hover:text-red-300 hover:shadow-[0_0_20px_red] text-xs md:text-sm font-bold uppercase transition-all tracking-widest"
                             >
                                <Power className="inline w-4 h-4 mr-2" /> Factory Reset
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </main>
      
      {/* Footer Status Line - Fixed Height */}
      <footer className="mt-2 pt-2 border-t-2 border-current/30 flex justify-between text-[10px] md:text-xs opacity-60 font-mono uppercase shrink-0 font-bold tracking-widest">
        <span>Mem: {Object.keys(state.progress).length} Blocks</span>
        <span>Ver 1.0.4 // OFFLINE MODE</span>
      </footer>
    </CRTContainer>
  );
}