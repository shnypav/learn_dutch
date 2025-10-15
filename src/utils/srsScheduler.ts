import type { WordPair, VerbPair } from "../types";
import type { SRSCardData } from "../types/srs";
import { isCardDue, getCardCategory, initializeSRSCard } from "./srsAlgorithm";

/**
 * SRS Scheduler Configuration
 */
export interface SRSConfig {
  dailyNewCardLimit: number; // Maximum new cards per day
  maxReviewsPerSession?: number; // Optional limit on reviews per session
}

// Default configuration
export const DEFAULT_SRS_CONFIG: SRSConfig = {
  dailyNewCardLimit: 20,
  maxReviewsPerSession: undefined, // No limit by default
};

/**
 * Statistics about upcoming reviews
 */
export interface UpcomingReviews {
  dueNow: number;
  dueToday: number;
  dueThisWeek: number;
  newCardsAvailable: number;
  totalCards: number;
}

/**
 * Card with SRS data and priority
 */
interface CardWithPriority<T> {
  card: T;
  priority: number; // Lower is higher priority
  isDue: boolean;
  isNew: boolean;
}

/**
 * Get cards that are due for review
 *
 * @param cards - Array of word or verb cards
 * @param now - Current timestamp
 * @returns Cards that are due for review, sorted by due date (oldest first)
 */
export function getDueCards<T extends WordPair | VerbPair>(
  cards: T[],
  now: number = Date.now(),
): T[] {
  return cards
    .filter((card) => {
      if (!card.srsData) return false;
      return isCardDue(card.srsData, now);
    })
    .sort((a, b) => {
      // Sort by due date, oldest first (cards that are most overdue)
      const aData = a.srsData!;
      const bData = b.srsData!;
      return aData.dueDate - bData.dueDate;
    });
}

/**
 * Get new cards that haven't been reviewed yet
 *
 * @param cards - Array of word or verb cards
 * @param limit - Maximum number of new cards to return
 * @returns New cards, shuffled randomly
 */
export function getNewCards<T extends WordPair | VerbPair>(
  cards: T[],
  limit: number = DEFAULT_SRS_CONFIG.dailyNewCardLimit,
): T[] {
  // Get cards that are new (no SRS data or isNew=true)
  const newCards = cards.filter((card) => {
    if (!card.srsData) return true;
    return card.srsData.isNew;
  });

  // Shuffle new cards
  const shuffled = [...newCards].sort(() => Math.random() - 0.5);

  // Return limited number
  return shuffled.slice(0, limit);
}

/**
 * Get cards sorted by priority (due cards first, then new cards)
 *
 * @param cards - Array of word or verb cards
 * @param config - SRS configuration
 * @param newCardsSeenToday - Number of new cards already seen today
 * @param now - Current timestamp
 * @returns Cards sorted by priority
 */
export function getCardsByPriority<T extends WordPair | VerbPair>(
  cards: T[],
  config: SRSConfig = DEFAULT_SRS_CONFIG,
  newCardsSeenToday: number = 0,
  now: number = Date.now(),
): T[] {
  // Filter out known words first
  const unknownCards = cards.filter((card) => !card.known);

  // Get due cards
  const dueCards = getDueCards(unknownCards, now);

  // Calculate how many new cards we can show
  const newCardsRemaining = Math.max(
    0,
    config.dailyNewCardLimit - newCardsSeenToday,
  );

  // Get new cards
  const newCards = getNewCards(unknownCards, newCardsRemaining);

  // Combine and return (due cards first, then new cards)
  const result = [...dueCards, ...newCards];

  // Apply session limit if configured
  if (config.maxReviewsPerSession !== undefined) {
    return result.slice(0, config.maxReviewsPerSession);
  }

  return result;
}

/**
 * Get statistics about upcoming reviews
 *
 * @param cards - Array of word or verb cards
 * @param now - Current timestamp
 * @returns Statistics about upcoming reviews
 */
export function getUpcomingReviews<T extends WordPair | VerbPair>(
  cards: T[],
  now: number = Date.now(),
): UpcomingReviews {
  const nowDate = new Date(now);
  const todayEnd = new Date(nowDate);
  todayEnd.setHours(23, 59, 59, 999);

  const weekEnd = new Date(nowDate);
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);

  let dueNow = 0;
  let dueToday = 0;
  let dueThisWeek = 0;
  let newCardsAvailable = 0;

  cards.forEach((card) => {
    if (!card.srsData) {
      newCardsAvailable++;
      return;
    }

    if (card.srsData.isNew) {
      newCardsAvailable++;
      return;
    }

    const dueDate = card.srsData.dueDate;

    if (dueDate <= now) {
      dueNow++;
      dueToday++;
      dueThisWeek++;
    } else if (dueDate <= todayEnd.getTime()) {
      dueToday++;
      dueThisWeek++;
    } else if (dueDate <= weekEnd.getTime()) {
      dueThisWeek++;
    }
  });

  return {
    dueNow,
    dueToday,
    dueThisWeek,
    newCardsAvailable,
    totalCards: cards.length,
  };
}

/**
 * Initialize SRS data for cards that don't have it
 * This is useful for migrating existing users
 *
 * @param cards - Array of word or verb cards
 * @returns Cards with SRS data initialized
 */
export function initializeCardsWithSRS<T extends WordPair | VerbPair>(
  cards: T[],
): T[] {
  return cards.map((card) => {
    if (!card.srsData) {
      return {
        ...card,
        srsData: initializeSRSCard(),
      };
    }
    return card;
  });
}

/**
 * Get category counts for cards (new, learning, young, mature)
 *
 * @param cards - Array of word or verb cards
 * @returns Object with counts for each category
 */
export function getCardCategoryCounts<T extends WordPair | VerbPair>(
  cards: T[],
): {
  new: number;
  learning: number;
  young: number;
  mature: number;
} {
  const counts = { new: 0, learning: 0, young: 0, mature: 0 };

  cards.forEach((card) => {
    if (!card.srsData) {
      counts.new++;
      return;
    }

    const category = getCardCategory(card.srsData);
    counts[category]++;
  });

  return counts;
}

/**
 * Filter cards to get only those in a specific category
 *
 * @param cards - Array of word or verb cards
 * @param category - Category to filter by
 * @returns Cards in the specified category
 */
export function getCardsByCategory<T extends WordPair | VerbPair>(
  cards: T[],
  category: "new" | "learning" | "young" | "mature",
): T[] {
  return cards.filter((card) => {
    if (!card.srsData) return category === "new";
    return getCardCategory(card.srsData) === category;
  });
}
