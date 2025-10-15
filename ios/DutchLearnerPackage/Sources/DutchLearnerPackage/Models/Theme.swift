//
//  Theme.swift
//  DutchLearner
//
//  Theme and color customization models
//

import SwiftUI

public enum AppTheme: String, Codable, CaseIterable {
    case defaultTheme = "default"
    case duo = "duo"
    case dark = "dark"
    case custom = "custom"

    public var displayName: String {
        switch self {
        case .defaultTheme: return "Default"
        case .duo: return "Duo"
        case .dark: return "Dark"
        case .custom: return "Custom"
        }
    }
}

public struct ThemeColors: Codable, Sendable {
    public var name: String
    public var background: [Color] // Gradient colors
    public var cardBg: Color
    public var textPrimary: Color
    public var textSecondary: Color
    public var textMuted: Color
    public var inputBg: Color
    public var inputBorder: Color
    public var buttonBg: Color
    public var buttonHover: Color
    public var progressBar: [Color] // Gradient colors
    public var correctFeedback: Color
    public var incorrectFeedback: Color
    public var hintBg: Color
    public var hintBorder: Color
    public var hintText: Color
    public var statBoxBg: Color
    public var statBoxHover: Color
    public var contentTypeGradient: [Color]?
    public var languageGradient: [Color]?
    public var verbModeGradient: [Color]?

