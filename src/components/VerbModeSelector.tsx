import type { VerbMode } from "../types";

interface VerbModeSelectorProps {
  verbMode: VerbMode;
  onVerbModeChange: (mode: VerbMode) => void;
  disabled?: boolean;
}

const VerbModeSelector: React.FC<VerbModeSelectorProps> = ({
  verbMode,
  onVerbModeChange,
  disabled = false,
}) => {
  const modes = [
    {
      value: "random" as VerbMode,
      label: "Random",
      description: "Practice all forms randomly",
    },
    {
      value: "infinitive" as VerbMode,
      label: "Infinitive",
      description: "Practice infinitive forms",
    },
    {
      value: "imperfectum" as VerbMode,
      label: "Imperfectum",
      description: "Practice past tense forms",
    },
    {
      value: "perfectum" as VerbMode,
      label: "Perfectum",
      description: "Practice perfect forms",
    },
  ];

  return (
    <div className="flex flex-col space-y-4">
      <div className="card-bg rounded-xl p-2 grid grid-cols-2 gap-2 w-full">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => !disabled && onVerbModeChange(mode.value)}
            disabled={disabled}
            className={`
              px-3 py-2 rounded-lg font-medium text-xs transition-all duration-300
              border-2 flex-1
              ${
                verbMode === mode.value
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-xl border-purple-400 transform scale-105"
                  : "text-primary btn-primary border-transparent hover:border-white hover:border-opacity-30"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-102"}
            `}
            title={mode.description}
          >
            <div className="flex flex-col items-center space-y-4">
              <span className="text-sm font-bold">{mode.label}</span>
              <span
                className={`text-xs font-semibold ${verbMode === mode.value ? "text-purple-100" : "opacity-70"}`}
              >
                {mode.value === "random"
                  ? "All"
                  : mode.value === "infinitive"
                    ? "Base"
                    : mode.value === "imperfectum"
                      ? "Past"
                      : "Perfect"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VerbModeSelector;
