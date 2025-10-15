//
//  LearningViewModel.swift
//  DutchLearner
//
//  Main view model for learning interface and game state
//

import Foundation
import Combine

public enum ContentType: String, CaseIterable {
    case words = "Words"
    case verbs = "Verbs"
}

public enum LanguageDirection: String, CaseIterable {
    case dutchToEnglish = "NL → EN"
    case englishToDutch = "EN → NL"
}

@MainActor
public class LearningViewModel: ObservableObject {
    @Published public var words: [WordPair] = []
    @Published public var verbs: [VerbPair] = []
    @Published public var progress: UserProgress = UserProgress()

    @Published public var contentType: ContentType = .words
    @Published public var languageDirection: LanguageDirection = .dutchToEnglish
    @Published public var verbTense: VerbPair.Tense?

    @Published public var currentCard: Any? // WordPair or VerbPair
    @Published public var userInput: String = ""
    @Published public var feedbackMessage: String = ""
    @Published public var showFeedback: Bool = false
    @Published public var isCorrect: Bool = false

    @Published public var hintsUsed: Int = 0
    @Published public var currentHintLevel: Int = 0

    @Published public var sessionStats: SessionStats = SessionStats()
    @Published public var isLoading: Bool = true

    private let storage = StorageManager.shared

    public init() {
        Task {
            await loadData()
        }
    }

    // MARK: - Data Loading

    public func loadData() async {
        isLoading = true

        // Try to load from storage first
        if let savedWords = storage.loadWords() {
            words = savedWords
        } else {
            // Load from CSV
            if let csvWords = try? CSVParser.loadWords() {
                words = csvWords
                storage.saveWords(words)
            }
        }

        if let savedVerbs = storage.loadVerbs() {
            verbs = savedVerbs
        } else {
            // Load from CSV
            if let csvVerbs = try? CSVParser.loadVerbs() {
                verbs = csvVerbs
                storage.saveVerbs(verbs)
            }
        }

        progress = storage.loadUserProgress()

        // Check if daily reset is needed
        if progress.needsDailyReset() {
            progress.resetDailyStats()
            storage.saveUserProgress(progress)
        }

        isLoading = false

        // Load first card
        nextCard()
    }

    // MARK: - Card Management

    public func nextCard() {
        currentCard = nil
        userInput = ""
        feedbackMessage = ""
        showFeedback = false
        hintsUsed = 0
        currentHintLevel = 0

        // Get next due card
        switch contentType {
        case .words:
            currentCard = getDueWordCard()
        case .verbs:
            currentCard = getDueVerbCard()
        }
    }

    private func getDueWordCard() -> WordPair? {
        // Get due cards
        let dueCards = words.filter { SRSAlgorithm.isCardDue($0.srsData) }

        // If no due cards, get a random new one
        if dueCards.isEmpty {
            return words.randomElement()
        }

        // Prioritize new cards, then overdue, then due
        let newCards = dueCards.filter { $0.srsData.isNew }
        if !newCards.isEmpty {
            return newCards.randomElement()
        }

        let overdueCards = dueCards.filter { $0.srsData.isOverdue }
        if !overdueCards.isEmpty {
            return overdueCards.randomElement()
        }

        return dueCards.randomElement()
    }

    private func getDueVerbCard() -> VerbPair? {
        // Similar logic for verbs
        let dueVerbs = verbs.filter { verb in
            if let tense = verbTense {
                return SRSAlgorithm.isCardDue(verb.getSRS(for: tense))
            } else {
                // Random tense mode: check any tense
                return SRSAlgorithm.isCardDue(verb.presentSRS) ||
                       SRSAlgorithm.isCardDue(verb.pastSRS) ||
                       SRSAlgorithm.isCardDue(verb.perfectSRS)
            }
        }

        if dueVerbs.isEmpty {
            return verbs.randomElement()
        }

        let newVerbs = dueVerbs.filter { verb in
            if let tense = verbTense {
                return verb.getSRS(for: tense).isNew
            } else {
                return verb.presentSRS.isNew || verb.pastSRS.isNew || verb.perfectSRS.isNew
            }
        }

        if !newVerbs.isEmpty {
            return newVerbs.randomElement()
        }

        return dueVerbs.randomElement()
    }

