import { useState, useEffect } from "react";
import type { AIHintResult } from "../services/aiHintService";
import type { LearningMode } from "../types";
import { useAIHint } from "../contexts/AIHintContext";

interface AIHintPopupProps {
  word: string;
  translation: string;
  mode: LearningMode;
  isVisible: boolean;
  onClose?: () => void;
}

const AIHintPopup: React.FC<AIHintPopupProps> = ({
  word,
  translation,
  mode,
  isVisible,
}) => {
  const { getCachedHint, isHintLoading } = useAIHint();
  const [hintData, setHintData] = useState<AIHintResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove **bold**
      .replace(/\*(.*?)\*/g, "$1") // Remove *italic*
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .trim();
  };

  useEffect(() => {
    if (isVisible && word && translation) {
      // Check if hint is already cached
      const cached = getCachedHint(word, translation, mode);
      if (cached) {
        setHintData(cached);
        setIsLoading(false);
      } else {
        // Check if it's currently loading
        const loading = isHintLoading(word, translation, mode);
        setIsLoading(loading);

        // If loading, poll for the result
        if (loading) {
          const checkInterval = setInterval(() => {
            const result = getCachedHint(word, translation, mode);
            if (result) {
              setHintData(result);
              setIsLoading(false);
              clearInterval(checkInterval);
            }
          }, 500); // Check every 500ms

          // Cleanup interval on unmount or when dependencies change
          return () => clearInterval(checkInterval);
        }
      }
    }
  }, [isVisible, word, translation, mode, getCachedHint, isHintLoading]);

  if (!isVisible) {
    return null;
  }

  // Simple tooltip - just show the sentence
  if (isLoading) {
    return (
      <div className="bg-gray-800/70 text-white text-sm text-left px-4 py-2 rounded-md shadow-lg min-w-80 max-w-md animate-fade-in backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-300 border-t-transparent"></div>
          <span>Loading examples...</span>
        </div>
      </div>
    );
  }

  if (!hintData && !isLoading) {
    return null;
  }

  const targetLang = mode === "nl-en" ? "dutch" : "english";
  const examplesTitle = targetLang === "dutch" ? "Voorbeelden:" : "Examples:";
  const explanationTitle = targetLang === "dutch" ? "Uitleg:" : "Explanation:";

  return (
    <div className="bg-gray-800/70 text-white text-sm text-left px-4 py-3 rounded-md shadow-lg min-w-80 max-w-lg animate-fade-in backdrop-blur-md">
      <div className="space-y-3">
        {/* Explanation Section */}
        <div>
          <div className="text-blue-400 font-semibold mb-1">
            {explanationTitle}
          </div>
          <div className="text-gray-100">
            {cleanMarkdown(hintData.explanation)}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600"></div>

        {/* Examples Section */}
        <div>
          <div className="text-blue-400 font-semibold mb-1">
            {examplesTitle}
          </div>
          <div className="space-y-1">
            {hintData.examples.map((sentence, index) => (
              <div key={index} className="flex items-start space-x-2 text-left">
                <span className="text-gray-400 mt-0.5">{index + 1}.</span>
                <span className="flex-1 text-gray-100">
                  {cleanMarkdown(sentence)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIHintPopup;
