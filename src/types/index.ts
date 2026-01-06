// Re-export SRS types from separate module
export type { SRSQuality, ReviewRecord, SRSCardData } from "./srs";
import type { SRSCardData } from "./srs";

export type WordPair = {
  dutch: string;
  english: string;
  known?: boolean; // Legacy field, kept for backward compatibility
  srsData?: SRSCardData;
};

export type VerbPair = {
  english_infinitive: string;
  dutch_infinitive: string;
  imperfectum_single: string;
  imperfectum_plural: string;
  perfectum: string;
  srsData?: SRSCardData;
};

export type SentenceDifficulty = 1 | 2 | 3; // A1, A2, B1

export type SentencePair = {
  id: string; // Unique identifier for SRS tracking
  dutch: string; // Full Dutch sentence
  english: string; // English translation
  difficulty: SentenceDifficulty;
  srsData?: SRSCardData;
};

export type VerbForm =
  | "dutch_infinitive"
  | "imperfectum_single"
  | "imperfectum_plural"
  | "perfectum";

export type VerbMode = "random" | "infinitive" | "imperfectum" | "perfectum";

export type UserProgress = {
  correctAnswers: number;
  totalAnswers: number;
  currentStreak: number;
  bestStreak: number;
  wordsLearned: number;
  lastSessionDate: string;
  // Hint-related statistics
  totalHintsUsed: number;
  questionsWithHints: number;
  hintsPerSession: number[];
  // SRS-related statistics
  cardsReviewedToday: number;
  newCardsToday: number;
  matureCards: number; // Cards with interval > 21 days
  youngCards: number; // Cards with interval 1-21 days
  learningCards: number; // Cards in initial learning phase
  lastReviewDate: string; // Date when last review was done
};

export type SessionStats = {
  correct: number;
  total: number;
  accuracy: number;
  streak: number;
  // Hint-related statistics for current session
  hintsUsed: number;
  questionsWithHints: number;
  averageHintsPerQuestion: number;
};

export type LearningMode = "nl-en" | "en-nl";

export type ContentType = "words" | "verbs" | "sentences";

export type FeedbackType = "correct" | "incorrect" | null;

export type PracticeFormat = "input" | "multiple-choice";

export type GameState = {
  currentWord: WordPair | null;
  currentVerb: VerbPair | null;
  currentSentence: SentencePair | null;
  scrambledWords: string[]; // Scrambled words for sentence construction
  mode: LearningMode;
  contentType: ContentType;
  verbMode: VerbMode;
  currentVerbForm: VerbForm | null;
  feedback: FeedbackType;
  sessionStats: SessionStats;
  isLoading: boolean;
  error: string | null;
  practiceFormat: PracticeFormat;
  multipleChoiceOptions?: string[];
};

export type Theme = "default" | "duo";
