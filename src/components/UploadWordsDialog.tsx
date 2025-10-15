import { useState } from "react";
import type { WordPair } from "../types";

interface UploadWordsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (words: WordPair[]) => Promise<void>;
}

const UploadWordsDialog: React.FC<UploadWordsDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [wordsText, setWordsText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const parseWords = (text: string): WordPair[] => {
    const lines = text.trim().split("\n");
    const words: WordPair[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      const separators = [",", " - ", " -> ", " | ", ": "];
      let parts: string[] = [];

      for (const separator of separators) {
        if (trimmedLine.includes(separator)) {
          parts = trimmedLine.split(separator);
          break;
        }
      }

      if (parts.length === 0) {
        parts = trimmedLine.split(" ");
        if (parts.length !== 2) {
          errors.push(`Line ${index + 1}: Invalid format`);
          return;
        }
      }

      if (parts.length !== 2) {
        errors.push(`Line ${index + 1}: Invalid format`);
        return;
      }

      const dutch = parts[0].trim();
      const english = parts[1].trim();

      if (!dutch || !english) {
        errors.push(`Line ${index + 1}: Empty word or translation`);
        return;
      }

      words.push({ dutch, english, known: false });
    });

    if (errors.length > 0) {
      setError(errors.join("\n"));
      return [];
    }

    return words;
  };

  const handleUpload = async () => {
    setError("");
    if (!wordsText.trim()) {
      setError("Please enter some word pairs.");
      return;
    }

    const parsed = parseWords(wordsText);
    if (parsed.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(parsed);
      setWordsText("");
      setError("");
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setWordsText("");
    setError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
      }}
      onClick={handleClose}
    >
      <div
        className="card-bg rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-white border-opacity-20 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white border-opacity-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-primary">
              Upload New Words
            </h2>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="text-secondary hover:text-primary transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-secondary text-sm mt-2">
            Add custom vocabulary to your learning collection
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Format Info */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <p className="text-sm text-secondary mb-2 font-medium">
              Supported formats (one per line):
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="text-primary">huis,house</div>
              <div className="text-primary">huis - house</div>
              <div className="text-primary">huis → house</div>
              <div className="text-primary">huis | house</div>
              <div className="text-primary">huis: house</div>
              <div className="text-primary">huis house</div>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Enter Word Pairs
            </label>
            <textarea
              value={wordsText}
              onChange={(e) => setWordsText(e.target.value)}
              placeholder={`huis,house
auto,car
boek,book
water,water
fiets,bicycle`}
              className="input-field w-full h-64 p-4 rounded-xl resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30"
              disabled={isUploading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 text-red-200 px-4 py-3 rounded-lg text-sm whitespace-pre-line">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white border-opacity-10 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-5 py-2.5 text-secondary hover:text-primary transition-colors rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !wordsText.trim()}
            className="btn-primary px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 font-medium flex items-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <span>Upload Words</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadWordsDialog;
