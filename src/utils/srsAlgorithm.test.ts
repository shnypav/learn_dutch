import { describe, it, expect } from "vitest";
import {
  initializeSRSCard,
  getQualityFromPerformance,
  calculateNextReview,
  updateSRSCard,
  isCardDue,
  getDaysUntilDue,
  getCardCategory,
  calculateRetentionRate,
} from "./srsAlgorithm";
import type { SRSCardData } from "../types/srs";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe("srsAlgorithm", () => {
  describe("initializeSRSCard", () => {
    it("creates a new card that is due immediately", () => {
      const card = initializeSRSCard();
      expect(card.interval).toBe(0);
      expect(card.repetitions).toBe(0);
      expect(card.easeFactor).toBe(2.5);
      expect(card.isNew).toBe(true);
      expect(card.reviewHistory).toEqual([]);
      expect(isCardDue(card, card.dueDate)).toBe(true);
    });
  });

  describe("getQualityFromPerformance", () => {
    it("maps correct answers to quality 3-5 depending on hints", () => {
      expect(getQualityFromPerformance(true, 0)).toBe(5);
      expect(getQualityFromPerformance(true, 1)).toBe(4);
      expect(getQualityFromPerformance(true, 2)).toBe(3);
      expect(getQualityFromPerformance(true, 5)).toBe(3);
    });

    it("maps incorrect answers to quality 0-2 depending on hints", () => {
      expect(getQualityFromPerformance(false, 0)).toBe(0);
      expect(getQualityFromPerformance(false, 1)).toBe(1);
      expect(getQualityFromPerformance(false, 3)).toBe(2);
    });
  });

  describe("calculateNextReview", () => {
    it("graduates a new card through the standard SM-2 interval progression", () => {
      // First successful review -> 1 day
      const first = calculateNextReview(initializeSRSCard(), 5);
      expect(first.interval).toBe(1);
      expect(first.repetitions).toBe(1);
      expect(first.isNew).toBe(false);

      // Second successful review -> 6 days
      const second = calculateNextReview(first, 5);
      expect(second.interval).toBe(6);
      expect(second.repetitions).toBe(2);

      // Third successful review -> round(6 * easeFactor)
      const third = calculateNextReview(second, 5);
      expect(third.interval).toBe(Math.round(6 * third.easeFactor));
      expect(third.repetitions).toBe(3);
      expect(third.interval).toBeGreaterThan(6);
    });

    it("resets interval and repetitions on a failing quality (<3)", () => {
      // Build up a mature-ish card first.
      const graduated = calculateNextReview(
        calculateNextReview(initializeSRSCard(), 5),
        5,
      );
      expect(graduated.interval).toBe(6);
      expect(graduated.repetitions).toBe(2);

      const failed = calculateNextReview(graduated, 0);
      expect(failed.interval).toBe(0);
      expect(failed.repetitions).toBe(0);
      // Ease factor drops but never below the 1.3 floor.
      expect(failed.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(failed.easeFactor).toBeLessThan(graduated.easeFactor);
    });

    it("never lets the ease factor fall below the 1.3 minimum", () => {
      let card = initializeSRSCard();
      // Repeatedly fail with the worst quality to drive ease factor down.
      for (let i = 0; i < 10; i++) {
        card = calculateNextReview(card, 0);
      }
      expect(card.easeFactor).toBe(1.3);
    });

    it("sets the due date based on the computed interval and appends history", () => {
      const before = Date.now();
      const card = calculateNextReview(initializeSRSCard(), 5);
      const after = Date.now();

      // dueDate should be ~interval days from now.
      expect(card.dueDate).toBeGreaterThanOrEqual(before + card.interval * MS_PER_DAY);
      expect(card.dueDate).toBeLessThanOrEqual(after + card.interval * MS_PER_DAY);

      expect(card.reviewHistory).toHaveLength(1);
      expect(card.reviewHistory[0].quality).toBe(5);
      expect(card.reviewHistory[0].interval).toBe(card.interval);
      expect(card.lastReviewDate).not.toBeNull();
    });
  });

  describe("updateSRSCard", () => {
    it("initializes a card when none is provided and applies the review", () => {
      const card = updateSRSCard(undefined, true, 0);
      expect(card.isNew).toBe(false);
      expect(card.interval).toBe(1);
      expect(card.reviewHistory).toHaveLength(1);
    });

    it("treats a correct-with-hints answer as a passing review", () => {
      const card = updateSRSCard(undefined, true, 1);
      // quality 4 is a pass, so the card graduates to 1 day.
      expect(card.interval).toBe(1);
      expect(card.repetitions).toBe(1);
    });
  });

  describe("isCardDue / getDaysUntilDue", () => {
    it("reports due status relative to the provided timestamp", () => {
      const now = 1_000_000_000_000;
      const dueCard: SRSCardData = { ...initializeSRSCard(), dueDate: now - MS_PER_DAY };
      const futureCard: SRSCardData = { ...initializeSRSCard(), dueDate: now + MS_PER_DAY };

      expect(isCardDue(dueCard, now)).toBe(true);
      expect(isCardDue(futureCard, now)).toBe(false);
      expect(getDaysUntilDue(dueCard, now)).toBe(-1);
      expect(getDaysUntilDue(futureCard, now)).toBe(1);
    });
  });

  describe("getCardCategory", () => {
    it("categorizes cards by novelty and interval", () => {
      expect(getCardCategory({ ...initializeSRSCard(), isNew: true })).toBe("new");
      expect(getCardCategory({ ...initializeSRSCard(), isNew: false, interval: 0 })).toBe(
        "learning",
      );
      expect(getCardCategory({ ...initializeSRSCard(), isNew: false, interval: 10 })).toBe(
        "young",
      );
      expect(getCardCategory({ ...initializeSRSCard(), isNew: false, interval: 21 })).toBe(
        "young",
      );
      expect(getCardCategory({ ...initializeSRSCard(), isNew: false, interval: 22 })).toBe(
        "mature",
      );
    });
  });

  describe("calculateRetentionRate", () => {
    it("returns 100 for an empty history", () => {
      expect(calculateRetentionRate([])).toBe(100);
    });

    it("computes the percentage of passing reviews (quality >= 3)", () => {
      const rate = calculateRetentionRate([
        { date: 1, quality: 5, interval: 1 },
        { date: 2, quality: 3, interval: 6 },
        { date: 3, quality: 1, interval: 0 },
        { date: 4, quality: 0, interval: 0 },
      ]);
      expect(rate).toBe(50);
    });
  });
});
