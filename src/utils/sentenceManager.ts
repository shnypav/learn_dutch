import type { SentencePair, SentenceDifficulty } from "../types";
import { shuffleArray } from "./csvParser";
import {
  getInitialHintLevel,
  isValidHintLevel,
  type HintLevel,
} from "./hintGenerator";
import { updateSentenceSRS } from "./storage";
import {
  getCardsByPriority,
  DEFAULT_SRS_CONFIG,
  type SRSConfig,
} from "./srsScheduler";
import { updateSRSCard } from "./srsAlgorithm";
import { fuzzyMatch, getSimilarityScore } from "./fuzzyMatch";

/**
 * Generates a hint for sentence construction at the specified level
 * @param sentence - The sentence pair to generate hints for
 * @param level - The hint level (1-4)
 * @returns The hint string for the specified level
 */
export function generateSentenceHint(
  sentence: SentencePair,
  level: HintLevel
): string {
  const words = sentence.dutch.split(/\s+/);
  const wordCount = words.length;

  switch (level) {
    case 1:
      // Show first word + count
      return `Starts with "${words[0]}" (${wordCount} words total)`;

    case 2:
      // Show first 2-3 words
      const showCount = Math.min(Math.ceil(wordCount / 2), 3);
      return words.slice(0, showCount).join(" ") + " ...";

    case 3:
      // Show structure with blanks (first and last words visible, middle blanked)
      if (wordCount <= 2) {
        return sentence.dutch;
      }
      const structure = words.map((word, index) => {
        if (index === 0 || index === wordCount - 1) {
          return word;
        }
        return "___";
      });
      return structure.join(" ");

    case 4:
      // Show complete sentence
      return sentence.dutch;

    default:
      return `Starts with "${words[0]}"`;
  }
}

/**
 * Scrambles words in a sentence for construction practice
 * Uses Fisher-Yates shuffle with constraint to avoid trivial cases
 * @param sentence - The sentence to scramble
 * @param distractorWords - Optional array of distractor words to add (e.g., from vocabulary)
 * @param distractorCount - Number of distractors to add (default: 3)
 * @returns Array of scrambled words including distractors
 */
export function scrambleSentenceWords(
  sentence: SentencePair,
  distractorWords: string[] = [],
  distractorCount: number = 3
): string[] {
  const words = sentence.dutch.split(/\s+/);

  // Handle edge cases
  if (words.length <= 1 && distractorWords.length === 0) {
    return words;
  }

  // Select random distractors that are not already in the sentence
  const sentenceWordsLower = new Set(words.map((w) => w.toLowerCase()));
  const availableDistractors = distractorWords.filter(
    (w) => !sentenceWordsLower.has(w.toLowerCase())
  );

  // Shuffle available distractors and pick the required count
  const shuffledDistractors = shuffleArray([...availableDistractors]);
  const selectedDistractors = shuffledDistractors.slice(
    0,
    Math.min(distractorCount, shuffledDistractors.length)
  );

  // Combine sentence words with distractors
  const allWords = [...words, ...selectedDistractors];

  // Fisher-Yates shuffle
  const shuffled = shuffleArray(allWords);

  // If the first word stayed first (and it's the original first word), swap it
  // This prevents trivial cases where the sentence starts correctly
  if (shuffled[0] === words[0] && shuffled.length > 1) {
    const swapIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
  }

  return shuffled;
}

/**
 * Validates if the constructed sentence matches the original
 * @param constructedWords - Array of words in user's construction order
 * @param sentence - The original sentence pair
 * @returns True if the construction is correct
 */
export function validateConstruction(
  constructedWords: string[],
  sentence: SentencePair
): boolean {
  return evaluateSentenceAnswer(constructedWords, sentence).isCorrect;
}

export type SentenceTypoDetail = {
  index: number;
  expected: string;
  received: string;
};

export type SentenceEvaluationResult = {
  isCorrect: boolean;
  matchedViaFuzzy: boolean;
  typoDetails: SentenceTypoDetail[];
};

