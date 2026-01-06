import type { SentenceTypoDetail } from "../utils/sentenceManager";

interface SentenceTypoNoticeProps {
  typos: SentenceTypoDetail[];
  userWords: string[];
  correctWords: string[];
}

const SentenceTypoNotice: React.FC<SentenceTypoNoticeProps> = ({
  typos,
  userWords,
  correctWords,
}) => {
  const typoMap = new Map(typos.map((typo) => [typo.index, typo]));
  const maxLength = Math.max(userWords.length, correctWords.length);
  const normalizedUserWords = Array.from(
    { length: maxLength },
    (_, idx) => userWords[idx] ?? "—"
  );
  const normalizedCorrectWords = Array.from(
    { length: maxLength },
    (_, idx) => correctWords[idx] ?? "—"
  );

  const renderRow = (words: string[], highlightUser: boolean) => (
    <div className="flex flex-wrap gap-2 justify-center">
      {words.map((word, idx) => {
        const typo = typoMap.get(idx);
        const shouldHighlight = Boolean(typo);
        const displayWord =
          highlightUser && typo ? typo.received : !highlightUser && typo ? typo.expected : word;

        return (
          <span
            key={`${highlightUser ? "user" : "correct"}-${idx}-${word}`}
            className={`px-2 py-1 rounded-lg border text-sm ${
              shouldHighlight
                ? "bg-amber-400 text-black border-amber-500 font-semibold"
                : "bg-white/10 text-white border-white/20"
            }`}
            title={
              typo
                ? `Expected "${typo.expected}", got "${typo.received}"`
                : undefined
            }
          >
            {displayWord}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="card-bg rounded-xl p-4 border-2 border-amber-400/60 text-center animate-fade-in">
      <div className="text-amber-300 font-semibold mb-1">
        Accepted with a small typo
      </div>
      <p className="text-sm text-secondary-light mb-3">
        We counted it as correct, but check the highlighted words.
      </p>
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-secondary-light">
          Your answer
        </div>
        {renderRow(normalizedUserWords, true)}
        <div className="text-xs uppercase tracking-wide text-secondary-light">
          Expected
        </div>
        {renderRow(normalizedCorrectWords, false)}
      </div>
    </div>
  );
};

export default SentenceTypoNotice;
