//
//  WordPair.swift
//  DutchLearner
//
//  Model for vocabulary word pairs with SRS data
//

import Foundation

public struct WordPair: Identifiable, Codable {
    public let id: UUID
    public let dutch: String
    public let english: String
    public let category: String?
    public let difficulty: String?

    // SRS data
    public var srsData: SRSCardData

    public init(
        id: UUID = UUID(),
        dutch: String,
        english: String,
        category: String? = nil,
        difficulty: String? = nil,
        srsData: SRSCardData = SRSCardData()
    ) {
        self.id = id
        self.dutch = dutch
        self.english = english
        self.category = category
        self.difficulty = difficulty
        self.srsData = srsData
    }
}

public extension WordPair {
    /// Creates a WordPair from CSV row data
    static func from(csvRow: [String: String]) -> WordPair? {
        // CSV headers: Dutch,English,Known
        guard let dutch = csvRow["Dutch"],
              let english = csvRow["English"],
              !dutch.isEmpty,
              !english.isEmpty else {
            return nil
        }

        return WordPair(
            dutch: dutch,
            english: english,
            category: csvRow["category"],
            difficulty: csvRow["difficulty"]
        )
    }
}
