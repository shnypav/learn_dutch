import { describe, it, expect, beforeEach, vi } from "vitest";
import { WordManager } from "./wordManager";
import * as storage from "./storage";

vi.mock("./storage");

describe("WordManager", () => {
  let manager: WordManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new WordManager();
  });

  describe("initialization", () => {
    it("should initialize with empty words array", () => {
      expect(manager.getWords()).toEqual([]);
    });

    it("should set initial stats from storage", () => {
      const mockStats = { correct: 5, incorrect: 2, streak: 3 };
      vi.spyOn(storage.storage, "get").mockReturnValue(mockStats);

      const newManager = new WordManager();
      expect(newManager.getStats()).toEqual(mockStats);
    });

    it("should use default stats if none in storage", () => {
      vi.spyOn(storage.storage, "get").mockReturnValue(null);

      const newManager = new WordManager();
      expect(newManager.getStats()).toEqual({
        correct: 0,
        incorrect: 0,
        streak: 0,
      });
    });
  });

  describe("loadWords", () => {
    it("should load and parse CSV data", async () => {
      const csvData = `dutch,english,type
huis,house,noun
lopen,to walk,verb`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(csvData),
      });

      await manager.loadWords();

      const words = manager.getWords();
      expect(words).toHaveLength(2);
      expect(words[0]).toEqual({
        dutch: "huis",
        english: "house",
        type: "noun",
      });
    });

    it("should handle fetch errors", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(manager.loadWords()).rejects.toThrow("Network error");
    });

    it("should handle non-ok response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(manager.loadWords()).rejects.toThrow();
    });
  });

  describe("getRandomWord", () => {
    beforeEach(() => {
      manager["words"] = [
        { dutch: "huis", english: "house", type: "noun" },
        { dutch: "lopen", english: "to walk", type: "verb" },
        { dutch: "groot", english: "big", type: "adjective" },
      ];
    });

    it("should return a random word", () => {
      const word = manager.getRandomWord();
      expect(word).toBeDefined();
      expect(manager["words"]).toContainEqual(word);
    });

    it("should return null if no words loaded", () => {
      manager["words"] = [];
      expect(manager.getRandomWord()).toBeNull();
    });

    it("should eventually return all words when called multiple times", () => {
      const words = new Set();
      for (let i = 0; i < 100; i++) {
        const word = manager.getRandomWord();
        if (word) words.add(word.dutch);
      }
      expect(words.size).toBe(3);
    });
  });

  describe("checkAnswer", () => {
    const testWord = { dutch: "huis", english: "house", type: "noun" };

    it("should return true for correct answer", () => {
      expect(manager.checkAnswer("house", testWord)).toBe(true);
    });

    it("should return true for fuzzy matched answer", () => {
      expect(manager.checkAnswer("House", testWord)).toBe(true);
      expect(manager.checkAnswer("  house  ", testWord)).toBe(true);
    });

    it("should return false for incorrect answer", () => {
      expect(manager.checkAnswer("building", testWord)).toBe(false);
    });

    it('should handle "to" prefix for verbs', () => {
      const verb = { dutch: "lopen", english: "to walk", type: "verb" };
      expect(manager.checkAnswer("walk", verb)).toBe(true);
      expect(manager.checkAnswer("to walk", verb)).toBe(true);
    });
  });

  describe("stats management", () => {
    it("should record correct answer", () => {
      manager.recordAnswer(true);

      const stats = manager.getStats();
      expect(stats.correct).toBe(1);
      expect(stats.incorrect).toBe(0);
      expect(stats.streak).toBe(1);
    });

    it("should record incorrect answer", () => {
      manager.recordAnswer(false);

      const stats = manager.getStats();
      expect(stats.correct).toBe(0);
      expect(stats.incorrect).toBe(1);
      expect(stats.streak).toBe(0);
    });

    it("should maintain streak for consecutive correct answers", () => {
      manager.recordAnswer(true);
      manager.recordAnswer(true);
      manager.recordAnswer(true);

      expect(manager.getStats().streak).toBe(3);
    });

    it("should reset streak on incorrect answer", () => {
      manager.recordAnswer(true);
      manager.recordAnswer(true);
      manager.recordAnswer(false);

      expect(manager.getStats().streak).toBe(0);
    });

    it("should save stats to storage", () => {
      const setSpy = vi.spyOn(storage.storage, "set");

      manager.recordAnswer(true);

      expect(setSpy).toHaveBeenCalledWith("wordStats", {
        correct: 1,
        incorrect: 0,
        streak: 1,
      });
    });

    it("should reset stats", () => {
      manager.recordAnswer(true);
      manager.recordAnswer(false);
      manager.resetStats();

      expect(manager.getStats()).toEqual({
        correct: 0,
        incorrect: 0,
        streak: 0,
      });
    });
  });

  describe("getWordsByType", () => {
    beforeEach(() => {
      manager["words"] = [
        { dutch: "huis", english: "house", type: "noun" },
        { dutch: "lopen", english: "to walk", type: "verb" },
        { dutch: "groot", english: "big", type: "adjective" },
        { dutch: "auto", english: "car", type: "noun" },
      ];
    });

    it("should filter words by type", () => {
      const nouns = manager.getWordsByType("noun");
      expect(nouns).toHaveLength(2);
      expect(nouns.every((w) => w.type === "noun")).toBe(true);
    });

    it("should return empty array for non-existent type", () => {
      const words = manager.getWordsByType("adverb");
      expect(words).toEqual([]);
    });
  });
});
