import type { WordPair, VerbPair, UserProgress, ContentType } from "../types";
import {
  getUpcomingReviews,
  getCardCategoryCounts,
} from "../utils/srsScheduler";

interface SRSDashboardProps {
  words: WordPair[];
  verbs: VerbPair[];
  progress: UserProgress;
  contentType: ContentType;
}

export default function SRSDashboard({
  words,
  verbs,
  progress,
  contentType,
}: SRSDashboardProps) {
  // Get statistics based on current content type
  const currentCards = contentType === "words" ? words : verbs;
  const upcomingReviews = getUpcomingReviews(currentCards);
  const categoryCounts = getCardCategoryCounts(currentCards);

  // Calculate retention rate
  const retentionRate =
    progress.totalAnswers > 0
      ? Math.round((progress.correctAnswers / progress.totalAnswers) * 100)
      : 0;

  // Calculate daily progress percentage
  const dailyProgress =
    progress.cardsReviewedToday > 0
      ? Math.min(
          100,
          Math.round(
            (progress.cardsReviewedToday / upcomingReviews.dueToday) * 100,
          ),
        )
      : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        SRS Statistics
      </h2>

      {/* Daily Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Today's Reviews
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {progress.cardsReviewedToday} / {upcomingReviews.dueToday}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${dailyProgress}%` }}
          />
        </div>
      </div>

      {/* Review Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Due Now
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {upcomingReviews.dueNow}
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Due This Week
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {upcomingReviews.dueThisWeek}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            New Cards Today
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {progress.newCardsToday}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Retention Rate
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {retentionRate}%
          </div>
        </div>
      </div>

      {/* Card Category Breakdown */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
          Card Distribution
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2" />
              New Cards
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {categoryCounts.new}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2" />
              Learning
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {categoryCounts.learning}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2" />
              Young (1-21 days)
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {categoryCounts.young}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2" />
              Mature (21+ days)
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {categoryCounts.mature}
            </span>
          </div>
        </div>
      </div>

      {/* Total Cards */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total {contentType === "words" ? "Words" : "Verbs"}
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {upcomingReviews.totalCards}
          </span>
        </div>
      </div>
    </div>
  );
}
