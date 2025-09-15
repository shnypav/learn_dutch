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
├── components/           # React components (WordCard, InputField, etc.)
├── contexts/            # React contexts (ThemeContext, AIHintContext)
├── utils/               # Utilities (csvParser, fuzzyMatch, wordManager, etc.)
├── types/               # TypeScript type definitions
├── services/            # AI hint service (Perplexity API)
├── App.tsx              # Main app component
└── main.tsx             # Entry point

public/data/             # CSV datasets
├── dutch_common_words.csv
└── dutch_irregular_verbs.csv
```

## Dependencies
- **Runtime**: React 19, Papa Parse (CSV parsing), Tailwind CSS
- **Dev**: TypeScript, Vite, ESLint, Vitest, @vitejs/plugin-react
- **Testing**: Vitest with UI support
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
- Dual content: vocabulary words + irregular verbs
- AI-powered hints via Perplexity API
- Multiple learning modes and themes
- Progress tracking and analytics
- Fuzzy matching for answers
- Local storage persistence