    // Computed properties for gradients
    public var backgroundGradient: LinearGradient {
        LinearGradient(
            colors: background,
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    public var progressGradient: LinearGradient {
        LinearGradient(
            colors: progressBar,
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    public func gradient(for colors: [Color]?) -> LinearGradient? {
        guard let colors = colors else { return nil }
        return LinearGradient(
            colors: colors,
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

// MARK: - Color Codable Extension
extension Color: Codable {
    enum CodingKeys: String, CodingKey {
        case red, green, blue, alpha
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let r = try container.decode(Double.self, forKey: .red)
        let g = try container.decode(Double.self, forKey: .green)
        let b = try container.decode(Double.self, forKey: .blue)
        let a = try container.decode(Double.self, forKey: .alpha)
        self.init(red: r, green: g, blue: b, opacity: a)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        guard let components = UIColor(self).cgColor.components else {
            throw EncodingError.invalidValue(self, EncodingError.Context(codingPath: [], debugDescription: "Cannot get color components"))
        }
        try container.encode(components[0], forKey: .red)
        try container.encode(components[1], forKey: .green)
        try container.encode(components[2], forKey: .blue)
        try container.encode(components.count > 3 ? components[3] : 1.0, forKey: .alpha)
    }
}

// MARK: - Preset Themes
public extension ThemeColors {
    static let defaultTheme = ThemeColors(
        name: "Default",
        background: [Color(red: 0.4, green: 0.49, blue: 0.92), Color(red: 0.46, green: 0.29, blue: 0.64)],
        cardBg: Color.white.opacity(0.1),
        textPrimary: .white,
        textSecondary: Color.white.opacity(0.8),
        textMuted: Color.white.opacity(0.6),
        inputBg: Color.white.opacity(0.1),
        inputBorder: Color.white.opacity(0.3),
        buttonBg: Color.white.opacity(0.2),
        buttonHover: Color.white.opacity(0.3),
        progressBar: [Color(red: 0.06, green: 0.73, blue: 0.51), Color(red: 0.23, green: 0.51, blue: 0.96)],
        correctFeedback: Color(red: 0.06, green: 0.73, blue: 0.51),
        incorrectFeedback: Color(red: 0.94, green: 0.27, blue: 0.27),
        hintBg: Color.white.opacity(0.15),
        hintBorder: Color.white.opacity(0.25),
        hintText: .white,
        statBoxBg: Color.white.opacity(0.2),
        statBoxHover: Color.white.opacity(0.3),
        contentTypeGradient: [Color(red: 0.06, green: 0.73, blue: 0.51), Color(red: 0.08, green: 0.72, blue: 0.65)],
        languageGradient: [Color(red: 0.23, green: 0.51, blue: 0.96), Color(red: 0.55, green: 0.34, blue: 0.96)],
        verbModeGradient: [Color(red: 0.55, green: 0.34, blue: 0.96), Color(red: 0.93, green: 0.28, blue: 0.60)]
    )

    static let duo = ThemeColors(
        name: "Duo",
        background: [Color(red: 0.66, green: 0.84, blue: 0.66), Color(red: 0.78, green: 0.90, blue: 0.79)],
        cardBg: Color.white.opacity(0.95),
        textPrimary: Color(red: 0.18, green: 0.22, blue: 0.28),
        textSecondary: Color(red: 0.29, green: 0.34, blue: 0.41),
        textMuted: Color(red: 0.45, green: 0.50, blue: 0.59),
        inputBg: .white,
        inputBorder: Color(red: 0.89, green: 0.91, blue: 0.94),
        buttonBg: Color(red: 0.51, green: 0.78, blue: 0.52),
        buttonHover: Color(red: 0.40, green: 0.73, blue: 0.42),
        progressBar: [Color(red: 0.51, green: 0.78, blue: 0.52), Color(red: 1.0, green: 0.72, blue: 0.30)],
        correctFeedback: Color(red: 0.40, green: 0.73, blue: 0.42),
        incorrectFeedback: Color(red: 0.90, green: 0.45, blue: 0.45),
        hintBg: Color(red: 0.65, green: 0.84, blue: 0.65),
        hintBorder: Color(red: 0.51, green: 0.78, blue: 0.52),
        hintText: Color(red: 0.18, green: 0.22, blue: 0.28),
        statBoxBg: Color(red: 0.51, green: 0.78, blue: 0.52).opacity(0.2),
        statBoxHover: Color(red: 0.51, green: 0.78, blue: 0.52).opacity(0.3),
        contentTypeGradient: [Color(red: 0.51, green: 0.78, blue: 0.52), Color(red: 0.68, green: 0.84, blue: 0.51)],
        languageGradient: [Color(red: 0.39, green: 0.71, blue: 0.96), Color(red: 0.47, green: 0.53, blue: 0.80)],
        verbModeGradient: [Color(red: 0.73, green: 0.41, blue: 0.78), Color(red: 0.94, green: 0.39, blue: 0.57)]
    )

    static let dark = ThemeColors(
        name: "Dark",
        background: [Color(red: 0.07, green: 0.07, blue: 0.07), Color(red: 0.09, green: 0.09, blue: 0.09)],
        cardBg: Color(red: 0.12, green: 0.12, blue: 0.12),
        textPrimary: Color.white.opacity(0.9),
        textSecondary: Color(red: 0.70, green: 0.70, blue: 0.70),
        textMuted: Color(red: 0.50, green: 0.50, blue: 0.50),
        inputBg: Color(red: 0.14, green: 0.14, blue: 0.14),
        inputBorder: Color(red: 0.27, green: 0.27, blue: 0.27),
        buttonBg: Color(red: 0.18, green: 0.22, blue: 0.28),
        buttonHover: Color(red: 0.29, green: 0.34, blue: 0.41),
        progressBar: [Color(red: 0.29, green: 0.87, blue: 0.50), Color(red: 0.38, green: 0.65, blue: 0.98)],
        correctFeedback: Color(red: 0.29, green: 0.87, blue: 0.50),
        incorrectFeedback: Color(red: 0.97, green: 0.44, blue: 0.44),
        hintBg: Color(red: 0.23, green: 0.23, blue: 0.23),
        hintBorder: Color(red: 0.33, green: 0.33, blue: 0.33),
        hintText: Color.white.opacity(0.9),
        statBoxBg: Color(red: 0.18, green: 0.22, blue: 0.28).opacity(0.4),
        statBoxHover: Color(red: 0.18, green: 0.22, blue: 0.28).opacity(0.6),
        contentTypeGradient: [Color(red: 0.29, green: 0.87, blue: 0.50), Color(red: 0.13, green: 0.83, blue: 0.93)],
        languageGradient: [Color(red: 0.38, green: 0.65, blue: 0.98), Color(red: 0.65, green: 0.55, blue: 0.98)],
        verbModeGradient: [Color(red: 0.75, green: 0.52, blue: 0.99), Color(red: 0.96, green: 0.45, blue: 0.71)]
    )
}
