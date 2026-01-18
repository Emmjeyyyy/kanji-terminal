import React, { useState, useEffect } from 'react';
import { CRTContainer } from './components/CRTContainer';
import { Dashboard } from './components/Dashboard';
import { LearnMode } from './components/LearnMode';
import { QuizMode } from './components/QuizMode';
import { AppState, UserProgress, QuizQuestion } from './types';
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
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isBossMode, setIsBossMode] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('crt_kanji_lab_v1');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Save corrupted", e);
      }
    }
  }, []);

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

  const generateQuestions = (ids: string[]) => {
      const questions: QuizQuestion[] = ids.map(id => {
          const k = kanjiList.find(i => i.id === id)!;
          // Randomize question type
          const r = Math.random();
          const type = r > 0.6 ? 'meaning' : (r > 0.3 ? 'reading' : 'reverse');
          return { kanji: k, type };
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
      <nav className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 border-b-2 border-current pb-4 select-none shrink-0 gap-4 md:gap-0">
        <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-start">
            <span className="font-bold text-2xl md:text-3xl tracking-widest border-r-2 border-current pr-4 md:pr-6 mr-2 md:mr-4 crt-text-glow whitespace-nowrap">KANJI TERMINAL</span>
            <div className="flex gap-4">
                <button onClick={() => setCurrentView('dashboard')} className={`flex items-center gap-2 md:gap-3 transition-all duration-200 text-lg md:text-xl uppercase tracking-wider ${currentView === 'dashboard' ? 'opacity-100 font-bold text-shadow-[0_0_5px_currentColor]' : 'opacity-60 hover:opacity-100 hover:text-shadow-[0_0_5px_currentColor]'}`}>
                    <Home size={20} /> <span className="hidden sm:inline">DASHBOARD</span>
                </button>
                <button onClick={() => setCurrentView('learn')} className={`flex items-center gap-2 md:gap-3 transition-all duration-200 text-lg md:text-xl uppercase tracking-wider ${currentView === 'learn' ? 'opacity-100 font-bold text-shadow-[0_0_5px_currentColor]' : 'opacity-60 hover:opacity-100 hover:text-shadow-[0_0_5px_currentColor]'}`}>
                    <Book size={20} /> <span className="hidden sm:inline">DATABASE</span>
                </button>
            </div>
        </div>
        
        <div className="flex items-center gap-6 w-full md:w-auto justify-end">
            <button onClick={() => toggleSetting('crtEnabled')} className={`text-xs md:text-sm uppercase border-2 border-current px-3 py-1 rounded transition-all duration-200 font-bold tracking-wider ${state.settings.crtEnabled ? 'bg-[var(--theme-color)] text-black shadow-[0_0_15px_var(--theme-color)]' : 'opacity-60 hover:opacity-100'}`}>
                CRT: {state.settings.crtEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setCurrentView('settings')} className={`hover:opacity-100 transition-opacity ${currentView === 'settings' ? 'opacity-100' : 'opacity-60'}`}>
                <Settings size={24} />
            </button>
        </div>
      </nav>

      {/* Main Content Render - Flex Grow and Scrollable */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        {currentView === 'dashboard' && (
            <div className="h-full flex flex-col gap-6 md:gap-8 overflow-hidden">
                <div className="flex-1 min-h-0">
                    <Dashboard state={state} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 shrink-0 pb-2">
                    <button 
                        onClick={startDailySession}
                        className="group relative border-2 border-current p-5 md:p-8 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] active:scale-[0.99]"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-10 transition-opacity">
                            <Brain size={64} className="md:w-24 md:h-24" />
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 tracking-wide">DAILY SESSION</h2>
                        <p className="text-sm md:text-lg opacity-80 font-mono group-hover:font-bold">
                           {getDueItems(state.progress).length} items due for review.
                        </p>
                    </button>
                    
                    <button 
                        onClick={() => setCurrentView('quiz_setup')}
                        className="group relative border-2 border-current p-5 md:p-8 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] active:scale-[0.99]"
                    >
                         <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-10 transition-opacity">
                            <Trophy size={64} className="md:w-24 md:h-24" />
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 tracking-wide">BOSS RUNS</h2>
                        <p className="text-sm md:text-lg opacity-80 font-mono group-hover:font-bold">
                           Simulate JLPT exams (N5/N4).
                        </p>
                    </button>
                </div>
            </div>
        )}

        {currentView === 'learn' && <LearnMode />}

        {currentView === 'quiz_setup' && (
             <div className="flex flex-col items-center justify-center h-full gap-10 md:gap-14 animate-in fade-in duration-500">
                 <h2 className="text-4xl md:text-6xl font-bold uppercase crt-text-glow text-center tracking-tighter">Select Difficulty</h2>
                 <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full md:w-auto px-10 md:px-0">
                     <button 
                        onClick={() => startBossRun('N5')}
                        className="w-full md:w-64 h-32 md:h-48 border-2 border-current flex flex-col items-center justify-center transition-all duration-300 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_40px_var(--theme-color)] hover:scale-105 group"
                     >
                         <span className="text-6xl md:text-8xl font-bold mb-2 md:mb-4 group-hover:scale-110 transition-transform">N5</span>
                         <span className="text-sm md:text-lg uppercase tracking-[0.3em] font-bold">Beginner</span>
                     </button>
                     <button 
                        onClick={() => startBossRun('N4')}
                        className="w-full md:w-64 h-32 md:h-48 border-2 border-current flex flex-col items-center justify-center transition-all duration-300 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_40px_var(--theme-color)] hover:scale-105 group"
                     >
                         <span className="text-6xl md:text-8xl font-bold mb-2 md:mb-4 group-hover:scale-110 transition-transform">N4</span>
                         <span className="text-sm md:text-lg uppercase tracking-[0.3em] font-bold">Elementary</span>
                     </button>
                 </div>
                 <button onClick={() => setCurrentView('dashboard')} className="mt-8 md:mt-12 opacity-60 hover:opacity-100 hover:text-shadow-[0_0_5px_currentColor] underline tracking-widest text-lg md:text-xl font-bold uppercase">Back to Dashboard</button>
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
                <div className="max-w-2xl mx-auto w-full border-2 border-current p-8 md:p-12 bg-black/60 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
                    <h2 className="text-3xl md:text-4xl font-bold mb-8 border-b-2 border-current pb-4 crt-text-glow">SYSTEM CONFIGURATION</h2>
                    <div className="space-y-8">
                        <div className="flex items-center justify-between group">
                            <span className="text-lg md:text-xl group-hover:text-shadow-[0_0_3px_currentColor] font-bold">Monitor Theme</span>
                            <button onClick={toggleTheme} className="border-2 border-current px-6 py-2 uppercase text-base md:text-lg hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-32 transition-all font-bold">
                                {state.settings.theme}
                            </button>
                        </div>
                        <div className="flex items-center justify-between group">
                            <span className="text-lg md:text-xl group-hover:text-shadow-[0_0_3px_currentColor] font-bold">CRT Emulation</span>
                            <button onClick={() => toggleSetting('crtEnabled')} className="border-2 border-current px-6 py-2 uppercase text-base md:text-lg hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-32 transition-all font-bold">
                                {state.settings.crtEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        {state.settings.crtEnabled && (
                            <>
                                <div className="flex items-center justify-between pl-6 border-l-2 border-current/30 group">
                                    <span className="text-lg md:text-xl opacity-80 group-hover:opacity-100 group-hover:text-shadow-[0_0_3px_currentColor]">Scanlines</span>
                                    <button onClick={() => toggleSetting('scanlines')} className="border-2 border-current px-6 py-2 uppercase text-base md:text-lg hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-32 transition-all font-bold">
                                        {state.settings.scanlines ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between pl-6 border-l-2 border-current/30 group">
                                    <span className="text-lg md:text-xl opacity-80 group-hover:opacity-100 group-hover:text-shadow-[0_0_3px_currentColor]">Phosphor Flicker</span>
                                    <button onClick={() => toggleSetting('flicker')} className="border-2 border-current px-6 py-2 uppercase text-base md:text-lg hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-32 transition-all font-bold">
                                        {state.settings.flicker ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </>
                        )}
                         <div className="pt-10 mt-10 border-t-2 border-current/30 text-center">
                             <button 
                                onClick={() => { localStorage.removeItem('crt_kanji_lab_v1'); window.location.reload(); }}
                                className="text-red-500 border-2 border-red-500 px-6 py-3 hover:bg-red-900/40 hover:text-red-300 hover:shadow-[0_0_20px_red] text-sm md:text-base font-bold uppercase transition-all tracking-widest"
                             >
                                <Power className="inline w-5 h-5 mr-3" /> Factory Reset
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        )}
      </main>
      
      {/* Footer Status Line - Fixed Height */}
      <footer className="mt-4 pt-4 border-t-2 border-current/30 flex justify-between text-xs md:text-sm opacity-60 font-mono uppercase shrink-0 font-bold tracking-widest">
        <span>Mem: {Object.keys(state.progress).length} Blocks</span>
        <span>Ver 1.0.4 // OFFLINE MODE</span>
      </footer>
    </CRTContainer>
  );
}