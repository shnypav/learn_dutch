//
//  StorageManager.swift
//  DutchLearner
//
//  Local storage management using UserDefaults
//

import Foundation

public class StorageManager: @unchecked Sendable {
    public static let shared = StorageManager()

    private let defaults = UserDefaults.standard
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    // Storage keys
    private enum Keys {
        static let userProgress = "userProgress"
        static let words = "words"
        static let verbs = "verbs"
        static let currentTheme = "currentTheme"
        static let customTheme = "customTheme"
        static let perplexityAPIKey = "perplexityAPIKey"
    }

    private init() {
        encoder.dateEncodingStrategy = .iso8601
        decoder.dateDecodingStrategy = .iso8601
    }

    // MARK: - User Progress

    public func saveUserProgress(_ progress: UserProgress) {
        if let data = try? encoder.encode(progress) {
            defaults.set(data, forKey: Keys.userProgress)
        }
    }

    public func loadUserProgress() -> UserProgress {
        guard let data = defaults.data(forKey: Keys.userProgress),
              let progress = try? decoder.decode(UserProgress.self, from: data) else {
            return UserProgress()
        }
        return progress
    }

    // MARK: - Words

    public func saveWords(_ words: [WordPair]) {
        if let data = try? encoder.encode(words) {
            defaults.set(data, forKey: Keys.words)
        }
    }

    public func loadWords() -> [WordPair]? {
        guard let data = defaults.data(forKey: Keys.words),
              let words = try? decoder.decode([WordPair].self, from: data) else {
            return nil
        }
        return words
    }

    // MARK: - Verbs

    public func saveVerbs(_ verbs: [VerbPair]) {
        if let data = try? encoder.encode(verbs) {
            defaults.set(data, forKey: Keys.verbs)
        }
    }

    public func loadVerbs() -> [VerbPair]? {
        guard let data = defaults.data(forKey: Keys.verbs),
              let verbs = try? decoder.decode([VerbPair].self, from: data) else {
            return nil
        }
        return verbs
    }

    // MARK: - Theme

    public func saveTheme(_ theme: AppTheme) {
        defaults.set(theme.rawValue, forKey: Keys.currentTheme)
    }

    public func loadTheme() -> AppTheme {
        guard let themeString = defaults.string(forKey: Keys.currentTheme),
              let theme = AppTheme(rawValue: themeString) else {
            return .defaultTheme
        }
        return theme
    }

    public func saveCustomTheme(_ colors: ThemeColors) {
        if let data = try? encoder.encode(colors) {
            defaults.set(data, forKey: Keys.customTheme)
        }
    }

    public func loadCustomTheme() -> ThemeColors? {
        guard let data = defaults.data(forKey: Keys.customTheme),
              let colors = try? decoder.decode(ThemeColors.self, from: data) else {
            return nil
        }
        return colors
    }

    // MARK: - API Key

    public func savePerplexityAPIKey(_ key: String) {
        defaults.set(key, forKey: Keys.perplexityAPIKey)
    }

    public func loadPerplexityAPIKey() -> String? {
        return defaults.string(forKey: Keys.perplexityAPIKey)
    }

    // MARK: - Clear Data

    public func clearAllData() {
        defaults.removeObject(forKey: Keys.userProgress)
        defaults.removeObject(forKey: Keys.words)
        defaults.removeObject(forKey: Keys.verbs)
        // Don't clear theme and API key
    }

    public func resetProgress() {
        defaults.removeObject(forKey: Keys.userProgress)
        // Reset SRS data in words and verbs
        if var words = loadWords() {
            for i in 0..<words.count {
                words[i].srsData = SRSCardData()
            }
            saveWords(words)
        }
        if var verbs = loadVerbs() {
            for i in 0..<verbs.count {
                verbs[i].presentSRS = SRSCardData()
                verbs[i].pastSRS = SRSCardData()
                verbs[i].perfectSRS = SRSCardData()
            }
            saveVerbs(verbs)
        }
    }
}
