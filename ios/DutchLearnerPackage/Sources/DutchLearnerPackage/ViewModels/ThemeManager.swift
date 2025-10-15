//
//  ThemeManager.swift
//  DutchLearner
//
//  Theme management view model
//

import Foundation
import SwiftUI

@MainActor
public class ThemeManager: ObservableObject {
    @Published public var currentTheme: AppTheme
    @Published public var customThemeColors: ThemeColors?

    private let storage = StorageManager.shared

    public init() {
        self.currentTheme = storage.loadTheme()
        self.customThemeColors = storage.loadCustomTheme()
    }

    public var colors: ThemeColors {
        switch currentTheme {
        case .defaultTheme:
            return .defaultTheme
        case .duo:
            return .duo
        case .dark:
            return .dark
        case .custom:
            return customThemeColors ?? .defaultTheme
        }
    }

    public func setTheme(_ theme: AppTheme) {
        currentTheme = theme
        storage.saveTheme(theme)
    }

    public func setCustomTheme(_ colors: ThemeColors) {
        customThemeColors = colors
        storage.saveCustomTheme(colors)
        setTheme(.custom)
    }
}
