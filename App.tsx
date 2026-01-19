import React, { useState, useEffect } from 'react';
import { CRTContainer } from './components/CRTContainer';
import { Dashboard } from './components/Dashboard';
import { LearnMode } from './components/LearnMode';
import { QuizMode } from './components/QuizMode';
import { AppState, UserProgress, QuizQuestion, KanjiData, QuizType } from './types';
import { kanjiList } from './data/kanji';
import { getDueItems } from './utils/srs';
import { Home, Book, Settings, Power, Lock } from 'lucide-react';

// Custom Grid Sphere Globe Icon Component
const GridGlobeIcon = ({ size = 32, className, style }: { size?: number | string, className?: string, style?: React.CSSProperties }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 128 128" 
    role="img" 
    aria-label="Grid globe icon"
    width={size}
    height={size}
    className={className}
    style={style}
  >
    <defs>
      <filter id="globe-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.8" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <radialGradient id="globe-halo" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.18"/>
        <stop offset="55%" stopColor="currentColor" stopOpacity="0.08"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
      </radialGradient>

      <clipPath id="globe-clipSphere">
        <circle cx="64" cy="64" r="44"/>
      </clipPath>
    </defs>

    {/* Halo */}
    <circle cx="64" cy="64" r="54" fill="url(#globe-halo)"/>

    {/* Outer sphere */}
    <circle cx="64" cy="64" r="44" fill="none" stroke="currentColor" strokeWidth="4" filter="url(#globe-glow)"/>

    {/* Grid lines clipped inside sphere */}
    <g clipPath="url(#globe-clipSphere)" stroke="currentColor" strokeWidth="2" fill="none" filter="url(#globe-glow)" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
      {/* Vertical meridians (ellipses) */}
      <ellipse cx="64" cy="64" rx="30" ry="44"/>
      <ellipse cx="64" cy="64" rx="18" ry="44"/>
      <ellipse cx="64" cy="64" rx="6"  ry="44"/>

      {/* Horizontal parallels */}
      <ellipse cx="64" cy="64" rx="44" ry="30"/>
      <ellipse cx="64" cy="64" rx="44" ry="18"/>
      <ellipse cx="64" cy="64" rx="44" ry="6"/>
    </g>
  </svg>
);

// Custom Grid Hourglass Icon Component
const GridHourglassIcon = ({ size = 32, className, style }: { size?: number | string, className?: string, style?: React.CSSProperties }) => (
<svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 128 128" 
    role="img" 
    aria-label="Grid hourglass icon"
    height={size}
    className={className}
    style={style}
  >
    <defs>
      <filter id="hg-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.8" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <radialGradient id="hg-halo" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.18"/>
        <stop offset="55%" stopColor="currentColor" stopOpacity="0.08"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
      </radialGradient>

      <clipPath id="hg-clip">
          <path d="M34 22 H94 C94 22 98 22 98 26 C98 52 70 64 64 64 C58 64 30 52 30 26 C30 22 34 22 34 22 Z M34 106 H94 C94 106 98 106 98 102 C98 76 70 64 64 64 C58 64 30 76 30 102 C30 106 34 106 34 106 Z" />
      </clipPath>
    </defs>


    {/* Outer Hourglass */}
    <path 
        d="M34 22 H94 C94 22 98 22 98 26 C98 52 70 64 64 64 C58 64 30 52 30 26 C30 22 34 22 34 22 Z M34 106 H94 C94 106 98 106 98 102 C98 76 70 64 64 64 C58 64 30 76 30 102 C30 106 34 106 34 106 Z" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4" 
        filter="url(#hg-glow)" 
        strokeLinejoin="round"
        strokeLinecap="round"
    />

    {/* Grid Lines */}
    <g clipPath="url(#hg-clip)" stroke="currentColor" strokeWidth="2" fill="none" filter="url(#hg-glow)" opacity="0.9">
        {/* Verticals */}
        <line x1="48" y1="10" x2="48" y2="118" />
        <line x1="64" y1="10" x2="64" y2="118" />
        <line x1="80" y1="10" x2="80" y2="118" />

        {/* Horizontals Top */}
        <line x1="10" y1="34" x2="118" y2="34" />
        <line x1="10" y1="50" x2="118" y2="50" />
        
        {/* Horizontals Bottom */}
        <line x1="10" y1="78" x2="118" y2="78" />
        <line x1="10" y1="94" x2="118" y2="94" />
    </g>
  </svg>
);

