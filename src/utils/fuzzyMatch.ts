// Calculate Levenshtein distance between two strings
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

// Normalize string for comparison
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " "); // Normalize whitespace
};

// Check if two strings are similar enough
export const fuzzyMatch = (
  userInput: string,
  correctAnswer: string,
  threshold: number = 2,
): boolean => {
  if (!userInput || !correctAnswer) {
    return false;
  }

  const normalizedInput = normalizeString(userInput);
  const normalizedAnswer = normalizeString(correctAnswer);

  // Exact match after normalization
  if (normalizedInput === normalizedAnswer) {
    return true;
  }

  // Handle multiple correct answers separated by '/' or ','
  const possibleAnswers = normalizedAnswer
    .split(/[\/,]/)
    .map((answer) => answer.trim());

  for (const answer of possibleAnswers) {
    if (normalizedInput === answer) {
      return true;
    }

    // Check Levenshtein distance
    const distance = levenshteinDistance(normalizedInput, answer);
    const maxLength = Math.max(normalizedInput.length, answer.length);

    // Allow up to 2 character differences, but not more than 30% of the word length
    if (distance <= threshold && distance <= maxLength * 0.3) {
      return true;
    }
  }

  return false;
};

// Get similarity score between 0 and 1
export const getSimilarityScore = (str1: string, str2: string): number => {
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  const maxLength = Math.max(normalized1.length, normalized2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(normalized1, normalized2);
  return 1 - distance / maxLength;
};
