import { useState, useEffect, useCallback } from "react";
import type { FeedbackType } from "../types";
import { useRef } from "react";

interface SentenceConstructionInputProps {
    scrambledWords: string[];
    correctAnswer: string;
    onSubmit: (constructedSentence: string) => void;
    onNext?: () => void;
    showNextButton?: boolean;
    disabled?: boolean;
    feedback: FeedbackType;
}

const SentenceConstructionInput: React.FC<SentenceConstructionInputProps> = ({
    scrambledWords,
    correctAnswer,
    onSubmit,
    onNext,
    showNextButton = false,
    disabled = false,
    feedback,
}) => {
    // Track which words from the bank have been selected (by index)
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // Reset selection when scrambledWords change (new question)
    useEffect(() => {
        setSelectedIndices([]);
    }, [scrambledWords]);

    // Get the constructed sentence from selected words
    const constructedWords = selectedIndices.map((index) => scrambledWords[index]);
    const constructedSentence = constructedWords.join(" ");

    // Get available words (not yet selected)
    const availableIndices = scrambledWords
        .map((_, index) => index)
        .filter((index) => !selectedIndices.includes(index));

    // Add a word to the construction
    const addWord = useCallback(
        (index: number) => {
            if (disabled || feedback !== null) return;
            if (selectedIndices.includes(index)) return;

            setSelectedIndices((prev) => [...prev, index]);
        },
        [disabled, feedback, selectedIndices]
    );

    // Remove a word from the construction (click on constructed word)
    const removeWord = useCallback(
        (positionInConstruction: number) => {
            if (disabled || feedback !== null) return;

            setSelectedIndices((prev) =>
                prev.filter((_, idx) => idx !== positionInConstruction)
            );
        },
        [disabled, feedback]
    );

    // Reset the construction
    const resetConstruction = useCallback(() => {
        if (disabled || feedback !== null) return;
        setSelectedIndices([]);
    }, [disabled, feedback]);

    // Submit the constructed sentence
    const handleSubmit = useCallback(() => {
        if (disabled || feedback !== null) return;
        if (constructedWords.length === 0) return;

        onSubmit(constructedSentence);
    }, [disabled, feedback, constructedWords.length, constructedSentence, onSubmit]);

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled || feedback !== null) return;

            // Number keys 1-9 to add words from the bank
            if (e.key >= "1" && e.key <= "9") {
                const keyIndex = parseInt(e.key) - 1;
                if (keyIndex < availableIndices.length) {
                    addWord(availableIndices[keyIndex]);
                }
                return;
            }

            // Backspace to remove last word
            if (e.key === "Backspace" && selectedIndices.length > 0) {
                e.preventDefault();
                setSelectedIndices((prev) => prev.slice(0, -1));
                return;
            }

            // Enter to submit
            if (e.key === "Enter" && constructedWords.length > 0) {
                e.preventDefault();
                handleSubmit();
                return;
            }

            // Escape to reset
            if (e.key === "Escape") {
                e.preventDefault();
                resetConstruction();
                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        disabled,
        feedback,
        availableIndices,
        selectedIndices,
        constructedWords.length,
        addWord,
        handleSubmit,
        resetConstruction,
    ]);

    const getWordBankButtonClass = (index: number) => {
        const baseClass =
            "px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2 text-base";

        if (disabled) {
            return `${baseClass} bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-400 cursor-not-allowed opacity-50`;
        }

        // Already selected (should not appear, but just in case)
        if (selectedIndices.includes(index)) {
            return `${baseClass} bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed opacity-30`;
        }

        return `${baseClass} bg-white/20 text-white border-white/30 hover:border-blue-400 hover:bg-white/30 cursor-pointer hover:scale-105 active:scale-95`;
    };

    const getConstructedWordClass = (_positionIndex: number) => {
        const baseClass =
            "px-3 py-2 rounded-lg font-medium transition-all duration-200 border-2 text-base";

        if (feedback === "correct") {
            return `${baseClass} bg-green-500 text-white border-green-400`;
        }

        if (feedback === "incorrect") {
            return `${baseClass} bg-red-500 text-white border-red-400`;
        }

        if (disabled) {
            return `${baseClass} bg-gray-400 text-gray-700 border-gray-500 cursor-not-allowed`;
        }

        return `${baseClass} bg-blue-500 text-white border-blue-400 cursor-pointer hover:bg-blue-600 hover:scale-105 active:scale-95`;
    };

    return (
        <div className="w-full space-y-4">
            {/* Construction Area */}
            <div className="card-bg rounded-xl p-4 min-h-[80px] border-2 border-dashed border-white border-opacity-30">
                <div className="text-xs text-secondary-light mb-2 uppercase tracking-wide">
                    Your Sentence
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                    {constructedWords.length === 0 ? (
                        <span className="text-secondary-light text-sm italic">
                            Click words below to build your sentence...
                        </span>
                    ) : (
                        constructedWords.map((word, positionIndex) => (
                            <button
                                key={`constructed-${positionIndex}`}
                                onClick={() => removeWord(positionIndex)}
                                disabled={disabled || feedback !== null}
                                className={getConstructedWordClass(positionIndex)}
                                title="Click to remove"
                            >
                                {word}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Word Bank */}
            <div className="card-bg rounded-xl p-4 border-2 border-white border-opacity-20">
                <div className="text-xs text-secondary-light mb-2 uppercase tracking-wide">
                    Word Bank
                </div>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {scrambledWords.map((word, index) => {
                        // Skip words that have been selected
                        if (selectedIndices.includes(index)) {
                            return null;
                        }

                        // Find the position in available indices for keyboard shortcut display
                        const availablePosition = availableIndices.indexOf(index);

                        return (
                            <button
                                key={`bank-${index}`}
                                onClick={() => addWord(index)}
                                disabled={disabled || feedback !== null}
                                className={getWordBankButtonClass(index)}
                            >
                                <span>{word}</span>
                                {availablePosition < 9 && !disabled && !feedback && (
                                    <span className="ml-2 text-xs opacity-50 font-mono">
                                        {availablePosition + 1}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    {availableIndices.length === 0 && (
                        <span className="text-secondary-light text-sm italic">
                            All words used!
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="card-bg rounded-xl p-3 flex gap-3 justify-center">
                {(feedback === "incorrect" || showNextButton) && onNext ? (
                    <NextButton onClick={onNext} />
                ) : (
                    <>
                        <button
                            onClick={resetConstruction}
                            disabled={
                                disabled || feedback !== null || selectedIndices.length === 0
                            }
                            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2 border-white/30 text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={
                                disabled || feedback !== null || constructedWords.length === 0
                            }
                            className="px-6 py-2 rounded-lg font-medium transition-all duration-200 bg-green-500 text-white border-2 border-green-400 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit
                        </button>
                    </>
                )}
            </div>

            {/* Help text */}
            <p className="text-sm text-center opacity-60 text-primary">
                Click words to add/remove, or use keyboard: 1-9 to add, Backspace to
                remove, Enter to submit
            </p>
        </div>
    );
};

export default SentenceConstructionInput;

const NextButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        // Delay focus to avoid capturing the same Enter keyup that submitted the answer
        const timer = window.setTimeout(() => {
            buttonRef.current?.focus();
        }, 150);
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <button
            ref={buttonRef}
            onClick={onClick}
            className="flex-1 px-6 py-2 rounded-lg font-medium transition-all duration-200 bg-blue-500 text-white border-2 border-blue-400 hover:bg-blue-600 hover:scale-105 active:scale-95"
        >
            Next Sentence →
        </button>
    );
};
