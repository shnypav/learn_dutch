//
//  VerbPair.swift
//  DutchLearner
//
//  Model for irregular verb conjugations
//

import Foundation

public struct VerbPair: Identifiable, Codable {
    public let id: UUID
    public let infinitive: String
    public let english: String
    public let present: String
    public let past: String
    public let perfect: String
    public let category: String?

    // SRS data for each tense
    public var presentSRS: SRSCardData
    public var pastSRS: SRSCardData
    public var perfectSRS: SRSCardData

    public init(
        id: UUID = UUID(),
        infinitive: String,
        english: String,
        present: String,
        past: String,
        perfect: String,
        category: String? = nil
    ) {
        self.id = id
        self.infinitive = infinitive
        self.english = english
        self.present = present
        self.past = past
        self.perfect = perfect
        self.category = category
        self.presentSRS = SRSCardData()
        self.pastSRS = SRSCardData()
        self.perfectSRS = SRSCardData()
    }

    public enum Tense: String, CaseIterable, Codable {
        case present = "Present"
        case past = "Past"
        case perfect = "Perfect"

        public var displayName: String { rawValue }
    }

    public func conjugation(for tense: Tense) -> String {
        switch tense {
        case .present: return present
        case .past: return past
        case .perfect: return perfect
        }
    }

    public mutating func updateSRS(for tense: Tense, data: SRSCardData) {
        switch tense {
        case .present: presentSRS = data
        case .past: pastSRS = data
        case .perfect: perfectSRS = data
        }
    }

    public func getSRS(for tense: Tense) -> SRSCardData {
        switch tense {
        case .present: return presentSRS
        case .past: return pastSRS
        case .perfect: return perfectSRS
        }
    }
}

public extension VerbPair {
    /// Creates a VerbPair from CSV row data
    static func from(csvRow: [String: String]) -> VerbPair? {
        // CSV headers: english_infinitive,dutch_infinitive,imperfectum_single,imperfectum_plural,perfectum
        guard let dutchInfinitive = csvRow["dutch_infinitive"],
              let englishInfinitive = csvRow["english_infinitive"],
              let imperfectumSingle = csvRow["imperfectum_single"],
              let imperfectumPlural = csvRow["imperfectum_plural"],
              let perfectum = csvRow["perfectum"],
              !dutchInfinitive.isEmpty else {
            return nil
        }

        return VerbPair(
            infinitive: dutchInfinitive,
            english: englishInfinitive,
            present: dutchInfinitive, // Present tense is the infinitive in Dutch
            past: imperfectumSingle, // Using singular form for past
            perfect: perfectum,
            category: csvRow["category"]
        )
    }
}
