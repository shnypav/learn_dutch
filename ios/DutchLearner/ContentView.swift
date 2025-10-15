//
//  ContentView.swift
//  DutchLearner
//
//  Main learning interface
//

import SwiftUI
import DutchLearnerPackage

struct ContentView: View {
    @StateObject private var viewModel = LearningViewModel()
    @StateObject private var themeManager = ThemeManager()

    var body: some View {
        ZStack {
            // Background gradient
            themeManager.colors.backgroundGradient
                .ignoresSafeArea()

            if viewModel.isLoading {
                ProgressView("Loading...")
                    .foregroundColor(themeManager.colors.textPrimary)
            } else {
                VStack(spacing: 20) {
                    // Header with content type switcher
                    headerView

                    // Progress indicator
                    ProgressView(
                        correct: viewModel.sessionStats.correct,
                        total: viewModel.sessionStats.total,
                        colors: themeManager.colors
                    )
                    .padding(.horizontal)

                    Spacer()

                    // Card view
                    cardView

                    // Input field
                    inputView

                    // Hint button
                    hintButton

                    Spacer()
                }
                .padding()
            }
        }
    }

    private var headerView: some View {
        VStack(spacing: 12) {
            // Content type switcher
            Picker("Content Type", selection: $viewModel.contentType) {
                ForEach(ContentType.allCases, id: \.self) { type in
                    Text(type.rawValue).tag(type)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            // Language direction
            Picker("Direction", selection: $viewModel.languageDirection) {
                ForEach(LanguageDirection.allCases, id: \.self) { direction in
                    Text(direction.rawValue).tag(direction)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            // Verb tense selector (if verbs mode)
            if viewModel.contentType == .verbs {
                VStack(spacing: 8) {
                    Text("Verb Tense")
                        .font(.caption)
                        .foregroundColor(themeManager.colors.textSecondary)

                    Picker("Tense", selection: $viewModel.verbTense) {
                        Text("Random").tag(nil as VerbPair.Tense?)
                        ForEach(VerbPair.Tense.allCases, id: \.self) { tense in
                            Text(tense.displayName).tag(Optional(tense))
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .padding(.horizontal)
            }
        }
    }

    private var cardView: some View {
        VStack(spacing: 20) {
            if let wordCard = viewModel.currentCard as? WordPair {
                WordCardView(
                    word: wordCard,
                    direction: viewModel.languageDirection,
                    colors: themeManager.colors
                )
            } else if let verbCard = viewModel.currentCard as? VerbPair {
                VerbCardView(
                    verb: verbCard,
                    tense: viewModel.verbTense,
                    direction: viewModel.languageDirection,
                    colors: themeManager.colors
                )
            }

            // Feedback message
            if viewModel.showFeedback {
                Text(viewModel.feedbackMessage)
                    .font(.headline)
                    .foregroundColor(viewModel.isCorrect ? themeManager.colors.correctFeedback : themeManager.colors.incorrectFeedback)
                    .padding()
                    .background(themeManager.colors.cardBg)
                    .cornerRadius(12)
            }
        }
    }

    private var inputView: some View {
        HStack {
            TextField("Type your answer...", text: $viewModel.userInput)
                .textFieldStyle(.plain)
                .padding()
                .background(themeManager.colors.inputBg)
                .foregroundColor(themeManager.colors.textPrimary)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(themeManager.colors.inputBorder, lineWidth: 1)
                )
                .onSubmit {
                    viewModel.checkAnswer()
                }

            Button(action: {
                viewModel.checkAnswer()
            }) {
                Image(systemName: "arrow.right.circle.fill")
                    .font(.title)
                    .foregroundColor(themeManager.colors.buttonBg)
            }
        }
        .padding(.horizontal)
    }

    private var hintButton: some View {
        Button(action: {
            viewModel.requestHint()
        }) {
            HStack {
                Image(systemName: "lightbulb.fill")
                Text("Hint (\(viewModel.currentHintLevel)/4)")
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(themeManager.colors.buttonBg)
            .foregroundColor(themeManager.colors.textPrimary)
            .cornerRadius(12)
        }
    }
}

#Preview {
    ContentView()
}
