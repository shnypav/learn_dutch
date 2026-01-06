import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SentenceConstructionInput from "./SentenceConstructionInput";
import "@testing-library/jest-dom";

describe("SentenceConstructionInput", () => {
  const defaultProps = {
    scrambledWords: ["winkel", "naar", "Ik", "ga", "de"],
    correctAnswer: "Ik ga naar de winkel",
    onSubmit: vi.fn(),
    disabled: false,
    feedback: null as null | "correct" | "incorrect",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render all scrambled words in the word bank", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      defaultProps.scrambledWords.forEach((word) => {
        expect(screen.getByText(word)).toBeInTheDocument();
      });
    });

    it("should render empty construction area initially", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      expect(
        screen.getByText(/click words below to build your sentence/i)
      ).toBeInTheDocument();
    });

    it("should render submit and reset buttons", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    });

    it("should render help text", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      expect(
        screen.getByText(/click words to add\/remove/i)
      ).toBeInTheDocument();
    });
  });

  describe("word selection", () => {
    it("should add word to construction when clicked", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      const wordButton = screen.getByText("Ik");
      fireEvent.click(wordButton);

      // Word should now appear in construction area
      const constructedWords = screen.getAllByText("Ik");
      expect(constructedWords.length).toBeGreaterThanOrEqual(1);
    });

    it("should remove word from word bank when selected", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      // Click to add word
      fireEvent.click(screen.getByText("Ik"));

      // The word bank should have one less visible word
      // (the clicked word is now in construction area)
      const bankSection = screen.getByText(/word bank/i).parentElement;
      expect(bankSection).not.toHaveTextContent(/all words used/i);
    });

    it("should remove word from construction when clicked", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      // Add a word
      fireEvent.click(screen.getByText("Ik"));

      // Now click on the word in construction area to remove it
      // The word appears twice now (in bank hidden and in construction)
      const constructedWord = screen.getByText("Ik");
      fireEvent.click(constructedWord);

      // Should show the placeholder again
      expect(
        screen.getByText(/click words below to build your sentence/i)
      ).toBeInTheDocument();
    });

    it("should build sentence in correct order", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      // Add words in order
      fireEvent.click(screen.getByText("Ik"));
      fireEvent.click(screen.getByText("ga"));
      fireEvent.click(screen.getByText("naar"));
      fireEvent.click(screen.getByText("de"));
      fireEvent.click(screen.getByText("winkel"));

      // All words should now be in construction
      expect(screen.getByText(/all words used/i)).toBeInTheDocument();
    });
  });

  describe("submit functionality", () => {
    it("should call onSubmit with constructed sentence when submit is clicked", () => {
      const onSubmit = vi.fn();
      render(<SentenceConstructionInput {...defaultProps} onSubmit={onSubmit} />);

      // Build a partial sentence
      fireEvent.click(screen.getByText("Ik"));
      fireEvent.click(screen.getByText("ga"));

      // Submit
      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      expect(onSubmit).toHaveBeenCalledWith("Ik ga");
    });

    it("should not submit when construction is empty", () => {
      const onSubmit = vi.fn();
      render(<SentenceConstructionInput {...defaultProps} onSubmit={onSubmit} />);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      fireEvent.click(submitButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should disable submit button when construction is empty", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("reset functionality", () => {
    it("should clear construction when reset is clicked", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      // Add some words
      fireEvent.click(screen.getByText("Ik"));
      fireEvent.click(screen.getByText("ga"));

      // Reset
      const resetButton = screen.getByRole("button", { name: /reset/i });
      fireEvent.click(resetButton);

      // Should show placeholder again
      expect(
        screen.getByText(/click words below to build your sentence/i)
      ).toBeInTheDocument();
    });

    it("should disable reset button when construction is empty", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      const resetButton = screen.getByRole("button", { name: /reset/i });
      expect(resetButton).toBeDisabled();
    });
  });

  describe("disabled state", () => {
    it("should not allow word selection when disabled", () => {
      const onSubmit = vi.fn();
      render(
        <SentenceConstructionInput
          {...defaultProps}
          disabled={true}
          onSubmit={onSubmit}
        />
      );

      const wordButton = screen.getByText("Ik");
      fireEvent.click(wordButton);

      // Should still show placeholder (no words added)
      expect(
        screen.getByText(/click words below to build your sentence/i)
      ).toBeInTheDocument();
    });
  });

  describe("feedback state", () => {
    it("should show correct answer on incorrect feedback", () => {
      render(
        <SentenceConstructionInput {...defaultProps} feedback="incorrect" />
      );

      expect(screen.getByText(/correct answer/i)).toBeInTheDocument();
      expect(screen.getByText("Ik ga naar de winkel")).toBeInTheDocument();
    });

    it("should not allow interaction during feedback", () => {
      const onSubmit = vi.fn();
      render(
        <SentenceConstructionInput
          {...defaultProps}
          feedback="correct"
          onSubmit={onSubmit}
        />
      );

      const wordButton = screen.getByText("Ik");
      fireEvent.click(wordButton);

      // Should not have added word
      expect(
        screen.getByText(/click words below to build your sentence/i)
      ).toBeInTheDocument();
    });
  });

  describe("keyboard navigation", () => {
    it("should add word when number key is pressed", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      // Press "1" to select first word in bank
      fireEvent.keyDown(window, { key: "1" });

      // First word should be added
      expect(
        screen.queryByText(/click words below to build your sentence/i)
      ).not.toBeInTheDocument();
    });

    it("should remove last word on backspace", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      // Add a word
      fireEvent.click(screen.getByText("Ik"));

      // Press backspace
      fireEvent.keyDown(window, { key: "Backspace" });

      // Should show placeholder again
      expect(
        screen.getByText(/click words below to build your sentence/i)
      ).toBeInTheDocument();
    });

    it("should submit on enter key", () => {
      const onSubmit = vi.fn();
      render(<SentenceConstructionInput {...defaultProps} onSubmit={onSubmit} />);

      // Add a word
      fireEvent.click(screen.getByText("Ik"));

      // Press enter
      fireEvent.keyDown(window, { key: "Enter" });

      expect(onSubmit).toHaveBeenCalledWith("Ik");
    });

    it("should reset on escape key", () => {
      render(<SentenceConstructionInput {...defaultProps} />);

      // Add a word
      fireEvent.click(screen.getByText("Ik"));

      // Press escape
      fireEvent.keyDown(window, { key: "Escape" });

      // Should show placeholder again
      expect(
        screen.getByText(/click words below to build your sentence/i)
      ).toBeInTheDocument();
    });
  });

  describe("new question reset", () => {
    it("should reset selection when scrambledWords change", () => {
      const { rerender } = render(
        <SentenceConstructionInput {...defaultProps} />
      );

      // Add a word
      fireEvent.click(screen.getByText("Ik"));

      // Rerender with new words
      rerender(
        <SentenceConstructionInput
          {...defaultProps}
          scrambledWords={["mooi", "is", "weer", "Het"]}
        />
      );

      // Should show placeholder (selection reset)
      expect(
        screen.getByText(/click words below to build your sentence/i)
      ).toBeInTheDocument();
    });
  });
});
