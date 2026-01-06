import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SentenceManager,
  scrambleSentenceWords,
  validateConstruction,
  generateSentenceHint,
  evaluateSentenceAnswer,
} from "./sentenceManager";
import type { SentencePair } from "../types";

// Mock the storage module
vi.mock("./storage", () => ({
  updateSentenceSRS: vi.fn(),
}));

// Mock the srsAlgorithm module
vi.mock("./srsAlgorithm", () => ({
  updateSRSCard: vi.fn(() => ({
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    dueDate: Date.now() + 86400000,
    lastReviewDate: Date.now(),
    reviewHistory: [],
    isNew: false,
  })),
}));

const createMockSentence = (
  id: string,
  dutch: string,
  english: string,
  difficulty: 1 | 2 | 3 = 1
): SentencePair => ({
  id,
  dutch,
  english,
  difficulty,
});

describe("scrambleSentenceWords", () => {
  it("should return the same word for single-word sentences", () => {
    const sentence = createMockSentence("1", "Hallo", "Hello");
    const scrambled = scrambleSentenceWords(sentence);
    expect(scrambled).toEqual(["Hallo"]);
  });

  it("should scramble words in a sentence", () => {
    const sentence = createMockSentence(
      "1",
      "Ik ga naar de winkel",
      "I am going to the store"
    );

    // Run multiple times to ensure it shuffles
    let differentOrderFound = false;
    const originalWords = sentence.dutch.split(/\s+/);

    for (let i = 0; i < 20; i++) {
      const scrambled = scrambleSentenceWords(sentence);
      expect(scrambled).toHaveLength(5);
      expect(scrambled.sort()).toEqual([...originalWords].sort());

      if (scrambled.join(" ") !== sentence.dutch) {
        differentOrderFound = true;
        break;
      }
    }

    expect(differentOrderFound).toBe(true);
  });

  it("should ensure first word is not in original position", () => {
    const sentence = createMockSentence(
      "1",
      "Ik ga naar de winkel",
      "I am going to the store"
    );

    // Run multiple times to check constraint
    for (let i = 0; i < 10; i++) {
      const scrambled = scrambleSentenceWords(sentence);
      // For sentences with more than one word, first word should be moved
      expect(scrambled[0]).not.toBe("Ik");
    }
  });

  it("should handle two-word sentences", () => {
    const sentence = createMockSentence("1", "Goedemorgen allemaal", "Good morning everyone");
    const scrambled = scrambleSentenceWords(sentence);
    expect(scrambled).toHaveLength(2);
    expect(scrambled.sort()).toEqual(["Goedemorgen", "allemaal"].sort());
  });
});

describe("validateConstruction", () => {
  it("should return true for correct word order", () => {
    const sentence = createMockSentence(
      "1",
      "Ik ga naar de winkel",
      "I am going to the store"
    );
    const constructed = ["Ik", "ga", "naar", "de", "winkel"];
    expect(validateConstruction(constructed, sentence)).toBe(true);
  });

  it("should be case-insensitive", () => {
    const sentence = createMockSentence(
      "1",
      "Ik ga naar de winkel",
      "I am going to the store"
    );
    const constructed = ["ik", "GA", "Naar", "DE", "WINKEL"];
    expect(validateConstruction(constructed, sentence)).toBe(true);
  });

  it("should return false for incorrect word order", () => {
    const sentence = createMockSentence(
      "1",
      "Ik ga naar de winkel",
      "I am going to the store"
    );
    const constructed = ["ga", "Ik", "naar", "de", "winkel"];
    expect(validateConstruction(constructed, sentence)).toBe(false);
  });

  it("should return false for missing words", () => {
    const sentence = createMockSentence(
      "1",
      "Ik ga naar de winkel",
      "I am going to the store"
    );
    const constructed = ["Ik", "ga", "naar", "de"];
    expect(validateConstruction(constructed, sentence)).toBe(false);
  });

  it("should return false for extra words", () => {
    const sentence = createMockSentence(
      "1",
      "Ik ga naar de winkel",
      "I am going to the store"
    );
    const constructed = ["Ik", "ga", "naar", "de", "winkel", "nu"];
    expect(validateConstruction(constructed, sentence)).toBe(false);
  });

  it("should handle whitespace in constructed words", () => {
    const sentence = createMockSentence(
      "1",
      "Ik ga naar de winkel",
      "I am going to the store"
    );
    const constructed = [" Ik ", " ga", "naar ", "de", "winkel"];
    expect(validateConstruction(constructed, sentence)).toBe(true);
  });
});