    // MARK: - Answer Checking

    public func checkAnswer() {
        guard let card = currentCard else { return }

        let correctAnswer: String
        let actualTense: VerbPair.Tense?

        if let wordCard = card as? WordPair {
            correctAnswer = languageDirection == .dutchToEnglish ? wordCard.english : wordCard.dutch
            actualTense = nil
        } else if let verbCard = card as? VerbPair {
            let tense = verbTense ?? VerbPair.Tense.allCases.randomElement()!
            correctAnswer = verbCard.conjugation(for: tense)
            actualTense = tense
        } else {
            return
        }

        let matches = FuzzyMatch.fuzzyMatch(userInput: userInput, correctAnswer: correctAnswer)
        isCorrect = matches

        // Update SRS and progress
        updateProgress(isCorrect: matches, hintsUsed: hintsUsed)
        updateSRSData(isCorrect: matches, hintsUsed: hintsUsed, tense: actualTense)

        // Show feedback
        feedbackMessage = matches ? "Correct! ✓" : "Incorrect. Answer: \(correctAnswer)"
        showFeedback = true

        // Save data
        saveData()

        // Auto-advance after delay
        Task {
            try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds
            nextCard()
        }
    }

    private func updateProgress(isCorrect: Bool, hintsUsed: Int) {
        progress.recordAnswer(correct: isCorrect, usedHint: hintsUsed > 0)

        sessionStats.cardsReviewed += 1
        if isCorrect {
            sessionStats.correct += 1
        } else {
            sessionStats.incorrect += 1
        }
        if hintsUsed > 0 {
            sessionStats.hintsUsed += hintsUsed
        }
    }

    private func updateSRSData(isCorrect: Bool, hintsUsed: Int, tense: VerbPair.Tense?) {
        if var wordCard = currentCard as? WordPair {
            wordCard.srsData = SRSAlgorithm.updateCard(cardData: wordCard.srsData, isCorrect: isCorrect, hintsUsed: hintsUsed)
            // Update in array
            if let index = words.firstIndex(where: { $0.id == wordCard.id }) {
                words[index] = wordCard
            }
            if wordCard.srsData.repetitions == 1 && !wordCard.srsData.isNew {
                progress.wordsLearned += 1
            }
        } else if var verbCard = currentCard as? VerbPair, let tense = tense {
            let updatedSRS = SRSAlgorithm.updateCard(cardData: verbCard.getSRS(for: tense), isCorrect: isCorrect, hintsUsed: hintsUsed)
            verbCard.updateSRS(for: tense, data: updatedSRS)
            // Update in array
            if let index = verbs.firstIndex(where: { $0.id == verbCard.id }) {
                verbs[index] = verbCard
            }
        }
    }

    private func saveData() {
        storage.saveWords(words)
        storage.saveVerbs(verbs)
        storage.saveUserProgress(progress)
    }

    // MARK: - Hint Management

    public func requestHint() {
        currentHintLevel += 1
        hintsUsed += 1

        // Generate hint based on level
        guard let card = currentCard else { return }

        let correctAnswer: String
        if let wordCard = card as? WordPair {
            correctAnswer = languageDirection == .dutchToEnglish ? wordCard.english : wordCard.dutch
        } else if let verbCard = card as? VerbPair {
            let tense = verbTense ?? .present
            correctAnswer = verbCard.conjugation(for: tense)
        } else {
            return
        }

        switch currentHintLevel {
        case 1:
            feedbackMessage = "Length: \(correctAnswer.count) letters"
        case 2:
            feedbackMessage = "First letter: \(correctAnswer.first ?? Character(""))"
        case 3:
            feedbackMessage = "First 3 letters: \(String(correctAnswer.prefix(3)))"
        default:
            feedbackMessage = "Answer: \(correctAnswer)"
        }

        showFeedback = true
    }

    // MARK: - Mode Changes

    public func changeContentType(_ type: ContentType) {
        contentType = type
        nextCard()
    }

    public func changeLanguageDirection(_ direction: LanguageDirection) {
        languageDirection = direction
        nextCard()
    }

    public func changeVerbTense(_ tense: VerbPair.Tense?) {
        verbTense = tense
        if contentType == .verbs {
            nextCard()
        }
    }
}
