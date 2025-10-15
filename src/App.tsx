import { useState, useEffect, useCallback, useRef } from 'react';
import type { LearningMode, GameState, UserProgress, SessionStats, ContentType, VerbMode, PracticeMode, WordPair } from './types';
import { loadCSVData, loadVerbData } from './utils/csvParser';
import { fuzzyMatch } from './utils/fuzzyMatch';
import { WordManager } from './utils/wordManager';
import { VerbManager } from './utils/verbManager';
import { loadProgress, updateProgress, resetProgress, applyKnownStatusToWords, markWordAsKnown as persistMarkWordAsKnown } from './utils/storage';
import { useTheme } from './contexts/ThemeContext';
import type { HintLevel } from './utils/hintGenerator';
import { generateWordDistractors, generateVerbDistractors, generateMultipleChoiceOptions } from './utils/multipleChoiceGenerator';

// Components
import WordCard from './components/WordCard';
import VerbCard from './components/VerbCard';
import InputField, { type InputFieldRef } from './components/InputField';
import MultipleChoiceInput from './components/MultipleChoiceInput';
import PracticeModeSwitcher from './components/PracticeModeSwitcher';
import ModeToggle from './components/ModeToggle';
import ContentTypeSwitcher from './components/ContentTypeSwitcher';
import VerbModeSelector from './components/VerbModeSelector';
import ProgressIndicator from './components/ProgressIndicator';
import StatsDashboard from './components/StatsDashboard';
import ThemeChooser from './components/ThemeChooser';
import AIHintConfigDialog from './components/AIHintConfigDialog';

