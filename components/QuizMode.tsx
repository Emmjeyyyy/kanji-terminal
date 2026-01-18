import React, { useState, useEffect } from 'react';
import { QuizQuestion, AppSettings, AppState, UserProgress } from '../types';
import { calculateReview } from '../utils/srs';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Timer, ArrowRight, MousePointer2 } from 'lucide-react';

interface QuizModeProps {
  questions: QuizQuestion[];
  onComplete: (results: Record<string, UserProgress>) => void;
  settings: AppSettings;
  appState: AppState;
  onExit: () => void;
  isTimed?: boolean;
}

export const QuizMode: React.FC<QuizModeProps> = ({ questions, onComplete, settings, appState, onExit, isTimed }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [sessionResults, setSessionResults] = useState<Record<string, UserProgress>>({});
  const [timeLeft, setTimeLeft] = useState(isTimed ? 300 : 0);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

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
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setShowAnswer(true);

    // Default Quality: 5 (Easy) for correct, 2 (Hard) for incorrect
    const defaultQuality = isCorrect ? 5 : 2;
    saveResult(defaultQuality);
  };

  const saveResult = (quality: number) => {
     const kId = currentQuestion.kanji.id;
     const currentProg = appState.progress[kId] || sessionResults[kId];
     const newProg = calculateReview(kId, currentProg, quality);
     
     setSessionResults(prev => ({
       ...prev,
       [kId]: newProg
     }));
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

  if (!currentQuestion) return <div>No questions loaded.</div>;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full overflow-y-auto custom-scrollbar p-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-current pb-4 mb-4 md:mb-8 shrink-0">
        <div className="flex items-center gap-4 md:gap-6">
          <button onClick={onExit} className="hover:bg-white/20 px-3 py-1.5 rounded transition-colors text-sm md:text-base uppercase tracking-widest border border-current font-bold">[ ESC ] Abort</button>
          <span className="font-mono text-xl md:text-2xl font-bold">Q: {currentIndex + 1}/{questions.length}</span>
        </div>
        {isTimed && (
          <div className="flex items-center gap-3 font-mono text-xl md:text-2xl font-bold">
             <Timer className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
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
             <h2 className="text-base md:text-xl uppercase tracking-[0.3em] mb-4 md:mb-6 opacity-80 font-bold border-b border-current/30 pb-2 w-full text-center">
               {currentQuestion.type === 'reading' ? 'Select Correct Reading' : 
                currentQuestion.type === 'meaning' ? 'Select Correct Meaning' : 'Select Matching Kanji'}
             </h2>
             
             {/* Large Character Display */}
             <div className="flex-shrink-0 mb-6 md:mb-10 text-center">
               <div className="text-[6rem] md:text-[10rem] leading-none font-bold crt-text-glow transition-all duration-300">
                 {currentQuestion.type === 'reverse' ? <span className="text-4xl md:text-7xl max-w-2xl block leading-tight">{currentQuestion.kanji.meaning}</span> : currentQuestion.kanji.char}
               </div>
               {currentQuestion.type === 'reverse' && <div className="text-lg md:text-xl opacity-60 mt-2 font-mono uppercase tracking-widest">Identify Character</div>}
             </div>
             
             {/* Multiple Choice Grid */}
             {!showAnswer ? (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl">
                   {currentQuestion.options.map((option, idx) => (
                     <button
                       key={idx}
                       onClick={() => handleOptionClick(option)}
                       className="group relative border-2 border-current p-4 md:p-6 text-left transition-all duration-200 hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_20px_var(--theme-color)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4"
                     >
                        <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-current flex items-center justify-center font-bold text-lg md:text-xl group-hover:border-black">
                          {idx + 1}
                        </div>
                        <span className="text-xl md:text-3xl font-bold font-mono leading-tight">{option}</span>
                        <MousePointer2 className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6" />
                     </button>
                   ))}
                </div>
             ) : (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="w-full max-w-3xl mx-auto flex flex-col h-full"
               >
                 {/* Feedback Banner */}
                 <div className={`w-full p-4 mb-6 border-2 flex items-center justify-between ${feedback === 'correct' ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-red-500 bg-red-900/30 text-red-400'}`}>
                    <div className="flex items-center gap-3 text-2xl md:text-3xl font-bold uppercase tracking-wider">
                       {feedback === 'correct' ? <Check className="w-8 h-8 md:w-10 md:h-10" /> : <X className="w-8 h-8 md:w-10 md:h-10" />}
                       {feedback}
                    </div>
                    {feedback === 'incorrect' && (
                        <div className="text-right">
                           <div className="text-xs uppercase opacity-70 font-bold">Correct Answer</div>
                           <div className="text-xl md:text-2xl font-bold font-mono text-white">{currentQuestion.correctAnswer}</div>
                        </div>
                    )}
                 </div>

                 {/* Info Card */}
                 <div className="flex-1 border-2 border-current p-6 md:p-8 bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
                     <div className="flex flex-col md:flex-row gap-8">
                        <div className="text-center md:text-left shrink-0">
                            <div className="text-7xl md:text-8xl font-bold text-[var(--theme-color)] crt-text-glow leading-none mb-2">{currentQuestion.kanji.char}</div>
                            <div className="text-xl md:text-2xl font-bold opacity-80 uppercase tracking-widest">{currentQuestion.kanji.meaning}</div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 gap-6 content-center">
                            <div className="border-l-4 border-current/30 pl-4">
                                <span className="block text-xs uppercase opacity-60 font-bold tracking-widest mb-1">Onyomi (Chinese)</span>
                                <div className="text-2xl md:text-3xl font-mono font-bold">{currentQuestion.kanji.onyomi.join(', ') || '-'}</div>
                            </div>
                            <div className="border-l-4 border-current/30 pl-4">
                                <span className="block text-xs uppercase opacity-60 font-bold tracking-widest mb-1">Kunyomi (Japanese)</span>
                                <div className="text-2xl md:text-3xl font-mono font-bold">{currentQuestion.kanji.kunyomi.join(', ') || '-'}</div>
                            </div>
                        </div>
                     </div>

                     {/* Action Bar */}
                     <div className="mt-8 pt-6 border-t-2 border-current/30 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex gap-2 w-full md:w-auto">
                            <span className="text-xs uppercase opacity-50 font-bold self-center mr-2 hidden md:inline">Override Rating:</span>
                            <button onClick={() => saveResult(3)} className="flex-1 md:flex-none px-4 py-2 border border-current hover:bg-[var(--theme-color)] hover:text-black text-xs font-bold uppercase">Hard</button>
                            <button onClick={() => saveResult(4)} className="flex-1 md:flex-none px-4 py-2 border border-current hover:bg-[var(--theme-color)] hover:text-black text-xs font-bold uppercase">Good</button>
                            <button onClick={() => saveResult(5)} className="flex-1 md:flex-none px-4 py-2 border border-current hover:bg-[var(--theme-color)] hover:text-black text-xs font-bold uppercase">Easy</button>
                        </div>
                        
                        <button 
                            onClick={handleNext}
                            className="w-full md:w-auto px-8 py-3 bg-[var(--theme-color)] text-black font-bold text-lg uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_var(--theme-color)] flex items-center justify-center gap-2"
                        >
                            {isLast ? 'Finish Session' : 'Next Data Block'} <ArrowRight className="w-5 h-5" />
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