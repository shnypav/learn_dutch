import { useState, useEffect } from "react";
import {
  getInitialHintLevel,
  getNextHintLevel,
  type HintLevel,
} from "../utils/hintGenerator";

interface HintButtonProps {
  correctAnswer: string;
  onHintUsed: (hintLevel: HintLevel) => void;
  onShowAnswer: () => void;
  disabled?: boolean;
  className?: string;
}

const HintButton: React.FC<HintButtonProps> = ({
  correctAnswer,
  onHintUsed,
  onShowAnswer,
  disabled = false,
  className = "",
}) => {
  const [hintLevel, setHintLevel] = useState<HintLevel>(getInitialHintLevel());
  const [isShowAnswer, setIsShowAnswer] = useState(false);

  useEffect(() => {
    setHintLevel(getInitialHintLevel());
    setIsShowAnswer(false);
  }, [correctAnswer]);

  const handleHintClick = () => {
    try {
      if (disabled) return;

      if (hintLevel < 4) {
        onHintUsed(hintLevel);
        setHintLevel(getNextHintLevel(hintLevel));
      } else {
        setIsShowAnswer(true);
        onShowAnswer();
      }
    } catch (error) {
      console.error("HintButton: Error handling hint click:", error);
      // Fallback to safe state
      setIsShowAnswer(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleHintClick();
    }
  };

  const getButtonText = (): string => {
    if (isShowAnswer) {
      return "Answer Shown";
    }

    switch (hintLevel) {
      case 1:
        return "Hint";
      case 2:
        return "Hint";
      case 3:
        return "Hint";
      case 4:
        return "Show Answer";
      default:
        return "Hint";
    }
  };

  const getButtonVariant = (): string => {
    if (isShowAnswer) {
      return "bg-gray-500 text-white border-gray-400 cursor-not-allowed";
    }

    if (hintLevel === 4) {
      return "bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-400 hover:from-orange-600 hover:to-red-700";
    }

    return "hint-btn border-2";
  };

  if (!correctAnswer || correctAnswer.trim().length === 0) {
    return null;
  }

  return (
    <button
      onClick={handleHintClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || isShowAnswer}
      className={`
        w-full px-4 py-3 sm:px-6 sm:py-3 rounded-lg font-medium text-sm sm:text-base 
        transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm
        focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
        ${getButtonVariant()}
        ${disabled || isShowAnswer ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
        ${className}
      `}
      title={
        hintLevel === 4
          ? "Show the complete answer"
          : `Get hint level ${hintLevel}`
      }
      aria-label={
        hintLevel === 4
          ? "Show the complete answer"
          : `Get hint level ${hintLevel} for current question`
      }
      aria-describedby={isShowAnswer ? "hint-answer-shown" : undefined}
      role="button"
      tabIndex={disabled || isShowAnswer ? -1 : 0}
    >
      <span className="flex items-center justify-center space-x-2">
        <span>💡</span>
        <span>{getButtonText()}</span>
      </span>
      {isShowAnswer && (
        <span id="hint-answer-shown" className="sr-only">
          Answer has been shown. Continue to next question.
        </span>
      )}
    </button>
  );
};

export default HintButton;
