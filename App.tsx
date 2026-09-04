import React, { useState, useEffect } from 'react';
import { CRTContainer } from './components/CRTContainer';
import { Dashboard } from './components/Dashboard';
import { LearnMode } from './components/LearnMode';
import { QuizMode } from './components/QuizMode';
import { AppState, UserProgress, QuizQuestion, KanjiData, QuizType } from './types';
import { kanjiList } from './data/kanji';
import { getDueItems } from './utils/srs';
import { Home, Book, Settings, Power, Zap, Target, BookOpen } from 'lucide-react';
import { LearnIntro } from './components/LearnIntro';
import { ReviewSetup } from './components/ReviewSetup';// Custom Grid Sphere Globe Icon Component
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
                <feGaussianBlur stdDeviation="2.8" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>

            <radialGradient id="globe-halo" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                <stop offset="55%" stopColor="currentColor" stopOpacity="0.08" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>

            <clipPath id="globe-clipSphere">
                <circle cx="64" cy="64" r="44" />
            </clipPath>
        </defs>

        {/* Halo */}
        <circle cx="64" cy="64" r="54" fill="url(#globe-halo)" />

        {/* Outer sphere */}
        <circle cx="64" cy="64" r="44" fill="none" stroke="currentColor" strokeWidth="4" filter="url(#globe-glow)" />

        {/* Grid lines clipped inside sphere */}
        <g clipPath="url(#globe-clipSphere)" stroke="currentColor" strokeWidth="2" fill="none" filter="url(#globe-glow)" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
            {/* Vertical meridians (ellipses) */}
            <ellipse cx="64" cy="64" rx="30" ry="44" />
            <ellipse cx="64" cy="64" rx="18" ry="44" />
            <ellipse cx="64" cy="64" rx="6" ry="44" />

            {/* Horizontal parallels */}
            <ellipse cx="64" cy="64" rx="44" ry="30" />
            <ellipse cx="64" cy="64" rx="44" ry="18" />
            <ellipse cx="64" cy="64" rx="44" ry="6" />
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
                <feGaussianBlur stdDeviation="2.8" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>

            <radialGradient id="hg-halo" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                <stop offset="55%" stopColor="currentColor" stopOpacity="0.08" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
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