function App() {
  const { theme, setTheme } = useTheme();
  const [gameState, setGameState] = useState<GameState>({
    currentWord: null,
    currentVerb: null,
    mode: 'nl-en',
    contentType: 'words',
    verbMode: 'random',
    practiceMode: 'type',
    currentVerbForm: null,
    feedback: null,
    sessionStats: { correct: 0, total: 0, accuracy: 0, streak: 0, hintsUsed: 0, questionsWithHints: 0, averageHintsPerQuestion: 0 },
    isLoading: true,
    error: null
  });
  
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [currentHintText, setCurrentHintText] = useState<string>('');
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const inputFieldRef = useRef<InputFieldRef>(null);

  const [userProgress, setUserProgress] = useState<UserProgress>(loadProgress());
  const [wordManager, setWordManager] = useState<WordManager | null>(null);
  const [verbManager, setVerbManager] = useState<VerbManager | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Initialize the app and load CSV data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setGameState(prev => ({ ...prev, isLoading: true, error: null }));

        // Load both words and verbs data
        const [words, verbs] = await Promise.all([
          loadCSVData('/data/dutch_common_words.csv'),
          loadVerbData('/data/dutch_irregular_verbs.csv')
        ]);

        // Apply known status to words from localStorage
        const wordsWithKnownStatus = applyKnownStatusToWords(words);

        console.log('Loaded words:', wordsWithKnownStatus.length);
        console.log('Loaded verbs:', verbs.length);
        console.log('Words after applying localStorage status:', wordsWithKnownStatus.slice(0, 5).map(w => ({
          dutch: w.dutch,
          english: w.english,
          known: w.known
        })));

        const wordMgr = new WordManager(wordsWithKnownStatus);
        const verbMgr = new VerbManager(verbs);

        setWordManager(wordMgr);
        setVerbManager(verbMgr);

        const firstWord = wordMgr.getCurrentWord();
        setGameState(prev => ({
          ...prev,
          currentWord: firstWord,
          isLoading: false
        }));
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setGameState(prev => ({
          ...prev,
          error: 'Failed to load vocabulary data. Please refresh the page.',
          isLoading: false
        }));
      }
    };

    initializeApp();
  }, []);

  // Calculate session statistics
  const updateSessionStats = useCallback((stats: SessionStats): SessionStats => {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const averageHintsPerQuestion = stats.total > 0 ? stats.hintsUsed / stats.total : 0;
    return { ...stats, accuracy, averageHintsPerQuestion };
  }, []);

  // Handle answer submission
  const handleAnswerSubmit = useCallback((userAnswer: string) => {
    if (gameState.contentType === 'words') {
      if (!gameState.currentWord || !wordManager) return;

      const correctAnswer = wordManager.getCorrectAnswer(gameState.currentWord, gameState.mode);
      const isCorrect = fuzzyMatch(userAnswer, correctAnswer);

      // Get hint statistics from manager
      const hintStats = wordManager.getHintUsageStats();
      const hintsUsedForCurrentWord = hintStats.hintsUsedForCurrentWord.length;

      // Update session stats
      const newSessionStats = updateSessionStats({
        correct: gameState.sessionStats.correct + (isCorrect ? 1 : 0),
        total: gameState.sessionStats.total + 1,
        streak: isCorrect ? gameState.sessionStats.streak + 1 : 0,
        accuracy: 0, // Will be calculated in updateSessionStats
        hintsUsed: gameState.sessionStats.hintsUsed + hintsUsedForCurrentWord,
        questionsWithHints: gameState.sessionStats.questionsWithHints + (hintsUsedForCurrentWord > 0 ? 1 : 0),
        averageHintsPerQuestion: 0 // Will be calculated in updateSessionStats
      });

      // Update user progress
      const newProgress = updateProgress(userProgress, isCorrect, newSessionStats.streak, hintsUsedForCurrentWord);
      setUserProgress(newProgress);

      // Set feedback and store correct answer if wrong
      setGameState(prev => ({
        ...prev,
        feedback: isCorrect ? 'correct' : 'incorrect',
        sessionStats: newSessionStats
      }));

      // Store correct answer for display if the answer was wrong
      if (!isCorrect) {
        setCorrectAnswer(correctAnswer);
      }

      // Move to next word after feedback delay
      setTimeout(() => {
        const nextWord = wordManager.getNextWordWithHintReset();
        setGameState(prev => ({
          ...prev,
          currentWord: nextWord,
          feedback: null
        }));
        // Clear correct answer and hint text when moving to next word
        setCorrectAnswer(null);
        setCurrentHintText('');
      }, 1500);
    } else if (gameState.contentType === 'verbs') {
      if (!gameState.currentVerb || !verbManager || !gameState.currentVerbForm) return;

      const correctAnswer = verbManager.getCorrectAnswer(gameState.currentVerb, gameState.currentVerbForm);
      const isCorrect = fuzzyMatch(userAnswer, correctAnswer);

      // Get hint statistics from manager
      const hintStats = verbManager.getHintUsageStats();
      const hintsUsedForCurrentVerb = hintStats.hintsUsedForCurrentVerb.length;

      // Update session stats
      const newSessionStats = updateSessionStats({
        correct: gameState.sessionStats.correct + (isCorrect ? 1 : 0),
        total: gameState.sessionStats.total + 1,
        streak: isCorrect ? gameState.sessionStats.streak + 1 : 0,
        accuracy: 0, // Will be calculated in updateSessionStats
        hintsUsed: gameState.sessionStats.hintsUsed + hintsUsedForCurrentVerb,
        questionsWithHints: gameState.sessionStats.questionsWithHints + (hintsUsedForCurrentVerb > 0 ? 1 : 0),
        averageHintsPerQuestion: 0 // Will be calculated in updateSessionStats
      });

      // Update user progress
      const newProgress = updateProgress(userProgress, isCorrect, newSessionStats.streak, hintsUsedForCurrentVerb);
      setUserProgress(newProgress);

      // Set feedback and store correct answer if wrong
      setGameState(prev => ({
        ...prev,
        feedback: isCorrect ? 'correct' : 'incorrect',
        sessionStats: newSessionStats
      }));

      // Store correct answer for display if the answer was wrong
      if (!isCorrect) {
        setCorrectAnswer(correctAnswer);
      }

      // Move to next verb after feedback delay
      setTimeout(() => {
        const nextVerb = verbManager.getNextVerbWithHintReset();
        const nextVerbForm = verbManager.getVerbFormByMode(gameState.verbMode);
        setGameState(prev => ({
          ...prev,
          currentVerb: nextVerb,
          currentVerbForm: nextVerbForm,
          feedback: null
        }));
        // Clear correct answer and hint text when moving to next verb
        setCorrectAnswer(null);
        setCurrentHintText('');
      }, 1500);
    }
  }, [gameState.currentWord, gameState.currentVerb, gameState.mode, gameState.contentType, gameState.verbMode, gameState.currentVerbForm, gameState.sessionStats, wordManager, verbManager, userProgress, updateSessionStats]);

  // Handle hint usage
  const handleHintUsed = useCallback((hintLevel: HintLevel) => {
    if (gameState.contentType === 'words') {
      if (!gameState.currentWord || !wordManager) return;
      
      // Record hint usage for statistics
      wordManager.recordHintUsage(hintLevel);
      
      // Get hint text for the current level and display it
      const hintText = wordManager.getHintForCurrentLevel(gameState.currentWord, gameState.mode, hintLevel);
      setCurrentHintText(hintText);
    } else if (gameState.contentType === 'verbs') {
      if (!gameState.currentVerb || !verbManager || !gameState.currentVerbForm) return;
      
      // Record hint usage for statistics
      verbManager.recordHintUsage(hintLevel);
      
      // Get hint text for the current level and display it
      const hintText = verbManager.getHintForCurrentLevel(gameState.currentVerb, gameState.currentVerbForm, hintLevel);
      setCurrentHintText(hintText);
    }
  }, [gameState.currentWord, gameState.currentVerb, gameState.contentType, gameState.mode, gameState.currentVerbForm, wordManager, verbManager]);

  // Handle show answer - triggers wrong answer flow by submitting current input
  const handleShowAnswer = useCallback(() => {
    // Get the current input value from the InputField
    const currentInput = inputFieldRef.current?.getCurrentValue() || '';
    
    // Submit the current input (which might be empty or partial)
    handleAnswerSubmit(currentInput);
  }, [handleAnswerSubmit]);

  // Get correct answer for the current question (for hints)
  const getCurrentCorrectAnswer = useCallback((): string | null => {
    if (gameState.contentType === 'words') {
      if (!gameState.currentWord || !wordManager) return null;
      return wordManager.getCorrectAnswer(gameState.currentWord, gameState.mode);
    } else if (gameState.contentType === 'verbs') {
      if (!gameState.currentVerb || !verbManager || !gameState.currentVerbForm) return null;
      return verbManager.getCorrectAnswer(gameState.currentVerb, gameState.currentVerbForm);
    }
    return null;
  }, [gameState.currentWord, gameState.currentVerb, gameState.contentType, gameState.mode, gameState.currentVerbForm, wordManager, verbManager]);

  // Generate multiple choice options when a new question appears
  useEffect(() => {
    if (gameState.practiceMode !== 'multiple-choice') {
      setMultipleChoiceOptions([]);
      return;
    }

    if (gameState.contentType === 'words' && gameState.currentWord && wordManager) {
      const correct = wordManager.getCorrectAnswer(gameState.currentWord, gameState.mode);
      const distractors = generateWordDistractors(
        gameState.currentWord,
        wordManager.getAllWords(),
        gameState.mode,
        correct
      );
      const options = generateMultipleChoiceOptions(correct, distractors);
      setMultipleChoiceOptions(options);
    } else if (gameState.contentType === 'verbs' && gameState.currentVerb && gameState.currentVerbForm && verbManager) {
      const correct = verbManager.getCorrectAnswer(gameState.currentVerb, gameState.currentVerbForm);
      const distractors = generateVerbDistractors(
        gameState.currentVerb,
        verbManager.getAllVerbs(),
        gameState.currentVerbForm,
        correct
      );
      const options = generateMultipleChoiceOptions(correct, distractors);
      setMultipleChoiceOptions(options);
    }
  }, [gameState.currentWord, gameState.currentVerb, gameState.currentVerbForm, gameState.mode, gameState.contentType, gameState.practiceMode, wordManager, verbManager]);

  // Handle practice mode change
  const handlePracticeModeChange = useCallback((newPracticeMode: PracticeMode) => {
    setGameState(prev => ({
      ...prev,
      practiceMode: newPracticeMode,
      feedback: null
    }));
    setCorrectAnswer(null);
    setCurrentHintText('');
    
    // Reset hint state in managers
    if (wordManager) {
      wordManager.resetHintState();
    }
    if (verbManager) {
      verbManager.resetHintState();
    }
  }, [wordManager, verbManager]);

  // Handle mode change
  const handleModeChange = useCallback((newMode: LearningMode) => {
    setGameState(prev => ({
      ...prev,
      mode: newMode,
      feedback: null
    }));
    setCorrectAnswer(null);
    setCurrentHintText('');
    
    // Reset hint state in managers
    if (wordManager) {
      wordManager.resetHintState();
    }
    if (verbManager) {
      verbManager.resetHintState();
    }
  }, [wordManager, verbManager]);

  // Handle content type change
  const handleContentTypeChange = useCallback((newContentType: ContentType) => {
    if (newContentType === 'words') {
      if (!wordManager) return;
      const firstWord = wordManager.getCurrentWord();
      setGameState(prev => ({
        ...prev,
        contentType: newContentType,
        currentWord: firstWord,
        currentVerb: null,
        currentVerbForm: null,
        feedback: null
      }));
    } else if (newContentType === 'verbs') {
      if (!verbManager) return;
      const firstVerb = verbManager.getCurrentVerb();
      const firstVerbForm = verbManager.getVerbFormByMode(gameState.verbMode);
      setGameState(prev => ({
        ...prev,
        contentType: newContentType,
        currentWord: null,
        currentVerb: firstVerb,
        currentVerbForm: firstVerbForm,
        feedback: null
      }));
    }
    
    // Clear hint state when switching content types
    setCorrectAnswer(null);
    setCurrentHintText('');
    
    // Reset hint state in managers
    if (wordManager) {
      wordManager.resetHintState();
    }
    if (verbManager) {
      verbManager.resetHintState();
    }
  }, [wordManager, verbManager, gameState.verbMode]);

  // Handle verb mode change
  const handleVerbModeChange = useCallback((newVerbMode: VerbMode) => {
    if (!verbManager || gameState.contentType !== 'verbs') return;
    
    const newVerbForm = verbManager.getVerbFormByMode(newVerbMode);
    setGameState(prev => ({
      ...prev,
      verbMode: newVerbMode,
      currentVerbForm: newVerbForm,
      feedback: null
    }));
  }, [verbManager, gameState.contentType]);

  // Handle progress reset
  const handleResetProgress = useCallback(() => {
    const resetUserProgress = resetProgress();
    setUserProgress(resetUserProgress);
    setGameState(prev => ({
      ...prev,
      sessionStats: { correct: 0, total: 0, accuracy: 0, streak: 0, hintsUsed: 0, questionsWithHints: 0, averageHintsPerQuestion: 0 }
    }));
  }, []);

  // Handle marking a word as known
  const handleMarkAsKnown = useCallback((word: WordPair) => {
    if (!wordManager) return;
    
    // Get the translation to show
    const translation = wordManager.getCorrectAnswer(word, gameState.mode);
    
    // Persist the known status to localStorage
    persistMarkWordAsKnown(word);
    
    // Mark the word as known in the manager
    wordManager.markWordAsKnown(word);
    
    // Show correct feedback with translation (green effect)
    const markedWord = { ...word, known: true };
    setGameState(prev => ({
      ...prev,
      currentWord: markedWord,
      feedback: 'correct' // Green success effect
    }));
    
    // Show the translation
    setCorrectAnswer(translation);
    
    // After feedback delay, move to the next word (same as correct answer timing)
    setTimeout(() => {
      const nextWord = wordManager.getCurrentWord();
      setGameState(prev => ({
        ...prev,
        currentWord: nextWord,
        feedback: null
      }));
      // Clear correct answer and hint text when moving to next word
      setCorrectAnswer(null);
      setCurrentHintText('');
    }, 1500); // Match the timing of correct answer feedback
  }, [wordManager, gameState.mode]);

  // Handle unmarking a known word
  const handleKnownWordUnmarked = useCallback(() => {
    if (!wordManager) return;
    
    // Refresh the word manager with updated known status
    // This will re-filter the available words
    wordManager.reset();
    
    // If we're out of words to practice, get the current word
    const currentWord = wordManager.getCurrentWord();
    setGameState(prev => ({
      ...prev,
      currentWord: currentWord,
      feedback: null
    }));
    
    // Clear any feedback states
    setCorrectAnswer(null);
    setCurrentHintText('');
  }, [wordManager]);


  if (gameState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🔄</div>
          <h2 className="text-2xl font-bold text-white mb-4">Loading Dutch Words...</h2>
          <p className="text-white text-opacity-70">Getting ready for your learning session 📚</p>
        </div>
      </div>
    );
  }

  if (gameState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-white mb-4">Oops!</h2>
          <p className="text-white text-opacity-70 mb-4">{gameState.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-primary">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary flex items-center space-x-2">
          <span>Learning Dutch</span>
        </h1>
        <div className="flex items-center space-x-4">
          <ThemeChooser
            currentTheme={theme}
            onThemeChange={setTheme}
          />
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-primary px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
          >
            Stats
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {showStats ? (
            <div className="max-w-md mx-auto animate-fade-in">
              <StatsDashboard
                progress={userProgress}
                onReset={handleResetProgress}
                onKnownWordUnmarked={handleKnownWordUnmarked}
              />
              <button
                onClick={() => setShowStats(false)}
                className="w-full mt-4 btn-primary font-medium px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
              >
                🔙 Back to Learning
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 items-start">
              {/* Content Type Switcher and Mode Toggle */}
              <div className="flex flex-col space-y-4">
                <ContentTypeSwitcher
                  contentType={gameState.contentType}
                  onContentTypeChange={handleContentTypeChange}
                  disabled={gameState.feedback !== null}
                />
                <PracticeModeSwitcher
                  practiceMode={gameState.practiceMode}
                  onPracticeModeChange={handlePracticeModeChange}
                  disabled={gameState.feedback !== null}
                />
                {gameState.contentType === 'words' && (
                  <ModeToggle
                    mode={gameState.mode}
                    onModeChange={handleModeChange}
                    disabled={gameState.feedback !== null}
                  />
                )}
                {gameState.contentType === 'verbs' && (
                  <VerbModeSelector
                    verbMode={gameState.verbMode}
                    onVerbModeChange={handleVerbModeChange}
                    disabled={gameState.feedback !== null}
                  />
                )}
              </div>

              {/* Main Learning Area */}
              <div className="space-y-4">
                {gameState.contentType === 'words' ? (
                  <WordCard
                    word={gameState.currentWord}
                    mode={gameState.mode}
                    feedback={gameState.feedback}
                    correctAnswer={correctAnswer || undefined}
                    onMarkAsKnown={handleMarkAsKnown}
                  />
                ) : (
                  <VerbCard
                    verb={gameState.currentVerb}
                    verbForm={gameState.currentVerbForm}
                    verbFormLabel={gameState.currentVerbForm && verbManager ? verbManager.getVerbFormLabel(gameState.currentVerbForm) : ''}
                    feedback={gameState.feedback}
                    correctAnswer={correctAnswer || undefined}
                  />
                )}

                <div className="flex flex-col items-center space-y-4">
                  {gameState.practiceMode === 'type' ? (
                    <InputField
                      ref={inputFieldRef}
                      onSubmit={handleAnswerSubmit}
                      feedback={gameState.feedback}
                      disabled={gameState.feedback !== null}
                      placeholder={gameState.contentType === 'words'
                        ? `Type ${gameState.mode === 'nl-en' ? 'English' : 'Dutch'} translation...`
                        : `Type the ${gameState.currentVerbForm && verbManager ? verbManager.getVerbFormLabel(gameState.currentVerbForm).toLowerCase() : 'verb form'}...`
                      }
                      hintText={currentHintText}
                      correctAnswer={getCurrentCorrectAnswer() || undefined}
                      onHintUsed={handleHintUsed}
                      onShowAnswer={handleShowAnswer}
                    />
                  ) : (
                    <MultipleChoiceInput
                      options={multipleChoiceOptions}
                      correctAnswer={getCurrentCorrectAnswer() || ''}
                      onSubmit={handleAnswerSubmit}
                      feedback={gameState.feedback}
                      disabled={gameState.feedback !== null}
                    />
                  )}
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex justify-center md:justify-end">
                <ProgressIndicator
                  sessionStats={gameState.sessionStats}
                  className="w-full max-w-xs"
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-muted text-sm">
        <p>Built with ❤️ for Dutch language learners • Press Enter to submit answers</p>
      </footer>
      
      {/* AI Hint Configuration Dialog */}
      <AIHintConfigDialog />
    </div>
  );
}

export default App;