const normalizePronounVariant = (word: string): string => {
  const normalized = word.toLowerCase().trim();
  if (normalized === "we" || normalized === "wij") return "wij";
  if (normalized === "ze" || normalized === "zij") return "zij";
  return normalized;
};

const isSingleTransposition = (a: string, b: string): boolean => {
  const aTrim = a.trim().toLowerCase();
  const bTrim = b.trim().toLowerCase();
  if (aTrim.length !== bTrim.length) return false;

  const diffIndices: number[] = [];
  for (let i = 0; i < aTrim.length; i++) {
    if (aTrim[i] !== bTrim[i]) {
      diffIndices.push(i);
      if (diffIndices.length > 2) return false;
    }
  }

  if (diffIndices.length !== 2) return false;
  const [i, j] = diffIndices;
  return aTrim[i] === bTrim[j] && aTrim[j] === bTrim[i];
};

export function evaluateSentenceAnswer(
  constructedWords: string[],
  sentence: SentencePair
): SentenceEvaluationResult {
  const originalWords = sentence.dutch.split(/\s+/);
  const typoDetails: SentenceTypoDetail[] = [];

  if (constructedWords.length !== originalWords.length) {
    return {
      isCorrect: false,
      matchedViaFuzzy: false,
      typoDetails,
    };
  }

  let matchedViaFuzzy = false;

  for (let i = 0; i < originalWords.length; i++) {
    const userWord = constructedWords[i];
    const correctWord = originalWords[i];

    const normalizedUser = normalizePronounVariant(userWord);
    const normalizedCorrect = normalizePronounVariant(correctWord);

    if (normalizedUser === normalizedCorrect) {
      continue;
    }

    let isFuzzyMatch = fuzzyMatch(userWord, correctWord);

    if (!isFuzzyMatch) {
      // Allow a single adjacent transposition (common typo like "speetl" for "speelt")
      if (isSingleTransposition(userWord, correctWord)) {
        isFuzzyMatch = true;
      }
    }

    if (!isFuzzyMatch) {
      // Allow a single-character slip on very short words
      const maxLength = Math.max(
        userWord.trim().length,
        correctWord.trim().length
      );
      const similarity = getSimilarityScore(userWord, correctWord);

      const shortWordThreshold =
        maxLength <= 3 ? 0.6 : maxLength <= 4 ? 0.67 : 1.1; // 1.1 effectively disables this branch for longer words

      if (maxLength <= 4 && similarity >= shortWordThreshold) {
        isFuzzyMatch = true;
      } else {
        return {
          isCorrect: false,
          matchedViaFuzzy: false,
          typoDetails: [],
        };
      }
    }

    matchedViaFuzzy = true;
    typoDetails.push({
      index: i,
      expected: correctWord,
      received: userWord,
    });
  }

  return {
    isCorrect: true,
    matchedViaFuzzy,
    typoDetails,
  };
}

export class SentenceManager {
  private sentences: SentencePair[] = [];
  private currentIndex = 0;
  private shuffledSentences: SentencePair[] = [];
  private recentSentences: SentencePair[] = [];
  private readonly maxRecentSentences = 5; // Prevent immediate repetition

  // Difficulty filtering
  private difficultyFilter: SentenceDifficulty[] = [1, 2, 3]; // All levels by default

  // Hint-related state
  private currentHintLevel: HintLevel = getInitialHintLevel();
  private hintsUsedForCurrentSentence: HintLevel[] = [];
  private totalHintsUsed = 0;
  private questionsWithHints = 0;

  // SRS-related state
  private srsEnabled = true;
  private srsConfig: SRSConfig = DEFAULT_SRS_CONFIG;
  private newCardsSeenToday = 0;

  // Distractor words from vocabulary
  private distractorWords: string[] = [];

  constructor(sentences: SentencePair[]) {
    this.sentences = sentences;
    console.log("SentenceManager: Total sentences loaded:", sentences.length);
    console.log(
      "SentenceManager: Difficulty distribution:",
      this.getDifficultyDistribution()
    );
    this.shuffleSentences();
  }

  /**
   * Set distractor words from vocabulary for more challenging practice
   */
  setDistractorWords(words: string[]): void {
    this.distractorWords = words;
  }

