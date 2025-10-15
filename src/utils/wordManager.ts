import type { WordPair, LearningMode } from '../types';
import { shuffleArray } from './csvParser';
import { generateHint, getInitialHintLevel, isValidHintLevel, type HintLevel } from './hintGenerator';
import { isWordKnown } from './storage';

export class WordManager {
  private words: WordPair[] = [];
  private currentIndex = 0;
  private shuffledWords: WordPair[] = [];
  private recentWords: WordPair[] = [];
  private readonly maxRecentWords = 5; // Prevent immediate repetition
  
  // Hint-related state
  private currentHintLevel: HintLevel = getInitialHintLevel();
  private hintsUsedForCurrentWord: HintLevel[] = [];
  private totalHintsUsed = 0;
  private questionsWithHints = 0;

  constructor(words: WordPair[]) {
    this.words = words;
    console.log('WordManager: Total words loaded:', words.length);
    console.log('WordManager: Known words count:', words.filter(w => w.known).length);
    console.log('WordManager: First 5 words with known status:', words.slice(0, 5).map(w => ({
      dutch: w.dutch,
      english: w.english,
      known: w.known
    })));
    this.shuffleWords();
  }

  private getUnknownWords(): WordPair[] {
    const unknownWords = this.words.filter(word => !word.known);
    console.log('WordManager: Unknown words count:', unknownWords.length);
    return unknownWords;
  }

  private shuffleWords(): void {
    const unknownWords = this.getUnknownWords();
    this.shuffledWords = shuffleArray(unknownWords);
    this.currentIndex = 0;
  }

  getCurrentWord(): WordPair | null {
    if (this.shuffledWords.length === 0) return null;
    return this.shuffledWords[this.currentIndex];
  }

  getNextWord(): WordPair | null {
    if (this.shuffledWords.length === 0) return null;

    // Add current word to recent words
    const currentWord = this.shuffledWords[this.currentIndex];
    this.recentWords.push(currentWord);
    
    // Keep only the last few words to prevent immediate repetition
    if (this.recentWords.length > this.maxRecentWords) {
      this.recentWords.shift();
    }

    // Move to next word
    this.currentIndex++;
    
    // If we've gone through all words, reshuffle
    if (this.currentIndex >= this.shuffledWords.length) {
      this.shuffleWords();
    }

    // Try to avoid recent words if possible
    let attempts = 0;
    const maxAttempts = Math.min(10, this.shuffledWords.length);
    
    while (attempts < maxAttempts) {
      const nextWord = this.shuffledWords[this.currentIndex];
      const isRecent = this.recentWords.some(recent => 
        recent.dutch === nextWord.dutch && recent.english === nextWord.english
      );
      
      if (!isRecent || this.shuffledWords.length <= this.maxRecentWords) {
        return nextWord;
      }
      
      // Try next word
      this.currentIndex = (this.currentIndex + 1) % this.shuffledWords.length;
      attempts++;
    }

    // If we couldn't find a non-recent word, just return the current one
    return this.shuffledWords[this.currentIndex];
  }

  getWordToDisplay(word: WordPair, mode: LearningMode): string {
    return mode === 'nl-en' ? word.dutch : word.english;
  }

  getCorrectAnswer(word: WordPair, mode: LearningMode): string {
    return mode === 'nl-en' ? word.english : word.dutch;
  }

  getTotalWordsCount(): number {
    return this.words.length;
  }

  getUnknownWordsCount(): number {
    return this.getUnknownWords().length;
  }

  markWordAsKnown(wordToMark: WordPair): void {
    // Find the word in the original words array and update it
    const wordIndex = this.words.findIndex(
      word => word.dutch === wordToMark.dutch && word.english === wordToMark.english
    );
    
    if (wordIndex !== -1) {
      this.words[wordIndex] = { ...this.words[wordIndex], known: true };
      // Re-shuffle to exclude the newly marked word
      this.shuffleWords();
      // Reset recent words to avoid issues with filtering
      this.recentWords = [];
    }
  }

  refreshKnownStatus(): void {
    // Update the known status of all words based on current localStorage
    this.words = this.words.map(word => ({
      ...word,
      // Check localStorage for current known status
      // This will handle both newly marked and newly unmarked words
      known: isWordKnown(word)
    }));
  }

  reset(): void {
    this.refreshKnownStatus(); // Refresh known status from localStorage
    this.shuffleWords();
    this.recentWords = [];
    this.resetHintState();
  }

