export type JLPTLevel = 'N5' | 'N4';

export interface Example {
  word: string;
  reading: string;
  meaning: string;
}

export interface KanjiData {
  id: string;
  char: string;
  onyomi: string[];
  kunyomi: string[];
  meaning: string;
  level: JLPTLevel;
  examples: Example[];
}

export interface UserProgress {
  kanjiId: string;
  nextReview: number; // Timestamp
  interval: number; // Days
  repetition: number;
  ef: number; // Easiness Factor
  status: 'new' | 'learning' | 'review' | 'graduated';
  correctCount: number;
  missCount: number;
  lastReviewed: number;
  accCorrect?: number; // Tracks correct answers in Daily/Sim modes
  accMiss?: number;    // Tracks misses in Daily/Sim modes
}

export interface AppState {
  progress: Record<string, UserProgress>;
  settings: AppSettings;
  dailySessionTracker: {
    date: string; // "YYYY-MM-DD" or DateString
    count: number;
  };
  reviewHistory: Record<string, number>; // Tracks number of reviews per date key
}

export interface AppSettings {
  crtEnabled: boolean;
  scanlines: boolean;
  flicker: boolean;
  audio: boolean;
  theme: 'green' | 'amber';
}

export type QuizType = 'meaning' | 'reading' | 'reverse';

export interface QuizQuestion {
  kanji: KanjiData;
  type: QuizType;
  options: string[]; // Array of choices
  correctAnswer: string; // The correct string to match against
}