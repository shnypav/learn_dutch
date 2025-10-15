//
//  SRSAlgorithm.swift
//  DutchLearner
//
//  SM-2 Algorithm Implementation for Spaced Repetition
//  Based on SuperMemo 2 algorithm by Piotr Wozniak
//

import Foundation

public enum SRSAlgorithm {
    // Constants
    public static let initialEaseFactor: Double = 2.5
    public static let minEaseFactor: Double = 1.3
    public static let graduatingInterval: Int = 1 // First successful review: 1 day
    public static let easyInterval: Int = 4 // "Easy" first review: 4 days
    public static let secondInterval: Int = 6 // Second successful review: 6 days

    /// Initialize SRS data for a new card
    public static func initializeCard() -> SRSCardData {
        return SRSCardData(
            interval: 0,
            repetitions: 0,
            easeFactor: initialEaseFactor,
            dueDate: Date(), // Due immediately
            lastReviewDate: nil,
            reviewHistory: [],
            isNew: true
        )
    }

    /// Convert answer correctness and hints used to SM-2 quality rating (0-5)
    /// - Parameters:
    ///   - isCorrect: Whether the answer was correct
    ///   - hintsUsed: Number of hints used (0 = no hints)
    /// - Returns: SRSQuality rating
    public static func getQuality(isCorrect: Bool, hintsUsed: Int = 0) -> SRSQuality {
        if !isCorrect {
            // Failed - quality 0-2 based on how many hints were used
            if hintsUsed == 0 { return .totalBlackout } // Complete failure
            if hintsUsed == 1 { return .incorrectButRemembered } // Failed with one hint
            return .incorrectButEasyRecall // Failed with multiple hints
        }

        // Correct answer - quality 3-5 based on hints
        if hintsUsed >= 2 { return .correctWithDifficulty } // Correct but with difficulty (multiple hints)
        if hintsUsed == 1 { return .correctWithHesitation } // Correct with some hesitation (one hint)
        return .perfectRecall // Perfect recall (no hints)
    }

    /// Calculate the next review interval and ease factor based on SM-2 algorithm
    /// - Parameters:
    ///   - cardData: Current SRS card data
    ///   - quality: Quality rating (0-5)
    /// - Returns: Updated SRS card data
    public static func calculateNextReview(cardData: SRSCardData, quality: SRSQuality) -> SRSCardData {
        let now = Date()
        var interval = cardData.interval
        var repetitions = cardData.repetitions
        var easeFactor = cardData.easeFactor

        // Update ease factor based on quality (SM-2 formula)
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        let q = Double(quality.rawValue)
        let newEaseFactor = max(
            minEaseFactor,
            easeFactor + (0.1 - (5.0 - q) * (0.08 + (5.0 - q) * 0.02))
        )

        let newInterval: Int
        let newRepetitions: Int

        // If quality < 3, the item needs to be reviewed again (failed)
        if !quality.isPassing {
            // Reset to learning phase
            newInterval = 0
            newRepetitions = 0
        } else {
            // Successful review
            if repetitions == 0 {
                // First successful review
                newInterval = graduatingInterval
                newRepetitions = 1
            } else if repetitions == 1 {
                // Second successful review
                newInterval = secondInterval
                newRepetitions = 2
            } else {
                // Subsequent reviews: interval = previous interval * ease factor
                newInterval = Int(round(Double(interval) * newEaseFactor))
                newRepetitions = repetitions + 1
            }
        }

        // Calculate due date
        let dueDate = Calendar.current.date(byAdding: .day, value: newInterval, to: now) ?? now

        // Create review record
        let reviewRecord = ReviewRecord(
            date: now,
            quality: quality,
            interval: newInterval
        )

        var newReviewHistory = cardData.reviewHistory
        newReviewHistory.append(reviewRecord)

        return SRSCardData(
            interval: newInterval,
            repetitions: newRepetitions,
            easeFactor: newEaseFactor,
            dueDate: dueDate,
            lastReviewDate: now,
            reviewHistory: newReviewHistory,
            isNew: false
        )
    }

    /// Update SRS card data after a review
    /// - Parameters:
    ///   - cardData: Current SRS card data (or nil for new card)
    ///   - isCorrect: Whether the answer was correct
    ///   - hintsUsed: Number of hints used
    /// - Returns: Updated SRS card data
    public static func updateCard(cardData: SRSCardData?, isCorrect: Bool, hintsUsed: Int = 0) -> SRSCardData {
        // Initialize new card if needed
        let currentData = cardData ?? initializeCard()

        // Convert performance to quality rating
        let quality = getQuality(isCorrect: isCorrect, hintsUsed: hintsUsed)

        // Calculate next review
        return calculateNextReview(cardData: currentData, quality: quality)
    }

    /// Check if a card is due for review
    public static func isCardDue(_ cardData: SRSCardData, now: Date = Date()) -> Bool {
        return cardData.dueDate <= now
    }

    /// Get the number of days until the card is due
    public static func daysUntilDue(_ cardData: SRSCardData, now: Date = Date()) -> Int {
        let components = Calendar.current.dateComponents([.day], from: now, to: cardData.dueDate)
        return components.day ?? 0
    }

    /// Categorize a card based on its interval
    public static func getCardCategory(_ cardData: SRSCardData) -> CardCategory {
        if cardData.isNew { return .new }
        if cardData.interval == 0 { return .learning }
        if cardData.interval <= 21 { return .young }
        return .mature
    }

    /// Calculate retention rate from review history
    public static func calculateRetentionRate(_ reviewHistory: [ReviewRecord]) -> Double {
        guard !reviewHistory.isEmpty else { return 100.0 }

        let successfulReviews = reviewHistory.filter { $0.quality.isPassing }.count
        return (Double(successfulReviews) / Double(reviewHistory.count)) * 100.0
    }
}

public enum CardCategory {
    case new
    case learning
    case young
    case mature

    public var displayName: String {
        switch self {
        case .new: return "New"
        case .learning: return "Learning"
        case .young: return "Young"
        case .mature: return "Mature"
        }
    }
}