  // Hint-related methods
  getHintForLevel(answer: string, level: HintLevel): string {
    try {
      // Validate inputs
      if (!answer || typeof answer !== 'string') {
        console.warn('WordManager: Invalid answer provided for hint generation');
        return '';
      }
      
      if (!isValidHintLevel(level)) {
        console.warn('WordManager: Invalid hint level provided:', level);
        return '';
      }
      
      return generateHint(answer, level);
    } catch (error) {
      console.error('WordManager: Error generating hint:', error);
      return '';
    }
  }

  getCurrentHintLevel(): HintLevel {
    try {
      return this.currentHintLevel;
    } catch (error) {
      console.error('WordManager: Error getting current hint level:', error);
      return getInitialHintLevel();
    }
  }

  getHintForCurrentLevel(word: WordPair, mode: LearningMode, level: HintLevel): string {
    try {
      // Validate inputs
      if (!word || typeof word !== 'object') {
        console.warn('WordManager: Invalid word provided for hint generation');
        return '';
      }
      
      if (!mode || (mode !== 'nl-en' && mode !== 'en-nl')) {
        console.warn('WordManager: Invalid mode provided for hint generation');
        return '';
      }
      
      if (!isValidHintLevel(level)) {
        console.warn('WordManager: Invalid hint level provided:', level);
        return '';
      }
      
      const correctAnswer = this.getCorrectAnswer(word, mode);
      const hintText = this.getHintForLevel(correctAnswer, level);
      return hintText;
    } catch (error) {
      console.error('WordManager: Error generating hint for current level:', error);
      return '';
    }
  }

  recordHintUsage(level: HintLevel): void {
    try {
      // Validate input
      if (!isValidHintLevel(level)) {
        console.warn('WordManager: Invalid hint level provided for recording:', level);
        return;
      }
      
      // Track if this is the first hint used for this word
      if (this.hintsUsedForCurrentWord.length === 0) {
        this.questionsWithHints++;
      }
      
      // Add the hint level to the current word's hint usage
      this.hintsUsedForCurrentWord.push(level);
      this.totalHintsUsed++;
      
      // Don't advance hint level here - let the HintButton manage it
    } catch (error) {
      console.error('WordManager: Error recording hint usage:', error);
    }
  }

  resetHintState(): void {
    this.currentHintLevel = getInitialHintLevel();
    this.hintsUsedForCurrentWord = [];
  }

  // Move to next word and reset hint state
  getNextWordWithHintReset(): WordPair | null {
    const nextWord = this.getNextWord();
    this.resetHintState();
    return nextWord;
  }

  // Statistics methods
  getHintUsageStats(): {
    totalHintsUsed: number;
    questionsWithHints: number;
    averageHintsPerQuestion: number;
    hintsUsedForCurrentWord: HintLevel[];
  } {
    try {
      return {
        totalHintsUsed: this.totalHintsUsed || 0,
        questionsWithHints: this.questionsWithHints || 0,
        averageHintsPerQuestion: this.questionsWithHints > 0 ? this.totalHintsUsed / this.questionsWithHints : 0,
        hintsUsedForCurrentWord: [...(this.hintsUsedForCurrentWord || [])]
      };
    } catch (error) {
      console.error('WordManager: Error getting hint usage stats:', error);
      return {
        totalHintsUsed: 0,
        questionsWithHints: 0,
        averageHintsPerQuestion: 0,
        hintsUsedForCurrentWord: []
      };
    }
  }

  // Multiple choice methods
  getMultipleChoiceOptions(word: WordPair, mode: LearningMode): string[] {
    const correctAnswer = this.getCorrectAnswer(word, mode);
    const distractors = this.generateDistractors(word, mode, 3);
    
    // Combine correct answer with distractors and shuffle
    const allOptions = [correctAnswer, ...distractors];
    return shuffleArray(allOptions);
  }

  private generateDistractors(word: WordPair, mode: LearningMode, count: number): string[] {
    const correctAnswer = this.getCorrectAnswer(word, mode);
    const distractors: string[] = [];
    const allWords = this.words;
    
    // Filter out the current word and get potential distractors
    const potentialDistractors = allWords
      .filter(w => {
        const answer = this.getCorrectAnswer(w, mode);
        return answer !== correctAnswer && !distractors.includes(answer);
      })
      .map(w => this.getCorrectAnswer(w, mode));
    
    // Shuffle and take the required count
    const shuffled = shuffleArray(potentialDistractors);
    
    // Take the first 'count' items
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      distractors.push(shuffled[i]);
    }
    
    // If we don't have enough distractors, generate some fallback ones
    while (distractors.length < count && allWords.length > 0) {
      const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
      const answer = this.getCorrectAnswer(randomWord, mode);
      if (answer !== correctAnswer && !distractors.includes(answer)) {
        distractors.push(answer);
      }
    }
    
    return distractors;
  }
}