describe("evaluateSentenceAnswer", () => {
  it("should flag minor typos but accept the answer", () => {
    const sentence = createMockSentence(
      "11",
      "Hij drinkt een kopje koffie",
      "He drinks a cup of coffee"
    );
    const constructed = ["hij", "drinkt", "een", "kopje", "koffee"];
    const result = evaluateSentenceAnswer(constructed, sentence);

    expect(result.isCorrect).toBe(true);
    expect(result.matchedViaFuzzy).toBe(true);
    expect(result.typoDetails).toEqual([
      { index: 4, expected: "koffie", received: "koffee" },
    ]);
  });

  it("should tolerate a small typo on short words", () => {
    const sentence = createMockSentence(
      "11b",
      "Ik heb een rode auto",
      "I have a red car"
    );
    const constructedSingleSlip = ["ik", "heb", "eeb", "rode", "auto"];
    const constructedDoubleSlip = ["ik", "heb", "eev", "rode", "auto"]; // still one edit away

    const resultSingle = evaluateSentenceAnswer(constructedSingleSlip, sentence);
    const resultDouble = evaluateSentenceAnswer(constructedDoubleSlip, sentence);

    expect(resultSingle.isCorrect).toBe(true);
    expect(resultSingle.matchedViaFuzzy).toBe(true);
    expect(resultSingle.typoDetails).toEqual([
      { index: 2, expected: "een", received: "eeb" },
    ]);

    expect(resultDouble.isCorrect).toBe(true);
    expect(resultDouble.matchedViaFuzzy).toBe(true);
    expect(resultDouble.typoDetails).toEqual([
      { index: 2, expected: "een", received: "eev" },
    ]);
  });

  it("should accept pronoun variants we/wij and ze/zij without marking typos", () => {
    const sentenceWij = createMockSentence(
      "11d",
      "Wij gaan naar huis",
      "We are going home"
    );
    const constructedWe = ["we", "gaan", "naar", "huis"];
    const resultWe = evaluateSentenceAnswer(constructedWe, sentenceWij);

    expect(resultWe.isCorrect).toBe(true);
    expect(resultWe.matchedViaFuzzy).toBe(false);
    expect(resultWe.typoDetails).toHaveLength(0);

    const sentenceZij = createMockSentence(
      "11e",
      "Zij werken samen",
      "They work together"
    );
    const constructedZe = ["ze", "werken", "samen"];
    const resultZe = evaluateSentenceAnswer(constructedZe, sentenceZij);

    expect(resultZe.isCorrect).toBe(true);
    expect(resultZe.matchedViaFuzzy).toBe(false);
    expect(resultZe.typoDetails).toHaveLength(0);
  });

  it("should tolerate a single transposition typo in a word", () => {
    const sentence = createMockSentence(
      "11c",
      "De hond speelt in de tuin",
      "The dog plays in the garden"
    );
    const constructed = ["de", "hond", "speetl", "in", "de", "tuin"];
    const result = evaluateSentenceAnswer(constructed, sentence);

    expect(result.isCorrect).toBe(true);
    expect(result.matchedViaFuzzy).toBe(true);
    expect(result.typoDetails).toEqual([
      { index: 2, expected: "speelt", received: "speetl" },
    ]);
  });

  it("should reject answers with missing or incorrect words", () => {
    const sentence = createMockSentence(
      "12",
      "Hij drinkt een kopje koffie",
      "He drinks a cup of coffee"
    );
    const missingWord = ["Hij", "drinkt", "kopje", "koffie"];
    const incorrectWord = ["Hij", "drankt", "een", "kopje", "koffee"];

    expect(evaluateSentenceAnswer(missingWord, sentence).isCorrect).toBe(false);
    expect(evaluateSentenceAnswer(incorrectWord, sentence).isCorrect).toBe(false);
  });

  it("should report exact matches without typo details", () => {
    const sentence = createMockSentence(
      "13",
      "Dit is een test zin",
      "This is a test sentence"
    );
    const constructed = ["Dit", "is", "een", "test", "zin"];
    const result = evaluateSentenceAnswer(constructed, sentence);

    expect(result.isCorrect).toBe(true);
    expect(result.matchedViaFuzzy).toBe(false);
    expect(result.typoDetails).toHaveLength(0);
  });
});

