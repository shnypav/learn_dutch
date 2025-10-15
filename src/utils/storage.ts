import type { UserProgress, WordPair, VerbPair } from "../types";
import type { SRSCardData } from "../types/srs";

const STORAGE_KEY = "dutch-learning-progress";
const KNOWN_WORDS_KEY = "dutch-learning-known-words";
const SRS_WORDS_KEY = "dutch-learning-srs-words";
const SRS_VERBS_KEY = "dutch-learning-srs-verbs";
const SRS_CONFIG_KEY = "dutch-learning-srs-config";

const defaultProgress: UserProgress = {
  correctAnswers: 0,
  totalAnswers: 0,
  currentStreak: 0,
  bestStreak: 0,
  wordsLearned: 0,
  lastSessionDate: new Date().toISOString(),
  // Hint-related statistics
  totalHintsUsed: 0,
  questionsWithHints: 0,
  hintsPerSession: [],
  // SRS-related statistics
  cardsReviewedToday: 0,
  newCardsToday: 0,
  matureCards: 0,
  youngCards: 0,
  learningCards: 0,
  lastReviewDate: new Date().toISOString(),
};

export const loadProgress = (): UserProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultProgress, ...parsed };
    }
  } catch (error) {
    console.error("Error loading progress:", error);
  }
  return defaultProgress;
};

export const saveProgress = (progress: UserProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Error saving progress:", error);
  }
};

export const updateProgress = (
  currentProgress: UserProgress,
  isCorrect: boolean,
  currentStreak: number,
  hintsUsedForQuestion: number = 0,
): UserProgress => {
  const newProgress: UserProgress = {
    ...currentProgress,
    correctAnswers: currentProgress.correctAnswers + (isCorrect ? 1 : 0),
    totalAnswers: currentProgress.totalAnswers + 1,
    currentStreak: isCorrect ? currentStreak : 0,
    bestStreak: Math.max(
      currentProgress.bestStreak,
      isCorrect ? currentStreak : 0,
    ),
    wordsLearned: currentProgress.wordsLearned + (isCorrect ? 1 : 0),
    lastSessionDate: new Date().toISOString(),
    // Update hint statistics
    totalHintsUsed: currentProgress.totalHintsUsed + hintsUsedForQuestion,
    questionsWithHints:
      currentProgress.questionsWithHints + (hintsUsedForQuestion > 0 ? 1 : 0),
    hintsPerSession: [
      ...currentProgress.hintsPerSession.slice(-9),
      hintsUsedForQuestion,
    ], // Keep last 10 sessions
  };

  saveProgress(newProgress);
  return newProgress;
};

export const resetProgress = (): UserProgress => {
  const resetProgress = { ...defaultProgress };
  saveProgress(resetProgress);
  return resetProgress;
};

export const getAccuracy = (progress: UserProgress): number => {
  if (progress.totalAnswers === 0) return 0;
  return Math.round((progress.correctAnswers / progress.totalAnswers) * 100);
};

export const getHintStats = (
  progress: UserProgress,
): {
  averageHintsPerQuestion: number;
  hintUsagePercentage: number;
  recentHintTrend: number;
} => {
  try {
    // Validate input
    if (!progress || typeof progress !== "object") {
      console.warn("Storage: Invalid progress data provided for hint stats");
      return {
        averageHintsPerQuestion: 0,
        hintUsagePercentage: 0,
        recentHintTrend: 0,
      };
    }

    const totalAnswers = progress.totalAnswers || 0;
    const totalHintsUsed = progress.totalHintsUsed || 0;
    const questionsWithHints = progress.questionsWithHints || 0;
    const hintsPerSession = progress.hintsPerSession || [];

    const averageHintsPerQuestion =
      totalAnswers > 0 ? totalHintsUsed / totalAnswers : 0;

    const hintUsagePercentage =
      totalAnswers > 0 ? (questionsWithHints / totalAnswers) * 100 : 0;

    // Calculate recent hint trend (last 5 sessions vs previous 5)
    const recentSessions = hintsPerSession.slice(-5);
    const previousSessions = hintsPerSession.slice(-10, -5);

    const recentAverage =
      recentSessions.length > 0
        ? recentSessions.reduce((sum, hints) => sum + (hints || 0), 0) /
          recentSessions.length
        : 0;

    const previousAverage =
      previousSessions.length > 0
        ? previousSessions.reduce((sum, hints) => sum + (hints || 0), 0) /
          previousSessions.length
        : 0;

    const recentHintTrend =
      previousAverage > 0
        ? ((recentAverage - previousAverage) / previousAverage) * 100
        : 0;

    return {
      averageHintsPerQuestion: Math.round(averageHintsPerQuestion * 100) / 100,
      hintUsagePercentage: Math.round(hintUsagePercentage),
      recentHintTrend: Math.round(recentHintTrend),
    };
  } catch (error) {
    console.error("Storage: Error calculating hint stats:", error);
    return {
      averageHintsPerQuestion: 0,
      hintUsagePercentage: 0,
      recentHintTrend: 0,
    };
  }
};

// Functions for managing known words
export const loadKnownWords = (): Set<string> => {
  try {
    const saved = localStorage.getItem(KNOWN_WORDS_KEY);
    if (saved) {
      const knownWords = JSON.parse(saved);
      return new Set(knownWords);
    }
  } catch (error) {
    console.error("Error loading known words:", error);
  }
  return new Set();
};

export const saveKnownWords = (knownWords: Set<string>): void => {
  try {
    const wordsArray = Array.from(knownWords);
    localStorage.setItem(KNOWN_WORDS_KEY, JSON.stringify(wordsArray));
  } catch (error) {
    console.error("Error saving known words:", error);
  }
};

