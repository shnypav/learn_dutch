//
//  UserProgress.swift
//  DutchLearner
//
//  User progress and statistics tracking
//

import Foundation

public struct UserProgress: Codable {
    public var correctAnswers: Int
    public var totalAnswers: Int
    public var currentStreak: Int
    public var bestStreak: Int
    public var wordsLearned: Int
    public var lastSessionDate: Date?

    // Hint-related statistics
    public var totalHintsUsed: Int
    public var questionsWithHints: Int
    public var hintsPerSession: [Int]

    // SRS-related statistics
    public var cardsReviewedToday: Int
    public var newCardsToday: Int
    public var matureCards: Int // Cards with interval > 21 days
    public var youngCards: Int // Cards with interval 1-21 days
    public var learningCards: Int // Cards in initial learning phase
    public var lastReviewDate: Date?

    public init() {
        self.correctAnswers = 0
        self.totalAnswers = 0
        self.currentStreak = 0
        self.bestStreak = 0
        self.wordsLearned = 0
        self.lastSessionDate = nil
        self.totalHintsUsed = 0
        self.questionsWithHints = 0
        self.hintsPerSession = []
        self.cardsReviewedToday = 0
        self.newCardsToday = 0
        self.matureCards = 0
        self.youngCards = 0
        self.learningCards = 0
        self.lastReviewDate = nil
    }

    public var accuracy: Double {
        guard totalAnswers > 0 else { return 0 }
        return Double(correctAnswers) / Double(totalAnswers)
    }

    public var averageHintsPerQuestion: Double {
        guard totalAnswers > 0 else { return 0 }
        return Double(totalHintsUsed) / Double(totalAnswers)
    }

    public mutating func recordAnswer(correct: Bool, usedHint: Bool) {
        totalAnswers += 1
        if correct {
            correctAnswers += 1
            currentStreak += 1
            if currentStreak > bestStreak {
                bestStreak = currentStreak
            }
        } else {
            currentStreak = 0
        }

        if usedHint {
            totalHintsUsed += 1
            questionsWithHints += 1
        }

        lastSessionDate = Date()
    }

    public mutating func resetDailyStats() {
        cardsReviewedToday = 0
        newCardsToday = 0
    }

    public func needsDailyReset() -> Bool {
        guard let lastReview = lastReviewDate else { return true }
        return !Calendar.current.isDateInToday(lastReview)
    }
}

public struct SessionStats: Codable {
    public var correct: Int
    public var incorrect: Int
    public var hintsUsed: Int
    public var cardsReviewed: Int
    public var newCards: Int
    public var startTime: Date
    public var endTime: Date?

    public init(startTime: Date = Date()) {
        self.correct = 0
        self.incorrect = 0
        self.hintsUsed = 0
        self.cardsReviewed = 0
        self.newCards = 0
        self.startTime = startTime
        self.endTime = nil
    }

    public var duration: TimeInterval? {
        guard let end = endTime else { return nil }
        return end.timeIntervalSince(startTime)
    }

    public var total: Int {
        return correct + incorrect
    }

    public var accuracy: Double {
        guard total > 0 else { return 0 }
        return Double(correct) / Double(total)
    }
}
