import type { VerbPair, VerbForm, VerbMode } from "../types";
import { shuffleArray } from "./csvParser";
import {
  generateHint,
  getInitialHintLevel,
  isValidHintLevel,
  type HintLevel,
} from "./hintGenerator";
import { updateVerbSRS } from "./storage";
import {
  getCardsByPriority,
  DEFAULT_SRS_CONFIG,
  type SRSConfig,
} from "./srsScheduler";
import { updateSRSCard } from "./srsAlgorithm";

export class VerbManager {
  private verbs: VerbPair[] = [];
  private currentIndex = 0;
  private shuffledVerbs: VerbPair[] = [];
  private recentVerbs: VerbPair[] = [];
  private readonly maxRecentVerbs = 5;

  // Hint-related state
  private currentHintLevel: HintLevel = getInitialHintLevel();
  private hintsUsedForCurrentVerb: HintLevel[] = [];
  private totalHintsUsed = 0;
  private questionsWithHints = 0;

  // SRS-related state
  private srsEnabled = true;
  private srsConfig: SRSConfig = DEFAULT_SRS_CONFIG;
  private newCardsSeenToday = 0;

  constructor(verbs: VerbPair[]) {
    this.verbs = verbs;
    this.shuffleVerbs();
  }

  private shuffleVerbs(): void {
    if (this.srsEnabled) {
      // Use SRS scheduler to prioritize cards
      const prioritizedVerbs = getCardsByPriority(
        this.verbs,
        this.srsConfig,
        this.newCardsSeenToday,
      );
      this.shuffledVerbs = prioritizedVerbs;
    } else {
      // Legacy mode: shuffle all verbs
      this.shuffledVerbs = shuffleArray(this.verbs);
    }
    this.currentIndex = 0;
  }

  // SRS configuration methods
  setSRSEnabled(enabled: boolean): void {
    this.srsEnabled = enabled;
    this.shuffleVerbs();
  }

  setSRSConfig(config: SRSConfig): void {
    this.srsConfig = config;
    if (this.srsEnabled) {
      this.shuffleVerbs();
    }
  }

  setNewCardsSeenToday(count: number): void {
    this.newCardsSeenToday = count;
    if (this.srsEnabled) {
      this.shuffleVerbs();
    }
  }

  /**
   * Record answer and update SRS data
   */
  recordAnswer(verb: VerbPair, isCorrect: boolean, hintsUsed?: number): void {
    if (!this.srsEnabled) return;

    const hintsCount =
      hintsUsed !== undefined ? hintsUsed : this.hintsUsedForCurrentVerb.length;

    // Update SRS data
    const newSRSData = updateSRSCard(verb.srsData, isCorrect, hintsCount);

    // Update verb in array
    const verbIndex = this.verbs.findIndex(
      (v) =>
        v.dutch_infinitive === verb.dutch_infinitive &&
        v.english_infinitive === verb.english_infinitive,
    );

    if (verbIndex !== -1) {
      this.verbs[verbIndex] = { ...this.verbs[verbIndex], srsData: newSRSData };

      // Persist to localStorage
      updateVerbSRS(this.verbs[verbIndex], newSRSData);

      // Track if this was a new card
      if (verb.srsData?.isNew) {
        this.newCardsSeenToday++;
      }
    }
  }

  getCurrentVerb(): VerbPair | null {
    if (this.shuffledVerbs.length === 0) return null;
    return this.shuffledVerbs[this.currentIndex];
  }

  getNextVerb(): VerbPair | null {
    if (this.shuffledVerbs.length === 0) return null;

    const currentVerb = this.shuffledVerbs[this.currentIndex];
    this.recentVerbs.push(currentVerb);

    if (this.recentVerbs.length > this.maxRecentVerbs) {
      this.recentVerbs.shift();
    }

    this.currentIndex++;

    if (this.currentIndex >= this.shuffledVerbs.length) {
      this.shuffleVerbs();
    }

    let attempts = 0;
    const maxAttempts = Math.min(10, this.shuffledVerbs.length);

    while (attempts < maxAttempts) {
      const nextVerb = this.shuffledVerbs[this.currentIndex];
      const isRecent = this.recentVerbs.some(
        (recent) => recent.english_infinitive === nextVerb.english_infinitive,
      );

      if (!isRecent || this.shuffledVerbs.length <= this.maxRecentVerbs) {
        return nextVerb;
      }

      this.currentIndex = (this.currentIndex + 1) % this.shuffledVerbs.length;
      attempts++;
    }

    return this.shuffledVerbs[this.currentIndex];
  }

  getRandomVerbForm(): VerbForm {
    const forms: VerbForm[] = [
      "dutch_infinitive",
      "imperfectum_single",
      "imperfectum_plural",
      "perfectum",
    ];
    return forms[Math.floor(Math.random() * forms.length)];
  }

  getVerbFormByMode(mode: VerbMode): VerbForm {
    switch (mode) {
      case "random":
        return this.getRandomVerbForm();
      case "infinitive":
        return "dutch_infinitive";
      case "imperfectum":
        // Randomly choose between single and plural imperfectum
        return Math.random() < 0.5
          ? "imperfectum_single"
          : "imperfectum_plural";
      case "perfectum":
        return "perfectum";
      default:
        return this.getRandomVerbForm();
    }
  }

