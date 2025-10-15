import type { WordPair, VerbPair, LearningMode, VerbForm } from '../types';

/**
 * Generate 3 distractor options (wrong answers) for a word
 */
export function generateWordDistractors(
  _currentWord: WordPair,
  allWords: WordPair[],
  mode: LearningMode,
  correctAnswer: string
): string[] {
  const distractors: string[] = [];
  const usedAnswers = new Set([correctAnswer]);
  
  // Get all potential wrong answers
  const potentialDistractors = allWords
    .filter(word => {
      const answer = mode === 'nl-en' ? word.english : word.dutch;
      return answer !== correctAnswer && !usedAnswers.has(answer);
    })
    .map(word => mode === 'nl-en' ? word.english : word.dutch);
  
  // Shuffle the potential distractors
  const shuffled = shuffleArray([...potentialDistractors]);
  
  // Take first 3 unique distractors
  for (const distractor of shuffled) {
    if (distractors.length >= 3) break;
    if (!usedAnswers.has(distractor)) {
      distractors.push(distractor);
      usedAnswers.add(distractor);
    }
  }
  
  // If we don't have enough distractors (shouldn't happen with a decent word list),
  // fill with placeholders
  while (distractors.length < 3) {
    distractors.push(`[Option ${distractors.length + 1}]`);
  }
  
  return distractors;
}

/**
 * Generate 3 distractor options (wrong answers) for a verb
 */
export function generateVerbDistractors(
  currentVerb: VerbPair,
  allVerbs: VerbPair[],
  verbForm: VerbForm,
  correctAnswer: string
): string[] {
  const distractors: string[] = [];
  const usedAnswers = new Set([correctAnswer]);
  
  // Strategy 1: Use the same verb form from other verbs (most realistic distractors)
  const sameFormDistractors = allVerbs
    .filter(verb => verb !== currentVerb)
    .map(verb => verb[verbForm])
    .filter(answer => answer !== correctAnswer && !usedAnswers.has(answer));
  
  const shuffledSameForm = shuffleArray([...sameFormDistractors]);
  
  // Take up to 2 distractors from same form
  for (let i = 0; i < Math.min(2, shuffledSameForm.length); i++) {
    const distractor = shuffledSameForm[i];
    if (!usedAnswers.has(distractor)) {
      distractors.push(distractor);
      usedAnswers.add(distractor);
    }
  }
  
  // Strategy 2: If we need more, use different forms from the same verb (common mistake)
  if (distractors.length < 3) {
    const otherFormsFromSameVerb: string[] = [];
    const allForms: VerbForm[] = ['dutch_infinitive', 'imperfectum_single', 'imperfectum_plural', 'perfectum'];
    
    for (const form of allForms) {
      if (form !== verbForm) {
        const formValue = currentVerb[form];
        if (formValue && formValue !== correctAnswer && !usedAnswers.has(formValue)) {
          otherFormsFromSameVerb.push(formValue);
        }
      }
    }
    
    const shuffledOtherForms = shuffleArray(otherFormsFromSameVerb);
    for (const distractor of shuffledOtherForms) {
      if (distractors.length >= 3) break;
      if (!usedAnswers.has(distractor)) {
        distractors.push(distractor);
        usedAnswers.add(distractor);
      }
    }
  }
  
  // Strategy 3: If still need more, use any form from other verbs
  if (distractors.length < 3) {
    const anyFormDistractors: string[] = [];
    const allForms: VerbForm[] = ['dutch_infinitive', 'imperfectum_single', 'imperfectum_plural', 'perfectum'];
    
    for (const verb of allVerbs) {
      if (verb === currentVerb) continue;
      for (const form of allForms) {
        const formValue = verb[form];
        if (formValue && !usedAnswers.has(formValue)) {
          anyFormDistractors.push(formValue);
        }
      }
    }
    
    const shuffledAny = shuffleArray(anyFormDistractors);
    for (const distractor of shuffledAny) {
      if (distractors.length >= 3) break;
      if (!usedAnswers.has(distractor)) {
        distractors.push(distractor);
        usedAnswers.add(distractor);
      }
    }
  }
  
  // Fallback: If we still don't have enough (shouldn't happen)
  while (distractors.length < 3) {
    distractors.push(`[Option ${distractors.length + 1}]`);
  }
  
  return distractors;
}

/**
 * Generate 4 options including the correct answer and 3 distractors
 * Returns them in a shuffled order
 */
export function generateMultipleChoiceOptions(
  correctAnswer: string,
  distractors: string[]
): string[] {
  const options = [correctAnswer, ...distractors.slice(0, 3)];
  return shuffleArray(options);
}

/**
 * Simple Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
