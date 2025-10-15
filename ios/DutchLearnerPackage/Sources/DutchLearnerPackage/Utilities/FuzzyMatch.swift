//
//  FuzzyMatch.swift
//  DutchLearner
//
//  Fuzzy string matching with Levenshtein distance for answer validation
//

import Foundation

public enum FuzzyMatch {
    /// Calculate Levenshtein distance between two strings
    private static func levenshteinDistance(_ str1: String, _ str2: String) -> Int {
        let s1 = Array(str1)
        let s2 = Array(str2)

        var matrix = Array(repeating: Array(repeating: 0, count: s1.count + 1), count: s2.count + 1)

        // Initialize first column and row
        for i in 0...s1.count {
            matrix[0][i] = i
        }

        for j in 0...s2.count {
            matrix[j][0] = j
        }

        // Fill matrix
        for j in 1...s2.count {
            for i in 1...s1.count {
                let indicator = s1[i - 1] == s2[j - 1] ? 0 : 1
                matrix[j][i] = min(
                    matrix[j][i - 1] + 1, // deletion
                    matrix[j - 1][i] + 1, // insertion
                    matrix[j - 1][i - 1] + indicator // substitution
                )
            }
        }

        return matrix[s2.count][s1.count]
    }

    /// Normalize string for comparison
    private static func normalize(_ str: String) -> String {
        return str
            .lowercased()
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "[^\\w\\s]", with: "", options: .regularExpression) // Remove punctuation
            .replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression) // Normalize whitespace
    }

    /// Check if two strings are similar enough
    /// - Parameters:
    ///   - userInput: User's input string
    ///   - correctAnswer: Expected correct answer
    ///   - threshold: Maximum number of character differences allowed (default 2)
    /// - Returns: True if strings match within threshold
    public static func fuzzyMatch(userInput: String, correctAnswer: String, threshold: Int = 2) -> Bool {
        guard !userInput.isEmpty, !correctAnswer.isEmpty else {
            return false
        }

        let normalizedInput = normalize(userInput)
        let normalizedAnswer = normalize(correctAnswer)

        // Exact match after normalization
        if normalizedInput == normalizedAnswer {
            return true
        }

        // Handle multiple correct answers separated by '/' or ','
        let separatorPattern = "[/,]"
        let possibleAnswers = normalizedAnswer
            .components(separatedBy: CharacterSet(charactersIn: "/,"))
            .map { $0.trimmingCharacters(in: .whitespaces) }

        for answer in possibleAnswers {
            if normalizedInput == answer {
                return true
            }

            // Check Levenshtein distance
            let distance = levenshteinDistance(normalizedInput, answer)
            let maxLength = max(normalizedInput.count, answer.count)

            // Allow up to threshold character differences, but not more than 30% of the word length
            if distance <= threshold && Double(distance) <= Double(maxLength) * 0.3 {
                return true
            }
        }

        return false
    }

    /// Get similarity score between 0 and 1
    /// - Parameters:
    ///   - str1: First string
    ///   - str2: Second string
    /// - Returns: Similarity score (1.0 = identical, 0.0 = completely different)
    public static func similarityScore(_ str1: String, _ str2: String) -> Double {
        let normalized1 = normalize(str1)
        let normalized2 = normalize(str2)

        let maxLength = max(normalized1.count, normalized2.count)
        if maxLength == 0 { return 1.0 }

        let distance = levenshteinDistance(normalized1, normalized2)
        return 1.0 - Double(distance) / Double(maxLength)
    }
}
