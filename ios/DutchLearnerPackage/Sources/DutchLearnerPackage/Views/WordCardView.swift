//
//  WordCardView.swift
//  DutchLearner
//
//  Word practice card view
//

import SwiftUI

public struct WordCardView: View {
    let word: WordPair
    let direction: LanguageDirection
    let colors: ThemeColors

    public init(word: WordPair, direction: LanguageDirection, colors: ThemeColors) {
        self.word = word
        self.direction = direction
        self.colors = colors
    }

    public var body: some View {
        VStack(spacing: 16) {
            Text("Translate:")
                .font(.caption)
                .foregroundColor(colors.textSecondary)

            Text(questionText)
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(colors.textPrimary)
                .multilineTextAlignment(.center)
                .padding()

            if let category = word.category {
                Text("Category: \(category)")
                    .font(.caption)
                    .foregroundColor(colors.textMuted)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .background(colors.cardBg)
        .cornerRadius(20)
        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
    }

    private var questionText: String {
        switch direction {
        case .dutchToEnglish:
            return word.dutch
        case .englishToDutch:
            return word.english
        }
    }
}