  private getDifficultyDistribution(): Record<number, number> {
    return this.sentences.reduce(
      (acc, s) => {
        acc[s.difficulty] = (acc[s.difficulty] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );
  }

  private getFilteredSentences(): SentencePair[] {
    return this.sentences.filter((s) =>
      this.difficultyFilter.includes(s.difficulty)
    );
  }

  private shuffleSentences(): void {
    const filteredSentences = this.getFilteredSentences();

    if (this.srsEnabled) {
      // Use SRS scheduler to prioritize cards
      const prioritizedSentences = getCardsByPriority(
        filteredSentences,
        this.srsConfig,
        this.newCardsSeenToday
      );
      this.shuffledSentences = prioritizedSentences;
    } else {
      // Legacy mode: shuffle all filtered sentences
      this.shuffledSentences = shuffleArray(filteredSentences);
    }
    this.currentIndex = 0;
  }

  // Difficulty filtering methods
  setDifficultyFilter(levels: SentenceDifficulty[]): void {
    this.difficultyFilter = levels.length > 0 ? levels : [1, 2, 3];
    this.shuffleSentences();
  }

  getDifficultyFilter(): SentenceDifficulty[] {
    return [...this.difficultyFilter];
  }

  // SRS configuration methods
  setSRSEnabled(enabled: boolean): void {
    this.srsEnabled = enabled;
    this.shuffleSentences();
  }

  setSRSConfig(config: SRSConfig): void {
    this.srsConfig = config;
    if (this.srsEnabled) {
      this.shuffleSentences();
    }
  }

  setNewCardsSeenToday(count: number): void {
    this.newCardsSeenToday = count;
    if (this.srsEnabled) {
      this.shuffleSentences();
    }
  }

  getCurrentSentence(): SentencePair | null {
    if (this.shuffledSentences.length === 0) return null;
    return this.shuffledSentences[this.currentIndex];
  }

  getNextSentence(): SentencePair | null {
    if (this.shuffledSentences.length === 0) return null;

    // Add current sentence to recent sentences
    const currentSentence = this.shuffledSentences[this.currentIndex];
    this.recentSentences.push(currentSentence);

    // Keep only the last few sentences to prevent immediate repetition
    if (this.recentSentences.length > this.maxRecentSentences) {
      this.recentSentences.shift();
    }

    // Move to next sentence
    this.currentIndex++;

    // If we've gone through all sentences, reshuffle
    if (this.currentIndex >= this.shuffledSentences.length) {
      this.shuffleSentences();
    }

    // Try to avoid recent sentences if possible
    let attempts = 0;
    const maxAttempts = Math.min(10, this.shuffledSentences.length);

    while (attempts < maxAttempts) {
      const nextSentence = this.shuffledSentences[this.currentIndex];
      const isRecent = this.recentSentences.some(
        (recent) => recent.id === nextSentence.id
      );

      if (!isRecent || this.shuffledSentences.length <= this.maxRecentSentences) {
        return nextSentence;
      }

      // Try next sentence
      this.currentIndex = (this.currentIndex + 1) % this.shuffledSentences.length;
      attempts++;
    }

    // If we couldn't find a non-recent sentence, just return the current one
    return this.shuffledSentences[this.currentIndex];
  }

  /**
   * Get scrambled words for the current sentence (with distractors if available)
   */
  getScrambledWords(sentence: SentencePair): string[] {
    return scrambleSentenceWords(sentence, this.distractorWords, 3);
  }

  /**
   * Get the correct answer (the Dutch sentence)
   */
  getCorrectAnswer(sentence: SentencePair): string {
    return sentence.dutch;
  }

  /**
   * Validate user's constructed sentence
   */
  validateUserConstruction(
    constructedWords: string[],
    sentence: SentencePair
  ): boolean {
    return validateConstruction(constructedWords, sentence);
  }

  getTotalSentencesCount(): number {
    return this.sentences.length;
  }

  getFilteredSentencesCount(): number {
    return this.getFilteredSentences().length;
  }

  /**
   * Record answer and update SRS data
   * @param sentence - The sentence that was answered
   * @param isCorrect - Whether the answer was correct
   * @param hintsUsed - Number of hints used (optional, defaults to current sentence's hint count)
   */
  recordAnswer(
    sentence: SentencePair,
    isCorrect: boolean,
    hintsUsed?: number
  ): void {
    if (!this.srsEnabled) return;

    const hintsCount =
      hintsUsed !== undefined
        ? hintsUsed
        : this.hintsUsedForCurrentSentence.length;

    // Update SRS data
    const newSRSData = updateSRSCard(sentence.srsData, isCorrect, hintsCount);

    // Update sentence in array
    const sentenceIndex = this.sentences.findIndex(
      (s) => s.id === sentence.id
    );

    if (sentenceIndex !== -1) {
      this.sentences[sentenceIndex] = {
        ...this.sentences[sentenceIndex],
        srsData: newSRSData,
      };

      // Persist to localStorage
      updateSentenceSRS(this.sentences[sentenceIndex], newSRSData);

      // Track if this was a new card
      if (sentence.srsData?.isNew) {
        this.newCardsSeenToday++;
      }
    }
  }

  reset(): void {
    this.shuffleSentences();
    this.recentSentences = [];
    this.resetHintState();
  }

  // Hint-related methods
  getHintForCurrentLevel(sentence: SentencePair, level: HintLevel): string {
    try {
      if (!sentence || typeof sentence !== "object") {
        console.warn(
          "SentenceManager: Invalid sentence provided for hint generation"
        );
        return "";
      }

      if (!isValidHintLevel(level)) {
        console.warn("SentenceManager: Invalid hint level provided:", level);
        return "";
      }

      return generateSentenceHint(sentence, level);
    } catch (error) {
      console.error(
        "SentenceManager: Error generating hint for current level:",
        error
      );
      return "";
    }
  }

  getCurrentHintLevel(): HintLevel {
    try {
      return this.currentHintLevel;
    } catch (error) {
      console.error("SentenceManager: Error getting current hint level:", error);
      return getInitialHintLevel();
    }
  }

  recordHintUsage(level: HintLevel): void {
    try {
      if (!isValidHintLevel(level)) {
        console.warn(
          "SentenceManager: Invalid hint level provided for recording:",
          level
        );
        return;
      }

      // Track if this is the first hint used for this sentence
      if (this.hintsUsedForCurrentSentence.length === 0) {
        this.questionsWithHints++;
      }

      // Add the hint level to the current sentence's hint usage
      this.hintsUsedForCurrentSentence.push(level);
      this.totalHintsUsed++;
    } catch (error) {
      console.error("SentenceManager: Error recording hint usage:", error);
    }
  }

  resetHintState(): void {
    this.currentHintLevel = getInitialHintLevel();
    this.hintsUsedForCurrentSentence = [];
  }

  // Move to next sentence and reset hint state
  getNextSentenceWithHintReset(): SentencePair | null {
    const nextSentence = this.getNextSentence();
    this.resetHintState();
    return nextSentence;
  }

  // Statistics methods
  getHintUsageStats(): {
    totalHintsUsed: number;
    questionsWithHints: number;
    averageHintsPerQuestion: number;
    hintsUsedForCurrentSentence: HintLevel[];
  } {
    try {
      return {
        totalHintsUsed: this.totalHintsUsed || 0,
        questionsWithHints: this.questionsWithHints || 0,
        averageHintsPerQuestion:
          this.questionsWithHints > 0
            ? this.totalHintsUsed / this.questionsWithHints
            : 0,
        hintsUsedForCurrentSentence: [...(this.hintsUsedForCurrentSentence || [])],
      };
    } catch (error) {
      console.error("SentenceManager: Error getting hint usage stats:", error);
      return {
        totalHintsUsed: 0,
        questionsWithHints: 0,
        averageHintsPerQuestion: 0,
        hintsUsedForCurrentSentence: [],
      };
    }
  }

  // Get all sentences (for potential future features)
  getAllSentences(): SentencePair[] {
    return this.sentences;
  }
}
