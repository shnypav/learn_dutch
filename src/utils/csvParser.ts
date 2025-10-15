import Papa from "papaparse";
import type { WordPair, VerbPair } from "../types";

export const loadCSVData = async (csvPath: string): Promise<WordPair[]> => {
  try {
    const response = await fetch(csvPath);
    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
    });

    if (parsed.errors.length > 0) {
      console.error("CSV parsing errors:", parsed.errors);
      throw new Error("Failed to parse CSV data");
    }

    const wordPairs: WordPair[] = parsed.data
      .map((row: any) => {
        const knownValue = row.known?.toString().toLowerCase().trim();
        const isKnown = knownValue === "true" || knownValue === "1";

        return {
          dutch: row.dutch?.trim() || "",
          english: row.english?.trim() || "",
          known: isKnown,
        };
      })
      .filter((pair) => pair.dutch && pair.english);

    // Debug: Log first few words to check parsing
    console.log(
      "First 5 parsed words:",
      wordPairs.slice(0, 5).map((w) => ({
        dutch: w.dutch,
        english: w.english,
        known: w.known,
      })),
    );

    if (wordPairs.length === 0) {
      throw new Error("No valid word pairs found in CSV");
    }

    return wordPairs;
  } catch (error) {
    console.error("Error loading CSV data:", error);
    throw error;
  }
};

export const loadVerbData = async (csvPath: string): Promise<VerbPair[]> => {
  try {
    const response = await fetch(csvPath);
    const csvText = await response.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
    });

    if (parsed.errors.length > 0) {
      console.error("CSV parsing errors:", parsed.errors);
      throw new Error("Failed to parse CSV data");
    }

    const verbPairs: VerbPair[] = parsed.data
      .map((row: any) => ({
        english_infinitive: row.english_infinitive?.trim() || "",
        dutch_infinitive: row.dutch_infinitive?.trim() || "",
        imperfectum_single: row.imperfectum_single?.trim() || "",
        imperfectum_plural: row.imperfectum_plural?.trim() || "",
        perfectum: row.perfectum?.trim() || "",
      }))
      .filter(
        (pair) =>
          pair.english_infinitive &&
          pair.dutch_infinitive &&
          pair.imperfectum_single &&
          pair.imperfectum_plural &&
          pair.perfectum,
      );

    if (verbPairs.length === 0) {
      throw new Error("No valid verb pairs found in CSV");
    }

    return verbPairs;
  } catch (error) {
    console.error("Error loading verb CSV data:", error);
    throw error;
  }
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
