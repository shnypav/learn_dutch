# Fresher - Dutch Language Learning App

**AI Assistant Guide for Project Understanding and Development**

## Project Overview

A comprehensive, AI-powered Dutch language learning application built with React + TypeScript + Vite. Features vocabulary practice, verb conjugation, intelligent hints via Perplexity API, spaced repetition system (SRS), multiple learning modes, and gamification with confetti animations.

- **Tech Stack**: React 19.1.0, TypeScript 5.8.3, Vite 7.0.0, Tailwind CSS 4.1.11
- **Testing**: Vitest 3.2.4 with UI support
- **AI Integration**: Perplexity API for contextual hints with caching
- **Data**: CSV-based vocabulary and verb datasets

## Quick Start

```bash
# Development
npm install
npm run dev              # http://localhost:5173

# Testing
npm run test             # Watch mode
npm run test:run         # Single run
npm run test:ui          # Visual UI

# Production
npm run build            # Creates dist/
npm run preview          # Preview build
npm run lint             # ESLint check
```

## Architecture

### Core Application Flow

1. **Entry Point**: `src/main.tsx` → wraps App with ThemeContext and AIHintContext
2. **Main Component**: `src/App.tsx` → manages game state, content loading, answer validation
3. **State Management**: React hooks + Context API (no Redux)
4. **Data Flow**: CSV → Parser → Manager → State → Components
5. **Storage**: LocalStorage for progress, SRS data, known words, custom themes

### Key State Objects

```typescript
// Game State (src/types/index.ts)
GameState {
  currentWord: WordPair | null
  currentVerb: VerbPair | null
  mode: "nl-en" | "en-nl"
  contentType: "words" | "verbs"
  verbMode: "random" | "infinitive" | "imperfectum" | "perfectum"
  currentVerbForm: VerbForm | null
  feedback: "correct" | "incorrect" | null
  sessionStats: SessionStats
  practiceFormat: "input" | "multiple-choice"
  multipleChoiceOptions?: string[]
}

// User Progress (persisted to localStorage)
UserProgress {
  correctAnswers: number
  totalAnswers: number
  currentStreak: number
  bestStreak: number
  wordsLearned: number
  totalHintsUsed: number
  questionsWithHints: number
  cardsReviewedToday: number
  // ... SRS stats
}

// SRS Card Data (src/types/srs.ts)
SRSCardData {
  interval: number          // Days until next review
  repetitions: number       // Successful reviews in a row
  easeFactor: number        // 2.5 start, 1.3 min
  dueDate: number          // Timestamp
  lastReviewDate: number | null
  reviewHistory: ReviewRecord[]
  isNew: boolean
}
```

## Project Structure

```
src/
├── components/              # React UI components
│   ├── WordCard.tsx               # Word display with AI hints
│   ├── VerbCard.tsx               # Verb conjugation display
│   ├── InputField.tsx             # Answer input with validation
│   ├── MultipleChoiceInput.tsx    # Multiple choice options
│   ├── PracticeFormatSwitcher.tsx # Toggle input/MC mode
│   ├── ConfettiEffect.tsx         # Celebration animations
│   ├── ModeToggle.tsx             # Learning mode selector
│   ├── ContentTypeSwitcher.tsx    # Words/verbs switcher
│   ├── VerbModeSelector.tsx       # Verb form selector
│   ├── ProgressIndicator.tsx      # Session progress
│   ├── StatsDashboard.tsx         # Analytics dashboard
│   ├── SRSDashboard.tsx           # SRS statistics
│   ├── SRSSettingsDialog.tsx      # SRS configuration
│   ├── ThemeChooser.tsx           # Theme selection
│   ├── CustomThemeDialog.tsx      # Custom theme creator
│   ├── ColorPicker.tsx            # Color picker component
│   ├── AIHintConfigDialog.tsx     # AI hint setup
│   ├── AIHintPopup.tsx            # Hint display
│   └── HintButton.tsx             # Hint trigger
│
├── contexts/                # React contexts
│   ├── ThemeContext.tsx           # Theme state + custom themes
│   └── AIHintContext.tsx          # AI hint config + caching
│
├── utils/                   # Core business logic
│   ├── csvParser.ts               # CSV loading (Papa Parse)
│   ├── wordManager.ts             # Word selection/filtering
│   ├── verbManager.ts             # Verb form management
│   ├── fuzzyMatch.ts              # Answer validation (2 char tolerance)
│   ├── multipleChoiceGenerator.ts # Distractor generation
│   ├── hintGenerator.ts           # 4-level hint system
│   ├── storage.ts                 # LocalStorage utilities
│   ├── srsAlgorithm.ts            # SM-2 algorithm
│   └── srsScheduler.ts            # Review scheduling
│
├── services/                # External integrations
│   └── aiHintService.ts           # Perplexity API client
│
├── types/                   # TypeScript definitions
│   ├── index.ts                   # Main types
│   ├── srs.ts                     # SRS-specific types
│   └── theme.ts                   # Theme types
│
├── App.tsx                  # Main app component
└── main.tsx                 # Entry point

public/data/
├── dutch_common_words.csv         # Vocabulary dataset
└── dutch_irregular_verbs.csv      # Verb conjugation dataset
```

