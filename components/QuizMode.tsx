import React, { useState, useEffect } from 'react';
import { QuizQuestion, AppSettings, AppState, UserProgress } from '../types';
import { calculateReview } from '../utils/srs';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Timer, ArrowRight, MousePointer2, RefreshCw } from 'lucide-react';

interface QuizModeProps {
  questions: QuizQuestion[];
  onComplete: (results: Record<string, UserProgress>) => void;
  settings: AppSettings;
  appState: AppState;
  onExit: () => void;
  isTimed?: boolean;
}

export const QuizMode: React.FC<QuizModeProps> = ({ questions, onComplete, settings, appState, onExit, isTimed }) => {
  // Queue state for dynamic mastery loop
  const [queue, setQueue] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [sessionResults, setSessionResults] = useState<Record<string, UserProgress>>({});
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set()); // Track first attempts for SRS integrity
  const [timeLeft, setTimeLeft] = useState(isTimed ? 300 : 0);

  // Initialize queue from props
  useEffect(() => {
    setQueue(questions);
    setCurrentIndex(0);
    setProcessedIds(new Set());
    setSessionResults({});
    setShowAnswer(false);
    setFeedback(null);
  }, [questions]);

  const currentQuestion = queue[currentIndex];
  const isLast = currentIndex === queue.length - 1;
  const isRetry = currentQuestion ? processedIds.has(currentQuestion.kanji.id) : false;

  useEffect(() => {
    if (isTimed && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (isTimed && timeLeft === 0) {
      handleFinish();
    }
  }, [timeLeft, isTimed]);

  const handleFinish = () => {
    onComplete(sessionResults);
  };

  const handleOptionClick = (option: string) => {
    if (showAnswer) return;

    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correctAnswer;
    const kanjiId = currentQuestion.kanji.id;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setShowAnswer(true);

    // SRS Logic: Only grade the first attempt
    if (!processedIds.has(kanjiId)) {
        // Default Quality: 5 (Easy) for correct, 2 (Hard) for incorrect
        const defaultQuality = isCorrect ? 5 : 2;
        
        const currentProg = appState.progress[kanjiId] || sessionResults[kanjiId];
        const newProg = calculateReview(kanjiId, currentProg, defaultQuality);
        
        setSessionResults(prev => ({
            ...prev,
            [kanjiId]: newProg
        }));

        setProcessedIds(prev => new Set(prev).add(kanjiId));
    }

    // Mastery Logic: If incorrect, add to end of queue
    if (!isCorrect) {
        setQueue(prev => [...prev, currentQuestion]);
    }
  };

  const manualGrade = (quality: number) => {
     if (!currentQuestion) return;
     const kanjiId = currentQuestion.kanji.id;
     
     // Only allow manual grading if it's the first attempt (SRS integrity)
     if (!processedIds.has(kanjiId)) {
        const currentProg = appState.progress[kanjiId] || sessionResults[kanjiId];
        const newProg = calculateReview(kanjiId, currentProg, quality);
        
        setSessionResults(prev => ({
            ...prev,
            [kanjiId]: newProg
        }));
        setProcessedIds(prev => new Set(prev).add(kanjiId));
     }
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentIndex(i => i + 1);
      setShowAnswer(false);
      setSelectedOption(null);
      setFeedback(null);
    }
  };

  if (!currentQuestion) return <div>Initializing Data Stream...</div>;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full overflow-hidden p-2 md:p-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-current pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-3 md:gap-6">
          <button onClick={onExit} className="hover:bg-white/20 px-2 py-1 rounded transition-colors text-xs md:text-sm uppercase tracking-widest border border-current font-bold">[ ESC ] Abort</button>
          <div className="flex items-center gap-2">
              <span className="font-mono text-lg md:text-xl font-bold">Q: {currentIndex + 1}/{queue.length}</span>
              {isRetry && feedback !== 'correct' && (
                  <span className="bg-amber-500/20 text-amber-500 border border-amber-500 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                      <RefreshCw size={10} /> Retry
                  </span>
              )}
          </div>
        </div>
        {isTimed && (
          <div className="flex items-center gap-3 font-mono text-lg md:text-xl font-bold">
             <Timer className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
             {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center justify-start min-h-0 relative">
        <AnimatePresence mode='wait'>
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex flex-col items-center h-full"
          >
             {/* Prompt Title */}
             {!showAnswer && (
                 <h2 className="text-sm md:text-base uppercase tracking-[0.3em] mb-2 md:mb-4 opacity-80 font-bold border-b border-current/30 pb-2 w-full text-center shrink-0">
                   {currentQuestion.type === 'reading' ? 'Select Correct Reading' : 
                    currentQuestion.type === 'meaning' ? 'Select Correct Meaning' : 'Select Matching Kanji'}
                 </h2>
             )}
             
             {/* Content */}
             {!showAnswer ? (
                <>
                    {/* Large Character Display */}
                    <div className="flex-shrink-0 mb-4 md:mb-8 text-center flex-1 flex flex-col justify-center min-h-0">
                        <div className="text-[5rem] md:text-[8rem] lg:text-[10rem] leading-none font-bold crt-text-glow transition-all duration-300">
                            {currentQuestion.type === 'reverse' ? <span className="text-3xl md:text-6xl max-w-2xl block leading-tight">{currentQuestion.kanji.meaning}</span> : currentQuestion.kanji.char}
                        </div>
                        {currentQuestion.type === 'reverse' && <div className="text-sm md:text-lg opacity-60 mt-1 md:mt-2 font-mono uppercase tracking-widest">Identify Character</div>}
                    </div>

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-4xl shrink-0 pb-2">
                    {currentQuestion.options.map((option, idx) => (
                        <button
                        key={idx}
                        onClick={() => handleOptionClick(option)}
                        className="group relative border-2 border-current p-3 md:p-4 text-left transition-all duration-200 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_20px_var(--theme-color)] hover:scale-[1.01] active:scale-[0.99] flex items-center gap-3 md:gap-4"
                        >
                            <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-current flex items-center justify-center font-bold text-sm md:text-base group-hover:border-black shrink-0">
                                {idx + 1}
                            </div>
                            <span className="text-lg md:text-xl font-bold font-mono leading-tight break-words">{option}</span>
                            <MousePointer2 className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5" />
                        </button>
                    ))}
                    </div>
                </>
             ) : (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="w-full max-w-4xl mx-auto flex flex-col h-full overflow-hidden"
               >
                 {/* Feedback Banner - Larger Text */}
                 <div className={`w-full p-3 md:p-4 mb-3 border-2 flex items-center justify-between shrink-0 ${feedback === 'correct' ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-red-500 bg-red-900/30 text-red-400'}`}>
                    <div className="flex items-center gap-3 text-xl md:text-3xl font-bold uppercase tracking-wider">
                       {feedback === 'correct' ? <Check className="w-6 h-6 md:w-8 md:h-8" /> : <X className="w-6 h-6 md:w-8 md:h-8" />}
                       <div>
                           <div>{feedback === 'correct' ? 'CORRECT' : 'INCORRECT'}</div>
                           {feedback === 'incorrect' && <div className="text-[10px] md:text-xs font-mono font-bold flex items-center gap-1 mt-0.5"><RefreshCw size={10}/> REQUEUED FOR MASTERY</div>}
                       </div>
                    </div>
                    {feedback === 'incorrect' && (
                        <div className="text-right leading-none">
                           <div className="text-xs md:text-sm uppercase opacity-70 font-bold mb-1">Correct Answer</div>
                           <div className="text-lg md:text-2xl font-bold font-mono text-white">{currentQuestion.correctAnswer}</div>
                        </div>
                    )}
                 </div>

                 {/* Info Card - Auto-fitting layout with Larger Text */}
                 <div className="flex-1 border-2 border-current p-4 md:p-6 bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden min-h-0">
                     
                     <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1">
                        {/* Header Row: Kanji + Meaning */}
                        <div className="flex items-end gap-6 border-b border-current/30 pb-4 mb-4">
                             <div className="text-6xl md:text-8xl font-bold text-[var(--theme-color)] crt-text-glow leading-none">{currentQuestion.kanji.char}</div>
                             <div className="pb-1 min-w-0 flex-1">
                                 <div className="text-2xl md:text-4xl font-bold opacity-90 uppercase tracking-widest leading-tight truncate mb-1">{currentQuestion.kanji.meaning}</div>
                                 <div className="text-xs md:text-sm uppercase opacity-60 font-bold tracking-widest">JLPT {currentQuestion.kanji.level} • ID: {currentQuestion.kanji.id.toUpperCase()}</div>
                             </div>
                        </div>

                        {/* Readings Grid - Larger Text */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="border-l-4 border-current/30 pl-4">
                                <span className="block text-xs md:text-sm uppercase opacity-60 font-bold tracking-widest text-[var(--theme-color)] mb-1">Onyomi (Chinese)</span>
                                <div className="text-xl md:text-3xl font-mono font-bold leading-tight break-words">{currentQuestion.kanji.onyomi.join(', ') || '-'}</div>
                            </div>
                            <div className="border-l-4 border-current/30 pl-4">
                                <span className="block text-xs md:text-sm uppercase opacity-60 font-bold tracking-widest text-[var(--theme-color)] mb-1">Kunyomi (Japanese)</span>
                                <div className="text-xl md:text-3xl font-mono font-bold leading-tight break-words">{currentQuestion.kanji.kunyomi.join(', ') || '-'}</div>
                            </div>
                        </div>

                         {/* Vocab List - Larger Text */}
                         {currentQuestion.kanji.examples.length > 0 && (
                             <div className="bg-white/5 p-3 md:p-4 border border-current/20">
                                 <span className="block text-xs md:text-sm uppercase opacity-50 font-bold tracking-widest mb-2">Examples</span>
                                 <div className="space-y-3">
                                     {currentQuestion.kanji.examples.slice(0, 2).map((ex, i) => (
                                         <div key={i} className="flex justify-between items-baseline text-sm md:text-base opacity-90 border-b border-current/10 pb-2 last:border-0 last:pb-0">
                                             <div className="flex gap-3 items-baseline">
                                                <span className="font-bold text-lg md:text-xl text-[var(--theme-color)]">{ex.word}</span>
                                                <span className="font-mono text-sm md:text-base opacity-70">[{ex.reading}]</span>
                                             </div>
                                             <span className="text-right truncate ml-4 font-bold opacity-80 text-base md:text-lg">{ex.meaning}</span>
                                         </div>
                                     ))}
                                     {currentQuestion.kanji.examples.length > 2 && (
                                         <div className="text-xs md:text-sm opacity-40 text-center uppercase font-bold pt-1">
                                             + {currentQuestion.kanji.examples.length - 2} more
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )}
                     </div>

                     {/* Action Bar - Sticky at bottom of card - Larger buttons */}
                     <div className="mt-4 pt-4 border-t-2 border-current/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shrink-0">
                        <div className="flex gap-3 items-center justify-center md:justify-start min-h-[44px]">
                            {!isRetry && (
                                <>
                                    <span className="text-xs md:text-sm uppercase opacity-50 font-bold mr-2 hidden md:inline whitespace-nowrap">Override Rating:</span>
                                    <button onClick={() => manualGrade(3)} className="px-4 py-2 md:py-3 border-2 border-current hover:bg-[var(--theme-color)] hover:text-black text-xs md:text-sm font-bold uppercase transition-colors min-w-[70px]">Hard</button>
                                    <button onClick={() => manualGrade(4)} className="px-4 py-2 md:py-3 border-2 border-current hover:bg-[var(--theme-color)] hover:text-black text-xs md:text-sm font-bold uppercase transition-colors min-w-[70px]">Good</button>
                                    <button onClick={() => manualGrade(5)} className="px-4 py-2 md:py-3 border-2 border-current hover:bg-[var(--theme-color)] hover:text-black text-xs md:text-sm font-bold uppercase transition-colors min-w-[70px]">Easy</button>
                                </>
                            )}
                            {isRetry && (
                                <span className="text-xs md:text-sm uppercase opacity-50 font-bold italic">
                                    Rating recorded on first attempt.
                                </span>
                            )}
                        </div>
                        
                        <button 
                            onClick={handleNext}
                            className="px-8 py-3 bg-[var(--theme-color)] text-black font-bold text-base md:text-lg uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_var(--theme-color)] flex items-center justify-center gap-3 whitespace-nowrap"
                        >
                            {isLast ? 'Finish Session' : 'Next Data Block'} <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                     </div>
                 </div>
               </motion.div>
             )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};