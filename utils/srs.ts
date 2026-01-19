import { UserProgress } from '../types';

/**
 * Calculates new progress based on SM-2 algorithm
 * @param progress Current progress object (or null if new)
 * @param quality Response quality (0-5). 
 * 5: Perfect response
 * 4: Correct response after a hesitation
 * 3: Correct response recalled with serious difficulty
 * 2: Incorrect response; where the correct one seemed easy to recall
 * 1: Incorrect response; the correct one remembered
 * 0: Complete blackout
 */
export const calculateReview = (
  kanjiId: string,
  progress: UserProgress | undefined,
  quality: number
): UserProgress => {
  const now = Date.now();
  const dayInMillis = 24 * 60 * 60 * 1000;

  let currentInterval = progress?.interval ?? 0;
  let currentRepetition = progress?.repetition ?? 0;
  let currentEf = progress?.ef ?? 2.5;
  let correctCount = progress?.correctCount ?? 0;
  let missCount = progress?.missCount ?? 0;
  const accCorrect = progress?.accCorrect ?? 0;
  const accMiss = progress?.accMiss ?? 0;

  // Update history stats
  if (quality >= 3) {
    correctCount++;
  } else {
    missCount++;
  }

  // SM-2 Algorithm
  let nextInterval: number;
  let nextRepetition: number;
  let nextEf: number;

  if (quality >= 3) {
    if (currentRepetition === 0) {
      nextInterval = 1;
    } else if (currentRepetition === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(currentInterval * currentEf);
    }
    nextRepetition = currentRepetition + 1;
  } else {
    nextInterval = 1;
    nextRepetition = 0;
  }

  // Update EF
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  nextEf = currentEf + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (nextEf < 1.3) nextEf = 1.3;

  const nextReviewDate = now + nextInterval * dayInMillis;

  return {
    kanjiId,
    nextReview: nextReviewDate,
    interval: nextInterval,
    repetition: nextRepetition,
    ef: nextEf,
    status: quality >= 4 ? 'graduated' : (quality >= 3 ? 'review' : 'learning'),
    correctCount,
    missCount,
    lastReviewed: now,
    accCorrect,
    accMiss
  };
};

export const getDueItems = (progress: Record<string, UserProgress>) => {
  const now = Date.now();
  return Object.values(progress).filter(p => p.nextReview <= now);
};