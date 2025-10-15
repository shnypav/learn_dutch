# Spaced Repetition System (SRS) Documentation

## Overview

This Dutch language learning app implements the **SM-2 (SuperMemo 2)** algorithm for spaced repetition. The system optimizes learning by scheduling reviews at increasing intervals based on how well you know each card (word or verb).

## How It Works

### Core Concept

Cards are reviewed at intervals that increase each time you answer correctly. If you answer incorrectly, the interval resets and you start the learning process again. The better you know a card, the less frequently you'll see it.

## Algorithm: SM-2 (SuperMemo 2)

### Quality Ratings (0-5)

Every review is assigned a quality rating based on:

- **Correctness**: Whether you answered correctly
- **Hints used**: How many hints you needed

| Quality | Meaning                    | Condition                     |
| ------- | -------------------------- | ----------------------------- |
| 5       | Perfect recall             | Correct answer, no hints      |
| 4       | Correct with hesitation    | Correct answer, 1 hint used   |
| 3       | Correct with difficulty    | Correct answer, 2+ hints used |
| 2       | Failed with multiple hints | Wrong answer, 2+ hints used   |
| 1       | Failed with one hint       | Wrong answer, 1 hint used     |
| 0       | Complete failure           | Wrong answer, no hints        |

**Quality < 3**: Card fails and resets to learning phase
**Quality ≥ 3**: Card passes and interval increases

### Ease Factor

Each card has an **ease factor** (starting at 2.5, minimum 1.3) that determines how quickly intervals grow.

**Formula**:

```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
```

- Higher quality ratings increase the ease factor (easier cards)
- Lower quality ratings decrease the ease factor (harder cards)
- Minimum ease factor is capped at 1.3 to prevent intervals from shrinking too much

### Interval Calculation

The interval determines when you'll see the card next:

1. **First successful review**: 1 day
2. **Second successful review**: 6 days
3. **Subsequent reviews**: `previous_interval × ease_factor` (rounded)

**Example progression** (assuming quality 5, starting EF = 2.5):

- Review 1: Success → Next review in 1 day
- Review 2: Success → Next review in 6 days
- Review 3: Success → Next review in ~15 days (6 × 2.5)
- Review 4: Success → Next review in ~38 days (15 × 2.5)
- And so on...

**Failed reviews (quality < 3)**:

- Interval resets to 0
- Repetitions reset to 0
- Card returns to learning phase

## Card Lifecycle

### Card Categories

Cards are categorized based on their interval:

| Category     | Criteria            | Description                            |
| ------------ | ------------------- | -------------------------------------- |
| **New**      | `isNew = true`      | Never reviewed                         |
| **Learning** | `interval = 0`      | Failed recent review, needs relearning |
| **Young**    | `1 ≤ interval ≤ 21` | Recently learned, still consolidating  |
| **Mature**   | `interval > 21`     | Well-learned, longer intervals         |

### Card States

```
┌──────────┐
│   NEW    │ (Never reviewed)
└────┬─────┘
     │ First review
     ▼
┌──────────┐
│ LEARNING │ (interval = 0)
└────┬─────┘
     │ Quality ≥ 3
     ▼
┌──────────┐
│  YOUNG   │ (1-21 days)
└────┬─────┘
     │ Quality ≥ 3 (multiple times)
     ▼
┌──────────┐
│  MATURE  │ (21+ days)
└──────────┘

Note: Any failed review (quality < 3) returns card to LEARNING
```

## Review Scheduling

### Priority System

Cards are reviewed in this order:

1. **Due cards** (oldest first - most overdue)
2. **New cards** (randomly shuffled, up to daily limit)

### Configuration

- **Daily new card limit**: Default 20 (adjustable 1-100)
- **Max reviews per session**: Optional (unlimited by default)

### Review Statistics

The system tracks:

- **Due now**: Cards overdue for review
- **Due today**: Cards due by end of today
- **Due this week**: Cards due within 7 days
- **New cards available**: Cards never reviewed
- **Cards reviewed today**: Daily progress counter
- **Retention rate**: Percentage of successful reviews

## Data Structure

### SRSCardData

Each card (word or verb) has an `srsData` object:

```typescript
{
  interval: number;          // Days until next review
  repetitions: number;       // Successful reviews in a row
  easeFactor: number;        // Difficulty multiplier (2.5 start, 1.3 min)
  dueDate: number;           // Next review timestamp (milliseconds)
  lastReviewDate: number | null; // Last review timestamp
  reviewHistory: ReviewRecord[]; // Past reviews
  isNew: boolean;            // Never reviewed?
}
```

### ReviewRecord

Each review is logged:

```typescript
{
  date: number; // Timestamp of review
  quality: 0 - 5; // Quality rating
  interval: number; // Interval set after this review
}
```

## Usage Example

### Scenario 1: Learning a New Word

1. **First exposure** (New card)

   - User sees "huis" → "house"
   - Answers correctly without hints → Quality 5
   - Next review: 1 day

