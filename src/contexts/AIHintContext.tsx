import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { aiHintService, type AIHintResult } from "../services/aiHintService";
import type { LearningMode } from "../types";

interface HintCacheKey {
  word: string;
  translation: string;
  mode: LearningMode;
}

interface AIHintContextType {
  isConfigured: boolean;
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
  showConfigDialog: boolean;
  setShowConfigDialog: (show: boolean) => void;
  preloadHint: (word: string, translation: string, mode: LearningMode) => void;
  getCachedHint: (
    word: string,
    translation: string,
    mode: LearningMode,
  ) => AIHintResult | null;
  isHintLoading: (
    word: string,
    translation: string,
    mode: LearningMode,
  ) => boolean;
}

const AIHintContext = createContext<AIHintContextType | undefined>(undefined);

interface AIHintProviderProps {
  children: ReactNode;
}

const API_KEY_STORAGE_KEY = "ai_hint_api_key";

export const AIHintProvider: React.FC<AIHintProviderProps> = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [hintCache, setHintCache] = useState<Map<string, AIHintResult>>(
    new Map(),
  );
  const [loadingHints, setLoadingHints] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check if API key is already stored
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      aiHintService.setApiKey(storedKey);
      setIsConfigured(true);
    }
  }, []);

  const setApiKey = (apiKey: string) => {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
      aiHintService.setApiKey(apiKey.trim());
      setIsConfigured(true);
      setShowConfigDialog(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setIsConfigured(false);
    aiHintService.clearCache();
    setHintCache(new Map());
    setLoadingHints(new Set());
  };

  const getCacheKey = useCallback(
    (word: string, translation: string, mode: LearningMode): string => {
      return `${word}_${translation}_${mode}`;
    },
    [],
  );

  const preloadHint = useCallback(
    async (word: string, translation: string, mode: LearningMode) => {
      if (!isConfigured) return;

      const cacheKey = getCacheKey(word, translation, mode);

      // Already cached or loading
      if (hintCache.has(cacheKey) || loadingHints.has(cacheKey)) {
        return;
      }

      // Mark as loading
      setLoadingHints((prev) => new Set(prev).add(cacheKey));

      try {
        // Determine target language based on mode
        const targetLang = mode === "nl-en" ? "dutch" : "english";

        // Load the hint in background
        const hintResult = await aiHintService.generateHint(
          word,
          translation,
          targetLang,
        );

        // Store in cache
        setHintCache((prev) => new Map(prev).set(cacheKey, hintResult));
      } catch (error) {
        console.error("Failed to preload hint:", error);
      } finally {
        // Remove from loading set
        setLoadingHints((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cacheKey);
          return newSet;
        });
      }
    },
    [isConfigured, getCacheKey],
  );

  const getCachedHint = useCallback(
    (
      word: string,
      translation: string,
      mode: LearningMode,
    ): AIHintResult | null => {
      const cacheKey = getCacheKey(word, translation, mode);
      return hintCache.get(cacheKey) || null;
    },
    [hintCache, getCacheKey],
  );

  const isHintLoading = useCallback(
    (word: string, translation: string, mode: LearningMode): boolean => {
      const cacheKey = getCacheKey(word, translation, mode);
      return loadingHints.has(cacheKey);
    },
    [loadingHints, getCacheKey],
  );

  return (
    <AIHintContext.Provider
      value={{
        isConfigured,
        setApiKey,
        clearApiKey,
        showConfigDialog,
        setShowConfigDialog,
        preloadHint,
        getCachedHint,
        isHintLoading,
      }}
    >
      {children}
    </AIHintContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAIHint = () => {
  const context = useContext(AIHintContext);
  if (context === undefined) {
    throw new Error("useAIHint must be used within an AIHintProvider");
  }
  return context;
};
