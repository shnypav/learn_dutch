import type { SRSCardData, SRSQuality, ReviewRecord } from "../types/srs";

/**
 * SM-2 Algorithm Implementation for Spaced Repetition
 * Based on SuperMemo 2 algorithm by Piotr Wozniak
 */

// Constants
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const GRADUATING_INTERVAL = 1; // First successful review: 1 day
const EASY_INTERVAL = 4; // "Easy" first review: 4 days
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Initialize SRS data for a new card
 */
export function initializeSRSCard(): SRSCardData {
  return {
    interval: 0,
    repetitions: 0,
    easeFactor: INITIAL_EASE_FACTOR,
    dueDate: Date.now(), // Due immediately
    lastReviewDate: null,
    reviewHistory: [],
    isNew: true,
  };
}

/**
 * Convert answer correctness and hints used to SM-2 quality rating (0-5)
 *
 * @param isCorrect - Whether the answer was correct
 * @param hintsUsed - Number of hints used (0 = no hints)
 * @returns SRSQuality rating (0-5)
 */
export function getQualityFromPerformance(
  isCorrect: boolean,
  hintsUsed: number = 0,
): SRSQuality {
  if (!isCorrect) {
    // Failed - quality 0-2 based on how many hints were used
    if (hintsUsed === 0) return 0; // Complete failure
    if (hintsUsed === 1) return 1; // Failed with one hint
    return 2; // Failed with multiple hints
  }

  // Correct answer - quality 3-5 based on hints
  if (hintsUsed >= 2) return 3; // Correct but with difficulty (multiple hints)
  if (hintsUsed === 1) return 4; // Correct with some hesitation (one hint)
  return 5; // Perfect recall (no hints)
}

/**
 * Calculate the next review interval and ease factor based on SM-2 algorithm
 *
 * @param cardData - Current SRS card data
 * @param quality - Quality rating (0-5)
 * @returns Updated SRS card data
 */
export function calculateNextReview(
  cardData: SRSCardData,
  quality: SRSQuality,
): SRSCardData {
  const now = Date.now();
  let { interval, repetitions, easeFactor } = cardData;

  // Update ease factor based on quality (SM-2 formula)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  let newInterval: number;
  let newRepetitions: number;

  // If quality < 3, the item needs to be reviewed again (failed)
  if (quality < 3) {
    // Reset to learning phase
    newInterval = 0;
    newRepetitions = 0;
  } else {
    // Successful review
    if (repetitions === 0) {
      // First successful review
      newInterval = GRADUATING_INTERVAL;
      newRepetitions = 1;
    } else if (repetitions === 1) {
      // Second successful review
      newInterval = 6;
      newRepetitions = 2;
    } else {
      // Subsequent reviews: interval = previous interval * ease factor
      newInterval = Math.round(interval * newEaseFactor);
      newRepetitions = repetitions + 1;
    }
  }

  // Calculate due date
  const dueDate = now + newInterval * MILLISECONDS_PER_DAY;

  // Create review record
  const reviewRecord: ReviewRecord = {
    date: now,
    quality,
    interval: newInterval,
  };

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    dueDate,
    lastReviewDate: now,
    reviewHistory: [...cardData.reviewHistory, reviewRecord],
    isNew: false,
  };
}

/**
 * Update SRS card data after a review
 *
 * @param cardData - Current SRS card data (or undefined for new card)
 * @param isCorrect - Whether the answer was correct
 * @param hintsUsed - Number of hints used
 * @returns Updated SRS card data
 */
export function updateSRSCard(
  cardData: SRSCardData | undefined,
  isCorrect: boolean,
  hintsUsed: number = 0,
): SRSCardData {
  // Initialize new card if needed
  const currentData = cardData || initializeSRSCard();

  // Convert performance to quality rating
  const quality = getQualityFromPerformance(isCorrect, hintsUsed);

  // Calculate next review
  return calculateNextReview(currentData, quality);
}

/**
 * Check if a card is due for review
 *
 * @param cardData - SRS card data
 * @param now - Current timestamp (defaults to Date.now())
 * @returns True if the card is due for review
 */
export function isCardDue(
  cardData: SRSCardData,
  now: number = Date.now(),
): boolean {
  return cardData.dueDate <= now;
}

/**
 * Get the number of days until the card is due
 *
 * @param cardData - SRS card data
 * @param now - Current timestamp (defaults to Date.now())
 * @returns Days until due (negative if overdue)
 */
export function getDaysUntilDue(
  cardData: SRSCardData,
  now: number = Date.now(),
): number {
  const millisUntilDue = cardData.dueDate - now;
  return Math.ceil(millisUntilDue / MILLISECONDS_PER_DAY);
}

/**
 * Categorize a card based on its interval
 *
 * @param cardData - SRS card data
 * @returns 'new' | 'learning' | 'young' | 'mature'
 */
export function getCardCategory(
  cardData: SRSCardData,
): "new" | "learning" | "young" | "mature" {
  if (cardData.isNew) return "new";
  if (cardData.interval === 0) return "learning";
  if (cardData.interval <= 21) return "young";
  return "mature";
}

/**
 * Calculate retention rate from review history
 *
 * @param reviewHistory - Array of review records
 * @returns Retention rate as a percentage (0-100)
 */
export function calculateRetentionRate(reviewHistory: ReviewRecord[]): number {
  if (reviewHistory.length === 0) return 100;

  const successfulReviews = reviewHistory.filter(
    (record) => record.quality >= 3,
  ).length;
  return Math.round((successfulReviews / reviewHistory.length) * 100);
}
