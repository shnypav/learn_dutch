//
//  VerbCardView.swift
//  DutchLearner
//
//  Verb conjugation card view
//

import SwiftUI

public struct VerbCardView: View {
    let verb: VerbPair
    let tense: VerbPair.Tense?
    let direction: LanguageDirection
    let colors: ThemeColors

    public init(verb: VerbPair, tense: VerbPair.Tense?, direction: LanguageDirection, colors: ThemeColors) {
        self.verb = verb
        self.tense = tense
        self.direction = direction
        self.colors = colors
    }

    public var body: some View {
        VStack(spacing: 16) {
            Text("Conjugate:")
                .font(.caption)
                .foregroundColor(colors.textSecondary)

            VStack(spacing: 8) {
                Text(verb.english)
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundColor(colors.textPrimary)

                Text("(\(verb.infinitive))")
                    .font(.system(size: 18))
                    .foregroundColor(colors.textSecondary)
            }

            Divider()
                .background(colors.textMuted)

            if let displayTense = tense {
                Text(displayTense.displayName)
                    .font(.headline)
                    .foregroundColor(colors.textPrimary)
            } else {
                Text("Random Tense")
                    .font(.headline)
                    .foregroundColor(colors.textMuted)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
        .padding(.horizontal, 24)
        .background(colors.cardBg)
        .cornerRadius(20)
        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
    }
}
