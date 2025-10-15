import { describe, it, expect, beforeEach, vi } from "vitest";
import { WordManager } from "./wordManager";
import { VerbManager } from "./verbManager";
import {
  generateHint,
  getInitialHintLevel,
  getNextHintLevel,
  type HintLevel,
} from "./hintGenerator";
import type { WordPair, VerbPair, LearningMode, VerbForm } from "../types";

// Mock data
const mockWords: WordPair[] = [
  { dutch: "huis", english: "house" },
  { dutch: "auto", english: "car" },
  { dutch: "boom", english: "tree" },
];

const mockVerbs: VerbPair[] = [
  {
    english_infinitive: "to be",
    dutch_infinitive: "zijn",
    imperfectum_single: "was",
    imperfectum_plural: "waren",
    perfectum: "geweest",
  },
  {
    english_infinitive: "to have",
    dutch_infinitive: "hebben",
    imperfectum_single: "had",
    imperfectum_plural: "hadden",
    perfectum: "gehad",
  },
];

describe("Hint Flow Integration Tests", () => {
  describe("WordManager Hint Integration", () => {
    let wordManager: WordManager;
    let currentWord: WordPair;

    beforeEach(() => {
      wordManager = new WordManager(mockWords);
      currentWord = wordManager.getCurrentWord()!;
    });

    it("should complete full hint progression flow for words", () => {
      const mode: LearningMode = "nl-en";
      const correctAnswer = wordManager.getCorrectAnswer(currentWord, mode);

      // Test complete hint flow: Level 1 → 2 → 3 → 4
      const hintLevel1: HintLevel = 1;
      const hintLevel2: HintLevel = 2;
      const hintLevel3: HintLevel = 3;
      const hintLevel4: HintLevel = 4;

      // Level 1: First letter only
      const hint1 = wordManager.getHintForCurrentLevel(
        currentWord,
        mode,
        hintLevel1,
      );
      expect(hint1).toBe(correctAnswer[0]);

      // Record hint usage
      wordManager.recordHintUsage(hintLevel1);

      // Level 2: First letter + asterisks
      const hint2 = wordManager.getHintForCurrentLevel(
        currentWord,
        mode,
        hintLevel2,
      );
      expect(hint2).toBe(generateHint(correctAnswer, hintLevel2));
      expect(hint2).toMatch(new RegExp(`^${correctAnswer[0]}\\*+`));

      // Record hint usage
      wordManager.recordHintUsage(hintLevel2);

      // Level 3: First letter + asterisks + last letter
      const hint3 = wordManager.getHintForCurrentLevel(
        currentWord,
        mode,
        hintLevel3,
      );
      expect(hint3).toBe(generateHint(correctAnswer, hintLevel3));
      if (correctAnswer.length > 2) {
        expect(hint3).toMatch(
          new RegExp(
            `^${correctAnswer[0]}.*${correctAnswer[correctAnswer.length - 1]}$`,
          ),
        );
      }

      // Record hint usage
      wordManager.recordHintUsage(hintLevel3);

      // Level 4: Complete answer
      const hint4 = wordManager.getHintForCurrentLevel(
        currentWord,
        mode,
        hintLevel4,
      );
      expect(hint4).toBe(correctAnswer);

      // Record hint usage
      wordManager.recordHintUsage(hintLevel4);

      // Verify statistics
      const stats = wordManager.getHintUsageStats();
      expect(stats.totalHintsUsed).toBe(4);
      expect(stats.questionsWithHints).toBe(1);
      expect(stats.hintsUsedForCurrentWord).toEqual([1, 2, 3, 4]);
      expect(stats.averageHintsPerQuestion).toBe(4);
    });

    it("should handle hint reset between words", () => {
      // Use hints for first word
      wordManager.recordHintUsage(1);
      wordManager.recordHintUsage(2);

      let stats = wordManager.getHintUsageStats();
      expect(stats.hintsUsedForCurrentWord).toEqual([1, 2]);

      // Move to next word with hint reset
      const nextWord = wordManager.getNextWordWithHintReset();
      expect(nextWord).toBeTruthy();

      // Verify hint state reset
      stats = wordManager.getHintUsageStats();
      expect(stats.hintsUsedForCurrentWord).toEqual([]);
      expect(stats.totalHintsUsed).toBe(2); // Total still preserved
      expect(stats.questionsWithHints).toBe(1); // Previous question count preserved
    });

    it("should handle different learning modes", () => {
      const nlToEn: LearningMode = "nl-en";
      const enToNl: LearningMode = "en-nl";

      // Test nl-en mode
      const hint1NlEn = wordManager.getHintForCurrentLevel(
        currentWord,
        nlToEn,
        1,
      );
      expect(hint1NlEn).toBe(currentWord.english[0]);

      // Test en-nl mode
      const hint1EnNl = wordManager.getHintForCurrentLevel(
        currentWord,
        enToNl,
        1,
      );
      expect(hint1EnNl).toBe(currentWord.dutch[0]);

      // Verify different answers
      expect(hint1NlEn).not.toBe(hint1EnNl);
    });

    it("should handle error cases gracefully", () => {
      // Test invalid word
      const invalidWord = null as any;
      const hint = wordManager.getHintForCurrentLevel(invalidWord, "nl-en", 1);
      expect(hint).toBe("");

      // Test invalid mode
      const invalidMode = "invalid" as any;
      const hint2 = wordManager.getHintForCurrentLevel(
        currentWord,
        invalidMode,
        1,
      );
      expect(hint2).toBe("");

      // Test invalid hint level
      const invalidLevel = 5 as any;
      const hint3 = wordManager.getHintForCurrentLevel(
        currentWord,
        "nl-en",
        invalidLevel,
      );
      expect(hint3).toBe("");
    });
  });

  describe("VerbManager Hint Integration", () => {
    let verbManager: VerbManager;
    let currentVerb: VerbPair;

    beforeEach(() => {
      verbManager = new VerbManager(mockVerbs);
      currentVerb = verbManager.getCurrentVerb()!;
    });

    it("should complete full hint progression flow for verbs", () => {
      const verbForm: VerbForm = "dutch_infinitive";
      const correctAnswer = verbManager.getCorrectAnswer(currentVerb, verbForm);

      // Test complete hint flow: Level 1 → 2 → 3 → 4
      const hintLevel1: HintLevel = 1;
      const hintLevel2: HintLevel = 2;
      const hintLevel3: HintLevel = 3;
      const hintLevel4: HintLevel = 4;

      // Level 1: First letter only
      const hint1 = verbManager.getHintForCurrentLevel(
        currentVerb,
        verbForm,
        hintLevel1,
      );
      expect(hint1).toBe(correctAnswer[0]);

      // Record hint usage
      verbManager.recordHintUsage(hintLevel1);

      // Level 2: First letter + asterisks
      const hint2 = verbManager.getHintForCurrentLevel(
        currentVerb,
        verbForm,
        hintLevel2,
      );
      expect(hint2).toBe(generateHint(correctAnswer, hintLevel2));

      // Record hint usage
      verbManager.recordHintUsage(hintLevel2);

      // Level 3: First letter + asterisks + last letter
      const hint3 = verbManager.getHintForCurrentLevel(
        currentVerb,
        verbForm,
        hintLevel3,
      );
      expect(hint3).toBe(generateHint(correctAnswer, hintLevel3));

      // Record hint usage
      verbManager.recordHintUsage(hintLevel3);

      // Level 4: Complete answer
      const hint4 = verbManager.getHintForCurrentLevel(
        currentVerb,
        verbForm,
        hintLevel4,
      );
      expect(hint4).toBe(correctAnswer);

      // Record hint usage
      verbManager.recordHintUsage(hintLevel4);

      // Verify statistics
      const stats = verbManager.getHintUsageStats();
      expect(stats.totalHintsUsed).toBe(4);
      expect(stats.questionsWithHints).toBe(1);
      expect(stats.hintsUsedForCurrentVerb).toEqual([1, 2, 3, 4]);
      expect(stats.averageHintsPerQuestion).toBe(4);
    });

    it("should handle different verb forms", () => {
      const forms: VerbForm[] = [
        "dutch_infinitive",
        "imperfectum_single",
        "imperfectum_plural",
        "perfectum",
      ];

      forms.forEach((form) => {
        const correctAnswer = verbManager.getCorrectAnswer(currentVerb, form);
        const hint = verbManager.getHintForCurrentLevel(currentVerb, form, 1);
        expect(hint).toBe(correctAnswer[0]);
      });
    });

    it("should handle hint reset between verbs", () => {
      // Use hints for first verb
      verbManager.recordHintUsage(1);
      verbManager.recordHintUsage(2);

      let stats = verbManager.getHintUsageStats();
      expect(stats.hintsUsedForCurrentVerb).toEqual([1, 2]);

      // Move to next verb with hint reset
      const nextVerb = verbManager.getNextVerbWithHintReset();
      expect(nextVerb).toBeTruthy();

      // Verify hint state reset
      stats = verbManager.getHintUsageStats();
      expect(stats.hintsUsedForCurrentVerb).toEqual([]);
      expect(stats.totalHintsUsed).toBe(2); // Total still preserved
      expect(stats.questionsWithHints).toBe(1); // Previous question count preserved
    });

    it("should handle error cases gracefully", () => {
      // Test invalid verb
      const invalidVerb = null as any;
      const hint = verbManager.getHintForCurrentLevel(
        invalidVerb,
        "dutch_infinitive",
        1,
      );
      expect(hint).toBe("");

      // Test invalid form
      const invalidForm = "invalid" as any;
      const hint2 = verbManager.getHintForCurrentLevel(
        currentVerb,
        invalidForm,
        1,
      );
      expect(hint2).toBe("");

      // Test invalid hint level
      const invalidLevel = 5 as any;
      const hint3 = verbManager.getHintForCurrentLevel(
        currentVerb,
        "dutch_infinitive",
        invalidLevel,
      );
      expect(hint3).toBe("");
    });
  });

  describe("Hint Level Progression Integration", () => {
    it("should follow correct hint level progression", () => {
      let currentLevel = getInitialHintLevel();
      expect(currentLevel).toBe(1);

      // Test progression through all levels
      currentLevel = getNextHintLevel(currentLevel);
      expect(currentLevel).toBe(2);

      currentLevel = getNextHintLevel(currentLevel);
      expect(currentLevel).toBe(3);

      currentLevel = getNextHintLevel(currentLevel);
      expect(currentLevel).toBe(4);

      // Test that level 4 is maximum
      currentLevel = getNextHintLevel(currentLevel);
      expect(currentLevel).toBe(4);
    });
  });

  describe("Cross-Component Integration", () => {
    it("should maintain consistent hint generation across components", () => {
      const testAnswer = "hello";
      const wordManager = new WordManager([
        { dutch: "hallo", english: testAnswer },
      ]);
      const currentWord = wordManager.getCurrentWord()!;

      // Test that WordManager and direct generateHint produce same results
      for (let level = 1; level <= 4; level++) {
        const managerHint = wordManager.getHintForCurrentLevel(
          currentWord,
          "nl-en",
          level as HintLevel,
        );
        const directHint = generateHint(testAnswer, level as HintLevel);
        expect(managerHint).toBe(directHint);
      }
    });

    it("should handle statistics consistently across different managers", () => {
      const wordManager = new WordManager(mockWords);
      const verbManager = new VerbManager(mockVerbs);

      // Use hints in word manager
      wordManager.recordHintUsage(1);
      wordManager.recordHintUsage(2);

      // Use hints in verb manager
      verbManager.recordHintUsage(1);
      verbManager.recordHintUsage(2);
      verbManager.recordHintUsage(3);

      // Verify independent statistics
      const wordStats = wordManager.getHintUsageStats();
      const verbStats = verbManager.getHintUsageStats();

      expect(wordStats.totalHintsUsed).toBe(2);
      expect(verbStats.totalHintsUsed).toBe(3);
      expect(wordStats.questionsWithHints).toBe(1);
      expect(verbStats.questionsWithHints).toBe(1);
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle corrupt manager state gracefully", () => {
      const wordManager = new WordManager(mockWords);

      // Simulate corrupted state
      (wordManager as any).hintsUsedForCurrentWord = null;

      const stats = wordManager.getHintUsageStats();
      expect(stats.hintsUsedForCurrentWord).toEqual([]);
      expect(stats.totalHintsUsed).toBe(0);
      expect(stats.questionsWithHints).toBe(0);
    });

    it("should handle hint generation errors gracefully", () => {
      const wordManager = new WordManager(mockWords);
      const currentWord = wordManager.getCurrentWord()!;

      // Test with undefined answer by mocking getCorrectAnswer
      const originalGetCorrectAnswer = wordManager.getCorrectAnswer;
      wordManager.getCorrectAnswer = vi.fn().mockReturnValue(undefined);

      const hint = wordManager.getHintForCurrentLevel(currentWord, "nl-en", 1);
      expect(hint).toBe("");

      // Restore original method
      wordManager.getCorrectAnswer = originalGetCorrectAnswer;
    });
  });

  describe("Performance Integration", () => {
    it("should handle large hint usage efficiently", () => {
      const wordManager = new WordManager(mockWords);
      const startTime = performance.now();

      // Record many hints
      for (let i = 0; i < 1000; i++) {
        wordManager.recordHintUsage(((i % 4) + 1) as HintLevel);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);

      // Verify statistics are still correct
      const stats = wordManager.getHintUsageStats();
      expect(stats.totalHintsUsed).toBe(1000);
      expect(stats.questionsWithHints).toBe(1);
    });
  });
});