const DEFAULT_STATE: AppState = {
  progress: {},
  settings: {
    crtEnabled: true,
    scanlines: true,
    flicker: true,
    glow: true,
    audio: false,
    theme: 'green'
  },
  dailySessionTracker: {
      date: new Date().toDateString(),
      count: 0
  },
  reviewHistory: {}
};

type View = 'dashboard' | 'learn' | 'quiz_setup' | 'quiz_active' | 'boss_mode' | 'settings';

export default function App() {
  // Initialize state from local storage to prevent settings reset on refresh
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('crt_kanji_lab_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Handle migration for old state that might lack dailySessionTracker
        const tracker = parsed.dailySessionTracker || {
            date: new Date().toDateString(),
            // If we had lastDailyCompleted, assume 1 session done, else 0
            count: parsed.lastDailyCompleted && new Date(parsed.lastDailyCompleted).toDateString() === new Date().toDateString() ? 1 : 0
        };

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
          },
          dailySessionTracker: tracker,
          reviewHistory: parsed.reviewHistory || {}
        };
      } catch (e) {
        console.error("Save corrupted", e);
        return DEFAULT_STATE;
      }
    }
    return DEFAULT_STATE;
  });

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [previousView, setPreviousView] = useState<View>('dashboard');
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isBossMode, setIsBossMode] = useState(false);
  const [isDailySession, setIsDailySession] = useState(false);
  const [isWeakSession, setIsWeakSession] = useState(false);
  
  // Track initial load for intro animation
  const [introPlayed, setIntroPlayed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        setIntroPlayed(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Save on change
  useEffect(() => {
    localStorage.setItem('crt_kanji_lab_v1', JSON.stringify(state));
  }, [state]);

  const updateProgress = (results: Record<string, UserProgress>) => {
    let newProgress = {
      ...state.progress,
      ...results
    };

    // If this was a "Resolve" session, we reset the missCount for the items processed
    // This allows them to be cleared from the Weak Items list
    if (isWeakSession) {
        Object.keys(results).forEach(id => {
            if (newProgress[id]) {
                newProgress[id] = {
                    ...newProgress[id],
                    missCount: 0 // Clear the "Weak" status
                };
            }
        });
    }

    // Update Review History: Count SESSIONS, not items.
    // Only for Daily Session and Simulation Mode.
    let newHistory = state.reviewHistory;
    
    if (isDailySession || isBossMode) {
        const todayKey = new Date().toDateString();
        // Create copy to ensure immutability
        newHistory = { ...state.reviewHistory };
        // Increment session count by 1
        newHistory[todayKey] = (newHistory[todayKey] || 0) + 1;
    }

    const newState = {
      ...state,
      progress: newProgress,
      reviewHistory: newHistory
    };

    // If this was a daily session, increment the counter for today
    if (isDailySession) {
        const today = new Date().toDateString();
        let newCount = 1;
        
        // If tracker is already today's date, increment
        if (state.dailySessionTracker.date === today) {
            newCount = state.dailySessionTracker.count + 1;
        } 
        // If tracker is old date (or future/mismatch), reset to 1 (done just now)
        
        newState.dailySessionTracker = {
            date: today,
            count: newCount
        };
    }

    setState(newState);
    setIsDailySession(false);
    setIsWeakSession(false);
    setIsBossMode(false);
    setCurrentView('dashboard');
  };

  const shuffle = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const startDailySession = () => {
    const today = new Date().toDateString();
    
    // Check if we have sessions remaining
    let currentCount = 0;
    if (state.dailySessionTracker.date === today) {
        currentCount = state.dailySessionTracker.count;
    }

    if (currentCount >= 5) return;

    let sessionKanjiIds: string[] = [];
    
    // 1. Get Due Items and Shuffle them (Random Selection from Due Pool)
    const due = getDueItems(state.progress);
    const shuffledDue = shuffle(due).map(p => p.kanjiId);
    sessionKanjiIds = [...shuffledDue];
    
    // 2. Fill up to 10 with NEW items if needed
    if (sessionKanjiIds.length < 10) {
        const learnedIds = Object.keys(state.progress);
        const newItems = kanjiList
            .filter(k => !learnedIds.includes(k.id))
            .map(k => k.id);
        const shuffledNew = shuffle(newItems);
        sessionKanjiIds = [...sessionKanjiIds, ...shuffledNew];
    }

    // 3. Fill up to 10 with REVIEW items (random learned items) if still needed
    if (sessionKanjiIds.length < 10) {
        const learnedIds = Object.keys(state.progress);
        const candidates = learnedIds.filter(id => !sessionKanjiIds.includes(id));
        const shuffledCandidates = shuffle(candidates);
        sessionKanjiIds = [...sessionKanjiIds, ...shuffledCandidates];
    }
    
    // 4. Fallback: If absolutely nothing else, pick random from full list
    if (sessionKanjiIds.length < 10) {
        const candidates = kanjiList
            .filter(k => !sessionKanjiIds.includes(k.id))
            .map(k => k.id);
        sessionKanjiIds = [...sessionKanjiIds, ...shuffle(candidates)];
    }

    // Ensure we have exactly 10 unique items
    const finalIds = [...new Set(sessionKanjiIds)].slice(0, 10);

    generateQuestions(finalIds);
    setIsBossMode(false);
    setIsDailySession(true);
    setIsWeakSession(false);
    setCurrentView('quiz_active');
  };

  const startResolveSession = () => {
      // Find all items with missCount > 0
      const weakIds = Object.values(state.progress)
          .filter(p => p.missCount > 0)
          .map(p => p.kanjiId);
      
      if (weakIds.length === 0) return;
      
      generateQuestions(weakIds);
      setIsBossMode(false);
      setIsDailySession(false);
      setIsWeakSession(true);
      setCurrentView('quiz_active');
  };

  const startBossRun = (level: 'N5' | 'N4') => {
      const targetKanji = kanjiList
        .filter(k => k.level === level)
        .sort(() => 0.5 - Math.random())
        .slice(0, 20); // 20 questions
      
      generateQuestions(targetKanji.map(k => k.id));
      setIsBossMode(true);
      setIsDailySession(false);
      setIsWeakSession(false);
      setCurrentView('quiz_active');
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

  const toggleSettingsView = () => {
    if (currentView === 'settings') {
        setCurrentView(previousView);
    } else {
        setPreviousView(currentView);
        setCurrentView('settings');
    }
  };

  const getSessionsDoneToday = () => {
      const today = new Date().toDateString();
      if (state.dailySessionTracker.date === today) {
          return state.dailySessionTracker.count;
      }
      return 0;
  };

  const sessionsDone = getSessionsDoneToday();
  const isDailyLimitReached = sessionsDone >= 5;
  const themeColor = state.settings.theme === 'green' ? '#4ade80' : '#fbbf24';

  const now = new Date();
  const versionStr = `VER ${now.getMonth() + 1}.${now.getDate()}.${now.getFullYear().toString().slice(-2)}`;

  return (
    <CRTContainer settings={state.settings}>
      {/* Top Navigation - Fixed Height */}
      <nav 
        className="flex flex-col md:flex-row justify-between w-full md:w-auto items-center border-b-2 pb-2 md:pb-4 select-none shrink-0 gap-2 md:gap-0"
        style={{ borderColor: themeColor }}
      >
        <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-start">
            <pre 
                className="font-bold border-r-2 pr-2 md:pr-4 mr-1 md:mr-2 crt-text-glow2 font-mono leading-none tracking-tighter"
                style={{
                  fontSize: 'clamp(3px, 0.75vw, 8px)',
                  borderColor: themeColor
                }}
            >
{`██╗  ██╗ █████╗ ███╗   ██╗     ██╗██╗    ████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗     
██║ ██╔╝██╔══██╗████╗  ██║     ██║██║    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║     
█████╔╝ ███████║██╔██╗ ██║     ██║██║       ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║     
██╔═██╗ ██╔══██║██║╚██╗██║██   ██║██║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║     
██║  ██╗██║  ██║██║ ╚████║╚█████╔╝██║       ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚════╝ ╚═╝       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝`}
            </pre>
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
            <button
            onClick={() => toggleSetting('crtEnabled')}
            className={`text-[15px] uppercase border-2 border-current
                w-[90px] px-0 py-[5px] rounded
                transition-all duration-200 font-bold tracking-wider
                ${state.settings.crtEnabled
                ? 'bg-[var(--theme-color)] text-black shadow-[0_0_15px_var(--theme-color)]'
                : 'opacity-60 hover:opacity-100'
                }`}
            >
            CRT: {state.settings.crtEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={toggleSettingsView} className={`hover:opacity-100 transition-opacity ${currentView === 'settings' ? 'opacity-100 text-[var(--theme-color)] drop-shadow-[0_0_5px_var(--theme-color)]' : 'opacity-60'}`}>
                <Settings size={30} />
            </button>
        </div>
      </nav>

      {/* Main Content Render - Flex Grow and Scrollable */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0">
        {currentView === 'dashboard' && (
            <div className="h-full flex flex-col gap-2 md:gap-4 overflow-hidden">
                <div className="flex-1 min-h-0">
                    <Dashboard state={state} onResolve={startResolveSession} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 shrink-0 pb-1">
                    <button 
                        onClick={startDailySession}
                        disabled={isDailyLimitReached}
                        className={`group relative border-2 border-current p-3 md:p-4 text-left transition-all duration-300 overflow-hidden ${isDailyLimitReached ? 'opacity-50 cursor-not-allowed border-current/30' : 'hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] active:scale-[0.99]'} ${!introPlayed ? 'crt-intro-anim' : ''}`}
                        style={!introPlayed ? { animationDelay: '0.2s' } : {}}
                    >
                        <div className={`absolute -top-2 right-0 p-2 md:p-3 transition-opacity ${isDailyLimitReached ? 'opacity-10' : 'opacity-20 group-hover:opacity-10'}`}>
                            {isDailyLimitReached ? <Lock size={32} className="md:w-12 md:h-12" /> : <GridHourglassIcon size={48} className="md:w-20 md:h-20" />}
                        </div>
                        <h2 className="text-lg md:text-2xl font-bold mb-1 tracking-wide">
                            {isDailyLimitReached ? 'DAILY LIMIT REACHED' : `DAILY SESSION (${sessionsDone}/5)`}
                        </h2>
                        <p className="text-[10px] md:text-sm opacity-80 font-mono group-hover:font-bold">
                           {isDailyLimitReached ? 'Come back tomorrow for new sessions.' : '10 random questions per session.'}
                        </p>
                        {isDailyLimitReached && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[var(--theme-color)] font-bold text-xl md:text-2xl tracking-[0.2em] border border-current -rotate-3 uppercase shadow-[0_0_20px_black] backdrop-blur-sm">System Locked</div>}
                    </button>
                    
                    <button 
                        onClick={() => setCurrentView('quiz_setup')}
                        className={`group relative border-2 border-current p-3 md:p-4 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] active:scale-[0.99] ${!introPlayed ? 'crt-intro-anim' : ''}`}
                        style={!introPlayed ? { animationDelay: '0.4s' } : {}}
                    >
                         <div className="absolute -top-2 right-0 p-2 md:p-3 opacity-20 group-hover:opacity-10 transition-opacity">
                            <GridGlobeIcon size={48} className="md:w-20 md:h-20" />
                        </div>
                        <h2 className="text-lg md:text-2xl font-bold mb-1 tracking-wide">START SIMULATION</h2>
                        <p className="text-[10px] md:text-sm opacity-80 font-mono group-hover:font-bold">
                           Simulate JLPT exams (N5/N4).
                        </p>
                    </button>
                </div>
            </div>
        )}

        {currentView === 'learn' && <LearnMode progress={state.progress} settings={state.settings} />}

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
                isAccuracyMode={isDailySession || isBossMode}
            />
        )}
        
        {currentView === 'settings' && (
            <div className="flex-1 overflow-y-auto flex items-center justify-center">
                <div 
                    className="max-w-xl mx-auto w-full border-2 rounded-lg p-6 md:p-10 bg-black/60 shadow-[0_0_30px_rgba(0,0,0,0.6)] backdrop-blur-sm"
                    style={{ borderColor: themeColor }}
                >
                    <h2 
                        className="text-2xl md:text-3xl font-bold mb-6 border-b-2 pb-3 crt-text-glow"
                        style={{ borderColor: themeColor }}
                    >
                        SYSTEM CONFIGURATION
                    </h2>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between group">
                            <span className="text-base md:text-lg group-hover:text-shadow-[0_0_3px_currentColor] font-bold">Monitor Theme</span>
                            <button 
                                onClick={toggleTheme} 
                                className="select-none border-2 px-4 py-2 uppercase text-sm md:text-base hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-28 transition-all font-bold"
                                style={{ borderColor: themeColor }}
                            >
                                {state.settings.theme}
                            </button>
                        </div>
                        <div className="flex items-center justify-between group">
                            <span className="text-base md:text-lg group-hover:text-shadow-[0_0_3px_currentColor] font-bold">CRT Emulation</span>
                            <button 
                                onClick={() => toggleSetting('crtEnabled')} 
                                className="select-none border-2 px-4 py-2 uppercase text-sm md:text-base hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-28 transition-all font-bold"
                                style={{ borderColor: themeColor }}
                            >
                                {state.settings.crtEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>
                        {state.settings.crtEnabled && (
                            <>
                                <div 
                                    className="flex items-center justify-between pl-6 border-l-2 group"
                                    style={{ borderColor: themeColor + '4D' }}
                                >
                                    <span className="text-base md:text-lg opacity-80 group-hover:opacity-100 group-hover:text-shadow-[0_0_3px_currentColor]">Scanlines</span>
                                    <button 
                                        onClick={() => toggleSetting('scanlines')} 
                                        className="select-none border-2 px-4 py-2 uppercase text-sm md:text-base hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-28 transition-all font-bold"
                                        style={{ borderColor: themeColor }}
                                    >
                                        {state.settings.scanlines ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                                <div 
                                    className="flex items-center justify-between pl-6 border-l-2 group"
                                    style={{ borderColor: themeColor + '4D' }}
                                >
                                    <span className="text-base md:text-lg opacity-80 group-hover:opacity-100 group-hover:text-shadow-[0_0_3px_currentColor]">Phosphor Flicker</span>
                                    <button 
                                        onClick={() => toggleSetting('flicker')} 
                                        className="select-none border-2 px-4 py-2 uppercase text-sm md:text-base hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-28 transition-all font-bold"
                                        style={{ borderColor: themeColor }}
                                    >
                                        {state.settings.flicker ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                                <div 
                                    className="flex items-center justify-between pl-6 border-l-2 group"
                                    style={{ borderColor: themeColor + '4D' }}
                                >
                                    <span className="text-base md:text-lg opacity-80 group-hover:opacity-100 group-hover:text-shadow-[0_0_3px_currentColor]">Phosphor Glow</span>
                                    <button 
                                        onClick={() => toggleSetting('glow')} 
                                        className="select-none border-2 px-4 py-2 uppercase text-sm md:text-base hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] w-28 transition-all font-bold"
                                        style={{ borderColor: themeColor }}
                                    >
                                        {state.settings.glow ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </>
                        )}
                         <div 
                            className="pt-8 mt-8 border-t-2 text-center"
                            style={{ borderColor: themeColor + '4D' }}
                         >
                             <button 
                                onClick={() => { localStorage.removeItem('crt_kanji_lab_v1'); window.location.reload(); }}
                                className="select-none text-red-500 border-2 border-red-500 px-6 py-2 hover:bg-red-900/40 hover:text-red-300 hover:shadow-[0_0_20px_red] text-xs md:text-sm font-bold uppercase transition-all tracking-widest"
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
      <footer 
        className="mt-2 pt-2 border-t-2 flex justify-between items-center text-[10px] md:text-xs opacity-60 font-mono uppercase shrink-0 font-bold tracking-widest"
        style={{ borderColor: themeColor }}
      >
        <span>Mem: {Object.keys(state.progress).length} Blocks</span>
        <div className="flex items-center gap-2">
            <span>{versionStr} // BOOT COMPLETE</span>
            <div className="w-2.5 h-2.5 border-2 border-current animate-spin" />
        </div>
      </footer>
    </CRTContainer>
  );
}