## Core Features & Implementation

### 1. Content Management

**Word Practice** (`WordCard.tsx`, `wordManager.ts`)
- Loads from `dutch_common_words.csv` (columns: Dutch, English)
- Two modes: Dutch → English, English → Dutch
- Fuzzy matching with 2-character tolerance
- Known words tracking (checkbox UI)
- SRS data attached to each word

**Verb Conjugation** (`VerbCard.tsx`, `verbManager.ts`)
- Loads from `dutch_irregular_verbs.csv` (columns: Infinitive, Imperfectum, Perfectum, English)
- Handles both imperfectum single/plural forms
- Four modes: Random, Infinitive focus, Imperfectum focus, Perfectum focus
- Multiple acceptable answers (separated by `/`)

**CSV Parsing** (`csvParser.ts`)
```typescript
loadCSVData(path: string): Promise<WordPair[]>
loadVerbData(path: string): Promise<VerbPair[]>
```

### 2. Answer Validation

**Fuzzy Matching** (`fuzzyMatch.ts`)
- Levenshtein distance ≤ 2 characters
- Case-insensitive comparison
- Whitespace normalization
- Multiple answer support (`/` or `,` separated)

```typescript
fuzzyMatch(input: string, target: string, threshold = 2): boolean
```

### 3. Spaced Repetition System (SRS)

**Algorithm**: SM-2 (SuperMemo 2) - see `SRS_SYSTEM.md` for full details

**Key Files**:
- `src/utils/srsAlgorithm.ts` - Core SM-2 implementation
- `src/utils/srsScheduler.ts` - Review scheduling logic
- `src/types/srs.ts` - Type definitions

**Quality Ratings** (based on correctness + hints used):
- 5: Perfect recall (correct, no hints)
- 4: Correct with 1 hint
- 3: Correct with 2+ hints
- 2: Wrong with 2+ hints
- 1: Wrong with 1 hint
- 0: Complete failure (wrong, no hints)

**Card Lifecycle**:
- **New**: Never reviewed (interval = 0, isNew = true)
- **Learning**: Failed review, relearning (interval = 0)
- **Young**: 1-21 days interval
- **Mature**: 21+ days interval

**Key Functions**:
```typescript
// srsAlgorithm.ts
initializeSRSCard(): SRSCardData
calculateNextReview(card, quality): SRSCardData
updateSRSCard(card, correct, hintsUsed): SRSCardData
isCardDue(card, now): boolean
getCardCategory(card): "new" | "learning" | "young" | "mature"

// srsScheduler.ts
getDueCards(cards, now): Card[]
getNewCards(cards, limit): Card[]
getCardsByPriority(cards, config): Card[]
getUpcomingReviews(cards): ReviewStats
```

### 4. AI Hints System

**Implementation**: `src/services/aiHintService.ts` + `src/contexts/AIHintContext.tsx`

**Features**:
- Perplexity API integration (model: sonar-pro)
- Intelligent caching (reduces API calls)
- Background preloading of next question's hints
- A2-level filtering for language learners
- Dual strategy: real-world search + AI generation

**Hint Levels** (`hintGenerator.ts`):
1. **Level 1**: First letter hint
2. **Level 2**: First 3 letters + length
3. **Level 3**: All letters with blanks
4. **Level 4**: Full answer reveal

**Context Structure**:
```typescript
// AIHintContext.tsx
{
  apiKey: string
  enabled: boolean
  hintCache: Map<string, CachedHint>
  preloadCache: Map<string, Promise<Hint>>
  fetchHint(word, targetLang): Promise<Hint>
  preloadHint(word, targetLang): void
  clearCache(): void
}
```

