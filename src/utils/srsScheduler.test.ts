import { describe, it, expect } from "vitest";
import {
  getDueCards,
  getNewCards,
  getCardsByPriority,
  getUpcomingReviews,
  initializeCardsWithSRS,
  getCardCategoryCounts,
  getCardsByCategory,
  DEFAULT_SRS_CONFIG,
} from "./srsScheduler";
import { initializeSRSCard, calculateNextReview } from "./srsAlgorithm";
import type { WordPair } from "../types";

describe("SRS Scheduler", () => {
  // Helper function to create test word cards
  const createTestWord = (
    dutch: string,
    english: string,
    dueDate?: number,
  ): WordPair => ({
    dutch,
    english,
    srsData:
      dueDate !== undefined
        ? {
            ...initializeSRSCard(),
            dueDate,
            isNew: false,
          }
        : undefined,
  });

  describe("getDueCards", () => {
    it("should return cards that are due now", () => {
      const now = Date.now();
      const cards: WordPair[] = [
        createTestWord("huis", "house", now - 1000), // Due 1 second ago
        createTestWord("boom", "tree", now + 86400000), // Due tomorrow
        createTestWord("kat", "cat", now - 86400000), // Due yesterday
      ];

      const dueCards = getDueCards(cards, now);

      expect(dueCards).toHaveLength(2);
      expect(dueCards[0].dutch).toBe("kat"); // Most overdue first
      expect(dueCards[1].dutch).toBe("huis");
    });

    it("should return empty array if no cards are due", () => {
      const now = Date.now();
      const cards: WordPair[] = [
        createTestWord("huis", "house", now + 86400000),
        createTestWord("boom", "tree", now + 172800000),
      ];

      const dueCards = getDueCards(cards, now);

      expect(dueCards).toHaveLength(0);
    });

    it("should not include cards without SRS data", () => {
      const now = Date.now();
      const cards: WordPair[] = [
        { dutch: "huis", english: "house" }, // No SRS data
        createTestWord("kat", "cat", now - 1000),
      ];

      const dueCards = getDueCards(cards, now);

      expect(dueCards).toHaveLength(1);
      expect(dueCards[0].dutch).toBe("kat");
    });
  });

  describe("getNewCards", () => {
    it("should return new cards up to the limit", () => {
      const cards: WordPair[] = [
        { dutch: "huis", english: "house" },
        { dutch: "boom", english: "tree" },
        { dutch: "kat", english: "cat" },
        { dutch: "hond", english: "dog" },
        { dutch: "vis", english: "fish" },
      ];

      const newCards = getNewCards(cards, 3);

      expect(newCards.length).toBeLessThanOrEqual(3);
    });

    it("should return all new cards if less than limit", () => {
      const cards: WordPair[] = [
        { dutch: "huis", english: "house" },
        { dutch: "boom", english: "tree" },
      ];

      const newCards = getNewCards(cards, 10);

      expect(newCards).toHaveLength(2);
    });

    it("should not return cards with SRS data that are not new", () => {
      const now = Date.now();
      const cards: WordPair[] = [
        { dutch: "huis", english: "house" }, // New
        createTestWord("boom", "tree", now + 86400000), // Has SRS data, not new
      ];

      const newCards = getNewCards(cards, 10);

      expect(newCards).toHaveLength(1);
      expect(newCards[0].dutch).toBe("huis");
    });

    it("should include cards marked as new in SRS data", () => {
      const cards: WordPair[] = [
        {
          dutch: "huis",
          english: "house",
          srsData: { ...initializeSRSCard(), isNew: true },
        },
      ];

      const newCards = getNewCards(cards, 10);

      expect(newCards).toHaveLength(1);
    });
  });

  describe("getCardsByPriority", () => {
    it("should return due cards before new cards", () => {
      const now = Date.now();
      const cards: WordPair[] = [
        { dutch: "new1", english: "new1" },
        createTestWord("due1", "due1", now - 1000),
        { dutch: "new2", english: "new2" },
        createTestWord("due2", "due2", now - 2000),
      ];

      const prioritized = getCardsByPriority(cards, DEFAULT_SRS_CONFIG, 0, now);

      expect(prioritized.length).toBeGreaterThan(0);
      // First cards should be the due ones
      expect(["due1", "due2"]).toContain(prioritized[0].dutch);
    });

    it("should respect daily new card limit", () => {
      const cards: WordPair[] = Array.from({ length: 50 }, (_, i) => ({
        dutch: `word${i}`,
        english: `word${i}`,
      }));

      const config = { dailyNewCardLimit: 10 };
      const prioritized = getCardsByPriority(cards, config, 0);

      // Should have at most 10 new cards
      expect(prioritized.length).toBeLessThanOrEqual(10);
    });

    it("should reduce new cards based on cards already seen today", () => {
      const cards: WordPair[] = Array.from({ length: 30 }, (_, i) => ({
        dutch: `word${i}`,
        english: `word${i}`,
      }));

      const config = { dailyNewCardLimit: 20 };
      const prioritized = getCardsByPriority(cards, config, 15); // 15 already seen

      // Should have at most 5 new cards (20 - 15)
      expect(prioritized.length).toBeLessThanOrEqual(5);
    });

    it("should return no new cards if limit reached", () => {
      const cards: WordPair[] = [
        { dutch: "new1", english: "new1" },
        { dutch: "new2", english: "new2" },
      ];

      const config = { dailyNewCardLimit: 20 };
      const prioritized = getCardsByPriority(cards, config, 20); // Limit reached

      expect(prioritized).toHaveLength(0);
    });
  });

  describe("getUpcomingReviews", () => {
    it("should count cards due now", () => {
      const now = Date.now();
      const cards: WordPair[] = [
        createTestWord("word1", "word1", now - 1000),
        createTestWord("word2", "word2", now - 2000),
        createTestWord("word3", "word3", now + 86400000),
      ];

      const stats = getUpcomingReviews(cards, now);

      expect(stats.dueNow).toBe(2);
    });

    it("should count cards due today", () => {
      const now = Date.now();
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const cards: WordPair[] = [
        createTestWord("word1", "word1", now - 1000),
        createTestWord("word2", "word2", todayEnd.getTime() - 1000),
        createTestWord("word3", "word3", todayEnd.getTime() + 86400000),
      ];

      const stats = getUpcomingReviews(cards, now);

      expect(stats.dueToday).toBe(2);
    });

    it("should count new cards available", () => {
      const cards: WordPair[] = [
        { dutch: "new1", english: "new1" },
        { dutch: "new2", english: "new2" },
        createTestWord("old", "old", Date.now() + 86400000),
      ];

      const stats = getUpcomingReviews(cards);

      expect(stats.newCardsAvailable).toBe(2);
    });

    it("should count total cards", () => {
      const cards: WordPair[] = [
        { dutch: "word1", english: "word1" },
        { dutch: "word2", english: "word2" },
        createTestWord("word3", "word3", Date.now()),
      ];

      const stats = getUpcomingReviews(cards);

      expect(stats.totalCards).toBe(3);
    });
  });

  describe("initializeCardsWithSRS", () => {
    it("should initialize SRS data for cards without it", () => {
      const cards: WordPair[] = [
        { dutch: "huis", english: "house" },
        { dutch: "boom", english: "tree" },
      ];

      const initialized = initializeCardsWithSRS(cards);

      expect(initialized).toHaveLength(2);
      expect(initialized[0].srsData).toBeDefined();
      expect(initialized[0].srsData?.isNew).toBe(true);
      expect(initialized[1].srsData).toBeDefined();
    });

    it("should not overwrite existing SRS data", () => {
      const existingSRS = initializeSRSCard();
      existingSRS.interval = 10;
      existingSRS.repetitions = 3;

      const cards: WordPair[] = [
        { dutch: "huis", english: "house", srsData: existingSRS },
        { dutch: "boom", english: "tree" },
      ];

      const initialized = initializeCardsWithSRS(cards);

      expect(initialized[0].srsData?.interval).toBe(10);
      expect(initialized[0].srsData?.repetitions).toBe(3);
      expect(initialized[1].srsData?.interval).toBe(0);
    });
  });

  describe("getCardCategoryCounts", () => {
    it("should count cards by category", () => {
      const cards: WordPair[] = [
        { dutch: "new1", english: "new1" }, // New
        { dutch: "new2", english: "new2" }, // New
        {
          dutch: "learning",
          english: "learning",
          srsData: { ...initializeSRSCard(), isNew: false, interval: 0 },
        }, // Learning
        {
          dutch: "young",
          english: "young",
          srsData: { ...initializeSRSCard(), isNew: false, interval: 10 },
        }, // Young
        {
          dutch: "mature",
          english: "mature",
          srsData: { ...initializeSRSCard(), isNew: false, interval: 30 },
        }, // Mature
      ];

      const counts = getCardCategoryCounts(cards);

      expect(counts.new).toBe(2);
      expect(counts.learning).toBe(1);
      expect(counts.young).toBe(1);
      expect(counts.mature).toBe(1);
    });

    it("should handle empty card array", () => {
      const counts = getCardCategoryCounts([]);

      expect(counts.new).toBe(0);
      expect(counts.learning).toBe(0);
      expect(counts.young).toBe(0);
      expect(counts.mature).toBe(0);
    });
  });

  describe("getCardsByCategory", () => {
    it("should filter new cards", () => {
      const cards: WordPair[] = [
        { dutch: "new1", english: "new1" },
        createTestWord("old", "old", Date.now()),
      ];

      const newCards = getCardsByCategory(cards, "new");

      expect(newCards).toHaveLength(1);
      expect(newCards[0].dutch).toBe("new1");
    });

    it("should filter young cards", () => {
      const cards: WordPair[] = [
        { dutch: "new", english: "new" },
        {
          dutch: "young",
          english: "young",
          srsData: { ...initializeSRSCard(), isNew: false, interval: 10 },
        },
        {
          dutch: "mature",
          english: "mature",
          srsData: { ...initializeSRSCard(), isNew: false, interval: 30 },
        },
      ];

      const youngCards = getCardsByCategory(cards, "young");

      expect(youngCards).toHaveLength(1);
      expect(youngCards[0].dutch).toBe("young");
    });

    it("should filter mature cards", () => {
      const cards: WordPair[] = [
        {
          dutch: "young",
          english: "young",
          srsData: { ...initializeSRSCard(), isNew: false, interval: 10 },
        },
        {
          dutch: "mature1",
          english: "mature1",
          srsData: { ...initializeSRSCard(), isNew: false, interval: 30 },
        },
        {
          dutch: "mature2",
          english: "mature2",
          srsData: { ...initializeSRSCard(), isNew: false, interval: 60 },
        },
      ];

      const matureCards = getCardsByCategory(cards, "mature");

      expect(matureCards).toHaveLength(2);
    });
  });
});
