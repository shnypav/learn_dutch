import { describe, it, expect } from "vitest";
import {
  generateHint,
  isValidHintLevel,
  getNextHintLevel,
  getInitialHintLevel,
} from "./hintGenerator";

describe("generateHint", () => {
  describe("normal cases", () => {
    it("should generate correct hints for a 5-letter word", () => {
      const answer = "hello";

      expect(generateHint(answer, 1)).toBe("h");
      expect(generateHint(answer, 2)).toBe("h****");
      expect(generateHint(answer, 3)).toBe("h***o");
      expect(generateHint(answer, 4)).toBe("hello");
    });

    it("should generate correct hints for a 3-letter word", () => {
      const answer = "cat";

      expect(generateHint(answer, 1)).toBe("c");
      expect(generateHint(answer, 2)).toBe("c**");
      expect(generateHint(answer, 3)).toBe("c*t");
      expect(generateHint(answer, 4)).toBe("cat");
    });

    it("should generate correct hints for a longer word", () => {
      const answer = "beautiful";

      expect(generateHint(answer, 1)).toBe("b");
      expect(generateHint(answer, 2)).toBe("b********");
      expect(generateHint(answer, 3)).toBe("b*******l");
      expect(generateHint(answer, 4)).toBe("beautiful");
    });
  });

  describe("edge cases - single character", () => {
    it("should show complete answer for single character at all levels", () => {
      const answer = "a";

      expect(generateHint(answer, 1)).toBe("a");
      expect(generateHint(answer, 2)).toBe("a");
      expect(generateHint(answer, 3)).toBe("a");
      expect(generateHint(answer, 4)).toBe("a");
    });
  });

  describe("edge cases - two characters", () => {
    it("should handle two character answers correctly", () => {
      const answer = "is";

      expect(generateHint(answer, 1)).toBe("i");
      expect(generateHint(answer, 2)).toBe("i*");
      expect(generateHint(answer, 3)).toBe("is");
      expect(generateHint(answer, 4)).toBe("is");
    });
  });

  describe("edge cases - spaces and special characters", () => {
    it("should preserve spaces in hint patterns", () => {
      const answer = "hello world";

      expect(generateHint(answer, 1)).toBe("h");
      expect(generateHint(answer, 2)).toBe("h**** *****");
      expect(generateHint(answer, 3)).toBe("h**** ****d");
      expect(generateHint(answer, 4)).toBe("hello world");
    });

    it("should preserve special characters in hint patterns", () => {
      const answer = "don't";

      expect(generateHint(answer, 1)).toBe("d");
      expect(generateHint(answer, 2)).toBe("d**'*");
      expect(generateHint(answer, 3)).toBe("d**'t");
      expect(generateHint(answer, 4)).toBe("don't");
    });

    it("should handle mixed spaces and special characters", () => {
      const answer = "twenty-one";

      expect(generateHint(answer, 1)).toBe("t");
      expect(generateHint(answer, 2)).toBe("t*****-***");
      expect(generateHint(answer, 3)).toBe("t*****-**e");
      expect(generateHint(answer, 4)).toBe("twenty-one");
    });

    it("should handle numbers in answers", () => {
      const answer = "test123";

      expect(generateHint(answer, 1)).toBe("t");
      expect(generateHint(answer, 2)).toBe("t***123");
      expect(generateHint(answer, 3)).toBe("t***123");
      expect(generateHint(answer, 4)).toBe("test123");
    });
  });

  describe("edge cases - empty and null inputs", () => {
    it("should handle empty string", () => {
      expect(generateHint("", 1)).toBe("");
      expect(generateHint("", 2)).toBe("");
      expect(generateHint("", 3)).toBe("");
      expect(generateHint("", 4)).toBe("");
    });

    it("should handle whitespace-only string", () => {
      expect(generateHint("   ", 1)).toBe("");
      expect(generateHint("   ", 2)).toBe("");
      expect(generateHint("   ", 3)).toBe("");
      expect(generateHint("   ", 4)).toBe("");
    });
  });

  describe("edge cases - whitespace handling", () => {
    it("should trim leading and trailing whitespace", () => {
      const answer = "  hello  ";

      expect(generateHint(answer, 1)).toBe("h");
      expect(generateHint(answer, 2)).toBe("h****");
      expect(generateHint(answer, 3)).toBe("h***o");
      expect(generateHint(answer, 4)).toBe("hello");
    });
  });

  describe("case sensitivity", () => {
    it("should preserve case in hints", () => {
      const answer = "Hello";

      expect(generateHint(answer, 1)).toBe("H");
      expect(generateHint(answer, 2)).toBe("H****");
      expect(generateHint(answer, 3)).toBe("H***o");
      expect(generateHint(answer, 4)).toBe("Hello");
    });

    it("should handle mixed case correctly", () => {
      const answer = "iPhone";

      expect(generateHint(answer, 1)).toBe("i");
      expect(generateHint(answer, 2)).toBe("i*****");
      expect(generateHint(answer, 3)).toBe("i****e");
      expect(generateHint(answer, 4)).toBe("iPhone");
    });
  });
});

describe("isValidHintLevel", () => {
  it("should return true for valid hint levels", () => {
    expect(isValidHintLevel(1)).toBe(true);
    expect(isValidHintLevel(2)).toBe(true);
    expect(isValidHintLevel(3)).toBe(true);
    expect(isValidHintLevel(4)).toBe(true);
  });

  it("should return false for invalid hint levels", () => {
    expect(isValidHintLevel(0)).toBe(false);
    expect(isValidHintLevel(5)).toBe(false);
    expect(isValidHintLevel(-1)).toBe(false);
    expect(isValidHintLevel(1.5)).toBe(false);
    expect(isValidHintLevel(NaN)).toBe(false);
    expect(isValidHintLevel(Infinity)).toBe(false);
  });
});

describe("getNextHintLevel", () => {
  it("should increment hint level correctly", () => {
    expect(getNextHintLevel(1)).toBe(2);
    expect(getNextHintLevel(2)).toBe(3);
    expect(getNextHintLevel(3)).toBe(4);
  });

  it("should not exceed maximum hint level", () => {
    expect(getNextHintLevel(4)).toBe(4);
  });
});

describe("getInitialHintLevel", () => {
  it("should return initial hint level", () => {
    expect(getInitialHintLevel()).toBe(1);
  });
});
