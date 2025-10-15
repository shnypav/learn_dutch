//
//  ProgressView.swift
//  DutchLearner
//
//  Progress indicator view
//

import SwiftUI

public struct ProgressView: View {
    let correct: Int
    let total: Int
    let colors: ThemeColors

    public init(correct: Int, total: Int, colors: ThemeColors) {
        self.correct = correct
        self.total = total
        self.colors = colors
    }

    public var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text("Session Progress")
                    .font(.caption)
                    .foregroundColor(colors.textSecondary)

                Spacer()

                Text("\(correct) / \(total)")
                    .font(.caption.bold())
                    .foregroundColor(colors.textPrimary)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(colors.inputBg)
                        .frame(height: 12)

                    if total > 0 {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(colors.progressGradient)
                            .frame(width: geometry.size.width * CGFloat(correct) / CGFloat(total), height: 12)
                    }
                }
            }
            .frame(height: 12)
        }
    }
}
