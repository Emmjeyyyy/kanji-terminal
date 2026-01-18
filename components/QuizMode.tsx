import React, { useState, useEffect, useRef } from 'react';
import { KanjiData, QuizQuestion, AppSettings, AppState, UserProgress } from '../types';
import { calculateReview } from '../utils/srs';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Timer, Keyboard } from 'lucide-react';

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
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [sessionResults, setSessionResults] = useState<Record<string, UserProgress>>({});
  const [timeLeft, setTimeLeft] = useState(isTimed ? 300 : 0);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (inputRef.current && !showAnswer) {
      // Small delay to ensure render on mobile
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentIndex, showAnswer]);

  const handleFinish = () => {
    onComplete(sessionResults);
  };

  const handleSubmit = (forcedQuality?: number) => {
    if (showAnswer) {
      if (isLast) {
        handleFinish();
      } else {
        setCurrentIndex(i => i + 1);
        setShowAnswer(false);
        setFeedback(null);
        setUserAnswer('');
      }
      return;
    }

    const q = currentQuestion;
    let isCorrect = false;
    
    if (q.type === 'meaning') {
      isCorrect = q.kanji.meaning.toLowerCase().includes(userAnswer.toLowerCase()) && userAnswer.length > 2;
    } else if (q.type === 'reading') {
      const allReadings = [...q.kanji.onyomi, ...q.kanji.kunyomi].map(r => r.replace('.', ''));
      isCorrect = allReadings.includes(userAnswer);
    } else if (q.type === 'reverse') {
        isCorrect = userAnswer === q.kanji.char;
    }

    if (forcedQuality !== undefined) {
      processResult(forcedQuality);
      return;
    }
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setShowAnswer(true);
    
    const quality = isCorrect ? 5 : 2; 
    processResult(quality);
  };

  const processResult = (quality: number) => {
     const kId = currentQuestion.kanji.id;
     const currentProg = appState.progress[kId] || sessionResults[kId];
     const newProg = calculateReview(kId, currentProg, quality);
     
     setSessionResults(prev => ({
       ...prev,
       [kId]: newProg
     }));

     if (feedback === null) {
        if (isLast) {
            handleFinish();
        } else {
            setCurrentIndex(i => i + 1);
            setShowAnswer(false);
            setFeedback(null);
            setUserAnswer('');
        }
     }
  };

  if (!currentQuestion) return <div>No questions loaded.</div>;

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full overflow-y-auto custom-scrollbar p-2">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-current pb-4 mb-4 md:mb-8 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={onExit} className="hover:bg-white/20 px-2 py-1 rounded transition-colors text-xs md:text-sm uppercase tracking-widest border border-current/50">[ ESC ] Abort</button>
          <span className="font-mono text-lg md:text-xl">Q: {currentIndex + 1}/{questions.length}</span>
        </div>
        {isTimed && (
          <div className="flex items-center gap-2 font-mono text-lg md:text-xl">
             <Timer className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
             {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <AnimatePresence mode='wait'>
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center w-full flex flex-col items-center"
          >
             <h2 className="text-sm md:text-lg uppercase tracking-[0.2em] mb-2 md:mb-4 opacity-70">
               {currentQuestion.type === 'reading' ? 'Identify Reading' : 
                currentQuestion.type === 'meaning' ? 'Identify Meaning' : 'Identify Kanji'}
             </h2>
             
             {/* Responsive Text Size for Character */}
             <div className="text-[6rem] md:text-[10rem] leading-none font-bold mb-4 md:mb-8 crt-text-glow">
               {currentQuestion.type === 'reverse' ? <span className="text-4xl md:text-6xl">{currentQuestion.kanji.meaning}</span> : currentQuestion.kanji.char}
             </div>
             
             {/* Interaction Area */}
             {!showAnswer ? (
                <div className="w-full max-w-md mx-auto space-y-4 md:space-y-6">
                   <div className="relative">
                     <input
                       ref={inputRef}
                       type="text"
                       value={userAnswer}
                       onChange={(e) => setUserAnswer(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                       placeholder="Type answer..."
                       className="w-full bg-transparent border-b-2 border-current p-2 text-xl md:text-2xl font-mono text-center focus:outline-none focus:border-[var(--theme-color)] focus:shadow-[0_4px_10px_-2px_var(--theme-color)] transition-all placeholder:opacity-30"
                       autoComplete="off"
                     />
                     <Keyboard className="absolute right-2 top-3 opacity-30 w-5 h-5 hidden md:block" />
                   </div>
                   
                   <div className="flex gap-2 md:gap-4 justify-center mt-6 md:mt-10 w-full">
                      <button 
                         onClick={() => { setShowAnswer(true); setFeedback('incorrect'); processResult(0); }}
                         className="flex-1 px-4 md:px-8 py-3 border border-current transition-all duration-200 uppercase text-xs md:text-sm tracking-[0.2em] font-bold hover:bg-[var(--theme-color)] hover:text-black hover:shadow-[0_0_15px_var(--theme-color)] hover:scale-105"
                      >
                        Don't Know
                      </button>
                      <button 
                         onClick={() => handleSubmit()}
                         className="flex-1 px-4 md:px-8 py-3 bg-[var(--theme-color)] text-black border border-current transition-all duration-200 font-bold uppercase text-xs md:text-sm tracking-[0.2em] shadow-[0_0_10px_var(--theme-color)] hover:bg-white hover:text-black hover:shadow-[0_0_25px_var(--theme-color)] hover:scale-105"
                      >
                        Submit
                      </button>
                   </div>
                </div>
             ) : (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="w-full max-w-xl mx-auto text-left border border-current p-4 md:p-6 bg-black/80 backdrop-blur-sm rounded shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-4"
               >
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-3xl md:text-4xl mb-2 crt-text-glow">{currentQuestion.kanji.char}</div>
                        <div className="text-lg md:text-xl font-bold">{currentQuestion.kanji.meaning}</div>
                    </div>
                    {feedback && (
                        <div className={`flex items-center gap-2 text-base md:text-lg font-bold uppercase ${feedback === 'correct' ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]' : 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]'}`}>
                           {feedback === 'correct' ? <Check size={20} /> : <X size={20} />} {feedback}
                        </div>
                    )}
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                        <span className="opacity-50 block mb-1">Onyomi</span>
                        <div className="font-mono text-base md:text-lg">{currentQuestion.kanji.onyomi.join(', ')}</div>
                    </div>
                    <div>
                        <span className="opacity-50 block mb-1">Kunyomi</span>
                        <div className="font-mono text-base md:text-lg">{currentQuestion.kanji.kunyomi.join(', ')}</div>
                    </div>
                 </div>
                 
                 <div className="border-t border-current/30 pt-4">
                    <span className="opacity-50 block mb-2 text-xs uppercase">Self-Rating</span>
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => handleSubmit(0)} className="p-2 border border-red-900/50 text-red-400 hover:bg-red-500 hover:text-black transition-all text-[10px] md:text-xs font-bold uppercase">Blackout</button>
                        <button onClick={() => handleSubmit(3)} className="p-2 border border-current hover:bg-[var(--theme-color)] hover:text-black transition-all text-[10px] md:text-xs font-bold uppercase">Hard</button>
                        <button onClick={() => handleSubmit(4)} className="p-2 border border-current hover:bg-[var(--theme-color)] hover:text-black transition-all text-[10px] md:text-xs font-bold uppercase">Good</button>
                        <button onClick={() => handleSubmit(5)} className="p-2 border border-green-900/50 text-green-400 hover:bg-green-500 hover:text-black transition-all text-[10px] md:text-xs font-bold uppercase">Easy</button>
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