type View = 'dashboard' | 'learn_intro' | 'learn_quiz' | 'review_setup' | 'review_quiz' | 'sim_setup' | 'sim_quiz' | 'learn' | 'settings';

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
    const [showResetModal, setShowResetModal] = useState(false);
    const [importPendingData, setImportPendingData] = useState<AppState | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const [learnBatch, setLearnBatch] = useState<KanjiData[]>([]);
    const [reviewConfig, setReviewConfig] = useState<{ type: string, count: number | 'all' } | null>(null);

    // Track initial load for intro animation
    const [introPlayed, setIntroPlayed] = useState(false);

    // Clock state
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setTimeout(() => {
            setIntroPlayed(true);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const clock = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(clock);
    }, []);

    // Save state to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('crt_kanji_lab_v1', JSON.stringify(state));
    }, [state]);

    const exportData = () => {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kanji_terminal_save_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target?.result as string);
                if (parsed && typeof parsed === 'object') {
                    const tracker = parsed.dailySessionTracker || {
                        date: new Date().toDateString(),
                        count: parsed.lastDailyCompleted && new Date(parsed.lastDailyCompleted).toDateString() === new Date().toDateString() ? 1 : 0
                    };
                    
                    setImportPendingData({
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
                    });
                } else {
                    setToastMessage("Invalid save file format.");
                }
            } catch (err) {
                console.error("Import failed", err);
                setToastMessage("Failed to parse save file.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const onQuizComplete = (results: Record<string, UserProgress>) => {
        let newProgress = { ...state.progress };
        let newHistory = { ...state.reviewHistory };

        Object.keys(results).forEach(id => {
            const result = results[id];
            const prev = state.progress[id];

            if (currentView === 'learn_quiz') {
                result.isLearned = true;
                if (result.missCount > (prev?.missCount || 0)) {
                    result.isDifficult = true;
                    result.difficultStreak = 0;
                }
            }
            else if (currentView === 'review_quiz') {
                if (prev?.isDifficult) {
                    if (result.missCount > prev.missCount) {
                        result.difficultStreak = 0;
                        result.isDifficult = true;
                    } else {
                        result.difficultStreak = (prev.difficultStreak || 0) + 1;
                        if (result.difficultStreak >= 2) {
                            result.isDifficult = false;
                            result.difficultStreak = 0;
                        } else {
                            result.isDifficult = true;
                        }
                    }
                }
            }

            newProgress[id] = result;
        });

        if (currentView === 'review_quiz' || currentView === 'sim_quiz') {
            const todayKey = new Date().toDateString();
            newHistory[todayKey] = (newHistory[todayKey] || 0) + 1;
        }

        setState({
            ...state,
            progress: newProgress,
            reviewHistory: newHistory
        });

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

    const startLearnSession = () => {
        const learnedIds = Object.keys(state.progress).filter(id => state.progress[id]?.isLearned);
        const unlearned = kanjiList.filter(k => !learnedIds.includes(k.id));

        if (unlearned.length === 0) {
            setToastMessage("There's nothing to learn");
            return;
        }

        const batch = unlearned.slice(0, 4);
        setLearnBatch(batch);
        setCurrentView('learn_intro');
    };

    const onLearnIntroComplete = () => {
        const batchIds = learnBatch.map(k => k.id);
        const learnedIds = Object.keys(state.progress).filter(id => state.progress[id]?.isLearned && !batchIds.includes(id));
        
        let pool: string[] = [];
        for (let i = 0; i < 20; i++) {
            const useBatch = Math.random() > 0.3 || learnedIds.length === 0;
            if (useBatch) {
                pool.push(batchIds[Math.floor(Math.random() * batchIds.length)]);
            } else {
                pool.push(learnedIds[Math.floor(Math.random() * learnedIds.length)]);
            }
        }
        
        generateQuestions(pool, 'random');
        setCurrentView('learn_quiz');
    };

    const startReviewSession = (type: string, count: number | 'all') => {
        setReviewConfig({ type, count });

        let pool = (Object.values(state.progress) as UserProgress[]).filter(p => p.isLearned);

        if (type === 'difficult') {
            pool = pool.filter(p => p.isDifficult);
        }

        // Sort: difficult first, then by nextReview ascending
        pool.sort((a, b) => {
            if (a.isDifficult && !b.isDifficult) return -1;
            if (!a.isDifficult && b.isDifficult) return 1;
            return a.nextReview - b.nextReview;
        });

        let selectedIds = pool.map(p => p.kanjiId);
        if (count !== 'all') {
            selectedIds = selectedIds.slice(0, count as number);
        }

        generateQuestions(selectedIds, type);
        setCurrentView('review_quiz');
    };

    const startSimulation = (level: 'N5' | 'N4') => {
        const targetKanji = kanjiList
            .filter(k => k.level === level)
            .sort(() => 0.5 - Math.random())
            .slice(0, 20);

        generateQuestions(targetKanji.map(k => k.id), 'random');
        setCurrentView('sim_quiz');
    };

    const generateQuestions = (ids: string[], typeConstraint: string) => {
        const questions: QuizQuestion[] = ids.map(id => {
            const k = kanjiList.find(i => i.id === id)!;

            let type: QuizType = 'meaning';
            if (typeConstraint === 'random' || typeConstraint === 'difficult' || typeConstraint === 'learn_mix') {
                const r = Math.random();
                type = r > 0.75 ? 'meaning' : (r > 0.5 ? 'reading' : (r > 0.25 ? 'reverse' : 'reading_reverse'));
            } else {
                type = typeConstraint as QuizType;
            }

            let getOptionValue: (item: KanjiData) => string;
            let correctAnswer = '';

            if (type === 'meaning') {
                getOptionValue = (item) => item.meaning;
                correctAnswer = getOptionValue(k);
            } else if (type === 'reading') {
                getOptionValue = (item) => {
                    const on = item.onyomi.join(', ');
                    const kun = item.kunyomi.join(', ');
                    return on ? (kun ? `${on} / ${kun}` : on) : kun || '---';
                };
                correctAnswer = getOptionValue(k);
            } else if (type === 'reverse') { // Meaning -> Kanji
                getOptionValue = (item) => item.char;
                correctAnswer = getOptionValue(k);
            } else { // reading_reverse: Reading -> Kanji
                getOptionValue = (item) => item.char;
                correctAnswer = getOptionValue(k);
            }

            const sessionDistractors = kanjiList.filter(item => item.id !== id && getOptionValue(item) !== correctAnswer && ids.includes(item.id));
            const learnedDistractors = kanjiList.filter(item => item.id !== id && getOptionValue(item) !== correctAnswer && !ids.includes(item.id) && state.progress[item.id]?.isLearned);
            const unlearnedDistractors = kanjiList.filter(item => item.id !== id && getOptionValue(item) !== correctAnswer && !ids.includes(item.id) && !state.progress[item.id]?.isLearned);

            const rawDistractors: KanjiData[] = [];
            
            if (sessionDistractors.length > 0) {
                rawDistractors.push(sessionDistractors.sort(() => 0.5 - Math.random())[0]);
            }
            if (learnedDistractors.length > 0) {
                rawDistractors.push(learnedDistractors.sort(() => 0.5 - Math.random())[0]);
            }
            
            const remainingPool = [...sessionDistractors, ...learnedDistractors, ...unlearnedDistractors].filter(d => !rawDistractors.find(x => x.id === d.id));
            const needed = 3 - rawDistractors.length;
            
            const extraDistractors = remainingPool.sort(() => 0.5 - Math.random()).slice(0, needed);
            rawDistractors.push(...extraDistractors);

            const options = shuffle([correctAnswer, ...rawDistractors.map(getOptionValue)]);

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

    const versionStr = `VER ${currentTime.getMonth() + 1}.${currentTime.getDate()}.${currentTime.getFullYear().toString().slice(-2)}`;

    const h = currentTime.getHours().toString().padStart(2, '0');
    const m = currentTime.getMinutes().toString().padStart(2, '0');
    const s = currentTime.getSeconds().toString().padStart(2, '0');
    const tickRateStr = `TICKRATE ${h}:${m}:${s}`;

    return (
        <CRTContainer settings={state.settings}>
            {/* Top Navigation - Fixed Height */}
            <nav
                className="flex flex-col md:flex-row justify-between w-full items-center border-b-2 pb-2 md:pb-4 select-none shrink-0 gap-2 md:gap-0"
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
                        <button onClick={() => setCurrentView('dashboard')} className={`outline-none flex items-center gap-2 transition-all duration-200 text-base md:text-lg uppercase tracking-wider ${currentView === 'dashboard' ? 'opacity-100 font-bold text-shadow-[0_0_5px_currentColor]' : 'opacity-60 hover:opacity-100 hover:text-shadow-[0_0_5px_currentColor]'}`}>
                            <Home size={18} /> <span className="hidden sm:inline">DASHBOARD</span>
                        </button>
                        <button onClick={() => setCurrentView('learn')} className={`outline-none flex items-center gap-2 transition-all duration-200 text-base md:text-lg uppercase tracking-wider ${currentView === 'learn' ? 'opacity-100 font-bold text-shadow-[0_0_5px_currentColor]' : 'opacity-60 hover:opacity-100 hover:text-shadow-[0_0_5px_currentColor]'}`}>
                            <Book size={18} /> <span className="hidden sm:inline">DATABASE</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <button
                        onClick={() => toggleSetting('crtEnabled')}
                        className={`outline-none text-[15px] uppercase border-2 border-current
                w-[90px] px-0 py-[5px] rounded
                transition-all duration-200 font-bold tracking-wider
                ${state.settings.crtEnabled
                                ? 'bg-[var(--theme-color)] text-black shadow-[0_0_2px_var(--theme-color)]'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                    >
                        CRT: {state.settings.crtEnabled ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={toggleSettingsView} className={`outline-none hover:opacity-100 transition-opacity ${currentView === 'settings' ? 'opacity-100 text-[var(--theme-color)] drop-shadow-[0_0_5px_var(--theme-color)]' : 'opacity-60'}`}>
                        <Settings size={30} />
                    </button>
                </div>
            </nav>

            {/* Main Content Render - Flex Grow and Scrollable */}
            <main className="flex-1 overflow-visible flex flex-col min-h-0">
                {currentView === 'dashboard' && (
                    <div className="h-full flex flex-col gap-2 md:gap-4 overflow-visible">
                        <div className="flex-1 min-h-0">
                            <Dashboard state={state} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 shrink-0 p-6 -m-6 z-10 relative">
                            <button
                                onClick={startLearnSession}
                                className={`outline-none group relative border-2 border-current p-3 md:p-4 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] active:scale-[0.99] ${!introPlayed ? 'crt-intro-anim' : ''}`}
                                style={!introPlayed ? { animationDelay: '0.2s' } : {}}
                            >
                                <div className="absolute -top-2 right-0 p-2 md:p-3 opacity-20 group-hover:opacity-10 transition-opacity">
                                    <BookOpen size={48} className="md:w-20 md:h-20" />
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold mb-1 tracking-wide">LEARN</h2>
                                <p className="text-[10px] md:text-sm opacity-80 font-mono group-hover:font-bold">
                                    Learn new kanji
                                </p>
                            </button>

                            <button
                                onClick={() => setCurrentView('review_setup')}
                                className={`outline-none group relative border-2 border-current p-3 md:p-4 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] active:scale-[0.99] ${!introPlayed ? 'crt-intro-anim' : ''}`}
                                style={!introPlayed ? { animationDelay: '0.3s' } : {}}
                            >
                                <div className="absolute -top-2 right-0 p-2 md:p-3 opacity-20 group-hover:opacity-10 transition-opacity">
                                    <Zap size={48} className="md:w-20 md:h-20" />
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold mb-1 tracking-wide">REVIEW</h2>
                                <p className="text-[10px] md:text-sm opacity-80 font-mono group-hover:font-bold">
                                    Review learned kanjis.
                                </p>
                            </button>

                            <button
                                onClick={() => setCurrentView('sim_setup')}
                                className={`outline-none group relative border-2 border-current p-3 md:p-4 text-left transition-all duration-300 overflow-hidden hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_30px_var(--theme-color)] active:scale-[0.99] ${!introPlayed ? 'crt-intro-anim' : ''}`}
                                style={!introPlayed ? { animationDelay: '0.4s' } : {}}
                            >
                                <div className="absolute -top-2 right-0 p-2 md:p-3 opacity-20 group-hover:opacity-10 transition-opacity">
                                    <Target size={48} className="md:w-20 md:h-20" />
                                </div>
                                <h2 className="text-lg md:text-2xl font-bold mb-1 tracking-wide">SIMULATION</h2>
                                <p className="text-[10px] md:text-sm opacity-80 font-mono group-hover:font-bold">
                                    Test kanji proficiency.
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {currentView === 'learn' && <LearnMode progress={state.progress} settings={state.settings} />}

                {currentView === 'learn_intro' && (
                    <LearnIntro
                        batch={learnBatch}
                        settings={state.settings}
                        onComplete={onLearnIntroComplete}
                        onAbort={() => setCurrentView('dashboard')}
                    />
                )}

                {currentView === 'review_setup' && (
                    <ReviewSetup
                        learnedCount={(Object.values(state.progress) as UserProgress[]).filter(p => p.isLearned).length}
                        difficultCount={(Object.values(state.progress) as UserProgress[]).filter(p => p.isDifficult).length}
                        settings={state.settings}
                        onStart={startReviewSession}
                        onBack={() => setCurrentView('dashboard')}
                    />
                )}

                {currentView === 'sim_setup' && (
                    <div className="flex flex-col items-center justify-center h-full gap-8 md:gap-12 animate-in fade-in duration-500">
                        <h2 className="text-3xl md:text-5xl font-bold uppercase crt-text-glow text-center tracking-tighter">Select Simulation Level</h2>
                        <div className="flex flex-col md:flex-row gap-4 md:gap-10 w-full md:w-auto px-6 md:px-0">
                            <button
                                onClick={() => startSimulation('N5')}
                                className="w-full md:w-56 h-24 md:h-40 border-2 border-current flex flex-col items-center justify-center transition-all duration-300 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_40px_var(--theme-color)] hover:scale-105 group"
                            >
                                <span className="text-5xl md:text-7xl font-bold mb-1 md:mb-3 group-hover:scale-110 transition-transform">N5</span>
                                <span className="text-xs md:text-base uppercase tracking-[0.3em] font-bold">Beginner</span>
                            </button>
                            <button
                                onClick={() => startSimulation('N4')}
                                className="w-full md:w-56 h-24 md:h-40 border-2 border-current flex flex-col items-center justify-center transition-all duration-300 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_40px_var(--theme-color)] hover:scale-105 group"
                            >
                                <span className="text-5xl md:text-7xl font-bold mb-1 md:mb-3 group-hover:scale-110 transition-transform">N4</span>
                                <span className="text-xs md:text-base uppercase tracking-[0.3em] font-bold">Elementary</span>
                            </button>
                        </div>
                        <button onClick={() => setCurrentView('dashboard')} className="mt-6 md:mt-10 opacity-60 hover:opacity-100 hover:text-shadow-[0_0_5px_currentColor] underline tracking-widest text-base md:text-lg font-bold uppercase">Back to Dashboard</button>
                    </div>
                )}

                {(currentView === 'learn_quiz' || currentView === 'review_quiz' || currentView === 'sim_quiz') && (
                    <QuizMode
                        questions={activeQuizQuestions}
                        onComplete={onQuizComplete}
                        settings={state.settings}
                        appState={state}
                        onExit={() => setCurrentView('dashboard')}
                        mode={currentView === 'learn_quiz' ? 'learn' : currentView === 'review_quiz' ? 'review' : 'simulation'}
                        isTimed={currentView === 'sim_quiz'}
                        isAccuracyMode={currentView === 'sim_quiz'}
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
                                    className="flex justify-center gap-4 pt-6 mt-6 border-t-2"
                                    style={{ borderColor: themeColor + '4D' }}
                                >
                                    <button
                                        onClick={exportData}
                                        className="select-none border-2 px-4 py-2 text-xs md:text-sm font-bold uppercase hover:bg-white/10 transition-all tracking-widest"
                                        style={{ borderColor: themeColor }}
                                    >
                                        Export Save
                                    </button>
                                    <label
                                        className="select-none border-2 px-4 py-2 text-xs md:text-sm font-bold uppercase hover:bg-white/10 transition-all tracking-widest cursor-pointer"
                                        style={{ borderColor: themeColor }}
                                    >
                                        Import Save
                                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                                    </label>
                                </div>

                                <div
                                    className="pt-6 mt-6 border-t-2 text-center"
                                    style={{ borderColor: themeColor + '4D' }}
                                >
                                    <button
                                        onClick={() => setShowResetModal(true)}
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

            {/* Factory Reset Confirmation Modal */}
            {showResetModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
                    onClick={() => setShowResetModal(false)}
                >
                    <div
                        className="relative font-mono uppercase tracking-widest select-none"
                        style={{
                            border: `2px solid #ef4444`,
                            boxShadow: `0 0 30px #ef444480, 0 0 60px #ef444430, inset 0 0 30px rgba(239,68,68,0.05)`,
                            backgroundColor: '#050a05',
                            minWidth: '320px',
                            maxWidth: '480px',
                            width: '90vw',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Scanline overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                                zIndex: 1
                            }}
                        />

                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500" style={{ margin: '-2px' }} />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500" style={{ margin: '-2px' }} />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500" style={{ margin: '-2px' }} />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500" style={{ margin: '-2px' }} />

                        <div className="relative z-10 p-6 flex flex-col gap-5">
                            {/* Header */}
                            <div className="flex items-center gap-3 border-b-2 border-red-500/40 pb-4">
                                <Power className="w-5 h-5 text-red-500 shrink-0" style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }} />
                                <span className="text-red-500 text-sm font-bold tracking-widest" style={{ textShadow: '0 0 8px #ef4444' }}>
                                    System Warning
                                </span>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col gap-3 text-center">
                                <p className="text-red-400 text-xs leading-relaxed" style={{ textShadow: '0 0 4px #ef444466' }}>
                                    Factory reset will permanently erase all progress data.
                                </p>
                                <p className="text-red-300/60 text-[10px] leading-relaxed">
                                    [ learned kanji ] [ quiz history ] [ session records ]
                                </p>
                                <p
                                    className="text-red-500 text-xs font-bold animate-pulse mt-1"
                                    style={{ textShadow: '0 0 8px #ef4444' }}
                                >
                                    This action cannot be undone.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="flex-1 text-xs py-2 px-4 font-bold border-2 transition-all"
                                    style={{
                                        borderColor: themeColor,
                                        color: themeColor,
                                        textShadow: `0 0 6px ${themeColor}`,
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = themeColor + '22';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 15px ${themeColor}66`;
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                    }}
                                >
                                    [ Abort ]
                                </button>
                                <button
                                    onClick={() => { localStorage.removeItem('crt_kanji_lab_v1'); window.location.reload(); }}
                                    className="flex-1 text-xs py-2 px-4 font-bold border-2 border-red-500 text-red-500 transition-all"
                                    style={{ textShadow: '0 0 6px #ef4444' }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ef444422';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px #ef444466';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                                        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                                    }}
                                >
                                    [ Confirm Reset ]
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Confirmation Modal */}
            {importPendingData && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
                    onClick={() => setImportPendingData(null)}
                >
                    <div
                        className="relative font-mono uppercase tracking-widest select-none"
                        style={{
                            border: `2px solid ${themeColor}`,
                            boxShadow: `0 0 30px ${themeColor}80, 0 0 60px ${themeColor}30, inset 0 0 30px ${themeColor}10`,
                            backgroundColor: '#050a05',
                            minWidth: '320px',
                            maxWidth: '480px',
                            width: '90vw',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Scanline overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                                zIndex: 1
                            }}
                        />

                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ margin: '-2px', borderColor: themeColor }} />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ margin: '-2px', borderColor: themeColor }} />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ margin: '-2px', borderColor: themeColor }} />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ margin: '-2px', borderColor: themeColor }} />

                        <div className="relative z-10 p-6 flex flex-col gap-5">
                            {/* Header */}
                            <div className="flex items-center gap-3 border-b-2 pb-4" style={{ borderColor: themeColor + '40' }}>
                                <BookOpen className="w-5 h-5 shrink-0" style={{ color: themeColor, filter: `drop-shadow(0 0 6px ${themeColor})` }} />
                                <span className="text-sm font-bold tracking-widest" style={{ color: themeColor, textShadow: `0 0 8px ${themeColor}` }}>
                                    Import Data
                                </span>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col gap-3 text-sm" style={{ color: themeColor }}>
                                <div className="flex justify-between border-b pb-1" style={{ borderColor: themeColor + '40' }}>
                                    <span className="opacity-70">Learned Kanji</span>
                                    <span className="font-bold">{Object.values(importPendingData.progress).filter((p: any) => p.isLearned).length}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1" style={{ borderColor: themeColor + '40' }}>
                                    <span className="opacity-70">Difficult Kanji</span>
                                    <span className="font-bold text-red-400">{Object.values(importPendingData.progress).filter((p: any) => p.isDifficult).length}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1" style={{ borderColor: themeColor + '40' }}>
                                    <span className="opacity-70">Total Records</span>
                                    <span className="font-bold">{Object.keys(importPendingData.progress).length}</span>
                                </div>
                                <div className="flex justify-between pb-1">
                                    <span className="opacity-70">Last Active</span>
                                    <span className="font-bold text-xs pt-1">{importPendingData.dailySessionTracker?.date || 'Unknown'}</span>
                                </div>
                                <p className="text-xs opacity-60 mt-2 text-center italic">
                                    Warning: This will overwrite current progress.
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setImportPendingData(null)}
                                    className="flex-1 text-xs py-2 px-4 font-bold border-2 transition-all hover:bg-white/10"
                                    style={{
                                        borderColor: themeColor,
                                        color: themeColor,
                                    }}
                                >
                                    [ Cancel ]
                                </button>
                                <button
                                    onClick={() => {
                                        setState(importPendingData);
                                        setImportPendingData(null);
                                    }}
                                    className="flex-1 text-xs py-2 px-4 font-bold border-2 transition-all text-black hover:scale-[1.02]"
                                    style={{
                                        backgroundColor: themeColor,
                                        borderColor: themeColor,
                                        boxShadow: `0 0 15px ${themeColor}80`
                                    }}
                                >
                                    [ Import ]
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Status Line - Fixed Height */}
            <footer
                className="mt-2 pt-2 border-t-2 flex justify-between items-center text-[10px] md:text-xs opacity-60 font-mono uppercase shrink-0 font-bold tracking-widest"
                style={{ borderColor: themeColor }}
            >
                <span>Mem: {Object.keys(state.progress).length} Blocks</span>
                <div className="flex items-center gap-2">
                    <span>{tickRateStr} // {versionStr} // BOOT COMPLETE</span>
                    <div className="w-2.5 h-2.5 border-2 border-current animate-spin" />
                </div>
            </footer>

            {/* Custom Toast Notification */}
            {toastMessage && (
                <div 
                    className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 font-mono font-bold uppercase tracking-widest text-sm md:text-base animate-in slide-in-from-top-4 fade-in duration-300 select-none text-center"
                    style={{ 
                        backgroundColor: 'rgba(5, 10, 5, 0.95)',
                        border: `2px solid ${themeColor}`, 
                        color: themeColor, 
                        boxShadow: `0 0 20px ${themeColor}66, inset 0 0 10px ${themeColor}22` 
                    }}
                >
                    <span style={{ textShadow: `0 0 8px ${themeColor}` }}>{toastMessage}</span>
                </div>
            )}
        </CRTContainer>
    );
}