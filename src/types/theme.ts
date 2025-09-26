export type Theme = 'default' | 'duo' | 'oled' | 'custom';

export interface ThemeColors {
  name: string;
  background: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  buttonBg: string;
  buttonHover: string;
  progressBar: string;
  correctFeedback: string;
  incorrectFeedback: string;
  hintBg: string;
  hintBorder: string;
  hintText: string;
  statBoxBg: string;
  statBoxHover: string;
  // Mode selector colors
  modeToggleBg?: string;
  modeToggleActive?: string;
  contentTypeBg?: string;
  contentTypeActive?: string;
  verbModeBg?: string;
  verbModeActive?: string;
}

export interface CustomThemeColors extends ThemeColors {
  customId: string;
}

export const DEFAULT_CUSTOM_THEME: CustomThemeColors = {
  customId: 'custom-theme-v1',
  name: 'Custom',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  cardBg: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textMuted: 'rgba(255, 255, 255, 0.6)',
  inputBg: 'rgba(255, 255, 255, 0.1)',
  inputBorder: 'rgba(255, 255, 255, 0.3)',
  buttonBg: 'rgba(255, 255, 255, 0.2)',
  buttonHover: 'rgba(255, 255, 255, 0.3)',
  progressBar: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
  correctFeedback: '#10b981',
  incorrectFeedback: '#ef4444',
  hintBg: 'rgba(255, 255, 255, 0.15)',
  hintBorder: 'rgba(255, 255, 255, 0.25)',
  hintText: '#ffffff',
  statBoxBg: 'rgba(255, 255, 255, 0.2)',
  statBoxHover: 'rgba(255, 255, 255, 0.3)',
  modeToggleBg: 'rgba(255, 255, 255, 0.1)',
  modeToggleActive: 'rgba(255, 255, 255, 0.3)',
  contentTypeBg: 'rgba(255, 255, 255, 0.1)',
  contentTypeActive: 'rgba(255, 255, 255, 0.3)',
  verbModeBg: 'rgba(255, 255, 255, 0.1)',
  verbModeActive: 'rgba(255, 255, 255, 0.3)'
};

export const themes: Record<Exclude<Theme, 'custom'>, ThemeColors> = {
  default: {
    name: 'Default',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardBg: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    inputBg: 'rgba(255, 255, 255, 0.1)',
    inputBorder: 'rgba(255, 255, 255, 0.3)',
    buttonBg: 'rgba(255, 255, 255, 0.2)',
    buttonHover: 'rgba(255, 255, 255, 0.3)',
    progressBar: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
    correctFeedback: '#10b981',
    incorrectFeedback: '#ef4444',
    hintBg: 'rgba(255, 255, 255, 0.15)',
    hintBorder: 'rgba(255, 255, 255, 0.25)',
    hintText: '#ffffff',
    statBoxBg: 'rgba(255, 255, 255, 0.2)',
    statBoxHover: 'rgba(255, 255, 255, 0.3)'
  },
  duo: {
    name: 'Duo',
    background: 'linear-gradient(135deg, #a8d5a8 0%, #c8e6c9 100%)',
    cardBg: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#2d3748',
    textSecondary: '#4a5568',
    textMuted: '#718096',
    inputBg: '#ffffff',
    inputBorder: '#e2e8f0',
    buttonBg: '#81c784',
    buttonHover: '#66bb6a',
    progressBar: 'linear-gradient(90deg, #81c784 0%, #ffb74d 100%)',
    correctFeedback: '#66bb6a',
    incorrectFeedback: '#e57373',
    hintBg: '#a5d6a7',
    hintBorder: '#81c784',
    hintText: '#2d3748',
    statBoxBg: 'rgba(129, 199, 132, 0.2)',
    statBoxHover: 'rgba(129, 199, 132, 0.3)'
  },
  oled: {
    name: 'Dark',
    // Dark grey background instead of pure black for comfort
    background: 'linear-gradient(135deg, #121212 0%, #181818 100%)',
    // Elevated surfaces use lighter greys for depth
    cardBg: '#1e1e1e',
    // Off-white text at 90% opacity to reduce glare
    textPrimary: 'rgba(255, 255, 255, 0.9)',
    // Secondary text with good contrast ratio
    textSecondary: '#b3b3b3',
    // Muted text still readable
    textMuted: '#808080',
    // Input backgrounds slightly elevated
    inputBg: '#232323',
    // Subtle borders, not harsh white
    inputBorder: '#444444',
    // Desaturated accent colors for buttons
    buttonBg: '#2d3748',
    buttonHover: '#4a5568',
    // Desaturated progress colors
    progressBar: 'linear-gradient(90deg, #4ade80 0%, #60a5fa 100%)',
    // Muted feedback colors to prevent eye strain
    correctFeedback: '#4ade80',
    incorrectFeedback: '#f87171',
    // Hint colors for dark theme
    hintBg: '#3a3a3a',
    hintBorder: '#555555',
    hintText: 'rgba(255, 255, 255, 0.9)',
    statBoxBg: 'rgba(45, 55, 72, 0.4)',
    statBoxHover: 'rgba(45, 55, 72, 0.6)'
  }
};