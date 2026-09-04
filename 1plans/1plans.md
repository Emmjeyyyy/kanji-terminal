# Learn, Review & Simulation System — Implementation Plan

## Overview

Overhaul the session system with three distinct modes:
- **Learn** — Introduce new kanjis then immediately quiz them
- **Review** — Quiz already-learned kanjis, prioritizing difficult ones
- **Simulation** — Proficiency test against a full N5 or N4 kanji set (kept as-is, renamed from "Boss Mode")

The existing **Database** browser tab and **Settings** are unchanged.

---

## New User Flow

```
DASHBOARD
├── [ LEARN ]      ──► Introduce 4 new kanjis ──► Quiz those 4 kanjis ──► Results
├── [ REVIEW ]     ──► Select type (Random / Type-specific / Difficult) ──► Select quantity ──► Quiz ──► Results
└── [ SIMULATION ] ──► Select level (N5 / N4) ──► 20-question proficiency quiz ──► Results
```

---

## 1. Data Model Changes

### `types.ts` — Modify `UserProgress`

```ts
export interface UserProgress {
  kanjiId: string;
  nextReview: number;
  interval: number;
  repetition: number;
  ef: number;
  status: 'new' | 'learning' | 'review' | 'mastered';   // RENAME: 'graduated' → 'mastered'
  correctCount: number;
  missCount: number;
  lastReviewed: number;
  isLearned: boolean;        // NEW: true once introduced via Learn session
  isDifficult: boolean;      // NEW: true if user got it wrong during a Learn quiz
  difficultStreak: number;   // NEW: consecutive correct review sessions; needs 2 to clear isDifficult
  accCorrect?: number;
  accMiss?: number;
}
```

> **Rename:** `'graduated'` → `'mastered'` everywhere in code. Aligns with the existing "Mastery" progress bar in LearnMode and Dashboard.

---

## 2. App State Changes

### `App.tsx` — Update view states and session logic

#### Remove:
- `startDailySession()` — Daily Session (x/5) button + daily cap logic
- `startResolveSession()` — Resolve Weak Items flow
- `quiz_setup` and `boss_mode` view states (replaced by cleaner equivalents)

#### Keep & Rename:
- `startBossRun(level)` → `startSimulation(level)` — logic stays the same (20 random questions from chosen level), just rename

#### Add new view states:
```ts
type View =
  | 'dashboard'
  | 'learn_intro'     // NEW: kanji introduction cards
  | 'learn_quiz'      // NEW: quiz for the introduced batch
  | 'review_setup'    // NEW: choose review type & count
  | 'review_quiz'     // NEW: actual review quiz
  | 'sim_setup'       // RENAMED from 'quiz_setup'
  | 'sim_quiz'        // RENAMED from 'quiz_active' (simulation only)
  | 'learn'           // Database browser (unchanged)
  | 'settings';
```

#### Add new state variables:
```ts
const [learnBatch, setLearnBatch] = useState<KanjiData[]>([]);
const [learnIntroIndex, setLearnIntroIndex] = useState(0);
// Store selected quiz configuration for review
const [reviewConfig, setReviewConfig] = useState<{ type: string, count: number | 'all' } | null>(null);
```

#### Add new handler functions:
- `startLearnSession()` — picks next 4 unlearned kanjis, navigates to `learn_intro`
- `startReviewSession(type, count)` — builds question list based on selected type and count, navigates to `review_quiz`
- `onLearnComplete(results)` — marks kanjis `isLearned: true`, flags `isDifficult` on wrong answers
- `onReviewComplete(results)` — updates SRS, handles `difficultStreak` logic, clears `isDifficult` at streak ≥ 2

---

## 3. New Components

### `components/LearnIntro.tsx` — Kanji Introduction Cards

**Purpose:** Show each kanji in the current batch one at a time before the quiz.

**Props:**
```ts
interface LearnIntroProps {
  batch: KanjiData[];
  settings: AppSettings;
  onComplete: () => void;   // Navigates to learn_quiz
}
```

