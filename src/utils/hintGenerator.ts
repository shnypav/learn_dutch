/**
 * Hint generation utility for progressive assistance in language learning exercises
 */

export type HintLevel = 1 | 2 | 3 | 4;

/**
 * Generates a hint for the given answer at the specified level
 * @param answer - The correct answer to generate hints for
 * @param level - The hint level (1-4)
 * @returns The hint string for the specified level
 */
export function generateHint(answer: string, level: HintLevel): string {
  // Handle empty or null answers
  if (!answer || answer.trim().length === 0) {
    return "";
  }

  const trimmedAnswer = answer.trim();
  const length = trimmedAnswer.length;

  // Handle single character answers - first hint shows complete answer
  if (length === 1) {
    return trimmedAnswer;
  }

  // Handle two character answers - third hint shows both characters
  if (length === 2) {
    switch (level) {
      case 1:
        return trimmedAnswer[0];
      case 2:
        return trimmedAnswer[0] + "*";
      case 3:
      case 4:
        return trimmedAnswer;
      default:
        return trimmedAnswer[0];
    }
  }

  // Handle answers with 3 or more characters
  switch (level) {
    case 1:
      // Show first letter only
      return trimmedAnswer[0];

    case 2:
      // Show first letter + asterisks for remaining letters
      return trimmedAnswer[0] + createAsteriskPattern(trimmedAnswer.slice(1));

    case 3:
      // Show first letter + asterisks + last letter
      if (length === 3) {
        return trimmedAnswer[0] + "*" + trimmedAnswer[length - 1];
      }
      return (
        trimmedAnswer[0] +
        createAsteriskPattern(trimmedAnswer.slice(1, -1)) +
        trimmedAnswer[length - 1]
      );

    case 4:
      // Show complete answer
      return trimmedAnswer;

    default:
      return trimmedAnswer[0];
  }
}

/**
 * Creates an asterisk pattern for a string, preserving spaces and special characters
 * @param text - The text to convert to asterisk pattern
 * @returns String with letters replaced by asterisks, spaces and special chars preserved
 */
function createAsteriskPattern(text: string): string {
  return text.replace(/[a-zA-Z]/g, "*");
}

/**
 * Validates if a hint level is valid
 * @param level - The level to validate
 * @returns True if the level is valid (1-4)
 */
export function isValidHintLevel(level: number): level is HintLevel {
  return level >= 1 && level <= 4 && Number.isInteger(level);
}

/**
 * Gets the next hint level, or returns current level if at maximum
 * @param currentLevel - The current hint level
 * @returns The next hint level
 */
export function getNextHintLevel(currentLevel: HintLevel): HintLevel {
  return Math.min(currentLevel + 1, 4) as HintLevel;
}

/**
 * Resets hint level to initial state
 * @returns The initial hint level (1)
 */
export function getInitialHintLevel(): HintLevel {
  return 1;
}
