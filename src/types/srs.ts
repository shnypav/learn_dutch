// SM-2 quality rating (0-5)
// 0-2: Failed, needs review
// 3: Passed with difficulty
// 4: Passed with some hesitation
// 5: Perfect recall
export type SRSQuality = 0 | 1 | 2 | 3 | 4 | 5;

export type ReviewRecord = {
  date: number; // timestamp
  quality: SRSQuality;
  interval: number; // days
};

export type SRSCardData = {
  interval: number; // Days until next review
  repetitions: number; // Number of successful reviews
  easeFactor: number; // Difficulty multiplier (starts at 2.5, min 1.3)
  dueDate: number; // Next review timestamp
  lastReviewDate: number | null; // Last review timestamp
  reviewHistory: ReviewRecord[]; // Past reviews with quality ratings
  isNew: boolean; // True if card has never been reviewed
};