**UI per card:**
- Large kanji character (glowing, centered)
- Meaning (large text)
- Onyomi / Kunyomi in labeled boxes
- Example vocabulary (up to 2 entries)
- JLPT level badge
- Progress indicator: `CARD 1 / 4`
- `[ NEXT ]` button → `[ BEGIN QUIZ ]` on last card

**Behaviour:**
- No skipping — must view all cards in order
- Last card → `[ BEGIN QUIZ ]` calls `onComplete()`

---

### `components/ReviewSetup.tsx` — Review Configuration Picker

**Props:**
```ts
interface ReviewSetupProps {
  learnedCount: number;
  difficultCount: number;
  settings: AppSettings;
  onStart: (type: string, count: 10 | 15 | 20 | 'all') => void;
  onBack: () => void;
}
```

**UI:**
- Header: `REVIEW SESSION`
- Stats: `X learned kanji` / `Y difficult`
- **Quiz Type Options:**
  - `[ RANDOM MIX ]`
  - `[ KANJI → MEANING ]`
  - `[ MEANING → KANJI ]`
  - `[ KANJI → READING ]`
  - `[ READING → KANJI ]`
  - `[ DIFFICULT KANJI ]` *(Only visible/enabled if `difficultCount > 0`)*
- **Quantity Options:**
  - `[ 10 ]` `[ 15 ]` `[ 20 ]` `[ ALL ]`
- `[ BEGIN REVIEW ]` button & `[ BACK ]` button

---

## 4. Modified Components

### `components/QuizMode.tsx`

1. **Add `mode` prop:** `'learn' | 'review' | 'simulation'`
2. **Simplify grading UI:** Hide Hard/Good/Easy manual grading in `learn` and `review` modes (simulation keeps it)
3. **Update header label** per mode: `LEARN QUIZ` / `REVIEW SESSION` / `SIMULATION`
4. **Keep mastery loop** (requeue on wrong) for all modes

### `components/Dashboard.tsx`

**Remove:**
- Daily session counter / progress (x/5)
- Simulation entry button (moved to dedicated Dashboard section)

**Replace bottom action buttons with 3 buttons:**
```
[ LEARN ]       "X new kanji to introduce"
[ REVIEW ]      "X kanji ready for review"  
[ SIMULATION ]  "Test your proficiency"
```

**Update stat cards:**
- Replace or repurpose one stat card → **Difficult** (count of `isDifficult: true`)
- Rename any "Graduated" label → **Mastered**

---

## 5. Difficult Kanji Logic

### Marking as Difficult (in `onLearnComplete`)
```
For each kanji in results where missCount increased vs prior:
  progress[kanjiId].isDifficult = true
  progress[kanjiId].difficultStreak = 0
```

### Clearing the Difficult Flag (in `onReviewComplete`)
```
For each kanji answered CORRECTLY this session AND isDifficult === true:
  difficultStreak++
  if difficultStreak >= 2:
    isDifficult = false
    difficultStreak = 0

For each kanji answered WRONG this session AND isDifficult === true:
  difficultStreak = 0   // must restart the 2-session streak from zero
```

### Review Queue Priority (in `startReviewSession`)
```
1. Get pool based on selected type:
   - If 'Difficult Kanji' type: Pool = ONLY kanjis with `isDifficult === true`
   - Otherwise: Pool = `isLearned === true`
2. Sort: isDifficult === true FIRST, then by nextReview ascending (oldest due first)
3. Slice to requested count (10 / 15 / 20 / all)
4. Generate questions from this list, restricted to the selected Quiz Type (unless Random).
```

---

## 6. Simulation Mode (Kept)

No logic changes. Rename only:
- `startBossRun(level)` → `startSimulation(level)`
- View label: `SIMULATION` instead of `BOSS RUN`
- Entry point moves from a separate `quiz_setup` screen → a new `sim_setup` view (same UI, just renamed)

