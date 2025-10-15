//
//  SRSCardData.swift
//  DutchLearner
//
//  Spaced Repetition System (SRS) data model using SM-2 algorithm
//

import Foundation

/// SM-2 quality rating (0-5)
/// 0-2: Failed, needs review
/// 3: Passed with difficulty
/// 4: Passed with some hesitation
/// 5: Perfect recall
public enum SRSQuality: Int, Codable {
    case totalBlackout = 0
    case incorrectButRemembered = 1
    case incorrectButEasyRecall = 2
    case correctWithDifficulty = 3
    case correctWithHesitation = 4
    case perfectRecall = 5

    public var isPassing: Bool {
        return rawValue >= 3
    }
}

public struct ReviewRecord: Codable {
    public let date: Date
    public let quality: SRSQuality
    public let interval: Int // days

    public init(date: Date, quality: SRSQuality, interval: Int) {
        self.date = date
        self.quality = quality
        self.interval = interval
    }
}

public struct SRSCardData: Codable {
    public var interval: Int // Days until next review
    public var repetitions: Int // Number of successful reviews
    public var easeFactor: Double // Difficulty multiplier (starts at 2.5, min 1.3)
    public var dueDate: Date // Next review date
    public var lastReviewDate: Date? // Last review date
    public var reviewHistory: [ReviewRecord] // Past reviews with quality ratings
    public var isNew: Bool // True if card has never been reviewed

    public init(
        interval: Int = 0,
        repetitions: Int = 0,
        easeFactor: Double = 2.5,
        dueDate: Date = Date(),
        lastReviewDate: Date? = nil,
        reviewHistory: [ReviewRecord] = [],
        isNew: Bool = true
    ) {
        self.interval = interval
        self.repetitions = repetitions
        self.easeFactor = easeFactor
        self.dueDate = dueDate
        self.lastReviewDate = lastReviewDate
        self.reviewHistory = reviewHistory
        self.isNew = isNew
    }
}

public extension SRSCardData {
    /// Check if card is due for review
    var isDue: Bool {
        return Date() >= dueDate
    }

    /// Days until next review (negative if overdue)
    var daysUntilDue: Int {
        let components = Calendar.current.dateComponents([.day], from: Date(), to: dueDate)
        return components.day ?? 0
    }

    /// Is overdue for review
    var isOverdue: Bool {
        return daysUntilDue < 0
    }
}
