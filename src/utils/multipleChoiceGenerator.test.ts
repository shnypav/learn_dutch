import { describe, it, expect } from "vitest";
import {
  getDistractorWords,
  getDistractorVerbs,
  generateWordMultipleChoiceOptions,
  generateVerbMultipleChoiceOptions,
} from "./multipleChoiceGenerator";
import type { WordPair, VerbPair } from "../types";

describe("multipleChoiceGenerator", () => {
  const mockWords: WordPair[] = [
    { dutch: "huis", english: "house" },
    { dutch: "boom", english: "tree" },
    { dutch: "auto", english: "car" },
    { dutch: "boek", english: "book" },
    { dutch: "water", english: "water" },
    { dutch: "zon", english: "sun" },
  ];

  const mockVerbs: VerbPair[] = [
    {
      english_infinitive: "to be",
      dutch_infinitive: "zijn",
      imperfectum_single: "was",
      imperfectum_plural: "waren",
      perfectum: "geweest",
    },
    {
      english_infinitive: "to have",
      dutch_infinitive: "hebben",
      imperfectum_single: "had",
      imperfectum_plural: "hadden",
      perfectum: "gehad",
    },
    {
      english_infinitive: "to do",
      dutch_infinitive: "doen",
      imperfectum_single: "deed",
      imperfectum_plural: "deden",
      perfectum: "gedaan",
    },
    {
      english_infinitive: "to go",
      dutch_infinitive: "gaan",
      imperfectum_single: "ging",
      imperfectum_plural: "gingen",
      perfectum: "gegaan",
    },
  ];

  describe("getDistractorWords", () => {
    it("should return the requested number of distractor words", () => {
      const currentWord = mockWords[0];
      const distractors = getDistractorWords(
        mockWords,
        currentWord,
        "nl-en",
        3,
      );

      expect(distractors).toHaveLength(3);
    });

    it("should not include the correct answer in distractors", () => {
      const currentWord = mockWords[0];
      const distractors = getDistractorWords(
        mockWords,
        currentWord,
        "nl-en",
        3,
      );

      expect(distractors).not.toContain("house");
    });

    it("should return unique distractors", () => {
      const currentWord = mockWords[0];
      const distractors = getDistractorWords(
        mockWords,
        currentWord,
        "nl-en",
        3,
      );

      const uniqueDistractors = new Set(distractors);
      expect(uniqueDistractors.size).toBe(distractors.length);
    });

    it("should work with en-nl mode", () => {
      const currentWord = mockWords[0];
      const distractors = getDistractorWords(
        mockWords,
        currentWord,
        "en-nl",
        3,
      );

      expect(distractors).toHaveLength(3);
      expect(distractors).not.toContain("huis");
    });
  });

  describe("getDistractorVerbs", () => {
    it("should return the requested number of distractor verbs", () => {
      const currentVerb = mockVerbs[0];
      const distractors = getDistractorVerbs(
        mockVerbs,
        currentVerb,
        "dutch_infinitive",
        3,
      );

      expect(distractors).toHaveLength(3);
    });

    it("should not include the correct answer in distractors", () => {
      const currentVerb = mockVerbs[0];
      const distractors = getDistractorVerbs(
        mockVerbs,
        currentVerb,
        "dutch_infinitive",
        3,
      );

      expect(distractors).not.toContain("zijn");
    });

    it("should return unique distractors", () => {
      const currentVerb = mockVerbs[0];
      const distractors = getDistractorVerbs(
        mockVerbs,
        currentVerb,
        "perfectum",
        3,
      );

      const uniqueDistractors = new Set(distractors);
      expect(uniqueDistractors.size).toBe(distractors.length);
    });
  });

  describe("generateWordMultipleChoiceOptions", () => {
    it("should return exactly 4 options", () => {
      const currentWord = mockWords[0];
      const options = generateWordMultipleChoiceOptions(
        mockWords,
        currentWord,
        "nl-en",
      );

      expect(options).toHaveLength(4);
    });

    it("should include the correct answer", () => {
      const currentWord = mockWords[0];
      const options = generateWordMultipleChoiceOptions(
        mockWords,
        currentWord,
        "nl-en",
      );

      expect(options).toContain("house");
    });

    it("should return unique options", () => {
      const currentWord = mockWords[0];
      const options = generateWordMultipleChoiceOptions(
        mockWords,
        currentWord,
        "nl-en",
      );

      const uniqueOptions = new Set(options);
      expect(uniqueOptions.size).toBe(4);
    });

    it("should shuffle the options (correct answer not always first)", () => {
      const currentWord = mockWords[0];
      const positions = new Set<number>();

      // Run 10 times to check for shuffling
      for (let i = 0; i < 10; i++) {
        const options = generateWordMultipleChoiceOptions(
          mockWords,
          currentWord,
          "nl-en",
        );
        const correctPosition = options.indexOf("house");
        positions.add(correctPosition);
      }

      // The correct answer should appear in different positions
      // (this test might rarely fail due to randomness, but very unlikely)
      expect(positions.size).toBeGreaterThan(1);
    });
  });

  describe("generateVerbMultipleChoiceOptions", () => {
    it("should return exactly 4 options", () => {
      const currentVerb = mockVerbs[0];
      const options = generateVerbMultipleChoiceOptions(
        mockVerbs,
        currentVerb,
        "dutch_infinitive",
      );

      expect(options).toHaveLength(4);
    });

    it("should include the correct answer", () => {
      const currentVerb = mockVerbs[0];
      const options = generateVerbMultipleChoiceOptions(
        mockVerbs,
        currentVerb,
        "dutch_infinitive",
      );

      expect(options).toContain("zijn");
    });

    it("should return unique options", () => {
      const currentVerb = mockVerbs[0];
      const options = generateVerbMultipleChoiceOptions(
        mockVerbs,
        currentVerb,
        "perfectum",
      );

      const uniqueOptions = new Set(options);
      expect(uniqueOptions.size).toBe(4);
    });

    it("should work with different verb forms", () => {
      const currentVerb = mockVerbs[0];

      const infinitiveOptions = generateVerbMultipleChoiceOptions(
        mockVerbs,
        currentVerb,
        "dutch_infinitive",
      );
      expect(infinitiveOptions).toContain("zijn");

      const imperfectumOptions = generateVerbMultipleChoiceOptions(
        mockVerbs,
        currentVerb,
        "imperfectum_single",
      );
      expect(imperfectumOptions).toContain("was");

      const perfectumOptions = generateVerbMultipleChoiceOptions(
        mockVerbs,
        currentVerb,
        "perfectum",
      );
      expect(perfectumOptions).toContain("geweest");
    });
  });
});
