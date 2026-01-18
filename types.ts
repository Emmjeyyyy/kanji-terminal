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
}

export interface AppState {
  progress: Record<string, UserProgress>;
  settings: AppSettings;
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