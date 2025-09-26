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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customize Your Theme
          </h2>
        </div>

        <div className="flex">
          {/* Configuration Panel */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[70vh]">
            <div className="space-y-6">
              {/* Background */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Background
                </h3>
                <ColorPicker
                  label="Page Background"
                  value={tempTheme.background}
                  onChange={(value) => updateColor('background', value)}
                  supportsGradient={true}
                />
              </div>

              {/* Text Colors */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Text Colors
                </h3>
                <div className="space-y-3">
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
                  <ColorPicker
                    label="Muted Text"
                    value={tempTheme.textMuted}
                    onChange={(value) => updateColor('textMuted', value)}
                  />
                </div>
              </div>

              {/* UI Elements */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  UI Elements
                </h3>
                <div className="space-y-3">
                  <ColorPicker
                    label="Card Background"
                    value={tempTheme.cardBg}
                    onChange={(value) => updateColor('cardBg', value)}
                  />
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
                </div>
              </div>

              {/* Mode Selectors */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Mode Selectors
                </h3>
                <div className="space-y-3">
                  <ColorPicker
                    label="Mode Toggle Background"
                    value={tempTheme.modeToggleBg || tempTheme.buttonBg}
                    onChange={(value) => updateColor('modeToggleBg', value)}
                  />
                  <ColorPicker
                    label="Mode Toggle Active"
                    value={tempTheme.modeToggleActive || tempTheme.buttonHover}
                    onChange={(value) => updateColor('modeToggleActive', value)}
                  />
                  <ColorPicker
                    label="Content Type Background"
                    value={tempTheme.contentTypeBg || tempTheme.buttonBg}
                    onChange={(value) => updateColor('contentTypeBg', value)}
                  />
                  <ColorPicker
                    label="Content Type Active"
                    value={tempTheme.contentTypeActive || tempTheme.buttonHover}
                    onChange={(value) => updateColor('contentTypeActive', value)}
                  />
                  <ColorPicker
                    label="Verb Mode Background"
                    value={tempTheme.verbModeBg || tempTheme.buttonBg}
                    onChange={(value) => updateColor('verbModeBg', value)}
                  />
                  <ColorPicker
                    label="Verb Mode Active"
                    value={tempTheme.verbModeActive || tempTheme.buttonHover}
                    onChange={(value) => updateColor('verbModeActive', value)}
                  />
                </div>
              </div>

              {/* Feedback & Progress */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Feedback & Progress
                </h3>
                <div className="space-y-3">
                  <ColorPicker
                    label="Progress Bar"
                    value={tempTheme.progressBar}
                    onChange={(value) => updateColor('progressBar', value)}
                    supportsGradient={true}
                  />
                  <ColorPicker
                    label="Correct Feedback"
                    value={tempTheme.correctFeedback}
                    onChange={(value) => updateColor('correctFeedback', value)}
                  />
                  <ColorPicker
                    label="Incorrect Feedback"
                    value={tempTheme.incorrectFeedback}
                    onChange={(value) => updateColor('incorrectFeedback', value)}
                  />
                </div>
              </div>

              {/* Hints */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Hints
                </h3>
                <div className="space-y-3">
                  <ColorPicker
                    label="Hint Background"
                    value={tempTheme.hintBg}
                    onChange={(value) => updateColor('hintBg', value)}
                  />
                  <ColorPicker
                    label="Hint Border"
                    value={tempTheme.hintBorder}
                    onChange={(value) => updateColor('hintBorder', value)}
                  />
                  <ColorPicker
                    label="Hint Text"
                    value={tempTheme.hintText}
                    onChange={(value) => updateColor('hintText', value)}
                  />
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Statistics
                </h3>
                <div className="space-y-3">
                  <ColorPicker
                    label="Stat Box Background"
                    value={tempTheme.statBoxBg}
                    onChange={(value) => updateColor('statBoxBg', value)}
                  />
                  <ColorPicker
                    label="Stat Box Hover"
                    value={tempTheme.statBoxHover}
                    onChange={(value) => updateColor('statBoxHover', value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div 
            className="w-96 p-6 border-l border-gray-200 dark:border-gray-700"
            style={{ background: tempTheme.background }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: tempTheme.textPrimary }}>
              Live Preview
            </h3>
            
            {/* Preview Card */}
            <div 
              className="p-4 rounded-lg mb-4" 
              style={{ backgroundColor: tempTheme.cardBg }}
            >
              <p style={{ color: tempTheme.textPrimary }}>Primary Text</p>
              <p style={{ color: tempTheme.textSecondary }}>Secondary Text</p>
              <p style={{ color: tempTheme.textMuted }}>Muted Text</p>
            </div>

            {/* Preview Input */}
            <input
              type="text"
              placeholder="Sample input"
              className="w-full px-3 py-2 rounded mb-4"
              style={{
                backgroundColor: tempTheme.inputBg,
                borderColor: tempTheme.inputBorder,
                border: '1px solid',
                color: tempTheme.textPrimary
              }}
            />

            {/* Preview Buttons */}
            <div className="flex space-x-2 mb-4">
              <button
                className="px-4 py-2 rounded transition-colors"
                style={{
                  backgroundColor: tempTheme.buttonBg,
                  color: tempTheme.textPrimary
                }}
              >
                Normal
              </button>
              <button
                className="px-4 py-2 rounded"
                style={{
                  backgroundColor: tempTheme.buttonHover,
                  color: tempTheme.textPrimary
                }}
              >
                Hover
              </button>
            </div>

            {/* Preview Mode Toggles */}
            <div className="flex space-x-2 mb-4">
              <div 
                className="px-3 py-1 rounded text-sm"
                style={{
                  backgroundColor: tempTheme.modeToggleBg || tempTheme.buttonBg,
                  color: tempTheme.textSecondary
                }}
              >
                Inactive
              </div>
              <div 
                className="px-3 py-1 rounded text-sm"
                style={{
                  backgroundColor: tempTheme.modeToggleActive || tempTheme.buttonHover,
                  color: tempTheme.textPrimary
                }}
              >
                Active
              </div>
            </div>

            {/* Preview Progress */}
            <div className="mb-4">
              <div 
                className="h-2 rounded-full"
                style={{ background: tempTheme.progressBar }}
              />
            </div>

            {/* Preview Feedback */}
            <div className="flex space-x-2 mb-4">
              <div 
                className="px-3 py-1 rounded text-sm"
                style={{
                  backgroundColor: tempTheme.correctFeedback,
                  color: '#ffffff'
                }}
              >
                Correct
              </div>
              <div 
                className="px-3 py-1 rounded text-sm"
                style={{
                  backgroundColor: tempTheme.incorrectFeedback,
                  color: '#ffffff'
                }}
              >
                Incorrect
              </div>
            </div>

            {/* Preview Hint */}
            <div 
              className="p-3 rounded border"
              style={{
                backgroundColor: tempTheme.hintBg,
                borderColor: tempTheme.hintBorder,
                color: tempTheme.hintText
              }}
            >
              This is a hint preview
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Reset to Default
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};