  getVerbToDisplay(verb: VerbPair): string {
    return verb.english_infinitive;
  }

  getCorrectAnswer(verb: VerbPair, form: VerbForm): string {
    return verb[form];
  }

  getVerbFormLabel(form: VerbForm): string {
    const labels: Record<VerbForm, string> = {
      dutch_infinitive: "Dutch infinitive",
      imperfectum_single: "Imperfectum (single)",
      imperfectum_plural: "Imperfectum (plural)",
      perfectum: "Perfectum",
    };
    return labels[form];
  }

  getTotalVerbsCount(): number {
    return this.verbs.length;
  }

  reset(): void {
    this.shuffleVerbs();
    this.recentVerbs = [];
    this.resetHintState();
  }

  // Hint-related methods
  getHintForLevel(answer: string, level: HintLevel): string {
    try {
      // Validate inputs
      if (!answer || typeof answer !== "string") {
        console.warn(
          "VerbManager: Invalid answer provided for hint generation",
        );
        return "";
      }

      if (!isValidHintLevel(level)) {
        console.warn("VerbManager: Invalid hint level provided:", level);
        return "";
      }

      return generateHint(answer, level);
    } catch (error) {
      console.error("VerbManager: Error generating hint:", error);
      return "";
    }
  }

  getCurrentHintLevel(): HintLevel {
    try {
      return this.currentHintLevel;
    } catch (error) {
      console.error("VerbManager: Error getting current hint level:", error);
      return getInitialHintLevel();
    }
  }

  getHintForCurrentLevel(
    verb: VerbPair,
    form: VerbForm,
    level: HintLevel,
  ): string {
    try {
      // Validate inputs
      if (!verb || typeof verb !== "object") {
        console.warn("VerbManager: Invalid verb provided for hint generation");
        return "";
      }

      if (
        !form ||
        ![
          "dutch_infinitive",
          "imperfectum_single",
          "imperfectum_plural",
          "perfectum",
        ].includes(form)
      ) {
        console.warn(
          "VerbManager: Invalid verb form provided for hint generation",
        );
        return "";
      }

      if (!isValidHintLevel(level)) {
        console.warn("VerbManager: Invalid hint level provided:", level);
        return "";
      }

      const correctAnswer = this.getCorrectAnswer(verb, form);
      const hintText = this.getHintForLevel(correctAnswer, level);
      return hintText;
    } catch (error) {
      console.error(
        "VerbManager: Error generating hint for current level:",
        error,
      );
      return "";
    }
  }

  recordHintUsage(level: HintLevel): void {
    try {
      // Validate input
      if (!isValidHintLevel(level)) {
        console.warn(
          "VerbManager: Invalid hint level provided for recording:",
          level,
        );
        return;
      }

      // Track if this is the first hint used for this verb
      if (this.hintsUsedForCurrentVerb.length === 0) {
        this.questionsWithHints++;
      }

      // Add the hint level to the current verb's hint usage
      this.hintsUsedForCurrentVerb.push(level);
      this.totalHintsUsed++;

      // Don't advance hint level here - let the HintButton manage it
    } catch (error) {
      console.error("VerbManager: Error recording hint usage:", error);
    }
  }

  resetHintState(): void {
    try {
      this.currentHintLevel = getInitialHintLevel();
      this.hintsUsedForCurrentVerb = [];
    } catch (error) {
      console.error("VerbManager: Error resetting hint state:", error);
      // Fallback to safe defaults
      this.currentHintLevel = 1;
      this.hintsUsedForCurrentVerb = [];
    }
  }

  // Move to next verb and reset hint state
  getNextVerbWithHintReset(): VerbPair | null {
    try {
      const nextVerb = this.getNextVerb();
      this.resetHintState();
      return nextVerb;
    } catch (error) {
      console.error(
        "VerbManager: Error getting next verb with hint reset:",
        error,
      );
      // Still try to reset hint state even if getting next verb fails
      this.resetHintState();
      return null;
    }
  }

  // Statistics methods
  getHintUsageStats(): {
    totalHintsUsed: number;
    questionsWithHints: number;
    averageHintsPerQuestion: number;
    hintsUsedForCurrentVerb: HintLevel[];
  } {
    try {
      return {
        totalHintsUsed: this.totalHintsUsed || 0,
        questionsWithHints: this.questionsWithHints || 0,
        averageHintsPerQuestion:
          this.questionsWithHints > 0
            ? this.totalHintsUsed / this.questionsWithHints
            : 0,
        hintsUsedForCurrentVerb: [...(this.hintsUsedForCurrentVerb || [])],
      };
    } catch (error) {
      console.error("VerbManager: Error getting hint usage stats:", error);
      return {
        totalHintsUsed: 0,
        questionsWithHints: 0,
        averageHintsPerQuestion: 0,
        hintsUsedForCurrentVerb: [],
      };
    }
  }
}