describe("generateSentenceHint", () => {
  const sentence = createMockSentence(
    "1",
    "Ik ga naar de winkel",
    "I am going to the store"
  );

  it("should generate level 1 hint with first word and count", () => {
    const hint = generateSentenceHint(sentence, 1);
    expect(hint).toContain("Ik");
    expect(hint).toContain("5 words");
  });

  it("should generate level 2 hint with first few words", () => {
    const hint = generateSentenceHint(sentence, 2);
    expect(hint).toContain("Ik ga");
    expect(hint).toContain("...");
  });

  it("should generate level 3 hint with structure and blanks", () => {
    const hint = generateSentenceHint(sentence, 3);
    expect(hint).toContain("Ik");
    expect(hint).toContain("winkel");
    expect(hint).toContain("___");
  });

  it("should generate level 4 hint with complete sentence", () => {
    const hint = generateSentenceHint(sentence, 4);
    expect(hint).toBe("Ik ga naar de winkel");
  });

  it("should handle short sentences for level 3", () => {
    const shortSentence = createMockSentence("2", "Hallo wereld", "Hello world");
    const hint = generateSentenceHint(shortSentence, 3);
    // For 2-word sentences, should show complete sentence
    expect(hint).toBe("Hallo wereld");
  });
});

describe("SentenceManager", () => {
  let manager: SentenceManager;
  const mockSentences: SentencePair[] = [
    createMockSentence("1", "Ik ga naar de winkel", "I am going to the store", 1),
    createMockSentence("2", "Het weer is mooi vandaag", "The weather is nice today", 1),
    createMockSentence("3", "Zij leest een boek", "She reads a book", 2),
    createMockSentence("4", "Wij eten brood met kaas", "We eat bread with cheese", 2),
    createMockSentence("5", "De hond speelt in de tuin", "The dog plays in the garden", 3),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new SentenceManager([...mockSentences]);
  });

  describe("initialization", () => {
    it("should initialize with provided sentences", () => {
      expect(manager.getTotalSentencesCount()).toBe(5);
    });

    it("should have all difficulty levels in filter by default", () => {
      expect(manager.getDifficultyFilter()).toEqual([1, 2, 3]);
    });
  });

  describe("getCurrentSentence", () => {
    it("should return a sentence", () => {
      const sentence = manager.getCurrentSentence();
      expect(sentence).not.toBeNull();
      expect(mockSentences.map((s) => s.id)).toContain(sentence?.id);
    });

    it("should return null for empty manager", () => {
      const emptyManager = new SentenceManager([]);
      expect(emptyManager.getCurrentSentence()).toBeNull();
    });
  });

  describe("getNextSentence", () => {
    it("should return different sentences", () => {
      const seen = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const sentence = manager.getNextSentence();
        if (sentence) {
          seen.add(sentence.id);
        }
      }
      expect(seen.size).toBeGreaterThan(1);
    });

    it("should cycle through all sentences", () => {
      const seenIds = new Set<string>();
      // Go through more iterations than sentences to ensure cycling
      for (let i = 0; i < 20; i++) {
        const sentence = manager.getCurrentSentence();
        if (sentence) {
          seenIds.add(sentence.id);
        }
        manager.getNextSentence();
      }
      expect(seenIds.size).toBe(5);
    });
  });

  describe("difficulty filtering", () => {
    it("should filter sentences by difficulty", () => {
      manager.setDifficultyFilter([1]);
      expect(manager.getFilteredSentencesCount()).toBe(2);
    });

    it("should filter multiple difficulty levels", () => {
      manager.setDifficultyFilter([1, 2]);
      expect(manager.getFilteredSentencesCount()).toBe(4);
    });

    it("should default to all levels when empty filter is provided", () => {
      manager.setDifficultyFilter([]);
      expect(manager.getFilteredSentencesCount()).toBe(5);
    });
  });

  describe("getScrambledWords", () => {
    it("should return scrambled words for a sentence", () => {
      const sentence = mockSentences[0];
      const scrambled = manager.getScrambledWords(sentence);
      expect(scrambled.length).toBe(5);
      expect(scrambled.sort()).toEqual(sentence.dutch.split(/\s+/).sort());
    });
  });

  describe("validateUserConstruction", () => {
    it("should validate correct construction", () => {
      const sentence = mockSentences[0];
      const constructed = ["Ik", "ga", "naar", "de", "winkel"];
      expect(manager.validateUserConstruction(constructed, sentence)).toBe(true);
    });

    it("should reject incorrect construction", () => {
      const sentence = mockSentences[0];
      const constructed = ["de", "winkel", "ga", "naar", "Ik"];
      expect(manager.validateUserConstruction(constructed, sentence)).toBe(false);
    });
  });

  describe("getCorrectAnswer", () => {
    it("should return the Dutch sentence", () => {
      const sentence = mockSentences[0];
      expect(manager.getCorrectAnswer(sentence)).toBe("Ik ga naar de winkel");
    });
  });

  describe("hint system", () => {
    it("should start with hint level 1", () => {
      expect(manager.getCurrentHintLevel()).toBe(1);
    });

    it("should generate appropriate hints", () => {
      const sentence = mockSentences[0];
      const hint = manager.getHintForCurrentLevel(sentence, 1);
      expect(hint).toContain("Ik");
    });

    it("should track hint usage", () => {
      manager.recordHintUsage(1);
      manager.recordHintUsage(2);
      const stats = manager.getHintUsageStats();
      expect(stats.totalHintsUsed).toBe(2);
      expect(stats.questionsWithHints).toBe(1);
    });

    it("should reset hint state", () => {
      manager.recordHintUsage(1);
      manager.resetHintState();
      expect(manager.getCurrentHintLevel()).toBe(1);
      expect(manager.getHintUsageStats().hintsUsedForCurrentSentence).toHaveLength(0);
    });
  });

  describe("getNextSentenceWithHintReset", () => {
    it("should get next sentence and reset hints", () => {
      manager.recordHintUsage(1);
      manager.recordHintUsage(2);

      manager.getNextSentenceWithHintReset();

      expect(manager.getHintUsageStats().hintsUsedForCurrentSentence).toHaveLength(0);
    });
  });

  describe("recordAnswer", () => {
    it("should record correct answer", () => {
      const sentence = manager.getCurrentSentence();
      if (sentence) {
        expect(() => manager.recordAnswer(sentence, true, 0)).not.toThrow();
      }
    });

    it("should record incorrect answer", () => {
      const sentence = manager.getCurrentSentence();
      if (sentence) {
        expect(() => manager.recordAnswer(sentence, false, 0)).not.toThrow();
      }
    });
  });

  describe("reset", () => {
    it("should reset manager state", () => {
      manager.recordHintUsage(1);
      manager.getNextSentence();
      manager.getNextSentence();

      manager.reset();

      expect(manager.getCurrentHintLevel()).toBe(1);
      expect(manager.getHintUsageStats().hintsUsedForCurrentSentence).toHaveLength(0);
    });
  });

  describe("SRS configuration", () => {
    it("should accept SRS config", () => {
      expect(() =>
        manager.setSRSConfig({
          dailyNewCardLimit: 10,
        })
      ).not.toThrow();
    });

    it("should toggle SRS enabled state", () => {
      expect(() => manager.setSRSEnabled(false)).not.toThrow();
      expect(() => manager.setSRSEnabled(true)).not.toThrow();
    });

    it("should set new cards seen today", () => {
      expect(() => manager.setNewCardsSeenToday(5)).not.toThrow();
    });
  });

  describe("getAllSentences", () => {
    it("should return all sentences", () => {
      const allSentences = manager.getAllSentences();
      expect(allSentences).toHaveLength(5);
    });
  });
});