**API Request** (Perplexity):
```typescript
POST https://api.perplexity.ai/chat/completions
{
  model: "sonar-pro",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.2,
  max_tokens: 200
}
```

### 5. Practice Formats

**Input Mode** (`InputField.tsx`)
- Traditional typing practice
- Keyboard navigation (Enter to submit)
- Real-time feedback (green/red borders)
- Focus management

**Multiple Choice Mode** (`MultipleChoiceInput.tsx`)
- Smart distractor generation (similar length)
- Keyboard shortcuts (1-4 keys)
- Visual feedback (color-coded selections)
- Prevents accidental re-submissions

**Generator** (`multipleChoiceGenerator.ts`):
```typescript
generateWordMultipleChoiceOptions(
  correctAnswer: string,
  allWords: WordPair[],
  currentWord: WordPair,
  mode: LearningMode
): string[]

generateVerbMultipleChoiceOptions(
  correctAnswer: string,
  allVerbs: VerbPair[],
  currentVerb: VerbPair,
  currentForm: VerbForm
): string[]
```

### 6. Gamification

**Confetti Animations** (`ConfettiEffect.tsx`)
- Canvas-based particle system (canvas-confetti library)
- Multi-burst animation on correct answers
- Green/gold color palette
- Performance-optimized with cleanup

**Celebration Triggers**:
- Correct answer submission
- Synchronized with feedback state
- No animation on incorrect answers

### 7. Theme System

**Built-in Themes** (`ThemeContext.tsx`):
- **Default**: Ocean gradient (blue/cyan)
- **Duo**: Duolingo-inspired (green/white)
- **Dark/OLED**: Dark mode with true black

**Custom Theme Creator** (`CustomThemeDialog.tsx`):
- Live preview panel
- Full color customization (backgrounds, gradients, text, buttons)
- Advanced settings (collapsible)
- Persistent storage (localStorage)
- Color picker component (`ColorPicker.tsx`)

**Theme Structure** (`types/theme.ts`):
```typescript
ThemeConfig {
  colors: {
    background: string
    backgroundGradientFrom: string
    backgroundGradientTo: string
    cardBackground: string
    text: string
    textSecondary: string
    correct: string
    incorrect: string
    border: string
    // ... more colors
  }
}
```

### 8. Statistics & Analytics

**Session Stats** (ephemeral):
- Correct/total answers
- Current accuracy
- Current streak
- Hints used (total + questions with hints)
- Average hints per question

**All-Time Progress** (persisted):
- Total correct/total answers
- Best streak
- Words learned
- SRS statistics (reviewed today, new cards, mature/young/learning counts)
- Hint usage patterns

**Dashboards**:
- `StatsDashboard.tsx` - General analytics
- `SRSDashboard.tsx` - SRS-specific metrics

### 9. Data Persistence

**LocalStorage Keys** (`storage.ts`):
```
userProgress          - UserProgress object
wordProgress          - Word-specific data (known status)
verbProgress          - Verb-specific data
wordSRSData           - SRS data for words
verbSRSData           - SRS data for verbs
srsConfig             - SRS configuration (daily limits)
customTheme           - User-created theme
```

**Key Functions**:
```typescript
loadProgress(): UserProgress
updateProgress(progress: UserProgress): void
resetProgress(): void
applyKnownStatusToWords(words: WordPair[]): WordPair[]
applyWordSRSData(words: WordPair[]): WordPair[]
markWordAsKnown(wordId: string, known: boolean): void
loadSRSConfig(): SRSConfig
saveSRSConfig(config: SRSConfig): void
resetDailySRSStats(): void
```

## Important Implementation Details

### CSV Data Format

**dutch_common_words.csv**:
```csv
Dutch,English
hond,dog
kat,cat
huis,house
```

**dutch_irregular_verbs.csv**:
```csv
Infinitive,Imperfectum,Perfectum,English
zijn,was/waren,geweest,to be
hebben,had/hadden,gehad,to have
gaan,ging/gingen,gegaan,to go
```

### Answer Validation Logic

```typescript
// App.tsx handleSubmit()
1. Check if input matches correct answer (fuzzy match)
2. Calculate quality rating (correctness + hints used)
3. Update SRS data (srsAlgorithm.updateSRSCard)
4. Update session stats (correct, total, streak, hints)
5. Update user progress (persist to localStorage)
6. Show feedback (correct/incorrect)
7. Trigger confetti if correct
8. Load next question after 1 second delay
```

