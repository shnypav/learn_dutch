import { useState, useEffect, useRef } from 'react';
import { aiHintService } from '../services/aiHintService';
import type { LearningMode } from '../types';

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
  isVisible
}) => {
  const [exampleSentence, setExampleSentence] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestInProgress = useRef(false);

  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
      .replace(/^["']|["']$/g, '')      // Remove surrounding quotes
      .trim();
  };

  useEffect(() => {
    if (isVisible && word && translation && !exampleSentence && !isLoading && !error && !requestInProgress.current) {
      generateHint();
    } 
    // Don't reset state when hiding - keep the cached result for next time
  }, [isVisible, word, translation, mode, exampleSentence, isLoading, error]);

  const generateHint = async () => {
    if (requestInProgress.current) {
      return; // Already generating, don't start another request
    }
    
    requestInProgress.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine which language to generate the sentence in
      const targetLang = mode === 'nl-en' ? 'dutch' : 'english';
      const sentence = await aiHintService.generateExampleSentence(
        word, 
        translation, 
        targetLang
      );
      setExampleSentence(sentence);
    } catch (err) {
      setError('Failed to generate example sentence');
      console.error('Hint generation error:', err);
    } finally {
      setIsLoading(false);
      requestInProgress.current = false;
    }
  };

  if (!isVisible) {
    return null;
  }

  // Simple tooltip - just show the sentence
  if (isLoading) {
    return (
      <div className="bg-gray-800 bg-opacity-90 text-white text-sm px-4 py-2 rounded-md shadow-lg min-w-80 max-w-md animate-fade-in">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-300 border-t-transparent"></div>
          <span>Loading example...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 bg-opacity-90 text-red-300 text-sm px-4 py-2 rounded-md shadow-lg min-w-80 max-w-md animate-fade-in">
        Failed to load example
      </div>
    );
  }

  if (!exampleSentence) {
    return null;
  }

  return (
    <div className="bg-gray-800 bg-opacity-90 text-white text-sm px-4 py-2 rounded-md shadow-lg min-w-80 max-w-md animate-fade-in">
      {cleanMarkdown(exampleSentence)}
    </div>
  );
};

export default AIHintPopup;