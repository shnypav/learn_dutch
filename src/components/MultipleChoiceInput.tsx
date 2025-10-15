import { useState, useEffect } from 'react';
import type { FeedbackType } from '../types';

interface MultipleChoiceInputProps {
  options: string[];
  correctAnswer: string;
  onSubmit: (answer: string) => void;
  feedback: FeedbackType;
  disabled?: boolean;
}

const MultipleChoiceInput: React.FC<MultipleChoiceInputProps> = ({
  options,
  correctAnswer,
  onSubmit,
  feedback,
  disabled = false
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Reset state when moving to a new question
  useEffect(() => {
    if (feedback === null) {
      setSelectedAnswer(null);
      setHasSubmitted(false);
    }
  }, [feedback, options]);

  const handleOptionClick = (option: string) => {
    if (disabled || hasSubmitted) return;
    
    setSelectedAnswer(option);
    setHasSubmitted(true);
    onSubmit(option);
  };

  const getOptionClasses = (option: string): string => {
    const baseClasses = "w-full text-left px-6 py-4 rounded-lg transition-all duration-200 border-2 font-medium";
    
    // If feedback is shown (after submission)
    if (hasSubmitted && feedback !== null) {
      if (option === correctAnswer) {
        // Always highlight the correct answer in green
        return `${baseClasses} bg-green-500 bg-opacity-20 border-green-400 text-green-100`;
      } else if (option === selectedAnswer) {
        // Highlight the wrong selected answer in red
        return `${baseClasses} bg-red-500 bg-opacity-20 border-red-400 text-red-100`;
      } else {
        // Dim other options
        return `${baseClasses} bg-white bg-opacity-5 border-transparent text-secondary-light opacity-50`;
      }
    }
    
    // Before submission
    if (option === selectedAnswer) {
      return `${baseClasses} bg-blue-500 bg-opacity-20 border-blue-400 text-blue-100 scale-105`;
    }
    
    return `${baseClasses} bg-white bg-opacity-10 border-white border-opacity-20 text-primary-light hover:bg-opacity-20 hover:scale-105 cursor-pointer`;
  };

  const getOptionLabel = (index: number): string => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  return (
    <div className="w-full space-y-3">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleOptionClick(option)}
          disabled={disabled || hasSubmitted}
          className={getOptionClasses(option)}
        >
          <div className="flex items-center space-x-4">
            <span className="text-lg font-bold opacity-70 min-w-[2rem]">
              {getOptionLabel(index)}.
            </span>
            <span className="text-lg flex-1 text-left">
              {option}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default MultipleChoiceInput;