export const markWordAsKnown = (word: WordPair): void => {
  const knownWords = loadKnownWords();
  const wordKey = `${word.dutch}:${word.english}`;
  knownWords.add(wordKey);
  saveKnownWords(knownWords);
};

export const isWordKnown = (word: WordPair): boolean => {
  const knownWords = loadKnownWords();
  const wordKey = `${word.dutch}:${word.english}`;
  return knownWords.has(wordKey);
};

export const applyKnownStatusToWords = (words: WordPair[]): WordPair[] => {
  return words.map((word) => ({
    ...word,
    // Keep CSV "true" values, or check localStorage for additional known words
    known: word.known || isWordKnown(word),
  }));
};

export const getKnownWordsFromStorage = (): WordPair[] => {
  const knownWordsSet = loadKnownWords();
  return Array.from(knownWordsSet)
    .map((wordKey) => {
      const [dutch, english] = wordKey.split(":");
      return {
        dutch: dutch || "",
        english: english || "",
        known: true,
      };
    })
    .filter((word) => word.dutch && word.english);
};

export const unmarkWordAsKnown = (word: WordPair): void => {
  const knownWords = loadKnownWords();
  const wordKey = `${word.dutch}:${word.english}`;
  knownWords.delete(wordKey);
  saveKnownWords(knownWords);
};

// ============================================================================
// SRS Data Storage Functions
// ============================================================================

/**
 * Create a unique key for a word card
 */
const getWordKey = (word: WordPair): string => {
  return `${word.dutch}:${word.english}`;
};

/**
 * Create a unique key for a verb card
 */
const getVerbKey = (verb: VerbPair): string => {
  return `${verb.dutch_infinitive}:${verb.english_infinitive}`;
};

/**
 * Load SRS data for words from localStorage
 */
export const loadWordSRSData = (): Map<string, SRSCardData> => {
  try {
    const saved = localStorage.getItem(SRS_WORDS_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error("Error loading word SRS data:", error);
  }
  return new Map();
};

/**
 * Save SRS data for words to localStorage
 */
export const saveWordSRSData = (srsData: Map<string, SRSCardData>): void => {
  try {
    const dataObject = Object.fromEntries(srsData);
    localStorage.setItem(SRS_WORDS_KEY, JSON.stringify(dataObject));
  } catch (error) {
    console.error("Error saving word SRS data:", error);
  }
};

/**
 * Load SRS data for verbs from localStorage
 */
export const loadVerbSRSData = (): Map<string, SRSCardData> => {
  try {
    const saved = localStorage.getItem(SRS_VERBS_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error("Error loading verb SRS data:", error);
  }
  return new Map();
};

/**
 * Save SRS data for verbs to localStorage
 */
export const saveVerbSRSData = (srsData: Map<string, SRSCardData>): void => {
  try {
    const dataObject = Object.fromEntries(srsData);
    localStorage.setItem(SRS_VERBS_KEY, JSON.stringify(dataObject));
  } catch (error) {
    console.error("Error saving verb SRS data:", error);
  }
};

/**
 * Update SRS data for a specific word
 */
export const updateWordSRS = (word: WordPair, srsData: SRSCardData): void => {
  const allData = loadWordSRSData();
  const key = getWordKey(word);
  allData.set(key, srsData);
  saveWordSRSData(allData);
};

/**
 * Update SRS data for a specific verb
 */
export const updateVerbSRS = (verb: VerbPair, srsData: SRSCardData): void => {
  const allData = loadVerbSRSData();
  const key = getVerbKey(verb);
  allData.set(key, srsData);
  saveVerbSRSData(allData);
};

/**
 * Apply SRS data from storage to words
 */
export const applyWordSRSData = (words: WordPair[]): WordPair[] => {
  const srsData = loadWordSRSData();
  return words.map((word) => {
    const key = getWordKey(word);
    const data = srsData.get(key);
    if (data) {
      return { ...word, srsData: data };
    }
    return word;
  });
};

/**
 * Apply SRS data from storage to verbs
 */
export const applyVerbSRSData = (verbs: VerbPair[]): VerbPair[] => {
  const srsData = loadVerbSRSData();
  return verbs.map((verb) => {
    const key = getVerbKey(verb);
    const data = srsData.get(key);
    if (data) {
      return { ...verb, srsData: data };
    }
    return verb;
  });
};

/**
 * Load SRS configuration from localStorage
 */
export const loadSRSConfig = (): { dailyNewCardLimit: number } => {
  try {
    const saved = localStorage.getItem(SRS_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading SRS config:", error);
  }
  return { dailyNewCardLimit: 20 };
};

/**
 * Save SRS configuration to localStorage
 */
export const saveSRSConfig = (config: { dailyNewCardLimit: number }): void => {
  try {
    localStorage.setItem(SRS_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Error saving SRS config:", error);
  }
};

/**
 * Reset daily SRS statistics (should be called once per day)
 */
export const resetDailySRSStats = (progress: UserProgress): UserProgress => {
  const today = new Date().toISOString().split("T")[0];
  const lastReviewDay = progress.lastReviewDate.split("T")[0];

  // Only reset if it's a new day
  if (today !== lastReviewDay) {
    const newProgress: UserProgress = {
      ...progress,
      cardsReviewedToday: 0,
      newCardsToday: 0,
      lastReviewDate: new Date().toISOString(),
    };
    saveProgress(newProgress);
    return newProgress;
  }

  return progress;
};