2. **Second review** (1 day later)

   - Answers correctly without hints → Quality 5
   - Next review: 6 days

3. **Third review** (6 days later)

   - Uses 1 hint, answers correctly → Quality 4
   - EF slightly decreased
   - Next review: ~13 days (6 × 2.2)

4. **Fourth review** (13 days later)
   - Perfect recall → Quality 5
   - EF increased back
   - Next review: ~30 days

### Scenario 2: Forgetting a Word

1. **Review a mature card** (interval = 45 days)

   - Answers incorrectly → Quality 0
   - Interval resets to 0
   - Card returns to **Learning** phase

2. **Re-learning**
   - Start from 1-day interval again
   - Must rebuild interval through successful reviews

## Implementation Files

### Core Algorithm

- **[`src/types/srs.ts`](fleet-file://r878m8kt134g3f1p6cqm/Users/Pavel.Shnyrin/work/mine/fresher/src/types/srs.ts?type=file&root=%2FUsers%2FPavel.Shnyrin%2Fwork%2Fmine%2Ffresher)**: Type definitions
- **[`src/utils/srsAlgorithm.ts`](fleet-file://r878m8kt134g3f1p6cqm/Users/Pavel.Shnyrin/work/mine/fresher/src/utils/srsAlgorithm.ts?type=file&root=%2FUsers%2FPavel.Shnyrin%2Fwork%2Fmine%2Ffresher)**: SM-2 algorithm implementation
- **[`src/utils/srsScheduler.ts`](fleet-file://r878m8kt134g3f1p6cqm/Users/Pavel.Shnyrin/work/mine/fresher/src/utils/srsScheduler.ts?type=file&root=%2FUsers%2FPavel.Shnyrin%2Fwork%2Fmine%2Ffresher)**: Review scheduling logic

### UI Components

- **[`src/components/SRSDashboard.tsx`](fleet-file://r878m8kt134g3f1p6cqm/Users/Pavel.Shnyrin/work/mine/fresher/src/components/SRSDashboard.tsx?type=file&root=%2FUsers%2FPavel.Shnyrin%2Fwork%2Fmine%2Ffresher)**: Statistics display
- **[`src/components/SRSSettingsDialog.tsx`](fleet-file://r878m8kt134g3f1p6cqm/Users/Pavel.Shnyrin/work/mine/fresher/src/components/SRSSettingsDialog.tsx?type=file&root=%2FUsers%2FPavel.Shnyrin%2Fwork%2Fmine%2Ffresher)**: Configuration UI

### Key Functions

#### Algorithm Functions (`srsAlgorithm.ts`)

- `initializeSRSCard()`: Create new card data
- `getQualityFromPerformance()`: Convert answer → quality rating
- `calculateNextReview()`: Apply SM-2 algorithm
- `updateSRSCard()`: Main update function
- `isCardDue()`: Check if card needs review
- `getCardCategory()`: Get card's lifecycle category
- `calculateRetentionRate()`: Calculate success rate

#### Scheduler Functions (`srsScheduler.ts`)

- `getDueCards()`: Get cards due for review
- `getNewCards()`: Get new cards to introduce
- `getCardsByPriority()`: Get cards sorted by priority
- `getUpcomingReviews()`: Get review statistics
- `getCardCategoryCounts()`: Count cards by category
- `getCardsByCategory()`: Filter cards by category

## Benefits of This System

1. **Optimized learning**: Reviews are timed for maximum retention
2. **Efficient use of time**: Focus on cards you're about to forget
3. **Adaptive difficulty**: Intervals adjust based on your performance
4. **Progress tracking**: Clear metrics on learning progress
5. **Hint-aware**: Using hints appropriately affects scheduling
6. **Prevents cramming**: Spaced intervals promote long-term retention

## Algorithm Parameters

Constants defined in `srsAlgorithm.ts:8-13`:

```typescript
INITIAL_EASE_FACTOR = 2.5; // Starting ease factor
MIN_EASE_FACTOR = 1.3; // Minimum ease factor
GRADUATING_INTERVAL = 1; // First success: 1 day
EASY_INTERVAL = 4; // Not currently used
MILLISECONDS_PER_DAY = 86400000;
```

Default configuration in `srsScheduler.ts:14-17`:

```typescript
dailyNewCardLimit = 20; // New cards per day
maxReviewsPerSession = undefined; // Unlimited reviews
```

## Testing

Unit tests are available at:

- **[`src/utils/srsScheduler.test.ts`](fleet-file://r878m8kt134g3f1p6cqm/Users/Pavel.Shnyrin/work/mine/fresher/src/utils/srsScheduler.test.ts?type=file&root=%2FUsers%2FPavel.Shnyrin%2Fwork%2Fmine%2Ffresher)**: Tests for scheduling logic

Run tests with:

```bash
npm run test
```

## References

- **SuperMemo 2 Algorithm**: Original algorithm by Piotr Wozniak (1988)
- Algorithm details: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