### SRS Integration Points

1. **Card Initialization**: `initializeCardsWithSRS()` - attaches SRS data to words/verbs
2. **Card Selection**: `getCardsByPriority()` - selects due cards first, then new cards
3. **Answer Submission**: `updateSRSCard()` - updates interval, ease factor, due date
4. **Dashboard**: `getCardCategoryCounts()` - shows new/learning/young/mature counts

### AI Hint Flow

1. **Configuration**: User sets Perplexity API key in `AIHintConfigDialog`
2. **Preloading**: When new question loads, next question's hint preloads in background
3. **Request**: User hovers over word → checks cache → fetches from API if needed
4. **Caching**: Response stored in `hintCache` (in-memory Map)
5. **Display**: `AIHintPopup` shows example sentence + explanation

### Multiple Choice Generation

1. **Collect candidates**: All words/verbs except current one
2. **Filter by length**: Similar length to correct answer (±2 characters)
3. **Random selection**: Pick 3 distractors
4. **Shuffle**: Randomize positions (correct answer + 3 distractors)
5. **Return**: Array of 4 options

## Testing Guidelines

### Test Coverage

**Existing Tests**:
- `src/components/InputField.test.tsx` - Input validation
- `src/components/ProgressIndicator.test.tsx` - Progress display
- `src/components/ModeToggle.test.tsx` - Mode switching
- `src/contexts/ThemeContext.test.tsx` - Theme management
- `src/contexts/AIHintContext.test.tsx` - AI hint caching
- `src/utils/fuzzyMatch.test.ts` - Fuzzy matching algorithm
- `src/utils/wordManager.test.ts` - Word selection
- `src/utils/verbManager.test.ts` - Verb selection
- `src/utils/srsScheduler.test.ts` - SRS scheduling
- `src/utils/hintGenerator.test.ts` - Hint generation
- `src/utils/multipleChoiceGenerator.test.ts` - MC generation
- `src/utils/hintFlow.integration.test.ts` - Full hint flow

**Testing Framework**: Vitest + @testing-library/react

**Run Tests**:
```bash
npm run test         # Watch mode
npm run test:run     # Single run
npm run test:ui      # Visual UI
```

## Common Development Tasks

### Adding a New Word Dataset

1. Create CSV file in `public/data/` with `Dutch,English` columns
2. Update `csvParser.ts` to load new file
3. Add dataset selector UI if needed

### Adding a New Theme

**Option 1: Built-in Theme**
1. Add theme config to `ThemeContext.tsx` themes object
2. Update theme type in `types/theme.ts`
3. Add option to `ThemeChooser.tsx`

**Option 2: Custom Theme** (already supported)
- Users can create via `CustomThemeDialog.tsx`
- Stored in localStorage as `customTheme`

### Modifying SRS Algorithm Parameters

Edit constants in `src/utils/srsAlgorithm.ts`:
```typescript
INITIAL_EASE_FACTOR = 2.5
MIN_EASE_FACTOR = 1.3
GRADUATING_INTERVAL = 1  // First success: 1 day
```

### Adding a New Hint Level

1. Update `HintLevel` type in `hintGenerator.ts`
2. Add case to `generateStaticHint()` function
3. Update hint button UI to show new level

### Customizing AI Hint Prompts

Edit prompt template in `src/services/aiHintService.ts`:
```typescript
const prompt = `Generate a simple A2-level example sentence...`;
```

### Modifying Fuzzy Match Tolerance

Change threshold in `fuzzyMatch.ts`:
```typescript
export function fuzzyMatch(
  input: string,
  target: string,
  threshold = 2  // Change this value
): boolean
```

## Troubleshooting

### Common Issues

**1. CSV Loading Fails**
- Check file path in `public/data/`
- Verify CSV format (columns, encoding)
- Check browser console for Papa Parse errors

**2. LocalStorage Full**
- Clear browser data
- Reduce SRS history length
- Implement storage quota management

**3. AI Hints Not Working**
- Verify Perplexity API key in settings
- Check API quota/rate limits
- Inspect network requests in DevTools

**4. SRS Cards Not Due**
- Check system date/time
- Verify `dueDate` timestamps in localStorage
- Call `resetDailySRSStats()` to reset

