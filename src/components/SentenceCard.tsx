import type { SentencePair, FeedbackType } from "../types";
import { useRef, useEffect, useState } from "react";
import AIHintPopup from "./AIHintPopup";
import { useAIHint } from "../contexts/AIHintContext";

interface SentenceCardProps {
  sentence: SentencePair | null;
  feedback: FeedbackType;
  correctAnswer?: string;
}

const SentenceCard: React.FC<SentenceCardProps> = ({
  sentence,
  feedback,
  correctAnswer,
}) => {
  const textRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState("text-2xl md:text-3xl");

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
    const availableWidth = container.clientWidth - 64; // 32px padding on each side

    // Font size options from largest to smallest (smaller for sentences)
    const fontSizes = [
      { class: "text-2xl md:text-3xl", size: 30 },
      { class: "text-xl md:text-2xl", size: 24 },
      { class: "text-lg md:text-xl", size: 20 },
      { class: "text-base md:text-lg", size: 18 },
      { class: "text-sm md:text-base", size: 16 },
    ];

    // Test each font size until text fits
    for (const fontOption of fontSizes) {
      textElement.className = `${fontOption.class} font-bold text-primary-light mb-2`;

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
    if (sentence) {
      // Small delay to ensure DOM is ready
      setTimeout(() => adjustFontSize(), 10);

      // Preload AI hint when new sentence is shown (not during feedback)
      if (feedback === null && isConfigured) {
        preloadHint(sentence.english, sentence.dutch, "en-nl");
      }
    }
  }, [sentence, feedback, isConfigured, preloadHint]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  if (!sentence) {
    return (
      <div className="card-bg rounded-xl p-8 text-center border-2 border-white border-opacity-20">
        <div className="text-secondary-light">Loading sentence...</div>
      </div>
    );
  }

  const getDifficultyLabel = (difficulty: number): string => {
    switch (difficulty) {
      case 1:
        return "A1";
      case 2:
        return "A2";
      case 3:
        return "B1";
      default:
        return "A1";
    }
  };

  const getDifficultyColor = (difficulty: number): string => {
    switch (difficulty) {
      case 1:
        return "bg-green-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-orange-500";
      default:
        return "bg-green-500";
    }
  };

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

  const handleSentenceHover = (e: React.MouseEvent) => {
    if (!sentence || feedback !== null) return;

    if (!isConfigured) {
      setShowConfigDialog(true);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    const timeout = setTimeout(() => {
      setShowHintPopup(true);
    }, 500);

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

  const handleSentenceLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowHintPopup(false);
  };

  return (
    <div
      ref={containerRef}
      className={`${getFeedbackClasses()} rounded-xl p-6 text-center transition-all duration-300 border-2 animate-slide-up relative`}
    >
      {/* Difficulty badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`${getDifficultyColor(sentence.difficulty)} text-white text-xs font-bold px-2 py-1 rounded-full`}
        >
          {getDifficultyLabel(sentence.difficulty)}
        </span>
      </div>

      <div className="mb-3">
        <span className="text-secondary-light text-sm font-medium uppercase tracking-wide">
          {feedback === "incorrect" && correctAnswer
            ? "Correct Answer"
            : "Translate to Dutch"}
        </span>
      </div>

      <div className="mb-3 relative">
        {/* Show correct answer when feedback is present */}
        {feedback !== null && correctAnswer ? (
          <h2
            ref={textRef}
            className={`${fontSize} font-bold text-primary-light mb-2`}
          >
            {correctAnswer}
          </h2>
        ) : (
          <h2
            ref={textRef}
            className={`${fontSize} font-bold text-primary-light mb-2 cursor-pointer hover:text-blue-300 relative transition-colors`}
            onMouseEnter={handleSentenceHover}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleSentenceLeave}
          >
            {sentence.english}
            {!isConfigured && (
              <span className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
            )}
          </h2>
        )}

        {/* AI Hint Tooltip */}
        {showHintPopup && sentence && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y - 40}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <AIHintPopup
              word={sentence.english}
              translation={sentence.dutch}
              mode="en-nl"
              isVisible={showHintPopup}
              onClose={() => setShowHintPopup(false)}
            />
          </div>
        )}
      </div>

      <div className="text-secondary-light text-sm">
        Construct the Dutch sentence using the words below
      </div>
    </div>
  );
};

export default SentenceCard;
