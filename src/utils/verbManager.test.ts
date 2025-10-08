import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerbManager } from './verbManager';
import * as storage from './storage';

vi.mock('./storage');

describe('VerbManager', () => {
  let manager: VerbManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new VerbManager();
  });

  describe('initialization', () => {
    it('should initialize with empty verbs array', () => {
      expect(manager.getVerbs()).toEqual([]);
    });

    it('should set initial stats from storage', () => {
      const mockStats = { correct: 10, incorrect: 3, streak: 5 };
      vi.spyOn(storage.storage, 'get').mockReturnValue(mockStats);
      
      const newManager = new VerbManager();
      expect(newManager.getStats()).toEqual(mockStats);
    });
  });

  describe('loadVerbs', () => {
    it('should load and parse CSV data', async () => {
      const csvData = `infinitive,past_singular,past_participle,english
lopen,liep,gelopen,to walk
zijn,was,geweest,to be`;
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(csvData)
      });

      await manager.loadVerbs();
      
      const verbs = manager.getVerbs();
      expect(verbs).toHaveLength(2);
      expect(verbs[0]).toEqual({
        infinitive: 'lopen',
        past_singular: 'liep',
        past_participle: 'gelopen',
        english: 'to walk'
      });
    });
  });

  describe('getRandomVerb', () => {
    beforeEach(() => {
      manager['verbs'] = [
        { infinitive: 'lopen', past_singular: 'liep', past_participle: 'gelopen', english: 'to walk' },
        { infinitive: 'zijn', past_singular: 'was', past_participle: 'geweest', english: 'to be' }
      ];
    });

    it('should return a random verb', () => {
      const verb = manager.getRandomVerb();
      expect(verb).toBeDefined();
      expect(manager['verbs']).toContainEqual(verb);
    });

    it('should return null if no verbs loaded', () => {
      manager['verbs'] = [];
      expect(manager.getRandomVerb()).toBeNull();
    });
  });

  describe('checkConjugation', () => {
    const testVerb = {
      infinitive: 'lopen',
      past_singular: 'liep',
      past_participle: 'gelopen',
      english: 'to walk'
    };

    it('should check infinitive form correctly', () => {
      expect(manager.checkConjugation('lopen', testVerb, 'infinitive')).toBe(true);
      expect(manager.checkConjugation('Lopen', testVerb, 'infinitive')).toBe(true);
      expect(manager.checkConjugation('wrong', testVerb, 'infinitive')).toBe(false);
    });

    it('should check past_singular form correctly', () => {
      expect(manager.checkConjugation('liep', testVerb, 'past_singular')).toBe(true);
      expect(manager.checkConjugation('LIEP', testVerb, 'past_singular')).toBe(true);
      expect(manager.checkConjugation('wrong', testVerb, 'past_singular')).toBe(false);
    });

    it('should check past_participle form correctly', () => {
      expect(manager.checkConjugation('gelopen', testVerb, 'past_participle')).toBe(true);
      expect(manager.checkConjugation('  gelopen  ', testVerb, 'past_participle')).toBe(true);
      expect(manager.checkConjugation('wrong', testVerb, 'past_participle')).toBe(false);
    });

    it('should handle multiple correct forms separated by slash', () => {
      const verbWithMultiple = {
        ...testVerb,
        past_singular: 'liep/liepen'
      };
      
      expect(manager.checkConjugation('liep', verbWithMultiple, 'past_singular')).toBe(true);
      expect(manager.checkConjugation('liepen', verbWithMultiple, 'past_singular')).toBe(true);
    });
  });

  describe('getVerbsByDifficulty', () => {
    beforeEach(() => {
      manager['verbs'] = [
        { infinitive: 'lopen', past_singular: 'liep', past_participle: 'gelopen', english: 'to walk', difficulty: 'easy' },
        { infinitive: 'zijn', past_singular: 'was', past_participle: 'geweest', english: 'to be', difficulty: 'hard' },
        { infinitive: 'hebben', past_singular: 'had', past_participle: 'gehad', english: 'to have', difficulty: 'easy' }
      ];
    });

    it('should filter verbs by difficulty', () => {
      const easyVerbs = manager.getVerbsByDifficulty('easy');
      expect(easyVerbs).toHaveLength(2);
      expect(easyVerbs.every(v => v.difficulty === 'easy')).toBe(true);
    });

    it('should return all verbs if difficulty not specified', () => {
      const verbs = manager.getVerbsByDifficulty();
      expect(verbs).toHaveLength(3);
    });
  });

  describe('stats management', () => {
    it('should record correct answer', () => {
      manager.recordAnswer(true);
      
      const stats = manager.getStats();
      expect(stats.correct).toBe(1);
      expect(stats.incorrect).toBe(0);
      expect(stats.streak).toBe(1);
    });

    it('should record incorrect answer and reset streak', () => {
      manager.recordAnswer(true);
      manager.recordAnswer(true);
      manager.recordAnswer(false);
      
      const stats = manager.getStats();
      expect(stats.correct).toBe(2);
      expect(stats.incorrect).toBe(1);
      expect(stats.streak).toBe(0);
    });

    it('should save stats to storage', () => {
      const setSpy = vi.spyOn(storage.storage, 'set');
      
      manager.recordAnswer(true);
      
      expect(setSpy).toHaveBeenCalledWith('verbStats', expect.objectContaining({
        correct: 1,
        incorrect: 0,
        streak: 1
      }));
    });

    it('should reset stats', () => {
      manager.recordAnswer(true);
      manager.recordAnswer(false);
      manager.resetStats();
      
      expect(manager.getStats()).toEqual({
        correct: 0,
        incorrect: 0,
        streak: 0
      });
    });
  });

  describe('getAllForms', () => {
    it('should return all unique forms of a verb', () => {
      const verb = {
        infinitive: 'lopen',
        past_singular: 'liep',
        past_participle: 'gelopen',
        english: 'to walk'
      };
      
      const forms = manager.getAllForms(verb);
      expect(forms).toEqual(['lopen', 'liep', 'gelopen']);
    });

    it('should handle duplicate forms', () => {
      const verb = {
        infinitive: 'zetten',
        past_singular: 'zette',
        past_participle: 'gezet',
        present: 'zet',
        english: 'to put'
      };
      
      const forms = manager.getAllForms(verb);
      expect(forms).toContain('zetten');
      expect(forms).toContain('zette');
      expect(forms).toContain('gezet');
    });
  });
});