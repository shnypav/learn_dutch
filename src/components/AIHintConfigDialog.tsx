import { useState } from "react";
import { useAIHint } from "../contexts/AIHintContext";

const AIHintConfigDialog: React.FC = () => {
  const {
    showConfigDialog,
    setShowConfigDialog,
    setApiKey,
    isConfigured,
    clearApiKey,
  } = useAIHint();
  const [inputValue, setInputValue] = useState("");

  if (!showConfigDialog) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setApiKey(inputValue.trim());
      setInputValue("");
    }
  };

  const handleClose = () => {
    setShowConfigDialog(false);
    setInputValue("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white border-opacity-20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              AI Hint Configuration
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>

          <div className="text-sm text-gray-300 space-y-2">
            <p>
              Enter your Perplexity API key to enable AI-generated example
              sentences.
            </p>
            <p className="text-xs text-blue-300">
              Get your API key from{" "}
              <a
                href="https://www.perplexity.ai/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-400"
              >
                perplexity.ai/settings/api
              </a>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="api-key"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                API Key
              </label>
              <input
                id="api-key"
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="pplx-..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Save API Key
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {isConfigured && (
            <div className="border-t border-gray-600 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-400">
                  ✓ API key configured
                </span>
                <button
                  onClick={clearApiKey}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear Key
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIHintConfigDialog;
