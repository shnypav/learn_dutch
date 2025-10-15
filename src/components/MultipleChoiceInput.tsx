import { useState, useEffect } from "react";
import type { FeedbackType } from "../types";

interface MultipleChoiceInputProps {
  options: string[];
  correctAnswer: string;
  onSubmit: (selectedOption: string) => void;
  disabled?: boolean;
  feedback: FeedbackType;
}

const MultipleChoiceInput: React.FC<MultipleChoiceInputProps> = ({
  options,
  correctAnswer,
  onSubmit,
  disabled = false,
  feedback,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Reset selection when options change (new question)
  useEffect(() => {
    setSelectedOption(null);
  }, [options]);

  // Keyboard support for 1-4 keys
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (disabled || feedback) return;

      const key = e.key;
      if (["1", "2", "3", "4"].includes(key)) {
        const index = parseInt(key) - 1;
        if (index < options.length) {
          const option = options[index];
          setSelectedOption(option);
          onSubmit(option);
        }
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [disabled, feedback, options, onSubmit]);

  const handleOptionClick = (option: string) => {
    if (disabled || feedback) return;

    setSelectedOption(option);
    onSubmit(option);
  };

  const getOptionClass = (option: string) => {
    const baseClass =
      "w-full p-4 rounded-lg text-left font-medium transition-all duration-300 border-2 min-h-[60px] flex items-center justify-between";

    // Show feedback after answer submitted
    if (feedback && selectedOption === option) {
      if (option === correctAnswer) {
        return `${baseClass} bg-green-500 text-white border-green-400 shadow-lg`;
      } else {
        return `${baseClass} bg-red-500 text-white border-red-400 shadow-lg`;
      }
    }

    // Show correct answer after wrong submission
    if (feedback === "incorrect" && option === correctAnswer) {
      return `${baseClass} bg-green-100 dark:bg-green-900 border-green-400 text-green-800 dark:text-green-200`;
    }

    // Default state
    if (disabled) {
      return `${baseClass} bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-400 cursor-not-allowed opacity-50`;
    }

    return `${baseClass} card-bg text-primary border-transparent hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 cursor-pointer hover:scale-102 active:scale-98`;
  };

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            disabled={disabled || feedback !== null}
            className={getOptionClass(option)}
          >
            <span className="flex-1 text-base">{option}</span>
            <span className="text-sm opacity-60 ml-2 font-mono">
              {index + 1}
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm text-center opacity-60 text-primary">
        Click an option or press 1-4 on your keyboard
      </p>
    </div>
  );
};

export default MultipleChoiceInput;
