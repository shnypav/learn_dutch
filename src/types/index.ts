export interface WordPair {
  dutch: string;
  english: string;
  known?: boolean;
}

export interface VerbPair {
  english_infinitive: string;
  dutch_infinitive: string;
  imperfectum_single: string;
  imperfectum_plural: string;
  perfectum: string;
}

export type VerbForm = 'dutch_infinitive' | 'imperfectum_single' | 'imperfectum_plural' | 'perfectum';

export type VerbMode = 'random' | 'infinitive' | 'imperfectum' | 'perfectum';

export interface UserProgress {
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
}

export interface SessionStats {
  correct: number;
  total: number;
  accuracy: number;
  streak: number;
  // Hint-related statistics for current session
  hintsUsed: number;
  questionsWithHints: number;
  averageHintsPerQuestion: number;
}

export type LearningMode = 'nl-en' | 'en-nl';

export type ContentType = 'words' | 'verbs';

export type PracticeMode = 'type' | 'multiple-choice';

export type FeedbackType = 'correct' | 'incorrect' | null;

export interface GameState {
  currentWord: WordPair | null;
  currentVerb: VerbPair | null;
  mode: LearningMode;
  contentType: ContentType;
  verbMode: VerbMode;
  practiceMode: PracticeMode;
  currentVerbForm: VerbForm | null;
  feedback: FeedbackType;
  sessionStats: SessionStats;
  isLoading: boolean;
  error: string | null;
}

export type Theme = 'default' | 'duo';