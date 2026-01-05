# CLAUDE.md

This file contains project-specific information for Claude Code.

## Project Overview

- Working directory: /Users/Pavel.Shnyrin/work/mine/fresher
- Git repository: Yes
- Main branch: main
- Project: Dutch Language Learning App - AI-powered vocabulary and verb conjugation practice
- Tech Stack: React 19 + TypeScript + Vite + Tailwind CSS + Vitest

## Common Commands

- `npm run dev` - Start development server (runs on http://localhost:5173)
- `npm run build` - Build for production (TypeScript compile + Vite build)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI

## Project Structure

```
src/
├── components/           # React components
│   ├── AIHintConfigDialog.tsx    # AI hint configuration dialog
│   ├── AIHintPopup.tsx           # AI hint display popup
│   ├── ColorPicker.tsx           # Custom color picker
│   ├── ContentTypeSwitcher.tsx   # Switch between words/verbs
│   ├── CustomThemeDialog.tsx     # Custom theme configuration
│   ├── HintButton.tsx            # Hint trigger button
│   ├── InputField.tsx            # User input field
│   ├── ModeToggle.tsx            # Mode selector
│   ├── ProgressIndicator.tsx     # Progress tracking display
│   ├── StatsDashboard.tsx        # Statistics dashboard
│   ├── ThemeChooser.tsx          # Theme selection component
│   ├── VerbCard.tsx              # Verb practice card
│   ├── VerbModeSelector.tsx      # Verb mode selection
│   └── WordCard.tsx              # Word practice card
├── contexts/            # React contexts
│   ├── ThemeContext.tsx          # Theme management
│   └── AIHintContext.tsx         # AI hint state management
├── utils/               # Utility functions
│   ├── csvParser.ts              # CSV data parsing
│   ├── fuzzyMatch.ts             # Fuzzy matching for answers
│   ├── hintGenerator.ts          # Hint generation logic
│   ├── storage.ts                # Local storage management
│   ├── verbManager.ts            # Verb data management
│   └── wordManager.ts            # Word data management
├── types/               # TypeScript type definitions
│   ├── index.ts                  # Main type exports
│   └── theme.ts                  # Theme-related types
├── services/            # External services
│   └── aiHintService.ts          # Perplexity API integration
├── App.tsx              # Main app component
└── main.tsx             # Entry point

public/data/             # CSV datasets
├── dutch_common_words.csv
└── dutch_irregular_verbs.csv
```

## Dependencies

- **Runtime**:
  - React 19.1.0 & React DOM 19.1.0
  - Papa Parse 5.5.3 (CSV parsing)
  - Tailwind CSS 4.1.11 (with PostCSS)
- **Dev**:
  - TypeScript 5.8.3
  - Vite 7.0.0
  - ESLint 9.29.0 (with React hooks & refresh plugins)
  - Vitest 3.2.4 (with UI support)
  - @vitejs/plugin-react 4.5.2
  - Autoprefixer 10.4.21
  - PostCSS 8.5.6
- **Testing**: Vitest with UI support (@vitest/ui)
- **AI Integration**: Perplexity API for contextual hints

## Testing

- Framework: Vitest
- `npm run test` - Run in watch mode
- `npm run test:run` - Single run
- `npm run test:ui` - Visual test UI
- Test files: `*.test.ts`, `*.test.tsx`

## Build & Deployment

- `npm run build` - Creates `dist/` folder
- Ready for: Netlify, Vercel, GitHub Pages
- Dev server port: 5173
- Production preview: `npm run preview`

## Features

- **Content Types**:
  - Vocabulary words practice
  - Irregular verb conjugation (all tenses)
- **AI Integration**:
  - Context-aware hints via Perplexity API
  - Configurable hint settings
  - Search-based example generation
- **Customization**:
  - Multiple built-in themes
  - Custom theme creator with color picker
  - Adjustable learning modes
- **Learning Features**:
  - Progress tracking and statistics dashboard
  - Fuzzy matching for answer validation
  - Verb mode selection (specific tenses)
  - Content type switcher
- **Data Management**:
  - Local storage persistence
  - CSV data import
  - Session statistics
