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
      <nav className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 border-b border-current pb-2 select-none shrink-0 gap-2 md:gap-0">
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-start">
            <span className="font-bold 
  text-2xl md:text-[30px]
  tracking-[0.15em]
  border-r border-current
  pr-2 md:pr-4 mr-1 md:mr-2
  crt-text-glow whitespace-nowrap">
  KANJI TERMINAL
</span> <div className="flex gap-2">
                <button onClick={() => setCurrentView('dashboard')} className={`flex items-center gap-1 md:gap-2 transition-all duration-200 ${currentView === 'dashboard' ? 'opacity-100 font-bold text-shadow-[0_0_3px_currentColor]' : 'opacity-50 hover:opacity-100 hover:text-shadow-[0_0_3px_currentColor]'}`}>
                    <Home size={16} /> <span className="hidden sm:inline">DASHBOARD</span>
                </button>
                <button onClick={() => setCurrentView('learn')} className={`flex items-center gap-1 md:gap-2 transition-all duration-200 ${currentView === 'learn' ? 'opacity-100 font-bold text-shadow-[0_0_3px_currentColor]' : 'opacity-50 hover:opacity-100 hover:text-shadow-[0_0_3px_currentColor]'}`}>
                    <Book size={16} /> <span className="hidden sm:inline">DATABASE</span>
                </button>
            </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <button onClick={() => toggleSetting('crtEnabled')} className={`text-[10px] md:text-xs uppercase border border-current px-2 py-0.5 rounded transition-all duration-200 ${state.settings.crtEnabled ? 'bg-[var(--theme-color)] text-black font-bold shadow-[0_0_10px_var(--theme-color)]' : 'opacity-50 hover:opacity-100'}`}>
                CRT: {state.settings.crtEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setCurrentView('settings')} className={`hover:opacity-100 transition-opacity ${currentView === 'settings' ? 'opacity-100' : 'opacity-50'}`}>
                <Settings size={18} />
            </button>
        </div>
      </nav>

      {/* Main Content Render - Flex Grow and Scrollable */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        {currentView === 'dashboard' && (
            <div className="h-full flex flex-col gap-4 md:gap-8 overflow-hidden">
                <div className="flex-1 min-h-0">
                    <Dashboard state={state} />
                </div>
                {/* Action Buttons Fixed at Bottom of Dashboard area or integrated? Let's integrate into Dashboard scroll or keep fixed if space allows. 
                    Given "always fit in screen", let's put them in the scrollable dashboard if small screen, or fixed if large. 
                    Actually, let's keep them separate to ensure visibility if Dashboard is tall.
                */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 shrink-0 pb-2">
                    <button 
                        onClick={startDailySession}
                        className="group relative border border-current p-4 md:p-6 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_20px_var(--theme-color)] active:scale-[0.99]"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-10 transition-opacity">
                            <Brain size={48} className="md:w-16 md:h-16" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 tracking-wide">DAILY SESSION</h2>
                        <p className="text-xs md:text-sm opacity-80 font-mono group-hover:font-bold">
                           {getDueItems(state.progress).length} items due.
                        </p>
                    </button>
                    
                    <button 
                        onClick={() => setCurrentView('quiz_setup')}
                        className="group relative border border-current p-4 md:p-6 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_20px_var(--theme-color)] active:scale-[0.99]"
                    >
                         <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-10 transition-opacity">
                            <Trophy size={48} className="md:w-16 md:h-16" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 tracking-wide">BOSS RUNS</h2>
                        <p className="text-xs md:text-sm opacity-80 font-mono group-hover:font-bold">
                           Simulate JLPT exams.
                        </p>
                    </button>
                </div>
            </div>
        )}

        {currentView === 'learn' && <LearnMode />}

        {currentView === 'quiz_setup' && (
             <div className="flex flex-col items-center justify-center h-full gap-8 animate-in fade-in duration-500">
                 <h2 className="text-3xl md:text-4xl font-bold uppercase crt-text-glow text-center">Select Difficulty</h2>
                 <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full md:w-auto px-8 md:px-0">
                     <button 
                        onClick={() => startBossRun('N5')}
                        className="w-full md:w-48 h-24 md:h-32 border border-current flex flex-col items-center justify-center transition-all duration-300 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] hover:scale-105 group"
                     >
                         <span className="text-4xl md:text-6xl font-bold mb-1 md:mb-2 group-hover:scale-110 transition-transform">N5</span>
                         <span className="text-xs md:text-sm uppercase tracking-widest font-bold">Beginner</span>
                     </button>
                     <button 
                        onClick={() => startBossRun('N4')}
                        className="w-full md:w-48 h-24 md:h-32 border border-current flex flex-col items-center justify-center transition-all duration-300 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] hover:scale-105 group"
                     >
                         <span className="text-4xl md:text-6xl font-bold mb-1 md:mb-2 group-hover:scale-110 transition-transform">N4</span>
                         <span className="text-xs md:text-sm uppercase tracking-widest font-bold">Elementary</span>
                     </button>
                 </div>
                 <button onClick={() => setCurrentView('dashboard')} className="mt-4 md:mt-8 opacity-50 hover:opacity-100 hover:text-shadow-[0_0_3px_currentColor] underline tracking-widest">Back to Dashboard</button>
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
                <div className="max-w-xl mx-auto w-full border border-current p-6 md:p-8 bg-black/50 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <h2 className="text-2xl font-bold mb-6 border-b border-current pb-2 crt-text-glow">SYSTEM CONFIGURATION</h2>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between group">
                            <span className="group-hover:text-shadow-[0_0_3px_currentColor]">Monitor Theme</span>
                            <button onClick={toggleTheme} className="border border-current px-4 py-1 uppercase text-sm hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_10px_var(--theme-color)] w-24 transition-all">
                                {state.settings.theme}
                            </button>
                        </div>
                        <div className="flex items-center justify-between group">
                            <span className="group-hover:text-shadow-[0_0_3px_currentColor]">CRT Emulation</span>
                            <button onClick={() => toggleSetting('crtEnabled')} className="border border-current px-4 py-1 uppercase text-sm hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_10px_var(--theme-color)] w-24 transition-all">
                                {state.settings.crtEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        {state.settings.crtEnabled && (
                            <>
                                <div className="flex items-center justify-between pl-4 border-l border-current/30 group">
                                    <span className="opacity-80 group-hover:opacity-100 group-hover:text-shadow-[0_0_3px_currentColor]">Scanlines</span>
                                    <button onClick={() => toggleSetting('scanlines')} className="border border-current px-4 py-1 uppercase text-sm hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_10px_var(--theme-color)] w-24 transition-all">
                                        {state.settings.scanlines ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between pl-4 border-l border-current/30 group">
                                    <span className="opacity-80 group-hover:opacity-100 group-hover:text-shadow-[0_0_3px_currentColor]">Phosphor Flicker</span>
                                    <button onClick={() => toggleSetting('flicker')} className="border border-current px-4 py-1 uppercase text-sm hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_10px_var(--theme-color)] w-24 transition-all">
                                        {state.settings.flicker ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </>
                        )}
                         <div className="pt-8 mt-8 border-t border-current/30 text-center">
                             <button 
                                onClick={() => { localStorage.removeItem('crt_kanji_lab_v1'); window.location.reload(); }}
                                className="text-red-500 border border-red-500 px-4 py-2 hover:bg-red-900/40 hover:text-red-300 hover:shadow-[0_0_15px_red] text-xs uppercase transition-all"
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
      <footer className="mt-2 pt-2 border-t border-current/30 flex justify-between text-[10px] md:text-xs opacity-50 font-mono uppercase shrink-0">
        <span>Mem: {Object.keys(state.progress).length} Blocks</span>
        <span>Ver 1.0.4 // OFFLINE MODE</span>
      </footer>
    </CRTContainer>
  );
}