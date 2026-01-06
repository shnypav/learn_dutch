import { useState, useEffect, useCallback, useRef } from "react";
import type {
  LearningMode,
  GameState,
  UserProgress,
  SessionStats,
  ContentType,
  VerbMode,
  WordPair,
  PracticeFormat,
  SentencePair,
} from "./types";
import { loadCSVData, loadVerbData, loadSentenceData } from "./utils/csvParser";
import { fuzzyMatch } from "./utils/fuzzyMatch";
import { WordManager } from "./utils/wordManager";
import { VerbManager } from "./utils/verbManager";
import {
  SentenceManager,
  evaluateSentenceAnswer,
  type SentenceTypoDetail,
} from "./utils/sentenceManager";
import {
  generateWordMultipleChoiceOptions,
  generateVerbMultipleChoiceOptions,
} from "./utils/multipleChoiceGenerator";
import {
  loadProgress,
  updateProgress,
  resetProgress,
  applyKnownStatusToWords,
  applyWordSRSData,
  applyVerbSRSData,
  applySentenceSRSData,
  loadSRSConfig,
  saveSRSConfig,
  resetDailySRSStats,
  markWordAsKnown as persistMarkWordAsKnown,
} from "./utils/storage";
import {
  initializeCardsWithSRS,
  getCardCategoryCounts,
} from "./utils/srsScheduler";
import { useTheme } from "./contexts/ThemeContext";
import type { HintLevel } from "./utils/hintGenerator";

// Components
import WordCard from "./components/WordCard";
import VerbCard from "./components/VerbCard";
import SentenceCard from "./components/SentenceCard";
import SentenceConstructionInput from "./components/SentenceConstructionInput";
import SentenceTypoNotice from "./components/SentenceTypoNotice";
import InputField, { type InputFieldRef } from "./components/InputField";
import ModeToggle from "./components/ModeToggle";
import ContentTypeSwitcher from "./components/ContentTypeSwitcher";
import VerbModeSelector from "./components/VerbModeSelector";
import ProgressIndicator from "./components/ProgressIndicator";
import StatsDashboard from "./components/StatsDashboard";
import ThemeChooser from "./components/ThemeChooser";
import AIHintConfigDialog from "./components/AIHintConfigDialog";
import ConfettiEffect from "./components/ConfettiEffect";
import SRSDashboard from "./components/SRSDashboard";
import SRSSettingsDialog from "./components/SRSSettingsDialog";
import PracticeFormatSwitcher from "./components/PracticeFormatSwitcher";

