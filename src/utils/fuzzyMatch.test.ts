import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "./fuzzyMatch";

describe("fuzzyMatch", () => {
  it("should return true for exact matches", () => {
    expect(fuzzyMatch("test", "test")).toBe(true);
    expect(fuzzyMatch("hello", "hello")).toBe(true);
  });

  it("should be case insensitive", () => {
    expect(fuzzyMatch("Test", "test")).toBe(true);
    expect(fuzzyMatch("HELLO", "hello")).toBe(true);
    expect(fuzzyMatch("HeLLo", "hElLo")).toBe(true);
  });

  it("should handle whitespace differences", () => {
    expect(fuzzyMatch("  test  ", "test")).toBe(true);
    expect(fuzzyMatch("hello world", "hello  world")).toBe(true);
    expect(fuzzyMatch("test\n", "test")).toBe(true);
  });

  it("should handle punctuation differences", () => {
    expect(fuzzyMatch("don't", "dont")).toBe(true);
    expect(fuzzyMatch("hello!", "hello")).toBe(true);
    expect(fuzzyMatch("test.", "test")).toBe(true);
  });

  it("should handle accented characters", () => {
    expect(fuzzyMatch("café", "cafe")).toBe(true);
    expect(fuzzyMatch("naïve", "naive")).toBe(true);
    expect(fuzzyMatch("résumé", "resume")).toBe(true);
  });

  it("should handle Dutch special characters", () => {
    expect(fuzzyMatch("één", "een")).toBe(true);
    expect(fuzzyMatch("geëerd", "geerd")).toBe(true);
    expect(fuzzyMatch("coördinator", "coordinator")).toBe(true);
  });

  it("should return false for different words", () => {
    expect(fuzzyMatch("test", "best")).toBe(false);
    expect(fuzzyMatch("hello", "goodbye")).toBe(false);
    expect(fuzzyMatch("cat", "dog")).toBe(false);
  });

  it("should handle empty strings", () => {
    expect(fuzzyMatch("", "")).toBe(true);
    expect(fuzzyMatch("test", "")).toBe(false);
    expect(fuzzyMatch("", "test")).toBe(false);
  });

  it("should handle null and undefined gracefully", () => {
    expect(fuzzyMatch(null as any, "test")).toBe(false);
    expect(fuzzyMatch("test", null as any)).toBe(false);
    expect(fuzzyMatch(undefined as any, "test")).toBe(false);
    expect(fuzzyMatch("test", undefined as any)).toBe(false);
  });
});
