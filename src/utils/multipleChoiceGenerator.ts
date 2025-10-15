import type { WordPair, VerbPair, VerbForm, LearningMode } from "../types";

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get words that can serve as distractors for multiple choice
 * Filters by similar length and complexity
 */
export function getDistractorWords(
  allWords: WordPair[],
  currentWord: WordPair,
  mode: LearningMode,
  count: number = 3,
): string[] {
  const correctAnswer =
    mode === "nl-en" ? currentWord.english : currentWord.dutch;
  const correctLength = correctAnswer.length;

  // Get all potential distractors (exclude the current word)
  const potentialDistractors = allWords
    .filter(
      (word) =>
        word.dutch !== currentWord.dutch &&
        word.english !== currentWord.english,
    )
    .map((word) => (mode === "nl-en" ? word.english : word.dutch));

  // Remove duplicates
  const uniqueDistractors = [...new Set(potentialDistractors)];

  // Prefer words with similar length (within 30% difference)
  const similarLengthDistractors = uniqueDistractors.filter((word) => {
    const lengthDiff = Math.abs(word.length - correctLength);
    return lengthDiff <= correctLength * 0.3;
  });

  // Use similar length words if we have enough, otherwise use all
  const candidatePool =
    similarLengthDistractors.length >= count
      ? similarLengthDistractors
      : uniqueDistractors;

  // Shuffle and take the required count
  const shuffled = shuffle(candidatePool);
  return shuffled.slice(0, count);
}

/**
 * Get verb forms that can serve as distractors for multiple choice
 * Returns forms of the same type from different verbs
 */
export function getDistractorVerbs(
  allVerbs: VerbPair[],
  currentVerb: VerbPair,
  verbForm: VerbForm,
  count: number = 3,
): string[] {
  const correctAnswer = currentVerb[verbForm];

  // Get all potential distractors (exclude the current verb)
  const potentialDistractors = allVerbs
    .filter(
      (verb) =>
        verb.dutch_infinitive !== currentVerb.dutch_infinitive &&
        verb.english_infinitive !== currentVerb.english_infinitive,
    )
    .map((verb) => verb[verbForm]);

  // Remove duplicates
  const uniqueDistractors = [...new Set(potentialDistractors)];

  // Filter out the correct answer (shouldn't happen, but just in case)
  const validDistractors = uniqueDistractors.filter(
    (distractor) => distractor !== correctAnswer,
  );

  // Shuffle and take the required count
  const shuffled = shuffle(validDistractors);
  return shuffled.slice(0, count);
}

/**
 * Generate multiple choice options for a word
 * Returns array of 4 shuffled options (1 correct + 3 distractors)
 */
export function generateWordMultipleChoiceOptions(
  allWords: WordPair[],
  currentWord: WordPair,
  mode: LearningMode,
): string[] {
  const correctAnswer =
    mode === "nl-en" ? currentWord.english : currentWord.dutch;
  const distractors = getDistractorWords(allWords, currentWord, mode, 3);

  // Combine correct answer with distractors
  const options = [correctAnswer, ...distractors];

  // Ensure we have exactly 4 unique options
  const uniqueOptions = [...new Set(options)];

  // If we don't have enough unique options, pad with generic fallbacks
  while (uniqueOptions.length < 4) {
    uniqueOptions.push(`Option ${uniqueOptions.length + 1}`);
  }

  // Shuffle the options
  return shuffle(uniqueOptions.slice(0, 4));
}

/**
 * Generate multiple choice options for a verb form
 * Returns array of 4 shuffled options (1 correct + 3 distractors)
 */
export function generateVerbMultipleChoiceOptions(
  allVerbs: VerbPair[],
  currentVerb: VerbPair,
  verbForm: VerbForm,
): string[] {
  const correctAnswer = currentVerb[verbForm];
  const distractors = getDistractorVerbs(allVerbs, currentVerb, verbForm, 3);

  // Combine correct answer with distractors
  const options = [correctAnswer, ...distractors];

  // Ensure we have exactly 4 unique options
  const uniqueOptions = [...new Set(options)];

  // If we don't have enough unique options, pad with generic fallbacks
  while (uniqueOptions.length < 4) {
    uniqueOptions.push(`Option ${uniqueOptions.length + 1}`);
  }

  // Shuffle the options
  return shuffle(uniqueOptions.slice(0, 4));
}
