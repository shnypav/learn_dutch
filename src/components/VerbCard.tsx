import type { VerbPair, VerbForm, FeedbackType } from "../types";
import { useRef, useEffect, useState } from "react";
import { useAIHint } from "../contexts/AIHintContext";
import AIHintPopup from "./AIHintPopup";

interface VerbCardProps {
  verb: VerbPair | null;
  verbForm: VerbForm | null;
  verbFormLabel: string;
  feedback: FeedbackType;
  correctAnswer?: string;
}

const VerbCard: React.FC<VerbCardProps> = ({
  verb,
  verbForm,
  verbFormLabel,
  feedback,
  correctAnswer,
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

    const availableWidth = container.clientWidth - 64;

    const fontSizes = [
      { class: "text-4xl md:text-5xl", size: 48 },
      { class: "text-3xl md:text-4xl", size: 36 },
      { class: "text-2xl md:text-3xl", size: 24 },
      { class: "text-xl md:text-2xl", size: 20 },
      { class: "text-lg md:text-xl", size: 18 },
      { class: "text-base md:text-lg", size: 16 },
      { class: "text-sm md:text-base", size: 14 },
    ];

    for (const fontOption of fontSizes) {
      textElement.className = `${fontOption.class} font-bold text-primary-light mb-4`;
      void textElement.offsetHeight;

      if (textElement.scrollWidth <= availableWidth) {
        setFontSize(fontOption.class);
        return;
      }
    }

    setFontSize("text-sm md:text-base");
  };

  useEffect(() => {
    if (verb) {
      setTimeout(() => adjustFontSize(), 10);

      // Preload AI hint when new verb is shown (not during feedback)
      if (feedback === null && isConfigured && verbForm) {
        // Get the conjugated form as the translation
        const conjugatedForm = verb[verbForm] || "";
        preloadHint(verb.english_infinitive, conjugatedForm, "en-nl");
      }
    }
  }, [verb, verbForm, feedback, correctAnswer, isConfigured, preloadHint]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  if (!verb || !verbForm) {
    return (
      <div className="card-bg rounded-xl p-8 text-center border-2 border-white border-opacity-20">
        <div className="animate-pulse">
          <div className="h-4 bg-white bg-opacity-20 rounded mb-4"></div>
          <div className="h-16 bg-white bg-opacity-20 rounded mb-4"></div>
          <div className="h-4 bg-white bg-opacity-20 rounded"></div>
        </div>
      </div>
    );
  }

  const displayWord =
    feedback === "incorrect" && correctAnswer
      ? correctAnswer
      : verb.english_infinitive;

  const cardLabel =
    feedback === "incorrect" && correctAnswer
      ? `Correct Answer: ${verbFormLabel}`
      : `English → ${verbFormLabel}`;

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

  const handleWordHover = (e: React.MouseEvent) => {
    if (!verb || feedback !== null || !verbForm) return; // Don't show during feedback

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
      className={`${getFeedbackClasses()} rounded-xl p-8 text-center transition-all duration-300 border-2 animate-slide-up`}
    >
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
        {showHintPopup && verb && verbForm && (
          <div
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y - 40}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <AIHintPopup
              word={verb.english_infinitive}
              translation={verb[verbForm] || ""}
              mode="en-nl"
              isVisible={showHintPopup}
              onClose={() => setShowHintPopup(false)}
            />
          </div>
        )}
      </div>

      {/*<div className="text-secondary-light text-sm">*/}
      {/*  Provide the {verbFormLabel.toLowerCase()} form*/}
      {/*</div>*/}
    </div>
  );
};

export default VerbCard;
