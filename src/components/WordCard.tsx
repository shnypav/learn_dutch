import type { WordPair, LearningMode, FeedbackType } from "../types";
import { useRef, useEffect, useState } from "react";
import AIHintPopup from "./AIHintPopup";
import { useAIHint } from "../contexts/AIHintContext";

interface WordCardProps {
  word: WordPair | null;
  mode: LearningMode;
  feedback: FeedbackType;
  correctAnswer?: string;
  onMarkAsKnown?: (word: WordPair) => void;
}

const WordCard: React.FC<WordCardProps> = ({
  word,
  mode,
  feedback,
  correctAnswer,
  onMarkAsKnown,
}) => {
  const textRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState("text-4xl md:text-5xl");

  // AI hint popup state
  const [showHintPopup, setShowHintPopup] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { isConfigured, setShowConfigDialog, preloadHint } = useAIHint();

  const adjustFontSize = () => {
    if (!textRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const textElement = textRef.current;

    // Available width (container minus padding)
    const availableWidth = container.clientWidth - 64; // 32px padding on each side (p-8)

    // Font size options from largest to smallest
    const fontSizes = [
      { class: "text-4xl md:text-5xl", size: 48 },
      { class: "text-3xl md:text-4xl", size: 36 },
      { class: "text-2xl md:text-3xl", size: 24 },
      { class: "text-xl md:text-2xl", size: 20 },
      { class: "text-lg md:text-xl", size: 18 },
      { class: "text-base md:text-lg", size: 16 },
      { class: "text-sm md:text-base", size: 14 },
    ];

    // Test each font size until text fits
    for (const fontOption of fontSizes) {
      textElement.className = `${fontOption.class} font-bold text-primary-light mb-4`;

      // Force reflow to get accurate measurements
      void textElement.offsetHeight;

      if (textElement.scrollWidth <= availableWidth) {
        setFontSize(fontOption.class);
        return;
      }
    }

    // If even the smallest size doesn't fit, use the smallest anyway
    setFontSize("text-sm md:text-base");
  };

  useEffect(() => {
    if (word) {
      // Small delay to ensure DOM is ready
      setTimeout(() => adjustFontSize(), 10);

      // Preload AI hint when new word is shown (not during feedback)
      if (feedback === null && isConfigured) {
        const sourceWord = mode === "nl-en" ? word.dutch : word.english;
        const translationWord = mode === "nl-en" ? word.english : word.dutch;
        preloadHint(sourceWord, translationWord, mode);
      }
    }
  }, [word, mode, feedback, correctAnswer, isConfigured, preloadHint]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // ... existing code ...

  if (!word) {
    // ... existing code ...
  }

  // Show correct answer when feedback is present and correctAnswer is available
  const displayWord =
    (feedback === "incorrect" || feedback === "correct") && correctAnswer
      ? correctAnswer
      : mode === "nl-en"
        ? word?.dutch
        : word?.english;

  const sourceLanguage = mode === "nl-en" ? "Dutch" : "English";
  const targetLanguage = mode === "nl-en" ? "English" : "Dutch";

  // Show different label when displaying correct answer
  const cardLabel =
    (feedback === "incorrect" || feedback === "correct") && correctAnswer
      ? feedback === "incorrect"
        ? `Correct Answer: ${targetLanguage}`
        : `Translation: ${targetLanguage}`
      : `${sourceLanguage} → ${targetLanguage}`;

  const getFeedbackClasses = (): string => {
    switch (feedback) {
      case "correct":
        return "feedback-correct border-green-300 card-bg";
      case "incorrect":
        return "feedback-incorrect border-red-300 card-bg";
      default:
        return "card-bg border-white border-opacity-20";
    }
  };

  const handleMarkAsKnown = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (word && onMarkAsKnown) {
      // Only trigger the action when checking the box (not unchecking)
      if (e.target.checked) {
        onMarkAsKnown({ ...word, known: true });
      }
    }
  };

  const handleWordHover = (e: React.MouseEvent) => {
    if (!word || feedback !== null) return; // Don't show during feedback

    if (!isConfigured) {
      setShowConfigDialog(true);
      return;
    }

    // Track mouse position for tooltip placement
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Small delay to prevent flickering
    const timeout = setTimeout(() => {
      setShowHintPopup(true);
    }, 500); // 500ms delay

    setHoverTimeout(timeout);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (showHintPopup) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleWordLeave = () => {
    // Clear timeout if user leaves before delay completes
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    // Hide immediately when leaving
    setShowHintPopup(false);
  };

  return (
    <div
      ref={containerRef}
      className={`${getFeedbackClasses()} rounded-xl p-8 text-center transition-all duration-300 border-2 animate-slide-up relative`}
    >
      {/* Checkbox for marking as known */}
      {word && onMarkAsKnown && (
        <div className="absolute top-4 right-4">
          <input
            type="checkbox"
            checked={word.known || false}
            onChange={handleMarkAsKnown}
            title="Mark this word as learned"
            className="w-4 h-4 text-green-600 bg-transparent border-2 border-primary-light rounded focus:ring-green-500 hover:border-green-400 transition-colors cursor-pointer"
          />
        </div>
      )}

      <div className="mb-4">
        <span className="text-secondary-light text-sm font-medium uppercase tracking-wide">
          {cardLabel}
        </span>
      </div>

      <div className="mb-4 relative">
        <h2
          ref={textRef}
          className={`${fontSize} font-bold text-primary-light mb-4 transition-all duration-200 cursor-pointer hover:text-blue-300 relative`}
          onMouseEnter={handleWordHover}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleWordLeave}
        >
          {displayWord}
          {!isConfigured && (
            <span className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
          )}
        </h2>

        {/* AI Hint Tooltip - positioned above mouse cursor */}
        {showHintPopup && word && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y - 40}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <AIHintPopup
              word={mode === "nl-en" ? word.dutch : word.english}
              translation={mode === "nl-en" ? word.english : word.dutch}
              mode={mode}
              isVisible={showHintPopup}
              onClose={() => setShowHintPopup(false)}
            />
          </div>
        )}
      </div>

      {/*<div className="text-secondary-light text-sm">*/}
      {/*  Translate to {targetLanguage}*/}
      {/*</div>*/}
    </div>
  );
};

export default WordCard;
