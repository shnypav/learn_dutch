import { useState, useEffect } from 'react';
import type { FeedbackType } from '../types';

interface MultipleChoiceOptionsProps {
  options: string[];
  correctAnswer: string;
  onSubmit: (answer: string) => void;
  feedback: FeedbackType;
  disabled?: boolean;
}

const MultipleChoiceOptions: React.FC<MultipleChoiceOptionsProps> = ({
  options,
  correctAnswer,
  onSubmit,
  feedback,
  disabled = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Reset selected option when feedback is cleared (new question)
  useEffect(() => {
    if (feedback === null) {
      setSelectedOption(null);
    }
  }, [feedback]);

  const handleOptionClick = (option: string) => {
    if (disabled || feedback !== null) return;

    setSelectedOption(option);
    onSubmit(option);
  };

  const getOptionClasses = (option: string): string => {
    const baseClasses = 'w-full p-4 rounded-xl text-left font-medium transition-all duration-200 border-2';
    
    // If feedback is shown and this is the selected option
    if (feedback !== null && option === selectedOption) {
      if (feedback === 'correct') {
        return `${baseClasses} bg-green-500 bg-opacity-20 border-green-300 text-white`;
      } else {
        return `${baseClasses} bg-red-500 bg-opacity-20 border-red-300 text-white`;
      }
    }
    
    // Show correct answer when user selected wrong answer
    if (feedback === 'incorrect' && option === correctAnswer) {
      return `${baseClasses} bg-green-500 bg-opacity-10 border-green-400 text-white`;
    }
    
    // Normal state
    if (disabled || feedback !== null) {
      return `${baseClasses} bg-white bg-opacity-5 border-white border-opacity-10 text-white text-opacity-50 cursor-not-allowed`;
    }
    
    return `${baseClasses} card-bg border-white border-opacity-20 text-white hover:bg-opacity-30 hover:border-opacity-40 hover:scale-105 cursor-pointer`;
  };

  return (
    <div className="w-full max-w-md space-y-3 animate-fade-in">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleOptionClick(option)}
          disabled={disabled || feedback !== null}
          className={getOptionClasses(option)}
          aria-label={`Option ${index + 1}: ${option}`}
        >
          <div className="flex items-center space-x-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white bg-opacity-10 flex items-center justify-center text-sm font-bold">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="flex-1 text-lg">{option}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default MultipleChoiceOptions;