function App() {
  const { theme, setTheme } = useTheme();
  const [gameState, setGameState] = useState<GameState>({
    currentWord: null,
    currentVerb: null,
    currentSentence: null,
    scrambledWords: [],
    mode: "nl-en",
    contentType: "words",
    verbMode: "random",
    currentVerbForm: null,
    feedback: null,
    sessionStats: {
      correct: 0,
      total: 0,
      accuracy: 0,
      streak: 0,
      hintsUsed: 0,
      questionsWithHints: 0,
      averageHintsPerQuestion: 0,
    },
    isLoading: true,
    error: null,
    practiceFormat: "input",
    multipleChoiceOptions: [],
  });

  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [currentHintText, setCurrentHintText] = useState<string>("");
  const inputFieldRef = useRef<InputFieldRef>(null);

  const [userProgress, setUserProgress] =
    useState<UserProgress>(loadProgress());
  const [wordManager, setWordManager] = useState<WordManager | null>(null);
  const [verbManager, setVerbManager] = useState<VerbManager | null>(null);
  const [sentenceManager, setSentenceManager] = useState<SentenceManager | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSRSDashboard, setShowSRSDashboard] = useState(false);
  const [showSRSSettings, setShowSRSSettings] = useState(false);
  const [srsConfig, setSRSConfig] = useState(loadSRSConfig());
  const [allWords, setAllWords] = useState<WordPair[]>([]);
  const [allVerbs, setAllVerbs] = useState<any[]>([]);
  const [allSentences, setAllSentences] = useState<SentencePair[]>([]);
  const [nonSentencePracticeFormat, setNonSentencePracticeFormat] =
    useState<PracticeFormat>("input");
  const [sentenceTypos, setSentenceTypos] =
    useState<SentenceTypoDetail[] | null>(null);
  const [lastSentenceAttempt, setLastSentenceAttempt] = useState<string[]>([]);
  const [sentenceMatchedFuzzy, setSentenceMatchedFuzzy] = useState(false);
  const nextSentenceButtonRef = useRef<HTMLButtonElement | null>(null);

  // Initialize the app and load CSV data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setGameState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Load words, verbs, and sentences data
        const [words, verbs, sentences] = await Promise.all([
          loadCSVData("/data/dutch_common_words.csv"),
          loadVerbData("/data/dutch_irregular_verbs.csv"),
          loadSentenceData("/data/dutch_sentences.csv"),
        ]);

        // Apply known status to words from localStorage
        let wordsWithKnownStatus = applyKnownStatusToWords(words);
        let verbsWithSRS = verbs;
        let sentencesWithSRS = sentences;

        // Apply SRS data from localStorage
        wordsWithKnownStatus = applyWordSRSData(wordsWithKnownStatus);
        verbsWithSRS = applyVerbSRSData(verbs);
        sentencesWithSRS = applySentenceSRSData(sentences);

        // Initialize SRS data for cards that don't have it (migration for existing users)
        wordsWithKnownStatus = initializeCardsWithSRS(wordsWithKnownStatus);
        verbsWithSRS = initializeCardsWithSRS(verbsWithSRS);
        sentencesWithSRS = initializeCardsWithSRS(sentencesWithSRS);

        console.log("Loaded words:", wordsWithKnownStatus.length);
        console.log("Loaded verbs:", verbsWithSRS.length);
        console.log("Loaded sentences:", sentencesWithSRS.length);
        console.log(
          "Words after applying localStorage status:",
          wordsWithKnownStatus.slice(0, 5).map((w) => ({
            dutch: w.dutch,
            english: w.english,
            known: w.known,
          })),
        );

        // Store all cards for SRS dashboard
        setAllWords(wordsWithKnownStatus);
        setAllVerbs(verbsWithSRS);
        setAllSentences(sentencesWithSRS);

        const wordMgr = new WordManager(wordsWithKnownStatus);
        const verbMgr = new VerbManager(verbsWithSRS);
        const sentenceMgr = new SentenceManager(sentencesWithSRS);

        // Set distractor words for sentence construction from vocabulary
        const dutchVocabulary = wordsWithKnownStatus.map((w) => w.dutch);
        sentenceMgr.setDistractorWords(dutchVocabulary);

        // Configure SRS settings
        wordMgr.setSRSConfig(srsConfig);
        verbMgr.setSRSConfig(srsConfig);
        sentenceMgr.setSRSConfig(srsConfig);

        // Reset daily stats if it's a new day
        const updatedProgress = resetDailySRSStats(userProgress);
        setUserProgress(updatedProgress);

        // Set new cards seen today count
        wordMgr.setNewCardsSeenToday(updatedProgress.newCardsToday);
        verbMgr.setNewCardsSeenToday(updatedProgress.newCardsToday);
        sentenceMgr.setNewCardsSeenToday(updatedProgress.newCardsToday);

        setWordManager(wordMgr);
        setVerbManager(verbMgr);
        setSentenceManager(sentenceMgr);

        const firstWord = wordMgr.getCurrentWord();

        // Generate initial MC options if in MC mode
        let initialMCOptions: string[] = [];
        if (firstWord) {
          initialMCOptions = generateWordMultipleChoiceOptions(
            wordMgr.getAllWords(),
            firstWord,
            "nl-en",
          );
        }

        setGameState((prev) => ({
          ...prev,
          currentWord: firstWord,
          isLoading: false,
          multipleChoiceOptions: initialMCOptions,
        }));
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setGameState((prev) => ({
          ...prev,
          error: "Failed to load vocabulary data. Please refresh the page.",
          isLoading: false,
        }));
      }
    };

    initializeApp();
  }, []);

  // Calculate session statistics
  const updateSessionStats = useCallback(
    (stats: SessionStats): SessionStats => {
      const accuracy =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      const averageHintsPerQuestion =
        stats.total > 0 ? stats.hintsUsed / stats.total : 0;
      return { ...stats, accuracy, averageHintsPerQuestion };
    },
    [],
  );

  // Handle answer submission
  const handleAnswerSubmit = useCallback(
    (userAnswer: string) => {
      // Clear sentence-specific feedback when answering any question
      setSentenceTypos(null);
      setLastSentenceAttempt([]);
      setSentenceMatchedFuzzy(false);

      if (gameState.contentType === "words") {
        if (!gameState.currentWord || !wordManager) return;

        const correctAnswer = wordManager.getCorrectAnswer(
          gameState.currentWord,
          gameState.mode,
        );
        // For multiple choice, no fuzzy matching needed (exact match)
        const isCorrect =
          gameState.practiceFormat === "multiple-choice"
            ? userAnswer === correctAnswer
            : fuzzyMatch(userAnswer, correctAnswer);

        // Get hint statistics from manager
        const hintStats = wordManager.getHintUsageStats();
        const hintsUsedForCurrentWord =
          hintStats.hintsUsedForCurrentWord.length;

        // Update session stats
        const newSessionStats = updateSessionStats({
          correct: gameState.sessionStats.correct + (isCorrect ? 1 : 0),
          total: gameState.sessionStats.total + 1,
          streak: isCorrect ? gameState.sessionStats.streak + 1 : 0,
          accuracy: 0, // Will be calculated in updateSessionStats
          hintsUsed: gameState.sessionStats.hintsUsed + hintsUsedForCurrentWord,
          questionsWithHints:
            gameState.sessionStats.questionsWithHints +
            (hintsUsedForCurrentWord > 0 ? 1 : 0),
          averageHintsPerQuestion: 0, // Will be calculated in updateSessionStats
        });

        // Record answer for SRS
        wordManager.recordAnswer(
          gameState.currentWord,
          isCorrect,
          hintsUsedForCurrentWord,
        );

        // Update user progress and SRS stats
        const categoryCounts = getCardCategoryCounts(allWords);
        const newProgress = updateProgress(
          userProgress,
          isCorrect,
          newSessionStats.streak,
          hintsUsedForCurrentWord,
        );
        const updatedProgress = {
          ...newProgress,
          cardsReviewedToday: newProgress.cardsReviewedToday + 1,
          newCardsToday: gameState.currentWord.srsData?.isNew
            ? newProgress.newCardsToday + 1
            : newProgress.newCardsToday,
          matureCards: categoryCounts.mature,
          youngCards: categoryCounts.young,
          learningCards: categoryCounts.learning,
        };
        setUserProgress(updatedProgress);

        // Set feedback and store correct answer if wrong
        setGameState((prev) => ({
          ...prev,
          feedback: isCorrect ? "correct" : "incorrect",
          sessionStats: newSessionStats,
        }));


        // Store correct answer for display if the answer was wrong
        if (!isCorrect) {
          setCorrectAnswer(correctAnswer);
        }

        // Move to next word after feedback delay
        setTimeout(() => {
          const nextWord = wordManager.getNextWordWithHintReset();

          // Generate multiple choice options if in MC mode
          let mcOptions: string[] = [];
          if (gameState.practiceFormat === "multiple-choice" && nextWord) {
            mcOptions = generateWordMultipleChoiceOptions(
              wordManager.getAllWords(),
              nextWord,
              gameState.mode,
            );
          }

          setGameState((prev) => ({
            ...prev,
            currentWord: nextWord,
            feedback: null,
            multipleChoiceOptions: mcOptions,
          }));
          // Clear correct answer and hint text when moving to next word
          setCorrectAnswer(null);
          setCurrentHintText("");
        }, 1500);
      } else if (gameState.contentType === "verbs") {
        if (
          !gameState.currentVerb ||
          !verbManager ||
          !gameState.currentVerbForm
        )
          return;

        const correctAnswer = verbManager.getCorrectAnswer(
          gameState.currentVerb,
          gameState.currentVerbForm,
        );
        // For multiple choice, no fuzzy matching needed (exact match)
        const isCorrect =
          gameState.practiceFormat === "multiple-choice"
            ? userAnswer === correctAnswer
            : fuzzyMatch(userAnswer, correctAnswer);

        // Get hint statistics from manager
        const hintStats = verbManager.getHintUsageStats();
        const hintsUsedForCurrentVerb =
          hintStats.hintsUsedForCurrentVerb.length;

        // Update session stats
        const newSessionStats = updateSessionStats({
          correct: gameState.sessionStats.correct + (isCorrect ? 1 : 0),
          total: gameState.sessionStats.total + 1,
          streak: isCorrect ? gameState.sessionStats.streak + 1 : 0,
          accuracy: 0, // Will be calculated in updateSessionStats
          hintsUsed: gameState.sessionStats.hintsUsed + hintsUsedForCurrentVerb,
          questionsWithHints:
            gameState.sessionStats.questionsWithHints +
            (hintsUsedForCurrentVerb > 0 ? 1 : 0),
          averageHintsPerQuestion: 0, // Will be calculated in updateSessionStats
        });

        // Record answer for SRS
        verbManager.recordAnswer(
          gameState.currentVerb,
          isCorrect,
          hintsUsedForCurrentVerb,
        );

        // Update user progress and SRS stats
        const categoryCounts = getCardCategoryCounts(allVerbs);
        const newProgress = updateProgress(
          userProgress,
          isCorrect,
          newSessionStats.streak,
          hintsUsedForCurrentVerb,
        );
        const updatedProgress = {
          ...newProgress,
          cardsReviewedToday: newProgress.cardsReviewedToday + 1,
          newCardsToday: gameState.currentVerb.srsData?.isNew
            ? newProgress.newCardsToday + 1
            : newProgress.newCardsToday,
          matureCards: categoryCounts.mature,
          youngCards: categoryCounts.young,
          learningCards: categoryCounts.learning,
        };
        setUserProgress(updatedProgress);

        // Set feedback and store correct answer if wrong
        setGameState((prev) => ({
          ...prev,
          feedback: isCorrect ? "correct" : "incorrect",
          sessionStats: newSessionStats,
        }));


        // Store correct answer for display if the answer was wrong
        if (!isCorrect) {
          setCorrectAnswer(correctAnswer);
        }

        // Move to next verb after feedback delay
        setTimeout(() => {
          const nextVerb = verbManager.getNextVerbWithHintReset();
          const nextVerbForm = verbManager.getVerbFormByMode(
            gameState.verbMode,
          );

          // Generate multiple choice options if in MC mode
          let mcOptions: string[] = [];
          if (gameState.practiceFormat === "multiple-choice" && nextVerb) {
            mcOptions = generateVerbMultipleChoiceOptions(
              verbManager.getAllVerbs(),
              nextVerb,
              nextVerbForm,
            );
          }

          setGameState((prev) => ({
            ...prev,
            currentVerb: nextVerb,
            currentVerbForm: nextVerbForm,
            feedback: null,
            multipleChoiceOptions: mcOptions,
          }));
          // Clear correct answer and hint text when moving to next verb
          setCorrectAnswer(null);
          setCurrentHintText("");
        }, 1500);
      } else if (gameState.contentType === "sentences") {
        if (!gameState.currentSentence || !sentenceManager) return;

        // Parse the user's constructed sentence (words joined by spaces)
        const constructedWords = userAnswer.split(/\s+/).filter(Boolean);
        const evaluation = evaluateSentenceAnswer(
          constructedWords,
          gameState.currentSentence
        );
        const isCorrect = evaluation.isCorrect;
        setSentenceMatchedFuzzy(evaluation.matchedViaFuzzy);
        setLastSentenceAttempt(constructedWords);
        setSentenceTypos(
          evaluation.matchedViaFuzzy && evaluation.typoDetails.length > 0
            ? evaluation.typoDetails
            : null
        );
        const correctSentenceAnswer = sentenceManager.getCorrectAnswer(
          gameState.currentSentence
        );

        // Get hint statistics from manager
        const hintStats = sentenceManager.getHintUsageStats();
        const hintsUsedForCurrentSentence =
          hintStats.hintsUsedForCurrentSentence.length;

        // Update session stats
        const newSessionStats = updateSessionStats({
          correct: gameState.sessionStats.correct + (isCorrect ? 1 : 0),
          total: gameState.sessionStats.total + 1,
          streak: isCorrect ? gameState.sessionStats.streak + 1 : 0,
          accuracy: 0,
          hintsUsed:
            gameState.sessionStats.hintsUsed + hintsUsedForCurrentSentence,
          questionsWithHints:
            gameState.sessionStats.questionsWithHints +
            (hintsUsedForCurrentSentence > 0 ? 1 : 0),
          averageHintsPerQuestion: 0,
        });

        // Record answer for SRS
        sentenceManager.recordAnswer(
          gameState.currentSentence,
          isCorrect,
          hintsUsedForCurrentSentence
        );

        // Update user progress and SRS stats
        const categoryCounts = getCardCategoryCounts(allSentences);
        const newProgress = updateProgress(
          userProgress,
          isCorrect,
          newSessionStats.streak,
          hintsUsedForCurrentSentence
        );
        const updatedProgress = {
          ...newProgress,
          cardsReviewedToday: newProgress.cardsReviewedToday + 1,
          newCardsToday: gameState.currentSentence.srsData?.isNew
            ? newProgress.newCardsToday + 1
            : newProgress.newCardsToday,
          matureCards: categoryCounts.mature,
          youngCards: categoryCounts.young,
          learningCards: categoryCounts.learning,
        };
        setUserProgress(updatedProgress);

        // Set feedback and store correct answer if wrong
        setGameState((prev) => ({
          ...prev,
          feedback: isCorrect ? "correct" : "incorrect",
          sessionStats: newSessionStats,
        }));

        // Store correct answer for display if the answer was wrong
        if (!isCorrect) {
          setCorrectAnswer(correctSentenceAnswer);
          // Don't auto-advance on wrong answer - user must click "Next" button
        } else {
          if (!evaluation.matchedViaFuzzy) {
            // Move to next sentence after feedback delay (only on clean correct answer)
            setTimeout(() => {
              const nextSentence = sentenceManager.getNextSentenceWithHintReset();
              const scrambledWords = nextSentence
                ? sentenceManager.getScrambledWords(nextSentence)
                : [];

              setGameState((prev) => ({
                ...prev,
                currentSentence: nextSentence,
                scrambledWords: scrambledWords,
                feedback: null,
              }));
              // Clear correct answer and hint text when moving to next sentence
              setCorrectAnswer(null);
              setCurrentHintText("");
              setSentenceTypos(null);
              setLastSentenceAttempt([]);
              setSentenceMatchedFuzzy(false);
            }, 1500);
          }
        }
      }
    },
    [
      gameState.currentWord,
      gameState.currentVerb,
      gameState.currentSentence,
      gameState.mode,
      gameState.contentType,
      gameState.verbMode,
      gameState.currentVerbForm,
      gameState.sessionStats,
      gameState.practiceFormat,
      wordManager,
      verbManager,
      sentenceManager,
      userProgress,
      updateSessionStats,
      allWords,
      allVerbs,
      allSentences,
      sentenceMatchedFuzzy,
    ],
  );

  // Handle hint usage
  const handleHintUsed = useCallback(
    (hintLevel: HintLevel) => {
      if (gameState.contentType === "words") {
        if (!gameState.currentWord || !wordManager) return;

        // Record hint usage for statistics
        wordManager.recordHintUsage(hintLevel);

        // Get hint text for the current level and display it
        const hintText = wordManager.getHintForCurrentLevel(
          gameState.currentWord,
          gameState.mode,
          hintLevel,
        );
        setCurrentHintText(hintText);
      } else if (gameState.contentType === "verbs") {
        if (
          !gameState.currentVerb ||
          !verbManager ||
          !gameState.currentVerbForm
        )
          return;

        // Record hint usage for statistics
        verbManager.recordHintUsage(hintLevel);

        // Get hint text for the current level and display it
        const hintText = verbManager.getHintForCurrentLevel(
          gameState.currentVerb,
          gameState.currentVerbForm,
          hintLevel,
        );
        setCurrentHintText(hintText);
      } else if (gameState.contentType === "sentences") {
        if (!gameState.currentSentence || !sentenceManager) return;

        // Record hint usage for statistics
        sentenceManager.recordHintUsage(hintLevel);

        // Get hint text for the current level and display it
        const hintText = sentenceManager.getHintForCurrentLevel(
          gameState.currentSentence,
          hintLevel,
        );
        setCurrentHintText(hintText);
      }
    },
    [
      gameState.currentWord,
      gameState.currentVerb,
      gameState.currentSentence,
      gameState.contentType,
      gameState.mode,
      gameState.currentVerbForm,
      wordManager,
      verbManager,
      sentenceManager,
    ],
  );

  // Handle show answer - triggers wrong answer flow by submitting current input
  const handleShowAnswer = useCallback(() => {
    // Get the current input value from the InputField
    const currentInput = inputFieldRef.current?.getCurrentValue() || "";

    // Submit the current input (which might be empty or partial)
    handleAnswerSubmit(currentInput);
  }, [handleAnswerSubmit]);

  // Get correct answer for the current question (for hints)
  const getCurrentCorrectAnswer = useCallback((): string | null => {
    if (gameState.contentType === "words") {
      if (!gameState.currentWord || !wordManager) return null;
      return wordManager.getCorrectAnswer(
        gameState.currentWord,
        gameState.mode,
      );
    } else if (gameState.contentType === "verbs") {
      if (!gameState.currentVerb || !verbManager || !gameState.currentVerbForm)
        return null;
      return verbManager.getCorrectAnswer(
        gameState.currentVerb,
        gameState.currentVerbForm,
      );
    } else if (gameState.contentType === "sentences") {
      if (!gameState.currentSentence || !sentenceManager) return null;
      return sentenceManager.getCorrectAnswer(gameState.currentSentence);
    }
    return null;
  }, [
    gameState.currentWord,
    gameState.currentVerb,
    gameState.currentSentence,
    gameState.contentType,
    gameState.mode,
    gameState.currentVerbForm,
    wordManager,
    verbManager,
    sentenceManager,
  ]);

  // Handle manual advance to next sentence (after wrong answer)
  const handleNextSentence = useCallback(() => {
    if (!sentenceManager) return;

    const nextSentence = sentenceManager.getNextSentenceWithHintReset();
    const scrambledWords = nextSentence
      ? sentenceManager.getScrambledWords(nextSentence)
      : [];

    setGameState((prev) => ({
      ...prev,
      currentSentence: nextSentence,
      scrambledWords: scrambledWords,
      feedback: null,
    }));
    setCorrectAnswer(null);
    setCurrentHintText("");
    setSentenceTypos(null);
    setLastSentenceAttempt([]);
    setSentenceMatchedFuzzy(false);
  }, [sentenceManager]);

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode: LearningMode) => {
      setGameState((prev) => ({
        ...prev,
        mode: newMode,
        feedback: null,
      }));
      setCorrectAnswer(null);
      setCurrentHintText("");
      setSentenceTypos(null);
      setLastSentenceAttempt([]);

      // Reset hint state in managers
      if (wordManager) {
        wordManager.resetHintState();
      }
      if (verbManager) {
        verbManager.resetHintState();
      }
      if (sentenceManager) {
        sentenceManager.resetHintState();
      }
    },
    [wordManager, verbManager, sentenceManager],
  );

  // Handle content type change
  const handleContentTypeChange = useCallback(
    (newContentType: ContentType) => {
      if (newContentType === "words") {
        if (!wordManager) return;
        const firstWord = wordManager.getCurrentWord();
        const targetPracticeFormat =
          gameState.contentType === "sentences"
            ? nonSentencePracticeFormat
            : gameState.practiceFormat;

        // Generate MC options if in MC mode
        let mcOptions: string[] = [];
        if (targetPracticeFormat === "multiple-choice" && firstWord) {
          mcOptions = generateWordMultipleChoiceOptions(
            wordManager.getAllWords(),
            firstWord,
            gameState.mode,
          );
        }

        setGameState((prev) => ({
          ...prev,
          contentType: newContentType,
          currentWord: firstWord,
          currentVerb: null,
          currentVerbForm: null,
          currentSentence: null,
          scrambledWords: [],
          feedback: null,
          practiceFormat: targetPracticeFormat,
          multipleChoiceOptions: mcOptions,
        }));
      } else if (newContentType === "verbs") {
        if (!verbManager) return;
        const firstVerb = verbManager.getCurrentVerb();
        const firstVerbForm = verbManager.getVerbFormByMode(gameState.verbMode);
        const targetPracticeFormat =
          gameState.contentType === "sentences"
            ? nonSentencePracticeFormat
            : gameState.practiceFormat;

        // Generate MC options if in MC mode
        let mcOptions: string[] = [];
        if (targetPracticeFormat === "multiple-choice" && firstVerb) {
          mcOptions = generateVerbMultipleChoiceOptions(
            verbManager.getAllVerbs(),
            firstVerb,
            firstVerbForm,
          );
        }

        setGameState((prev) => ({
          ...prev,
          contentType: newContentType,
          currentWord: null,
          currentVerb: firstVerb,
          currentVerbForm: firstVerbForm,
          currentSentence: null,
          scrambledWords: [],
          feedback: null,
          practiceFormat: targetPracticeFormat,
          multipleChoiceOptions: mcOptions,
        }));
      } else if (newContentType === "sentences") {
        if (!sentenceManager) return;
        if (gameState.contentType !== "sentences") {
          setNonSentencePracticeFormat(gameState.practiceFormat);
        }
        const firstSentence = sentenceManager.getCurrentSentence();
        const scrambledWords = firstSentence
          ? sentenceManager.getScrambledWords(firstSentence)
          : [];

      setGameState((prev) => ({
        ...prev,
        contentType: newContentType,
        practiceFormat: "multiple-choice",
        currentWord: null,
        currentVerb: null,
        currentVerbForm: null,
        currentSentence: firstSentence,
        scrambledWords: scrambledWords,
        feedback: null,
        multipleChoiceOptions: [],
      }));
    }

    // Clear hint state when switching content types
    setCorrectAnswer(null);
    setCurrentHintText("");
    setSentenceTypos(null);
    setLastSentenceAttempt([]);
    setSentenceMatchedFuzzy(false);

      // Reset hint state in managers
      if (wordManager) {
        wordManager.resetHintState();
      }
      if (verbManager) {
        verbManager.resetHintState();
      }
      if (sentenceManager) {
        sentenceManager.resetHintState();
      }
    },
    [
      wordManager,
      verbManager,
      sentenceManager,
      gameState.verbMode,
      gameState.practiceFormat,
      gameState.mode,
      gameState.contentType,
      nonSentencePracticeFormat,
    ],
  );

  // Handle verb mode change
  const handleVerbModeChange = useCallback(
    (newVerbMode: VerbMode) => {
      if (!verbManager || gameState.contentType !== "verbs") return;

      const newVerbForm = verbManager.getVerbFormByMode(newVerbMode);
      setGameState((prev) => ({
        ...prev,
        verbMode: newVerbMode,
        currentVerbForm: newVerbForm,
        feedback: null,
      }));
    },
    [verbManager, gameState.contentType],
  );

  // Handle practice format change
  const handlePracticeFormatChange = useCallback(
    (newFormat: PracticeFormat) => {
      if (gameState.contentType !== "sentences") {
        setNonSentencePracticeFormat(newFormat);
      }

      // Generate MC options for current question if switching to MC mode
      let mcOptions: string[] = [];
      if (newFormat === "multiple-choice") {
        if (
          gameState.contentType === "words" &&
          gameState.currentWord &&
          wordManager
        ) {
          mcOptions = generateWordMultipleChoiceOptions(
            wordManager.getAllWords(),
            gameState.currentWord,
            gameState.mode,
          );
        } else if (
          gameState.contentType === "verbs" &&
          gameState.currentVerb &&
          gameState.currentVerbForm &&
          verbManager
        ) {
          mcOptions = generateVerbMultipleChoiceOptions(
            verbManager.getAllVerbs(),
            gameState.currentVerb,
            gameState.currentVerbForm,
          );
        }
      }

      setGameState((prev) => ({
        ...prev,
        practiceFormat: newFormat,
        multipleChoiceOptions: mcOptions,
        feedback: null,
      }));
      setCorrectAnswer(null);
      setCurrentHintText("");
    },
    [
      gameState.contentType,
      gameState.currentWord,
      gameState.currentVerb,
      gameState.currentVerbForm,
      gameState.mode,
      wordManager,
      verbManager,
    ],
  );

  // Handle progress reset
  const handleResetProgress = useCallback(() => {
    const resetUserProgress = resetProgress();
    setUserProgress(resetUserProgress);
    setGameState((prev) => ({
      ...prev,
      sessionStats: {
        correct: 0,
        total: 0,
        accuracy: 0,
        streak: 0,
        hintsUsed: 0,
        questionsWithHints: 0,
        averageHintsPerQuestion: 0,
      },
    }));
  }, []);

  // Handle marking a word as known
  const handleMarkAsKnown = useCallback(
    (word: WordPair) => {
      if (!wordManager) return;

      // Get the translation to show
      const translation = wordManager.getCorrectAnswer(word, gameState.mode);

      // Persist the known status to localStorage
      persistMarkWordAsKnown(word);

      // Mark the word as known in the manager (this reshuffles and resets currentIndex)
      wordManager.markWordAsKnown(word);

      // Show correct feedback with translation (green effect)
      const markedWord = { ...word, known: true };
      setGameState((prev) => ({
        ...prev,
        currentWord: markedWord,
        feedback: "correct", // Green success effect
      }));

      // Show the translation
      setCorrectAnswer(translation);

      // After feedback delay, move to the next word
      setTimeout(() => {
        // Get the first word from the reshuffled list (which excludes known words)
        const nextWord = wordManager.getCurrentWord();
        setGameState((prev) => ({
          ...prev,
          currentWord: nextWord,
          feedback: null,
        }));
        // Clear correct answer and hint text when moving to next word
        setCorrectAnswer(null);
        setCurrentHintText("");

        // Input field clears itself when feedback changes
      }, 1500); // Match the timing of correct answer feedback
    },
    [wordManager, gameState.mode],
  );

  // Handle unmarking a known word
  const handleKnownWordUnmarked = useCallback(() => {
    if (!wordManager) return;

    // Refresh the word manager with updated known status
    // This will re-filter the available words
    wordManager.reset();

    // If we're out of words to practice, get the current word
    const currentWord = wordManager.getCurrentWord();
    setGameState((prev) => ({
      ...prev,
      currentWord: currentWord,
      feedback: null,
    }));

    // Clear any feedback states
    setCorrectAnswer(null);
    setCurrentHintText("");
  }, [wordManager]);

  // Handle SRS settings save
  const handleSRSSettingsSave = useCallback(
    (newConfig: { dailyNewCardLimit: number }) => {
      setSRSConfig(newConfig);
      saveSRSConfig(newConfig);

      // Update managers with new config
      if (wordManager) {
        wordManager.setSRSConfig(newConfig);
      }
      if (verbManager) {
        verbManager.setSRSConfig(newConfig);
      }
      if (sentenceManager) {
        sentenceManager.setSRSConfig(newConfig);
      }
    },
    [wordManager, verbManager, sentenceManager],
  );

  // Focus "Next Sentence" when it becomes available in input mode
  useEffect(() => {
    const shouldFocusNext =
      gameState.contentType === "sentences" &&
      gameState.practiceFormat === "input" &&
      (gameState.feedback === "incorrect" ||
        (gameState.feedback === "correct" && sentenceMatchedFuzzy));

    if (shouldFocusNext && nextSentenceButtonRef.current) {
      const timer = window.setTimeout(() => {
        nextSentenceButtonRef.current?.focus();
      }, 150);
      return () => window.clearTimeout(timer);
    }
  }, [
    gameState.contentType,
    gameState.practiceFormat,
    gameState.feedback,
    sentenceMatchedFuzzy,
  ]);

  if (gameState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🔄</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Loading Dutch Words...
          </h2>
          <p className="text-white text-opacity-70">
            Getting ready for your learning session 📚
          </p>
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
          <ThemeChooser currentTheme={theme} onThemeChange={setTheme} />
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn-primary px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
          >
            Stats
          </button>
          <button
            onClick={() => setShowSRSDashboard(!showSRSDashboard)}
            className="btn-primary px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
          >
            SRS
          </button>
          <button
            onClick={() => setShowSRSSettings(true)}
            className="btn-primary px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
            title="SRS Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {showSRSDashboard ? (
            <div className="max-w-md mx-auto animate-fade-in">
              <SRSDashboard
                words={allWords}
                verbs={allVerbs}
                progress={userProgress}
                contentType={gameState.contentType}
              />
              <button
                onClick={() => setShowSRSDashboard(false)}
                className="w-full mt-4 btn-primary font-medium px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
              >
                🔙 Back to Learning
              </button>
            </div>
          ) : showStats ? (
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
                <PracticeFormatSwitcher
                  practiceFormat={gameState.practiceFormat}
                  onFormatChange={handlePracticeFormatChange}
                  disabled={gameState.feedback !== null}
                />
                {gameState.contentType === "words" && (
                  <ModeToggle
                    mode={gameState.mode}
                    onModeChange={handleModeChange}
                    disabled={gameState.feedback !== null}
                  />
                )}
                {gameState.contentType === "verbs" && (
                  <VerbModeSelector
                    verbMode={gameState.verbMode}
                    onVerbModeChange={handleVerbModeChange}
                    disabled={gameState.feedback !== null}
                  />
                )}
              </div>

              {/* Main Learning Area */}
              <div className="space-y-4">
                {gameState.contentType === "words" && (
                  <WordCard
                    key={
                      gameState.currentWord
                        ? `${gameState.currentWord.dutch}-${gameState.currentWord.english}`
                        : "no-word"
                    }
                    word={gameState.currentWord}
                    mode={gameState.mode}
                    feedback={gameState.feedback}
                    correctAnswer={correctAnswer || undefined}
                    onMarkAsKnown={handleMarkAsKnown}
                  />
                )}
                {gameState.contentType === "verbs" && (
                  <VerbCard
                    verb={gameState.currentVerb}
                    verbForm={gameState.currentVerbForm}
                    verbFormLabel={
                      gameState.currentVerbForm && verbManager
                        ? verbManager.getVerbFormLabel(
                            gameState.currentVerbForm,
                          )
                        : ""
                    }
                    feedback={gameState.feedback}
                    correctAnswer={correctAnswer || undefined}
                  />
                )}
                {gameState.contentType === "sentences" && (
                  <SentenceCard
                    key={
                      gameState.currentSentence
                        ? gameState.currentSentence.id
                        : "no-sentence"
                    }
                    sentence={gameState.currentSentence}
                    feedback={gameState.feedback}
                    correctAnswer={correctAnswer || undefined}
                  />
                )}

                <div className="flex flex-col items-center space-y-4">
                  {gameState.contentType === "sentences" &&
                  gameState.practiceFormat === "multiple-choice" ? (
                    <SentenceConstructionInput
                      scrambledWords={gameState.scrambledWords}
                      correctAnswer={getCurrentCorrectAnswer() || ""}
                      onSubmit={handleAnswerSubmit}
                      onNext={handleNextSentence}
                      showNextButton={
                        gameState.feedback === "incorrect" ||
                        (gameState.feedback === "correct" && sentenceMatchedFuzzy)
                      }
                      disabled={gameState.feedback !== null}
                      feedback={gameState.feedback}
                    />
                  ) : (
                    <InputField
                      ref={inputFieldRef}
                      onSubmit={handleAnswerSubmit}
                      feedback={gameState.feedback}
                      disabled={gameState.feedback !== null}
                      placeholder={
                        gameState.contentType === "words"
                          ? `Type ${gameState.mode === "nl-en" ? "English" : "Dutch"} translation...`
                          : gameState.contentType === "verbs"
                            ? `Type the ${gameState.currentVerbForm && verbManager ? verbManager.getVerbFormLabel(gameState.currentVerbForm).toLowerCase() : "verb form"}...`
                            : "Type the full Dutch sentence..."
                      }
                      hintText={currentHintText}
                      correctAnswer={getCurrentCorrectAnswer() || undefined}
                      onHintUsed={handleHintUsed}
                      onShowAnswer={handleShowAnswer}
                      practiceFormat={gameState.practiceFormat}
                      multipleChoiceOptions={gameState.multipleChoiceOptions}
                      preserveSubmittedOnFeedback={gameState.contentType === "sentences"}
                      questionKey={
                        gameState.contentType === "words" && gameState.currentWord
                          ? `word-${gameState.currentWord.dutch}-${gameState.mode}`
                          : gameState.contentType === "verbs" &&
                              gameState.currentVerb &&
                              gameState.currentVerbForm
                            ? `verb-${gameState.currentVerb.infinitive}-${gameState.currentVerbForm}`
                            : gameState.contentType === "sentences" &&
                                gameState.currentSentence
                              ? `sentence-${gameState.currentSentence.id}`
                              : "no-question"
                      }
                    />
                  )}

                  {gameState.contentType === "sentences" &&
                    gameState.feedback === "correct" &&
                    sentenceTypos &&
                    sentenceTypos.length > 0 && (
                      <SentenceTypoNotice
                        typos={sentenceTypos}
                        userWords={lastSentenceAttempt}
                        correctWords={
                          gameState.currentSentence
                            ? gameState.currentSentence.dutch.split(/\s+/)
                            : correctAnswer?.split(/\s+/) || []
                        }
                      />
                    )}

                  {gameState.contentType === "sentences" &&
                    gameState.practiceFormat === "input" &&
                    (gameState.feedback === "incorrect" ||
                      (gameState.feedback === "correct" && sentenceMatchedFuzzy)) && (
                      <div className="card-bg rounded-xl p-3 flex justify-center w-full max-w-md">
                        <button
                          ref={nextSentenceButtonRef}
                          onClick={handleNextSentence}
                          className="flex-1 px-6 py-2 rounded-lg font-medium transition-all duration-200 bg-blue-500 text-white border-2 border-blue-400 hover:bg-blue-600 hover:scale-105 active:scale-95"
                        >
                          Next Sentence →
                        </button>
                      </div>
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
        <p>
          Built with ❤️ for Dutch language learners • Press Enter to submit
          answers
        </p>
      </footer>

      {/* AI Hint Configuration Dialog */}
      <AIHintConfigDialog />

      {/* SRS Settings Dialog */}
      <SRSSettingsDialog
        isOpen={showSRSSettings}
        onClose={() => setShowSRSSettings(false)}
        dailyNewCardLimit={srsConfig.dailyNewCardLimit}
        onSave={handleSRSSettingsSave}
      />

      {/* Confetti Effect */}
      <ConfettiEffect
        trigger={gameState.feedback === "correct"}
        onComplete={() => {}}
      />
    </div>
  );
}

export default App;