**5. Confetti Not Showing**
- Check canvas-confetti library import
- Verify `feedback === "correct"` state
- Inspect `ConfettiEffect` render conditions

### Debug Tools

**State Inspection**:
```typescript
// Add to App.tsx during development
useEffect(() => {
  console.log('Game State:', gameState);
  console.log('User Progress:', userProgress);
  console.log('SRS Config:', srsConfig);
}, [gameState, userProgress, srsConfig]);
```

**LocalStorage Inspection**:
```javascript
// Browser console
localStorage.getItem('userProgress')
localStorage.getItem('wordSRSData')
localStorage.getItem('srsConfig')
```

**Clear All Data**:
```javascript
// Browser console
localStorage.clear()
// Or use in-app reset button in StatsDashboard
```

## Performance Considerations

### Optimization Strategies

1. **CSV Loading**: Parsed once on mount, cached in state
2. **SRS Calculations**: Only run on answer submission
3. **AI Hints**: Cached + preloaded to reduce API calls
4. **Fuzzy Matching**: O(n²) but optimized for short strings
5. **LocalStorage**: Debounced writes, batch updates
6. **Theme Changes**: CSS variables for instant switching
7. **Confetti**: Canvas-based with proper cleanup

### Bundle Size Management

- **Code Splitting**: Not yet implemented (consider for future)
- **Tree Shaking**: Enabled via Vite
- **Dependencies**: Minimal, only essential libraries
- **Images**: GIF in `public/` folder (not bundled)

## Future Enhancement Ideas

See `ideas.md` and recent commit messages for planned features:
- More language pairs
- Audio pronunciation
- Vocabulary upload UI (`UploadWordsDialog.tsx` placeholder)
- Advanced SRS analytics
- Export/import progress data
- Collaborative learning features

## Key Algorithms Reference

### Levenshtein Distance (Fuzzy Matching)

```
1. Create matrix of size (len(s1)+1) × (len(s2)+1)
2. Initialize first row/column with indices
3. For each cell, calculate minimum of:
   - Insertion cost: cell[i-1][j] + 1
   - Deletion cost: cell[i][j-1] + 1
   - Substitution cost: cell[i-1][j-1] + (0 if chars match else 1)
4. Final cell contains edit distance
5. Accept if distance ≤ threshold (2)
```

### SM-2 Algorithm (SRS)

```
Quality rating: 0-5 based on correctness + hints

Ease Factor update:
  EF' = EF + (0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
  EF' = max(1.3, EF')

Interval update:
  If quality < 3: interval = 0, repetitions = 0
  If repetitions = 0: interval = 1
  If repetitions = 1: interval = 6
  If repetitions > 1: interval = previous_interval × EF

Next due date: now + (interval × 86400000 ms)
```

## Dependencies Overview

**Production**:
- `react` + `react-dom`: UI framework
- `papaparse`: CSV parsing
- `canvas-confetti`: Celebration animations
- `@tailwindcss/postcss`: Styling

**Development**:
- `typescript`: Type safety
- `vite`: Build tool + dev server
- `vitest`: Testing framework
- `@testing-library/react`: Component testing
- `eslint`: Code linting

**No external libraries for**:
- State management (using React Context)
- Routing (single-page app)
- HTTP client (using native fetch)
- Form validation (custom implementation)

## Git Workflow

**Main Branch**: `main`
**Recent Commits**:
- e638ade: Multiple new features (confetti, MC mode, custom themes, enhanced AI hints)
- 26c2e47: Confetti celebration effect
- 569c3f4: Multiple choice practice format
- efc27da: Huge update
- cfd3a77: AI hint context with caching/preloading

**Typical Commit Pattern**:
- Feature additions with comprehensive tests
- Documentation updates in markdown files
- Bug fixes with regression tests

## Contact & Documentation

**Primary Documentation**:
- `README.md` - User-facing documentation
- `SRS_SYSTEM.md` - SRS algorithm details
- `CLAUDE.md` - This file (AI assistant guide)

**Additional Docs**:
- `AI_SERVICE_IMPROVEMENTS.md` - AI hint service notes
- `A2_LEVEL_OPTIMIZATION.md` - Language level filtering
- `CORS_AND_PRODUCTION.md` - Deployment notes
- `ideas.md` - Future feature ideas

---

**Last Updated**: 2026-01-05
**Project Version**: 0.0.0 (pre-release)
**Maintained By**: Pavel Shnyrin