Simulation is a **proficiency test** — 20 random questions from the full N5 or N4 kanji dataset (regardless of learned status). Manual grading (Hard/Good/Easy) is kept here as it affects SRS for learned items.

---

## 7. Question Types

| Type | Prompt shown | Options shown |
|------|-------------|---------------|
| `kanji→meaning` | Kanji character | 4 English meaning choices |
| `meaning→kanji` | English meaning | 4 kanji character choices |
| `kanji→reading` | Kanji character | 4 reading (onyomi/kunyomi) choices |
| `reading→kanji` | Onyomi reading | 4 kanji character choices |

**Learn quiz:** 4 questions total — one per introduced kanji, random type each.  
**Review quiz:** N questions (user-chosen count). Type is constrained by user selection (or randomized if 'Random Mix' or 'Difficult Kanji' is chosen).  
**Simulation:** 20 questions, random type per question.

---

## 8. File Summary

| File | Action | Notes |
|------|--------|-------|
| `types.ts` | **MODIFY** | Add `isLearned`, `isDifficult`, `difficultStreak`; rename `'graduated'` → `'mastered'` |
| `App.tsx` | **MODIFY** | New views + handlers; rename sim functions; remove daily session logic |
| `components/LearnIntro.tsx` | **CREATE** | Kanji intro card slider |
| `components/ReviewSetup.tsx` | **CREATE** | Review session type & count picker |
| `components/QuizMode.tsx` | **MODIFY** | Add `mode` prop; simplify grading in learn/review |
| `components/Dashboard.tsx` | **MODIFY** | 3-button layout; difficult stat; rename "Graduated" → "Mastered" |
| `utils/srs.ts` | **MODIFY (minor)** | Rename `'graduated'` → `'mastered'` in status assignment |
| `data/kanji.ts` | **NO CHANGE** | Data is fine |

---

## 9. Open Questions (Resolved)

- **Learn batch < 4:** Use however many unlearned remain (e.g. 2 → 2-card intro + 2 questions). If 0 → Learn disabled.
- **Review "All":** No cap — truly all learned kanjis. User chose it.
- **DATABASE tab:** Stays as the reference browser, unchanged.
- **SRS in Review:** Pool = `isLearned === true` AND (`isDifficult === true` OR `nextReview <= now`). Difficult kanjis always included even if not SRS-due.
- **Simulation scope:** Uses the full kanji dataset for the chosen level, not just learned kanjis. It's a proficiency test, not a personal review.

---

## 10. Execution Order

1. `types.ts` — add fields, rename `graduated` → `mastered`
2. `utils/srs.ts` — rename `graduated` → `mastered`
3. `App.tsx` — update View type, state, handlers, rename simulation
4. `components/LearnIntro.tsx` — create
5. `components/ReviewSetup.tsx` — create
6. `components/QuizMode.tsx` — add `mode` prop, adjust grading UI
7. `components/Dashboard.tsx` — 3 buttons, stat updates
8. End-to-end test: Learn → Quiz → Review → Difficult clearing → Simulation

---

## TL;DR

| | Learn | Review | Simulation |
|---|---|---|---|
| **Entry** | Dashboard button | Dashboard button → setup picker | Dashboard button → level picker |
| **Content** | Next 4 unlearned kanjis | Learned kanjis (filtered by type/difficult) | 20 random from full N5 or N4 set |
| **Flow** | Intro cards → 4-question quiz | N questions of selected type | 20 questions (mixed types) |
| **On wrong answer** | Mark kanji as Difficult | Reset difficult streak | SRS downgrade only |
| **Clears Difficult?** | No (sets it) | Yes — 2 clean sessions needed | No effect on Difficult flag |
| **Manual grading?** | ❌ Hidden | ❌ Hidden | ✅ Shown (Hard/Good/Easy) |
| **Affects SRS?** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Purpose** | Introduce new kanjis | Reinforce specific skills / maintain memory | Test overall proficiency |
