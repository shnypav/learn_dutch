import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AIHintProvider, useAIHint } from './AIHintContext';
import { ReactNode } from 'react';
import '@testing-library/jest-dom';

const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn()
};

vi.mock('../utils/storage', () => ({
  storage: mockStorage
}));

vi.mock('../services/aiHintService', () => ({
  AIHintService: class {
    generateHint = vi.fn().mockResolvedValue({
      hint: 'Test hint',
      examples: ['Example 1', 'Example 2']
    });
    isConfigured = vi.fn().mockReturnValue(true);
    configure = vi.fn();
  }
}));

describe('AIHintContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.get.mockReturnValue(null);
  });

  describe('AIHintProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AIHintProvider>{children}</AIHintProvider>
    );

    it('should provide AI hint context to children', () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      expect(result.current).toHaveProperty('hint');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('generateHint');
    });

    it('should load configuration from storage', () => {
      const config = { apiKey: 'test-key', model: 'test-model' };
      mockStorage.get.mockReturnValue(config);
      
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      expect(result.current.config).toEqual(config);
      expect(mockStorage.get).toHaveBeenCalledWith('aiHintConfig');
    });

    it('should have default configuration', () => {
      mockStorage.get.mockReturnValue(null);
      
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      expect(result.current.config).toEqual({
        enabled: false,
        provider: 'perplexity',
        apiKey: '',
        model: 'llama-3.1-sonar-small-128k-online'
      });
    });
  });

  describe('useAIHint hook', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AIHintProvider>{children}</AIHintProvider>
    );

    it('should generate hint successfully', async () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      await act(async () => {
        await result.current.generateHint('test word', 'context');
      });

      await waitFor(() => {
        expect(result.current.hint).toBe('Test hint');
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle loading state', async () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      expect(result.current.isLoading).toBe(false);
      
      const promise = act(async () => {
        await result.current.generateHint('test word', 'context');
      });

      expect(result.current.isLoading).toBe(true);
      
      await promise;
      
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle errors', async () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      const mockError = new Error('API Error');
      vi.mocked(result.current.service.generateHint).mockRejectedValueOnce(mockError);
      
      await act(async () => {
        await result.current.generateHint('test word', 'context');
      });

      expect(result.current.error).toBe('API Error');
      expect(result.current.hint).toBe('');
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear hint', () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      act(() => {
        result.current.hint = 'Some hint';
        result.current.clearHint();
      });

      expect(result.current.hint).toBe('');
      expect(result.current.error).toBeNull();
    });

    it('should update configuration', () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      const newConfig = {
        enabled: true,
        provider: 'openai',
        apiKey: 'new-key',
        model: 'gpt-4'
      };
      
      act(() => {
        result.current.updateConfig(newConfig);
      });

      expect(result.current.config).toEqual(newConfig);
      expect(mockStorage.set).toHaveBeenCalledWith('aiHintConfig', newConfig);
    });

    it('should check if AI hints are enabled', () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      expect(result.current.isEnabled()).toBe(false);
      
      act(() => {
        result.current.updateConfig({ ...result.current.config, enabled: true });
      });
      
      expect(result.current.isEnabled()).toBe(true);
    });

    it('should not generate hint when disabled', async () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      act(() => {
        result.current.updateConfig({ ...result.current.config, enabled: false });
      });
      
      await act(async () => {
        await result.current.generateHint('test word', 'context');
      });

      expect(result.current.hint).toBe('');
      expect(result.current.service.generateHint).not.toHaveBeenCalled();
    });

    it('should handle hint history', () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      act(() => {
        result.current.addToHistory({
          word: 'test',
          hint: 'Test hint',
          timestamp: Date.now()
        });
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].word).toBe('test');
    });

    it('should limit hint history size', () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addToHistory({
            word: `word${i}`,
            hint: `Hint ${i}`,
            timestamp: Date.now()
          });
        }
      });

      expect(result.current.history).toHaveLength(10); // Max history size
      expect(result.current.history[0].word).toBe('word5'); // Oldest kept
    });

    it('should clear hint history', () => {
      const { result } = renderHook(() => useAIHint(), { wrapper });
      
      act(() => {
        result.current.addToHistory({
          word: 'test',
          hint: 'Test hint',
          timestamp: Date.now()
        });
        result.current.clearHistory();
      });

      expect(result.current.history).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should throw error when useAIHint is used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAIHint());
      }).toThrow('useAIHint must be used within an AIHintProvider');
      
      consoleSpy.mockRestore();
    });
  });
});