import type { SessionStats } from "../types";

interface ProgressIndicatorProps {
  sessionStats: SessionStats;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  sessionStats,
  className = "",
}) => {
  const { correct, total, accuracy, streak } = sessionStats;

  const getStreakIcon = (): string => {
    if (streak === 0) return "🎯";
    if (streak < 3) return "🔥";
    if (streak < 5) return "🚀";
    if (streak < 10) return "⭐";
    return "👑";
  };

  const getAccuracyColor = (): string => {
    if (accuracy >= 80) return "text-green-400";
    if (accuracy >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div
      className={`bg-gray-900 bg-opacity-80 rounded-xl p-2 border border-gray-600 shadow-lg ${className}`}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
          Session Progress
        </h3>
        <div className="text-lg">{getStreakIcon()}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        {/* Score */}
        <div className="bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-gray-600">
          <div className="text-2xl font-bold text-white mb-4">
            {correct}/{total}
          </div>
          <div className="text-xs text-gray-300 uppercase tracking-wide">
            Correct
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-gray-600">
          <div className={`text-2xl font-bold mb-4 ${getAccuracyColor()}`}>
            {accuracy}%
          </div>
          <div className="text-xs text-gray-300 uppercase tracking-wide">
            Accuracy
          </div>
        </div>
      </div>

      {/* Streak */}
      <div className="mt-2 text-center">
        <div className="bg-gray-800 bg-opacity-60 rounded-lg p-3 border border-gray-600">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-xl">{getStreakIcon()}</span>
            <span className="text-xl font-bold text-white">{streak}</span>
          </div>
          <div className="text-xs text-gray-300 uppercase tracking-wide">
            Current Streak
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-300 mb-4">
            <span>Progress</span>
            <span>{total} answers</span>
          </div>
          <div className="bg-gray-700 rounded-full h-2 border border-gray-600">
            <div
              className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(correct / Math.max(total, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;
