import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { FeedbackType } from "../types";
import {
  getInitialHintLevel,
  getNextHintLevel,
  type HintLevel,
} from "../utils/hintGenerator";

interface InputFieldProps {
  onSubmit: (answer: string) => void;
  feedback: FeedbackType;
  disabled?: boolean;
  placeholder?: string;
  hintText?: string;
  // Hint-related props
  correctAnswer?: string;
  onHintUsed?: (hintLevel: HintLevel) => void;
  onShowAnswer?: () => void;
}

export interface InputFieldRef {
  getCurrentValue: () => string;
}

const InputField = forwardRef<InputFieldRef, InputFieldProps>(
  (
    {
      onSubmit,
      feedback,
      disabled = false,
      placeholder = "Type your answer...",
      hintText,
      correctAnswer,
      onHintUsed,
      onShowAnswer,
    },
    ref,
  ) => {
    const [value, setValue] = useState("");
    const [submittedAnswer, setSubmittedAnswer] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Hint button state
    const [hintLevel, setHintLevel] = useState<HintLevel>(
      getInitialHintLevel(),
    );
    const [isShowAnswer, setIsShowAnswer] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        getCurrentValue: () => value,
      }),
      [value],
    );

    // Reset hint state when correctAnswer changes (new question)
    useEffect(() => {
      setHintLevel(getInitialHintLevel());
      setIsShowAnswer(false);
    }, [correctAnswer]);

    useEffect(() => {
      // Focus input when component mounts or feedback resets
      if (inputRef.current && !disabled) {
        inputRef.current.focus();
      }
    }, [disabled, feedback]);

    useEffect(() => {
      // Clear input after feedback is shown
      if (feedback !== null) {
        const timer = setTimeout(() => {
          setValue("");
          setSubmittedAnswer("");
          if (inputRef.current && !disabled) {
            inputRef.current.focus();
          }
        }, 1500); // Match the feedback display duration

        return () => clearTimeout(timer);
      } else {
        // Clear submitted answer when feedback resets
        setSubmittedAnswer("");
      }
    }, [feedback, disabled]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (value.trim() && !disabled) {
        const trimmedAnswer = value.trim();
        setSubmittedAnswer(trimmedAnswer);
        onSubmit(trimmedAnswer);
        setValue(""); // 🧹 Clear input immediately after submission
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && value.trim() && !disabled) {
        const trimmedAnswer = value.trim();
        setSubmittedAnswer(trimmedAnswer);
        onSubmit(trimmedAnswer);
        setValue(""); // 🧹 Clear input immediately after submission
      }
    };

    const getFeedbackClasses = (): string => {
      switch (feedback) {
        case "correct":
          return "border-green-300 bg-green-500 bg-opacity-20 text-white placeholder-green-200";
        case "incorrect":
          return "border-red-300 bg-red-500 bg-opacity-20 text-white placeholder-red-200";
        default:
          return "input-field text-white placeholder-white placeholder-opacity-60 border-white border-opacity-20";
      }
    };

    const getPlaceholderText = (): string => {
      if (hintText && hintText.trim().length > 0) {
        return hintText;
      }
      return placeholder;
    };

    // Hint button handlers
    const handleHintClick = () => {
      try {
        if (disabled || !correctAnswer || !onHintUsed || !onShowAnswer) return;

        if (hintLevel < 4) {
          onHintUsed(hintLevel);
          setHintLevel(getNextHintLevel(hintLevel));
        } else {
          setIsShowAnswer(true);
          onShowAnswer();
        }
      } catch (error) {
        console.error("InputField: Error handling hint click:", error);
        // Fallback to safe state
        setIsShowAnswer(true);
      }
    };

    const getHintButtonText = (): string => {
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

    const getHintButtonVariant = (): string => {
      if (isShowAnswer) {
        return "bg-gray-500 text-white border-gray-400 cursor-not-allowed";
      }

      if (hintLevel === 4) {
        return "bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-400 hover:from-orange-600 hover:to-red-700";
      }

      return "btn-primary border-transparent hover:border-white hover:border-opacity-30";
    };

    return (
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="relative group">
          {/* Screen reader hint text announcement */}
          {hintText && (
            <div
              id="hint-text-announcement"
              className="sr-only"
              aria-live="polite"
              aria-atomic="true"
            >
              Hint: {hintText}
            </div>
          )}

          <input
            ref={inputRef}
            type="text"
            value={
              feedback !== null && submittedAnswer ? submittedAnswer : value
            }
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={feedback !== null ? "" : getPlaceholderText()}
            className={`
            w-full pl-4 pr-4 py-4 rounded-xl text-lg font-medium border
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30
            transition-all duration-300 placeholder:text-base
            ${getFeedbackClasses()}
            ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-opacity-20"}
          `}
            autoComplete="off"
            spellCheck={false}
            aria-label="Answer input field"
            aria-describedby={hintText ? "hint-text-announcement" : undefined}
            aria-invalid={feedback === "incorrect" ? "true" : "false"}
            role="textbox"
          />

          {value && !disabled && (
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2
                     bg-blue-600 hover:bg-blue-700
                     rounded-lg px-3 py-2 text-white font-medium text-sm
                     transition-all duration-200 hover:scale-105 border border-blue-500
                     shadow-lg hover:shadow-xl"
              aria-label="Submit answer"
              tabIndex={0}
            >
              Submit ↵
            </button>
          )}

          {!value &&
            !disabled &&
            correctAnswer &&
            correctAnswer.trim().length > 0 && (
              <button
                type="button"
                onClick={handleHintClick}
                disabled={disabled || isShowAnswer}
                className={`
              absolute right-2 top-1/2 transform -translate-y-1/2
              rounded-lg px-3 py-2 font-medium text-sm
              transition-all duration-200 border
              opacity-0 group-hover:opacity-100
              ${getHintButtonVariant()}
              ${disabled || isShowAnswer ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
              shadow-lg hover:shadow-xl
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
                tabIndex={disabled || isShowAnswer ? -1 : 0}
              >
                {getHintButtonText()}
              </button>
            )}
        </div>
      </form>
    );
  },
);

InputField.displayName = "InputField";

export default InputField;
