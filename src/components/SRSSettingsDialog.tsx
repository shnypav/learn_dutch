import { useState } from "react";

interface SRSSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dailyNewCardLimit: number;
  onSave: (config: { dailyNewCardLimit: number }) => void;
}

export default function SRSSettingsDialog({
  isOpen,
  onClose,
  dailyNewCardLimit,
  onSave,
}: SRSSettingsDialogProps) {
  const [newCardLimit, setNewCardLimit] = useState(dailyNewCardLimit);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ dailyNewCardLimit: newCardLimit });
    onClose();
  };

  const handleCancel = () => {
    setNewCardLimit(dailyNewCardLimit); // Reset to original value
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          SRS Settings
        </h2>

        <div className="space-y-6">
          {/* Daily New Card Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily New Cards Limit
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={newCardLimit}
              onChange={(e) =>
                setNewCardLimit(
                  Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
                )
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Maximum number of new cards to introduce per day (1-100)
            </p>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              How SRS Works
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Cards are reviewed based on the SM-2 algorithm</li>
              <li>• Correct answers increase review intervals</li>
              <li>• Incorrect answers reset the learning process</li>
              <li>• Using hints reduces the quality rating</li>
              <li>• Well-learned cards appear less frequently</li>
            </ul>
          </div>

          {/* Advanced Settings Info */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              SM-2 Algorithm Parameters
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>• Starting ease factor: 2.5</li>
              <li>• Minimum ease factor: 1.3</li>
              <li>• Graduating interval: 1 day</li>
              <li>• Second interval: 6 days</li>
              <li>• Quality ratings: 0-5 (based on correctness + hints)</li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600
                     text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50
                     dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg
                     hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
