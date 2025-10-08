import React, { useState, useEffect } from 'react';
import { ColorPicker } from './ColorPicker';
import type { CustomThemeColors } from '../types/theme';
import { DEFAULT_CUSTOM_THEME } from '../types/theme';

interface CustomThemeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: CustomThemeColors;
  onSave: (theme: CustomThemeColors) => void;
}

export const CustomThemeDialog: React.FC<CustomThemeDialogProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSave
}) => {
  const [tempTheme, setTempTheme] = useState<CustomThemeColors>(currentTheme);

  useEffect(() => {
    setTempTheme(currentTheme);
  }, [currentTheme]);

  const updateColor = (key: keyof CustomThemeColors, value: string) => {
    setTempTheme(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(tempTheme);
    onClose();
  };

  const handleReset = () => {
    setTempTheme(DEFAULT_CUSTOM_THEME);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
          <h2 className="text-3xl font-bold text-white">
            🎨 Customize Your Theme
          </h2>
          <p className="text-purple-100 mt-1">Make it yours with colors and gradients</p>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Configuration Panel */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-8">
            
            {/* Main Colors Section */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">🌈</span> Main Colors
              </h3>
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <ColorPicker
                  label="Background"
                  value={tempTheme.background}
                  onChange={(value) => updateColor('background', value)}
                  supportsGradient={true}
                />
                <ColorPicker
                  label="Card Background"
                  value={tempTheme.cardBg}
                  onChange={(value) => updateColor('cardBg', value)}
                />
                <ColorPicker
                  label="Progress Bar"
                  value={tempTheme.progressBar}
                  onChange={(value) => updateColor('progressBar', value)}
                  supportsGradient={true}
                />
              </div>
            </section>

            {/* Mode Switcher Gradients */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">✨</span> Mode Switcher Gradients
              </h3>
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <ColorPicker
                  label="Words/Verbs Switcher"
                  value={tempTheme.contentTypeGradient || 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)'}
                  onChange={(value) => updateColor('contentTypeGradient', value)}
                  supportsGradient={true}
                />
                <ColorPicker
                  label="Language Direction (NL↔EN)"
                  value={tempTheme.languageGradient || 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'}
                  onChange={(value) => updateColor('languageGradient', value)}
                  supportsGradient={true}
                />
                <ColorPicker
                  label="Verb Forms Mode"
                  value={tempTheme.verbModeGradient || 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'}
                  onChange={(value) => updateColor('verbModeGradient', value)}
                  supportsGradient={true}
                />
              </div>
            </section>

            {/* Text Colors */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">📝</span> Text Colors
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <ColorPicker
                  label="Primary Text"
                  value={tempTheme.textPrimary}
                  onChange={(value) => updateColor('textPrimary', value)}
                />
                <ColorPicker
                  label="Secondary Text"
                  value={tempTheme.textSecondary}
                  onChange={(value) => updateColor('textSecondary', value)}
                />
              </div>
            </section>

            {/* Feedback Colors */}
            <section>
              <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <span className="mr-2">✅</span> Feedback
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <ColorPicker
                  label="Correct"
                  value={tempTheme.correctFeedback}
                  onChange={(value) => updateColor('correctFeedback', value)}
                />
                <ColorPicker
                  label="Incorrect"
                  value={tempTheme.incorrectFeedback}
                  onChange={(value) => updateColor('incorrectFeedback', value)}
                />
              </div>
            </section>

            {/* Advanced Section - Collapsible */}
            <details className="group">
              <summary className="cursor-pointer text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <span className="mr-2">⚙️</span> Advanced Settings
                <svg className="ml-2 w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Input Background"
                    value={tempTheme.inputBg}
                    onChange={(value) => updateColor('inputBg', value)}
                  />
                  <ColorPicker
                    label="Input Border"
                    value={tempTheme.inputBorder}
                    onChange={(value) => updateColor('inputBorder', value)}
                  />
                  <ColorPicker
                    label="Button Background"
                    value={tempTheme.buttonBg}
                    onChange={(value) => updateColor('buttonBg', value)}
                  />
                  <ColorPicker
                    label="Button Hover"
                    value={tempTheme.buttonHover}
                    onChange={(value) => updateColor('buttonHover', value)}
                  />
                  <ColorPicker
                    label="Hint Background"
                    value={tempTheme.hintBg}
                    onChange={(value) => updateColor('hintBg', value)}
                  />
                  <ColorPicker
                    label="Hint Text"
                    value={tempTheme.hintText}
                    onChange={(value) => updateColor('hintText', value)}
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Live Preview Panel */}
          <div 
            className="lg:w-96 p-6 border-l border-gray-200 dark:border-gray-700"
            style={{ background: tempTheme.background }}
          >
            <div className="sticky top-0">
              <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: tempTheme.textPrimary }}>
                <span className="mr-2">👀</span> Live Preview
              </h3>
              
              {/* Preview Card */}
              <div 
                className="p-4 rounded-xl mb-4 shadow-lg" 
                style={{ backgroundColor: tempTheme.cardBg }}
              >
                <p className="font-semibold mb-2" style={{ color: tempTheme.textPrimary }}>Sample Card</p>
                <p className="text-sm" style={{ color: tempTheme.textSecondary }}>This is how your content looks</p>
              </div>

              {/* Preview Mode Switchers */}
              <div className="space-y-3 mb-4">
                <div className="flex space-x-2">
                  <div 
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white text-center shadow-lg"
                    style={{ background: tempTheme.contentTypeGradient }}
                  >
                    Words
                  </div>
                  <div 
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white text-center shadow-lg opacity-50"
                    style={{ background: tempTheme.contentTypeGradient }}
                  >
                    Verbs
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div 
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white text-center shadow-lg"
                    style={{ background: tempTheme.languageGradient }}
                  >
                    🇳🇱 → 🇬🇧
                  </div>
                  <div 
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white text-center shadow-lg opacity-50"
                    style={{ background: tempTheme.languageGradient }}
                  >
                    🇬🇧 → 🇳🇱
                  </div>
                </div>
              </div>

              {/* Preview Progress */}
              <div className="mb-4">
                <div 
                  className="h-3 rounded-full shadow-inner"
                  style={{ background: tempTheme.progressBar, width: '70%' }}
                />
              </div>

              {/* Preview Feedback */}
              <div className="flex space-x-2">
                <div 
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white text-center shadow-lg"
                  style={{ backgroundColor: tempTheme.correctFeedback }}
                >
                  ✓ Correct
                </div>
                <div 
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white text-center shadow-lg"
                  style={{ backgroundColor: tempTheme.incorrectFeedback }}
                >
                  ✗ Wrong
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <button
            onClick={handleReset}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            🔄 Reset to Default
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              💾 Save Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};